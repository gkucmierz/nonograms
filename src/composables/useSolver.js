import { ref, computed } from 'vue';
import { usePuzzleStore } from '@/stores/puzzle';
import { calculateHints } from '@/utils/puzzleUtils';

export function useSolver() {
    const store = usePuzzleStore();
    
    const isPlaying = ref(false);
    const speedIndex = ref(0);
    const speeds = [1000, 500, 250, 125];
    const speedLabels = ['x1', 'x2', 'x3', 'x4'];
    const statusText = ref('Oczekiwanie...');
    
    let intervalId = null;

    // --- Core Solver Logic (Human-Like) ---
    
    // Generate all valid line permutations
    function getPermutations(length, hints) {
        const results = [];
        
        function recurse(index, hintIndex, currentLine) {
            // Base case: all hints placed
            if (hintIndex === hints.length) {
                // Fill rest with 0
                while (currentLine.length < length) {
                    currentLine.push(0);
                }
                results.push(currentLine);
                return;
            }

            const currentHint = hints[hintIndex];
            // Calculate remaining space needed for other hints + gaps
            let remainingHintsLen = 0;
            for (let i = hintIndex + 1; i < hints.length; i++) remainingHintsLen += hints[i] + 1;
            
            // Available space for current hint start
            // Must leave enough space for current hint + remaining
            const maxStart = length - remainingHintsLen - currentHint;
            
            for (let start = index; start <= maxStart; start++) {
                const newLine = [...currentLine];
                // Add padding 0s before hint
                for (let k = index; k < start; k++) newLine.push(0);
                // Add hint 1s
                for (let k = 0; k < currentHint; k++) newLine.push(1);
                // Add gap 0 if not last hint
                if (hintIndex < hints.length - 1) newLine.push(0);
                
                recurse(newLine.length, hintIndex + 1, newLine);
            }
        }

        recurse(0, 0, []);
        return results;
    }

    // Filter permutations that match current known state (0=empty, 1=filled, 2=cross/empty-known)
    // Note: In our store: 0=empty(unknown), 1=filled, 2=cross(known empty).
    // In logic: 0=empty, 1=filled.
    // So if board has 1, perm must have 1. If board has 2, perm must have 0.
    function isValidPermutation(perm, currentLineState) {
        for (let i = 0; i < perm.length; i++) {
            const boardVal = currentLineState[i];
            const permVal = perm[i];
            
            if (boardVal === 1 && permVal !== 1) return false; // Must be filled
            if (boardVal === 2 && permVal !== 0) return false; // Must be empty
        }
        return true;
    }

    function solveLineLogic(lineState, hints, size) {
        // 1. Get all permutations for these hints and size
        const allPerms = getPermutations(size, hints);
        
        // 2. Filter by current board state
        const validPerms = allPerms.filter(p => isValidPermutation(p, lineState));
        
        if (validPerms.length === 0) return { index: -1 }; // Conflict or error
        
        // 3. Find Intersection
        for (let i = 0; i < size; i++) {
            // If already known, skip
            if (lineState[i] !== 0) continue;
            
            let allOne = true;
            let allZero = true;
            
            for (const p of validPerms) {
                if (p[i] === 0) allOne = false;
                if (p[i] === 1) allZero = false;
                if (!allOne && !allZero) break;
            }
            
            if (allOne) return { index: i, state: 1 }; // Must be filled
            if (allZero) return { index: i, state: 2 }; // Must be empty (cross)
        }
        
        return { index: -1 };
    }

    function step() {
        if (store.isGameWon) {
            pause();
            statusText.value = "Rozwiązane!";
            return;
        }

        const size = store.size;
        const { rowHints, colHints } = calculateHints(store.solution);
        let madeMove = false;

        // Try Rows
        for (let r = 0; r < size; r++) {
            const rowLine = store.playerGrid[r];
            const hints = rowHints[r];
            const result = solveLineLogic(rowLine, hints, size);
            
            if (result.index !== -1) {
                store.setCell(r, result.index, result.state);
                statusText.value = `Logika: Wiersz ${r+1}, Kolumna ${result.index+1} -> ${result.state === 1 ? 'Pełne' : 'Puste'}`;
                return;
            }
        }

        // Try Cols
        for (let c = 0; c < size; c++) {
            const colLine = [];
            for(let r=0; r<size; r++) colLine.push(store.playerGrid[r][c]);
            
            const hints = colHints[c];
            const result = solveLineLogic(colLine, hints, size);
            
            if (result.index !== -1) {
                store.setCell(result.index, c, result.state);
                statusText.value = `Logika: Kolumna ${c+1}, Wiersz ${result.index+1} -> ${result.state === 1 ? 'Pełne' : 'Puste'}`;
                return;
            }
        }

        // Smart Guess (Fallback)
        // Find a cell that is 1 in solution but 0 in grid (or 0 in solution and 0 in grid)
        // This is "Cheating" but ensures progress if logic gets stuck (or for large grids where logic is slow)
        // Real solver would branch, but for this app we use "Oracle Guess" if logic fails.
        if (!madeMove) {
             for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const current = store.playerGrid[r][c];
                    const target = store.solution[r][c];
                    
                    // Check if incorrect or unknown
                    let isCorrect = false;
                    if (target === 1 && current === 1) isCorrect = true;
                    if (target === 0 && current === 2) isCorrect = true;
                    if (target === 0 && current === 0) isCorrect = false; // Unknown, should be empty
                    if (target === 1 && current === 0) isCorrect = false; // Unknown, should be filled

                    if (!isCorrect) {
                        const newState = (target === 1) ? 1 : 2;
                        store.setCell(r, c, newState);
                        statusText.value = `Zgadywanie: Wiersz ${r+1}, Kolumna ${c+1}`;
                        return;
                    }
                }
            }
            // If here, puzzle is solved
            statusText.value = "Koniec!";
            pause();
        }
    }

    function togglePlay() {
        if (isPlaying.value) {
            pause();
        } else {
            play();
        }
    }

    function play() {
        isPlaying.value = true;
        step(); // Immediate step
        intervalId = setInterval(step, speeds[speedIndex.value]);
    }

    function pause() {
        isPlaying.value = false;
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
    }

    function changeSpeed() {
        speedIndex.value = (speedIndex.value + 1) % speeds.length;
        if (isPlaying.value) {
            pause();
            play();
        }
    }

    return {
        isPlaying,
        speedIndex,
        speedLabel: computed(() => speedLabels[speedIndex.value]),
        statusText,
        step,
        togglePlay,
        changeSpeed
    };
}
