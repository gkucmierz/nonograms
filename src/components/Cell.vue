<script setup>
import { computed } from 'vue';

const props = defineProps({
  state: {
    type: Number,
    required: true,
    validator: (v) => [0, 1, 2].includes(v)
  },
  r: Number,
  c: Number
});

const emit = defineEmits(['start-drag', 'enter-cell']);

const cellClass = computed(() => {
  switch (props.state) {
    case 1: return 'filled';
    case 2: return 'cross';
    default: return 'empty';
  }
});

let lastTap = 0;

const handlePointerDown = (e) => {
  if (e.pointerType === 'mouse') {
    if (e.button === 0) emit('start-drag', props.r, props.c, false);
    if (e.button === 2) emit('start-drag', props.r, props.c, true);
    return;
  }
  const now = Date.now();
  const isDoubleTap = now - lastTap < 300;
  lastTap = now;
  if (isDoubleTap) {
    emit('start-drag', props.r, props.c, true);
  } else {
    emit('start-drag', props.r, props.c, false);
  }
};
</script>

<template>
  <div 
    class="cell" 
    :class="cellClass"
    :data-r="props.r"
    :data-c="props.c"
    @pointerdown.prevent="handlePointerDown"
    @mouseenter="emit('enter-cell', props.r, props.c)"
    @contextmenu.prevent
  >
    <span v-if="props.state === 2" class="cross-mark">×</span>
  </div>
</template>

<style scoped>
.cell {
  width: var(--cell-size);
  height: var(--cell-size);
  background-color: var(--cell-empty);
  border: 1px solid var(--glass-border);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.1s ease, box-shadow 0.1s ease;
  user-select: none;
  touch-action: none;
}

.cell:hover {
  background-color: var(--cell-hover);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}

.cell.filled {
  background: var(--cell-filled-gradient);
  box-shadow: 0 0 15px var(--accent-cyan);
  border-color: transparent;
}

.cell.cross {
  color: var(--cell-x-color);
  font-size: 1.5rem;
  line-height: 1;
}

/* Guide Lines Logic (handled via CSS classes passed from parent usually, but here simpler to use nth-child or props) */
/* Actually, user wants guide lines every 5 cells. 
   We can do this in GameBoard via classes on cells or border manipulation.
   Let's do it in GameBoard style or pass a prop 'isGuideRight', 'isGuideBottom'.
*/
</style>
