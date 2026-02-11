<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { usePuzzleStore } from '@/stores/puzzle';
import { useI18n } from '@/composables/useI18n';
import { calculateDifficulty } from '@/utils/puzzleUtils';
import { HelpCircle } from 'lucide-vue-next';

const emit = defineEmits(['close', 'open-simulation']);
const store = usePuzzleStore();
const { t } = useI18n();

const customSize = ref(10);
const fillRate = ref(50);
const errorMsg = ref('');
const difficultyCanvas = ref(null);
const isDragging = ref(false);

const drawMap = () => {
  const canvas = difficultyCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Clear
  ctx.clearRect(0, 0, width, height);

  // Draw Gradient Background
  // Optimization: Create an image data once if static, but here it's small enough.
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  // Ranges:
  // X: Fill Rate 10% -> 90%
  // Y: Size 5 -> 80
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Map x, y to fillRate, size
      // y=0 -> size 80 (top), y=height -> size 5 (bottom)
      // x=0 -> fill 10%, x=width -> fill 90%
      
      const normalizedX = x / width;
      const normalizedY = 1 - (y / height); // 0 at bottom, 1 at top
      
      const fRate = 0.1 + normalizedX * 0.8; // 0.1 to 0.9
      const sSize = 5 + normalizedY * 75;    // 5 to 80
      
      const { value } = calculateDifficulty(fRate, sSize);
      
      // Color Mapping:
      // Green (0%) -> Yellow (50%) -> Red (100%)
      // Hue: 120 -> 0
      const hue = 120 * (1 - value / 100);
      
      // Convert HSL to RGB (Simplified)
      // Saturation 100%, Lightness 50%
      const [r, g, b] = hslToRgb(hue / 360, 1, 0.5);
      
      const index = (y * width + x) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255; // Alpha
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Draw current position
  // Map current fillRate/size to x,y
  // Fill: 10..90. Size: 5..80.
  const currentFill = Math.max(10, Math.min(90, fillRate.value));
  const currentSize = Math.max(5, Math.min(80, customSize.value));
  
  const posX = ((currentFill - 10) / 80) * width;
  const posY = (1 - (currentSize - 5) / 75) * height;

  // Draw Crosshair/Circle
  ctx.beginPath();
  ctx.arc(posX, posY, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000';
  ctx.stroke();
};

const hslToRgb = (h, s, l) => {
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

const updateFromEvent = (e) => {
    const canvas = difficultyCanvas.value;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Handle Touch or Mouse
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    let x = clientX - rect.left;
    let y = clientY - rect.top;
    
    // Clamp
    x = Math.max(0, Math.min(rect.width, x));
    y = Math.max(0, Math.min(rect.height, y));
    
    // Reverse Map
    // x / width -> fillRate (10..90)
    // 1 - y / height -> size (5..80)
    
    const normalizedX = x / rect.width;
    const normalizedY = 1 - (y / rect.height);
    
    const newFill = 10 + normalizedX * 80;
    const newSize = 5 + normalizedY * 75;
    
    fillRate.value = Math.round(newFill);
    customSize.value = Math.round(newSize);
};

const startDrag = (e) => {
    isDragging.value = true;
    updateFromEvent(e);
    // Add global listeners for mouse to handle dragging outside canvas
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);
};

const onDrag = (e) => {
    if (!isDragging.value) return;
    updateFromEvent(e);
};

const stopDrag = () => {
    isDragging.value = false;
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', stopDrag);
};

onUnmounted(() => {
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', stopDrag);
});

const showAdvanced = ref(false);

const toggleAdvanced = () => {
    showAdvanced.value = !showAdvanced.value;
    if (showAdvanced.value) {
        nextTick(drawMap);
    }
};

onMounted(() => {
  const savedSize = localStorage.getItem('nonograms_custom_size');
  if (savedSize && !isNaN(savedSize)) {
    customSize.value = Math.max(5, Math.min(80, Number(savedSize)));
  }
  
  const savedFillRate = localStorage.getItem('nonograms_custom_fill_rate');
  if (savedFillRate && !isNaN(savedFillRate)) {
    fillRate.value = Math.max(10, Math.min(90, Number(savedFillRate)));
  }
  
  // Don't draw map initially if hidden
});

watch([customSize, fillRate], () => {
    if (showAdvanced.value) {
        drawMap();
    }
});

watch(customSize, (newVal) => {
  localStorage.setItem('nonograms_custom_size', newVal);
});

watch(fillRate, (newVal) => {
  localStorage.setItem('nonograms_custom_fill_rate', newVal);
});

const snapToStep = (value, step) => {
  const rounded = Math.round(value / step) * step;
  return Math.max(5, Math.min(80, rounded));
};

const handleSnap = () => {
  customSize.value = snapToStep(Number(customSize.value), 5);
};

const difficultyInfo = computed(() => {
  return calculateDifficulty(fillRate.value / 100, customSize.value);
});

const difficultyColor = computed(() => {
  switch(difficultyInfo.value.level) {
    case 'extreme': return '#ff3333';
    case 'hardest': return '#ff9933';
    case 'harder': return '#ffff33';
    case 'easy': return '#33ff33';
    default: return '#33ff33';
  }
});

const confirm = () => {
  const size = parseInt(customSize.value);
  if (isNaN(size) || size < 5 || size > 80) {
    errorMsg.value = t('custom.sizeError');
    return;
  }
  
  store.initCustomGame(size, fillRate.value / 100);
  emit('close');
};
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal glass-panel">
      <h2>{{ t('custom.title') }}</h2>
      
      <div class="modal-content">
        <div class="sliders-section">
          <div class="slider-container">
            <p>{{ t('custom.prompt') }}</p>
            <div class="input-group">
              <div class="range-value">{{ customSize }}</div>
              <input 
                type="range" 
                v-model="customSize" 
                min="5" 
                max="80"
                step="1"
                @change="handleSnap"
              />
              <div class="range-scale">
                <span>5</span>
                <span>80</span>
              </div>
            </div>
          </div>

          <div class="slider-container">
            <p>{{ t('custom.fillRate') }}</p>
            <div class="input-group">
              <div class="range-value">{{ fillRate }}%</div>
              <input 
                type="range" 
                v-model="fillRate" 
                min="10" 
                max="90"
                step="1"
              />
              <div class="range-scale">
                <span>10%</span>
                <span>90%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="map-section" v-if="showAdvanced">
            <canvas 
                ref="difficultyCanvas" 
                width="400" 
                height="400"
                @mousedown="startDrag"
                @touchstart.prevent="startDrag"
                @touchmove.prevent="onDrag"
                @touchend="stopDrag"
            ></canvas>
        </div>
      </div>

      <div class="difficulty-indicator">
        <div class="label-row">
            <div class="label">{{ t('custom.difficulty') }}</div>
            <button class="help-btn" @click="emit('open-simulation')" :title="t('custom.simulationHelp') || 'How is this calculated?'">
                <HelpCircle class="icon-sm" />
            </button>
        </div>
        <div class="difficulty-row">
            <div class="level" :style="{ color: difficultyColor }">{{ t(`difficulty.${difficultyInfo.level}`) }}</div>
            <div class="percentage" :style="{ color: difficultyColor }">({{ difficultyInfo.value }}%)</div>
        </div>
      </div>

      <div class="advanced-toggle">
          <button class="btn-text" @click="toggleAdvanced">
              {{ showAdvanced ? 'Ukryj mapę trudności' : 'Pokaż mapę trudności' }}
          </button>
      </div>
      
      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

      <div class="actions">
        <button class="btn-neon secondary" @click="emit('close')">{{ t('custom.cancel') }}</button>
        <button class="btn-neon" @click="confirm">{{ t('custom.start') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--modal-overlay);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.modal {
  padding: 40px;
  text-align: center;
  max-width: 800px;
  width: 90%;
  border: 1px solid var(--accent-cyan);
  box-shadow: 0 0 50px rgba(0, 242, 255, 0.2);
  animation: slideUp 0.3s ease;
  transition: all 0.3s ease-in-out;
}

.modal-content {
    display: flex;
    flex-direction: row;
    gap: 40px;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
}

@media (max-width: 700px) {
    .modal-content {
        flex-direction: column;
        gap: 20px;
    }
}

.sliders-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.map-section {
    flex: 0 0 auto;
    display: flex;
    justify-content: center;
    align-items: center;
}

canvas {
    width: 400px;
    height: 400px;
    border: 2px solid var(--panel-border);
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0, 242, 255, 0.1);
    cursor: crosshair;
    background: #000;
}

@media (max-width: 600px) {
    canvas {
        width: 100%;
        height: auto;
        aspect-ratio: 1;
    }
}

h2 {
  font-size: 2rem;
  color: var(--accent-cyan);
  margin: 0 0 20px 0;
  text-transform: uppercase;
  letter-spacing: 2px;
}

p {
  color: var(--text-color);
  margin-bottom: 20px;
}

.slider-container {
    width: 100%;
    margin-bottom: 10px;
}

.input-group {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.range-value {
    min-width: 64px;
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--panel-bg-strong);
    border: 1px solid var(--panel-border);
    color: var(--text-strong);
    font-size: 1.1rem;
    text-align: center;
}

input[type="range"] {
    -webkit-appearance: none;
    width: min(300px, 70vw);
    height: 8px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--accent-cyan), var(--accent-purple));
    outline: none;
    border: 1px solid var(--panel-border);
    box-shadow: 0 0 10px rgba(0, 242, 255, 0.2);
}

