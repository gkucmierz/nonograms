const fs = require('fs');

const fileContent = fs.readFileSync('src/composables/useI18n.js', 'utf8');

const match = fileContent.match(/const messages = ({[\s\S]*?});/);
if (!match) {
  console.error('Could not find messages object');
  process.exit(1);
}

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
