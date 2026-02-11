import { calculateHints } from '../utils/puzzleUtils.js';

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

const buildPrefix = (lineState) => {
  const n = lineState.length;
  const filled = new Array(n + 1).fill(0);
  const cross = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    filled[i + 1] = filled[i] + (lineState[i] === 1 ? 1 : 0);
    cross[i + 1] = cross[i] + (lineState[i] === 2 ? 1 : 0);
  }
  return { filled, cross };
};

const buildSuffixMin = (hints) => {
  const m = hints.length;
  const suffixMin = new Array(m + 1).fill(0);
  let sumHints = 0;
  for (let i = m - 1; i >= 0; i--) {
    sumHints += hints[i];
    const separators = m - i - 1;
    suffixMin[i] = sumHints + separators;
  }
  return suffixMin;
};

const solveLineLogic = (lineState, hints) => {
  const n = lineState.length;
  const m = hints.length;
  if (m === 0) {
    for (let i = 0; i < n; i++) {
      if (lineState[i] === 0) return { index: i, state: 2 };
    }
    return { index: -1 };
  }

  const { filled, cross } = buildPrefix(lineState);
  const suffixMin = buildSuffixMin(hints);

  const hasFilled = (a, b) => filled[b] - filled[a] > 0;
  const hasCross = (a, b) => cross[b] - cross[a] > 0;

  const memoSuffix = Array.from({ length: n + 1 }, () => Array(m + 1).fill(null));
  const memoPrefix = Array.from({ length: n + 1 }, () => Array(m + 1).fill(null));

  const canPlaceSuffix = (pos, hintIndex) => {
    const cached = memoSuffix[pos][hintIndex];
    if (cached !== null) return cached;
    if (hintIndex === m) {
      const result = !hasFilled(pos, n);
      memoSuffix[pos][hintIndex] = result;
      return result;
    }
    const len = hints[hintIndex];
    // maxStart logic: we need enough space for this block (len) + subsequent blocks/gaps (suffixMin[hintIndex+1])
    // suffixMin[hintIndex] = len + (m - hintIndex - 1) + suffixMin[hintIndex+1]
    // Actually suffixMin[hintIndex] already includes everything needed from here to end.
    // So if we place block at start, end is start + len.
    // Total space needed is suffixMin[hintIndex].
    // So start can go up to n - suffixMin[hintIndex].
    const maxStart = n - suffixMin[hintIndex];
    
    for (let start = pos; start <= maxStart; start++) {
      if (hasFilled(pos, start)) continue; // Must be empty before this block
      if (hasCross(start, start + len)) continue; // Block space must be free of crosses
      
      // If not the last block, we need a gap after
      if (hintIndex < m - 1) {
          if (start + len < n && lineState[start + len] === 1) continue; // Gap must not be filled
          // We can assume gap is at start + len. Next block starts at least at start + len + 1
          const nextPos = start + len + 1;
          if (canPlaceSuffix(nextPos, hintIndex + 1)) {
            memoSuffix[pos][hintIndex] = true;
            return true;
          }
      } else {
          // Last block
          // Check if we can fill the rest with empty
          if (hasFilled(start + len, n)) continue;
          memoSuffix[pos][hintIndex] = true;
          return true;
      }
    }
    memoSuffix[pos][hintIndex] = false;
    return false;
  };

  const canPlacePrefix = (pos, hintCount) => {
    const cached = memoPrefix[pos][hintCount];
    if (cached !== null) return cached;
    if (hintCount === 0) {
      const result = !hasFilled(0, pos);
      memoPrefix[pos][hintCount] = result;
      return result;
    }
    const len = hints[hintCount - 1];
    
    // Logic for prefix:
    // We are placing the (hintCount-1)-th block ending at 'start + len' <= pos.
    // So 'start' <= pos - len.
    // But we also need to ensure there is space for previous blocks.
    // However, the simple constraint is just iterating backwards.
    
    // maxStart: if this is the only block, maxStart = pos - len.
    // If there are previous blocks, we need a gap before this block.
    // So previous block ended at start - 1.
    // Actually the recursive call will handle space check.
    // But for the gap check:
    // If we place block at 'start', we need lineState[start-1] != 1 (if start > 0).
    // And we recursively check canPlacePrefix(start-1, count-1).
    // But if start=0 and count > 1, impossible.
    
    const maxStart = pos - len; // Simplified, loop condition handles rest
    
    for (let start = maxStart; start >= 0; start--) {
      if (hasCross(start, start + len)) continue;
      if (hasFilled(start + len, pos)) continue; // Must be empty after this block up to pos
      
      // Check gap before
      if (hintCount > 1) {
          if (start === 0) continue; // No space for previous blocks
          if (lineState[start - 1] === 1) continue; // Gap must not be filled
          const prevPos = start - 1;
          if (canPlacePrefix(prevPos, hintCount - 1)) {
            memoPrefix[pos][hintCount] = true;
            return true;
          }
      } else {
          // First block
          if (hasFilled(0, start)) continue; // Before first block must be empty
          memoPrefix[pos][hintCount] = true;
          return true;
      }
    }
    memoPrefix[pos][hintCount] = false;
    return false;
  };

  const possibleStarts = [];
  for (let i = 0; i < m; i++) {
    const len = hints[i];
    const starts = [];
    for (let start = 0; start <= n - len; start++) {
      if (!canPlacePrefix(start, i)) continue;
      if (hasCross(start, start + len)) continue;
      if (start + len < n && lineState[start + len] === 1) continue;
      const nextPos = start + len < n ? start + len + 1 : start + len;
      if (!canPlaceSuffix(nextPos, i + 1)) continue;
      starts.push(start);
    }
    possibleStarts.push(starts);
  }

  const mustFill = new Array(n).fill(false);
  const coverage = new Array(n).fill(false);

  for (let i = 0; i < m; i++) {
    const starts = possibleStarts[i];
    const len = hints[i];
    if (starts.length === 0) return { index: -1 };
    let earliest = starts[0];
    let latest = starts[0];
    for (let j = 1; j < starts.length; j++) {
      earliest = Math.min(earliest, starts[j]);
      latest = Math.max(latest, starts[j]);
    }
    const startOverlap = Math.max(earliest, latest);
    const endOverlap = Math.min(earliest + len - 1, latest + len - 1);
    for (let k = startOverlap; k <= endOverlap; k++) {
      if (k >= 0 && k < n) mustFill[k] = true;
    }
    for (let s = 0; s < starts.length; s++) {
      const start = starts[s];
      for (let k = start; k < start + len; k++) {
        coverage[k] = true;
      }
    }
  }

  for (let i = 0; i < n; i++) {
    if (lineState[i] === 0 && mustFill[i]) return { index: i, state: 1 };
  }
  for (let i = 0; i < n; i++) {
    if (lineState[i] === 0 && !coverage[i]) return { index: i, state: 2 };
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
