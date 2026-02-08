<script setup>
import { useSolver } from '@/composables/useSolver';

const { 
    isPlaying, 
    speedLabel, 
    statusText, 
    step, 
    togglePlay, 
    changeSpeed 
} = useSolver();
</script>

<template>
  <div class="guide-panel">
    <div class="status-text">{{ statusText }}</div>
    
    <div class="guide-controls">
      <button class="btn-neon small" @click="togglePlay" :class="{ active: isPlaying }">
        {{ isPlaying ? 'PAUSE' : 'PLAY' }}
      </button>
      
      <button class="btn-neon small" @click="step" :disabled="isPlaying">
        STEP
      </button>
      
      <button class="btn-neon small" @click="changeSpeed">
        SPEED: {{ speedLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.guide-panel {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(0, 242, 254, 0.3);
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 20px;
    width: 100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    backdrop-filter: blur(5px);
}

.status-text {
    width: 100%;
    text-align: center;
    margin-bottom: 10px;
    font-size: 0.9rem;
    color: #ccc;
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
</style>
<style>
.btn-neon.small {
    padding: 8px 16px;
    font-size: 0.8rem;
}
</style>
