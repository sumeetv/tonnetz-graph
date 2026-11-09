import { project, nodeLift } from "./view.js";
import { selectedTriangles } from "./lattice.js";

export function createCanvasRenderer(canvas, lattice) {
  const ctx = canvas.getContext("2d");
  return {
    render(frame) {
      const { view, selected, hovered, pulses, time, motion } = frame;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.round(view.width * dpr),
        height = Math.round(view.height * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, view.width, view.height);
      const point = (id) =>
        project(
          lattice.byId.get(id),
          view,
          nodeLift(
            lattice.byId.get(id),
            selected,
            hovered,
            pulses,
            time,
            motion,
          ),
        );
      for (const triangle of selectedTriangles(selected, lattice)) {
        ctx.beginPath();
        triangle.ids.forEach((id, i) => {
          const p = point(id);
          i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fillStyle =
          triangle.quality === "major" ? "#a59aff24" : "#57dfc924";
        ctx.fill();
      }
      for (const edge of lattice.edges) {
        const a = point(edge.from),
          b = point(edge.to),
          active = selected.has(edge.from) && selected.has(edge.to);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.globalAlpha = active ? 0.85 : 0.2;
        ctx.strokeStyle = edge.color;
        ctx.lineWidth = active ? 2 : 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const pitches = new Set(
        [...selected].map((id) => lattice.byId.get(id).pitch),
      );
      for (const node of lattice.nodes) {
        const p = point(node.id),
          active = selected.has(node.id),
          hover = hovered === node.id;
        if (
          p.x < -40 ||
          p.x > view.width + 40 ||
          p.y < -40 ||
          p.y > view.height + 40
        )
          continue;
        const radius = 22 * view.zoom;
        ctx.beginPath();
        ctx.ellipse(
          p.x,
          p.y,
          radius,
          radius * Math.cos(view.tilt),
          0,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = active
          ? "#555078"
          : pitches.has(node.pitch)
            ? "#1f353b"
            : "#172332";
        ctx.fill();
        ctx.strokeStyle = active
          ? "#b9adff"
          : hover
            ? "#d5deef"
            : pitches.has(node.pitch)
              ? "#568e89"
              : "#47556d";
        ctx.lineWidth = active ? 2 : 1;
        ctx.stroke();
        const age = (time - (pulses.get(node.id) ?? -10000)) / 650;
        if (motion && age >= 0 && age < 1) {
          ctx.beginPath();
          ctx.ellipse(
            p.x,
            p.y,
            radius * (1 + age * 0.8),
            radius * (1 + age * 0.8) * Math.cos(view.tilt),
            0,
            0,
            Math.PI * 2,
          );
          ctx.globalAlpha = 1 - age;
          ctx.strokeStyle = "#b8adff";
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    },
    dispose() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
