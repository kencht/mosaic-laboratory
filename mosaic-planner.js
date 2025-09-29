class MosaicPlanner {
    constructor() {
        this.mosaicData = null;
        this.colorGrid = null;
        this.pieces = [];
        this.optimizedLayout = null;
        this.sheetSizes = [
            { width: 30, height: 30, name: "30x30 Standard" },
            { width: 20, height: 20, name: "20x20 Small" },
            { width: 40, height: 20, name: "40x20 Rectangle" },
            { width: 25, height: 25, name: "25x25 Medium" }
        ];
        this.init();
    }
    
    init() {
        this.loadMosaicData();
        this.setupEventListeners();
        if (this.mosaicData) {
            this.analyzeMosaic();
        }
    }
    
    loadMosaicData() {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedData = urlParams.get('mosaicData');
        
        console.log('Loading mosaic data...');
        console.log('URL params:', urlParams.toString());
        
        if (encodedData) {
            try {
                this.mosaicData = JSON.parse(atob(encodedData));
                console.log('Loaded mosaic data from URL:', this.mosaicData);
            } catch (e) {
                console.error('Failed to decode mosaic data:', e);
            }
        } else {
            const storedData = localStorage.getItem('mosaicPlannerData');
            console.log('LocalStorage data:', storedData ? 'Found' : 'Not found');
            if (storedData) {
                try {
                    this.mosaicData = JSON.parse(storedData);
                    console.log('Loaded mosaic data from localStorage:', this.mosaicData);
                } catch (e) {
                    console.error('Failed to parse stored mosaic data:', e);
                }
            } else {
                console.log('No mosaic data found in localStorage');
            }
        }
        
        if (!this.mosaicData) {
            console.error('No mosaic data available');
            this.showError('No mosaic data found. Please generate a mosaic first and try again.');
        }
    }
    
    setupEventListeners() {
        document.getElementById('sheetSizeSelect')?.addEventListener('change', (e) => {
            this.optimizeLayout();
        });
        
        document.getElementById('generatePlanBtn')?.addEventListener('click', () => {
            this.generatePlan();
        });
        
        document.getElementById('exportPlanBtn')?.addEventListener('click', () => {
            this.exportPlan();
        });
        
        document.getElementById('backToMosaicBtn')?.addEventListener('click', () => {
            window.close();
            // Fallback if window.close() doesn't work
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 100);
        });
    }
    
    analyzeMosaic() {
        if (!this.mosaicData) {
            this.showError('No mosaic data available');
            return;
        }
        
        console.log('Analyzing mosaic with data:', this.mosaicData);
        
        this.colorGrid = this.createColorGrid();
        console.log('Created color grid:', this.colorGrid);
        
        if (!this.colorGrid) {
            this.showError('Failed to create color grid');
            return;
        }
        
        this.pieces = this.extractPieces();
        console.log('Extracted pieces:', this.pieces);
        
        try {
            this.renderOriginalMosaic();
            console.log('Original mosaic rendered');
            
            this.renderPiecesVisualization();
            console.log('Pieces visualization rendered');
            
            this.displayAnalysis();
            console.log('Analysis displayed');
            
            this.optimizeLayout();
            console.log('Layout optimized');
        } catch (error) {
            console.error('Error in analyzeMosaic:', error);
            this.showError('Error analyzing mosaic: ' + error.message);
        }
    }
    
    createColorGrid() {
        if (!this.mosaicData) {
            console.error('No mosaicData available');
            return null;
        }
        
        const { tileGrid } = this.mosaicData;
        console.log('Extracting tileGrid from mosaicData:', tileGrid);
        
        if (!tileGrid || !Array.isArray(tileGrid)) {
            console.error('Invalid tileGrid:', tileGrid);
            return null;
        }
        
        // The tileGrid is already in the format we need - just return it
        return tileGrid;
    }
    
    extractPieces() {
        const components = GeometryUtils.findConnectedComponents(this.colorGrid);
        const maxSheetSize = Math.max(...this.sheetSizes.map(s => Math.max(s.width, s.height)));
        
        const allPieces = [];
        
        components.forEach((component, index) => {
            if (component.area < 1) return; // Only skip if no tiles (shouldn't happen)
            
            if (component.width <= maxSheetSize && component.height <= maxSheetSize) {
                allPieces.push({
                    id: allPieces.length,
                    originalId: index,
                    ...component,
                    isCut: false
                });
            } else {
                const cuts = GeometryUtils.findOptimalCuts(component, maxSheetSize, maxSheetSize);
                cuts.forEach(cut => {
                    if (cut && cut.area >= 1) {
                        allPieces.push({
                            id: allPieces.length,
                            originalId: index,
                            ...cut,
                            isCut: true,
                            parentId: index
                        });
                    }
                });
            }
        });
        
        return allPieces;
    }
    
    renderOriginalMosaic() {
        const canvas = document.getElementById('originalCanvas');
        if (!canvas || !this.mosaicData) return;
        
        const { tileGrid, width, height } = this.mosaicData;
        const displayTileSize = Math.max(4, Math.min(12, Math.floor(400 / Math.max(width, height))));
        
        canvas.width = width * displayTileSize;
        canvas.height = height * displayTileSize;
        
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        // Draw each tile with its color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tileColor = tileGrid[y][x];
                ctx.fillStyle = tileColor;
                ctx.fillRect(x * displayTileSize, y * displayTileSize, displayTileSize, displayTileSize);
            }
        }
        
        // Draw grid lines
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= width; x++) {
            ctx.beginPath();
            ctx.moveTo(x * displayTileSize, 0);
            ctx.lineTo(x * displayTileSize, height * displayTileSize);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * displayTileSize);
            ctx.lineTo(width * displayTileSize, y * displayTileSize);
            ctx.stroke();
        }
    }
    
    renderPiecesVisualization() {
        const container = document.getElementById('piecesVisualization');
        if (!container || !this.pieces) return;
        
        if (this.pieces.length === 0) {
            container.innerHTML = '<p>No pieces found to visualize.</p>';
            return;
        }
        
        // Create a simple grid view of the first few pieces
        const maxPieces = Math.min(this.pieces.length, 12);
        const piecesHtml = this.pieces.slice(0, maxPieces).map((piece, index) => {
            return `
                <div class="piece-preview" style="display: inline-block; margin: 5px; text-align: center;">
                    <div style="font-size: 10px; margin-bottom: 2px;">Piece ${index + 1}</div>
                    <div style="width: 40px; height: 40px; background: ${piece.color}; border: 1px solid #333; position: relative;">
                        <div style="position: absolute; bottom: 0; right: 0; font-size: 8px; background: rgba(255,255,255,0.8); padding: 1px;">
                            ${piece.width}×${piece.height}
                        </div>
                    </div>
                    <div style="font-size: 8px;">${piece.area} tiles</div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = `
            <h4>Piece Previews (showing ${maxPieces} of ${this.pieces.length})</h4>
            <div>${piecesHtml}</div>
            ${this.pieces.length > maxPieces ? `<p style="font-size: 10px; margin-top: 10px;">... and ${this.pieces.length - maxPieces} more pieces</p>` : ''}
        `;
    }
    
    optimizeLayout() {
        console.log('Optimizing layout...');
        console.log('Pieces count:', this.pieces.length);
        
        if (this.pieces.length === 0) {
            console.log('No pieces to optimize');
            return;
        }
        
        const selectedSize = this.getSelectedSheetSize();
        console.log('Selected sheet size:', selectedSize);
        
        if (!selectedSize) {
            console.error('No sheet size selected');
            return;
        }
        
        console.log('Calling SheetOptimizer.optimizePlacement...');
        
        try {
            // Group pieces by color for separate sheets
            const piecesByColor = this.pieces.reduce((groups, piece) => {
                if (!groups[piece.color]) {
                    groups[piece.color] = [];
                }
                groups[piece.color].push(piece);
                return groups;
            }, {});
            
            console.log('Pieces grouped by color:', piecesByColor);
            
            // Optimize each color separately
            const colorLayouts = {};
            let totalSheets = 0;
            let totalEfficiency = 0;
            let allSheets = [];
            
            Object.entries(piecesByColor).forEach(([color, pieces]) => {
                console.log(`Nesting ${pieces.length} pieces of color ${color}`);
                
                // Use advanced shape nesting instead of simple bin packing
                const layout = ShapeNester.nestPieces(
                    pieces, 
                    selectedSize.width, 
                    selectedSize.height
                );
                
                // Add color information to sheets
                layout.sheets.forEach(sheet => {
                    sheet.color = color;
                    sheet.globalIndex = allSheets.length;
                    allSheets.push(sheet);
                });
                
                colorLayouts[color] = layout;
                totalSheets += layout.totalSheets;
                totalEfficiency += layout.efficiency * layout.totalSheets;
            });
            
            // Calculate overall efficiency
            const overallEfficiency = totalSheets > 0 ? totalEfficiency / totalSheets : 0;
            
            this.optimizedLayout = {
                sheets: allSheets,
                efficiency: overallEfficiency,
                wastePercentage: 100 - overallEfficiency,
                totalSheets: totalSheets,
                colorLayouts: colorLayouts
            };
            
            console.log('Optimization result:', this.optimizedLayout);
            
            this.displayOptimizedLayout();
            this.updateStatistics();
        } catch (error) {
            console.error('Error in optimization:', error);
            this.showError('Error optimizing layout: ' + error.message);
        }
    }
    
    generatePlan() {
        console.log('Generating plan...');
        
        if (!this.pieces || this.pieces.length === 0) {
            console.error('No pieces to plan');
            this.showError('No pieces found to plan. Please check your mosaic data.');
            return;
        }
        
        if (!this.optimizedLayout) {
            console.log('No optimized layout, creating one...');
            this.optimizeLayout();
        }
        
        if (!this.optimizedLayout) {
            console.error('Failed to create optimized layout');
            this.showError('Failed to optimize layout. Please try a different sheet size.');
            return;
        }
        
        console.log('Optimized layout:', this.optimizedLayout);
        
        const cuttingPlan = SheetOptimizer.generateCuttingPlan(this.optimizedLayout.sheets);
        console.log('Cutting plan:', cuttingPlan);
        
        this.renderSheetLayouts();
        
        // Update the instructions
        this.updatePlanningInstructions();
    }
    
    displayAnalysis() {
        const analysisDiv = document.getElementById('analysisResults');
        if (!analysisDiv) return;
        
        // Count tiles by color from the actual mosaic grid
        const actualTileCounts = {};
        let totalTiles = 0;
        
        for (let y = 0; y < this.colorGrid.length; y++) {
            for (let x = 0; x < this.colorGrid[y].length; x++) {
                const color = this.colorGrid[y][x];
                actualTileCounts[color] = (actualTileCounts[color] || 0) + 1;
                totalTiles++;
            }
        }
        
        // Count pieces (connected components)
        const pieceColorCounts = this.pieces.reduce((counts, piece) => {
            counts[piece.color] = (counts[piece.color] || 0) + 1;
            return counts;
        }, {});
        
        const totalPieceArea = this.pieces.reduce((sum, piece) => sum + piece.area, 0);
        const cutPieces = this.pieces.filter(piece => piece.isCut).length;
        
        analysisDiv.innerHTML = `
            <h3>Mosaic Analysis</h3>
            <div class="analysis-grid">
                <div class="stat-item">
                    <span class="stat-label">Mosaic Size:</span>
                    <span class="stat-value">${this.mosaicData.width} × ${this.mosaicData.height}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Tiles:</span>
                    <span class="stat-value">${totalTiles}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Connected Pieces:</span>
                    <span class="stat-value">${this.pieces.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Cut Pieces:</span>
                    <span class="stat-value">${cutPieces}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Piece Area Total:</span>
                    <span class="stat-value">${totalPieceArea} tiles</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Colors Used:</span>
                    <span class="stat-value">${Object.keys(actualTileCounts).length}</span>
                </div>
            </div>
            <div class="color-breakdown">
                <h4>Tile Distribution by Color:</h4>
                ${Object.entries(actualTileCounts).map(([color, count]) => `
                    <div class="color-item">
                        <div class="color-swatch" style="background-color: ${color}"></div>
                        <span>${count} tiles</span>
                    </div>
                `).join('')}
                <h4>Connected Pieces by Color:</h4>
                ${Object.entries(pieceColorCounts).map(([color, count]) => `
                    <div class="color-item">
                        <div class="color-swatch" style="background-color: ${color}"></div>
                        <span>${count} pieces</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    displayOptimizedLayout() {
        const layoutDiv = document.getElementById('layoutResults');
        if (!layoutDiv || !this.optimizedLayout) return;
        
        layoutDiv.innerHTML = `
            <h3>Optimized Layout</h3>
            <div class="layout-summary">
                <div class="summary-item">
                    <span class="summary-label">Total Sheets:</span>
                    <span class="summary-value">${this.optimizedLayout.totalSheets}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Efficiency:</span>
                    <span class="summary-value">${this.optimizedLayout.efficiency.toFixed(1)}%</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Waste:</span>
                    <span class="summary-value">${this.optimizedLayout.wastePercentage.toFixed(1)}%</span>
                </div>
            </div>
        `;
    }
    
    updateStatistics() {
        const statsDiv = document.getElementById('statistics');
        if (!statsDiv || !this.optimizedLayout) return;
        
        const selectedSize = this.getSelectedSheetSize();
        const totalSheetArea = this.optimizedLayout.totalSheets * selectedSize.width * selectedSize.height;
        const usedArea = this.pieces.reduce((sum, piece) => sum + piece.area, 0);
        
        statsDiv.innerHTML = `
            <h3>Planning Statistics</h3>
            <div class="stats-grid">
                <div class="stat-row">
                    <span>Sheet Size:</span>
                    <span>${selectedSize.name}</span>
                </div>
                <div class="stat-row">
                    <span>Total Sheets Needed:</span>
                    <span>${this.optimizedLayout.totalSheets}</span>
                </div>
                <div class="stat-row">
                    <span>Total Sheet Area:</span>
                    <span>${totalSheetArea} tiles</span>
                </div>
                <div class="stat-row">
                    <span>Used Area:</span>
                    <span>${usedArea} tiles</span>
                </div>
                <div class="stat-row">
                    <span>Wasted Area:</span>
                    <span>${totalSheetArea - usedArea} tiles</span>
                </div>
                <div class="stat-row highlight">
                    <span>Material Efficiency:</span>
                    <span>${this.optimizedLayout.efficiency.toFixed(1)}%</span>
                </div>
            </div>
        `;
    }
    
    renderSheetLayouts() {
        const container = document.getElementById('sheetLayouts');
        if (!container || !this.optimizedLayout) return;
        
        container.innerHTML = `
            <h3>Sheet Cutting Layouts</h3>
            <div class="sheets-grid"></div>
        `;
        
        const sheetsGrid = container.querySelector('.sheets-grid');
        
        this.optimizedLayout.sheets.forEach((sheet, index) => {
            const sheetDiv = this.createSheetVisualization(sheet, index);
            sheetsGrid.appendChild(sheetDiv);
        });
    }
    
    createSheetVisualization(sheet, index) {
        const sheetDiv = document.createElement('div');
        sheetDiv.className = 'sheet-layout';
        
        const scale = 20; // Scale for SVG units
        const svgWidth = sheet.width * scale;
        const svgHeight = sheet.height * scale;
        
        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', svgWidth);
        svg.setAttribute('height', svgHeight);
        svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
        svg.style.border = '2px solid #333';
        svg.style.margin = '10px';
        svg.style.maxWidth = '300px';
        svg.style.maxHeight = '300px';
        svg.style.background = '#f0f0f0';
        
        // Add background rectangle
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', svgWidth);
        background.setAttribute('height', svgHeight);
        background.setAttribute('fill', '#f0f0f0');
        svg.appendChild(background);
        
        sheet.pieces.forEach(piece => {
            const pieceData = piece.originalPiece;
            
            if (pieceData && pieceData.pieceGrid) {
                // Draw the actual shape of the piece
                for (let py = 0; py < pieceData.height; py++) {
                    for (let px = 0; px < pieceData.width; px++) {
                        if (pieceData.pieceGrid[py] && pieceData.pieceGrid[py][px]) {
                            // Handle rotation if needed
                            let drawX, drawY;
                            if (piece.rotated) {
                                drawX = piece.x + py;
                                drawY = piece.y + (pieceData.width - 1 - px);
                            } else {
                                drawX = piece.x + px;
                                drawY = piece.y + py;
                            }
                            
                            // Create tile rectangle
                            const tile = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                            tile.setAttribute('x', drawX * scale);
                            tile.setAttribute('y', drawY * scale);
                            tile.setAttribute('width', scale);
                            tile.setAttribute('height', scale);
                            tile.setAttribute('fill', piece.color);
                            svg.appendChild(tile);
                            
                            // Add contrasting outline only for perimeter tiles
                            if (this.isEdgeTile(pieceData.pieceGrid, px, py)) {
                                const contrastColor = this.getContrastingColor(piece.color);
                                const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                                outline.setAttribute('x', drawX * scale);
                                outline.setAttribute('y', drawY * scale);
                                outline.setAttribute('width', scale);
                                outline.setAttribute('height', scale);
                                outline.setAttribute('fill', 'none');
                                outline.setAttribute('stroke', contrastColor);
                                outline.setAttribute('stroke-width', '1');
                                svg.appendChild(outline);
                            }
                        }
                    }
                }
                
                // Add thick black outline around the entire piece shape
                this.drawThickShapeOutlineSVG(svg, piece, pieceData, scale);
            } else {
                // Fallback to rectangle if no shape data
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', piece.x * scale);
                rect.setAttribute('y', piece.y * scale);
                rect.setAttribute('width', piece.width * scale);
                rect.setAttribute('height', piece.height * scale);
                rect.setAttribute('fill', piece.color);
                rect.setAttribute('stroke', '#000');
                rect.setAttribute('stroke-width', '8');
                svg.appendChild(rect);
            }
            
            // Draw piece number
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', (piece.x + piece.width/2) * scale);
            text.setAttribute('y', (piece.y + piece.height/2) * scale + 3);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-family', 'Arial');
            text.setAttribute('font-size', '14');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('fill', '#000');
            text.textContent = piece.id + 1;
            svg.appendChild(text);
        });
        
        const header = document.createElement('div');
        header.innerHTML = `
            <h4>Sheet ${index + 1} - ${sheet.color || 'Mixed Colors'}</h4>
            <p>Pieces: ${sheet.pieces.length} | Color: <span style="display:inline-block;width:20px;height:20px;background:${sheet.color};border:1px solid #333;vertical-align:middle;"></span> | Efficiency: ${((sheet.pieces.reduce((sum, p) => sum + p.area, 0) / (sheet.width * sheet.height)) * 100).toFixed(1)}%</p>
        `;
        
        sheetDiv.appendChild(header);
        sheetDiv.appendChild(svg);
        
        return sheetDiv;
    }
    
    drawThickShapeOutlineSVG(svg, piece, pieceData, scale) {
        if (!pieceData || !pieceData.pieceGrid) {
            // Simple rectangle outline for fallback - already handled above
            return;
        }
        
        // Create path element for the thick outline
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#000000');
        path.setAttribute('stroke-width', '8');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        
        // Find all edge segments and create path data
        const edgeSegments = this.findEdgeSegments(pieceData, piece, scale);
        let pathData = '';
        
        for (const segment of edgeSegments) {
            if (segment.length > 0) {
                pathData += `M ${segment[0].x} ${segment[0].y} `;
                for (let i = 1; i < segment.length; i++) {
                    pathData += `L ${segment[i].x} ${segment[i].y} `;
                }
            }
        }
        
        if (pathData) {
            path.setAttribute('d', pathData);
            svg.appendChild(path);
        }
    }
    
    getContrastingColor(hexColor) {
        // Convert hex to RGB
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return white for dark colors, black for light colors
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }
    
    drawThickShapeOutline(ctx, piece, pieceData, scale) {
        if (!pieceData || !pieceData.pieceGrid) {
            // Simple rectangle outline for fallback
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 8;
            ctx.strokeRect(piece.x * scale, piece.y * scale, 
                          piece.width * scale, piece.height * scale);
            return;
        }
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Create a single continuous path for the perimeter
        ctx.beginPath();
        
        // Find all edge segments and draw them as connected lines
        const edgeSegments = this.findEdgeSegments(pieceData, piece, scale);
        
        for (const segment of edgeSegments) {
            if (segment.length > 0) {
                ctx.moveTo(segment[0].x, segment[0].y);
                for (let i = 1; i < segment.length; i++) {
                    ctx.lineTo(segment[i].x, segment[i].y);
                }
            }
        }
        
        ctx.stroke();
    }
    
    findEdgeSegments(pieceData, piece, scale) {
        const segments = [];
        const processedEdges = new Set();
        
        // For simplicity, let's just draw the bounding rectangle of each filled tile's edges
        // This creates a connected outline
        for (let py = 0; py < pieceData.height; py++) {
            for (let px = 0; px < pieceData.width; px++) {
                if (pieceData.pieceGrid[py] && pieceData.pieceGrid[py][px]) {
                    let drawX, drawY;
                    
                    if (piece.rotated) {
                        drawX = piece.x + py;
                        drawY = piece.y + (pieceData.width - 1 - px);
                    } else {
                        drawX = piece.x + px;
                        drawY = piece.y + py;
                    }
                    
                    // Add the perimeter edges for this tile
                    this.addTileEdges(pieceData.pieceGrid, px, py, drawX, drawY, scale, segments);
                }
            }
        }
        
        return segments;
    }
    
    addTileEdges(grid, px, py, drawX, drawY, scale, segments) {
        const height = grid.length;
        const width = grid[0].length;
        
        // Check each edge and add to segments if it's on the perimeter
        const edges = [
            {dx: 0, dy: -1, coords: [{x: drawX * scale, y: drawY * scale}, {x: (drawX + 1) * scale, y: drawY * scale}]}, // Top
            {dx: 1, dy: 0, coords: [{x: (drawX + 1) * scale, y: drawY * scale}, {x: (drawX + 1) * scale, y: (drawY + 1) * scale}]}, // Right
            {dx: 0, dy: 1, coords: [{x: (drawX + 1) * scale, y: (drawY + 1) * scale}, {x: drawX * scale, y: (drawY + 1) * scale}]}, // Bottom
            {dx: -1, dy: 0, coords: [{x: drawX * scale, y: (drawY + 1) * scale}, {x: drawX * scale, y: drawY * scale}]} // Left
        ];
        
        for (const edge of edges) {
            const nx = px + edge.dx;
            const ny = py + edge.dy;
            
            // If adjacent cell is empty or out of bounds, this is a perimeter edge
            if (nx < 0 || nx >= width || ny < 0 || ny >= height || 
                !grid[ny] || !grid[ny][nx]) {
                segments.push(edge.coords);
            }
        }
    }
    
    drawThickEdgesForTile(ctx, grid, px, py, drawX, drawY, scale, rotated) {
        const height = grid.length;
        const width = grid[0].length;
        
        // Check each direction and draw thick line if adjacent is empty
        const edges = [
            {dx: 0, dy: -1, line: () => { // Top edge
                ctx.beginPath();
                ctx.moveTo(drawX * scale, drawY * scale);
                ctx.lineTo((drawX + 1) * scale, drawY * scale);
                ctx.stroke();
            }},
            {dx: 1, dy: 0, line: () => { // Right edge
                ctx.beginPath();
                ctx.moveTo((drawX + 1) * scale, drawY * scale);
                ctx.lineTo((drawX + 1) * scale, (drawY + 1) * scale);
                ctx.stroke();
            }},
            {dx: 0, dy: 1, line: () => { // Bottom edge
                ctx.beginPath();
                ctx.moveTo(drawX * scale, (drawY + 1) * scale);
                ctx.lineTo((drawX + 1) * scale, (drawY + 1) * scale);
                ctx.stroke();
            }},
            {dx: -1, dy: 0, line: () => { // Left edge
                ctx.beginPath();
                ctx.moveTo(drawX * scale, drawY * scale);
                ctx.lineTo(drawX * scale, (drawY + 1) * scale);
                ctx.stroke();
            }}
        ];
        
        for (const edge of edges) {
            const nx = px + edge.dx;
            const ny = py + edge.dy;
            
            // If adjacent cell is empty or out of bounds, draw the edge
            if (nx < 0 || nx >= width || ny < 0 || ny >= height || 
                !grid[ny] || !grid[ny][nx]) {
                edge.line();
            }
        }
    }
    
    findShapePerimeter(pieceData, piece) {
        const perimeter = [];
        
        for (let py = 0; py < pieceData.height; py++) {
            for (let px = 0; px < pieceData.width; px++) {
                if (pieceData.pieceGrid[py] && pieceData.pieceGrid[py][px]) {
                    // Check if this is an edge tile
                    if (this.isEdgeTile(pieceData.pieceGrid, px, py)) {
                        let drawX, drawY;
                        
                        if (piece.rotated) {
                            drawX = piece.x + py;
                            drawY = piece.y + (pieceData.width - 1 - px);
                        } else {
                            drawX = piece.x + px;
                            drawY = piece.y + py;
                        }
                        
                        perimeter.push({ x: drawX, y: drawY, originalX: px, originalY: py });
                    }
                }
            }
        }
        
        return perimeter;
    }
    
    groupPerimeterIntoLines(perimeter) {
        // For now, return each point as its own "line" for a dotted outline effect
        // This could be enhanced to trace actual continuous perimeter lines
        return perimeter.map(point => [point]);
    }
    
    drawPieceOutline(ctx, piece, pieceData, scale) {
        if (!pieceData || !pieceData.pieceGrid) return;
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        
        // Draw outline by checking edges
        for (let py = 0; py < pieceData.height; py++) {
            for (let px = 0; px < pieceData.width; px++) {
                if (pieceData.pieceGrid[py] && pieceData.pieceGrid[py][px]) {
                    let drawX, drawY;
                    
                    if (piece.rotated) {
                        drawX = piece.x + py;
                        drawY = piece.y + (pieceData.width - 1 - px);
                    } else {
                        drawX = piece.x + px;
                        drawY = piece.y + py;
                    }
                    
                    // Check if this tile is on the edge of the piece
                    const isEdge = this.isEdgeTile(pieceData.pieceGrid, px, py, piece.rotated, pieceData.width, pieceData.height);
                    
                    if (isEdge) {
                        ctx.strokeRect(drawX * scale, drawY * scale, scale, scale);
                    }
                }
            }
        }
    }
    
    isEdgeTile(grid, x, y, rotated, originalWidth, originalHeight) {
        const height = grid.length;
        const width = grid[0].length;
        
        // Check if any adjacent tile is empty or out of bounds
        const directions = [
            {dx: -1, dy: 0}, {dx: 1, dy: 0},
            {dx: 0, dy: -1}, {dx: 0, dy: 1}
        ];
        
        for (const {dx, dy} of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx < 0 || nx >= width || ny < 0 || ny >= height || 
                !grid[ny] || !grid[ny][nx]) {
                return true;
            }
        }
        
        return false;
    }
    
    exportPlan() {
        if (!this.optimizedLayout) return;
        
        const planData = {
            timestamp: new Date().toISOString(),
            sheetSize: this.getSelectedSheetSize(),
            statistics: {
                totalSheets: this.optimizedLayout.totalSheets,
                efficiency: this.optimizedLayout.efficiency,
                wastePercentage: this.optimizedLayout.wastePercentage
            },
            cuttingPlan: SheetOptimizer.generateCuttingPlan(this.optimizedLayout.sheets)
        };
        
        const dataStr = JSON.stringify(planData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `mosaic-cutting-plan-${Date.now()}.json`;
        link.click();
    }
    
    getSelectedSheetSize() {
        const select = document.getElementById('sheetSizeSelect');
        if (!select) return this.sheetSizes[0];
        
        const selectedIndex = parseInt(select.value) || 0;
        return this.sheetSizes[selectedIndex];
    }
    
    findClosestColor(targetColor, colorPalette) {
        let closestColor = colorPalette[0];
        let minDistance = Infinity;
        
        const targetRgb = this.hexToRgb(targetColor);
        
        colorPalette.forEach(color => {
            const rgb = this.hexToRgb(color);
            const distance = Math.sqrt(
                Math.pow(targetRgb.r - rgb.r, 2) +
                Math.pow(targetRgb.g - rgb.g, 2) +
                Math.pow(targetRgb.b - rgb.b, 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = color;
            }
        });
        
        return closestColor;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }
    
    updatePlanningInstructions() {
        const instructionsDiv = document.querySelector('.instructions-panel');
        if (!instructionsDiv || !this.optimizedLayout) return;
        
        const colorCount = Object.keys(this.optimizedLayout.colorLayouts).length;
        
        instructionsDiv.innerHTML = `
            <h3>Cutting Plan Generated!</h3>
            <div class="cutting-summary">
                <h4>Summary:</h4>
                <ul>
                    <li><strong>Total Sheets Needed:</strong> ${this.optimizedLayout.totalSheets}</li>
                    <li><strong>Colors:</strong> ${colorCount} (each color on separate sheets)</li>
                    <li><strong>Overall Efficiency:</strong> ${this.optimizedLayout.efficiency.toFixed(1)}%</li>
                    <li><strong>Material Waste:</strong> ${this.optimizedLayout.wastePercentage.toFixed(1)}%</li>
                </ul>
            </div>
            <div class="cutting-instructions">
                <h4>Cutting Instructions:</h4>
                <ol>
                    <li>Each color has its own dedicated sheet(s) below</li>
                    <li>Cut pieces according to the layout shown</li>
                    <li>Each piece is numbered - match the number to its position in the original mosaic</li>
                    <li>Keep pieces organized by color during cutting</li>
                    <li>Rotated pieces are marked in the layout</li>
                </ol>
            </div>
        `;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new MosaicPlanner();
});