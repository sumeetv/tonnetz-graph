class TonnetzGraph {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodes = new Map();
        this.edges = [];
        
        // Chromatic notes
        this.notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.noteColors = {
            'C': '#CC9999',   // Muted Red
            'C#': '#D4AAAA',  // Muted Light Red
            'D': '#99CCCC',   // Muted Teal
            'D#': '#AAD4D4',  // Muted Light Teal
            'E': '#99BBDD',   // Muted Blue
            'F': '#AACCBB',   // Muted Green
            'F#': '#BBDDBB',  // Muted Light Green
            'G': '#DDCC99',   // Muted Yellow
            'G#': '#DDCC99',  // Muted Light Yellow
            'A': '#CCAACC',   // Muted Plum
            'A#': '#DDBBDD',  // Muted Light Plum
            'B': '#DDAABB'    // Muted Pink
        };
        
        this.nodeRadius = 25;
        this.gridSpacing = 80;
        this.hoveredNode = null;
        this.selectedNodes = new Set();
        
        this.init();
    }
    
    // Convert semitone number to note name
    getNoteName(semitone) {
        return this.notes[((semitone % 12) + 12) % 12];
    }
    
    // Get semitone number from note name
    getSemitone(noteName) {
        return this.notes.indexOf(noteName);
    }
    
    init() {
        this.createTriangularGrid();
        this.createEdges();
        this.setupEventListeners();
        this.draw();
    }
    
    createTriangularGrid() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const rows = 14;
        const cols = 25;
        
        // Start with C (0 semitones) at center-left
        let startSemitone = 0;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols - Math.floor(row / 2); col++) {
                // Calculate position for triangular grid
                const x = centerX - (cols * this.gridSpacing / 2) + (col * this.gridSpacing) + (row * this.gridSpacing / 2);
                const y = centerY + (rows * this.gridSpacing / 2) - (row * this.gridSpacing * Math.sin(Math.PI / 3));
                
                // Calculate semitone based on grid position
                // This creates the triangular lattice structure
                const semitone = (startSemitone + col * 7 + row * 3) % 12;
                const noteName = this.getNoteName(semitone);
                
                const nodeId = `${row}-${col}`;
                this.nodes.set(nodeId, {
                    id: nodeId,
                    x: x,
                    y: y,
                    semitone: semitone,
                    note: noteName,
                    row: row,
                    col: col
                });
            }
        }
    }
    
    createEdges() {
        this.nodes.forEach((node, nodeId) => {
            const { row, col, semitone } = node;
            
            // Right edge: +7 semitones
            const rightNodeId = `${row}-${col + 1}`;
            if (this.nodes.has(rightNodeId)) {
                const rightNode = this.nodes.get(rightNodeId);
                if ((rightNode.semitone - semitone + 12) % 12 === 7) {
                    this.edges.push({
                        from: nodeId,
                        to: rightNodeId,
                        type: 'right',
                        semitones: 7
                    });
                }
            }
            
            // Top-right edge: +3 semitones
            const topRightNodeId = `${row - 1}-${col + 1}`;
            if (this.nodes.has(topRightNodeId)) {
                const topRightNode = this.nodes.get(topRightNodeId);
                if ((topRightNode.semitone - semitone + 12) % 12 === 3) {
                    this.edges.push({
                        from: nodeId,
                        to: topRightNodeId,
                        type: 'top-right',
                        semitones: 3
                    });
                }
            }
            
            // Bottom-right edge: +4 semitones
            const bottomRightNodeId = `${row + 1}-${col}`;
            if (this.nodes.has(bottomRightNodeId)) {
                const bottomRightNode = this.nodes.get(bottomRightNodeId);
                if ((bottomRightNode.semitone - semitone + 12) % 12 === 4) {
                    this.edges.push({
                        from: nodeId,
                        to: bottomRightNodeId,
                        type: 'bottom-right',
                        semitones: 4
                    });
                }
            }
            
            // Top-left edge
            const topLeftNodeId = `${row - 1}-${col}`;
            if (this.nodes.has(topLeftNodeId)) {
                const topLeftNode = this.nodes.get(topLeftNodeId);
                this.edges.push({
                    from: nodeId,
                    to: topLeftNodeId,
                    type: 'top-left',
                    semitones: (topLeftNode.semitone - semitone + 12) % 12
                });
            }
            
            // Bottom-left edge
            const bottomLeftNodeId = `${row + 1}-${col - 1}`;
            if (this.nodes.has(bottomLeftNodeId)) {
                const bottomLeftNode = this.nodes.get(bottomLeftNodeId);
                this.edges.push({
                    from: nodeId,
                    to: bottomLeftNodeId,
                    type: 'bottom-left',
                    semitones: (bottomLeftNode.semitone - semitone + 12) % 12
                });
            }
        });
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            let newHoveredNode = null;
            
            this.nodes.forEach((node) => {
                const distance = Math.sqrt(
                    Math.pow(mouseX - node.x, 2) + Math.pow(mouseY - node.y, 2)
                );
                
                if (distance <= this.nodeRadius) {
                    newHoveredNode = node.id;
                }
            });
            
            if (newHoveredNode !== this.hoveredNode) {
                this.hoveredNode = newHoveredNode;
                this.draw();
            }
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.hoveredNode) {
                const node = this.nodes.get(this.hoveredNode);
                console.log(`Clicked node: ${node.note} (${node.semitone} semitones)`);
                
                // Toggle selection in set
                if (this.selectedNodes.has(this.hoveredNode)) {
                    this.selectedNodes.delete(this.hoveredNode);
                } else {
                    this.selectedNodes.add(this.hoveredNode);
                }
                
                this.draw();
            }
        });
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw edges
        this.drawEdges();
        
        // Draw nodes
        this.drawNodes();
        
        // Draw tooltips for connected groups
        this.drawTooltips();
    }
    
    drawEdges() {
        this.edges.forEach((edge) => {
            const fromNode = this.nodes.get(edge.from);
            const toNode = this.nodes.get(edge.to);
            
            this.ctx.beginPath();
            this.ctx.moveTo(fromNode.x, fromNode.y);
            this.ctx.lineTo(toNode.x, toNode.y);
            
            // Different colors for different edge types - muted
            switch (edge.type) {
                case 'right':
                    this.ctx.strokeStyle = '#88AA88'; // Muted Green for +7
                    this.ctx.lineWidth = 2;
                    break;
                case 'top-right':
                    this.ctx.strokeStyle = '#7799BB'; // Muted Blue for +3
                    this.ctx.lineWidth = 1.5;
                    break;
                case 'bottom-right':
                    this.ctx.strokeStyle = '#CC9977'; // Muted Orange for +4
                    this.ctx.lineWidth = 1.5;
                    break;
                case 'top-left':
                    this.ctx.strokeStyle = '#9977AA'; // Muted Purple for top-left
                    this.ctx.lineWidth = 1.2;
                    break;
                case 'bottom-left':
                    this.ctx.strokeStyle = '#BB7799'; // Muted Pink for bottom-left
                    this.ctx.lineWidth = 1.2;
                    break;
            }
            
            this.ctx.stroke();
        });
    }
    
    drawNodes() {
        this.nodes.forEach((node) => {
            const isHovered = node.id === this.hoveredNode;
            const isSelected = this.selectedNodes.has(node.id);
            
            // Draw node circle
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, this.nodeRadius, 0, 2 * Math.PI);
            
            // Fill with note color - brighter for selected
            if (isSelected) {
                // Use bright, saturated color for selected nodes
                const brightColors = {
                    'C': '#FF4444',   'C#': '#FF6666',  'D': '#00DDDD',   'D#': '#44EEEE',
                    'E': '#0099FF',   'F': '#00CC88',   'F#': '#44DD88',  'G': '#FFCC00',
                    'G#': '#FFDD00', 'A': '#CC66CC',   'A#': '#DD88DD',  'B': '#FF6699'
                };
                this.ctx.fillStyle = brightColors[node.note];
            } else {
                this.ctx.fillStyle = this.noteColors[node.note];
            }
            this.ctx.fill();
            
            // Border - selected takes priority over hovered
            if (isSelected) {
                this.ctx.strokeStyle = '#FFFF00';
                this.ctx.lineWidth = 5;
            } else if (isHovered) {
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 3;
            } else {
                this.ctx.strokeStyle = '#555555';
                this.ctx.lineWidth = 1;
            }
            this.ctx.stroke();
            
            // Draw note name
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.note, node.x, node.y);
            
            // Draw semitone number if hovered
            if (isHovered) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '10px Arial';
                this.ctx.fillText(node.semitone.toString(), node.x, node.y + 15);
            }
        });
    }
    
    // Find connected groups of selected nodes
    getConnectedGroups() {
        const visited = new Set();
        const groups = [];
        
        for (const nodeId of this.selectedNodes) {
            if (!visited.has(nodeId)) {
                const group = [];
                const stack = [nodeId];
                
                while (stack.length > 0) {
                    const current = stack.pop();
                    if (visited.has(current)) continue;
                    
                    visited.add(current);
                    group.push(current);
                    
                    // Find connected selected nodes
                    this.edges.forEach(edge => {
                        if (edge.from === current && this.selectedNodes.has(edge.to) && !visited.has(edge.to)) {
                            stack.push(edge.to);
                        }
                        if (edge.to === current && this.selectedNodes.has(edge.from) && !visited.has(edge.from)) {
                            stack.push(edge.from);
                        }
                    });
                }
                
                if (group.length > 0) {
                    groups.push(group);
                }
            }
        }
        
        return groups;
    }
    
    // Find the top-right most node in a group
    getTopRightMostNode(group) {
        let topRightMost = null;
        let maxX = -Infinity;
        let minY = Infinity;
        
        group.forEach(nodeId => {
            const node = this.nodes.get(nodeId);
            if (node.x > maxX || (node.x === maxX && node.y < minY)) {
                maxX = node.x;
                minY = node.y;
                topRightMost = node;
            }
        });
        
        return topRightMost;
    }
    
    // Chord definitions from chord.ts
    getChordDefinitions() {
        return {
            "major": 0b000010010001,
            "minor": 0b000010001001,
            "maj7": 0b100010010001,
            "m7": 0b010010001001,
            "7": 0b010010010001,
            "7b5": 0b010001010001,
            "7#5": 0b010100010001,
            "m#7": 0b100010001001,
            "m7b5": 0b010001001001,
            "7b9": 0b010010010011,
            "b5": 0b000001010001,
            "5": 0b000010000001,
            "6": 0b001010010001,
            "m6": 0b001010001001,
            "69": 0b001010010101,
            "9": 0b010010010101,
            "9b5": 0b010001010101,
            "9#5": 0b000100010101,
            "m9": 0b010010001101,
            "maj9": 0b100010010101,
            "add9": 0b000010010101,
            "7#9": 0b010010011001,
            "11": 0b010010110101,
            "m11": 0b010010101101,
            "13": 0b011000100101,
            "maj13": 0b101010010101,
            "dim": 0b000001001001,
            "aug": 0b000100010001,
            "dim7": 0b001001001001,
            "sus2": 0b000010000101,
            "sus4": 0b000010100001,
            "7sus4": 0b010010100001,
            "9sus4": 0b010010100101
        };
    }
    
    // Convert note names to semitone numbers
    notesToSemitones(noteNames) {
        return noteNames.map(note => this.getSemitone(note));
    }
    
    // Find matching chord for given notes
    findChord(noteNames) {
        if (!noteNames || noteNames.length === 0) {
            return "No Chord Found";
        }
        
        const semitones = this.notesToSemitones(noteNames);
        const chords = this.getChordDefinitions();
        
        // Try each possible root note
        for (let root = 0; root < 12; root++) {
            // Create bitmask for input notes relative to this root
            let inputMask = 0;
            for (const semitone of semitones) {
                const relativePosition = (semitone - root + 12) % 12;
                inputMask |= (1 << relativePosition);
            }
            
            // Check if input matches any chord pattern
            for (const [chordName, chordMask] of Object.entries(chords)) {
                if (inputMask === chordMask) {
                    const rootNote = this.getNoteName(root);
                    return `${rootNote} ${chordName}`;
                }
            }
        }
        
        return "No Chord Found";
    }

    // Draw tooltips for connected groups
    drawTooltips() {
        const groups = this.getConnectedGroups();
        
        groups.forEach(group => {
            if (group.length > 1) {
                const topRightNode = this.getTopRightMostNode(group);
                if (topRightNode) {
                    // Create tooltip text with chord identification
                    const notes = group.map(nodeId => this.nodes.get(nodeId).note).sort();
                    const chord = this.findChord(notes);
                    const tooltipText = `${notes.join(', ')} - ${chord}`;
                    
                    // Position tooltip above and to the right of the node
                    const tooltipX = topRightNode.x + this.nodeRadius + 5;
                    const tooltipY = topRightNode.y - this.nodeRadius - 5;
                    
                    // Measure text to create background
                    this.ctx.font = '12px Arial';
                    const textMetrics = this.ctx.measureText(tooltipText);
                    const textWidth = textMetrics.width;
                    const textHeight = 16;
                    
                    // Draw tooltip background
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    this.ctx.fillRect(tooltipX - 4, tooltipY - textHeight - 2, textWidth + 8, textHeight + 4);
                    
                    // Draw tooltip border
                    this.ctx.strokeStyle = '#FFD700';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(tooltipX - 4, tooltipY - textHeight - 2, textWidth + 8, textHeight + 4);
                    
                    // Draw tooltip text
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.textAlign = 'left';
                    this.ctx.textBaseline = 'top';
                    this.ctx.fillText(tooltipText, tooltipX, tooltipY - textHeight);
                }
            }
        });
    }
}

// Initialize the graph when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TonnetzGraph();
});
