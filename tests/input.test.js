import test from "node:test";
import assert from "node:assert/strict";
import {
  project,
  unproject,
  constrainView,
  zoomAt,
  hitTest,
} from "../src/view.js";
import { createLattice } from "../src/lattice.js";
import { createGestures } from "../src/gestures.js";
import { createRenderLoop } from "../src/loop.js";
const initial = {
  cx: 0,
  cy: 0,
  zoom: 1,
  tilt: 0,
  width: 400,
  height: 600,
  insetBottom: 86,
};
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
function setup() {
  let view = { ...initial };
  const selected = [];
  let canceled = 0;
  const gestures = createGestures({
    getView: () => view,
    setView: (next) => {
      view = next;
    },
    pick: (point) => hitTest(point, createLattice(), view),
    select: (id) => selected.push(id),
    cancelAnimation: () => canceled++,
  });
  return {
    gestures,
    selected,
    get view() {
      return view;
    },
    get canceled() {
      return canceled;
    },
  };
}

test("projection and inverse agree with tilt and mobile bottom inset", () => {
  for (const tilt of [0, 0.45]) {
    const view = { ...initial, cx: 43, cy: -87, zoom: 0.85, tilt };
    const world = { x: 123, y: 78 },
      back = unproject(project(world, view), view);
    near(back.x, world.x);
    near(back.y, world.y);
  }
});
test("zoom anchors the point under the pointer and constrains map bounds", () => {
  const point = { x: 124, y: 187 },
    view = { ...initial, tilt: 0.45 },
    before = unproject(point, view),
    after = unproject(point, zoomAt(view, point, 1.6));
  near(before.x, after.x);
  near(before.y, after.y);
  assert.equal(constrainView({ ...initial, zoom: 8, tilt: 9 }).zoom, 1.7);
  assert.equal(constrainView({ ...initial, zoom: 0.1 }).zoom, 0.55);
  assert.ok(
    Math.hypot(
      constrainView({ ...initial, cx: 1e6, cy: 1e6 }).cx,
      constrainView({ ...initial, cx: 1e6, cy: 1e6 }).cy,
    ) < 1000,
  );
});
test("direct hit testing works without a hover event", () => {
  assert.equal(
    hitTest(project({ x: 0, y: 0 }, initial), createLattice(), initial),
    "0:0",
  );
  assert.equal(hitTest({ x: -10000, y: 0 }, createLattice(), initial), null);
});
test("tap selects on pointer-up and cancels camera animation immediately", () => {
  const s = setup(),
    p = project({ x: 0, y: 0 }, s.view);
  s.gestures.down(1, p);
  s.gestures.up(1, p);
  assert.deepEqual(s.selected, ["0:0"]);
  assert.equal(s.canceled, 1);
  assert.equal(s.gestures.active, false);
});
test("drag pans and never selects; a distant pointer-up is not a tap", () => {
  const s = setup(),
    p = { x: 200, y: 257 };
  s.gestures.down(1, p);
  s.gestures.move(1, { x: 250, y: 277 });
  near(s.view.cx, -50);
  near(s.view.cy, 20);
  s.gestures.up(1, { x: 250, y: 277 });
  assert.deepEqual(s.selected, []);
  s.gestures.down(2, p);
  s.gestures.up(2, { x: 280, y: 257 });
  assert.deepEqual(s.selected, []);
});
test("pinch preserves the initial midpoint anchor and cannot become a tap after one finger lifts", () => {
  const s = setup();
  s.gestures.down(1, { x: 150, y: 257 });
  s.gestures.down(2, { x: 250, y: 257 });
  s.gestures.move(2, { x: 300, y: 257 });
  near(s.view.zoom, 1.5);
  const world = unproject({ x: 225, y: 257 }, s.view);
  near(world.x, 0);
  near(world.y, 0);
  s.gestures.up(2, { x: 300, y: 257 });
  assert.equal(s.gestures.has(2), false);
  assert.equal(s.gestures.has(1), true);
  s.gestures.up(1, { x: 150, y: 257 });
  assert.deepEqual(s.selected, []);
});
test("canceled gestures cannot toggle a note", () => {
  const s = setup();
  s.gestures.down(1, { x: 200, y: 257 });
  s.gestures.cancel();
  s.gestures.up(1, { x: 200, y: 257 });
  assert.deepEqual(s.selected, []);
  assert.equal(s.gestures.active, false);
});
test("render loop coalesces updates, settles, suspends, and disposes", () => {
  let nextId = 0,
    draws = 0,
    animate = true;
  const callbacks = new Map();
  const loop = createRenderLoop(
    () => {
      draws++;
      return animate;
    },
    {
      request: (callback) => {
        callbacks.set(++nextId, callback);
        return nextId;
      },
      cancel: (id) => callbacks.delete(id),
    },
  );
  const flush = () => {
    const [id, callback] = callbacks.entries().next().value;
    callbacks.delete(id);
    callback(100);
  };
  loop.invalidate();
  loop.invalidate();
  assert.equal(callbacks.size, 1);
  flush();
  assert.equal(draws, 1);
  assert.equal(callbacks.size, 1);
  animate = false;
  flush();
  assert.equal(callbacks.size, 0);
  loop.invalidate();
  loop.setEnabled(false);
  assert.equal(callbacks.size, 0);
  loop.invalidate();
  assert.equal(callbacks.size, 0);
  loop.setEnabled(true);
  assert.equal(callbacks.size, 1);
  loop.dispose();
  assert.equal(callbacks.size, 0);
  loop.invalidate();
  assert.equal(callbacks.size, 0);
});
