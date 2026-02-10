<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Fireworks } from 'fireworks-js';
import { usePuzzleStore } from '@/stores/puzzle';
import { useI18n } from '@/composables/useI18n';
import { useTimer } from '@/composables/useTimer';
import xIcon from '@/assets/brands/x.svg';
import facebookIcon from '@/assets/brands/facebook.svg';
import whatsappIcon from '@/assets/brands/whatsapp.svg';

const store = usePuzzleStore();
const { t } = useI18n();
const { formatTime } = useTimer();
const fireworksRef = ref(null);
let fireworksInstance = null;
let audioContext = null;
let masterGain = null;
const shareInProgress = ref(false);

const formattedTime = computed(() => formatTime(store.elapsedTime));
const shareText = computed(() => t('win.shareText', { size: store.size, time: formattedTime.value }));

const handleClose = () => {
  store.closeWinModal();
};

const handleKeyDown = (e) => {
  if (e.key === 'Escape') {
    handleClose();
  }
};

const playFanfare = async () => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  audioContext = new AudioCtx();
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
    } catch {
      return;
    }
  }
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.18;
  masterGain.connect(audioContext.destination);
  const notes = [
    { time: 0.0, dur: 0.18, freqs: [523.25, 659.25, 783.99] },
    { time: 0.2, dur: 0.18, freqs: [587.33, 740.0, 880.0] },
    { time: 0.4, dur: 0.22, freqs: [659.25, 830.61, 987.77] },
    { time: 0.7, dur: 0.35, freqs: [698.46, 880.0, 1046.5] }
  ];
  const now = audioContext.currentTime;
  notes.forEach(({ time, dur, freqs }) => {
    freqs.forEach((freq) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + time);
      gain.gain.linearRampToValueAtTime(0.8, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);
    });
  });
};

const triggerVibration = () => {
  if (!('vibrate' in navigator)) return;
  const isCoarse = window.matchMedia?.('(pointer: coarse)')?.matches;
  const isTouch = navigator.maxTouchPoints && navigator.maxTouchPoints > 0;
  if (isCoarse || isTouch) {
    navigator.vibrate([80, 40, 120, 40, 180]);
  }
};

const buildShareCanvas = () => {
  const grid = store.playerGrid;
  if (!grid || !grid.length) return null;
  const appUrl = 'https://nonograms.7u.pl/';
  const size = store.size;
  const maxBoard = 640;
  const cellSize = Math.max(8, Math.floor(maxBoard / size));
  const boardSize = cellSize * size;
  const padding = 28;
  const headerHeight = 64;
  const footerHeight = 28;
  const width = boardSize + padding * 2;
  const height = boardSize + padding * 2 + headerHeight + footerHeight;
  const scale = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#1b2a4a');
  bg.addColorStop(1, '#0a1324');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(12, 12, width - 24, height - 24);
  ctx.fillStyle = '#e8fbff';
  ctx.font = '700 26px "Segoe UI", sans-serif';
  ctx.fillText(t('app.title'), padding, padding + 10);
  ctx.font = '600 16px "Segoe UI", sans-serif';
  ctx.fillText(`${t('win.time')} ${formattedTime.value}`, padding, padding + 34);
  const gridX = padding;
  const gridY = padding + headerHeight;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.fillRect(gridX, gridY, boardSize, boardSize);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i++) {
    const x = gridX + i * cellSize;
    const y = gridY + i * cellSize;
    ctx.beginPath();
    ctx.moveTo(x, gridY);
    ctx.lineTo(x, gridY + boardSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gridX, y);
    ctx.lineTo(gridX + boardSize, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#00f2fe';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = Math.max(1.5, Math.floor(cellSize * 0.12));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const state = grid[r]?.[c];
      if (state === 1) {
        const x = gridX + c * cellSize + 1;
        const y = gridY + r * cellSize + 1;
        ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
      } else if (state === 2) {
        const x = gridX + c * cellSize + cellSize * 0.2;
        const y = gridY + r * cellSize + cellSize * 0.2;
        const d = cellSize * 0.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + d, y + d);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + d, y);
        ctx.lineTo(x, y + d);
        ctx.stroke();
      }
    }
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '500 14px "Segoe UI", sans-serif';
  ctx.fillText(appUrl, padding, height - padding + 6);
  return canvas;
};

const canvasToBlob = (canvas) => new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));

const createShareBlob = async () => {
  const canvas = buildShareCanvas();
  if (!canvas) return null;
  return canvasToBlob(canvas);
};

