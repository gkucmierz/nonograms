<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { usePuzzleStore } from '@/stores/puzzle';
import { useI18n } from '@/composables/useI18n';
import { getWorkerPool } from '@/utils/workerPool';
import DifficultyMap from './DifficultyMap.vue';
import { Upload, Image as ImageIcon, X, AlertTriangle, Camera, RefreshCw } from 'lucide-vue-next';

const emit = defineEmits(['close']);
const store = usePuzzleStore();
const { t } = useI18n();

const fileInput = ref(null);
const canvasRef = ref(null);
const previewCanvasRef = ref(null);
const videoRef = ref(null);
const isDragging = ref(false);
const imageLoaded = ref(false);
const processing = ref(false);
const processingProgress = ref(0);
const isCameraOpen = ref(false);
const hasMultipleCameras = ref(false);
const stream = ref(null);
const facingMode = ref('environment');

// Settings
const maxDimension = ref(15);
const threshold = ref(50); // 0-100% density

// State
const originalImage = ref(null);
const generatedGrid = ref([]);
const difficulty = ref(0);
const solvability = ref(0);
const difficultyLabel = ref('');
const gridRows = ref(15);
const gridCols = ref(15);

const onDrop = (e) => {
  isDragging.value = false;
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    processFile(file);
  }
};

const onFileSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    processFile(file);
  }
};

const processFile = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      originalImage.value = img;
      imageLoaded.value = true;
      nextTick(() => {
        updateGrid();
      });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

const updateGrid = () => {
  if (!originalImage.value || !canvasRef.value) return;

  const ctx = canvasRef.value.getContext('2d');
  
  // Calculate dimensions preserving aspect ratio
  const imgW = originalImage.value.width;
  const imgH = originalImage.value.height;
  const aspect = imgW / imgH;
  
  let w, h;
  const maxDim = maxDimension.value;

  if (aspect >= 1) {
      w = maxDim;
      h = Math.round(w / aspect);
  } else {
      h = maxDim;
      w = Math.round(h * aspect);
  }

  // Ensure bounds [5, 80]
  // 1. Clamp min (prioritize min 5)
  if (w < 5) { w = 5; h = Math.round(w / aspect); }
  if (h < 5) { h = 5; w = Math.round(h * aspect); }
  
  // 2. Clamp max (hard limit 80)
  if (w > 80) w = 80;
  if (h > 80) h = 80;
  
  // Final safeguard
  w = Math.max(5, Math.min(80, Math.round(w)));
  h = Math.max(5, Math.min(80, Math.round(h)));

  gridRows.value = h;
  gridCols.value = w;

  // Resize logic
  canvasRef.value.width = w;
  canvasRef.value.height = h;
  
  // Draw image scaled to grid size
  ctx.drawImage(originalImage.value, 0, 0, w, h);
  
  // Get pixel data
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  
  // 1. Collect brightness of valid pixels
  const pixels = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // If transparent, ignore
      if (a >= 128) {
        // Calculate brightness (Luminance)
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        pixels.push({ x, y, brightness });
      }
    }
  }

  // 2. Sort by brightness (ascending: dark -> light)
  // Darker pixels have lower brightness.
  // We want to fill the darkest X% pixels.
  pixels.sort((a, b) => a.brightness - b.brightness);

  // 3. Determine cutoff
  // threshold.value is density (0-100%)
  // If density is 50%, we want 50% of pixels to be black.
  // So we take the first 50% of sorted pixels.
  const totalValid = pixels.length;
  const targetFillCount = Math.floor(totalValid * (threshold.value / 100));

  // 4. Build grid
  const grid = Array(h).fill().map(() => Array(w).fill(0));
  
  // Mark the darkest pixels as filled (1)
  for (let i = 0; i < targetFillCount; i++) {
    const p = pixels[i];
    grid[p.y][p.x] = 1;
  }
  
  generatedGrid.value = grid;
  drawPreview();
  calculateStats();
};

