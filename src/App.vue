<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { usePuzzleStore } from './stores/puzzle';
import { useI18n } from './composables/useI18n';
import GameBoard from './components/GameBoard.vue';
import LevelSelector from './components/LevelSelector.vue';
import StatusPanel from './components/StatusPanel.vue';
import GameActions from './components/GameActions.vue';
import GuidePanel from './components/GuidePanel.vue';
import WinModal from './components/WinModal.vue';
import CustomGameModal from './components/CustomGameModal.vue';
import FixedBar from './components/FixedBar.vue';

// Main App Entry
const store = usePuzzleStore();
const { t, locale, setLocale, locales } = useI18n();
const showCustomModal = ref(false);
const showGuide = ref(false);
const deferredPrompt = ref(null);
const canInstall = ref(false);
const installDismissed = ref(false);
const isCoarsePointer = ref(false);
const isStandalone = ref(false);
const themePreference = ref('system');
const isLangOpen = ref(false);
const langMenuRef = ref(null);
let displayModeMedia = null;
let prefersColorSchemeMedia = null;
const languageFlags = {
  en: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#b22234"/><rect y="2" width="24" height="2" fill="#fff"/><rect y="6" width="24" height="2" fill="#fff"/><rect y="10" width="24" height="2" fill="#fff"/><rect y="14" width="24" height="2" fill="#fff"/><rect width="10" height="8" fill="#3c3b6e"/></svg>',
  zh: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#de2910"/><circle cx="6" cy="5" r="2" fill="#ffde00"/></svg>',
  hi: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#ffffff"/><rect width="24" height="5.33" fill="#ff9933"/><rect y="10.67" width="24" height="5.33" fill="#128807"/><circle cx="12" cy="8" r="2" fill="#000080"/></svg>',
  es: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#aa151b"/><rect y="4" width="24" height="8" fill="#f1bf00"/></svg>',
  fr: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="8" height="16" fill="#0055a4"/><rect x="8" width="8" height="16" fill="#ffffff"/><rect x="16" width="8" height="16" fill="#ef4135"/></svg>',
  ar: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#006c35"/><rect y="11" width="24" height="3" fill="#ffffff"/></svg>',
  bn: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#006a4e"/><circle cx="11" cy="8" r="4" fill="#f42a41"/></svg>',
  ru: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#ffffff"/><rect y="5.33" width="24" height="5.33" fill="#0039a6"/><rect y="10.67" width="24" height="5.33" fill="#d52b1e"/></svg>',
  pt: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="9" height="16" fill="#006600"/><rect x="9" width="15" height="16" fill="#ff0000"/><circle cx="9.5" cy="8" r="2.5" fill="#ffcc00"/></svg>',
  ur: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#01411c"/><rect width="6" height="16" fill="#ffffff"/><circle cx="15" cy="8" r="3" fill="#ffffff"/></svg>',
  pl: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#ffffff"/><rect y="8" width="24" height="8" fill="#dc143c"/></svg>',
  de: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="5.33" fill="#000"/><rect y="5.33" width="24" height="5.33" fill="#dd0000"/><rect y="10.67" width="24" height="5.33" fill="#ffce00"/></svg>',
  it: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="8" height="16" fill="#009246"/><rect x="8" width="8" height="16" fill="#ffffff"/><rect x="16" width="8" height="16" fill="#ce2b37"/></svg>',
  nl: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="5.33" fill="#ae1c28"/><rect y="5.33" width="24" height="5.33" fill="#fff"/><rect y="10.67" width="24" height="5.33" fill="#21468b"/></svg>',
  sv: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#006aa7"/><rect x="6" width="3" height="16" fill="#fecc00"/><rect y="7" width="24" height="3" fill="#fecc00"/></svg>',
  da: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#c8102e"/><rect x="6" width="2" height="16" fill="#fff"/><rect y="7" width="24" height="2" fill="#fff"/></svg>',
  fi: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#fff"/><rect x="6" width="3" height="16" fill="#003580"/><rect y="7" width="24" height="3" fill="#003580"/></svg>',
  no: '<svg viewBox=\"0 0 24 16\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"24\" height=\"16\" fill=\"#ba0c2f\"/><rect x=\"6\" width=\"2\" height=\"16\" fill=\"#fff\"/><rect y=\"7\" width=\"24\" height=\"2\" fill=\"#fff\"/><rect x=\"7\" width=\"1\" height=\"16\" fill=\"#00205b\"/><rect y=\"8\" width=\"24\" height=\"1\" fill=\"#00205b\"/></svg>',
  cs: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="5.33" fill="#fff"/><rect y="5.33" width="24" height="5.33" fill="#11457e"/><rect y="10.67" width="24" height="5.33" fill="#d7141a"/></svg>',
  sk: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="5.33" fill="#fff"/><rect y="5.33" width="24" height="5.33" fill="#0b4ea2"/><rect y="10.67" width="24" height="5.33" fill="#ee1c25"/></svg>',
  hu: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="5.33" fill="#cd2a3e"/><rect y="5.33" width="24" height="5.33" fill="#fff"/><rect y="10.67" width="24" height="5.33" fill="#436f4d"/></svg>',
  ro: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="8" height="16" fill="#002b7f"/><rect x="8" width="8" height="16" fill="#fcd116"/><rect x="16" width="8" height="16" fill="#ce1126"/></svg>',
  bg: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="5.33" fill="#fff"/><rect y="5.33" width="24" height="5.33" fill="#00966e"/><rect y="10.67" width="24" height="5.33" fill="#d62612"/></svg>',
  el: '<svg viewBox=\"0 0 24 16\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"24\" height=\"16\" fill=\"#0d5eaf\"/><rect y=\"2\" width=\"24\" height=\"2\" fill=\"#fff\"/><rect y=\"6\" width=\"24\" height=\"2\" fill=\"#fff\"/><rect y=\"10\" width=\"24\" height=\"2\" fill=\"#fff\"/><rect y=\"14\" width=\"24\" height=\"2\" fill=\"#fff\"/></svg>',
  uk: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="8" fill="#0057b8"/><rect y="8" width="24" height="8" fill="#ffd700"/></svg>',
  be: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="8" height="16" fill="#000"/><rect x="8" width="8" height="16" fill="#fecc00"/><rect x="16" width="8" height="16" fill="#ed1c24"/></svg>',
  sr: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="5.33" fill="#ed1c24"/><rect y="5.33" width="24" height="5.33" fill="#0b4ea2"/><rect y="10.67" width="24" height="5.33" fill="#fff"/></svg>',
  hr: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="5.33" fill="#ff0000"/><rect y="5.33" width="24" height="5.33" fill="#fff"/><rect y="10.67" width="24" height="5.33" fill="#0000ff"/></svg>',
  sl: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="5.33" fill="#fff"/><rect y="5.33" width="24" height="5.33" fill="#0038a8"/><rect y="10.67" width="24" height="5.33" fill="#d40000"/></svg>',
  lt: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="5.33" fill="#ffb81c"/><rect y="5.33" width="24" height="5.33" fill="#006a44"/><rect y="10.67" width="24" height="5.33" fill="#c1272d"/></svg>',
  lv: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="6" fill="#8b1a1a"/><rect y="6" width="24" height="4" fill="#fff"/><rect y="10" width="24" height="6" fill="#8b1a1a"/></svg>',
  et: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="5.33" fill="#0072ce"/><rect y="5.33" width="24" height="5.33" fill="#000"/><rect y="10.67" width="24" height="5.33" fill="#fff"/></svg>',
  ga: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="8" height="16" fill="#169b62"/><rect x="8" width="8" height="16" fill="#fff"/><rect x="16" width="8" height="16" fill="#ff883e"/></svg>',
  is: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#003897"/><rect x="6" width="2" height="16" fill="#fff"/><rect y="7" width="24" height="2" fill="#fff"/><rect x="7" width="1" height="16" fill="#d72828"/><rect y="8" width="24" height="1" fill="#d72828"/></svg>',
  mt: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="12" height="16" fill="#fff"/><rect x="12" width="12" height="16" fill="#cf142b"/></svg>',
  sq: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#e41e20"/></svg>',
  mk: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#d20000"/><circle cx="12" cy="8" r="3" fill="#ffe600"/></svg>',
  bs: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#002f6c"/><rect y="10" width="24" height="6" fill="#fcd116"/></svg>',
  tr: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#e30a17"/></svg>',
  ca: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="2" fill="#f1c40f"/><rect y="2" width="24" height="2" fill="#e74c3c"/><rect y="4" width="24" height="2" fill="#f1c40f"/><rect y="6" width="24" height="2" fill="#e74c3c"/><rect y="8" width="24" height="2" fill="#f1c40f"/><rect y="10" width="24" height="2" fill="#e74c3c"/><rect y="12" width="24" height="2" fill="#f1c40f"/><rect y="14" width="24" height="2" fill="#e74c3c"/></svg>',
  gl: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#ffffff"/><rect y="6" width="24" height="4" fill="#00a3e8"/></svg>',
  cy: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="8" fill="#ffffff"/><rect y="8" width="24" height="8" fill="#007a3d"/></svg>',
  gd: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#0065bd"/></svg>',
  eu: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#d52b1e"/><rect y="7" width="24" height="2" fill="#fff"/><rect x="11" width="2" height="16" fill="#fff"/><rect x="11" width="2" height="16" fill="#2e8b57"/></svg>'
};

