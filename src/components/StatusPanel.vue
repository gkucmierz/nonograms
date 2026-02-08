<script setup>
import { computed } from 'vue';
import { usePuzzleStore } from '@/stores/puzzle';
import { useTimer } from '@/composables/useTimer';
import { useI18n } from '@/composables/useI18n';

const store = usePuzzleStore();
const { formatTime } = useTimer();
const { t } = useI18n();

const formattedTime = computed(() => formatTime(store.elapsedTime));
const progressText = computed(() => `${store.progressPercentage.toFixed(3)}%`);
</script>

<template>
  <div class="status-panel glass-panel">
    <div class="stat-item">
      <span class="label">{{ t('status.time') }}</span>
      <span class="value">{{ formattedTime }}</span>
    </div>
    
    <div class="stat-item">
      <span class="label">{{ t('status.moves') }}</span>
      <span class="value">{{ store.moves }}</span>
    </div>
    
    <div class="stat-item">
      <span class="label">{{ t('status.progress') }}</span>
      <div class="progress-wrapper">
         <span class="value small">{{ progressText }}</span>
         <span class="eye-icon">👁️</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-panel {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20px 40px;
  border-radius: 15px;
  background: var(--panel-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--panel-border);
  box-shadow: var(--panel-shadow);
  margin-bottom: 30px;
  width: 100%;
  max-width: 600px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.label {
  font-size: 0.8rem;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.value {
  font-size: 1.8rem;
  color: var(--text-strong);
  font-weight: 300;
  font-family: 'Courier New', monospace;
}

.value.small {
  font-size: 1.2rem;
}

.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.eye-icon {
  opacity: 0.7;
  cursor: pointer;
}
</style>