const drawPreview = () => {
    if (!previewCanvasRef.value || generatedGrid.value.length === 0) return;
    const ctx = previewCanvasRef.value.getContext('2d');
    const rows = generatedGrid.value.length;
    const cols = generatedGrid.value[0].length;
    
    // Max 300px width/height, preserving aspect
    const maxPreview = 300;
    const cellW = maxPreview / Math.max(rows, cols);
    const cellH = cellW; // square cells
    
    const previewW = cols * cellW;
    const previewH = rows * cellH;
    
    previewCanvasRef.value.width = previewW;
    previewCanvasRef.value.height = previewH;
    
    ctx.clearRect(0, 0, previewW, previewH);
    
    // Draw original image with low opacity
    if (originalImage.value) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.drawImage(originalImage.value, 0, 0, previewW, previewH);
        ctx.restore();
    }
    
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (generatedGrid.value[y][x] === 1) {
                ctx.fillStyle = '#000';
                ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
            }
        }
    }
    
    // Grid lines
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellW, 0);
        ctx.lineTo(i * cellW, previewH);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * cellH);
        ctx.lineTo(previewW, i * cellH);
        ctx.stroke();
    }
};

const calculateStats = async () => {
    if (generatedGrid.value.length === 0) return;
    
    processing.value = true;
    processingProgress.value = 0;
    const requestId = Date.now();
    currentStatsRequestId = requestId;
    
    try {
        const pool = getWorkerPool();
        pool.cancelAll(); // Force stop previous calculations for immediate responsiveness
        
        // Demonstrate parallel execution capability
        // We split the problem into two branches: assuming first cell is EMPTY (0) vs FILLED (1)
        // This doubles the search power by utilizing 2 workers immediately.
        
        // Ensure we send plain objects to workers, not Vue proxies
        const rawGrid = JSON.parse(JSON.stringify(generatedGrid.value));
        const rows = rawGrid.length;
        const cols = rawGrid[0].length;
        
        // Create initial states
        const gridA = Array(rows).fill().map(() => Array(cols).fill(-1));
        gridA[0][0] = 0; // Branch A: Assume (0,0) is Empty
        
        const gridB = Array(rows).fill().map(() => Array(cols).fill(-1));
        gridB[0][0] = 1; // Branch B: Assume (0,0) is Filled
        
        const tasks = [
            {
                data: { id: requestId, grid: rawGrid, initialGrid: gridA },
                onProgress: (p) => { if (currentStatsRequestId === requestId) processingProgress.value = Math.max(processingProgress.value, p); }
            },
            {
                data: { id: requestId, grid: rawGrid, initialGrid: gridB },
                onProgress: (p) => { if (currentStatsRequestId === requestId) processingProgress.value = Math.max(processingProgress.value, p); }
            }
        ];

        const result = await pool.runRace(tasks);
        
        if (result.id === currentStatsRequestId) {
            solvability.value = result.solvability;
            difficulty.value = result.difficulty;
            difficultyLabel.value = result.difficultyLabel;
        }
    } catch (err) {
        if (err.message !== 'Cancelled' && err.message !== 'Terminated') {
            console.error('Worker error:', err);
            if (currentStatsRequestId === requestId) {
                solvability.value = 0;
                difficulty.value = 0;
                // If translation key is missing, this might show 'difficulty.error'
                // Ensure we have a fallback or the key exists
                difficultyLabel.value = 'error'; 
            }
        }
    } finally {
        if (currentStatsRequestId === requestId) {
            processing.value = false;
        }
    }
};

let currentStatsRequestId = 0;

let debounceTimer;
watch([maxDimension, threshold], () => {
    if (imageLoaded.value) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            updateGrid();
        }, 50);
    } else {
        // If no image loaded, just update the display values
        // Assuming square aspect ratio for preview
        gridRows.value = maxDimension.value;
        gridCols.value = maxDimension.value;
    }
});

const createPuzzle = () => {
    if (generatedGrid.value.length > 0) {
        store.initFromImage(generatedGrid.value);
        emit('close');
    }
};

const triggerFileInput = () => {
    fileInput.value.click();
};

const startCamera = async () => {
    isCameraOpen.value = true;
    try {
        if (stream.value) {
            stopCameraStream();
        }
        const constraints = {
            video: {
                facingMode: facingMode.value
            }
        };
        stream.value = await navigator.mediaDevices.getUserMedia(constraints);

        // Check available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        hasMultipleCameras.value = videoDevices.length > 1;

        // Wait for next tick or ensure videoRef is available
        setTimeout(() => {
            if (videoRef.value) {
                videoRef.value.srcObject = stream.value;
            }
        }, 100);
    } catch (err) {
        console.error("Error accessing camera:", err);
        alert(t('image.cameraError'));
        isCameraOpen.value = false;
    }
};

const stopCameraStream = () => {
    if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop());
        stream.value = null;
    }
};

const closeCamera = () => {
    stopCameraStream();
    isCameraOpen.value = false;
};

