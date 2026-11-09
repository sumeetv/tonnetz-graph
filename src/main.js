import "./style.css";
import { createLattice, connectedGroups } from "./lattice.js";
import { findChords, noteName } from "./music.js";
import { createSelection, selectionReducer } from "./selection.js";
import {
  project,
  nodeLift,
  hitTest,
  screenOrigin,
  constrainView,
  zoomAt,
} from "./view.js";
import { createGestures } from "./gestures.js";
import { createCanvasRenderer } from "./renderer.js";
import { createRenderLoop } from "./loop.js";

const $ = (selector) => document.querySelector(selector);
const lattice = createLattice(),
  surface = $("#surface"),
  labels = $("#labels"),
  map = $("#map"),
  inspector = $("#inspector"),
  canvas = $("#fallback");
const reduced = matchMedia("(prefers-reduced-motion: reduce)"),
  mobile = matchMedia("(max-width: 720px)");
let motionPreference = true;
try {
  motionPreference = localStorage.getItem("tonnetz-motion") !== "off";
} catch {
  /* Storage is optional. */
}
let state = createSelection(),
  revision = 0,
  hovered = null,
  focused = "0:0",
  pulses = new Map(),
  cameraAnimation = null,
  visible = true,
  disposed = false;
let view = {
  cx: 0,
  cy: 0,
  zoom: mobile.matches ? 0.85 : 1,
  tilt: 0,
  width: 1,
  height: 1,
  insetBottom: mobile.matches ? 86 : 0,
};
const fallback = createCanvasRenderer(canvas, lattice);
let renderer = fallback,
  three = null;
