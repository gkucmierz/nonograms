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
const activeRow = ref(null);
const activeCol = ref(null);
const isFinePointer = ref(false);
const scrollWrapper = ref(null);
const scrollTrack = ref(null);
const showScrollbar = ref(false);
const thumbWidth = ref(20);
const thumbLeft = ref(0);
let isDraggingScroll = false;
let dragStartX = 0;
let dragStartLeft = 0;

const checkScroll = () => {
  const el = scrollWrapper.value;
  if (!el) return;
  const sw = el.scrollWidth;
  const cw = el.clientWidth;
  
  // Only show custom scrollbar on mobile/tablet (width < 768px) and if content overflows
  const isMobile = window.innerWidth <= 768;
  showScrollbar.value = isMobile && (sw > cw + 1);
  
  if (showScrollbar.value) {
    // Thumb width percentage = (viewport / total) * 100
    const ratio = cw / sw;
    thumbWidth.value = Math.max(10, ratio * 100);
  }
};

const handleScroll = () => {
  if (isDraggingScroll) return;
  const el = scrollWrapper.value;
  if (!el) return;
  const sw = el.scrollWidth;
  const cw = el.clientWidth;
  const sl = el.scrollLeft;
  const maxScroll = sw - cw;
  if (maxScroll <= 0) return;
  
  // Map scroll position to thumb position (0 to 100 - thumbWidth)
  const maxThumb = 100 - thumbWidth.value;
  thumbLeft.value = (sl / maxScroll) * maxThumb;
};

const startScrollDrag = (e) => {
  isDraggingScroll = true;
  dragStartX = e.clientX || e.touches[0].clientX;
  dragStartLeft = thumbLeft.value;
  
  document.addEventListener('mousemove', onScrollDrag);
  document.addEventListener('mouseup', stopScrollDrag);
  document.addEventListener('touchmove', onScrollDrag, { passive: false });
  document.addEventListener('touchend', stopScrollDrag);
};

const onScrollDrag = (e) => {
  if (!isDraggingScroll || !scrollTrack.value) return;
  
  const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
  const deltaX = clientX - dragStartX;
  const trackWidth = scrollTrack.value.offsetWidth;
  
  if (trackWidth === 0) return;
  
  // Calculate delta as percentage of track
  const deltaPercent = (deltaX / trackWidth) * 100;
  
  // New thumb position
  let newLeft = dragStartLeft + deltaPercent;
  const maxThumb = 100 - thumbWidth.value;
  newLeft = Math.max(0, Math.min(maxThumb, newLeft));
  
  thumbLeft.value = newLeft;
  
  // Sync scroll
  const el = scrollWrapper.value;
  if (el) {
    const sw = el.scrollWidth;
    const cw = el.clientWidth;
    const maxScroll = sw - cw;
    el.scrollLeft = (newLeft / maxThumb) * maxScroll;
  }
};

const stopScrollDrag = () => {
  isDraggingScroll = false;
  document.removeEventListener('mousemove', onScrollDrag);
  document.removeEventListener('mouseup', stopScrollDrag);
  document.removeEventListener('touchmove', onScrollDrag);
  document.removeEventListener('touchend', stopScrollDrag);
};

const getRowHintsWidth = () => {
  const el = rowHintsRef.value?.$el;
  if (!el) return 0;
  return el.offsetWidth || 0;
};

const computeCellSize = () => {
  const rootStyles = getComputedStyle(document.documentElement);
  const hintWidth = getRowHintsWidth();
  const gapRaw = rootStyles.getPropertyValue('--gap-size') || '2px';
  const gridPadRaw = rootStyles.getPropertyValue('--grid-padding') || '5px';
  const gap = parseFloat(gapRaw);
  const gridPad = parseFloat(gridPadRaw);

  let containerWidth;
  if (scrollWrapper.value) {
    containerWidth = scrollWrapper.value.clientWidth;
  } else {
    // Fallback if wrapper not ready: window width minus estimated padding
    // Body padding (40) + Layout padding (40) = 80
    containerWidth = window.innerWidth - 80;
  }
  
  // Ensure we don't have negative space
  const availableForGrid = Math.max(0, containerWidth - hintWidth);
  
  const size = Math.floor((availableForGrid - gridPad * 2 - (store.size - 1) * gap) / store.size);
  // Keep min 18, max 36
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

const handleCellEnter = (r, c) => {
  onMouseEnter(r, c);
  if (!isFinePointer.value) return;
  activeRow.value = r;
  activeCol.value = c;
};

const handleGridLeave = () => {
  stopDrag();
  activeRow.value = null;
  activeCol.value = null;
};

onMounted(() => {
  nextTick(() => {
    computeCellSize();
  });
  isFinePointer.value = window.matchMedia('(pointer: fine)').matches;
  window.addEventListener('resize', computeCellSize);
  window.addEventListener('resize', checkScroll);
  window.addEventListener('mouseup', handleGlobalMouseUp);
  window.addEventListener('pointerup', handleGlobalPointerUp);
  window.addEventListener('touchend', handleGlobalPointerUp, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('resize', computeCellSize);
  window.removeEventListener('resize', checkScroll);
  window.removeEventListener('mouseup', handleGlobalMouseUp);
  window.removeEventListener('pointerup', handleGlobalPointerUp);
  window.removeEventListener('touchend', handleGlobalPointerUp);
});

watch(() => store.size, async () => {
  await nextTick();
  computeCellSize();
  checkScroll();
});
</script>

<template>
  <div class="game-board-wrapper" ref="scrollWrapper" @scroll="handleScroll">
    <div class="game-container" :style="{ '--cell-size': `${cellSize}px` }">
      <div class="corner-spacer"></div>
      
      <!-- Column Hints -->
      <Hints :hints="colHints" orientation="col" :size="store.size" :activeIndex="activeCol" />
      
      <!-- Row Hints -->
      <Hints ref="rowHintsRef" :hints="rowHints" orientation="row" :size="store.size" :activeIndex="activeRow" />
      
      <!-- Grid -->
      <div 
        class="grid" 
        :style="{ 
          gridTemplateColumns: `repeat(${store.size}, var(--cell-size))`,
          gridTemplateRows: `repeat(${store.size}, var(--cell-size))`
        }"
        @pointermove.prevent="handlePointerMove"
        @mouseleave="handleGridLeave"
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
            @enter-cell="handleCellEnter"
          />
        </template>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="showScrollbar" class="fixed-scroll-bar">
      <div class="fixed-scroll-track" ref="scrollTrack" @pointerdown="startScrollDrag">
        <div 
          class="fixed-scroll-thumb" 
          :style="{ width: `${thumbWidth}%`, left: `${thumbLeft}%` }"
        ></div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.game-board-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-x: auto;
  width: 100%;
  scrollbar-width: none; /* Hide default scrollbar */
}

/* Desktop: Remove scroll behavior to ensure full grid visibility */
@media (min-width: 769px) {
  .game-board-wrapper {
    overflow-x: auto; /* Allow scrolling if grid is too large (e.g. 80x80) */
    align-items: center; /* Center the grid on desktop */
  }
}

.game-board-wrapper::-webkit-scrollbar {
  display: none;
}

.game-container {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  gap: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
  margin-top: 10px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
}

.corner-spacer {
  height: auto; /* Adapts to Col Hints height */
}

/* Row Hints */
.game-container > :nth-child(3) {
  /* No special styles */
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
