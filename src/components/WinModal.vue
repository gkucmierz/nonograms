<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Fireworks } from 'fireworks-js';
import { usePuzzleStore } from '@/stores/puzzle';
import { useI18n } from '@/composables/useI18n';
import { formatTime } from '@/utils/timeUtils';
import { playFanfare, cleanupAudio } from '@/utils/audio';
import { 
  buildShareUrl, 
  downloadShareSVG as utilsDownloadShareSVG, 
  downloadShareImage as utilsDownloadShareImage, 
  createShareBlob 
} from '@/utils/shareUtils';
import { Download, FileCode } from 'lucide-vue-next';

const store = usePuzzleStore();
const { t } = useI18n();
const fireworksRef = ref(null);
let fireworksInstance = null;
const shareInProgress = ref(false);

const formattedTime = computed(() => formatTime(store.elapsedTime));
const shareText = computed(() => t('win.shareText', { size: store.size, time: formattedTime.value }));

const handleClose = () => {
  store.closeWinModal();
};

const handleKeyDown = (e) => {
  if (e.key === 'Escape') {
    e.stopImmediatePropagation?.();
    e.preventDefault?.();
    handleClose();
  }
};

const triggerVibration = () => {
  if (!('vibrate' in navigator)) return;
  const isCoarse = window.matchMedia?.('(pointer: coarse)')?.matches;
  const isTouch = navigator.maxTouchPoints && navigator.maxTouchPoints > 0;
  if (isCoarse || isTouch) {
    navigator.vibrate([80, 40, 120, 40, 180]);
  }
};

const getShareData = () => ({
  grid: store.playerGrid,
  size: store.size,
  currentDensity: store.currentDensity,
  guideUsageCount: store.guideUsageCount
});

const downloadShareSVG = () => {
  utilsDownloadShareSVG(getShareData(), t, formattedTime.value);
};

const downloadShareImage = async () => {
  await utilsDownloadShareImage(getShareData(), t, formattedTime.value);
};

const shareTo = async (target) => {
  if (shareInProgress.value) return;
  shareInProgress.value = true;
  
  const text = shareText.value;
  const url = window.location.href;
  const shareUrl = buildShareUrl(target, text, url);

  try {
    // Try native share first if available (supports images)
    if (navigator.share && navigator.canShare) {
      const blob = await createShareBlob(getShareData(), t, formattedTime.value);
      if (blob) {
        const file = new File([blob], `nonogram-${store.size}x${store.size}.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            text,
            title: t('app.title'),
            url
          });
          return;
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return; // User cancelled native share, do nothing
    }
    // Other errors -> fall through to fallback
  } finally {
    shareInProgress.value = false;
  }

  // Fallback: Direct Link + Download
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'noopener');
  }
  
  // Trigger download as "screenshot support"
  downloadShareImage();
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
  cleanupAudio();
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

      <div class="social-section">
        <div class="social-header">{{ t('win.shareTitle') }}</div>
        <div class="social-grid">
          <!-- X (Twitter) -->
          <button class="btn-neon secondary social-item" :disabled="shareInProgress" :aria-label="t('win.shareX')" @click="shareTo('x')">
            <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon"><path d="M18.901 3H22l-7.21 8.26L23 21h-6.66L11.13 14.76 5.66 21H2.56l7.73-8.83L1 3h6.8l4.63 5.56L18.9 3h.001zm-1.2 15.9h1.77L6.44 5.1H4.44l13.26 13.8z"/></svg>
          </button>
          <!-- Facebook -->
          <button class="btn-neon secondary social-item" :disabled="shareInProgress" :aria-label="t('win.shareFacebook')" @click="shareTo('facebook')">
            <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </button>
          <!-- WhatsApp -->
          <button class="btn-neon secondary social-item" :disabled="shareInProgress" :aria-label="t('win.shareWhatsapp')" @click="shareTo('whatsapp')">
            <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          </button>
          <!-- Download Screenshot (Compact) -->
          <button class="btn-neon secondary social-item" :disabled="shareInProgress" :aria-label="t('win.shareDownload')" @click="downloadShareImage">
            <Download :size="20" />
          </button>
          <!-- Download SVG (Compact) -->
          <button class="btn-neon secondary social-item" :disabled="shareInProgress" aria-label="Download SVG" @click="downloadShareSVG">
            <FileCode :size="20" />
          </button>
        </div>
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

.social-section {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-header {
  font-size: 0.95rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
  overflow-wrap: anywhere;
}

.social-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.social-item {
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.social-icon {
  width: 22px;
  height: 22px;
  display: block;
}


.social-download {
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
