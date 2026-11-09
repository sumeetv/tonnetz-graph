# Tonnetz Graph modernization and resume log

Last updated: 2026-11-08 (America/Los_Angeles).

## User decisions and authorization

- Save a durable plan here; begin implementation in `../chord-finder` first.
- Shared identity: dark, polished music tools with restrained neon accents. Tonnetz is the more expressive, spatial experience; Chord Finder is a focused guitar workbench.
- UI and interaction refresh first; larger features and architecture changes are optional.
- Personal use on both mobile and desktop. Support touch navigation and selection.
- User authorized implementing Tonnetz's core refresh after Chord Finder, on the existing `codex/music-app-modernization` branch. Proceed through correctness, responsive input, and Three.js milestones; keep optional enhancements separate. No deployment requested.

## Design direction

Illuminated harmonic map: blue-black #0B0F16 background, slate #151D2A surfaces, soft-white #E8EDF5 text, violet #A59AFF app accent, mint/amber supporting colors. Quiet neutral nodes at rest, color concentrated around active relationships. Consistent interval legend with text as well as color.

Fill the available viewport with the lattice. Compact top toolbar, pan/zoom/recenter, selection inspector on desktop, expandable bottom inspector on phones. Crisp labels through zoom changes and readable details near screen edges.

Three.js direction: orthographic shallow lattice with slightly raised note discs and fine connecting lines. Optional gentle tilt, readable planar default. Node selection gets a short halo; connected selections illuminate edges; valid major/minor triads reveal triangular faces. Input updates immediately and interrupts ongoing transitions. Keep accessible DOM controls and a textual representation of selected notes/chord interpretations.

## Work sequence and acceptance criteria

### 1. Correctness and responsive foundation

- [x] Reconcile lattice coordinates, interval directions, generated edges, and displayed legend before animating geometry.
- [x] Add tests for adjacent intervals, valid triads, connected groups, repeated pitch classes, and chord interpretations.
- [x] Replace fixed 800×600 presentation with a responsive workspace and correct device-pixel-ratio handling.
- [x] Add direct pointer hit testing; distinguish tap from drag, support touch, and provide clear/undo/recenter.
- [x] Implement pan/zoom and a readable DOM selection inspector; desktop sidebar, mobile bottom sheet.
- [x] Establish shared dark tokens, clear focus, interval legend, and reduced-motion support.

### 2. Three.js renderer and expressive motion

- [x] Introduce a lightweight build setup; separate lattice generation, music matching, state, input, and rendering. Retain standalone app scope; React migration is optional.
- [x] Render repeated note discs with shared/instanced geometry and a bounded visible lattice.
- [x] Add selection halos, connecting-edge pulses, valid triad faces, and short camera settling.
- [x] Keep labels readable; support keyboard selection and DOM selection details.
- [x] Render on demand, pause when settled/hidden, cap rendering resolution, honor reduced motion, and provide a usable fallback if WebGL is unavailable.
- [x] Verify responsive phone/desktop layouts and core interactions in the browser.
- [ ] Complete a physical-phone pass: touch/pinch comfort, system reduced motion, WebGL context-loss recovery, and sustained animation profiling. No frame-rate target is claimed.

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

- Current app runs with `npm ci` and `npm run dev`. Production output is `dist/` from `npm run build`; use `npm run preview` to inspect it. Direct file opening is no longer supported.
- Before introducing a renderer, test topology and matching independent of browser/rendering code.
- After implementation: phone portrait/landscape and desktop; pinch/pan versus tap; zoom/recenter; selections at viewport edges; multiple connected groups; keyboard/focus; reduced motion; settled rendering; WebGL fallback.
- Sources for implementation principles: https://r3f.docs.pmnd.rs/advanced/scaling-performance and https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html (the app may use direct Three.js).

## Implementation and verification — 2026-11-08

