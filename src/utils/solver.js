
/**
 * Represents the state of a cell in the solver.
 * -1: Unknown
 *  0: Empty
 *  1: Filled
 */

// Memoized helper for checking if hints fit
const memo = new Map();

/**
 * Solves a single line (row or column) based on hints and current knowledge.
 * Uses the "Left-Right Overlap" algorithm to find common filled cells.
 * Also identifies definitely empty cells (reachable by no block).
 * 
 * @param {number[]} currentLine - Array of -1, 0, 1
 * @param {number[]} hints - Array of block lengths
 * @returns {number[]} - Updated line (or null if contradiction/impossible - though shouldn't happen for valid puzzles)
 */
export function solveLine(currentLine, hints) {
    const length = currentLine.length;
    
    // If no hints, all must be empty
    // Clear memo for this line solve
    memo.clear();

    if (hints.length === 0 || (hints.length === 1 && hints[0] === 0)) {
        return Array(length).fill(0);
    }

    // Helper to check if a block can be placed at start index
    const canPlace = (line, start, blockSize) => {
        if (start + blockSize > line.length) return false;
        // Check if any cell in block is 0 (Empty) -> Invalid
        for (let i = start; i < start + blockSize; i++) {
            if (line[i] === 0) return false;
        }
        // Check boundaries (must be separated by empty or edge)
        if (start > 0 && line[start - 1] === 1) return false;
        if (start + blockSize < line.length && line[start + blockSize] === 1) return false;
        return true;
    };

    // 1. Calculate Left-Most Positions
    const leftPositions = [];
    let currentIdx = 0;
    for (let hIndex = 0; hIndex < hints.length; hIndex++) {
        const block = hints[hIndex];
        // Find first valid position
        while (currentIdx <= length - block) {
            if (canPlace(currentLine, currentIdx, block)) {
                // Verify we can fit remaining blocks
                if (canFitRest(currentLine, currentIdx + block + 1, hints, hIndex + 1)) {
                    leftPositions.push(currentIdx);
                    currentIdx += block + 1; // Move past this block + 1 space
                    break;
                }
            }
            // Cannot skip a filled cell - if we pass a '1', it becomes uncovered
            if (currentLine[currentIdx] === 1) return null;
            currentIdx++;
        }
        if (leftPositions.length <= hIndex) return null; // Impossible
    }

    // Clear memo for right-side calculation (different line/hints)
    memo.clear();

    // 2. Calculate Right-Most Positions (by reversing line and hints)
    const reversedLine = [...currentLine].reverse();
    const reversedHints = [...hints].reverse();
    const rightPositionsReversed = [];
    
    currentIdx = 0;
    for (let hIndex = 0; hIndex < reversedHints.length; hIndex++) {
        const block = reversedHints[hIndex];
        while (currentIdx <= length - block) {
            if (canPlace(reversedLine, currentIdx, block)) {
                if (canFitRest(reversedLine, currentIdx + block + 1, reversedHints, hIndex + 1)) {
                    rightPositionsReversed.push(currentIdx);
                    currentIdx += block + 1;
                    break;
                }
            }
            // Cannot skip a filled cell
            if (reversedLine[currentIdx] === 1) return null;
            currentIdx++;
        }
        if (rightPositionsReversed.length <= hIndex) return null;
    }
    
    // Convert reversed positions to actual indices
    const rightPositions = rightPositionsReversed.map((rStart, i) => {
        const block = reversedHints[i];
        return length - rStart - block;
    }).reverse();


    // 3. Intersect
    const newLine = [...currentLine];
    
    // Fill intersection
    for (let i = 0; i < hints.length; i++) {
        const l = leftPositions[i];
        const r = rightPositions[i];
        const block = hints[i];
        
        // If overlap exists: [r, l + block - 1]
        if (r < l + block) {
            for (let k = r; k < l + block; k++) {
                newLine[k] = 1;
            }
        }
    }

    // Determine Empty cells?
    // Mask of possible filled cells
    const possibleFilled = Array(length).fill(false);
    for (let i = 0; i < hints.length; i++) {
        for (let k = leftPositions[i]; k < rightPositions[i] + hints[i]; k++) {
            possibleFilled[k] = true;
        }
    }
    
    for (let k = 0; k < length; k++) {
        if (!possibleFilled[k]) {
            newLine[k] = 0;
        }
    }

    return newLine;
}

