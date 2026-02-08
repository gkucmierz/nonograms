import { calculateHints } from '../utils/puzzleUtils.js';

const messages = {
  pl: {
    'worker.solved': 'Rozwiązane!',
    'worker.logicRow': 'Logika: Wiersz {row}, Kolumna {col} -> {state}',
    'worker.logicCol': 'Logika: Kolumna {col}, Wiersz {row} -> {state}',
    'worker.guess': 'Zgadywanie: Wiersz {row}, Kolumna {col}',
    'worker.done': 'Koniec!',
    'worker.state.filled': 'Pełne',
    'worker.state.empty': 'Puste'
  },
  en: {
    'worker.solved': 'Solved!',
    'worker.logicRow': 'Logic: Row {row}, Column {col} -> {state}',
    'worker.logicCol': 'Logic: Column {col}, Row {row} -> {state}',
    'worker.guess': 'Guessing: Row {row}, Column {col}',
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

const getPermutations = (length, hints) => {
  const results = [];
  const recurse = (index, hintIndex, currentLine) => {
    if (hintIndex === hints.length) {
      while (currentLine.length < length) {
        currentLine.push(0);
      }
      results.push(currentLine);
      return;
    }

    const currentHint = hints[hintIndex];
    let remainingHintsLen = 0;
    for (let i = hintIndex + 1; i < hints.length; i++) remainingHintsLen += hints[i] + 1;
    const maxStart = length - remainingHintsLen - currentHint;

    for (let start = index; start <= maxStart; start++) {
      const newLine = [...currentLine];
      for (let k = index; k < start; k++) newLine.push(0);
      for (let k = 0; k < currentHint; k++) newLine.push(1);
      if (hintIndex < hints.length - 1) newLine.push(0);
      recurse(newLine.length, hintIndex + 1, newLine);
    }
  };

  recurse(0, 0, []);
  return results;
};

const isValidPermutation = (perm, currentLineState) => {
  for (let i = 0; i < perm.length; i++) {
    const boardVal = currentLineState[i];
    const permVal = perm[i];
    if (boardVal === 1 && permVal !== 1) return false;
    if (boardVal === 2 && permVal !== 0) return false;
  }
  return true;
};

const solveLineLogic = (lineState, hints, size) => {
  const allPerms = getPermutations(size, hints);
  const validPerms = allPerms.filter(p => isValidPermutation(p, lineState));
  if (validPerms.length === 0) return { index: -1 };

  for (let i = 0; i < size; i++) {
    if (lineState[i] !== 0) continue;
    let allOne = true;
    let allZero = true;
    for (const p of validPerms) {
      if (p[i] === 0) allOne = false;
      if (p[i] === 1) allZero = false;
      if (!allOne && !allZero) break;
    }
    if (allOne) return { index: i, state: 1 };
    if (allZero) return { index: i, state: 2 };
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
    const result = solveLineLogic(rowLine, hints, size);
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
    const result = solveLineLogic(colLine, hints, size);
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

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const current = playerGrid[r][c];
      const target = solution[r][c];
      let isCorrect = false;
      if (target === 1 && current === 1) isCorrect = true;
      if (target === 0 && current === 2) isCorrect = true;
      if (target === 0 && current === 0) isCorrect = false;
      if (target === 1 && current === 0) isCorrect = false;
      if (!isCorrect) {
        const newState = target === 1 ? 1 : 2;
        return {
          type: 'move',
          r,
          c,
          state: newState,
          statusText: t(locale, 'worker.guess', { row: r + 1, col: c + 1 })
        };
      }
    }
  }

  return { type: 'done', statusText: t(locale, 'worker.done') };
};

self.onmessage = (event) => {
  const { id, playerGrid, solution, locale } = event.data;
  const resolved = resolveLocale(locale);
  const result = handleStep(playerGrid, solution, resolved);
  self.postMessage({ id, ...result });
};
