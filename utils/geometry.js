class GeometryUtils {
    static floodFill(colorGrid, startX, startY, targetColor, visited = null) {
        const width = colorGrid[0].length;
        const height = colorGrid.length;
        
        if (visited === null) {
            visited = Array(height).fill().map(() => Array(width).fill(false));
        }
        
        if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
            return [];
        }
        
        if (visited[startY][startX] || colorGrid[startY][startX] !== targetColor) {
            return [];
        }
        
        const component = [];
        const stack = [{x: startX, y: startY}];
        
        while (stack.length > 0) {
            const {x, y} = stack.pop();
            
            if (x < 0 || x >= width || y < 0 || y >= height || 
                visited[y][x] || colorGrid[y][x] !== targetColor) {
                continue;
            }
            
            visited[y][x] = true;
            component.push({x, y});
            
            stack.push({x: x + 1, y});
            stack.push({x: x - 1, y});
            stack.push({x, y: y + 1});
            stack.push({x, y: y - 1});
        }
        
        return component;
    }
    
    static findConnectedComponents(colorGrid) {
        if (!colorGrid || !Array.isArray(colorGrid) || colorGrid.length === 0) {
            console.error('Invalid colorGrid:', colorGrid);
            return [];
        }
        
        if (!Array.isArray(colorGrid[0])) {
            console.error('Invalid colorGrid format - first row is not an array:', colorGrid[0]);
            return [];
        }
        
        const width = colorGrid[0].length;
        const height = colorGrid.length;
        const visited = Array(height).fill().map(() => Array(width).fill(false));
        const components = [];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (!visited[y][x]) {
                    const component = this.floodFill(colorGrid, x, y, colorGrid[y][x], visited);
                    if (component.length > 0) {
                        const bounds = this.calculateBounds(component);
                        const pieceGrid = this.createPieceGrid(component, bounds);
                        components.push({
                            color: colorGrid[y][x],
                            pixels: component,
                            pieceGrid: pieceGrid,
                            ...bounds
                        });
                    }
                }
            }
        }
        
        return components;
    }
    
    static calculateBounds(pixels) {
        if (pixels.length === 0) return {minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, area: 0};
        
        let minX = pixels[0].x;
        let maxX = pixels[0].x;
        let minY = pixels[0].y;
        let maxY = pixels[0].y;
        
        for (const pixel of pixels) {
            minX = Math.min(minX, pixel.x);
            maxX = Math.max(maxX, pixel.x);
            minY = Math.min(minY, pixel.y);
            maxY = Math.max(maxY, pixel.y);
        }
        
        return {
            minX,
            minY,
            maxX,
            maxY,
            width: maxX - minX + 1,
            height: maxY - minY + 1,
            area: pixels.length
        };
    }
    
    static createPieceGrid(pixels, bounds) {
        const grid = Array(bounds.height).fill().map(() => Array(bounds.width).fill(false));
        
        for (const pixel of pixels) {
            const localX = pixel.x - bounds.minX;
            const localY = pixel.y - bounds.minY;
            grid[localY][localX] = true;
        }
        
        return grid;
    }
    
    static findOptimalCuts(piece, maxWidth, maxHeight) {
        const {width, height, pixels} = piece;
        
        if (width <= maxWidth && height <= maxHeight) {
            return [piece];
        }
        
        const cuts = [];
        
        if (width > maxWidth) {
            const cutLines = this.findVerticalCutLines(piece, maxWidth);
            for (const cutX of cutLines) {
                const leftPiece = this.extractPiecePart(piece, 0, 0, cutX, height);
                const rightPiece = this.extractPiecePart(piece, cutX, 0, width - cutX, height);
                
                cuts.push(...this.findOptimalCuts(leftPiece, maxWidth, maxHeight));
                cuts.push(...this.findOptimalCuts(rightPiece, maxWidth, maxHeight));
            }
        }
        
        if (height > maxHeight) {
            const cutLines = this.findHorizontalCutLines(piece, maxHeight);
            for (const cutY of cutLines) {
                const topPiece = this.extractPiecePart(piece, 0, 0, width, cutY);
                const bottomPiece = this.extractPiecePart(piece, 0, cutY, width, height - cutY);
                
                cuts.push(...this.findOptimalCuts(topPiece, maxWidth, maxHeight));
                cuts.push(...this.findOptimalCuts(bottomPiece, maxWidth, maxHeight));
            }
        }
        
        return cuts.length > 0 ? cuts : [piece];
    }
    
    static findVerticalCutLines(piece, maxWidth) {
        const {width} = piece;
        const numCuts = Math.ceil(width / maxWidth) - 1;
        const cutLines = [];
        
        for (let i = 1; i <= numCuts; i++) {
            cutLines.push(Math.floor((width / (numCuts + 1)) * i));
        }
        
        return cutLines;
    }
    
    static findHorizontalCutLines(piece, maxHeight) {
        const {height} = piece;
        const numCuts = Math.ceil(height / maxHeight) - 1;
        const cutLines = [];
        
        for (let i = 1; i <= numCuts; i++) {
            cutLines.push(Math.floor((height / (numCuts + 1)) * i));
        }
        
        return cutLines;
    }
    
    static extractPiecePart(piece, startX, startY, width, height) {
        const {pixels, color, minX, minY} = piece;
        const endX = startX + width;
        const endY = startY + height;
        
        const newPixels = pixels.filter(pixel => {
            const localX = pixel.x - minX;
            const localY = pixel.y - minY;
            return localX >= startX && localX < endX && localY >= startY && localY < endY;
        });
        
        if (newPixels.length === 0) return null;
        
        return {
            color,
            pixels: newPixels,
            ...this.calculateBounds(newPixels)
        };
    }
    
    static calculateWastage(pieces, sheetWidth, sheetHeight) {
        const totalPieceArea = pieces.reduce((sum, piece) => sum + piece.area, 0);
        const totalSheetArea = pieces.length * sheetWidth * sheetHeight;
        return ((totalSheetArea - totalPieceArea) / totalSheetArea) * 100;
    }
    
    static rotatePiece(piece) {
        const {pixels, color} = piece;
        const rotatedPixels = pixels.map(pixel => ({
            x: pixel.y,
            y: -pixel.x
        }));
        
        const bounds = this.calculateBounds(rotatedPixels);
        const normalizedPixels = rotatedPixels.map(pixel => ({
            x: pixel.x - bounds.minX,
            y: pixel.y - bounds.minY
        }));
        
        return {
            color,
            pixels: normalizedPixels,
            ...this.calculateBounds(normalizedPixels)
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeometryUtils;
}