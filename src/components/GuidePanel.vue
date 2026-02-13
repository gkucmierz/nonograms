<script setup>
import { useSolver } from '@/composables/useSolver';
import { useI18n } from '@/composables/useI18n';

const { 
    isPlaying, 
    isStuck,
    speedLabel, 
    statusText, 
    step, 
    togglePlay, 
    changeSpeed,
    boost
} = useSolver();
const { t } = useI18n();
</script>

<template>
  <div class="guide-panel">
    <div class="status-text">{{ statusText }}</div>
    
    <div class="guide-controls">
      <button class="btn-neon small" @click="togglePlay" :class="{ active: isPlaying }">
        {{ isPlaying ? t('guide.pause') : t('guide.play') }}
      </button>
      
      <button class="btn-neon small" @click="step" :disabled="isPlaying">
        {{ t('guide.step') }}
      </button>
      
      <button class="btn-neon small" @click="changeSpeed">
        {{ t('guide.speed') }}: {{ speedLabel }}
      </button>

      <button v-if="isStuck" class="btn-neon small boost-btn" @click="boost">
        ⚡ Boost (DFS)
      </button>
    </div>
  </div>
</template>

<style scoped>
.guide-panel {
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 20px;
    width: 100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    backdrop-filter: blur(5px);
    box-shadow: var(--panel-shadow);
}

.status-text {
    width: 100%;
    text-align: center;
    margin-bottom: 10px;
    font-size: 0.9rem;
    color: var(--text-muted);
    min-height: 20px;
    font-style: italic;
}

.guide-controls {
    display: flex;
    gap: 10px;
}

.btn-neon.small {
    padding: 5px 15px;
    font-size: 0.8rem;
}

.boost-btn {
    border-color: #ffd700;
    color: #ffd700;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
}

.boost-btn:hover {
    background: rgba(255, 215, 0, 0.1);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
}
</style>