surface.dataset.renderer = "canvas";
const buttons = new Map();
for (const node of lattice.nodes) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "note";
  button.textContent = noteName(node.pitch);
  button.dataset.id = node.id;
  button.setAttribute(
    "aria-label",
    `${noteName(node.pitch)}, column ${node.q}, row ${node.r}`,
  );
  button.setAttribute("aria-pressed", "false");
  button.tabIndex = node.id === focused ? 0 : -1;
  button.addEventListener("click", (event) => {
    if (event.detail === 0) {
      focused = node.id;
      select(node.id);
    }
  });
  button.addEventListener("focus", () => {
    focused = node.id;
    hovered = node.id;
    loop.invalidate();
  });
  button.addEventListener("blur", () => {
    hovered = null;
    loop.invalidate();
  });
  button.addEventListener("keydown", (event) => navigate(event, node));
  labels.append(button);
  buttons.set(node.id, button);
}
const motion = () => motionPreference && !reduced.matches;
function draw(time) {
  let animating = false;
  if (cameraAnimation) {
    const progress = Math.min(1, (time - cameraAnimation.time) / 240),
      ease = 1 - Math.pow(1 - progress, 3);
    for (const key of ["cx", "cy", "zoom", "tilt"])
      view[key] =
        cameraAnimation.from[key] +
        (cameraAnimation.to[key] - cameraAnimation.from[key]) * ease;
    if (progress === 1) cameraAnimation = null;
    else animating = true;
  }
  for (const [id, start] of pulses)
    if (time - start >= 650 || !motion()) pulses.delete(id);
  const frame = {
    view,
    selected: state.selected,
    hovered,
    pulses,
    time,
    motion: motion(),
    revision,
  };
  renderer.render(frame);
  let closest = null,
    distance = Infinity;
  const origin = screenOrigin(view);
  const reachable = new Set();
  for (const node of lattice.nodes) {
    const button = buttons.get(node.id),
      p = project(
        node,
        view,
        nodeLift(node, state.selected, hovered, pulses, time, motion()),
      );
    const hidden =
      p.x < -24 || p.x > view.width + 24 || p.y < -24 || p.y > view.height + 24;
    button.hidden = hidden;
    button.style.transform = `translate(${p.x - 23}px,${p.y - 23}px)`;
    button.setAttribute("aria-pressed", String(state.selected.has(node.id)));
    button.tabIndex = -1;
    if (
      p.x >= 24 &&
      p.x <= view.width - 24 &&
      p.y >= 92 &&
      p.y <= view.height - view.insetBottom - 24
    ) {
      reachable.add(node.id);
      const d = Math.hypot(p.x - origin.x, p.y - origin.y);
      if (d < distance) {
        closest = node.id;
        distance = d;
      }
    }
  }
  if (!reachable.has(focused)) focused = closest;
  if (focused) buttons.get(focused).tabIndex = 0;
  $("#zoom-value").value = `${Math.round(view.zoom * 100)}%`;
  $("#zoom-out").disabled = view.zoom <= 0.5501;
  $("#zoom-in").disabled = view.zoom >= 1.6999;
  const active = animating || pulses.size > 0;
  surface.dataset.state = active ? "animating" : "idle";
  return active;
}
const loop = createRenderLoop(draw);
function cameraTo(next) {
  const target = constrainView({ ...view, ...next });
  if (motion()) {
    cameraAnimation = {
      from: { ...view },
      to: target,
      time: performance.now(),
    };
  } else {
    view = target;
    cameraAnimation = null;
  }
  loop.invalidate();
}
function dispatch(action) {
  const next = selectionReducer(state, action, lattice);
  if (next === state) return;
  const now = performance.now();
  if (motion())
    for (const id of next.selected)
      if (!state.selected.has(id)) pulses.set(id, now);
  state = next;
  revision++;
  updateInspector();
  if (action.type === "remove-pitch") {
    ($("#selection-content .chip") || $("#undo")).focus({
      preventScroll: true,
    });
  }
  loop.invalidate();
}
function select(id) {
  dispatch({ type: "toggle", id });
}
function pitchesFor(ids) {
  return [...new Set([...ids].map((id) => lattice.byId.get(id).pitch))].sort(
    (a, b) => a - b,
  );
}
function updateInspector() {
  const pitches = pitchesFor(state.selected),
    matches = findChords(pitches),
    content = $("#selection-content");
  $("#undo").disabled = !state.history.length;
  $("#clear").disabled = !state.selected.size;
  const title = matches.length
    ? matches.map((match) => match.name).join(" / ")
    : pitches.length
      ? `${pitches.length} note${pitches.length === 1 ? "" : "s"} selected`
      : "A world of possibilities";
  $("#selection-title").textContent = title;
  $("#announcement").textContent = pitches.length
    ? `${pitches.map(noteName).join(", ")}. ${matches.length ? `Chord interpretations: ${matches.map((m) => m.name).join(", ")}.` : "No exact chord match."}`
    : "Selection cleared.";
  if (!pitches.length) {
    content.innerHTML =
      '<div class="empty"><div class="empty-icon" aria-hidden="true">△</div><h2>Start with a few notes.</h2><p>Each direction opens a different interval. Pick a small cluster and see which chords emerge.</p><button class="button demo" id="demo">Explore C major <span aria-hidden="true">↗</span></button></div>';
    $("#demo").addEventListener("click", () => {
      dispatch({ type: "preset", ids: ["0:0", "1:0", "1:-1"] });
      cameraTo({ cx: 48, cy: 0, zoom: mobile.matches ? 0.9 : 1.05 });
    });
    return;
  }
  content.replaceChildren();
  const chips = document.createElement("div");
  chips.className = "chips";
  for (const pitch of pitches) {
    const count = [...state.selected].filter(
        (id) => lattice.byId.get(id).pitch === pitch,
      ).length,
      button = document.createElement("button");
    button.className = "chip";
    button.setAttribute(
      "aria-label",
      `Remove ${noteName(pitch)}${count > 1 ? `, all ${count} positions` : ""}`,
    );
    button.innerHTML = `${noteName(pitch)}${count > 1 ? ` <small>×${count}</small>` : ""}<span class="remove" aria-hidden="true">×</span>`;
    button.addEventListener("click", () =>
      dispatch({ type: "remove-pitch", pitch }),
    );
    chips.append(button);
  }
  content.append(chips);
  const heading = document.createElement("h2");
  heading.className = "section-title";
  heading.textContent = "CHORD INTERPRETATIONS";
  content.append(heading);
  if (matches.length) {
    for (const match of matches) {
      const card = document.createElement("div");
      card.className = "match";
      const name = document.createElement("strong"),
        description = document.createElement("small");
      name.textContent = match.name;
      description.textContent = `${noteName(match.root)} ${match.type}`;
      card.append(name, description);
      content.append(card);
    }
  } else {
    const description = document.createElement("p");
    description.className = "section-description";
    description.textContent =
      pitches.length < 3
        ? "Keep adding notes to discover a chord. Fifths and thirds make a good starting point."
        : "No exact match in the chord library. Try a neighboring note, or explore a different shape.";
    content.append(description);
  }
  const groups = connectedGroups(state.selected, lattice),
    groupHeading = document.createElement("h2");
  groupHeading.className = "section-title";
  groupHeading.textContent = `CONNECTED SHAPES · ${groups.length}`;
  content.append(groupHeading);
  groups.forEach((group, index) => {
    const card = document.createElement("div"),
      name = document.createElement("h3"),
      description = document.createElement("p"),
      pitches = pitchesFor(group),
      matches = findChords(pitches);
    card.className = "cluster";
    name.textContent = matches.length
      ? matches.map((m) => m.name).join(" / ")
      : `Shape ${index + 1}`;
    description.textContent = `${pitches.map(noteName).join(" · ")}  /  ${group.length} position${group.length === 1 ? "" : "s"}`;
    card.append(name, description);
    content.append(card);
  });
}
function navigate(event, node) {
  if (event.key === "Escape") {
    event.preventDefault();
    dispatch({ type: "clear" });
    return;
  }
  const deltas = {
    ArrowRight: [1, 0],
    ArrowLeft: [-1, 0],
    ArrowUp: event.shiftKey ? [-1, 1] : [0, 1],
    ArrowDown: event.shiftKey ? [1, -1] : [0, -1],
  };
  const delta = deltas[event.key];
  if (!delta && event.key !== "Home") return;
  event.preventDefault();
  const id =
      event.key === "Home"
        ? "0:0"
        : `${node.q + delta[0]}:${node.r + delta[1]}`,
    target = lattice.byId.get(id);
  if (!target) return;
  cameraAnimation = null;
  const position = project(target, view);
  if (
    position.x < 60 ||
    position.x > view.width - 60 ||
    position.y < 115 ||
    position.y > view.height - view.insetBottom - 60
  )
    view = constrainView({ ...view, cx: target.x, cy: target.y });
  focused = id;
  draw(performance.now());
  buttons.get(id).focus({ preventScroll: true });
  loop.invalidate();
}
const point = (event) => {
  const rect = surface.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
};
const gestures = createGestures({
  getView: () => view,
  setView: (next) => {
    view = next;
    loop.invalidate();
  },
  pick: (p) => hitTest(p, lattice, view),
  select: (id) => {
    focused = id;
    buttons.get(id).focus({ preventScroll: true });
    select(id);
  },
  cancelAnimation: () => {
    cameraAnimation = null;
  },
});
const controller = new AbortController(),
  options = { signal: controller.signal };
