import { calculateDifficulty } from '@/utils/puzzleUtils';

export function buildShareCanvas(data, t, formattedTime) {
  const { grid, size, rows, cols, currentDensity, guideUsageCount, hasUsedBoost } = data;
  if (!grid || !grid.length) return null;
  
  // Backward compatibility if rows/cols not provided
  const numRows = rows || size;
  const numCols = cols || size;
  
  const appUrl = typeof __APP_HOMEPAGE__ !== 'undefined' ? __APP_HOMEPAGE__ : '';
  const maxBoard = 640;
  // Calculate cell size based on the largest dimension to fit within maxBoard
  const maxDim = Math.max(numRows, numCols);
  const cellSize = Math.max(8, Math.floor(maxBoard / maxDim));
  
  const boardWidth = cellSize * numCols;
  const boardHeight = cellSize * numRows;
  
  const padding = 28;
  const headerHeight = 64;
  const footerHeight = 28;
  const infoHeight = (guideUsageCount > 0 && hasUsedBoost) ? 65 : 40;
  
  const width = boardWidth + padding * 2;
  const height = boardHeight + padding * 2 + headerHeight + footerHeight + infoHeight;
  
  const scale = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);
  
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#1b2a4a');
  bg.addColorStop(1, '#0a1324');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  
  ctx.fillStyle = '#e8fbff';
  ctx.font = '700 26px "Segoe UI", sans-serif';
  ctx.fillText(t('app.title'), padding, padding + 10);
  ctx.font = '600 16px "Segoe UI", sans-serif';
  ctx.fillText(`${t('win.time')} ${formattedTime}`, padding, padding + 34);
  
  // Difficulty & Density Info
  const densityPercent = Math.round(currentDensity * 100);
  // Calculate difficulty using the max dimension (size) as it relates to complexity
  const { level: difficultyKey } = calculateDifficulty(currentDensity, maxDim);
  let diffColor = '#33ff33';
  if (difficultyKey === 'extreme') diffColor = '#ff3333';
  else if (difficultyKey === 'hardest') diffColor = '#ff9933';
  else if (difficultyKey === 'harder') diffColor = '#ffff33';
  
  const difficultyText = t(`difficulty.${difficultyKey}`);
  ctx.font = '600 14px "Segoe UI", sans-serif';
  
  // Right aligned difficulty info
  const diffLabel = `${t('win.difficulty')} ${difficultyText} (${densityPercent}%)`;
  const diffWidth = ctx.measureText(diffLabel).width;
  ctx.fillStyle = diffColor;
  ctx.fillText(diffLabel, width - padding - diffWidth, padding + 34);

  const gridX = padding;
  const gridY = padding + headerHeight;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.fillRect(gridX, gridY, boardWidth, boardHeight);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  
  // Vertical lines
  for (let i = 0; i <= numCols; i++) {
    const x = gridX + i * cellSize;
    ctx.beginPath();
    ctx.moveTo(x, gridY);
    ctx.lineTo(x, gridY + boardHeight);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let i = 0; i <= numRows; i++) {
    const y = gridY + i * cellSize;
    ctx.beginPath();
    ctx.moveTo(gridX, y);
    ctx.lineTo(gridX + boardWidth, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#00f2fe';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = Math.max(1.5, Math.floor(cellSize * 0.12));
  
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const state = grid[r]?.[c];
      if (state === 1) {
        const x = gridX + c * cellSize + 1;
        const y = gridY + r * cellSize + 1;
        ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
      } else if (state === 2) {
        const x = gridX + c * cellSize + cellSize * 0.2;
        const y = gridY + r * cellSize + cellSize * 0.2;
        const d = cellSize * 0.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + d, y + d);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + d, y);
        ctx.lineTo(x, y + d);
        ctx.stroke();
      }
    }
  }

  // Guide Usage & Boost Info
  let infoY = height - padding - footerHeight + 10;
  if (guideUsageCount > 0 && hasUsedBoost) {
      infoY -= 25;
  }

  if (guideUsageCount > 0) {
      ctx.fillStyle = '#ff4d4d';
      ctx.font = '600 14px "Segoe UI", sans-serif';
      
      const totalCells = numRows * numCols;
      const percent = Math.min(100, Math.round((guideUsageCount / totalCells) * 100));
      const guideText = t('win.usedGuide', { count: guideUsageCount, percent });
      
      ctx.fillText(`⚠️ ${guideText}`, padding, infoY);
      if (hasUsedBoost) infoY += 25;
  }

  if (hasUsedBoost) {
      ctx.fillStyle = '#ffd700';
      ctx.font = '600 14px "Segoe UI", sans-serif';
      const boostText = t('win.boosted');
      ctx.fillText(`⚡ ${boostText}`, padding, infoY);
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '500 14px "Segoe UI", sans-serif';
  ctx.fillText(appUrl, padding, height - padding + 6);
  return canvas;
}

