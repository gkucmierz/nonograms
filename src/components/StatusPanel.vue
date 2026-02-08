<script setup>
import { computed } from 'vue';
import { usePuzzleStore } from '@/stores/puzzle';
import { useTimer } from '@/composables/useTimer';

const store = usePuzzleStore();
const { formatTime } = useTimer();

const formattedTime = computed(() => formatTime(store.elapsedTime));
const progressText = computed(() => `${store.progressPercentage.toFixed(3)}%`);
</script>

<template>
  <div class="status-panel glass-panel">
    <div class="stat-item">
      <span class="label">CZAS</span>
      <span class="value">{{ formattedTime }}</span>
    </div>
    
    <div class="stat-item">
      <span class="label">RUCHY</span>
      <span class="value">{{ store.moves }}</span>
    </div>
    
    <div class="stat-item">
      <span class="label">POSTĘP</span>
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
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
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
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 1px;
}

.value {
  font-size: 1.8rem;
  color: #fff;
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