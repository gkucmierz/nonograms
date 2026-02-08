<script setup>
import { onMounted, onUnmounted, computed, ref, watch, nextTick } from 'vue';
import { usePuzzleStore } from '@/stores/puzzle';
import { useHints } from '@/composables/useHints';
import { useNonogram } from '@/composables/useNonogram';
import Cell from './Cell.vue';
import Hints from './Hints.vue';

const store = usePuzzleStore();
const { rowHints, colHints } = useHints(computed(() => store.solution));
const { startDrag, onMouseEnter, stopDrag } = useNonogram();

const cellSize = ref(30);
const rowHintsRef = ref(null);

const getRowHintsWidth = () => {
  const el = rowHintsRef.value?.$el;
  if (!el) return 0;
  return el.offsetWidth || 0;
};

const computeCellSize = () => {
  const vw = Math.min(window.innerWidth, 900);
  const rootStyles = getComputedStyle(document.documentElement);
  const hintWidth = getRowHintsWidth();
  const gapRaw = rootStyles.getPropertyValue('--gap-size') || '2px';
  const gridPadRaw = rootStyles.getPropertyValue('--grid-padding') || '5px';
  const gap = parseFloat(gapRaw);
  const gridPad = parseFloat(gridPadRaw);
  const bodyStyles = getComputedStyle(document.body);
  const bodyPadding = parseFloat(bodyStyles.paddingLeft) + parseFloat(bodyStyles.paddingRight);
  const availableForGrid = vw - bodyPadding - hintWidth;
  const size = Math.floor((availableForGrid - gridPad * 2 - (store.size - 1) * gap) / store.size);
  cellSize.value = Math.max(18, Math.min(36, size));
};

const handleGlobalMouseUp = () => {
  stopDrag();
};

const handleGlobalPointerUp = () => {
  stopDrag();
};

const handlePointerMove = (e) => {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (!el) return;
  const r = el.getAttribute('data-r');
  const c = el.getAttribute('data-c');
  if (r != null && c != null) {
    onMouseEnter(Number(r), Number(c));
  }
};

onMounted(() => {
  nextTick(() => {
    computeCellSize();
  });
  window.addEventListener('resize', computeCellSize);
  window.addEventListener('mouseup', handleGlobalMouseUp);
  window.addEventListener('pointerup', handleGlobalPointerUp);
  window.addEventListener('touchend', handleGlobalPointerUp, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('resize', computeCellSize);
  window.removeEventListener('mouseup', handleGlobalMouseUp);
  window.removeEventListener('pointerup', handleGlobalPointerUp);
  window.removeEventListener('touchend', handleGlobalPointerUp);
});

watch(() => store.size, async () => {
  await nextTick();
  computeCellSize();
});
</script>

<template>
  <div class="game-board-wrapper">
    <div class="game-container" :style="{ '--cell-size': `${cellSize}px` }">
      <div class="corner-spacer"></div>
      
      <!-- Column Hints -->
      <Hints :hints="colHints" orientation="col" :size="store.size" />
      
      <!-- Row Hints -->
      <Hints ref="rowHintsRef" :hints="rowHints" orientation="row" :size="store.size" />
      
      <!-- Grid -->
      <div 
        class="grid" 
        :style="{ 
          gridTemplateColumns: `repeat(${store.size}, var(--cell-size))`,
          gridTemplateRows: `repeat(${store.size}, var(--cell-size))`
        }"
        @pointermove.prevent="handlePointerMove"
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
  height: auto; /* Adapts to Col Hints height */
}

.grid {
  display: grid;
  gap: var(--gap-size);
  padding: var(--grid-padding);
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