const languages = computed(() => {
  return locales.value
    .map((code) => ({ code, label: t(`language.${code}`) }))
    .sort((a, b) => a.label.localeCompare(b.label, locale.value));
});

const searchTerm = ref('');
const filteredLanguages = computed(() => {
  const q = searchTerm.value.trim().toLowerCase();
  if (!q) return languages.value;
  return languages.value.filter((l) => l.label.toLowerCase().includes(q) || l.code.includes(q));
});

const installLabel = computed(() => {
  return isCoarsePointer.value ? t('pwa.installMobile') : t('pwa.installDesktop');
});

const updateStandalone = () => {
  isStandalone.value = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone.value) {
    canInstall.value = false;
    installDismissed.value = true;
  }
};

const handleBeforeInstallPrompt = (e) => {
  e.preventDefault();
  deferredPrompt.value = e;
  if (!isStandalone.value) {
    canInstall.value = true;
  }
};

const handleAppInstalled = () => {
  deferredPrompt.value = null;
  canInstall.value = false;
  installDismissed.value = true;
};

const handleInstall = async () => {
  if (!deferredPrompt.value) return;
  deferredPrompt.value.prompt();
  const choice = await deferredPrompt.value.userChoice;
  deferredPrompt.value = null;
  canInstall.value = false;
  if (!choice || choice.outcome !== 'accepted') {
    installDismissed.value = true;
  }
};

const resolveSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = () => {
  const nextTheme = themePreference.value === 'system' ? resolveSystemTheme() : themePreference.value;
  document.documentElement.dataset.theme = nextTheme;
};

const setThemePreference = (value) => {
  themePreference.value = value;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('theme', value);
  }
  applyTheme();
};

const handleSystemThemeChange = () => {
  if (themePreference.value === 'system') {
    applyTheme();
  }
};

const selectLanguage = (value) => {
  setLocale(value);
  isLangOpen.value = false;
};

const handleOutsideClick = (event) => {
  if (!langMenuRef.value) return;
  if (!langMenuRef.value.contains(event.target)) {
    isLangOpen.value = false;
  }
};

onMounted(() => {
  if (!store.loadState()) {
    store.initGame(); // Inicjalizacja domyślnej gry jeśli brak zapisu
  }
  if (typeof window !== 'undefined') {
    isCoarsePointer.value = window.matchMedia('(pointer: coarse)').matches;
    const storedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
    if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
      themePreference.value = storedTheme;
    }
    applyTheme();
    prefersColorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    if (prefersColorSchemeMedia?.addEventListener) {
      prefersColorSchemeMedia.addEventListener('change', handleSystemThemeChange);
    } else if (prefersColorSchemeMedia?.addListener) {
      prefersColorSchemeMedia.addListener(handleSystemThemeChange);
    }
    updateStandalone();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    displayModeMedia = window.matchMedia('(display-mode: standalone)');
    if (displayModeMedia?.addEventListener) {
      displayModeMedia.addEventListener('change', updateStandalone);
    } else if (displayModeMedia?.addListener) {
      displayModeMedia.addListener(updateStandalone);
    }
    document.addEventListener('click', handleOutsideClick);
  }
});

