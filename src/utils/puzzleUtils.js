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
    
    const size = grid.length;
    const rowHints = [];
    const colHints = [];

    // Row Hints
    for (let r = 0; r < size; r++) {
        rowHints.push(calculateLineHints(grid[r]));
    }

    // Col Hints
    for (let c = 0; c < size; c++) {
        const col = [];
        for (let r = 0; r < size; r++) {
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
    // Densities: 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9
    const SIM_DATA = {
        5:  [89, 74, 74, 81, 97, 98, 99, 100, 100],
        10: [57, 20, 16, 54, 92, 100, 100, 100, 100],
        15: [37, 10, 2, 12, 68, 100, 100, 100, 100],
        20: [23, 3, 1, 2, 37, 100, 100, 100, 100],
        25: [16, 0, 0, 1, 19, 99, 100, 100, 100],
        30: [8, 0, 0, 0, 5, 99, 100, 100, 100],
        35: [6, 0, 0, 0, 4, 91, 100, 100, 100],
        40: [3, 0, 0, 0, 2, 91, 100, 100, 100],
        45: [2, 0, 0, 0, 1, 82, 100, 100, 100],
        50: [2, 0, 0, 0, 1, 73, 100, 100, 100],
        60: [0, 0, 0, 0, 0, 35, 100, 100, 100],
        71: [0, 0, 0, 0, 0, 16, 100, 100, 100],
        80: [0, 0, 0, 0, 0, 1, 100, 100, 100]
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
    
    // Difficulty Score: Inverse of Solved Percent
    // 100% Solved -> 0 Difficulty
    // 0% Solved -> 100 Difficulty
    const value = Math.round(100 - solvedPct);
    
    // Thresholds
    let level = 'easy';
    if (value >= 90) level = 'extreme';     // < 10% Solved
    else if (value >= 60) level = 'hardest'; // < 40% Solved
    else if (value >= 30) level = 'harder';  // < 70% Solved
    else level = 'easy';                     // > 70% Solved

    return { level, value };
}
