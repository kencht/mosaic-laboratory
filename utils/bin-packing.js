class BinPacker {
    constructor(binWidth, binHeight) {
        this.binWidth = binWidth;
        this.binHeight = binHeight;
        this.bins = [];
    }
    
    pack(items) {
        const sortedItems = [...items].sort((a, b) => {
            const areaA = a.width * a.height;
            const areaB = b.width * b.height;
            return areaB - areaA;
        });
        
        const packedItems = [];
        
        for (const item of sortedItems) {
            const placement = this.findPlacement(item);
            if (placement) {
                packedItems.push({
                    ...item,
                    binIndex: placement.binIndex,
                    x: placement.x,
                    y: placement.y,
                    rotated: placement.rotated
                });
            } else {
                const newBinIndex = this.bins.length;
                this.bins.push(new Bin(this.binWidth, this.binHeight));
                const newPlacement = this.bins[newBinIndex].insert(item);
                if (newPlacement) {
                    packedItems.push({
                        ...item,
                        binIndex: newBinIndex,
                        x: newPlacement.x,
                        y: newPlacement.y,
                        rotated: newPlacement.rotated
                    });
                }
            }
        }
        
        return {
            packedItems,
            bins: this.bins,
            efficiency: this.calculateEfficiency(packedItems)
        };
    }
    
    findPlacement(item) {
        for (let i = 0; i < this.bins.length; i++) {
            const placement = this.bins[i].insert(item);
            if (placement) {
                return {
                    binIndex: i,
                    ...placement
                };
            }
        }
        return null;
    }
    
    calculateEfficiency(packedItems) {
        if (this.bins.length === 0) return 0;
        
        const totalBinArea = this.bins.length * this.binWidth * this.binHeight;
        const totalItemArea = packedItems.reduce((sum, item) => sum + item.area, 0);
        
        return (totalItemArea / totalBinArea) * 100;
    }
}

class Bin {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.root = { x: 0, y: 0, width, height };
    }
    
    insert(item) {
        const normalPlacement = this.insertNode(this.root, item.width, item.height);
        if (normalPlacement) {
            return { ...normalPlacement, rotated: false };
        }
        
        if (item.width !== item.height) {
            const rotatedPlacement = this.insertNode(this.root, item.height, item.width);
            if (rotatedPlacement) {
                return { ...rotatedPlacement, rotated: true };
            }
        }
        
        return null;
    }
    
    insertNode(node, width, height) {
        if (node.used) {
            const rightResult = this.insertNode(node.right, width, height);
            if (rightResult) return rightResult;
            return this.insertNode(node.down, width, height);
        } else if (width <= node.width && height <= node.height) {
            node.used = true;
            node.down = {
                x: node.x,
                y: node.y + height,
                width: node.width,
                height: node.height - height
            };
            node.right = {
                x: node.x + width,
                y: node.y,
                width: node.width - width,
                height: height
            };
            return { x: node.x, y: node.y };
        }
        return null;
    }
}

class SheetOptimizer {
    static optimizePlacement(pieces, sheetWidth, sheetHeight) {
        const packer = new BinPacker(sheetWidth, sheetHeight);
        
        const items = pieces.map((piece, index) => ({
            id: index,
            width: piece.width,
            height: piece.height,
            area: piece.area,
            color: piece.color,
            originalPiece: piece
        }));
        
        const result = packer.pack(items);
        
        return {
            sheets: result.bins.map((bin, index) => ({
                index,
                width: sheetWidth,
                height: sheetHeight,
                pieces: result.packedItems.filter(item => item.binIndex === index)
            })),
            efficiency: result.efficiency,
            wastePercentage: 100 - result.efficiency,
            totalSheets: result.bins.length
        };
    }
    
    static findBestConfiguration(pieces, sheetSizes) {
        let bestConfig = null;
        let bestEfficiency = 0;
        
        for (const {width, height, name} of sheetSizes) {
            const config = this.optimizePlacement(pieces, width, height);
            
            if (config.efficiency > bestEfficiency) {
                bestEfficiency = config.efficiency;
                bestConfig = {
                    ...config,
                    sheetSize: {width, height, name}
                };
            }
        }
        
        return bestConfig;
    }
    
    static calculateMaterialCost(config, costPerSheet) {
        return config.totalSheets * costPerSheet;
    }
    
    static generateCuttingPlan(sheets) {
        const cuttingPlan = [];
        
        sheets.forEach((sheet, sheetIndex) => {
            const sheetPlan = {
                sheetNumber: sheetIndex + 1,
                pieces: sheet.pieces.map(piece => ({
                    pieceId: piece.id,
                    color: piece.color,
                    position: { x: piece.x, y: piece.y },
                    dimensions: { 
                        width: piece.rotated ? piece.originalPiece.height : piece.originalPiece.width,
                        height: piece.rotated ? piece.originalPiece.width : piece.originalPiece.height
                    },
                    rotated: piece.rotated,
                    area: piece.area
                }))
            };
            cuttingPlan.push(sheetPlan);
        });
        
        return cuttingPlan;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BinPacker, Bin, SheetOptimizer };
}