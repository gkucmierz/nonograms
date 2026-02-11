
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/composables/useI18n.js');
let content = fs.readFileSync(filePath, 'utf8');

const newKeys = {
    'custom.simulationHelp': 'How is this calculated?',
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

// Regex to match the end of a language block
// Matches "  }," or "  }" at the start of a line
const blockEndRegex = /^(\s{2})\},?$/gm;

let newContent = content.replace(blockEndRegex, (match, indent, offset) => {
    // Determine which language we are closing
    const precedingText = content.substring(0, offset);
    const langMatch = precedingText.match(/^\s{2}(\w+([-]\w+)?): \{/gm);
    
    if (!langMatch) return match;
    const currentLangLine = langMatch[langMatch.length - 1];
    const currentLang = currentLangLine.match(/^\s{2}(\w+([-]\w+)?): \{/)[1];

    // Skip pl and en as they are already updated
    if (currentLang === 'pl' || currentLang === 'en') {
        return match;
    }

    // Check if the previous line has a comma
    // We need to look at the lines before the match
    // This is tricky with replace callback. 
    // Easier strategy: Just insert the keys. 
    // If the file is well formatted, the last item might or might not have a comma.
    // But we can ensure *our* inserted block starts with a comma if needed? 
    // No, standard JS objects need comma after previous item.
    
    // Let's assume we simply inject before the closing brace.
    // We'll add a comma to the previous line if it doesn't have one?
    // That's hard with regex replace on the closing brace only.
    
    // Alternative: Split by lines and process.
    return match; // Placeholder, we will process by lines below.
});

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
            
            // Remove trailing comma from last inserted item if we want strictly JSON-like (but JS allows it)
            // It's fine to leave it.
        }
        currentLang = null;
    }
    
    processedLines.push(line);
}

const finalContent = processedLines.join('\n');
fs.writeFileSync(filePath, finalContent);
console.log('Successfully added simulation translations to all languages.');