// Memoized helper for checking if hints fit
export function canFitRest(line, startIndex, hints, hintIndex) {
    // Optimization: If hints are empty, we just need to check if remaining line has no '1's
    if (hintIndex >= hints.length) {
        for (let i = startIndex; i < line.length; i++) {
            if (line[i] === 1) return false;
        }
        return true;
    }

    // Memoization key
    const key = `${startIndex}-${hintIndex}`;
    if (memo.has(key)) return memo.get(key);

    const remainingLen = line.length - startIndex;
    // Min space needed: sum of hints + (hints.length - 1) spaces
    let minSpace = 0;
    for(let i=hintIndex; i<hints.length; i++) minSpace += hints[i] + (i < hints.length - 1 ? 1 : 0);
    
    if (remainingLen < minSpace) {
        memo.set(key, false);
        return false;
    }

    const block = hints[hintIndex];
    // Try to find *any* valid placement for this block
    for (let i = startIndex; i <= line.length - minSpace; i++) {
         // If we skipped a '1', we went too far. All 1s must be covered by blocks.
         // Since we are placing the *next* block, any 1s between startIndex and i are uncovered.
         // Thus, if we find a 1 in [startIndex, i-1], we must stop.
         let skippedOne = false;
         for (let x = startIndex; x < i; x++) {
             if (line[x] === 1) { skippedOne = true; break; }
         }
         if (skippedOne) break;

         // Check placement
         let valid = true;
         // Block
         for (let k = 0; k < block; k++) {
             if (line[i+k] === 0) { valid = false; break; }
         }
         if (!valid) continue;
         
         // Boundary before
         if (i > 0 && line[i-1] === 1) valid = false; 
         
         // Boundary after (check implicit in next block placement or end of line, but we need to check i+block cell)
         if (i + block < line.length && line[i+block] === 1) valid = false;
         
         if (valid) {
             // Recurse
             if (canFitRest(line, i + block + 1, hints, hintIndex + 1)) {
                 memo.set(key, true);
                 return true;
             }
         }
    }
    
    memo.set(key, false);
    return false;
}

/**
 * Main solver function that attempts to solve the puzzle using logic and backtracking (DFS).
 * Uses an efficient propagation queue and undo stack to avoid deep copying the grid.
 * 
 * @param {number[][]} rowHints 
 * @param {number[][]} colHints 
 * @param {function} onProgress - Optional callback for progress reporting (percent)
 * @param {number[][]} initialGrid - Optional initial grid state
 * @param {boolean} logicOnly - If true, stops after logical propagation (no guessing)
 * @returns {object} result
 */
