# Tonnetz Graph modernization and resume log

Last updated: 2026-11-08 (America/Los_Angeles).

## User decisions and authorization

- Save a durable plan here; begin implementation in `../chord-finder` first.
- Shared identity: dark, polished music tools with restrained neon accents. Tonnetz is the more expressive, spatial experience; Chord Finder is a focused guitar workbench.
- UI and interaction refresh first; larger features and architecture changes are optional.
- Personal use on both mobile and desktop. Support touch navigation and selection.
- User authorized committing the saved plan on a new branch. App implementation remains queued while Chord Finder's tactile-effects milestone proceeds. No deployment requested.

## Design direction

Illuminated harmonic map: blue-black #0B0F16 background, slate #151D2A surfaces, soft-white #E8EDF5 text, violet #A59AFF app accent, mint/amber supporting colors. Quiet neutral nodes at rest, color concentrated around active relationships. Consistent interval legend with text as well as color.

Fill the available viewport with the lattice. Compact top toolbar, pan/zoom/recenter, selection inspector on desktop, expandable bottom inspector on phones. Crisp labels through zoom changes and readable details near screen edges.

Three.js direction: orthographic shallow lattice with slightly raised note discs and fine connecting lines. Optional gentle tilt, readable planar default. Node selection gets a short halo; connected selections illuminate edges; valid major/minor triads reveal triangular faces. Input updates immediately and interrupts ongoing transitions. Keep accessible DOM controls and a textual representation of selected notes/chord interpretations.

## Work sequence and acceptance criteria

### 1. Correctness and responsive foundation

- [ ] Reconcile lattice coordinates, interval directions, generated edges, and displayed legend before animating geometry.
- [ ] Add tests for adjacent intervals, valid triads, connected groups, repeated pitch classes, and chord interpretations.
- [ ] Replace fixed 800×600 presentation with a responsive workspace and correct device-pixel-ratio handling.
- [ ] Add direct pointer hit testing; distinguish tap from drag, support touch, and provide clear/undo/recenter.
- [ ] Implement pan/zoom and a readable DOM selection inspector; desktop sidebar, mobile bottom sheet.
- [ ] Establish shared dark tokens, clear focus, interval legend, and reduced-motion support.

### 2. Three.js renderer and expressive motion

- [ ] Introduce a lightweight build setup; separate lattice generation, music matching, state, input, and rendering. Retain standalone app scope; React migration is optional.
- [ ] Render repeated note discs with shared/instanced geometry and a bounded visible lattice.
- [ ] Add selection halos, connecting-edge pulses, valid triad faces, and short camera settling.
- [ ] Keep labels readable; support keyboard selection and DOM selection details.
- [ ] Render on demand, pause when settled/hidden, cap rendering resolution, honor reduced motion, and provide a usable fallback if WebGL is unavailable.
- [ ] Verify phone/desktop interaction and measure animation performance before claiming a frame-rate target.

### 3. Optional enhancements — separate scope

- Audio playback, saved harmonic paths, scale overlays, guided neighboring-triad transformations.
- Shared music definitions with Chord Finder. Normalize pitch indices and enharmonic spelling first.

## Starting code and verified findings

- Three files, no dependencies or package setup: `index.html`, `script.js`, `README.md`.
- Fixed canvas, body overflow hidden, mousemove hover state reused by click. Direct touch selection needs a new input path.
- Lattice generation currently produces 308 nodes. A Node diagnostic invoking `createTriangularGrid()` and `createEdges()` produced:
  - 294 `right` edges with 7 semitones.
  - 276 `bottom-left` edges with 8 semitones.
  - 283 `top-left` edges with 9 semitones.
  - No `top-right` or `bottom-right` edges, despite their +3/+4 legend entries.
- Review the mathematical convention; reverse intervals can be valid, but geometry, generation, labeling, and traversal must agree.
- Chord tooltips are drawn in canvas and may clip. Matching returns the first exact interpretation; consider displaying multiple interpretations without imposing an unproven root.
- Chord patterns duplicate the sibling app. Tonnetz uses C-based indices/sharps; Chord Finder uses A-based indices/flats.

## Validation

- Current app runs by opening `index.html` or serving this directory with a local static server.
- Before introducing a renderer, test topology and matching independent of browser/rendering code.
- After implementation: phone portrait/landscape and desktop; pinch/pan versus tap; zoom/recenter; selections at viewport edges; multiple connected groups; keyboard/focus; reduced motion; settled rendering; WebGL fallback.
- Sources for implementation principles: https://r3f.docs.pmnd.rs/advanced/scaling-performance and https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html (the app may use direct Three.js).

## Resume checkpoint

- Plan saved; no Tonnetz app code changed. Chord Finder's mobile foundation and on-demand Three.js feedback are implemented and validated; physical-phone evaluation remains pending. See `../chord-finder/MODERNIZATION_PLAN.md` for the current checkpoint. Tonnetz implementation remains queued.
- Branch: `codex/music-app-modernization`. Initial roadmap committed as `f4450ab`; this sibling checkpoint is saved in a later documentation commit. No Tonnetz app code has changed. No applicable AGENTS.md found in repository roots or ancestor directories.
- First action on resume: inspect `git status --short`, read this file, confirm Chord Finder's checkpoint, then begin topology validation when Tonnetz implementation is authorized.
- Update checkboxes and this checkpoint with actual work/validation before ending a future implementation session.
