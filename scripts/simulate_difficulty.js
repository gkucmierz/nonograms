import { generateRandomGrid, calculateHints } from '../src/utils/puzzleUtils.js';
import { solvePuzzle } from '../src/utils/solver.js';

const SIZES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80];
const DENSITIES = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
const SAMPLES_SMALL = 100; // For size <= 25
const SAMPLES_LARGE = 30;  // For size > 25

const results = {};

console.log('Starting Monte Carlo Simulation...');

const startTime = Date.now();

for (const size of SIZES) {
    const samples = size <= 25 ? SAMPLES_SMALL : SAMPLES_LARGE;
    const rowData = [];
    
    for (const density of DENSITIES) {
        let totalSolved = 0;
        
        for (let i = 0; i < samples; i++) {
            const grid = generateRandomGrid(size, density);
            const { rowHints, colHints } = calculateHints(grid);
            const { percentSolved } = solvePuzzle(rowHints, colHints);
            totalSolved += percentSolved;
        }
        
        const avg = Math.round(totalSolved / samples);
        rowData.push(avg);
    }
    results[size] = rowData;
    console.log(`  Size ${size}: [${rowData.join(', ')}]`);
}

const duration = (Date.now() - startTime) / 1000;
console.log(`\nSimulation Complete in ${duration.toFixed(2)}s. Result JSON:`);
console.log(JSON.stringify(results, null, 4));
