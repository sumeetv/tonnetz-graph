import test from "node:test";
import assert from "node:assert/strict";
import {
  createLattice,
  connectedGroups,
  selectedTriangles,
  SPACING,
} from "../src/lattice.js";
import { findChords, modulo } from "../src/music.js";
import { createSelection, selectionReducer } from "../src/selection.js";
const lattice = createLattice();

test("bounded hex lattice gives consistent intervals in all three positive directions", () => {
  assert.equal(lattice.nodes.length, 331);
  const edges = new Set();
  for (const edge of lattice.edges) {
    const a = lattice.byId.get(edge.from),
      b = lattice.byId.get(edge.to);
    assert.equal(modulo(b.pitch - a.pitch), edge.semitones);
    assert.ok(Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - SPACING) < 1e-9);
    const key = [a.id, b.id].sort().join("/");
    assert.ok(!edges.has(key));
    edges.add(key);
    assert.ok(lattice.adjacency.get(a.id).has(b.id));
    assert.ok(lattice.adjacency.get(b.id).has(a.id));
  }
  assert.deepEqual(
    ["0:0", "1:0", "0:1", "1:-1"].map((id) => lattice.byId.get(id).pitch),
    [0, 7, 3, 4],
  );
});
test("every generated triangle is an adjacent major or minor triad", () => {
  assert.ok(lattice.triangles.length > 500);
  for (const tri of lattice.triangles) {
    for (const a of tri.ids)
      for (const b of tri.ids)
        if (a !== b) assert.ok(lattice.adjacency.get(a).has(b));
    const intervals = tri.ids
      .map((id) => modulo(lattice.byId.get(id).pitch - tri.root))
      .sort((a, b) => a - b);
    assert.deepEqual(
      intervals,
      tri.quality === "major" ? [0, 4, 7] : [0, 3, 7],
    );
  }
  assert.deepEqual(
    selectedTriangles(new Set(["0:0", "1:0", "1:-1"]), lattice).map(
      (t) => t.quality,
    ),
    ["major"],
  );
});
test("groups follow physical adjacency and retain repeated pitch positions", () => {
  const repeated = lattice.nodes.find(
    (n) => n.pitch === 0 && Math.abs(n.q) > 3,
  );
  const groups = connectedGroups(
    new Set(["0:0", "1:0", repeated.id, "invalid"]),
    lattice,
  );
  assert.equal(groups.length, 2);
  assert.equal(groups.flat().length, 3);
});
test("matching collapses octaves and returns all ambiguous roots", () => {
  assert.deepEqual(
    findChords([0, 4, 7, 12]).map((m) => m.name),
    ["C major"],
  );
  assert.deepEqual(
    findChords([0, 4, 7, 9]).map((m) => m.name),
    ["C 6", "A m7"],
  );
  assert.equal(findChords([0, 4, 8]).filter((m) => m.type === "aug").length, 3);
  assert.equal(
    findChords([0, 3, 6, 9]).filter((m) => m.type === "dim7").length,
    4,
  );
  assert.deepEqual(findChords([]), []);
});
test("altered ninth and thirteenth definitions contain the required chord tones", () => {
  assert.ok(
    findChords([0, 2, 4, 8, 10]).some((m) => m.root === 0 && m.type === "9#5"),
  );
  assert.ok(
    !findChords([0, 2, 4, 8]).some((m) => m.root === 0 && m.type === "9#5"),
  );
  assert.ok(
    findChords([0, 2, 4, 7, 9, 10]).some(
      (m) => m.root === 0 && m.type === "13",
    ),
  );
});
test("selection is immutable and clear, pitch removal, and undo preserve physical positions", () => {
  const initial = createSelection(),
    repeated = lattice.nodes.find((n) => n.pitch === 0 && n.id !== "0:0");
  let state = selectionReducer(
    initial,
    { type: "preset", ids: ["0:0", repeated.id, "invalid"] },
    lattice,
  );
  assert.equal(initial.selected.size, 0);
  assert.equal(state.selected.size, 2);
  const removed = selectionReducer(
    state,
    { type: "remove-pitch", pitch: 0 },
    lattice,
  );
  assert.equal(removed.selected.size, 0);
  state = selectionReducer(removed, { type: "undo" }, lattice);
  assert.equal(state.selected.size, 2);
  state = selectionReducer(state, { type: "clear" }, lattice);
  assert.equal(state.selected.size, 0);
  assert.equal(
    selectionReducer(state, { type: "undo" }, lattice).selected.size,
    2,
  );
  assert.equal(selectionReducer(initial, { type: "undo" }, lattice), initial);
  assert.equal(
    selectionReducer(initial, { type: "toggle", id: "invalid" }, lattice),
    initial,
  );
});
test("undo history stays bounded and equal selections do not create history", () => {
  let state = createSelection();
  for (let i = 0; i < 80; i++)
    state = selectionReducer(state, { type: "toggle", id: "0:0" }, lattice);
  assert.equal(state.history.length, 50);
  assert.equal(selectionReducer(state, { type: "clear" }, lattice), state);
});