onUnmounted(() => {
  if (typeof window === 'undefined') return;
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.removeEventListener('appinstalled', handleAppInstalled);
  if (prefersColorSchemeMedia?.removeEventListener) {
    prefersColorSchemeMedia.removeEventListener('change', handleSystemThemeChange);
  } else if (prefersColorSchemeMedia?.removeListener) {
    prefersColorSchemeMedia.removeListener(handleSystemThemeChange);
  }
  if (displayModeMedia?.removeEventListener) {
    displayModeMedia.removeEventListener('change', updateStandalone);
  } else if (displayModeMedia?.removeListener) {
    displayModeMedia.removeListener(updateStandalone);
  }
  document.removeEventListener('click', handleOutsideClick);
});
</script>

<template>
  <main class="game-container">
    <FixedBar />

    <header class="game-header">
      <h1>{{ t('app.title') }}</h1>
      <div class="header-toggles">
        <div class="lang-dropdown" ref="langMenuRef">
          <button
            class="lang-trigger"
            type="button"
            :aria-label="t('language.label')"
            :aria-expanded="isLangOpen"
            @click="isLangOpen = !isLangOpen"
          >
            <span class="lang-flag" v-html="languageFlags[locale]"></span>
          </button>
          <div v-if="isLangOpen" class="lang-menu">
            <div class="lang-search">
              <input
                class="lang-search-input"
                type="text"
                :placeholder="t('language.searchPlaceholder')"
                :aria-label="t('language.searchLabel')"
                v-model="searchTerm"
              />
            </div>
            <button
              v-for="lang in filteredLanguages"
              :key="lang.code"
              class="lang-option"
              :class="{ active: locale === lang.code }"
              type="button"
              @click="selectLanguage(lang.code)"
            >
              <span class="lang-flag" v-html="languageFlags[lang.code]"></span>
              <span class="lang-name">{{ lang.label }}</span>
            </button>
          </div>
        </div>
        <div class="theme-toggle">
          <span class="theme-label">{{ t('theme.label') }}</span>
          <button class="theme-btn" :class="{ active: themePreference === 'system' }" @click="setThemePreference('system')">
            {{ t('theme.system') }}
          </button>
          <button class="theme-btn" :class="{ active: themePreference === 'light' }" @click="setThemePreference('light')">
            {{ t('theme.light') }}
          </button>
          <button class="theme-btn" :class="{ active: themePreference === 'dark' }" @click="setThemePreference('dark')">
            {{ t('theme.dark') }}
          </button>
        </div>
      </div>
      <div class="underline"></div>
    </header>

    <div v-if="canInstall && !installDismissed" class="install-banner">
      <div class="install-text">{{ t('pwa.installTitle') }}</div>
      <div class="install-actions">
        <button class="btn-neon secondary install-btn" @click="handleInstall">
          {{ installLabel }}
        </button>
        <button class="install-close" @click="installDismissed = true">×</button>
      </div>
    </div>

    <div class="game-layout">
      <!-- Level Selection -->
      <LevelSelector 
        @open-custom="showCustomModal = true" 
        @toggle-guide="showGuide = !showGuide"
      />

      <!-- Guide Panel (Conditional) -->
      <transition name="fade">
          <GuidePanel v-if="showGuide" />
      </transition>

      <!-- Status Panel (Time, Moves, Progress) -->
      <StatusPanel />

      <!-- Game Actions (Reset, Random, Undo, Check) -->
      <GameActions />

      <!-- Game Board -->
      <section class="board-section">
        <GameBoard />
      </section>
    </div>

    <!-- Modals Teleport -->
    <Teleport to="body">
      <WinModal v-if="store.isGameWon" />
      <CustomGameModal v-if="showCustomModal" @close="showCustomModal = false" />
    </Teleport>
  </main>
