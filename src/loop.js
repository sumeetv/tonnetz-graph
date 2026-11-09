/** Schedule only dirty or actively animating frames; no permanent render loop. */
export function createRenderLoop(
  draw,
  { request = requestAnimationFrame, cancel = cancelAnimationFrame } = {},
) {
  let pending = null,
    enabled = true,
    disposed = false;
  function invalidate() {
    if (!enabled || disposed || pending !== null) return;
    pending = request((time) => {
      pending = null;
      if (draw(time)) invalidate();
    });
  }
  return {
    invalidate,
    setEnabled(value) {
      enabled = value;
      if (!value && pending !== null) {
        cancel(pending);
        pending = null;
      }
      if (value) invalidate();
    },
    dispose() {
      disposed = true;
      if (pending !== null) cancel(pending);
      pending = null;
    },
  };
}
