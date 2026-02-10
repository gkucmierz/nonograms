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

export function generateRandomGrid(size) {
    const grid = [];
    for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
            // ~25% empty cells
            row.push(Math.random() > 0.25 ? 1 : 0);
        }
        grid.push(row);
    }
    return grid;
}
