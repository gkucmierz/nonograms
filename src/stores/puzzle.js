import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { generateRandomGrid, calculateHints, calculateLineHints, validateLine } from '@/utils/puzzleUtils';
import { PUZZLES } from '@/constants/puzzles';

export const usePuzzleStore = defineStore('puzzle', () => {
  // State
  const currentLevelId = ref('easy');
  const solution = ref([]);
  const playerGrid = ref([]); // 0: empty, 1: filled, 2: cross
  const isGameWon = ref(false);
  const hasUsedGuide = ref(false);
  const guideUsageCount = ref(0);
  const hasUsedBoost = ref(false);
  const boostUsageCount = ref(0);
  const currentDifficulty = ref(null); // 'easy', 'medium', 'hard', 'custom' or object { density: 0.5 }
  const currentDensity = ref(0);
  const size = ref(5);
  const startTime = ref(null);
  const elapsedTime = ref(0);
  const moves = ref(0);
  const timerInterval = ref(null);
  
  // History for undo
  const history = ref([]);
  const currentTransaction = ref(null);
  
  // Progress State
  const totalCellsToFill = computed(() => {
    return solution.value.flat().filter(c => c === 1).length;
  });

  const filledCorrectly = computed(() => {
    let count = 0;
    if (solution.value.length === 0 || playerGrid.value.length === 0) return 0;
    
    const rows = solution.value.length;
    const cols = solution.value[0].length;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Zliczamy tylko poprawne wypełnienia (czarne), 
        // ale w nonogramach postęp to często: (poprawne_czarne - bledne_czarne) / total_czarne
        // Zróbmy prostą wersję: % poprawnie zaznaczonych czarnych - błędnie zaznaczone czarne
        if (playerGrid.value[r] && playerGrid.value[r][c] === 1) {
            if (solution.value[r][c] === 1) count++;
            else count--; // kara za błąd
        }
      }
    }
    return Math.max(0, count);
  });

  const progressPercentage = computed(() => {
    if (totalCellsToFill.value === 0) return 0;
    return Math.min(100, (filledCorrectly.value / totalCellsToFill.value) * 100);
  });

  const completedRows = computed(() => {
    if (!solution.value.length || !playerGrid.value.length) return [];
    const rows = solution.value.length;
    return Array(rows).fill().map((_, r) => {
      const targetHints = calculateLineHints(solution.value[r]);
      const playerLine = playerGrid.value[r];
      return validateLine(playerLine, targetHints);
    });
  });

  const completedCols = computed(() => {
    if (!solution.value.length || !playerGrid.value.length) return [];
    const rows = solution.value.length;
    const cols = solution.value[0].length;
    return Array(cols).fill().map((_, c) => {
        const col = [];
        for (let r = 0; r < rows; r++) {
            col.push(solution.value[r][c]);
        }
        const targetHints = calculateLineHints(col);
        const playerLine = playerGrid.value.map(row => row[c]);
        return validateLine(playerLine, targetHints);
    });
  });

  // Actions
  function initGame(levelId = 'easy') {
    stopTimer();
    currentLevelId.value = levelId;
    
    let puzzle = PUZZLES[levelId];
    if (!puzzle) {
        // Fallback or custom logic if needed, but for predefined levels:
        puzzle = PUZZLES['easy'];
    }

    size.value = puzzle.size;
    solution.value = puzzle.grid;
    
    resetGrid();
    isGameWon.value = false;
    hasUsedGuide.value = false;
    guideUsageCount.value = 0;
    hasUsedBoost.value = false;
    boostUsageCount.value = 0;
    currentDensity.value = totalCellsToFill.value / (size.value * size.value);
    elapsedTime.value = 0;
    startTimer();
    saveState();
  }

  function initCustomGame(customSize, density = 0.5) {
    stopTimer();
    currentLevelId.value = 'custom';
    size.value = customSize;
    
    // Generate random grid
    solution.value = generateRandomGrid(customSize, density);
    
    resetGrid();
    isGameWon.value = false;
    hasUsedGuide.value = false;
    guideUsageCount.value = 0;
    hasUsedBoost.value = false;
    boostUsageCount.value = 0;
    currentDensity.value = density;
    elapsedTime.value = 0;
    startTimer();
    saveState();
  }

  function initFromImage(grid) {
    stopTimer();
    currentLevelId.value = 'custom_image';
    // Use the larger dimension for size to ensure loops cover everything if square-assumption exists
    // But ideally we should support rectangular.
    // For now, size.value is used in resetGrid loop.
    // Let's update resetGrid to handle rectangular.
    size.value = Math.max(grid.length, grid[0].length);
    solution.value = grid;
    
    resetGrid();
    isGameWon.value = false;
    hasUsedGuide.value = false;
    guideUsageCount.value = 0;
    hasUsedBoost.value = false;
    boostUsageCount.value = 0;
    
    // Calculate density
    const totalFilled = grid.flat().filter(c => c === 1).length;
    currentDensity.value = totalFilled / (size.value * size.value);
    
    elapsedTime.value = 0;
    startTimer();
    saveState();
  }

  function resetGrid() {
    const rows = solution.value.length;
    const cols = solution.value[0].length;
    playerGrid.value = Array(rows).fill().map(() => Array(cols).fill(0));
    history.value = [];
    moves.value = 0;
    currentTransaction.value = null;
  }
  
  function startInteraction() {
      currentTransaction.value = [];
  }

  function endInteraction() {
      if (currentTransaction.value && currentTransaction.value.length > 0) {
          history.value.push(currentTransaction.value);
          if (history.value.length > 50) history.value.shift();
          saveState();
      }
      currentTransaction.value = null;
  }

  function undo() {
      if (history.value.length === 0 || isGameWon.value) return;
      
      const transaction = history.value.pop();
      
      // Handle legacy history (full grid snapshot)
      if (!Array.isArray(transaction) || (transaction.length > 0 && Array.isArray(transaction[0]))) {
          playerGrid.value = transaction;
      } else {
          // Handle new history (list of changes)
          // Revert changes in reverse order
          for (let i = transaction.length - 1; i >= 0; i--) {
              const { r, c, oldVal } = transaction[i];
              playerGrid.value[r][c] = oldVal;
          }
      }
      
      moves.value++; 
      saveState();
  }

  function toggleCell(r, c, isRightClick = false) {
    if (isGameWon.value) return;
    
    const currentState = playerGrid.value[r][c];
    let newState;
    
    if (isRightClick) {
      if (currentState === 1) return; // Don't override filled
      newState = currentState === 2 ? 0 : 2;
    } else {
      if (currentState === 2) return; // Don't override cross
      newState = currentState === 1 ? 0 : 1;
    }
    
    if (currentState === newState) return;

    // Apply change
    playerGrid.value[r][c] = newState; 
    
    // Record history
    const change = { r, c, oldVal: currentState, newVal: newState };
    if (currentTransaction.value) {
        currentTransaction.value.push(change);
    } else {
        // Atomic change if no interaction started
        history.value.push([change]);
        if (history.value.length > 50) history.value.shift();
        saveState();
    }

    moves.value++;
    checkWin();
    // saveState(); // Moved to endInteraction or atomic block
  }
  
  function setCell(r, c, state) {
     if (isGameWon.value) return;
     const currentState = playerGrid.value[r][c];
     
     if (currentState !== state) {
         // Apply change
         playerGrid.value[r][c] = state;
         
         // Record history
         const change = { r, c, oldVal: currentState, newVal: state };
         if (currentTransaction.value) {
             currentTransaction.value.push(change);
         } else {
             history.value.push([change]);
             if (history.value.length > 50) history.value.shift();
             saveState();
         }
         
         moves.value++;
         checkWin();
         // saveState(); // Moved to endInteraction or atomic block
     }
  }

  function checkWin() {
    let correct = true;
    
    // Calculate expected hints from solution (truth)
    // We do this dynamically to ensure we always check against the rules of the board
    const rows = solution.value.length;
    const cols = solution.value[0].length;
    
    const solutionRows = solution.value;
    const solutionCols = Array(cols).fill().map((_, c) => solution.value.map(r => r[c]));
    
    // Check Rows
    for (let r = 0; r < rows; r++) {
      const targetHints = calculateLineHints(solutionRows[r]);
      const playerLine = playerGrid.value[r];
      if (!validateLine(playerLine, targetHints)) {
        correct = false;
        break;
      }
    }
    
    if (correct) {
      // Check Columns
      for (let c = 0; c < cols; c++) {
        const targetHints = calculateLineHints(solutionCols[c]);
        const playerLine = playerGrid.value.map(row => row[c]);
        if (!validateLine(playerLine, targetHints)) {
          correct = false;
          break;
        }
      }
    }
    
    if (correct) {
      // Auto-fill remaining empty cells with X (2)
      const rows = solution.value.length;
      const cols = solution.value[0].length;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (playerGrid.value[r][c] === 0) {
            playerGrid.value[r][c] = 2;
          }
        }
      }
      
      isGameWon.value = true;
      stopTimer();
    }
  }
  
  function startTimer() {
    if (timerInterval.value) clearInterval(timerInterval.value);
    startTime.value = Date.now() - (elapsedTime.value * 1000); // Adjust start time based on elapsed
    timerInterval.value = setInterval(() => {
      elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000);
      saveState();
    }, 1000);
  }
  
  function stopTimer() {
    if (timerInterval.value) {
      clearInterval(timerInterval.value);
      timerInterval.value = null;
    }
    saveState();
  }

  // Persistence
  const STORAGE_KEY = 'nonogram_state_v1';
  
  function saveState() {
    const stateToSave = {
        currentLevelId: currentLevelId.value,
        size: size.value,
        solution: solution.value,
        playerGrid: playerGrid.value,
        isGameWon: isGameWon.value,
        hasUsedGuide: hasUsedGuide.value,
        guideUsageCount: guideUsageCount.value,
        hasUsedBoost: hasUsedBoost.value,
        boostUsageCount: boostUsageCount.value,
        currentDensity: currentDensity.value,
        elapsedTime: elapsedTime.value,
        moves: moves.value,
        history: history.value
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }

  function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            currentLevelId.value = parsed.currentLevelId;
            size.value = parsed.size;
            solution.value = parsed.solution;
            playerGrid.value = parsed.playerGrid;
            isGameWon.value = parsed.isGameWon;
            hasUsedGuide.value = parsed.hasUsedGuide || false;
            guideUsageCount.value = parsed.guideUsageCount || 0;
            hasUsedBoost.value = parsed.hasUsedBoost || false;
            boostUsageCount.value = parsed.boostUsageCount || 0;
            currentDensity.value = parsed.currentDensity || 0;
            elapsedTime.value = parsed.elapsedTime || 0;
            moves.value = parsed.moves || 0;
            history.value = parsed.history || [];
            
            if (!isGameWon.value) {
                startTimer();
            }
            return true;
        } catch (e) {
            console.error('Failed to load save', e);
            return false;
        }
    }
    return false;
  }
  
  function resetGame() {
    if (currentLevelId.value === 'custom' || currentLevelId.value === 'custom_image') {
        resetGrid();
        isGameWon.value = false;
        hasUsedGuide.value = false;
        guideUsageCount.value = 0;
        elapsedTime.value = 0;
        startTimer();
        saveState();
    } else {
        initGame(currentLevelId.value);
    }
  }

  function markGuideUsed() {
    if (isGameWon.value) return;
    hasUsedGuide.value = true;
    guideUsageCount.value++;
    saveState();
  }

  function markBoostUsed() {
    if (isGameWon.value) return;
    hasUsedBoost.value = true;
    boostUsageCount.value++;
    saveState();
  }

  function closeWinModal() {
    if (!isGameWon.value) return;
    isGameWon.value = false;
    saveState();
  }

  return {
    currentLevelId,
    solution,
    playerGrid,
    isGameWon,
    size,
    elapsedTime,
    progressPercentage,
    initGame,
    initCustomGame,
    initFromImage,
    toggleCell,
    setCell,
    resetGame,
    checkWin,
    loadState, // expose loadState
    moves,
    undo,
    closeWinModal,
    hasUsedGuide,
    guideUsageCount,
    currentDensity,
    markGuideUsed,
    markBoostUsed,
    hasUsedBoost,
    boostUsageCount,
    startInteraction,
    endInteraction,
    completedRows,
    completedCols
  };

});
