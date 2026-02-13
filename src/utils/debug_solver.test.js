
import { describe, it, expect } from 'vitest';
import { solvePuzzle } from './solver';
import { calculateHints } from './puzzleUtils';

describe('Debug Solver', () => {
    it('should solve the broken grid', () => {
        const grid = [
            [0,1,1,1,0,0,1,0,1,1],
            [1,1,1,0,0,1,1,1,0,0],
            [1,0,1,0,1,0,0,1,0,0],
            [1,0,0,0,1,1,1,1,0,1],
            [1,1,0,1,0,0,0,1,0,1],
            [1,0,1,0,1,0,0,0,1,0],
            [1,1,1,0,0,1,1,0,0,0],
            [0,1,0,0,1,0,1,0,0,0],
            [0,0,0,1,1,0,0,0,1,0],
            [1,0,1,1,0,0,1,0,1,1]
        ];

        const { rowHints, colHints } = calculateHints(grid);
        const result = solvePuzzle(rowHints, colHints);
        
        console.log('Solve Result:', result);
        expect(result.percentSolved).toBe(100);
    });
});
