class ShapeNester {
    static nestPieces(pieces, sheetWidth, sheetHeight) {
        // Sort pieces by area, largest first
        const sortedPieces = [...pieces].sort((a, b) => b.area - a.area);
        
        const sheets = [];
        const unplacedPieces = [...sortedPieces];
        
        while (unplacedPieces.length > 0) {
            const sheet = this.createNewSheet(sheetWidth, sheetHeight);
            this.packPiecesIntoSheet(sheet, unplacedPieces);
            sheets.push(sheet);
        }
        
        return {
            sheets,
            totalSheets: sheets.length,
            efficiency: this.calculateOverallEfficiency(sheets, sheetWidth, sheetHeight)
        };
    }
    
    static createNewSheet(width, height) {
        return {
            width,
            height,
            pieces: [],
            occupiedGrid: Array(height).fill().map(() => Array(width).fill(false))
        };
    }
    
    static packPiecesIntoSheet(sheet, unplacedPieces) {
        const placedIndices = [];
        
        for (let i = 0; i < unplacedPieces.length; i++) {
            const piece = unplacedPieces[i];
            
            // Try to find a place for this piece
            const placement = this.findBestPlacement(sheet, piece);
            
            if (placement) {
                // Place the piece
                console.log(`Placing piece ${i}: ${piece.width}x${piece.height} at (${placement.x}, ${placement.y})`);
                this.placePieceOnSheet(sheet, piece, placement);
                placedIndices.push(i);
                
                // Try to nest smaller pieces inside this piece if it has cavities
                this.tryNestingInside(sheet, piece, placement, unplacedPieces, placedIndices);
            }
        }
        
        // Remove placed pieces from unplaced list (in reverse order to maintain indices)
        for (let i = placedIndices.length - 1; i >= 0; i--) {
            unplacedPieces.splice(placedIndices[i], 1);
        }
    }
    
    static findBestPlacement(sheet, piece) {
        // Try different positions and rotations
        const rotations = [false, true];
        
        for (const rotated of rotations) {
            const [width, height] = rotated ? [piece.height, piece.width] : [piece.width, piece.height];
            
            if (width > sheet.width || height > sheet.height) continue;
            
            // Try different positions
            for (let y = 0; y <= sheet.height - height; y++) {
                for (let x = 0; x <= sheet.width - width; x++) {
                    if (this.canPlacePiece(sheet, piece, x, y, rotated)) {
                        return { x, y, rotated, width, height };
                    }
                }
            }
        }
        
        return null;
    }
    
