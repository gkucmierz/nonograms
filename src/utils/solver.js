
/**
 * Represents the state of a cell in the solver.
 * -1: Unknown
 *  0: Empty
 *  1: Filled
 */

/**
 * Solves a single line (row or column) based on hints and current knowledge.
 * Uses the "Left-Right Overlap" algorithm to find common filled cells.
 * Also identifies definitely empty cells (reachable by no block).
 * 
 * @param {number[]} currentLine - Array of -1, 0, 1
 * @param {number[]} hints - Array of block lengths
 * @returns {number[]} - Updated line (or null if contradiction/impossible - though shouldn't happen for valid puzzles)
 */
function solveLine(currentLine, hints) {
    const length = currentLine.length;
    
    // If no hints, all must be empty
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
                // Simple heuristic: do we have enough space? 
                // A full recursive check is better but slower. 
                // For "Logical Solver" we assume valid placement is possible if we respect current constraints.
                // However, strictly, we need to know if there is *any* valid arrangement starting here.
                // Let's use a recursive check with memoization for "can fit rest".
                if (canFitRest(currentLine, currentIdx + block + 1, hints, hIndex + 1)) {
                    leftPositions.push(currentIdx);
                    currentIdx += block + 1; // Move past this block + 1 space
                    break;
                }
            }
            currentIdx++;
        }
        if (leftPositions.length <= hIndex) return null; // Impossible
    }

    // 2. Calculate Right-Most Positions (by reversing line and hints)
    // This is symmetrical to Left-Most.
    // Instead of implementing reverse logic, we can just reverse inputs, run left-most, and reverse back.
    // But we need to respect the "currentLine" constraints which might be asymmetric.
    
    // Actually, "Right-Most" is just "Left-Most" on the reversed grid.
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
            currentIdx++;
        }
        if (rightPositionsReversed.length <= hIndex) return null;
    }
    
    // Convert reversed positions to actual indices
    // index in reversed = length - 1 - (original_index + block_size - 1)
    // original_start = length - 1 - (reversed_start + block_size - 1) = length - reversed_start - block_size
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
        // Example: Block 5. Left: 2, Right: 4.
        // Left:  ..XXXXX...
        // Right: ....XXXXX.
        // Overlap:   ..XXX...
        // Indices: max(l, r) to min(l+block, r+block) - 1 ?
        // Range is [r, l + block - 1] (inclusive)
        
        if (r < l + block) {
            for (let k = r; k < l + block; k++) {
                newLine[k] = 1;
            }
        }
    }

    // Determine Empty cells?
    // A cell is empty if it is not covered by ANY block in ANY valid configuration.
    // This is harder with just L/R limits.
    // However, we can use the "Simple Glue" logic:
    // If a cell is outside the range [LeftLimit[i], RightLimit[i] + block] for ALL i, it's empty.
    // Wait, indices are not strictly partitioned. Block 1 could be at 0 or 10.
    // But logic dictates order.
    // Range of block i is [LeftPositions[i], RightPositions[i] + hints[i]].
    // If a cell k is not in ANY of these ranges, it is 0.
    
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
const memo = new Map();
function canFitRest(line, startIndex, hints, hintIndex) {
    // Optimization: If hints are empty, we just need to check if remaining line has no '1's
    if (hintIndex >= hints.length) {
        for (let i = startIndex; i < line.length; i++) {
            if (line[i] === 1) return false;
        }
        return true;
    }

    // Key for memoization (primitive approach)
    // In a full solver, we'd pass a cache. For single line, maybe overkill, but safe.
    // let key = `${startIndex}-${hintIndex}`; 
    // Skipping memo for now as line lengths are small (<80) and recursion depth is low.
    
    const remainingLen = line.length - startIndex;
    // Min space needed: sum of hints + (hints.length - 1) spaces
    // Calculate lazily or precalc?
    let minSpace = 0;
    for(let i=hintIndex; i<hints.length; i++) minSpace += hints[i] + (i < hints.length - 1 ? 1 : 0);
    
    if (remainingLen < minSpace) return false;

    const block = hints[hintIndex];
    // Try to find *any* valid placement for this block
    // We only need ONE valid path to return true.
    for (let i = startIndex; i <= line.length - minSpace; i++) { // Optimization on upper bound?
         // Check placement
         let valid = true;
         // Block
         for (let k = 0; k < block; k++) {
             if (line[i+k] === 0) { valid = false; break; }
         }
         if (!valid) continue;
         
         // Boundary before (checked by loop start usually, but strictly:
         if (i > 0 && line[i-1] === 1) valid = false; // Should have been handled by caller or skip
         // Wait, the caller (loop) iterates i. 
         // If i > startIndex, we implied space at i-1.
         // If line[i-1] is 1, we can't place here if we skipped it.
         // Actually, if we skip a '1', that's invalid.
         // So we can't just skip '1's.
         
         // Correct logic:
         // We iterate i. If we pass a '1' at index < i, that 1 is orphaned -> Invalid path.
         // So we can only scan forward as long as we don't skip a '1'.
         
         let skippedOne = false;
         for (let x = startIndex; x < i; x++) {
             if (line[x] === 1) { skippedOne = true; break; }
         }
         if (skippedOne) break; // Cannot go further right, we left a 1 behind.
         
         // Boundary after
         if (i + block < line.length && line[i+block] === 1) valid = false;
         
         if (valid) {
             // Recurse
             if (canFitRest(line, i + block + 1, hints, hintIndex + 1)) return true;
         }
    }
    
    return false;
}


/**
 * Solves the puzzle using logical iteration.
 * @param {number[][]} rowHints 
 * @param {number[][]} colHints 
 * @returns {object} { solvedGrid: number[][], percentSolved: number }
 */
export function solvePuzzle(rowHints, colHints) {
    const rows = rowHints.length;
    const cols = colHints.length;
    
    // Initialize grid with -1
    let grid = Array(rows).fill(null).map(() => Array(cols).fill(-1));
    
    let changed = true;
    let iterations = 0;
    const MAX_ITER = 100; // Safety break
    
    while (changed && iterations < MAX_ITER) {
        changed = false;
        iterations++;
        
        // Rows
        for (let r = 0; r < rows; r++) {
            const newLine = solveLine(grid[r], rowHints[r]);
            if (newLine) {
                for (let c = 0; c < cols; c++) {
                    if (grid[r][c] !== newLine[c]) {
                        grid[r][c] = newLine[c];
                        changed = true;
                    }
                }
            }
        }
        
        // Cols
        for (let c = 0; c < cols; c++) {
            const currentCol = grid.map(row => row[c]);
            const newCol = solveLine(currentCol, colHints[c]);
            if (newCol) {
                for (let r = 0; r < rows; r++) {
                    if (grid[r][c] !== newCol[r]) {
                        grid[r][c] = newCol[r];
                        changed = true;
                    }
                }
            }
        }
    }
    
    // Calculate solved %
    let solvedCount = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] !== -1) solvedCount++;
        }
    }
    
    return {
        solvedGrid: grid,
        percentSolved: (solvedCount / (rows * cols)) * 100
    };
}
