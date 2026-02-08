<script setup>
import { onMounted, onUnmounted, computed } from 'vue';
import { usePuzzleStore } from '@/stores/puzzle';
import { useHints } from '@/composables/useHints';
import { useNonogram } from '@/composables/useNonogram';
import Cell from './Cell.vue';
import Hints from './Hints.vue';

const store = usePuzzleStore();
const { rowHints, colHints } = useHints(computed(() => store.solution));
const { startDrag, onMouseEnter, stopDrag } = useNonogram();

// Global mouseup to stop dragging even if mouse leaves grid
const handleGlobalMouseUp = () => {
    stopDrag();
};

onMounted(() => {
    window.addEventListener('mouseup', handleGlobalMouseUp);
});

onUnmounted(() => {
    window.removeEventListener('mouseup', handleGlobalMouseUp);
});
</script>

<template>
  <div class="game-board-wrapper">
    <div class="game-container">
      <div class="corner-spacer"></div>
      
      <!-- Column Hints -->
      <Hints :hints="colHints" orientation="col" />
      
      <!-- Row Hints -->
      <Hints :hints="rowHints" orientation="row" />
      
      <!-- Grid -->
      <div 
        class="grid" 
        :style="{ 
          gridTemplateColumns: `repeat(${store.size}, var(--cell-size))`,
          gridTemplateRows: `repeat(${store.size}, var(--cell-size))`
        }"
        @mouseleave="stopDrag"
      >
        <template v-for="(row, r) in store.playerGrid" :key="r">
          <Cell 
            v-for="(state, c) in row" 
            :key="`${r}-${c}`"
            :state="state"
            :r="r"
            :c="c"
            :class="{ 
                'guide-right': (c + 1) % 5 === 0 && c !== store.size - 1,
                'guide-bottom': (r + 1) % 5 === 0 && r !== store.size - 1
            }"
            @start-drag="startDrag"
            @enter-cell="onMouseEnter"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-board-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-container {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  gap: 0;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.3);
  margin-top: 10px;
}

.corner-spacer {
  width: 100px; /* Must match Row Hints width */
  height: auto; /* Adapts to Col Hints height */
}

.grid {
  display: grid;
  gap: var(--gap-size);
  padding: 5px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

/* Guide Lines */
:deep(.cell.guide-right) {
    border-right: 2px solid rgba(0, 242, 255, 0.5) !important;
}

:deep(.cell.guide-bottom) {
    border-bottom: 2px solid rgba(0, 242, 255, 0.5) !important;
}
</style>
