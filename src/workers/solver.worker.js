import { calculateHints } from '../utils/puzzleUtils';
import { solvePuzzle } from '../utils/solver';

self.onmessage = (e) => {
    const { id, grid } = e.data;
    
    try {
        if (!grid || grid.length === 0) {
            self.postMessage({ id, error: 'Empty grid' });
            return;
        }

        const rows = grid.length;
        const cols = grid[0].length;
        const size = Math.max(rows, cols);
        const density = grid.flat().filter(c => c === 1).length / (rows * cols);

        // 1. Calculate Hints
        const { rowHints, colHints } = calculateHints(grid);

        // 2. Run Solver (Logic + Lookahead)
        const onProgress = (percent) => {
            self.postMessage({
                id,
                type: 'progress',
                percent
            });
        };

        const { percentSolved, difficultyScore, lookaheadUsed } = solvePuzzle(rowHints, colHints, onProgress);

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