const switchCamera = async () => {
    facingMode.value = facingMode.value === 'user' ? 'environment' : 'user';
    await startCamera();
};

const capturePhoto = () => {
    if (!videoRef.value) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.value.videoWidth;
    canvas.height = videoRef.value.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Mirror if using front camera
    if (facingMode.value === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    
    ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height);
    
    const img = new Image();
    img.onload = () => {
        originalImage.value = img;
        imageLoaded.value = true;
        nextTick(() => {
            updateGrid();
        });
        closeCamera();
    };
    img.src = canvas.toDataURL('image/png');
};

onUnmounted(() => {
    stopCameraStream();
    getWorkerPool().cancelAll();
});

</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('close')">
        <X :size="24" />
      </button>
      
      <h2 class="modal-title">{{ t('image.title') }}</h2>
      
      <div v-if="isCameraOpen" class="camera-overlay">
        <video ref="videoRef" autoplay playsinline></video>
        <div class="camera-controls">
            <button class="camera-btn secondary" @click="closeCamera">
                <X :size="24" />
            </button>
            <button class="camera-btn capture" @click="capturePhoto">
                <div class="shutter"></div>
            </button>
            <button v-if="hasMultipleCameras" class="camera-btn secondary" @click="switchCamera">
                <RefreshCw :size="24" />
            </button>
        </div>
      </div>

      <div class="content-grid">
        <!-- Left: Input & Preview -->
        <div class="input-section">
            <div 
                class="drop-zone"
                :class="{ dragging: isDragging, loaded: imageLoaded }"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="onDrop"
                @click="!imageLoaded ? triggerFileInput() : null"
            >
                <input 
                    ref="fileInput"
                    type="file" 
                    accept="image/*" 
                    class="hidden-input"
                    @change="onFileSelect"
                />
                
                <div v-if="!imageLoaded" class="placeholder">
                    <Upload :size="48" class="icon" />
                    <p>{{ t('image.drop') }}</p>
                    <div class="button-group">
                        <button class="btn-neon small" @click.stop="triggerFileInput">
                            {{ t('image.select') }}
                        </button>
                        <button class="btn-neon small secondary" @click.stop="startCamera">
                            <Camera :size="16" />
                            {{ t('image.camera') }}
                        </button>
                    </div>
                </div>
                
                <div v-else class="preview-container">
                    <canvas ref="previewCanvasRef" class="preview-canvas"></canvas>
                    <div class="button-group">
                        <button class="btn-change" @click.stop="triggerFileInput">
                            {{ t('image.change') }}
                        </button>
                        <button class="btn-change" @click.stop="startCamera">
                            <Camera :size="16" />
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Hidden canvas for processing -->
            <canvas ref="canvasRef" style="display: none;"></canvas>
        </div>
        
        <!-- Right: Controls & Stats -->
        <div class="controls-section">
            <div class="control-group">
                <label>{{ t('image.size') }}: {{ gridCols }}x{{ gridRows }}</label>
                <input 
                    type="range" 
                    v-model.number="maxDimension" 
                    min="5" 
                    max="80" 
                    step="5"
                />
            </div>
            
            <div class="control-group">
                <label>{{ t('image.threshold') }}: {{ threshold }}%</label>
                <input 
                    type="range" 
                    v-model.number="threshold" 
                    min="1" 
                    max="99" 
                />
                <div class="threshold-preview">
                    <span>{{ t('image.lowDensity') }}</span>
                    <span>{{ t('image.highDensity') }}</span>
                </div>
            </div>
            
            <div v-if="imageLoaded" class="stats-panel">
                <div class="difficulty-map-wrapper">
                    <DifficultyMap 
                        :size="maxDimension"
                        :density="threshold"
                        :actual-difficulty="difficulty > 0 ? difficulty : null"
                        :interactive="false"
                        :width="200"
                        :height="200"
                        class="difficulty-map-mini"
                    />
                </div>
                <div v-if="processing" class="loading-stats">
                    <div class="spinner"></div>
                    <span>{{ t('image.calculatingSolvability') || 'Calculating solvability...' }} {{ processingProgress }}%</span>
                </div>
                <template v-else>
                    <div class="stat-row">
                        <span>{{ t('image.solvability') }}:</span>
                        <span :class="{ 'good': solvability === 100, 'bad': solvability < 100 }">
                            {{ solvability }}%
                        </span>
                    </div>
                    <div v-if="solvability < 100" class="warning">
                        <AlertTriangle :size="16" />
                        {{ t('image.warning') }}
                    </div>
                    
                    <div class="stat-row">
                        <span>{{ t('image.difficulty') }}:</span>
                        <span>{{ difficulty }}% ({{ t(`difficulty.${difficultyLabel.toLowerCase()}`) }})</span>
                    </div>
                </template>
            </div>
            
            <div class="actions">
                <button 
                    class="btn-neon primary" 
                    :disabled="!imageLoaded || processing"
                    @click="createPuzzle"
                >
                    {{ t('image.create') }}
                </button>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.difficulty-map-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 15px;
    background: #000;
    border-radius: 8px;
    padding: 10px;
    border: 1px solid var(--border-color);
}

