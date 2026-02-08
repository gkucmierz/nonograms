import { ref, computed } from 'vue';

const detectLocale = () => {
  if (typeof navigator === 'undefined') return 'en';
  const browserLocale = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
  const short = browserLocale.toLowerCase().split('-')[0];
  return short === 'pl' ? 'pl' : 'en';
};

const messages = {
  pl: {
    'app.title': 'Nonograms',
    'level.easy': 'ŁATWY 5X5',
    'level.medium': 'ŚREDNI 10X10',
    'level.hard': 'TRUDNY 15X15',
    'level.custom': 'WŁASNY',
    'level.guide': 'PODPOWIEDŹ ❓',
    'actions.reset': 'RESET',
    'actions.random': 'NOWA LOSOWA',
    'actions.undo': 'COFNIJ',
    'status.time': 'CZAS',
    'status.moves': 'RUCHY',
    'status.progress': 'POSTĘP',
    'fixed.time': 'Czas:',
    'fixed.progress': 'Postęp:',
    'fixed.hide': 'Ukryj',
    'fixed.show': 'Pokaż',
    'guide.play': 'START',
    'guide.pause': 'PAUZA',
    'guide.step': 'KROK',
    'guide.speed': 'SZYBKOŚĆ',
    'guide.waiting': 'Oczekiwanie...',
    'guide.solved': 'Rozwiązane!',
    'custom.title': 'GRA WŁASNA',
    'custom.prompt': 'Wprowadź rozmiar siatki (5 - 80):',
    'custom.cancel': 'Anuluj',
    'custom.start': 'Start',
    'custom.sizeError': 'Rozmiar musi być między 5 a 80!',
    'win.title': 'GRATULACJE!',
    'win.message': 'Rozwiązałeś zagadkę!',
    'win.time': 'Czas:',
    'win.playAgain': 'Zagraj Ponownie'
  },
  en: {
    'app.title': 'Nonograms',
    'level.easy': 'EASY 5X5',
    'level.medium': 'MEDIUM 10X10',
    'level.hard': 'HARD 15X15',
    'level.custom': 'CUSTOM',
    'level.guide': 'GUIDE ❓',
    'actions.reset': 'RESET',
    'actions.random': 'NEW RANDOM',
    'actions.undo': 'UNDO',
    'status.time': 'TIME',
    'status.moves': 'MOVES',
    'status.progress': 'PROGRESS',
    'fixed.time': 'Time:',
    'fixed.progress': 'Progress:',
    'fixed.hide': 'Hide',
    'fixed.show': 'Show',
    'guide.play': 'PLAY',
    'guide.pause': 'PAUSE',
    'guide.step': 'STEP',
    'guide.speed': 'SPEED',
    'guide.waiting': 'Waiting...',
    'guide.solved': 'Solved!',
    'custom.title': 'CUSTOM GAME',
    'custom.prompt': 'Enter grid size (5 - 80):',
    'custom.cancel': 'Cancel',
    'custom.start': 'Start',
    'custom.sizeError': 'Size must be between 5 and 80!',
    'win.title': 'CONGRATULATIONS!',
    'win.message': 'You solved the puzzle!',
    'win.time': 'Time:',
    'win.playAgain': 'Play Again'
  }
};

const locale = ref(detectLocale());

const format = (text, params = {}) => {
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
};

const t = (key, params) => {
  const lang = messages[locale.value] || messages.en;
  const value = lang[key] || messages.en[key] || key;
  return typeof value === 'string' ? format(value, params) : key;
};

const setLocale = (value) => {
  locale.value = messages[value] ? value : 'en';
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale.value;
    document.title = t('app.title');
  }
};

if (typeof document !== 'undefined') {
  document.documentElement.lang = locale.value;
  document.title = messages[locale.value]?.['app.title'] || 'Nonograms';
}

export function useI18n() {
  return {
    locale: computed(() => locale.value),
    t,
    setLocale
  };
}