</template>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  padding-bottom: 50px;
}

.game-header {
  text-align: center;
  margin-bottom: 30px;
  margin-top: 40px;
}

h1 {
  font-size: 3.5rem;
  margin: 0;
  letter-spacing: 5px;
  font-weight: 300;
  color: var(--text-strong);
  text-shadow: 0 0 20px var(--title-glow);
}

.underline {
  width: 100px;
  height: 3px;
  background: var(--primary-accent);
  margin: 10px auto 0;
  box-shadow: 0 0 10px var(--primary-accent);
}

.header-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
}

.lang-dropdown {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.lang-trigger {
  background: var(--toggle-bg);
  border: 1px solid var(--toggle-border);
  box-shadow: var(--toggle-shadow);
  border-radius: 999px;
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lang-trigger:hover {
  border-color: var(--toggle-hover-border);
}

.lang-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 170px;
  background: var(--fixed-bar-bg);
  border: 1px solid var(--fixed-bar-border);
  box-shadow: var(--fixed-bar-shadow);
  border-radius: 16px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 10;
  opacity: 1;
  max-height: 70vh;
  overflow-y: auto;
}

.lang-search {
  display: flex;
  padding: 6px;
}

.lang-search-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--toggle-btn-border);
  border-radius: 10px;
  background: var(--toggle-bg);
  color: var(--text-strong);
  outline: none;
}

.lang-option {
  background: transparent;
  border: 1px solid var(--toggle-btn-border);
  color: var(--text-strong);
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.lang-option:hover {
  border-color: var(--toggle-hover-border);
}

.lang-option.active {
  border-color: var(--primary-accent);
  box-shadow: var(--toggle-active-shadow);
}

.lang-flag {
  width: 24px;
  height: 16px;
  display: inline-flex;
}

.lang-flag svg {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 2px;
}

.lang-name {
  font-weight: 500;
}

.theme-toggle {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--toggle-bg);
  border: 1px solid var(--toggle-border);
  box-shadow: var(--toggle-shadow);
}

.theme-label {
  font-size: 0.75rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.theme-btn {
  background: transparent;
  border: 1px solid var(--toggle-btn-border);
  color: var(--text-strong);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-btn.active {
  border-color: var(--primary-accent);
  box-shadow: var(--toggle-active-shadow);
}

.theme-btn:hover {
  border-color: var(--toggle-hover-border);
}

.game-layout {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 900px;
  align-items: center;
}

.install-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 16px;
  background: var(--banner-bg);
  border: 1px solid var(--banner-border);
  box-shadow: var(--banner-shadow);
  width: min(680px, 92vw);
  margin: -10px 0 20px;
}

.install-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
  letter-spacing: 0.5px;
}

.install-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.install-btn {
  padding: 8px 16px;
  font-size: 0.85rem;
}

.install-close {
  background: transparent;
  border: 1px solid var(--toggle-btn-border);
  color: var(--text-strong);
  width: 32px;
  height: 32px;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  line-height: 1;
  transition: all 0.2s ease;
}

.install-close:hover {
  border-color: var(--toggle-hover-border);
}

/* Remove old glass panel style from game-layout since we split it */
.board-section {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .game-header {
    margin-top: 20px;
    margin-bottom: 20px;
  }
  h1 {
    font-size: 2.4rem;
    letter-spacing: 3px;
  }
  .lang-menu {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    min-width: 0;
    z-index: 1005;
    max-height: none;
    padding: 16px;
    border-radius: 0;
  }
  .lang-search {
    position: sticky;
    top: 0;
    padding: 8px 0 12px 0;
    background: var(--fixed-bar-bg);
  }
  .lang-option {
    font-size: 1rem;
    padding: 10px 12px;
  }
}

@media (max-width: 420px) {
  h1 {
    font-size: 2rem;
    letter-spacing: 2px;
  }
  .lang-menu {
    width: 100vw;
  }
}
</style>