.difficulty-map-mini :deep(canvas) {
    width: 100% !important;
    max-width: 200px;
    height: auto !important;
    aspect-ratio: 1;
    border-radius: 4px;
}

.loading-stats {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 10px;
    color: var(--text-muted);
}

.spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--text-muted);
    border-top-color: var(--primary-accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 30px;
  width: 90%;
  max-width: 800px;
  position: relative;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  color: var(--text-color);
  max-height: 90vh;
  overflow-y: auto;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.3s;
}

.close-btn:hover {
  color: var(--text-color);
}

.modal-title {
  text-align: center;
  margin-bottom: 30px;
  color: var(--primary-accent);
  font-size: 1.8rem;
  text-shadow: 0 0 10px var(--primary-accent);
}

.camera-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000;
    z-index: 10;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 16px;
}

.camera-overlay video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.camera-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 20px;
    padding-bottom: 40px;
    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
}

.camera-btn {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(5px);
}

.camera-btn.capture {
    width: 70px;
    height: 70px;
    background: rgba(255,255,255,0.3);
    border: 4px solid white;
}

.shutter {
    width: 54px;
    height: 54px;
    background: white;
    border-radius: 50%;
    transition: transform 0.1s;
}

.camera-btn.capture:active .shutter {
    transform: scale(0.9);
}

.button-group {
    display: flex;
    gap: 10px;
    margin-top: 15px;
    justify-content: center;
}

.content-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
}

@media (max-width: 768px) {
    .content-grid {
        grid-template-columns: 1fr;
    }
}

.drop-zone {
    border: 2px dashed var(--border-color);
    border-radius: 12px;
    height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    cursor: pointer;
    transition: all 0.3s;
    background: rgba(255, 255, 255, 0.05);
}

.drop-zone:hover, .drop-zone.dragging {
    border-color: var(--primary-accent);
    background: rgba(0, 242, 254, 0.1);
}

.drop-zone.loaded {
    border: none;
    background: none;
    cursor: default;
}

.placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    color: var(--text-muted);
}

.hidden-input {
    display: none;
}

.preview-container {
    position: relative;
    width: 300px;
    height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.preview-container .button-group {
    position: absolute;
    bottom: 10px;
    right: 10px;
    display: flex;
    gap: 8px;
    margin: 0;
}

.preview-canvas {
    max-width: 100%;
    max-height: 100%;
    border: 1px solid var(--border-color);
    box-shadow: 0 0 15px rgba(0,0,0,0.3);
}

.btn-change {
    background: rgba(0,0,0,0.7);
    color: white;
    border: 1px solid white;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
    transition: background 0.2s;
}

.btn-change:hover {
    background: rgba(0,0,0,0.9);
}

.controls-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

input[type="range"] {
    width: 100%;
    accent-color: var(--primary-accent);
}

.threshold-preview {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--text-muted);
}

.stats-panel {
    background: rgba(0,0,0,0.2);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
}

.stat-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 1.1rem;
}

.good { color: #4ade80; }
.bad { color: #f87171; }

.warning {
    color: #fbbf24;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: -5px;
    margin-bottom: 10px;
}

.actions {
    margin-top: auto;
    display: flex;
    justify-content: center;
}

.btn-neon {
  padding: 10px 20px;
  border: 1px solid var(--primary-accent);
  background: rgba(0, 242, 254, 0.1);
  color: var(--primary-accent);
  font-family: 'Orbitron', sans-serif;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.2);
  border-radius: 4px;
}

.btn-neon:hover:not(:disabled) {
  background: var(--primary-accent);
  color: #000;
  box-shadow: 0 0 20px var(--primary-accent);
}

.btn-neon:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(1);
}

.btn-neon.small {
    padding: 5px 15px;
    font-size: 0.8rem;
}

</style>
