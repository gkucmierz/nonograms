import { calculateHints } from '../utils/puzzleUtils.js';
import { solveLine, solvePuzzle } from '../utils/solver.js';

// --- Logic Helpers ---
const solveLineLogic = (lineState, hints) => {
  // Map Store format (0=Unk, 1=Fill, 2=Cross) to Solver format (-1=Unk, 1=Fill, 0=Empty)
  const solverLine = lineState.map(cell => {
    if (cell === 0) return -1; // Unknown
    if (cell === 1) return 1;  // Filled
    if (cell === 2) return 0;  // Empty/Cross
    return -1;
  });

  // Call robust solver
  const resultLine = solveLine(solverLine, hints);

  // Check for new info
  if (!resultLine) return { index: -1 }; // Contradiction or error

  for (let i = 0; i < lineState.length; i++) {
    // We only care about cells that are currently 0 (Unknown) in Store
    if (lineState[i] === 0) {
      if (resultLine[i] === 1) {
        return { index: i, state: 1 }; // Suggest Fill
      }
      if (resultLine[i] === 0) {
        return { index: i, state: 2 }; // Suggest Cross
      }
    }
  }

  return { index: -1 };
};

const isSolved = (grid, solution) => {
  const size = grid.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const playerCell = grid[r][c];
      const solutionCell = solution[r][c];
      const isFilled = playerCell === 1;
      const shouldBeFilled = solutionCell === 1;
      
      // Check correctness
      if (isFilled !== shouldBeFilled) return false;
      
      // Check completeness (must be fully resolved to 1 or 2)
      if (playerCell === 0) return false;
    }
  }
  return true;
};

const handleStep = (playerGrid, solution) => {
  if (isSolved(playerGrid, solution)) {
    return { type: 'done', status: { key: 'worker.solved' } };
  }

  const size = solution.length;
  const { rowHints, colHints } = calculateHints(solution);

  for (let r = 0; r < size; r++) {
    const rowLine = playerGrid[r];
    const hints = rowHints[r];
    const result = solveLineLogic(rowLine, hints);
    if (result.index !== -1) {
      const stateKey = result.state === 1 ? 'worker.state.filled' : 'worker.state.empty';
      return {
        type: 'move',
        r,
        c: result.index,
        state: result.state,
        status: { 
            key: 'worker.logicRow', 
            params: { row: r + 1, col: result.index + 1, stateKey } 
        }
      };
    }
  }

  for (let c = 0; c < size; c++) {
    const colLine = [];
    for (let r = 0; r < size; r++) colLine.push(playerGrid[r][c]);
    const hints = colHints[c];
    const result = solveLineLogic(colLine, hints);
    if (result.index !== -1) {
      const stateKey = result.state === 1 ? 'worker.state.filled' : 'worker.state.empty';
      return {
        type: 'move',
        r: result.index,
        c,
        state: result.state,
        status: { 
            key: 'worker.logicCol', 
            params: { row: result.index + 1, col: c + 1, stateKey } 
        }
      };
    }
  }

  return { type: 'stuck', status: { key: 'worker.stuck' } };
};

const handleBoost = (playerGrid, solution) => {
  const size = solution.length;
  
  // 1. Try to use the Solver (DFS) to find a logical move
  try {
    const { rowHints, colHints } = calculateHints(solution);
    
    // Map Store format (0=Unk, 1=Fill, 2=Cross) to Solver format (-1=Unk, 1=Fill, 0=Empty)
    const solverGrid = playerGrid.map(row => row.map(cell => {
      if (cell === 0) return -1;
      if (cell === 1) return 1;
      if (cell === 2) return 0;
      return -1;
    }));
    
    // Run full solver (logicOnly=false allows DFS/guessing)
    const result = solvePuzzle(rowHints, colHints, null, solverGrid, false);
    
    if (result && result.solution) {
      const solvedGrid = result.solution;
      
      // Find the first cell that is Unknown in playerGrid but Known in solvedGrid
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (playerGrid[r][c] === 0) { // Unknown in Player
            const solvedVal = solvedGrid[r][c]; // -1=Unk, 0=Empty, 1=Filled
            
            if (solvedVal !== -1) {
              // Found a logical deduction!
              const newState = solvedVal === 1 ? 1 : 2; // 1->Filled, 0->Cross
              const stateKey = newState === 1 ? 'worker.state.filled' : 'worker.state.empty';
              return {
                type: 'move',
                r,
                c,
                state: newState,
                status: { 
                    key: 'worker.boosted', 
                    params: { row: r + 1, col: c + 1, stateKey } 
                }
              };
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('Boost Solver failed, falling back to simple reveal:', e);
  }

  // 2. Fallback: Cheat
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (playerGrid[r][c] === 0) {
        const correctState = solution[r][c] === 1 ? 1 : 2;
        const stateKey = correctState === 1 ? 'worker.state.filled' : 'worker.state.empty';
        return {
          type: 'move',
          r,
          c,
          state: correctState,
          status: { 
              key: 'worker.boosted', 
              params: { row: r + 1, col: c + 1, stateKey } 
          }
        };
      }
    }
  }
  return { type: 'done', status: { key: 'worker.solved' } };
};

// --- Main Worker Handler ---
self.onmessage = (e) => {
    const { id, grid, initialGrid, playerGrid, solution, action } = e.data;
    
    try {
        // Mode 1: Analysis (Batch) - from ImageImportModal / workerPool
        if (grid) {
            if (grid.length === 0) {
                self.postMessage({ id, error: 'Empty grid' });
                return;
            }

            const rows = grid.length;
            const cols = grid[0].length;
            const { rowHints, colHints } = calculateHints(grid);

            const onProgress = (percent) => {
                self.postMessage({
                    id,
                    type: 'progress',
                    percent
                });
            };

            const { percentSolved, difficultyScore } = solvePuzzle(rowHints, colHints, onProgress, initialGrid);

            let value = difficultyScore;
            let level;

            if (percentSolved < 100) {
                level = 'extreme'; 
            } else {
                if (value < 25) level = 'easy';
                else if (value < 50) level = 'medium';
                else if (value < 75) level = 'hard';
                else level = 'extreme';
            }

            self.postMessage({
                id,
                solvability: Math.floor(percentSolved),
                difficulty: Math.round(value),
                difficultyLabel: level,
                rows,
                cols
            });
            return;
        }

        // Mode 2: Assistant (Step/Boost) - from useSolver
        if (playerGrid) {
            let result;
            if (action === 'boost') {
                result = handleBoost(playerGrid, solution);
            } else {
                result = handleStep(playerGrid, solution);
            }
            
            self.postMessage({ id, ...result });
            return;
        }

    } catch (err) {
        self.postMessage({ id, error: err.message });
    }
};
