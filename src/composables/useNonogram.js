import { ref } from 'vue';
import { usePuzzleStore } from '@/stores/puzzle';

export function useNonogram() {
  const store = usePuzzleStore();
  
  const isDragging = ref(false);
  const dragMode = ref(null); // 'fill', 'empty', 'cross'
  const startCellState = ref(null);

  const startDrag = (r, c, isRightClick = false, force = false) => {
    if (store.isGameWon) return;
    
    isDragging.value = true;
    const current = store.playerGrid[r][c];
    
    if (isRightClick) {
        // Right click logic
        if (!force && current === 1) {
            dragMode.value = null; // invalid drag start
            return;
        }
        dragMode.value = (current === 2) ? 0 : 2;
    } else {
        // Left click logic
        // Toggle 0 <-> 1. Ignore 2 usually or overwrite?
        // Standard: If 2, usually safe to overwrite or ignore. Let's say we toggle 0->1, 1->0.
        // If starting on 2, maybe clear it?
        if (current === 2) {
             dragMode.value = 0; // Clear cross
        } else {
             dragMode.value = (current === 1) ? 0 : 1;
        }
    }
    
    // Apply to start cell
    applyDrag(r, c);
  };

  const onMouseEnter = (r, c) => {
    if (isDragging.value) {
        applyDrag(r, c);
    }
  };

  const stopDrag = () => {
    store.endInteraction();
    isDragging.value = false;
    dragMode.value = null;
  };

  const applyDrag = (r, c) => {
      if (dragMode.value === null) return;
      
      const current = store.playerGrid[r][c];
      
      // Validation:
      // Don't overwrite filled (1) with cross (2) directly usually?
      // Or don't overwrite cross (2) with filled (1)?
      // Simple logic:
      // If dragMode is 1 (filling): only fill 0 or 2.
      // If dragMode is 0 (clearing): clear 1 or 2.
      // If dragMode is 2 (crossing): only cross 0.
      
      let shouldApply = false;
      if (dragMode.value === 1) {
          if (current !== 1) shouldApply = true;
      } else if (dragMode.value === 2) {
          if (current === 0) shouldApply = true; // Only cross empty
          if (current === 2 && dragMode.value === 0) shouldApply = true; // Clear cross
      } else if (dragMode.value === 0) {
          // Clearing
          if (current !== 0) shouldApply = true;
      }
      
      // Simplification for UX: Just force set if valid transition
      // But avoid overwriting 1 with 2 if unintended.
      
      // Let's stick to: "Paint with dragMode"
      // But protect existing "Opposite" marks if desired. 
      // For now, simple paint is fine.
      
      store.setCell(r, c, dragMode.value);
  };

  return {
    startDrag,
    onMouseEnter,
    stopDrag
  };
}