input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--text-strong);
    border: 2px solid var(--accent-cyan);
    box-shadow: 0 0 12px rgba(0, 242, 255, 0.5);
    cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--text-strong);
    border: 2px solid var(--accent-cyan);
    box-shadow: 0 0 12px rgba(0, 242, 255, 0.5);
    cursor: pointer;
}

.range-scale {
    width: min(300px, 70vw);
    display: flex;
    justify-content: space-between;
    color: var(--text-muted);
    font-size: 0.85rem;
}

.difficulty-indicator {
    margin: 20px 0 40px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
}

.label-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.help-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 4px;
    border-radius: 50%;
    transition: color 0.3s, background 0.3s;
}

.help-btn:hover {
    color: var(--accent-cyan);
    background: rgba(0, 242, 255, 0.1);
}

.icon-sm {
    width: 16px;
    height: 16px;
}

.difficulty-row {
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: baseline;
    justify-content: center;
    white-space: nowrap;
    flex-wrap: nowrap;
}

.label {
    font-size: 1rem;
    color: var(--text-muted);
}

.level {
    font-size: 1.4rem;
    font-weight: bold;
    text-transform: uppercase;
    line-height: 1.2;
}

.percentage {
    font-size: 1rem;
    font-weight: bold;
}

.difficulty-indicator .label {
    color: var(--text-color);
}

.difficulty-indicator .value {
    font-weight: bold;
    text-transform: uppercase;
    text-shadow: 0 0 10px currentColor;
    transition: color 0.3s ease;
    display: inline-block;
    min-width: 120px; /* Reserve space for longest text */
    text-align: left;
}

.error {
    color: #ff4d4d;
    font-size: 0.9rem;
}

.btn-text {
    background: none;
    border: none;
    color: var(--accent-cyan);
    font-size: 0.9rem;
    cursor: pointer;
    text-decoration: underline;
    opacity: 0.8;
    transition: opacity 0.3s;
}

.btn-text:hover {
    opacity: 1;
}

.advanced-toggle {
    margin-bottom: 10px;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
