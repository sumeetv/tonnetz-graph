# Tonnetz Graph

A responsive harmonic map for exploring pitch relationships and chord shapes. Built with vanilla JavaScript, Vite, and an on-demand Three.js renderer, with a Canvas 2D fallback.

## Run locally

Requires Node 20.19.x, 22.12+, or a newer compatible release, and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. This app now uses ES modules and bundled dependencies; opening `index.html` directly is no longer the run path.

```sh
npm test          # topology, chords, selection, gestures, projection, render scheduling
npm run build    # production files in dist/
npm run preview  # serve the production build locally
```

Deploy the contents of `dist/` to static hosting when ready. No deployment has been performed as part of the refresh.

## Explore

- Tap or click note positions to select them. Duplicate pitch classes remain separate positions on the map.
- Drag to pan; pinch, scroll, or use the buttons to zoom. Recenter returns to the central C.
- Right adds a fifth (+7 semitones), upper-right a minor third (+3), and lower-right a major third (+4).
- Complete major/minor triangles reveal filled faces. The inspector shows all exact chord interpretations and each physically connected group.
- Undo restores previous selections; Clear removes them. Note chips remove every selected position of that pitch class.
- On phones, tap the bottom selection summary to expand details. Desktop details remain open.
- Use arrow keys to move between notes, Shift + up/down for the other diagonal, Home for the central C, and Enter/Space to select. Escape clears selection. The map has one Tab stop, with ordinary DOM buttons for notes.
- Flat/Depth changes the shallow orthographic perspective. Selection motion can be disabled and follows the system reduced-motion preference automatically. The local motion preference is remembered when storage is available.

## Rendering and fallback

The graph uses a bounded 331-position lattice, instanced discs/rings, HTML labels, and capped pixel density (1.5). Frames are requested only for changes and short animations, and pause when the page is hidden or the map is offscreen. Three.js loads separately after the initial Canvas frame. GPU resources and observers are released on teardown. WebGL initialization failure or context loss switches to Canvas while preserving interaction and selection.

For troubleshooting or comparing the fallback, open `/?renderer=canvas`. This skips the Three.js import. No WebGL support is needed for selection, keyboard navigation, pan/zoom, chord matching, or the inspector.

## Project structure

- `src/lattice.js`, `music.js`: coordinates, topology, intervals, exact pitch-class chord matching.
- `src/selection.js`: immutable selections and bounded undo history.
- `src/view.js`, `gestures.js`: shared projection, hit testing, navigation, tap/pan/pinch handling.
- `src/renderer.js`, `three-renderer.js`: Canvas fallback and lazy GPU backend.
- `src/loop.js`: coalesced, on-demand frame scheduling.
- `src/main.js`, `style.css`, `index.html`: accessible controls, responsive layout, lifecycle, and appearance.
- `tests/`: built-in Node test runner; no test framework dependency.

Chord recognition treats pitch classes as an unordered set; it does not infer a bass note or a unique harmonic root. Ninth and thirteenth patterns use pitch-class voicings defined in `music.js`; they do not cover every possible omitted-tone voicing. Sharps are used consistently in note labels. The refresh also corrects the old altered-ninth pattern's missing seventh and the thirteenth pattern's interval set.

Implementation status, validation evidence, deferred features, and resume instructions live in [MODERNIZATION_PLAN.md](MODERNIZATION_PLAN.md).
