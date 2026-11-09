import { GRID_RADIUS, ROW_HEIGHT, SPACING, worldPosition } from "./lattice.js";

export const MIN_ZOOM = 0.55;
export const MAX_ZOOM = 1.7;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const screenOrigin = (view) => ({
  x: view.width / 2,
  y: (view.height - view.insetBottom) / 2,
});

export function project(node, view, lift = 0) {
  const origin = screenOrigin(view);
  return {
    x: origin.x + (node.x - view.cx) * view.zoom,
    y:
      origin.y -
      ((node.y - view.cy) * Math.cos(view.tilt) + lift * Math.sin(view.tilt)) *
        view.zoom,
  };
}
export function unproject(point, view) {
  const origin = screenOrigin(view);
  return {
    x: view.cx + (point.x - origin.x) / view.zoom,
    y: view.cy - (point.y - origin.y) / (view.zoom * Math.cos(view.tilt)),
  };
}
export function constrainView(view) {
  let r = view.cy / ROW_HEIGHT,
    q = view.cx / SPACING - r / 2;
  const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
  if (distance > GRID_RADIUS - 2) {
    const factor = (GRID_RADIUS - 2) / distance;
    q *= factor;
    r *= factor;
  }
  const position = worldPosition(q, r);
  return {
    ...view,
    cx: position.x,
    cy: position.y,
    zoom: clamp(view.zoom, MIN_ZOOM, MAX_ZOOM),
    tilt: clamp(view.tilt, 0, 0.45),
  };
}
export function zoomAt(view, point, nextZoom) {
  const anchor = unproject(point, view);
  const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
  const origin = screenOrigin(view);
  return constrainView({
    ...view,
    zoom,
    cx: anchor.x - (point.x - origin.x) / zoom,
    cy: anchor.y + (point.y - origin.y) / (zoom * Math.cos(view.tilt)),
  });
}
export function hitTest(point, lattice, view) {
  let closest = null,
    distance = Math.max(24, 26 * view.zoom);
  for (const node of lattice.nodes) {
    const position = project(node, view);
    const next = Math.hypot(point.x - position.x, point.y - position.y);
    if (next < distance) {
      closest = node.id;
      distance = next;
    }
  }
  return closest;
}
export function nodeLift(node, selected, hovered, pulses, time, motion) {
  const resting = selected.has(node.id) ? 7 : node.id === hovered ? 3 : 0;
  const age = (time - (pulses.get(node.id) ?? -10000)) / 1000;
  if (!motion || age < 0 || age > 0.65) return resting;
  return resting + Math.sin(age * 28) * Math.exp(-age * 7) * 6;
}
