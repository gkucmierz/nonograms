import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { generateRandomGrid } from '@/utils/puzzleUtils';

// Definicje zagadek (Static Puzzles)
const PUZZLES = {
  easy: {
    id: 'easy',
    name: 'Uśmiech',
    size: 5,
    grid: [
      [0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0],
      [1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0]
    ]
  },
  medium: {
    id: 'medium',
    name: 'Domek',
    size: 10,
    grid: [
      [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 0, 0, 0, 0, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 1, 1, 1, 1, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 1, 1, 1, 1, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0]
    ]
  },
  hard: {
    id: 'hard',
    name: 'Statek',
    size: 15,
    grid: [
      [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
      [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0],
      [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0],
      [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],
      [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0],
      [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0]
    ]
  }
};

export const usePuzzleStore = defineStore('puzzle', () => {
  // State
  const currentLevelId = ref('easy');
  const solution = ref([]);
  const playerGrid = ref([]); // 0: empty, 1: filled, 2: cross
  const isGameWon = ref(false);
  const size = ref(5);
  const startTime = ref(null);
  const elapsedTime = ref(0);
  const moves = ref(0);
  const timerInterval = ref(null);
  
  // History for undo
  const history = ref([]);
  
  // Progress State
  const totalCellsToFill = computed(() => {
    return solution.value.flat().filter(c => c === 1).length;
  });

  const filledCorrectly = computed(() => {
    let count = 0;
    if (solution.value.length === 0 || playerGrid.value.length === 0) return 0;
    
    for (let r = 0; r < size.value; r++) {
      for (let c = 0; c < size.value; c++) {
        // Zliczamy tylko poprawne wypełnienia (czarne), 
        // ale w nonogramach postęp to często: (poprawne_czarne - bledne_czarne) / total_czarne
        // Zróbmy prostą wersję: % poprawnie zaznaczonych czarnych - błędnie zaznaczone czarne
        if (playerGrid.value[r][c] === 1) {
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
    elapsedTime.value = 0;
    startTimer();
  }

  function initCustomGame(customSize) {
    stopTimer();
    currentLevelId.value = 'custom';
    size.value = customSize;
    
    // Generate random grid
    solution.value = generateRandomGrid(customSize);
    
    resetGrid();
    isGameWon.value = false;
    elapsedTime.value = 0;
    startTimer();
  }

  function resetGrid() {
    playerGrid.value = Array(size.value).fill().map(() => Array(size.value).fill(0));
    moves.value = 0;
    history.value = [];
  }
  
  function pushHistory() {
      const gridCopy = playerGrid.value.map(row => [...row]);
      history.value.push(gridCopy);
      if (history.value.length > 50) history.value.shift();
  }

  function undo() {
      if (history.value.length === 0 || isGameWon.value) return;
      const previousState = history.value.pop();
      playerGrid.value = previousState;
      moves.value++; 
      saveState();
  }

  function toggleCell(r, c, isRightClick = false) {
    if (isGameWon.value) return;
    
    pushHistory();

    const currentState = playerGrid.value[r][c];
    let newState;
    
    if (isRightClick) {
      if (currentState === 1) return; // Don't override filled
      newState = currentState === 2 ? 0 : 2;
    } else {
      if (currentState === 2) return; // Don't override cross
      newState = currentState === 1 ? 0 : 1;
    }
    
    playerGrid.value[r][c] = newState; // This triggers reactivity
    moves.value++;
    checkWin();
    saveState();
  }
  
  function setCell(r, c, state) {
     if (isGameWon.value) return;
     if (playerGrid.value[r][c] !== state) {
         pushHistory();
         playerGrid.value[r][c] = state;
         moves.value++;
         checkWin();
         saveState();
     }
  }

  function checkWin() {
    let correct = true;
    for (let r = 0; r < size.value; r++) {
      for (let c = 0; c < size.value; c++) {
        const playerCell = playerGrid.value[r][c];
        const solutionCell = solution.value[r][c];
        
        const isFilled = playerCell === 1;
        const shouldBeFilled = solutionCell === 1;
        
        if (isFilled !== shouldBeFilled) {
          correct = false;
          break;
        }
      }
      if (!correct) break;
    }
    
    if (correct) {
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
  
  function initGame(levelId = 'easy') {
    // If init called without args and we have save, load it?
    // User might want to start fresh if clicking buttons.
    // Let's add explicit 'continue' logic or just auto-load on first run.
    // For now, let's just stick to explicit init, but maybe load on mount if exists?
    // The user didn't explicitly ask for "Continue", but "features from HTML".
    // HTML usually auto-saves and loads.
    
    stopTimer();
    currentLevelId.value = levelId;
    
    let puzzle = PUZZLES[levelId];
    if (!puzzle) {
        puzzle = PUZZLES['easy'];
    }

    size.value = puzzle.size;
    solution.value = puzzle.grid;
    
    resetGrid();
    isGameWon.value = false;
    elapsedTime.value = 0;
    startTimer();
    saveState();
  }
  
  // Modify initCustomGame similarly
  function initCustomGame(customSize) {
    stopTimer();
    currentLevelId.value = 'custom';
    size.value = customSize;
    solution.value = generateRandomGrid(customSize);
    resetGrid();
    isGameWon.value = false;
    elapsedTime.value = 0;
    startTimer();
    saveState();
  }

  // Duplicate toggleCell/setCell removed

  function resetGame() {
    if (currentLevelId.value === 'custom') {
        resetGrid();
        isGameWon.value = false;
        elapsedTime.value = 0;
        startTimer();
        saveState();
    } else {
        initGame(currentLevelId.value);
    }
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
    toggleCell,
    setCell,
    resetGame,
    checkWin,
    loadState, // expose loadState
    moves,
    undo,
    closeWinModal
  };

});
