
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Parse useI18n.js to get keys
const i18nPath = path.join(__dirname, 'src/composables/useI18n.js');
const i18nContent = fs.readFileSync(i18nPath, 'utf8');

function extractKeys(lang) {
    // Find start of lang block: "  en: {"
    const startRegex = new RegExp(`\\s+${lang}:\\s*\\{`);
    const startMatch = i18nContent.match(startRegex);
    if (!startMatch) return new Set();

    const startIndex = startMatch.index + startMatch[0].length;
    let braceCount = 1;
    let inString = false;
    let stringChar = '';
    let endIndex = -1;

    for (let i = startIndex; i < i18nContent.length; i++) {
        const char = i18nContent[i];
        
        if (inString) {
            if (char === stringChar && i18nContent[i-1] !== '\\') {
                inString = false;
            }
        } else {
            if (char === "'" || char === '"' || char === '`') {
                inString = true;
                stringChar = char;
            } else if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                    endIndex = i;
                    break;
                }
            }
        }
    }

    if (endIndex === -1) return new Set();

    const block = i18nContent.substring(startIndex, endIndex);
    const keys = new Set();
    const keyRegex = /['"]([\w.-]+)['"]\s*:/g;
    let match;
    while ((match = keyRegex.exec(block)) !== null) {
        keys.add(match[1]);
    }
    return keys;
}

const enKeys = extractKeys('en');
console.log(`Found ${enKeys.size} keys in en block.`);

if (enKeys.has('image.title')) {
    console.log("'image.title' IS present in en block.");
} else {
    console.log("'image.title' is MISSING in en block.");
}

// 2. Scan src for usages
try {
    const grepOutput = execSync(`grep -r "t(['\\"]" src | grep -v "node_modules"`, { encoding: 'utf8' });
    
    const usedKeys = new Set();
    const usageRegex = /t\(['"]([\w.-]+)['"]/g;
    
    const lines = grepOutput.split('\n');
    for (const line of lines) {
        let m;
        while ((m = usageRegex.exec(line)) !== null) {
            usedKeys.add(m[1]);
        }
    }
    
    console.log(`Found ${usedKeys.size} used keys in src.`);
    
    // 3. Compare
    const missingKeys = [];
    for (const key of usedKeys) {
        // Skip dynamic keys or composed keys if any (heuristic)
        if (key.includes('${')) continue;

        if (!enKeys.has(key)) {
            missingKeys.push(key);
        }
    }
    
    if (missingKeys.length > 0) {
        console.log("Missing translations in en:");
        missingKeys.forEach(k => console.log(` - ${k}`));
    } else {
        console.log("No missing translations found in en.");
    }

} catch (e) {
    console.error("Error running grep:", e);
}
