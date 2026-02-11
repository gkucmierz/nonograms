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

export function calculateDifficulty(density, size = 10) {
    // Shannon Entropy: H(x) = -x*log2(x) - (1-x)*log2(1-x)
    // Normalized to 0-1 range (since max entropy at 0.5 is 1)
    
    // Avoid log(0)
    if (density <= 0 || density >= 1) return { level: 'easy', value: 0 };
    
    const entropy = -density * Math.log2(density) - (1 - density) * Math.log2(1 - density);
    
    // Difficulty score combines entropy (complexity) and size (scale)
    // We use sqrt(size) to dampen the effect of very large grids, 
    // ensuring that density still plays a major role.
    // Normalized against max size (80)
    const sizeFactor = Math.sqrt(size / 80);
    const score = entropy * sizeFactor * 100;
    const value = Math.round(score);
    
    // Thresholds
    let level = 'easy';
    if (value >= 80) level = 'extreme';
    else if (value >= 60) level = 'hardest';
    else if (value >= 40) level = 'harder';
    else if (value >= 20) level = 'medium'; // Using 'medium' key if available, or we need to add it?
    // Wait, useI18n only has: easy, harder, hardest, extreme.
    // Let's stick to those keys but adjust ranges.
    
    if (value >= 75) level = 'extreme';
    else if (value >= 50) level = 'hardest';
    else if (value >= 25) level = 'harder';
    else level = 'easy';

    return { level, value };
}