surface.addEventListener(
  "pointerdown",
  (event) => {
    if (event.button !== 0) return;
    // Native focus scrolling must not move the visual map independently of view.
    event.preventDefault();
    gestures.down(event.pointerId, point(event));
    surface.setPointerCapture(event.pointerId);
  },
  options,
);
surface.addEventListener(
  "pointermove",
  (event) => {
    if (gestures.move(event.pointerId, point(event))) return;
    if (event.pointerType === "mouse") {
      const next = hitTest(point(event), lattice, view);
      if (next !== hovered) {
        hovered = next;
        loop.invalidate();
      }
    }
  },
  options,
);
surface.addEventListener(
  "pointerup",
  (event) => {
    gestures.up(event.pointerId, point(event));
    if (surface.hasPointerCapture(event.pointerId))
      surface.releasePointerCapture(event.pointerId);
  },
  options,
);
surface.addEventListener("pointercancel", () => gestures.cancel(), options);
surface.addEventListener(
  "lostpointercapture",
  (event) => {
    if (gestures.has(event.pointerId)) gestures.cancel();
  },
  options,
);
surface.addEventListener(
  "pointerleave",
  () => {
    hovered = null;
    loop.invalidate();
  },
  options,
);
surface.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    cameraAnimation = null;
    view = zoomAt(
      view,
      point(event),
      view.zoom * Math.exp(-event.deltaY * 0.0015),
    );
    loop.invalidate();
  },
  { ...options, passive: false },
);
$("#undo").addEventListener("click", () => dispatch({ type: "undo" }), options);
$("#clear").addEventListener(
  "click",
  () => dispatch({ type: "clear" }),
  options,
);
$("#zoom-in").addEventListener(
  "click",
  () => cameraTo(zoomAt(view, screenOrigin(view), view.zoom * 1.2)),
  options,
);
$("#zoom-out").addEventListener(
  "click",
  () => cameraTo(zoomAt(view, screenOrigin(view), view.zoom / 1.2)),
  options,
);
$("#recenter").addEventListener(
  "click",
  () => cameraTo({ cx: 0, cy: 0, zoom: mobile.matches ? 0.85 : 1 }),
  options,
);
function perspective(tilt) {
  $("#flat").setAttribute("aria-pressed", String(tilt === 0));
  $("#depth").setAttribute("aria-pressed", String(tilt !== 0));
  cameraTo({ tilt });
}
$("#flat").addEventListener("click", () => perspective(0), options);
$("#depth").addEventListener("click", () => perspective(0.45), options);
function syncMotion() {
  const input = $("#motion");
  input.checked = motion();
  input.disabled = reduced.matches;
  $("#motion-note").textContent = reduced.matches
    ? "Motion is off to match your device preference."
    : "Short halos and gentle camera transitions.";
  if (!motion()) {
    pulses.clear();
    if (cameraAnimation) {
      view = { ...view, ...cameraAnimation.to };
      cameraAnimation = null;
    }
  }
  loop.invalidate();
}
$("#motion").addEventListener(
  "change",
  (event) => {
    motionPreference = event.target.checked;
    try {
      localStorage.setItem("tonnetz-motion", motionPreference ? "on" : "off");
    } catch {
      /* Storage is optional. */
    }
    syncMotion();
  },
  options,
);
reduced.addEventListener("change", syncMotion, options);
inspector.querySelector(":scope > summary").addEventListener(
  "click",
  (event) => {
    if (!mobile.matches) event.preventDefault();
  },
  options,
);
function breakpoint() {
  inspector.open = !mobile.matches;
  view.insetBottom = mobile.matches ? 86 : 0;
  loop.invalidate();
}
mobile.addEventListener("change", breakpoint, options);
const resize = new ResizeObserver(() => {
  const rect = surface.getBoundingClientRect();
  view = { ...view, width: rect.width, height: rect.height };
  cameraAnimation = null;
  loop.invalidate();
});
resize.observe(surface);
function visibility() {
  const enabled = !document.hidden && visible;
  if (!enabled) {
    pulses.clear();
    if (cameraAnimation) {
      view = { ...view, ...cameraAnimation.to };
      cameraAnimation = null;
    }
  }
  loop.setEnabled(enabled);
}
document.addEventListener("visibilitychange", visibility, options);
const intersection = new IntersectionObserver((entries) => {
  visible = entries[0].isIntersecting;
  visibility();
});
intersection.observe(map);
updateInspector();
breakpoint();
syncMotion();
function useFallback() {
  if (three) {
    three.dispose();
    three = null;
  }
  renderer = fallback;
  canvas.hidden = false;
  surface.dataset.renderer = "canvas";
  loop.invalidate();
}
// First paint and input work immediately; the optional GPU backend arrives separately.
if (new URLSearchParams(location.search).get("renderer") !== "canvas")
  requestAnimationFrame(() => {
    import("./three-renderer.js")
      .then(({ createThreeRenderer }) => {
        if (disposed) return;
        try {
          three = createThreeRenderer(lattice, useFallback);
          surface.prepend(three.canvas);
          renderer = three;
          canvas.hidden = true;
          surface.dataset.renderer = "webgl";
          loop.invalidate();
        } catch {
          useFallback();
        }
      })
      .catch(useFallback);
  });
function dispose() {
  disposed = true;
  controller.abort();
  resize.disconnect();
  intersection.disconnect();
  loop.dispose();
  gestures.cancel();
  three?.dispose();
  fallback.dispose();
}
window.addEventListener(
  "pagehide",
  (event) => {
    if (!event.persisted) dispose();
  },
  options,
);
if (import.meta.hot) import.meta.hot.dispose(dispose);
