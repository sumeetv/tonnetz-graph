# Tonnetz Graph

Interactive visualization of chromatic notes in a musical lattice structure.

## Usage

1. Open `index.html` in a web browser
2. **Click** nodes to select/deselect (multiple selection supported)
3. **Hover** over nodes to see details
4. **Tooltips** appear for connected groups of 2+ selected nodes

## Features

- Interactive node selection with visual feedback
- Multiple node selection
- Connected group detection and tooltips
- Color-coded musical intervals as edges

## Files

- `index.html` - Main HTML file with 800×600 canvas
- `script.js` - Complete JavaScript implementation

## Key Configuration

In `script.js`:
- **Grid size**: Lines 52-53 (`rows = 14`, `cols = 25`)
- **Visual**: Lines 25-26 (`nodeRadius = 25`, `gridSpacing = 80`)
- **Colors**: Lines 10-23 (note colors), 207-228 (edge colors)

## Customization

**Grid Size**: Modify `rows` and `cols` in `createTriangularGrid()`
**Colors**: Update `noteColors` object and edge colors in `drawEdges()`
**Layout**: Adjust `nodeRadius`, `gridSpacing`, or canvas dimensions

No dependencies required - runs in any modern browser with HTML5 Canvas support.