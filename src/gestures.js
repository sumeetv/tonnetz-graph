import { constrainView, screenOrigin, unproject, zoomAt } from "./view.js";

/** Pointer gestures operate on coordinates, independent of hover and rendering. */
export function createGestures({
  getView,
  setView,
  pick,
  select,
  cancelAnimation,
}) {
  const pointers = new Map();
  let origin = null,
    pinch = null,
    dragged = false;
  function beginSingle(point) {
    origin = { point: { ...point }, view: { ...getView() } };
  }
  return {
    down(id, point) {
      cancelAnimation();
      pointers.set(id, point);
      if (pointers.size === 1) {
        dragged = false;
        beginSingle(point);
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        pinch = {
          distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
          view: { ...getView() },
          anchor: unproject(midpoint, getView()),
        };
        dragged = true;
      }
    },
    move(id, point) {
      if (!pointers.has(id)) return false;
      pointers.set(id, point);
      if (pointers.size >= 2 && pinch) {
        const [a, b] = [...pointers.values()],
          midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        let view = zoomAt(
          pinch.view,
          screenOrigin(pinch.view),
          (pinch.view.zoom * distance) / pinch.distance,
        );
        const center = screenOrigin(view);
        view = constrainView({
          ...view,
          cx: pinch.anchor.x - (midpoint.x - center.x) / view.zoom,
          cy:
            pinch.anchor.y +
            (midpoint.y - center.y) / (view.zoom * Math.cos(view.tilt)),
        });
        setView(view);
      } else if (origin) {
        const dx = point.x - origin.point.x,
          dy = point.y - origin.point.y;
        if (Math.hypot(dx, dy) > 5) dragged = true;
        if (dragged)
          setView(
            constrainView({
              ...origin.view,
              cx: origin.view.cx - dx / origin.view.zoom,
              cy:
                origin.view.cy +
                dy / (origin.view.zoom * Math.cos(origin.view.tilt)),
            }),
          );
      }
      return true;
    },
    up(id, point) {
      if (!pointers.has(id)) return;
      const canSelect =
        pointers.size === 1 &&
        !dragged &&
        origin &&
        Math.hypot(point.x - origin.point.x, point.y - origin.point.y) <= 5;
      pointers.delete(id);
      if (canSelect) {
        const hit = pick(point);
        if (hit) select(hit);
      }
      if (pointers.size === 1) {
        beginSingle([...pointers.values()][0]);
        pinch = null;
      }
      if (!pointers.size) {
        origin = null;
        pinch = null;
        dragged = false;
      }
    },
    cancel() {
      pointers.clear();
      origin = null;
      pinch = null;
      dragged = false;
    },
    has(id) {
      return pointers.has(id);
    },
    get active() {
      return pointers.size > 0;
    },
  };
}