- Replaced the monolithic canvas script with Vite and vanilla ES modules. Dependencies are pinned: Three.js 0.187.0 and Vite 8.3.6. Production asset URLs are relative for subdirectory hosting.
- The hex-bounded axial lattice contains 331 physical positions. Coordinates, edge intervals, reciprocal adjacency, and major/minor triangles share one definition. Matching returns every exact interpretation; repeated pitches remain independent selections. Corrected the altered-ninth and thirteenth pitch-class patterns.
- Implemented the dark responsive workspace, interval legend, desktop inspector/mobile expandable sheet, removable pitch chips, connected groups, clear/50-step undo, direct hit testing, pan/pinch/wheel zoom, recenter, Flat/Depth, and an initial C-major example.
- Three.js uses instanced discs, borders, and selection halos; selected relationships illuminate and complete triads reveal faces. Camera transitions last 240 ms; selection motion settles within 650 ms. DOM labels stay in the shared projection. Rendering is on demand, DPR capped at 1.5, and visibility/offscreen state suspends frames.
- Motion follows the system reduced-motion query and an optional persisted local preference. DOM note buttons expose names and pressed state, use one roving Tab stop, and support arrow/diagonal navigation, Home, Enter/Space, and Escape. Inspector changes have a live summary. Removing a pitch restores useful focus.
- Canvas draws the initial map and retains all controls if the GPU backend cannot initialize. Context loss switches to the same fallback; cleanup releases GPU resources, observers, pointer state, and scheduled frames. `/?renderer=canvas` skips the GPU import for troubleshooting.
- Fixed a browser-specific native-focus scrolling issue discovered during mobile QA: the map uses `overflow: clip`, pointer focus is applied with `preventScroll`, and pan remains owned by the view model. Repeated note taps were rechecked against the DOM projection afterward.

Validation completed:

- `npm test`: **15 passing tests** covering all lattice edges and triangles, exact/ambiguous chord interpretations, duplicate pitches, connected groups, immutable selection/undo, bounded history, projection/inverse, anchor-preserving zoom, clamped view, direct hit testing, tap/drag/pinch/cancel, and coalesced/suspended/disposed rendering.
- `npm run build`: passed. Initial app JS is approximately 17.8 kB (7.4 kB gzip), with Three.js in a separate approximately 542 kB (135 kB gzip) chunk. Vite emits its default >500 kB chunk advisory for that lazy GPU backend; do not interpret lazy loading as eliminating the download.
- Browser checks at 390×844, 320×568, 844×390, and 1440×1000: no horizontal page overflow; mobile sheet and desktop sidebar; direct C–G–E taps/keyboard entry; valid C-major face/interpretation; neighboring-key focus; Escape/Undo; note removal and focus recovery; desktop drag without toggling selection; zoom/recenter; Depth view; motion off and persisted through navigation; final renderer state settles to idle.
- Explicit Canvas mode verified in the browser: same chord/face result, note removal/Undo, Depth, one canvas, motion preference retained. WebGL mode verified with no warning/error console output during the checked interactions.
- Production preview verified at 390×844: repeated C–G–E taps produce C major, Depth and the expanded inspector work, the map's native scroll offset remains zero, one note has a Tab stop, and the renderer settles to idle. No warning/error console output was observed.
- Screenshots are outside the repository in the session artifact directory: `tonnetz-mobile.png`, `tonnetz-mobile-details.png`, `tonnetz-desktop.png`, `tonnetz-canvas-fallback.png`.

Remaining verification (not represented as completed): actual multitouch hardware and sustained frame-time profiling; OS reduced-motion changes and real WebGL loss/restore on a physical device. The gesture math and render-scheduler suspension are unit tested; device testing is still needed. Optional audio, saved paths, scale overlays, transformations, and a shared music package remain outside the authorized core scope.

## Resume checkpoint

- Core Tonnetz implementation is complete on `codex/music-app-modernization`. Read `git status --short` and the latest commit before making further changes. No deployment or push has been performed.
- Run `npm ci`, `npm test`, `npm run build`, then `npm run dev` to resume. Open the printed local URL; add `?renderer=canvas` to inspect the fallback. Temporary verification servers from this session are stopped when work concludes.
- Next authorized follow-up is verification or fixes to the core refresh. Optional feature work needs a separate scope decision. The remaining real-device checklist above should stay open until it is actually performed.
- Chord Finder's core refresh is complete on its sibling branch; it was not modified during Tonnetz implementation. Physical-phone evaluation is pending there too.
- No applicable AGENTS.md was found in the repository roots or ancestor directories.
