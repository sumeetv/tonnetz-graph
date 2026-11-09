import {
  AmbientLight,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  OrthographicCamera,
  RingGeometry,
  Scene,
  WebGLRenderer,
} from "three";
import { nodeLift, screenOrigin } from "./view.js";
import { selectedTriangles } from "./lattice.js";

export function createThreeRenderer(lattice, onLost) {
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0, 0);
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  const scene = new Scene(),
    group = new Group();
  scene.add(group);
  scene.add(new AmbientLight(0xffffff, 2));
  const light = new DirectionalLight(0xe2ddff, 2);
  light.position.set(-200, 400, 800);
  scene.add(light);
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);
  const discGeometry = new CylinderGeometry(22, 22, 4, 28);
  discGeometry.rotateX(Math.PI / 2);
  const discs = new InstancedMesh(
    discGeometry,
    new MeshStandardMaterial({ roughness: 0.8, metalness: 0.05 }),
    lattice.nodes.length,
  );
  const rings = new InstancedMesh(
    new RingGeometry(23, 24, 32),
    new MeshBasicMaterial({
      color: 0xffffff,
      side: DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    }),
    lattice.nodes.length,
  );
  const halos = new InstancedMesh(
    new RingGeometry(23.5, 24.5, 32),
    new MeshBasicMaterial({
      color: 0xb8adff,
      side: DoubleSide,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
    lattice.nodes.length,
  );
  group.add(discs, rings, halos);
  const edgeVertices = [],
    edgeColors = [];
  for (const edge of lattice.edges) {
    const c = new Color(edge.color);
    for (const id of [edge.from, edge.to]) {
      const n = lattice.byId.get(id);
      edgeVertices.push(n.x, n.y, -3);
      edgeColors.push(c.r, c.g, c.b);
    }
  }
  const edgeGeometry = new BufferGeometry();
  edgeGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(edgeVertices, 3),
  );
  edgeGeometry.setAttribute("color", new Float32BufferAttribute(edgeColors, 3));
  const edges = new LineSegments(
    edgeGeometry,
    new LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.19,
    }),
  );
  group.add(edges);
  const activeGeometry = new BufferGeometry(),
    faceGeometry = new BufferGeometry();
  const activeEdges = new LineSegments(
    activeGeometry,
    new LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    }),
  );
  const faces = new Mesh(
    faceGeometry,
    new MeshBasicMaterial({
      vertexColors: true,
      side: DoubleSide,
      transparent: true,
      opacity: 0.17,
      depthWrite: false,
    }),
  );
  group.add(activeEdges, faces);
  const dummy = new Object3D(),
    color = new Color();
  let lastRevision = -1,
    width = 0,
    height = 0;
  const lost = (event) => {
    event.preventDefault();
    onLost();
  };
  canvas.addEventListener("webglcontextlost", lost);
  return {
    canvas,
    render({ view, selected, hovered, pulses, time, motion, revision }) {
      if (width !== view.width || height !== view.height) {
        width = view.width;
        height = view.height;
        renderer.setSize(width, height, false);
      }
      const origin = screenOrigin(view);
      camera.left = -width / (2 * view.zoom);
      camera.right = width / (2 * view.zoom);
      camera.top = origin.y / view.zoom;
      camera.bottom = -(height - origin.y) / view.zoom;
      camera.position.set(view.cx, view.cy * Math.cos(view.tilt), 1000);
      camera.updateProjectionMatrix();
      group.rotation.x = -view.tilt;
      const pitches = new Set(
        [...selected].map((id) => lattice.byId.get(id).pitch),
      );
      lattice.nodes.forEach((node, i) => {
        const lift = nodeLift(node, selected, hovered, pulses, time, motion),
          active = selected.has(node.id),
          hover = node.id === hovered,
          related = pitches.has(node.pitch);
        dummy.position.set(node.x, node.y, lift);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        discs.setMatrixAt(i, dummy.matrix);
        discs.setColorAt(
          i,
          color.set(active ? "#555078" : related ? "#1f353b" : "#172332"),
        );
        dummy.position.z = lift + 2.2;
        dummy.updateMatrix();
        rings.setMatrixAt(i, dummy.matrix);
        rings.setColorAt(
          i,
          color.set(
            active
              ? "#b9adff"
              : hover
                ? "#d5deef"
                : related
                  ? "#568e89"
                  : "#47556d",
          ),
        );
        const age = (time - (pulses.get(node.id) ?? -10000)) / 650,
          scale = motion && age >= 0 && age < 1 ? 1 + age * 0.8 : 0;
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        halos.setMatrixAt(i, dummy.matrix);
      });
      for (const mesh of [discs, rings, halos]) {
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
      if (lastRevision !== revision) {
        lastRevision = revision;
        const positions = [],
          colors = [],
          vertices = [],
          faceColors = [];
        for (const edge of lattice.edges) {
          if (!selected.has(edge.from) || !selected.has(edge.to)) continue;
          const c = new Color(edge.color);
          for (const id of [edge.from, edge.to]) {
            const n = lattice.byId.get(id);
            positions.push(n.x, n.y, 1);
            colors.push(c.r, c.g, c.b);
          }
        }
        for (const tri of selectedTriangles(selected, lattice)) {
          const c = new Color(tri.quality === "major" ? "#a59aff" : "#57dfc9");
          for (const id of tri.ids) {
            const n = lattice.byId.get(id);
            vertices.push(n.x, n.y, 0);
            faceColors.push(c.r, c.g, c.b);
          }
        }
        activeGeometry.setAttribute(
          "position",
          new Float32BufferAttribute(positions, 3),
        );
        activeGeometry.setAttribute(
          "color",
          new Float32BufferAttribute(colors, 3),
        );
        activeGeometry.computeBoundingSphere();
        faceGeometry.setAttribute(
          "position",
          new Float32BufferAttribute(vertices, 3),
        );
        faceGeometry.setAttribute(
          "color",
          new Float32BufferAttribute(faceColors, 3),
        );
        faceGeometry.computeBoundingSphere();
      }
      const newest = Math.max(-10000, ...pulses.values()),
        age = Math.max(0, time - newest) / 650;
      activeEdges.material.opacity =
        motion && age < 1 ? 0.7 + 0.3 * Math.sin(age * Math.PI) : 0.85;
      renderer.render(scene, camera);
    },
    dispose() {
      canvas.removeEventListener("webglcontextlost", lost);
      for (const object of [discs, rings, halos, edges, activeEdges, faces]) {
        object.geometry.dispose();
        object.material.dispose();
      }
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
