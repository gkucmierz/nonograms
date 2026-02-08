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
const { t, locale, setLocale } = useI18n();
const showCustomModal = ref(false);
const showGuide = ref(false);
const deferredPrompt = ref(null);
const canInstall = ref(false);
const installDismissed = ref(false);
const isCoarsePointer = ref(false);
const isStandalone = ref(false);
const themePreference = ref('system');
let displayModeMedia = null;
let prefersColorSchemeMedia = null;

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
});
</script>

<template>
  <main class="game-container">
    <FixedBar />

    <header class="game-header">
      <h1>{{ t('app.title') }}</h1>
      <div class="header-toggles">
        <div class="lang-toggle">
          <button class="lang-btn" :class="{ active: locale === 'pl' }" @click="setLocale('pl')">PL</button>
          <button class="lang-btn" :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button>
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

.lang-toggle {
  display: inline-flex;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--toggle-bg);
  border: 1px solid var(--toggle-border);
  box-shadow: var(--toggle-shadow);
}

.lang-btn {
  background: transparent;
  border: 1px solid var(--toggle-btn-border);
  color: var(--text-strong);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lang-btn.active {
  border-color: var(--primary-accent);
  box-shadow: var(--toggle-active-shadow);
}

.lang-btn:hover {
  border-color: var(--toggle-hover-border);
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
}

@media (max-width: 420px) {
  h1 {
    font-size: 2rem;
    letter-spacing: 2px;
  }
}
</style>
