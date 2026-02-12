
import { generateRandomGrid, calculateHints } from '../src/utils/puzzleUtils.js';
import { solvePuzzle } from '../src/utils/solver.js';
import fs from 'fs';

const SIZES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
const DENSITIES = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
const SAMPLES = 200; // High sample count for stability

console.log('Starting simulation...');
console.log(`Sizes: ${SIZES.join(', ')}`);
console.log(`Densities: ${DENSITIES.join(', ')}`);
console.log(`Samples per point: ${SAMPLES}`);

const results = {};

async function run() {
    const totalSteps = SIZES.length * DENSITIES.length;
    let currentStep = 0;
    const startTime = Date.now();

    for (const size of SIZES) {
        results[size] = [];
        for (const density of DENSITIES) {
            let totalSolved = 0;
            for (let i = 0; i < SAMPLES; i++) {
                const grid = generateRandomGrid(size, density);
                const { rowHints, colHints } = calculateHints(grid);
                const { percentSolved } = solvePuzzle(rowHints, colHints);
                totalSolved += percentSolved;
            }
            const avg = Math.round(totalSolved / SAMPLES);
            results[size].push(avg);
            
            currentStep++;
            const pct = Math.round((currentStep / totalSteps) * 100);
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
            process.stdout.write(`\rProgress: ${pct}% (${currentStep}/${totalSteps}) - Elapsed: ${elapsed}s`);
        }
    }
    
    console.log('\n\nSimulation complete!');
    console.log('SIM_DATA = ' + JSON.stringify(results, null, 4) + ';');
    fs.writeFileSync('simulation_results.json', JSON.stringify(results, null, 4));
}

run();