const downloadShareImage = async () => {
  const blob = await createShareBlob();
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nonogram-${store.size}x${store.size}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const buildShareUrl = (target, text, url) => {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  if (target === 'x') {
    return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  }
  if (target === 'facebook') {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
  }
  if (target === 'whatsapp') {
    return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  }
  return '';
};

const shareTo = async (target) => {
  if (shareInProgress.value) return;
  shareInProgress.value = true;
  try {
    const blob = await createShareBlob();
    if (!blob) return;
    const file = new File([blob], `nonogram-${store.size}x${store.size}.png`, { type: 'image/png' });
    const text = shareText.value;
    const url = window.location.href;
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        text,
        title: t('app.title'),
        url
      });
      return;
    }
    await downloadShareImage();
    const shareUrl = buildShareUrl(target, text, url);
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener');
    }
  } finally {
    shareInProgress.value = false;
  }
};

onMounted(() => {
  if (fireworksRef.value) {
    fireworksInstance = new Fireworks(fireworksRef.value, {
      autoresize: true,
      opacity: 0.6,
      acceleration: 1.05,
      friction: 0.98,
      gravity: 1.4,
      particles: 60,
      traceLength: 3,
      traceSpeed: 10,
      explosion: 5,
      intensity: 35,
      flickering: 60,
      hue: { min: 170, max: 210 },
      delay: { min: 20, max: 40 },
      rocketsPoint: { min: 50, max: 50 }
    });
    fireworksInstance.start();
  }
  playFanfare();
  triggerVibration();
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  fireworksInstance?.stop(true);
  fireworksInstance = null;
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  masterGain = null;
});
</script>

<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div ref="fireworksRef" class="fireworks-layer"></div>
    <div class="modal glass-panel">
      <h2>{{ t('win.title') }}</h2>
      <p>{{ t('win.message') }}</p>
      
      <div class="stats">
        <div class="stat">
          <span>{{ t('win.time') }}</span>
          <strong>{{ formattedTime }}</strong>
        </div>
      </div>

      <div class="share">
        <div class="share-title">{{ t('win.shareTitle') }}</div>
        <div class="share-buttons">
          <button class="btn-neon secondary share-btn" :disabled="shareInProgress" :aria-label="t('win.shareX')" @click="shareTo('x')">
            <img :src="xIcon" alt="" class="share-icon" />
          </button>
          <button class="btn-neon secondary share-btn" :disabled="shareInProgress" :aria-label="t('win.shareFacebook')" @click="shareTo('facebook')">
            <img :src="facebookIcon" alt="" class="share-icon" />
          </button>
          <button class="btn-neon secondary share-btn" :disabled="shareInProgress" :aria-label="t('win.shareWhatsapp')" @click="shareTo('whatsapp')">
            <img :src="whatsappIcon" alt="" class="share-icon" />
          </button>
        </div>
        <button class="btn-neon secondary share-download" :disabled="shareInProgress" @click="downloadShareImage">
          {{ t('win.shareDownload') }}
        </button>
      </div>

      <div class="actions">
        <button class="btn-neon" @click="store.resetGame">{{ t('win.playAgain') }}</button>
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
  z-index: 1000;
  animation: fadeIn 0.5s ease;
}

.fireworks-layer {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.modal {
  padding: 40px;
  text-align: center;
  width: fit-content;
  max-width: min(92vw, 560px);
  min-width: 280px;
  border: 1px solid var(--primary-accent);
  box-shadow: 0 0 50px rgba(0, 242, 255, 0.2);
  animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  z-index: 1001;
  overflow-wrap: anywhere;
}

h2 {
  font-size: 2.5rem;
  color: var(--primary-accent);
  margin: 0 0 10px 0;
  text-shadow: 0 0 20px var(--primary-accent);
  overflow-wrap: anywhere;
}

p {
  color: var(--text-secondary);
  font-size: 1.2rem;
  margin-bottom: 30px;
  overflow-wrap: anywhere;
}

.stats {
  margin-bottom: 30px;
  padding: 20px;
  background: var(--panel-bg-strong);
  border-radius: 8px;
}

.stat {
  font-size: 1.2rem;
}

.stat strong {
  color: var(--text-strong);
  margin-left: 10px;
}

.share {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-title {
  font-size: 0.95rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
  overflow-wrap: anywhere;
}

.share-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.share-btn {
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.share-icon {
  width: 22px;
  height: 22px;
  display: block;
}

.share-download {
  align-self: center;
  padding: 8px 18px;
  font-size: 0.85rem;
  max-width: 100%;
  white-space: normal;
}

.actions .btn-neon {
  max-width: 100%;
  white-space: normal;
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
