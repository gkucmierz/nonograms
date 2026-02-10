export function calculateHints(grid) {
    if (!grid || grid.length === 0) return { rowHints: [], colHints: [] };
    
    const size = grid.length;
    const rowHints = [];
    const colHints = [];

    // Row Hints
    for (let r = 0; r < size; r++) {
        const hints = [];
        let count = 0;
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === 1) {
                count++;
            } else if (count > 0) {
                hints.push(count);
                count = 0;
            }
        }
        if (count > 0) hints.push(count);
        rowHints.push(hints.length > 0 ? hints : [0]);
    }

    // Col Hints
    for (let c = 0; c < size; c++) {
        const hints = [];
        let count = 0;
        for (let r = 0; r < size; r++) {
            if (grid[r][c] === 1) {
                count++;
            } else if (count > 0) {
                hints.push(count);
                count = 0;
            }
        }
        if (count > 0) hints.push(count);
        colHints.push(hints.length > 0 ? hints : [0]);
    }

    return { rowHints, colHints };
}

export function generateRandomGrid(size, density = 0.5) {
    const grid = [];
    for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
            row.push(Math.random() < density ? 1 : 0);
        }
        grid.push(row);
    }
    return grid;
}

export function calculateDifficulty(density) {
    // Shannon Entropy: H(x) = -x*log2(x) - (1-x)*log2(1-x)
    // Normalized to 0-1 range (since max entropy at 0.5 is 1)
    
    // Avoid log(0)
    if (density <= 0 || density >= 1) return 'easy';
    
    const entropy = -density * Math.log2(density) - (1 - density) * Math.log2(1 - density);
    
    // Thresholds based on entropy
    // 0.5 density -> entropy 1.0 (Extreme)
    // 0.4/0.6 density -> entropy ~0.97 (Extreme)
    // 0.3/0.7 density -> entropy ~0.88 (Hardest)
    // 0.2/0.8 density -> entropy ~0.72 (Harder)
    // <0.2/>0.8 density -> entropy <0.72 (Easy)

    if (entropy >= 0.96) return 'extreme'; // approx 38% - 62%
    if (entropy >= 0.85) return 'hardest'; // approx 28% - 38% & 62% - 72%
    if (entropy >= 0.65) return 'harder';  // approx 17% - 28% & 72% - 83%
    return 'easy';
}