export function buildShareSVG(data, t, formattedTime) {
  const { grid, size, rows, cols, currentDensity, guideUsageCount, hasUsedBoost } = data;
  if (!grid || !grid.length) return null;
  
  // Backward compatibility
  const numRows = rows || size;
  const numCols = cols || size;
  
  const appUrl = typeof __APP_HOMEPAGE__ !== 'undefined' ? __APP_HOMEPAGE__ : '';
  const maxBoard = 640;
  const maxDim = Math.max(numRows, numCols);
  const cellSize = Math.max(8, Math.floor(maxBoard / maxDim));
  
  const boardWidth = cellSize * numCols;
  const boardHeight = cellSize * numRows;
  
  const padding = 28;
  const headerHeight = 64;
  const footerHeight = 28;
  const infoHeight = (guideUsageCount > 0 && hasUsedBoost) ? 65 : 40;
  const width = boardWidth + padding * 2;
  const height = boardHeight + padding * 2 + headerHeight + footerHeight + infoHeight;

  // Colors
  const bgGradientStart = '#1b2a4a';
  const bgGradientEnd = '#0a1324';
  const overlayColor = 'rgba(0, 0, 0, 0.35)';
  const textColor = '#e8fbff';
  const gridColor = 'rgba(255, 255, 255, 0.06)';
  const gridLineColor = 'rgba(255, 255, 255, 0.12)';
  const filledColor = '#00f2fe';
  const crossColor = 'rgba(255, 255, 255, 0.5)';
  const urlColor = 'rgba(255, 255, 255, 0.75)';

  // Difficulty Logic
  const densityPercent = Math.round(currentDensity * 100);
  const { level: difficultyKey } = calculateDifficulty(currentDensity, maxDim);
  
  let diffColor = '#33ff33';
  if (difficultyKey === 'extreme') diffColor = '#ff3333';
  else if (difficultyKey === 'hardest') diffColor = '#ff9933';
  else if (difficultyKey === 'harder') diffColor = '#ffff33';
  const difficultyText = t(`difficulty.${difficultyKey}`);
  const diffLabel = `${t('win.difficulty')} ${difficultyText} (${densityPercent}%)`;

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;
  
  // Background
  svgContent += `
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradientStart}"/>
        <stop offset="100%" stop-color="${bgGradientEnd}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
  `;

  // Text: Title & Time
  svgContent += `
    <text x="${padding}" y="${padding + 28}" font-family="Segoe UI, sans-serif" font-weight="700" font-size="26" fill="${textColor}">${t('app.title')}</text>
    <text x="${padding}" y="${padding + 56}" font-family="Segoe UI, sans-serif" font-weight="600" font-size="16" fill="${textColor}">${t('win.time')} ${formattedTime}</text>
  `;

  // Text: Difficulty (Right Aligned - manual approx or end anchor)
  svgContent += `
    <text x="${width - padding}" y="${padding + 56}" font-family="Segoe UI, sans-serif" font-weight="600" font-size="14" fill="${diffColor}" text-anchor="end">${diffLabel}</text>
  `;

  const gridX = padding;
  const gridY = padding + headerHeight;

  // Grid Background
  svgContent += `<rect x="${gridX}" y="${gridY}" width="${boardWidth}" height="${boardHeight}" fill="${gridColor}"/>`;

  // Grid Lines
  let gridLines = '';
  // Vertical
  for (let i = 0; i <= numCols; i++) {
    const pos = i * cellSize;
    gridLines += `<line x1="${gridX + pos}" y1="${gridY}" x2="${gridX + pos}" y2="${gridY + boardHeight}" stroke="${gridLineColor}" stroke-width="1"/>`;
  }
  // Horizontal
  for (let i = 0; i <= numRows; i++) {
    const pos = i * cellSize;
    gridLines += `<line x1="${gridX}" y1="${gridY + pos}" x2="${gridX + boardWidth}" y2="${gridY + pos}" stroke="${gridLineColor}" stroke-width="1"/>`;
  }
  svgContent += gridLines;

  // Cells
  let cells = '';
  const lineWidth = Math.max(1.5, Math.floor(cellSize * 0.12));
  
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const state = grid[r]?.[c];
      const cx = gridX + c * cellSize;
      const cy = gridY + r * cellSize;
      
      if (state === 1) { // Filled
        cells += `<rect x="${cx + 1}" y="${cy + 1}" width="${cellSize - 2}" height="${cellSize - 2}" fill="${filledColor}"/>`;
      } else if (state === 2) { // Cross
        const d = cellSize * 0.6;
        const off = cellSize * 0.2;
        const x1 = (cx + off).toFixed(1);
        const y1 = (cy + off).toFixed(1);
        const x2 = (cx + off + d).toFixed(1);
        const y2 = (cy + off + d).toFixed(1);
        cells += `
          <path d="M${x1} ${y1} L${x2} ${y2} M${x2} ${y1} L${x1} ${y2}" 
          stroke="${crossColor}" stroke-width="${lineWidth}" stroke-linecap="round"/>
        `;
      }
    }
  }
  svgContent += cells;

  // Guide Usage & Boost Info
  let infoY = height - padding - footerHeight + 10;
  if (guideUsageCount > 0 && hasUsedBoost) {
      infoY -= 25;
  }

  if (guideUsageCount > 0) {
      const totalCells = numRows * numCols;
      const percent = Math.min(100, Math.round((guideUsageCount / totalCells) * 100));
      const guideText = t('win.usedGuide', { count: guideUsageCount, percent });
      svgContent += `<text x="${padding}" y="${infoY}" font-family="Segoe UI, sans-serif" font-weight="600" font-size="14" fill="#ff4d4d">⚠️ ${guideText}</text>`;
      if (hasUsedBoost) infoY += 25;
  }

  if (hasUsedBoost) {
      const boostText = t('win.boosted');
      svgContent += `<text x="${padding}" y="${infoY}" font-family="Segoe UI, sans-serif" font-weight="600" font-size="14" fill="#ffd700">⚡ ${boostText}</text>`;
  }

  // URL
  svgContent += `
    <a href="${appUrl}" target="_blank">
      <text x="${padding}" y="${height - padding + 6}" font-family="Segoe UI, sans-serif" font-weight="500" font-size="14" fill="${urlColor}" style="text-decoration: underline; cursor: pointer;">${appUrl}</text>
    </a>
  `;

  svgContent += '</svg>';
  return svgContent;
}

export const canvasToBlob = (canvas) => new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));

export const createShareBlob = async (data, t, formattedTime) => {
  const canvas = buildShareCanvas(data, t, formattedTime);
  if (!canvas) return null;
  return canvasToBlob(canvas);
};

export const downloadShareSVG = (data, t, formattedTime) => {
  const svgString = buildShareSVG(data, t, formattedTime);
  if (!svgString) return;
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  // Use cols x rows if available, else size x size
  const dims = (data.cols && data.rows) ? `${data.cols}x${data.rows}` : `${data.size}x${data.size}`;
  link.download = `nonogram-${dims}.svg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const downloadShareImage = async (data, t, formattedTime) => {
  const blob = await createShareBlob(data, t, formattedTime);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dims = (data.cols && data.rows) ? `${data.cols}x${data.rows}` : `${data.size}x${data.size}`;
  link.download = `nonogram-${dims}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const buildShareUrl = (target, text, url) => {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  if (target === 'x') {
    return `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  }
  if (target === 'facebook') {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
  }
  if (target === 'whatsapp') {
    return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  }
  return '';
};