    static canPlacePiece(sheet, piece, x, y, rotated) {
        const [width, height] = rotated ? [piece.height, piece.width] : [piece.width, piece.height];
        
        // Check bounds first
        if (x < 0 || y < 0 || x + width > sheet.width || y + height > sheet.height) {
            return false;
        }
        
        if (!piece.pieceGrid) {
            // Simple rectangular check
            for (let py = 0; py < height; py++) {
                for (let px = 0; px < width; px++) {
                    if (sheet.occupiedGrid[y + py][x + px]) {
                        return false;
                    }
                }
            }
            return true;
        }
        
        // Check actual shape with proper bounds checking
        for (let py = 0; py < piece.height; py++) {
            for (let px = 0; px < piece.width; px++) {
                if (piece.pieceGrid[py] && piece.pieceGrid[py][px]) {
                    let checkX, checkY;
                    
                    if (rotated) {
                        checkX = x + py;
                        checkY = y + (piece.width - 1 - px);
                    } else {
                        checkX = x + px;
                        checkY = y + py;
                    }
                    
                    // Double check bounds
                    if (checkX < 0 || checkY < 0 || 
                        checkX >= sheet.width || checkY >= sheet.height || 
                        sheet.occupiedGrid[checkY][checkX]) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    static placePieceOnSheet(sheet, piece, placement) {
        const { x, y, rotated, width, height } = placement;
        
        // Mark occupied spaces with bounds checking
        if (!piece.pieceGrid) {
            // Simple rectangular placement
            for (let py = 0; py < height; py++) {
                for (let px = 0; px < width; px++) {
                    const placeY = y + py;
                    const placeX = x + px;
                    if (placeY >= 0 && placeY < sheet.height && 
                        placeX >= 0 && placeX < sheet.width) {
                        sheet.occupiedGrid[placeY][placeX] = true;
                    }
                }
            }
        } else {
            // Place actual shape
            for (let py = 0; py < piece.height; py++) {
                for (let px = 0; px < piece.width; px++) {
                    if (piece.pieceGrid[py] && piece.pieceGrid[py][px]) {
                        let placeX, placeY;
                        
                        if (rotated) {
                            placeX = x + py;
                            placeY = y + (piece.width - 1 - px);
                        } else {
                            placeX = x + px;
                            placeY = y + py;
                        }
                        
                        // Bounds check before marking
                        if (placeY >= 0 && placeY < sheet.height && 
                            placeX >= 0 && placeX < sheet.width) {
                            sheet.occupiedGrid[placeY][placeX] = true;
                        }
                    }
                }
            }
        }
        
        // Add to pieces list
        sheet.pieces.push({
            ...piece,
            x,
            y,
            width,
            height,
            rotated,
            originalPiece: piece
        });
    }
    
    static tryNestingInside(sheet, containerPiece, containerPlacement, unplacedPieces, placedIndices) {
        if (!containerPiece.pieceGrid) return; // Can't nest inside simple rectangles
        
        // Find internal cavities in the container piece
        const cavities = this.findInternalCavities(containerPiece, containerPlacement);
        
        for (const cavity of cavities) {
            // Try to fit remaining pieces in this cavity
            for (let i = 0; i < unplacedPieces.length; i++) {
                if (placedIndices.includes(i)) continue;
                
                const smallPiece = unplacedPieces[i];
                
                if (this.canFitInCavity(smallPiece, cavity)) {
                    const nestedPlacement = this.findCavityPlacement(sheet, smallPiece, cavity);
                    
                    if (nestedPlacement) {
                        this.placePieceOnSheet(sheet, smallPiece, nestedPlacement);
                        placedIndices.push(i);
                        break; // One piece per cavity for simplicity
                    }
                }
            }
        }
    }
    
    static findInternalCavities(piece, placement) {
        if (!piece.pieceGrid) return [];
        
        const cavities = [];
        const visited = Array(piece.height).fill().map(() => Array(piece.width).fill(false));
        
        // Look for empty spaces (holes) inside the piece
        for (let y = 1; y < piece.height - 1; y++) {
            for (let x = 1; x < piece.width - 1; x++) {
                if (!piece.pieceGrid[y][x] && !visited[y][x]) {
                    // Found an empty space, flood fill to find the cavity
                    const cavity = this.floodFillCavity(piece.pieceGrid, x, y, visited);
                    
                    if (cavity.length > 4) { // Only consider cavities larger than 4 tiles
                        const bounds = this.calculateCavityBounds(cavity);
                        
                        // Translate to sheet coordinates
                        cavities.push({
                            pixels: cavity,
                            bounds: {
                                ...bounds,
                                minX: bounds.minX + placement.x,
                                minY: bounds.minY + placement.y,
                                maxX: bounds.maxX + placement.x,
                                maxY: bounds.maxY + placement.y
                            }
                        });
                    }
                }
            }
        }
        
        return cavities;
    }
    
    static floodFillCavity(grid, startX, startY, visited) {
        const cavity = [];
        const stack = [{x: startX, y: startY}];
        const height = grid.length;
        const width = grid[0].length;
        
        while (stack.length > 0) {
            const {x, y} = stack.pop();
            
            if (x < 0 || x >= width || y < 0 || y >= height || 
                visited[y][x] || grid[y][x]) {
                continue;
            }
            
            visited[y][x] = true;
            cavity.push({x, y});
            
            stack.push({x: x + 1, y});
            stack.push({x: x - 1, y});
            stack.push({x, y: y + 1});
            stack.push({x, y: y - 1});
        }
        
        return cavity;
    }
    
    static calculateCavityBounds(cavity) {
        let minX = cavity[0].x, maxX = cavity[0].x;
        let minY = cavity[0].y, maxY = cavity[0].y;
        
        for (const pixel of cavity) {
            minX = Math.min(minX, pixel.x);
            maxX = Math.max(maxX, pixel.x);
            minY = Math.min(minY, pixel.y);
            maxY = Math.max(maxY, pixel.y);
        }
        
        return {
            minX, minY, maxX, maxY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
    }
    
    static canFitInCavity(piece, cavity) {
        return piece.width <= cavity.bounds.width && 
               piece.height <= cavity.bounds.height;
    }
    
    static findCavityPlacement(sheet, piece, cavity) {
        // Try to place the piece within the cavity bounds
        const startX = cavity.bounds.minX;
        const startY = cavity.bounds.minY;
        const endX = cavity.bounds.maxX - piece.width + 1;
        const endY = cavity.bounds.maxY - piece.height + 1;
        
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (this.canPlacePiece(sheet, piece, x, y, false)) {
                    return { x, y, rotated: false, width: piece.width, height: piece.height };
                }
            }
        }
        
        return null;
    }
    
    static calculateOverallEfficiency(sheets, sheetWidth, sheetHeight) {
        const totalSheetArea = sheets.length * sheetWidth * sheetHeight;
        const totalUsedArea = sheets.reduce((sum, sheet) => 
            sum + sheet.pieces.reduce((pieceSum, piece) => pieceSum + piece.area, 0), 0);
        
        return totalSheetArea > 0 ? (totalUsedArea / totalSheetArea) * 100 : 0;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShapeNester;
}