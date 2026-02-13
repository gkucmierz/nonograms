import { calculateHints } from '../utils/puzzleUtils';
import { solvePuzzle } from '../utils/solver';

self.onmessage = (e) => {
    const { id, grid, initialGrid } = e.data;
    
    try {
        if (!grid || grid.length === 0) {
            self.postMessage({ id, error: 'Empty grid' });
            return;
        }

        const rows = grid.length;
        const cols = grid[0].length;
        // Use initialGrid if provided, otherwise assume we are starting fresh
        // BUT wait, 'grid' passed here is usually the 0/1 grid from Image Import (target pattern).
        // 'initialGrid' would be the partial solution state (-1/0/1).
        
        // 1. Calculate Hints from the TARGET grid (the image)
        const { rowHints, colHints } = calculateHints(grid);

        // 2. Run Solver (Logic + Lookahead)
        const onProgress = (percent) => {
            self.postMessage({
                id,
                type: 'progress',
                percent
            });
        };

        const { percentSolved, difficultyScore, lookaheadUsed } = solvePuzzle(rowHints, colHints, onProgress, initialGrid);

        // 3. Determine Level
        let value = difficultyScore;
        let level;

        if (percentSolved < 100) {
            level = 'extreme'; // Unsolvable by logic+lookahead
        } else {
            if (value < 25) level = 'easy';
            else if (value < 50) level = 'medium';
            else if (value < 75) level = 'hard';
            else level = 'extreme';
        }
        
        // Add specific note if lookahead was needed?
        // UI doesn't have a field for that, but we can encode it in difficultyLabel if needed.
        // For now, standard levels are fine.

        self.postMessage({
            id,
            solvability: Math.floor(percentSolved),
            difficulty: Math.round(value),
            difficultyLabel: level,
            rows,
            cols
        });

    } catch (err) {
        self.postMessage({ id, error: err.message });
    }
};
