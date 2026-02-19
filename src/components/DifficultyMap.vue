<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { calculateDifficulty } from '@/utils/puzzleUtils';
import { useI18n } from '@/composables/useI18n';

const props = defineProps({
  size: {
    type: Number,
    required: true
  },
  density: {
    type: Number,
    required: true
  },
  actualDifficulty: {
    type: Number,
    default: null
  },
  interactive: {
    type: Boolean,
    default: false
  },
  width: {
    type: Number,
    default: 300
  },
  height: {
    type: Number,
    default: 200
  }
});

const emit = defineEmits(['update:size', 'update:density']);
const { t } = useI18n();

const canvasRef = ref(null);
let cachedBackground = null;
const isDragging = ref(false);

// Constants for ranges
const MIN_SIZE = 5;
const MAX_SIZE = 80;
const MIN_DENSITY = 10;
const MAX_DENSITY = 90;

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

const drawMap = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  try {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Use cached background if available
    if (cachedBackground) {
        ctx.drawImage(cachedBackground, 0, 0, width, height);
    } else {
        // Draw Gradient Background (Optimized)
        // Use a smaller buffer to reduce calculations
        const bufferWidth = 40;
        const bufferHeight = 40;
        
        const bufferCanvas = document.createElement('canvas');
        bufferCanvas.width = bufferWidth;
        bufferCanvas.height = bufferHeight;
        const bufferCtx = bufferCanvas.getContext('2d');
        
        const imgData = bufferCtx.createImageData(bufferWidth, bufferHeight);
        const data = imgData.data;
        
        for (let y = 0; y < bufferHeight; y++) {
          for (let x = 0; x < bufferWidth; x++) {
            const normalizedX = x / bufferWidth;
            const normalizedY = 1 - (y / bufferHeight); // 0 at bottom, 1 at top
            
            const fRate = (MIN_DENSITY + normalizedX * (MAX_DENSITY - MIN_DENSITY)) / 100; // 0.1 to 0.9
            const sSize = MIN_SIZE + normalizedY * (MAX_SIZE - MIN_SIZE);    // 5 to 80
            
            const { value } = calculateDifficulty(fRate, sSize);
            
            // Color Mapping
            const hue = 120 * (1 - value / 100);
            const [r, g, b] = hslToRgb(hue / 360, 1, 0.5);
            
            const index = (y * bufferWidth + x) * 4;
            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
            data[index + 3] = 255; // Alpha
          }
        }
        bufferCtx.putImageData(imgData, 0, 0);
        
        // Draw scaled up
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bufferCanvas, 0, 0, width, height);
        
        cachedBackground = bufferCanvas;
    }

    // Draw current position
    // Clamp values
    const currentFill = Math.max(MIN_DENSITY, Math.min(MAX_DENSITY, props.density));
    const currentSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, props.size));
    
    const posX = ((currentFill - MIN_DENSITY) / (MAX_DENSITY - MIN_DENSITY)) * width;
    const posY = (1 - (currentSize - MIN_SIZE) / (MAX_SIZE - MIN_SIZE)) * height;

    // Draw Point
    ctx.beginPath();
    ctx.arc(posX, posY, 6, 0, Math.PI * 2);
    
    // Use actual difficulty color if provided, otherwise white
    if (props.actualDifficulty !== null) {
        const hue = 120 * (1 - Math.max(0, Math.min(100, props.actualDifficulty)) / 100);
        const [r, g, b] = hslToRgb(hue / 360, 1, 0.5);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.lineWidth = 3; // Thicker border for visibility
        ctx.strokeStyle = '#fff'; // White border to make it pop
    } else {
        ctx.fillStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
    }
    
    ctx.fill();
    ctx.stroke();
  } catch (e) {
    console.error("Error drawing difficulty map:", e);
  }
};

const updateFromEvent = (e) => {
    if (!props.interactive) return;

    const canvas = canvasRef.value;
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
    
    const normalizedX = x / rect.width;
    const normalizedY = 1 - (y / rect.height);
    
    const newFill = MIN_DENSITY + normalizedX * (MAX_DENSITY - MIN_DENSITY);
    const newSize = MIN_SIZE + normalizedY * (MAX_SIZE - MIN_SIZE);
    
    emit('update:density', Math.round(newFill));
    emit('update:size', Math.round(newSize));
};

const startDrag = (e) => {
    if (!props.interactive) return;
    isDragging.value = true;
    updateFromEvent(e);
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('touchmove', onDrag, { passive: false });
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
};

const onDrag = (e) => {
    if (!isDragging.value) return;
    if (e.cancelable) e.preventDefault(); // Prevent scrolling on touch
    updateFromEvent(e);
};

const stopDrag = () => {
    isDragging.value = false;
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('touchmove', onDrag);
    window.removeEventListener('mouseup', stopDrag);
    window.removeEventListener('touchend', stopDrag);
};

onMounted(() => {
    nextTick(drawMap);
});

onUnmounted(() => {
    stopDrag(); // Cleanup just in case
});

watch(() => [props.size, props.density, props.actualDifficulty, props.width, props.height], () => {
    requestAnimationFrame(drawMap);
});
</script>

<template>
  <div class="difficulty-map-container">
    <canvas 
      ref="canvasRef" 
      :width="width" 
      :height="height"
      @mousedown="startDrag"
      @touchstart="startDrag"
      :class="{ 'interactive': interactive }"
    ></canvas>
    
    <div class="axis-labels">
      <span class="y-label">{{ t('difficultyMap.size') }}</span>
      <span class="x-label">{{ t('difficultyMap.density') }}</span>
    </div>
  </div>
</template>

<style scoped>
.difficulty-map-container {
  position: relative;
  display: inline-block;
  margin: 10px 0;
}

canvas {
  border: 1px solid var(--panel-border, #444);
  border-radius: 8px;
  background: transparent;
  cursor: default;
  display: block; /* Remove inline gap */
  width: 100%; /* Responsive */
  max-width: 100%;
}

canvas.interactive {
  cursor: crosshair;
}

.axis-labels {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.y-label {
  position: absolute;
  left: 5px;
  top: 5px;
  font-size: 10px;
  color: rgba(0,0,0,0.5);
  transform-origin: top left;
  font-weight: bold;
  text-shadow: 0 0 2px rgba(255,255,255,0.8);
}

.x-label {
  position: absolute;
  right: 5px;
  bottom: 5px;
  font-size: 10px;
  color: rgba(0,0,0,0.5);
  font-weight: bold;
  text-shadow: 0 0 2px rgba(255,255,255,0.8);
}
</style>
