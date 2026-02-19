
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePuzzleStore } from './puzzle';

describe('Puzzle Store - Completion Logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should correctly identify completed rows and columns', () => {
    const store = usePuzzleStore();
    
    // Setup a simple 2x2 puzzle
    // Solution:
    // 1 0
    // 0 1
    // Row Hints: [1], [1]
    // Col Hints: [1], [1]
    store.solution = [
      [1, 0],
      [0, 1]
    ];
    store.playerGrid = [
      [0, 0],
      [0, 0]
    ];
    
    // Initially nothing is completed
    expect(store.completedRows).toEqual([false, false]);
    expect(store.completedCols).toEqual([false, false]);
    
    // Fill first row correctly: 1 0
    store.playerGrid[0][0] = 1;
    store.playerGrid[0][1] = 0;
    
    expect(store.completedRows).toEqual([true, false]);
    
    // Fill second row incorrectly (too many filled): 1 1
    store.playerGrid[1][0] = 1;
    store.playerGrid[1][1] = 1;
    
    // Row 2 hint is [1], user has [2]. Should be false.
    expect(store.completedRows).toEqual([true, false]);
    
    // Fix second row: 0 1
    store.playerGrid[1][0] = 0;
    store.playerGrid[1][1] = 1;
    
    expect(store.completedRows).toEqual([true, true]);
    
    // Check columns
    // Col 1: 1, 0 -> Hint [1]. Matches.
    // Col 2: 0, 1 -> Hint [1]. Matches.
    expect(store.completedCols).toEqual([true, true]);
  });

  it('should mark row as completed if constraints are met even if wrong position', () => {
    const store = usePuzzleStore();
    // Solution: 1 0 0 (Hint 1)
    store.solution = [[1, 0, 0]];
    store.playerGrid = [[0, 0, 0]];
    
    // User puts 0 0 1 (Hint 1)
    store.playerGrid[0] = [0, 0, 1];
    
    // Should be marked as completed because it satisfies the hint "1"
    expect(store.completedRows).toEqual([true]);
  });
});
