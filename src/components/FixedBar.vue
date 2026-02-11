<script setup>
import { computed, ref } from 'vue';
import { usePuzzleStore } from '@/stores/puzzle';
import { formatTime } from '@/utils/timeUtils';
import { useI18n } from '@/composables/useI18n';

const store = usePuzzleStore();
const { t } = useI18n();

const isVisible = ref(false);
const isProgressVisible = ref(true); // Toggle for progress percentage

// Logic to show bar on scroll
window.addEventListener('scroll', () => {
  isVisible.value = window.scrollY > 100;
});

const progressText = computed(() => {
  const percent = store.progressPercentage;
  if (typeof percent !== 'number') return '0.0%';
  return isProgressVisible.value 
    ? `${percent.toFixed(1)}%` 
    : '???';
});

const formattedTime = computed(() => formatTime(store.elapsedTime));

const toggleVisibility = () => {
  isProgressVisible.value = !isProgressVisible.value;
};
</script>

<template>
  <div id="fixed-bar" :class="{ visible: isVisible }">
    <div class="fixed-content">
      <div class="fixed-stat">
        <span>{{ t('fixed.time') }}</span>
        <span>{{ formattedTime }}</span>
      </div>
      
      <div class="fixed-stat">
        <span>{{ t('fixed.progress') }}</span>
        <span style="min-width: 60px; text-align: right;">{{ progressText }}</span>
        <button class="btn-eye" @click="toggleVisibility" :title="isProgressVisible ? t('fixed.hide') : t('fixed.show')">
           <span v-if="isProgressVisible">👁️</span>
           <span v-else>🔒</span>
        </button>
      </div>
      
      <div class="progress-line-container">
        <div class="progress-line-fill" :style="{ width: `${store.progressPercentage || 0}%` }"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#fixed-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 60px;
    background: var(--fixed-bar-bg);
    backdrop-filter: blur(10px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid var(--fixed-bar-border);
    transform: translateY(-100%);
    transition: transform 0.3s ease;
    box-shadow: var(--fixed-bar-shadow);
}

#fixed-bar.visible {
    transform: translateY(0);
}

.fixed-content {
    display: flex;
    gap: 40px;
    align-items: center;
    font-size: 1.1rem;
    font-weight: 300;
    width: 100%;
    max-width: 800px;
    justify-content: center;
    position: relative;
    height: 100%;
}

.fixed-stat {
    display: flex;
    gap: 10px;
    align-items: center;
    color: var(--text-strong);
}

.fixed-stat span:first-child {
    font-size: 0.9rem;
    text-transform: uppercase;
    color: var(--text-muted);
}

.progress-line-container {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: var(--progress-track-bg);
}

.progress-line-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-cyan), var(--accent-purple));
    width: 0%;
    transition: width 0.3s ease;
    box-shadow: 0 0 10px var(--accent-cyan);
}

.btn-eye {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0 5px;
    color: var(--text-color);
    opacity: 0.7;
    transition: opacity 0.2s;
}

.btn-eye:hover {
    opacity: 1;
}
</style>
