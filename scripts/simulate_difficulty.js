
import fs from 'fs';
import path from 'path';
import { generateRandomGrid, calculateHints } from '../src/utils/puzzleUtils.js';
import { solvePuzzle } from '../src/utils/solver.js';

const OUTPUT_FILE = 'difficulty_simulation_results.json';
const CSV_FILE = 'difficulty_simulation_results.csv';

// Configuration
const SIZES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80]; // Steps of 5 up to 50, then 10
const DENSITIES = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
const SAMPLES_PER_POINT = 20; // Adjust based on time/accuracy needs

console.log('Starting Monte Carlo Simulation for Nonogram Difficulty...');
console.log(`Config: Sizes=${SIZES.length}, Densities=${DENSITIES.length}, Samples=${SAMPLES_PER_POINT}`);

const results = [];
const csvRows = ['size,density,avg_solved_percent,min_solved_percent,max_solved_percent,avg_time_ms'];

const startTime = Date.now();

for (const size of SIZES) {
    for (const density of DENSITIES) {
        let totalSolved = 0;
        let minSolved = 100;
        let maxSolved = 0;
        let totalTime = 0;

        process.stdout.write(`Simulating Size: ${size}x${size}, Density: ${density} ... `);

        for (let i = 0; i < SAMPLES_PER_POINT; i++) {
            const t0 = performance.now();
            
            // 1. Generate
            const grid = generateRandomGrid(size, density);
            const { rowHints, colHints } = calculateHints(grid);
            
            // 2. Solve
            const { percentSolved } = solvePuzzle(rowHints, colHints);
            
            const t1 = performance.now();
            
            totalSolved += percentSolved;
            minSolved = Math.min(minSolved, percentSolved);
            maxSolved = Math.max(maxSolved, percentSolved);
            totalTime += (t1 - t0);
        }

        const avgSolved = totalSolved / SAMPLES_PER_POINT;
        const avgTime = totalTime / SAMPLES_PER_POINT;

        results.push({
            size,
            density,
            avgSolved,
            minSolved,
            maxSolved,
            avgTime
        });

        csvRows.push(`${size},${density},${avgSolved.toFixed(2)},${minSolved.toFixed(2)},${maxSolved.toFixed(2)},${avgTime.toFixed(2)}`);
        
        console.log(`Avg Solved: ${avgSolved.toFixed(1)}%`);
    }
}

const totalDuration = (Date.now() - startTime) / 1000;
console.log(`Simulation complete in ${totalDuration.toFixed(1)}s`);

// Save results
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
fs.writeFileSync(CSV_FILE, csvRows.join('\n'));

console.log(`Results saved to ${OUTPUT_FILE} and ${CSV_FILE}`);
