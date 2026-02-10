
const fs = require('fs');

const filePath = 'src/composables/useI18n.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add key to all language objects
const lines = content.split('\n');
const newLines = [];
let insideLang = false;
let currentLang = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    const langStartMatch = line.match(/^\s{2}(['"]?[\w-]+['"]?): \{/);
    if (langStartMatch) {
        insideLang = true;
        currentLang = langStartMatch[1].replace(/['"]/g, '');
    }
    
    if (insideLang && (line.trim() === '},' || line.trim() === '}')) {
        let translation = 'GUIDE';
        if (currentLang === 'pl') translation = 'PRZEWODNIK';
        if (currentLang === 'es') translation = 'GUÍA';
        if (currentLang === 'fr') translation = 'GUIDE';
        if (currentLang === 'de') translation = 'ANLEITUNG';
        if (currentLang === 'it') translation = 'GUIDA';
        if (currentLang === 'pt' || currentLang === 'pt-br') translation = 'GUIA';
        if (currentLang === 'ru') translation = 'РУКОВОДСТВО';
        if (currentLang === 'zh') translation = '指南';
        
        // Ensure previous line has comma
        if (newLines.length > 0) {
            const lastLine = newLines[newLines.length - 1];
            if (!lastLine.trim().endsWith(',') && !lastLine.trim().endsWith('{')) {
                newLines[newLines.length - 1] = lastLine + ',';
            }
        }
        
        newLines.push(`    'nav.guide': '${translation}'`);
        insideLang = false;
        currentLang = null;
    }
    
    newLines.push(line);
}

content = newLines.join('\n');

// 2. Add to requiredKeys
// Find "const requiredKeys = ["
// We know it ends with 'nav.newGame' now.
content = content.replace(
    "'nav.newGame'",
    "'nav.newGame','nav.guide'"
);

fs.writeFileSync(filePath, content);
console.log('Updated useI18n.js with nav.guide');
