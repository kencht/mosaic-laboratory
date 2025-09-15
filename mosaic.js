class MosaicGenerator {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.germinationPoint = { x: 0, y: 0 };
        this.pattern = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.randomiseAll();
    }

    setupEventListeners() {
        const updateValue = (id, valueId) => {
            const slider = document.getElementById(id);
            const valueSpan = document.getElementById(valueId);
            slider.addEventListener('input', () => {
                if (id === 'groutWidth') {
                    valueSpan.textContent = parseFloat(slider.value).toFixed(1);
                } else {
                    valueSpan.textContent = slider.value;
                }
            });
        };

        updateValue('complexity', 'complexityValue');
        updateValue('ringSpacing', 'ringSpacingValue');
        updateValue('ringWidth', 'ringWidthValue');
        updateValue('stretchX', 'stretchXValue');
        updateValue('stretchY', 'stretchYValue');
        updateValue('sineAmplitude', 'sineAmplitudeValue');
        updateValue('sineWaveLength', 'sineWaveLengthValue');
        updateValue('tileShiftAmplitude', 'tileShiftAmplitudeValue');
        updateValue('tileShiftFrequency', 'tileShiftFrequencyValue');
        updateValue('tilesAcross', 'tilesAcrossValue');
        updateValue('tilesDown', 'tilesDownValue');
        updateValue('tileSize', 'tileSizeValue');
        updateValue('groutWidth', 'groutWidthValue');
        
        // Add auto-update listeners for all sliders 
        const sliders = [
            'complexity', 'ringSpacing', 'ringWidth', 'stretchX', 'stretchY', 
            'sineAmplitude', 'sineWaveLength', 'tileShiftAmplitude', 'tileShiftFrequency',
            'tilesAcross', 'tilesDown', 'tileSize', 'groutWidth'
        ];
        
        sliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            if (slider) {
                if (sliderId === 'tilesAcross' || sliderId === 'tilesDown' || sliderId === 'tileSize') {
                    // Canvas-resizing sliders only update on release
                    slider.addEventListener('change', () => {
                        this.updateCanvasSize();
                    });
                } else {
                    // Other sliders live update with animation
                    slider.addEventListener('input', () => {
                        this.generateWithAnimation();
                    });
                }
            }
        });

        document.getElementById('colorMode').addEventListener('change', (e) => {
            const color3Group = document.getElementById('color3Group');
            color3Group.style.display = e.target.value === '3' ? 'inline-block' : 'none';
            this.generateWithAnimation();
        });

        document.getElementById('colorPresets').addEventListener('change', (e) => {
            this.applyColorPreset(e.target.value);
        });
        
        document.getElementById('color1').addEventListener('change', () => {
            this.generateWithAnimation();
        });
        
        document.getElementById('color2').addEventListener('change', () => {
            this.generateWithAnimation();
        });
        
        document.getElementById('color3').addEventListener('change', () => {
            this.generateWithAnimation();
        });

        document.getElementById('groutColor').addEventListener('change', () => {
            this.generateWithAnimation();
        });

        document.getElementById('randomiseBtn').addEventListener('click', () => {
            this.randomiseAll();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.export();
        });

        document.getElementById('loadHashBtn').addEventListener('click', () => {
            const hash = document.getElementById('hashInput').value.trim();
            if (hash) {
                if (this.loadFromHash(hash)) {
                    alert('Settings loaded successfully!');
                } else {
                    alert('Invalid hash. Please check and try again.');
                }
            }
        });

        document.getElementById('copyHashBtn').addEventListener('click', () => {
            const hash = this.generateHash();
            navigator.clipboard.writeText(hash).then(() => {
                alert('Hash copied to clipboard!');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = hash;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Hash copied to clipboard!');
            });
        });

    }

    updateCanvasSize() {
        const tilesAcross = parseInt(document.getElementById('tilesAcross').value);
        const tilesDown = parseInt(document.getElementById('tilesDown').value);
        const tileSize = parseInt(document.getElementById('tileSize').value);
        
        // Canvas dimensions are already multiples of tile size
        const adjustedWidth = tilesAcross * tileSize;
        const adjustedHeight = tilesDown * tileSize;
        
        this.canvas.width = adjustedWidth;
        this.canvas.height = adjustedHeight;
        
        // Clear to white background
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, adjustedWidth, adjustedHeight);
        
        // Generate new pattern in temp canvas and animate over blank canvas
        this.generateWithAnimation();
    }

    applyColorPreset(presetName) {
        const palettes = {
            // Bright Palettes
            neon: ['#FF0080', '#00FFFF', '#FFFF00'],
            tropical: ['#FF6B35', '#F7931E', '#FFD23F'],
            sunset: ['#FF4E50', '#FC913A', '#F9D423'],
            acidic: ['#39FF14', '#FF1493', '#00BFFF'],
            galaxy: ['#8A2BE2', '#FF69B4', '#00CED1'],
            
            // Muted Palettes
            forest: ['#556B2F', '#8FBC8F', '#A0522D'],
            sage: ['#87A96B', '#C7B299', '#BFB5A0'],
            dusty: ['#D4A4A8', '#C5A3A3', '#B8A3A8'],
            autumn: ['#A0937D', '#B5A288', '#C9B99B'],
            ocean: ['#4682B4', '#5F9EA0', '#708090'],
            
            // Beige & Pastel
            cream: ['#F5F5DC', '#DDBF94', '#C4A778'],
            lavender: ['#E6E6FA', '#D8BFD8', '#DDA0DD'],
            peach: ['#FFDAB9', '#FFB07A', '#FFA07A'],
            mint: ['#F0FFF0', '#98FB98', '#90EE90'],
            sand: ['#F4A460', '#D2B48C', '#BC9A6A']
        };

        if (presetName && palettes[presetName]) {
            const colors = palettes[presetName];
            document.getElementById('color1').value = colors[0];
            document.getElementById('color2').value = colors[1];
            
            if (colors[2]) {
                document.getElementById('color3').value = colors[2];
                document.getElementById('colorMode').value = '3';
                document.getElementById('color3Group').style.display = 'inline-block';
            } else {
                document.getElementById('colorMode').value = '2';
                document.getElementById('color3Group').style.display = 'none';
            }
            
            this.generateWithAnimation();
        }
    }

    generateBZPattern() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const complexity = parseInt(document.getElementById('complexity').value);
        const ringSpacing = parseInt(document.getElementById('ringSpacing').value);
        const ringWidth = parseInt(document.getElementById('ringWidth').value) / 100;

        // Set germination point at exact center
        this.germinationPoint = {
            x: canvasWidth / 2,
            y: canvasHeight / 2
        };

        this.pattern = [];
        
        // Generate pattern using pixel-by-pixel distance calculation
        for (let y = 0; y < canvasHeight; y += 2) {
            for (let x = 0; x < canvasWidth; x += 2) {
                // Calculate base distance from center
                const dx = x - this.germinationPoint.x;
                const dy = y - this.germinationPoint.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                // Apply complexity-based pattern variation with non-round shapes
                if (complexity > 1) {
                    const angle = Math.atan2(dy, dx);
                    // Create more dramatic shape variations based on complexity
                    let shapeVariation = 0;
                    
                    if (complexity <= 3) {
                        // Triangle-like distortion
                        shapeVariation = Math.sin(angle * 3) * (ringSpacing * 0.15);
                    } else if (complexity <= 6) {
                        // Square/diamond-like distortion  
                        shapeVariation = (Math.sin(angle * 4) + Math.cos(angle * 4 + Math.PI/4)) * (ringSpacing * 0.12);
                    } else {
                        // Complex star/flower patterns
                        shapeVariation = (Math.sin(angle * complexity) + Math.sin(angle * complexity * 1.5 + distance * 0.02)) * (ringSpacing * 0.1);
                    }
                    
                    distance += shapeVariation;
                }
                
                // Determine if this pixel should be active based on ring pattern
                const ringPosition = (distance % ringSpacing) / ringSpacing;
                const isActive = ringPosition < ringWidth;
                
                if (isActive && distance >= 0) {
                    this.pattern.push({
                        x: x,
                        y: y,
                        originalDistance: Math.sqrt(dx * dx + dy * dy)
                    });
                }
            }
        }
    }

    getColorForRadius(radius) {
        const colors = this.getSelectedColors();
        const ringSpacing = parseInt(document.getElementById('ringSpacing').value);
        // Ensure we don't get division by zero or negative indices
        const safeRadius = Math.max(0, radius);
        const colorIndex = Math.floor(safeRadius / Math.max(1, ringSpacing)) % colors.length;
        return colors[colorIndex];
    }

    getSelectedColors() {
        const color1 = document.getElementById('color1').value;
        const color2 = document.getElementById('color2').value;
        const colorMode = document.getElementById('colorMode').value;
        
        const colors = [color1, color2];
        if (colorMode === '3') {
            const color3 = document.getElementById('color3').value;
            colors.push(color3);
        }
        
        return colors;
    }

    getGroutStyle() {
        const groutColor = document.getElementById('groutColor').value;
        const groutWidth = parseFloat(document.getElementById('groutWidth').value);
        
        if (groutColor === 'none' || groutWidth === 0) {
            return null;
        }
        
        let color;
        switch (groutColor) {
            case 'black':
                color = '#000000';
                break;
            case 'white':
                color = '#FFFFFF';
                break;
            case 'gray':
                color = '#808080';
                break;
            default:
                return null;
        }
        
        return { color, width: groutWidth };
    }

    getRandomColor() {
        const colors = this.getSelectedColors();
        return colors[Math.floor(Math.random() * colors.length)];
    }

    drawBZPattern() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const sineAmplitude = parseInt(document.getElementById('sineAmplitude').value);
        const sineWaveLength = parseInt(document.getElementById('sineWaveLength').value);

        // Draw each point of the BZ pattern with sine wave distortion
        this.pattern.forEach(point => {
            let x = point.x;
            let y = point.y;
            
            // Apply sine wave distortion to final position
            if (sineAmplitude > 0) {
                const sineOffsetX = Math.sin((y / sineWaveLength) * Math.PI * 2) * sineAmplitude;
                const sineOffsetY = Math.sin((x / sineWaveLength) * Math.PI * 2) * sineAmplitude;
                
                x += sineOffsetX;
                y += sineOffsetY;
            }
            
            // Calculate color based on original distance for consistent distribution
            const color = this.getColorForRadius(point.originalDistance);
            
            this.ctx.fillStyle = color;
            this.ctx.fillRect(Math.floor(x), Math.floor(y), 2, 2);
        });
    }

    applyMosaicEffect() {
        const tileSize = parseInt(document.getElementById('tileSize').value);
        const stretchX = parseInt(document.getElementById('stretchX').value) / 100;
        const stretchY = parseInt(document.getElementById('stretchY').value) / 100;
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const selectedColors = this.getSelectedColors();
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Calculate the "source" dimensions (unstretched)
        const sourceWidth = this.canvas.width / stretchX;
        const sourceHeight = this.canvas.height / stretchY;
        const sourceLeft = centerX - sourceWidth / 2;
        const sourceTop = centerY - sourceHeight / 2;

        // Ensure we only iterate over complete tiles
        const tilesX = Math.floor(this.canvas.width / tileSize);
        const tilesY = Math.floor(this.canvas.height / tileSize);

        for (let tileY = 0; tileY < tilesY; tileY++) {
            for (let tileX = 0; tileX < tilesX; tileX++) {
                const x = tileX * tileSize;
                const y = tileY * tileSize;
                // Map this output position back to source position
                const sourceX = sourceLeft + ((x - centerX + this.canvas.width/2) / stretchX);
                const sourceY = sourceTop + ((y - centerY + this.canvas.height/2) / stretchY);
                
                // Clamp source coordinates to valid bounds
                const clampedSourceX = Math.max(0, Math.min(Math.floor(sourceX), this.canvas.width - tileSize));
                const clampedSourceY = Math.max(0, Math.min(Math.floor(sourceY), this.canvas.height - tileSize));
                
                const avgColor = this.getAverageColor(data, clampedSourceX, clampedSourceY, tileSize, this.canvas.width);
                const closestColor = this.getClosestColor(avgColor, selectedColors);
                
                this.ctx.fillStyle = closestColor;
                this.ctx.fillRect(x, y, tileSize, tileSize);
                
                // Apply grout if enabled
                const groutStyle = this.getGroutStyle();
                if (groutStyle) {
                    this.ctx.strokeStyle = groutStyle.color;
                    this.ctx.lineWidth = groutStyle.width;
                    this.ctx.strokeRect(x, y, tileSize, tileSize);
                }
            }
        }
    }

    getClosestColor(targetColor, colorPalette) {
        let closestColor = colorPalette[0];
        let minDistance = Infinity;

        colorPalette.forEach(color => {
            const rgb = this.hexToRgb(color);
            const distance = Math.sqrt(
                Math.pow(targetColor.r - rgb.r, 2) +
                Math.pow(targetColor.g - rgb.g, 2) +
                Math.pow(targetColor.b - rgb.b, 2)
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

    getAverageColor(data, startX, startY, tileSize, canvasWidth) {
        let r = 0, g = 0, b = 0, count = 0;

        for (let y = startY; y < Math.min(startY + tileSize, this.canvas.height); y++) {
            for (let x = startX; x < Math.min(startX + tileSize, canvasWidth); x++) {
                const index = (y * canvasWidth + x) * 4;
                r += data[index];
                g += data[index + 1];
                b += data[index + 2];
                count++;
            }
        }

        return {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count)
        };
    }

    generate() {
        // Calculate canvas dimensions from tile count
        const tilesAcross = parseInt(document.getElementById('tilesAcross').value);
        const tilesDown = parseInt(document.getElementById('tilesDown').value);
        const tileSize = parseInt(document.getElementById('tileSize').value);
        
        const adjustedWidth = tilesAcross * tileSize;
        const adjustedHeight = tilesDown * tileSize;
        
        this.canvas.width = adjustedWidth;
        this.canvas.height = adjustedHeight;
        
        // No need to update tile controls - they remain the same
        
        this.generateBZPattern();
        this.drawBZPattern();
        this.animatedMosaicEffect();
    }

    generateWithAnimation() {
        // Generate complete new mosaic in temp canvas (don't show intermediate steps)
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        const originalCtx = this.ctx;
        this.ctx = tempCtx;
        this.generateBZPattern();
        this.drawBZPattern();
        this.applyTileShiftDistortion(tempCtx);
        this.applyMosaicEffect(); // Complete the mosaic in temp canvas
        this.ctx = originalCtx;
        
        // Get the finished mosaic data
        const newImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Animate it over the existing canvas
        this.animateNewMosaicOver(newImageData);
    }

    applyTileShiftDistortion(ctx) {
        const tileShiftAmplitude = parseInt(document.getElementById('tileShiftAmplitude').value);
        const tileShiftFrequency = parseInt(document.getElementById('tileShiftFrequency').value);
        
        if (tileShiftAmplitude === 0) return;
        
        // Get the current image
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const newImageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
        
        // Apply horizontal wave distortion
        for (let y = 0; y < ctx.canvas.height; y++) {
            const shiftPixels = Math.round(Math.sin((y / tileShiftFrequency) * Math.PI * 2) * tileShiftAmplitude * 10);
            
            for (let x = 0; x < ctx.canvas.width; x++) {
                const sourceX = x - shiftPixels;
                
                if (sourceX >= 0 && sourceX < ctx.canvas.width) {
                    const sourceIndex = (y * ctx.canvas.width + sourceX) * 4;
                    const targetIndex = (y * ctx.canvas.width + x) * 4;
                    
                    newImageData.data[targetIndex] = imageData.data[sourceIndex];
                    newImageData.data[targetIndex + 1] = imageData.data[sourceIndex + 1];
                    newImageData.data[targetIndex + 2] = imageData.data[sourceIndex + 2];
                    newImageData.data[targetIndex + 3] = imageData.data[sourceIndex + 3];
                }
            }
        }
        
        ctx.putImageData(newImageData, 0, 0);
    }

    animatedMosaicEffect() {
        const tileSize = parseInt(document.getElementById('tileSize').value);
        const stretchX = parseInt(document.getElementById('stretchX').value) / 100;
        const stretchY = parseInt(document.getElementById('stretchY').value) / 100;
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const selectedColors = this.getSelectedColors();
        
        // Don't clear the canvas - draw over the existing pattern

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Calculate the "source" dimensions (unstretched)
        const sourceWidth = this.canvas.width / stretchX;
        const sourceHeight = this.canvas.height / stretchY;
        const sourceLeft = centerX - sourceWidth / 2;
        const sourceTop = centerY - sourceHeight / 2;

        // Ensure we only iterate over complete tiles
        const tilesX = Math.floor(this.canvas.width / tileSize);
        const tilesY = Math.floor(this.canvas.height / tileSize);

        // Create array of all tile positions and shuffle them
        const tiles = [];
        for (let tileY = 0; tileY < tilesY; tileY++) {
            for (let tileX = 0; tileX < tilesX; tileX++) {
                tiles.push({ tileX, tileY });
            }
        }
        
        // Shuffle array for random order
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }

        // Animate multiple tiles per frame for much faster animation
        let currentTile = 0;
        const tilesPerFrame = Math.max(1, Math.floor(tiles.length / 5)); // Complete in ~5 frames
        
        const animateTile = () => {
            if (currentTile >= tiles.length) return;

            // Draw multiple tiles per frame
            for (let i = 0; i < tilesPerFrame && currentTile < tiles.length; i++) {
                const { tileX, tileY } = tiles[currentTile];
                const x = tileX * tileSize;
                const y = tileY * tileSize;
                
                // Map this output position back to source position
                const sourceX = sourceLeft + ((x - centerX + this.canvas.width/2) / stretchX);
                const sourceY = sourceTop + ((y - centerY + this.canvas.height/2) / stretchY);
                
                // Clamp source coordinates to valid bounds
                const clampedSourceX = Math.max(0, Math.min(Math.floor(sourceX), this.canvas.width - tileSize));
                const clampedSourceY = Math.max(0, Math.min(Math.floor(sourceY), this.canvas.height - tileSize));
                
                const avgColor = this.getAverageColor(data, clampedSourceX, clampedSourceY, tileSize, this.canvas.width);
                const closestColor = this.getClosestColor(avgColor, selectedColors);
                
                this.ctx.fillStyle = closestColor;
                this.ctx.fillRect(x, y, tileSize, tileSize);
                
                // Apply grout if enabled
                const groutStyle = this.getGroutStyle();
                if (groutStyle) {
                    this.ctx.strokeStyle = groutStyle.color;
                    this.ctx.lineWidth = groutStyle.width;
                    this.ctx.strokeRect(x, y, tileSize, tileSize);
                }

                currentTile++;
            }
            
            // Continue animation
            if (currentTile < tiles.length) {
                requestAnimationFrame(animateTile);
            }
        };

        // Start the animation
        requestAnimationFrame(animateTile);
    }

    animateNewMosaicOver(newImageData) {
        const tileSize = parseInt(document.getElementById('tileSize').value);
        const tilesX = Math.floor(this.canvas.width / tileSize);
        const tilesY = Math.floor(this.canvas.height / tileSize);

        // Create array of all tile positions and shuffle them
        const tiles = [];
        for (let tileY = 0; tileY < tilesY; tileY++) {
            for (let tileX = 0; tileX < tilesX; tileX++) {
                tiles.push({ tileX, tileY });
            }
        }
        
        // Shuffle array for random order
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }

        // Animate multiple tiles per frame
        let currentTile = 0;
        const tilesPerFrame = Math.max(1, Math.floor(tiles.length / 5)); // Complete in ~5 frames
        
        const animateTile = () => {
            if (currentTile >= tiles.length) return;

            // Draw multiple tiles per frame
            for (let i = 0; i < tilesPerFrame && currentTile < tiles.length; i++) {
                const { tileX, tileY } = tiles[currentTile];
                const x = tileX * tileSize;
                const y = tileY * tileSize;
                
                // Copy tile from new image data to main canvas
                const tileImageData = this.ctx.createImageData(tileSize, tileSize);
                for (let ty = 0; ty < tileSize; ty++) {
                    for (let tx = 0; tx < tileSize; tx++) {
                        const sourceIndex = ((y + ty) * this.canvas.width + (x + tx)) * 4;
                        const targetIndex = (ty * tileSize + tx) * 4;
                        
                        tileImageData.data[targetIndex] = newImageData.data[sourceIndex];
                        tileImageData.data[targetIndex + 1] = newImageData.data[sourceIndex + 1];
                        tileImageData.data[targetIndex + 2] = newImageData.data[sourceIndex + 2];
                        tileImageData.data[targetIndex + 3] = newImageData.data[sourceIndex + 3];
                    }
                }
                
                this.ctx.putImageData(tileImageData, x, y);
                currentTile++;
            }
            
            // Continue animation
            if (currentTile < tiles.length) {
                requestAnimationFrame(animateTile);
            }
        };

        // Start the animation
        requestAnimationFrame(animateTile);
    }

    randomiseAll() {
        // Randomise propagation controls
        document.getElementById('complexity').value = Math.floor(Math.random() * 10) + 1;
        document.getElementById('complexityValue').textContent = document.getElementById('complexity').value;
        
        document.getElementById('ringSpacing').value = Math.floor(Math.random() * 101) + 20;
        document.getElementById('ringSpacingValue').textContent = document.getElementById('ringSpacing').value;
        
        document.getElementById('ringWidth').value = Math.floor(Math.random() * 91) + 10;
        document.getElementById('ringWidthValue').textContent = document.getElementById('ringWidth').value;
        
        // Randomise stretch distortion
        document.getElementById('stretchX').value = Math.floor(Math.random() * 301) + 100;
        document.getElementById('stretchXValue').textContent = document.getElementById('stretchX').value;
        
        document.getElementById('stretchY').value = Math.floor(Math.random() * 301) + 100;
        document.getElementById('stretchYValue').textContent = document.getElementById('stretchY').value;
        
        // Randomise wave distortion
        document.getElementById('sineAmplitude').value = Math.floor(Math.random() * 21);
        document.getElementById('sineAmplitudeValue').textContent = document.getElementById('sineAmplitude').value;
        
        document.getElementById('sineWaveLength').value = Math.floor(Math.random() * 181) + 20;
        document.getElementById('sineWaveLengthValue').textContent = document.getElementById('sineWaveLength').value;
        
        document.getElementById('tileShiftAmplitude').value = Math.floor(Math.random() * 6);
        document.getElementById('tileShiftAmplitudeValue').textContent = document.getElementById('tileShiftAmplitude').value;
        
        document.getElementById('tileShiftFrequency').value = Math.floor(Math.random() * 181) + 20;
        document.getElementById('tileShiftFrequencyValue').textContent = document.getElementById('tileShiftFrequency').value;
        
        // Randomise colors only if not locked
        if (!document.getElementById('lockColors').checked) {
            const randomColor = () => {
                return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            };
            
            document.getElementById('color1').value = randomColor();
            document.getElementById('color2').value = randomColor();
            document.getElementById('color3').value = randomColor();
            
            // Randomly choose 2 or 3 colors
            const colorMode = Math.random() > 0.5 ? '3' : '2';
            document.getElementById('colorMode').value = colorMode;
            const color3Group = document.getElementById('color3Group');
            color3Group.style.display = colorMode === '3' ? 'inline-block' : 'none';
            
            // Reset preset to custom
            document.getElementById('colorPresets').value = '';
        }
        
        // Generate new mosaic with randomised values  
        this.generateWithAnimation();
    }

    generateHash() {
        const settings = {
            complexity: document.getElementById('complexity').value,
            ringSpacing: document.getElementById('ringSpacing').value,
            ringWidth: document.getElementById('ringWidth').value,
            stretchX: document.getElementById('stretchX').value,
            stretchY: document.getElementById('stretchY').value,
            sineAmplitude: document.getElementById('sineAmplitude').value,
            sineWaveLength: document.getElementById('sineWaveLength').value,
            tileShiftAmplitude: document.getElementById('tileShiftAmplitude').value,
            tileShiftFrequency: document.getElementById('tileShiftFrequency').value,
            tilesAcross: document.getElementById('tilesAcross').value,
            tilesDown: document.getElementById('tilesDown').value,
            tileSize: document.getElementById('tileSize').value,
            groutWidth: document.getElementById('groutWidth').value,
            groutColor: document.getElementById('groutColor').value,
            colorMode: document.getElementById('colorMode').value,
            color1: document.getElementById('color1').value,
            color2: document.getElementById('color2').value,
            color3: document.getElementById('color3').value,
            colorPresets: document.getElementById('colorPresets').value
        };
        
        return btoa(JSON.stringify(settings));
    }

    loadFromHash(hash) {
        try {
            const settings = JSON.parse(atob(hash));
            
            Object.keys(settings).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.value = settings[key];
                    // Update the display value spans
                    const valueSpan = document.getElementById(key + 'Value');
                    if (valueSpan) {
                        if (key === 'groutWidth') {
                            valueSpan.textContent = parseFloat(settings[key]).toFixed(1);
                        } else {
                            valueSpan.textContent = settings[key];
                        }
                    }
                }
            });
            
            // Handle color mode visibility
            const colorMode = settings.colorMode || '3';
            const color3Group = document.getElementById('color3Group');
            color3Group.style.display = colorMode === '3' ? 'inline-block' : 'none';
            
            // Update canvas size and regenerate
            this.updateCanvasSize();
            
            return true;
        } catch (e) {
            console.error('Invalid hash:', e);
            return false;
        }
    }

    export() {
        // Create high-resolution version for export (4x scale)
        const scale = 4;
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = this.canvas.width * scale;
        exportCanvas.height = this.canvas.height * scale;
        const exportCtx = exportCanvas.getContext('2d');
        
        // Disable image smoothing for crisp pixel art
        exportCtx.imageSmoothingEnabled = false;
        
        // Simply scale up the current canvas content
        exportCtx.drawImage(this.canvas, 0, 0, exportCanvas.width, exportCanvas.height);
        
        // Generate hash for filename
        const hash = this.generateHash();
        
        // Create download link with hash in filename
        const link = document.createElement('a');
        link.download = `mosaic-${hash.substring(0, 12)}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new MosaicGenerator();
});