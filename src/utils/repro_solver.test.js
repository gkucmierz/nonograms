
import { describe, it, expect } from 'vitest';
import { solvePuzzle } from './solver';
import { calculateHints } from './puzzleUtils';

describe('Solver Repro', () => {
    it('should solve a simple generated puzzle', () => {
        const grid = [
            [1, 0, 1, 1, 0],
            [1, 1, 0, 0, 1],
            [0, 0, 1, 0, 0],
            [1, 1, 1, 1, 1],
            [0, 1, 0, 1, 0]
        ];
        const { rowHints, colHints } = calculateHints(grid);
        
        const result = solvePuzzle(rowHints, colHints);
        expect(result.percentSolved).toBe(100);
    });

    it('should not fail on random valid lines', () => {
        // Test solveLine indirectly via solvePuzzle on small grids
        for (let i = 0; i < 100; i++) {
            const size = 10;
            const grid = [];
            for(let r=0; r<size; r++) {
                const row = [];
                for(let c=0; c<size; c++) row.push(Math.random() > 0.5 ? 1 : 0);
                grid.push(row);
            }
            
            const { rowHints, colHints } = calculateHints(grid);
            const result = solvePuzzle(rowHints, colHints);
            
            // It might not be 100% solvable without guessing (logic only), 
            // but since our solver HAS backtracking, it MUST be 100% solvable 
            // (unless timeout/max depth reached, but for 10x10 it should solve).
            
            // If it returns 0% or low %, it implies it failed to find the solution 
            // or found a contradiction (which shouldn't happen for valid hints).
            
            if (result.percentSolved < 100) {
                console.log('Failed Grid:', JSON.stringify(grid));
                console.log('Result:', result);
            }
            expect(result.percentSolved).toBe(100);
        }
    });
});
