import { modulo } from "./music.js";

export const SPACING = 96;
export const ROW_HEIGHT = (SPACING * Math.sqrt(3)) / 2;
export const GRID_RADIUS = 10;
export const DIRECTIONS = [
  { dq: 1, dr: 0, semitones: 7, type: "fifth", color: "#a59aff" },
  { dq: 0, dr: 1, semitones: 3, type: "minor", color: "#57dfc9" },
  { dq: 1, dr: -1, semitones: 4, type: "major", color: "#f2be69" },
];
export const nodeId = (q, r) => `${q}:${r}`;
export const worldPosition = (q, r) => ({
  x: SPACING * (q + r / 2),
  y: ROW_HEIGHT * r,
});

export function createLattice(radius = GRID_RADIUS) {
  const nodes = [],
    edges = [],
    triangles = [],
    byId = new Map(),
    adjacency = new Map();
  for (let q = -radius; q <= radius; q++) {
    for (
      let r = Math.max(-radius, -q - radius);
      r <= Math.min(radius, -q + radius);
      r++
    ) {
      const node = {
        id: nodeId(q, r),
        q,
        r,
        pitch: modulo(q * 7 + r * 3),
        ...worldPosition(q, r),
      };
      nodes.push(node);
      byId.set(node.id, node);
      adjacency.set(node.id, new Set());
    }
  }
  for (const node of nodes) {
    for (const direction of DIRECTIONS) {
      const to = nodeId(node.q + direction.dq, node.r + direction.dr);
      if (!byId.has(to)) continue;
      edges.push({ from: node.id, to, ...direction });
      adjacency.get(node.id).add(to);
      adjacency.get(to).add(node.id);
    }
    for (const [quality, third] of [
      ["minor", nodeId(node.q, node.r + 1)],
      ["major", nodeId(node.q + 1, node.r - 1)],
    ]) {
      const ids = [node.id, nodeId(node.q + 1, node.r), third];
      if (ids.every((id) => byId.has(id)))
        triangles.push({ ids, quality, root: node.pitch });
    }
  }
  return { nodes, byId, edges, triangles, adjacency, radius };
}

export function connectedGroups(selected, lattice) {
  const visited = new Set(),
    groups = [];
  for (const id of selected) {
    if (visited.has(id) || !lattice.byId.has(id)) continue;
    const stack = [id],
      group = [];
    while (stack.length) {
      const current = stack.pop();
      if (visited.has(current)) continue;
      visited.add(current);
      group.push(current);
      for (const neighbor of lattice.adjacency.get(current)) {
        if (selected.has(neighbor) && !visited.has(neighbor))
          stack.push(neighbor);
      }
    }
    groups.push(group);
  }
  return groups;
}

export function selectedTriangles(selected, lattice) {
  return lattice.triangles.filter((triangle) =>
    triangle.ids.every((id) => selected.has(id)),
  );
}
