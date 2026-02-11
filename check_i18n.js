
const fs = require('fs');

const fileContent = fs.readFileSync('src/composables/useI18n.js', 'utf8');

// Extract the messages object
const match = fileContent.match(/const messages = ({[\s\S]*?});/);
if (!match) {
  console.error('Could not find messages object');
  process.exit(1);
}

// We need to make the string valid JS to eval it.
// It seems the content inside `const messages = { ... };` is valid JS object notation.
// But we need to be careful about imports or other things if we were to `eval` the whole file.
// We'll just `eval` the object part.

const messagesStr = match[1];
const messages = eval(`(${messagesStr})`);

const enKeys = Object.keys(messages.en);
const languages = Object.keys(messages);

const missing = {};

languages.forEach(lang => {
  if (lang === 'en') return;
  
  const langKeys = Object.keys(messages[lang]);
  const missingKeys = enKeys.filter(k => !langKeys.includes(k));
  
  if (missingKeys.length > 0) {
    missing[lang] = missingKeys;
  }
});

console.log(JSON.stringify(missing, null, 2));
