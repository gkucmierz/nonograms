import { calculateHints } from '../utils/puzzleUtils.js';
import { solveLine } from '../utils/solver.js';

const messages = {
  pl: {
    'worker.solved': 'Rozwiązane!',
    'worker.logicRow': 'Logika: Wiersz {row}, Kolumna {col} -> {state}',
    'worker.logicCol': 'Logika: Kolumna {col}, Wiersz {row} -> {state}',
    'worker.stuck': 'Brak logicznego ruchu. Spróbuj zgadnąć lub cofnąć.',
    'worker.done': 'Koniec!',
    'worker.state.filled': 'Pełne',
    'worker.state.empty': 'Puste'
  },
  en: {
    'worker.solved': 'Solved!',
    'worker.logicRow': 'Logic: Row {row}, Column {col} -> {state}',
    'worker.logicCol': 'Logic: Column {col}, Row {row} -> {state}',
    'worker.stuck': 'No logical move found. Try guessing or undoing.',
    'worker.done': 'Done!',
    'worker.state.filled': 'Filled',
    'worker.state.empty': 'Empty'
  }
};

const resolveLocale = (value) => {
  if (!value) return 'en';
  const short = String(value).toLowerCase().split('-')[0];
  return short === 'pl' ? 'pl' : 'en';
};

const format = (text, params = {}) => {
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
};

const t = (locale, key, params) => {
  const lang = messages[locale] || messages.en;
  const value = lang[key] || messages.en[key] || key;
  return typeof value === 'string' ? format(value, params) : key;
};

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
      if (isFilled !== shouldBeFilled) return false;
    }
  }
  return true;
};

const handleStep = (playerGrid, solution, locale) => {
  if (isSolved(playerGrid, solution)) {
    return { type: 'done', statusText: t(locale, 'worker.solved') };
  }

  const size = solution.length;
  const { rowHints, colHints } = calculateHints(solution);

  for (let r = 0; r < size; r++) {
    const rowLine = playerGrid[r];
    const hints = rowHints[r];
    const result = solveLineLogic(rowLine, hints);
    if (result.index !== -1) {
      const stateLabel = t(locale, result.state === 1 ? 'worker.state.filled' : 'worker.state.empty');
      return {
        type: 'move',
        r,
        c: result.index,
        state: result.state,
        statusText: t(locale, 'worker.logicRow', { row: r + 1, col: result.index + 1, state: stateLabel })
      };
    }
  }

  for (let c = 0; c < size; c++) {
    const colLine = [];
    for (let r = 0; r < size; r++) colLine.push(playerGrid[r][c]);
    const hints = colHints[c];
    const result = solveLineLogic(colLine, hints);
    if (result.index !== -1) {
      const stateLabel = t(locale, result.state === 1 ? 'worker.state.filled' : 'worker.state.empty');
      return {
        type: 'move',
        r: result.index,
        c,
        state: result.state,
        statusText: t(locale, 'worker.logicCol', { row: result.index + 1, col: c + 1, state: stateLabel })
      };
    }
  }

  // Check for guess logic - we want to avoid this unless strictly necessary
  // If no logic move found, return 'stuck' instead of cheating
  return { type: 'stuck', statusText: t(locale, 'worker.stuck') };
};

self.onmessage = (event) => {
  const { id, playerGrid, solution, locale } = event.data;
  const resolved = resolveLocale(locale);
  const result = handleStep(playerGrid, solution, resolved);
  self.postMessage({ id, ...result });
};
