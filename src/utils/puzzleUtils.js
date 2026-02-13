export function calculateLineHints(line) {
  const hints = [];
  let currentRun = 0;
  
  for (const cell of line) {
    if (cell === 1) {
      currentRun++;
    } else {
      if (currentRun > 0) {
        hints.push(currentRun);
        currentRun = 0;
      }
    }
  }
  if (currentRun > 0) {
    hints.push(currentRun);
  }
  return hints.length > 0 ? hints : [0];
}

export function validateLine(line, targetHints) {
  const currentHints = calculateLineHints(line);
  if (currentHints.length !== targetHints.length) return false;
  return currentHints.every((h, i) => h === targetHints[i]);
}

export function calculateHints(grid) {
    if (!grid || grid.length === 0) return { rowHints: [], colHints: [] };
    
    const rows = grid.length;
    const cols = grid[0].length;
    const rowHints = [];
    const colHints = [];

    // Row Hints
    for (let r = 0; r < rows; r++) {
        rowHints.push(calculateLineHints(grid[r]));
    }

    // Col Hints
    for (let c = 0; c < cols; c++) {
        const col = [];
        for (let r = 0; r < rows; r++) {
            col.push(grid[r][c]);
        }
        colHints.push(calculateLineHints(col));
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
    // Data derived from Monte Carlo Simulation (Logical Solver)
    // Format: { size: [solved_pct_at_0.1, ..., solved_pct_at_0.9] }
    const SIM_DATA = {
        5: [88, 76, 71, 80, 90, 98, 99, 100, 100],
        10: [58, 25, 18, 44, 81, 99, 100, 100, 100],
        15: [36, 7, 3, 11, 67, 99, 100, 100, 100],
        20: [24, 3, 0, 3, 48, 99, 100, 100, 100],
        25: [13, 1, 0, 1, 21, 99, 100, 100, 100],
        30: [9, 0, 0, 0, 7, 99, 100, 100, 100],
        35: [5, 0, 0, 0, 5, 97, 100, 100, 100],
        40: [3, 0, 0, 0, 2, 91, 100, 100, 100],
        45: [2, 0, 0, 0, 1, 84, 100, 100, 100],
        50: [1, 0, 0, 0, 0, 65, 100, 100, 100],
        55: [1, 0, 0, 0, 0, 55, 100, 100, 100],
        60: [0, 0, 0, 0, 0, 35, 100, 100, 100],
        65: [0, 0, 0, 0, 0, 20, 100, 100, 100],
        70: [0, 0, 0, 0, 0, 11, 100, 100, 100],
        75: [0, 0, 0, 0, 0, 12, 100, 100, 100],
        80: [0, 0, 0, 0, 0, 4, 100, 100, 100]
    };

    // Helper to get interpolated value from array
    const getSimulatedSolvedPct = (s, d) => {
        // Find closest sizes
        const sizes = Object.keys(SIM_DATA).map(Number).sort((a, b) => a - b);
        let sLower = sizes[0];
        let sUpper = sizes[sizes.length - 1];
        
        for (let i = 0; i < sizes.length - 1; i++) {
            if (s >= sizes[i] && s <= sizes[i+1]) {
                sLower = sizes[i];
                sUpper = sizes[i+1];
                break;
            }
        }
        
        // Clamp density to 0.1 - 0.9
        const dClamped = Math.max(0.1, Math.min(0.9, d));
        // Index in array: 0.1 -> 0, 0.9 -> 8
        const dIndex = (dClamped - 0.1) * 10;
        const dLowerIdx = Math.floor(dIndex);
        const dUpperIdx = Math.ceil(dIndex);
        const dFraction = dIndex - dLowerIdx;

        // Bilinear Interpolation
        
        // 1. Interpolate Density for Lower Size
        const rowLower = SIM_DATA[sLower];
        const valLower = rowLower[dLowerIdx] * (1 - dFraction) + (rowLower[dUpperIdx] || rowLower[dLowerIdx]) * dFraction;
        
        // 2. Interpolate Density for Upper Size
        const rowUpper = SIM_DATA[sUpper];
        const valUpper = rowUpper[dLowerIdx] * (1 - dFraction) + (rowUpper[dUpperIdx] || rowUpper[dLowerIdx]) * dFraction;
        
        // 3. Interpolate Size
        if (sLower === sUpper) return valLower;
        const sFraction = (s - sLower) / (sUpper - sLower);
        
        return valLower * (1 - sFraction) + valUpper * sFraction;
    };

    const solvedPct = getSimulatedSolvedPct(size, density);
    
    let value;
    let level;

    // "Hardest" threshold is 99% solvability.
    // We calculate a base value first, then adjust for solvability.
    
    const densityFactor = 1 - 2 * Math.abs(density - 0.5);
    const complexity = size * (0.4 + 0.6 * densityFactor);
    
    if (solvedPct < 99) {
        // Requires guessing / advanced logic.
        // Base penalty for low solvability: 85 to 100
        const penaltyBase = 85 + ((99 - solvedPct) / 99) * 15;
        
        // Scale penalty by size. 
        // Small grids (e.g. 5x5) are trivial even if "unsolvable" by simple logic.
        // Large grids (e.g. 20x20) are truly extreme if unsolvable.
        const sizeFactor = Math.min(1, size / 20);
        
        value = penaltyBase * sizeFactor;
        
        // Ensure difficulty doesn't drop below structural complexity
        value = Math.max(value, complexity);
    } else {
        // Solvable (>= 99%)
        // Complexity based on Size and Density
        // Max size 80.
        // Formula: size * (0.4 + 0.6 * densityFactor)
        value = Math.min(85, complexity);
    }
        
    if (value < 25) level = 'easy';
    else if (value < 55) level = 'harder';
    else if (value < 85) level = 'hardest';
    else level = 'extreme';

    return { level, value: Math.round(value) };
}
