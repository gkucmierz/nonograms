
import { describe, it, expect } from 'vitest';
import { solvePuzzle } from './solver.js';

describe('Large Grid Solver', () => {
    it('should solve a large 55x28 grid without crashing', () => {
        const rows = 28;
        const cols = 55;
        // Create a simple pattern: checkerboard or lines
        const grid = Array(rows).fill().map((_, r) => 
            Array(cols).fill().map((_, c) => (r + c) % 2 === 0 ? 1 : 0)
        );
        
        // Calculate hints
        const rowHints = grid.map(row => {
            const hints = [];
            let current = 0;
            row.forEach(cell => {
                if (cell === 1) current++;
                else if (current > 0) { hints.push(current); current = 0; }
            });
            if (current > 0) hints.push(current);
            return hints.length ? hints : [0];
        });
        
        const colHints = Array(cols).fill().map((_, c) => {
            const hints = [];
            let current = 0;
            for(let r=0; r<rows; r++) {
                if (grid[r][c] === 1) current++;
                else if (current > 0) { hints.push(current); current = 0; }
            }
            if (current > 0) hints.push(current);
            return hints.length ? hints : [0];
        });
        
        console.log('Starting solve...');
        const result = solvePuzzle(rowHints, colHints, (p) => console.log(`Progress: ${p}%`));
        console.log('Result:', result);
        
        expect(result.percentSolved).toBeGreaterThan(0);
        expect(result.difficulty).toBeDefined();
    });
});
