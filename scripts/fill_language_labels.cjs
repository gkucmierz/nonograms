const fs = require('fs');
const path = 'src/composables/useI18n.js';
let content = fs.readFileSync(path, 'utf8');

const messagesMatch = content.match(/const messages = ({[\s\S]*?});/);
if (!messagesMatch) {
  console.error('Could not find messages object');
  process.exit(1);
}

const messages = eval(`(${messagesMatch[1]})`);
const en = messages.en || {};
const allLangKeys = Object.keys(en).filter((k) => k.startsWith('language.'));

function injectMissingLanguageLabels(localeCode) {
  const blockStartRegex = new RegExp(`\\s{2}['\"]?${localeCode}['\"]?\\s*:\\s*\\{`);
  const startIndex = content.search(blockStartRegex);
  if (startIndex === -1) return;
  const braceStart = content.indexOf('{', startIndex);
  let i = braceStart + 1;
  let depth = 1;
  while (i < content.length && depth > 0) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') depth--;
    i++;
  }
  const block = content.slice(braceStart + 1, i - 1);
  let updated = block;
  let addedAny = false;
  allLangKeys.forEach((key) => {
    const keyRegex = new RegExp(`(['\"])${key}\\1\\s*:\\s*(['\"]).*?\\2`);
    if (!keyRegex.test(updated)) {
      const value = en[key];
      updated = updated.trim().endsWith(',') ? updated + `\n    '${key}': '${value}'` : updated + `,\n    '${key}': '${value}'`;
      addedAny = true;
    }
  });
  if (addedAny) {
    content = content.slice(0, braceStart + 1) + updated + content.slice(i - 1);
  }
}

Object.keys(messages).forEach((locale) => {
  if (locale === 'en') return;
  injectMissingLanguageLabels(locale);
});

fs.writeFileSync(path, content);
console.log('Filled missing language.* labels for all locales.');
