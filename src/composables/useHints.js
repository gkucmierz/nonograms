import { computed } from 'vue';
import { calculateHints } from '@/utils/puzzleUtils';

export function useHints(solutionGrid) {
  const hints = computed(() => calculateHints(solutionGrid.value));
  
  const rowHints = computed(() => hints.value.rowHints);
  const colHints = computed(() => hints.value.colHints);

  return {
    rowHints,
    colHints
  };
}
