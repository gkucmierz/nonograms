const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/composables/useI18n.js');
let content = fs.readFileSync(filePath, 'utf8');

const newKeys = {
    'custom.simulationHelp': 'How is this calculated?',
    'custom.hideMap': 'Hide difficulty map',
    'custom.showMap': 'Show difficulty map',
    'simulation.title': 'Difficulty Simulation',
    'simulation.status.ready': 'Ready',
    'simulation.status.stopped': 'Stopped',
    'simulation.status.completed': 'Completed',
    'simulation.status.simulating': 'Simulating {size}x{size} @ {density}%',
    'simulation.start': 'Start Simulation',
    'simulation.stop': 'Stop',
    'simulation.table.size': 'Size',
    'simulation.table.density': 'Density',
    'simulation.table.solved': 'Solved (Logic)',
    'simulation.empty': 'Press Start to run Monte Carlo simulation'
};

const lines = content.split('\n');
const processedLines = [];
let currentLang = null;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Detect start of language block
    const startMatch = line.match(/^\s{2}(['"]?[\w-]+['"]?): \{/);
    if (startMatch) {
        currentLang = startMatch[1].replace(/['"]/g, '');
    }

    // Detect end of language block
    if (currentLang && (line.trim() === '},' || line.trim() === '}')) {
        if (currentLang !== 'pl' && currentLang !== 'en') {
            // Ensure previous line has comma
            if (processedLines.length > 0) {
                let lastLine = processedLines[processedLines.length - 1];
                if (!lastLine.trim().endsWith(',') && !lastLine.trim().endsWith('{')) {
                    processedLines[processedLines.length - 1] = lastLine + ',';
                }
            }

            // Append new keys
            Object.entries(newKeys).forEach(([key, value]) => {
                processedLines.push(`    '${key}': '${value}',`);
            });
        }
        currentLang = null;
    }
    
    processedLines.push(line);
}

const finalContent = processedLines.join('\n');
fs.writeFileSync(filePath, finalContent);
console.log('Successfully added simulation translations to all languages.');
