<script setup>
import { usePuzzleStore } from '@/stores/puzzle';

const store = usePuzzleStore();

const levels = [
  { id: 'easy', label: 'ŁATWY 5X5' },
  { id: 'medium', label: 'ŚREDNI 10X10' },
  { id: 'hard', label: 'TRUDNY 15X15' }
];

const emit = defineEmits(['open-custom', 'toggle-guide']);
</script>

<template>
  <div class="level-selector">
    <button 
      v-for="lvl in levels" 
      :key="lvl.id"
      class="btn-neon" 
      :class="{ active: store.currentLevelId === lvl.id }"
      @click="store.initGame(lvl.id)"
    >
      {{ lvl.label }}
    </button>
    
    <button 
        class="btn-neon"
        :class="{ active: store.currentLevelId === 'custom' }"
        @click="emit('open-custom')"
    >
        WŁASNY
    </button>

    <button 
        class="btn-neon guide-btn"
        @click="emit('toggle-guide')"
    >
        GUIDE ❓
    </button>
  </div>
</template>

<style scoped>
.level-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
  margin-bottom: 20px;
}

.btn-neon {
  padding: 10px 20px;
  border-radius: 20px;
  text-transform: uppercase;
  font-size: 0.9rem;
  letter-spacing: 1px;
}

.guide-btn {
  /* Specific styling for guide if needed */
}
</style>