export function solvePuzzle(rowHints, colHints, onProgress, initialGrid = null, logicOnly = false) {
    const rows = rowHints.length;
    const cols = colHints.length;
    const totalCells = rows * cols;
    
    // Grid initialization: -1 (Unknown), 0 (Empty), 1 (Filled)
    // Use initialGrid if provided (deep copy to be safe)
    const grid = initialGrid 
        ? initialGrid.map(row => [...row]) 
        : Array(rows).fill().map(() => Array(cols).fill(-1));
    
    // Stats
    let iterations = 0; // Total calls to solve()
    let maxDepth = 0;   // Max recursion depth
    let backtracks = 0; // Failed guesses
    let logicSteps = 0; // Cells filled by propagation
    let lastProgressTime = 0;

    function reportProgress() {
        if (!onProgress) return;
        const now = Date.now();
        if (now - lastProgressTime >= 50) {
            let filled = 0;
            for(let r=0; r<rows; r++) {
                for(let c=0; c<cols; c++) {
                    if(grid[r][c] !== -1) filled++;
                }
            }
            onProgress(Math.floor((filled/totalCells) * 100));
            lastProgressTime = now;
        }
    }
    
    // Queue for propagation (Set of strings "r{i}" or "c{i}")
    const queue = new Set();
    for(let r=0; r<rows; r++) queue.add(`r${r}`);
    for(let c=0; c<cols; c++) queue.add(`c${c}`);

    // Helper: Undo changes from a propagation step
    function undo(changes) {
        for(let i=changes.length-1; i>=0; i--) {
            const {r, c, old} = changes[i];
            grid[r][c] = old;
        }
    }

    // Helper: Propagate logic constraints until fixed point or contradiction
    // Returns list of changes made, or null if contradiction found
    function propagate() {
        const changes = [];
        
        try {
            while(queue.size > 0) {
                reportProgress();
                
                const item = queue.values().next().value;
                queue.delete(item);
                
                const type = item[0];
                const idx = parseInt(item.slice(1));
                
                let currentLine, hints;
                if (type === 'r') {
                    currentLine = grid[idx]; // Reference for row (fast)
                    hints = rowHints[idx];
                } else {
                    currentLine = grid.map(row => row[idx]); // Copy for col (slower)
                    hints = colHints[idx];
                }
                
                const newLine = solveLine(currentLine, hints);
                
                if (!newLine) throw 'contradiction';
                
                // Apply changes
                for(let i=0; i<newLine.length; i++) {
                    if (currentLine[i] !== newLine[i]) {
                        // If we try to change a known value to something else -> Contradiction
                        if (currentLine[i] !== -1 && currentLine[i] !== newLine[i]) throw 'contradiction';
                        
                        if (currentLine[i] === -1) {
                            const r = type === 'r' ? idx : i;
                            const c = type === 'r' ? i : idx;
                            
                            // Double check if already set by orthogonal update in same loop?
                            // (Should be handled by -1 check above, as grid is shared)
                            if (grid[r][c] === -1) {
                                grid[r][c] = newLine[i];
                                changes.push({r, c, old: -1});
                                logicSteps++;
                                
                                // Add orthogonal line to queue
                                if (type === 'r') queue.add(`c${c}`);
                                else queue.add(`r${r}`);
                            } else if (grid[r][c] !== newLine[i]) {
                                console.log('Contradiction: Orthogonal Conflict at', r, c, 'Grid:', grid[r][c], 'New:', newLine[i]);
                                throw 'contradiction';
                            }
                        }
                    }
                }
            }
        } catch (e) {
            // Revert changes from this failed propagation
            undo(changes);
            return null;
        }
        return changes;
    }

    // DFS Solver
    function solve(depth) {
        maxDepth = Math.max(maxDepth, depth);
        iterations++;
        
        reportProgress();
        
        // 1. Propagate Logic
        const changes = propagate();
        if (!changes) return false; // Contradiction
        
        // 2. Find Best Branch Candidate
        let bestR = -1, bestC = -1;
        let minUnknowns = Infinity;
        let isComplete = true;
        
        // Scan for unknowns and pick heuristic
        // Heuristic: Line with fewest unknowns (most constrained)
        for(let r=0; r<rows; r++) {
            let unknowns = 0;
            let firstUnknownC = -1;
            for(let c=0; c<cols; c++) {
                if(grid[r][c] === -1) {
                    unknowns++;
                    if (firstUnknownC === -1) firstUnknownC = c;
                }
            }
            
            if (unknowns > 0) {
                isComplete = false;
                if (unknowns < minUnknowns) {
                    minUnknowns = unknowns;
                    bestR = r;
                    bestC = firstUnknownC;
                }
                if (minUnknowns === 1) break; // Optimal
            }
        }
        
        if (isComplete) return true; // Solved!
        
        // 3. Branching (Guessing)
        // Try 1
        grid[bestR][bestC] = 1;
        queue.add(`r${bestR}`);
        queue.add(`c${bestC}`);
        
        if (solve(depth + 1)) return true;
        
        // Backtrack from 1
        grid[bestR][bestC] = -1; // Undo guess
        // (Recursive call already undid its propagation changes)
        
        // Try 0
        grid[bestR][bestC] = 0;
        queue.add(`r${bestR}`);
        queue.add(`c${bestC}`);
        
        if (solve(depth + 1)) return true;
        
        // Backtrack from 0
        grid[bestR][bestC] = -1; // Undo guess
        backtracks++;
        
        // Undo propagation from this level
        undo(changes);
        return false;
    }
    
    // Start Solving
    if (logicOnly) {
        // Just logical propagation without guessing
        if (initialGrid) {
            // If resuming, ensure queue has all lines to check consistency
            queue.clear();
            for(let r=0; r<rows; r++) queue.add(`r${r}`);
            for(let c=0; c<cols; c++) queue.add(`c${c}`);
        }
        
        // Propagate logic constraints
        propagate();
        // No DFS, so iterations/backtracks remain 0
    } else if (!initialGrid) {
        // Normal start (full solver)
        solve(0);
    } else {
        // Resume from provided state (full solver)
        // We need to populate the queue with all rows/cols since we don't know what changed
        queue.clear();
        for(let r=0; r<rows; r++) queue.add(`r${r}`);
        for(let c=0; c<cols; c++) queue.add(`c${c}`);
        solve(0);
    }
    
    // Calculate Percent Solved
    let solvedCount = 0;
    grid.forEach(r => r.forEach(c => { if(c !== -1) solvedCount++; }));
    let percentSolved = (solvedCount / totalCells) * 100;
    
    if (onProgress) onProgress(Math.floor(percentSolved));

    // Difficulty Calculation
    // Logic:
    // - Base: 0-20% based on size/density
    // - Logic: 0-30% based on iterations needed (depth 0)
    // - Guessing: 0-50% based on backtracks/depth
    
    let difficultyScore = 0;
    const effectiveSize = Math.sqrt(totalCells);
    
    if (percentSolved < 100) {
        difficultyScore = 100; // Unsolvable (or timed out/too hard)
    } else {
        if (maxDepth === 0) {
            // Pure logic
            difficultyScore = Math.min(30, effectiveSize);
        } else {
            // Required guessing
            // Simple heuristic: 30 + backtracks * 5 + depth * 2
            difficultyScore = 30 + (backtracks * 2) + (maxDepth * 5);
            difficultyScore = Math.min(100, difficultyScore);
        }
    }
    
    return { 
        percentSolved, 
        difficultyScore: Math.round(difficultyScore), 
        lookaheadUsed: maxDepth > 0,
        iterations,
        maxDepth,
        backtracks,
        solution: grid
    };
}
