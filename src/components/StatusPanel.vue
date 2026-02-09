<script setup>
import { computed } from 'vue';
import { usePuzzleStore } from '@/stores/puzzle';
import { useTimer } from '@/composables/useTimer';
import { useI18n } from '@/composables/useI18n';
import { RotateCcw, RefreshCw, Eye, Undo } from 'lucide-vue-next';

const store = usePuzzleStore();
const { formatTime } = useTimer();
const { t } = useI18n();

const formattedTime = computed(() => formatTime(store.elapsedTime));
const progressText = computed(() => `${store.progressPercentage.toFixed(3)}%`);
</script>

<template>
  <div class="status-panel glass-panel">
    <div class="stats-group">
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
           <button class="eye-btn" :title="t('status.progress')">
             <Eye :size="20" />
           </button>
        </div>
      </div>
    </div>

    <div class="panel-separator"></div>

    <div class="actions-group">
      <button class="action-btn" @click="store.resetGame" :title="t('actions.reset')">
        <RefreshCw :size="20" />
      </button>
      <div class="action-separator"></div>
      <button class="action-btn" @click="store.undo" :title="t('actions.undo')">
        <Undo :size="20" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.status-panel {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  padding: 0;
  border-radius: 15px;
  background: var(--panel-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--panel-border);
  box-shadow: var(--panel-shadow);
  margin-bottom: 30px;
  width: 100%;
  max-width: 650px;
  overflow: hidden;
  height: 90px;
}

.stats-group {
  flex: 1;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 10px 20px;
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

.eye-btn {
  background: transparent;
  border: none;
  color: var(--text-strong);
  opacity: 0.7;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: opacity 0.2s;
}

.eye-btn:hover {
  opacity: 1;
  color: var(--primary-neon);
}

.panel-separator {
  width: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 10px 0;
}

.actions-group {
  display: flex;
  flex-direction: column;
  width: 60px;
}

.action-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-strong);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--primary-neon);
}

.action-separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  width: 80%;
  align-self: center;
}
</style>