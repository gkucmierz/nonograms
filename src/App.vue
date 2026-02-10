<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { usePuzzleStore } from './stores/puzzle';
import { useI18n } from './composables/useI18n';
import GameBoard from './components/GameBoard.vue';
import NavBar from './components/NavBar.vue';
import StatusPanel from './components/StatusPanel.vue';
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
const appVersion = __APP_VERSION__;
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
    <NavBar 
      @open-custom="showCustomModal = true" 
      @toggle-guide="showGuide = !showGuide"
      @set-theme="setThemePreference"
    />
    <FixedBar />

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
      <!-- Guide Panel (Conditional) -->
      <transition name="fade">
          <GuidePanel v-if="showGuide" />
      </transition>

      <!-- Status Panel (Time, Moves, Progress) -->
      <StatusPanel />

      <!-- Game Board -->
      <section class="board-section">
        <GameBoard />
      </section>
    </div>

    <footer class="app-version">
      v{{ appVersion }}
    </footer>

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

.install-banner {
  background: var(--banner-bg);
  border: 1px solid var(--banner-border);
  border-radius: 8px;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 90%;
  max-width: 600px;
  margin-bottom: 20px;
  box-shadow: var(--banner-shadow);
}

.install-text {
  color: var(--text-color);
}

.install-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.install-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
}

.game-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 1200px;
  padding: 0 20px;
}

.board-section {
  display: flex;
  justify-content: center;
  width: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.app-version {
  margin-top: auto;
  padding: 10px;
  font-size: 0.8rem;
  color: var(--text-muted);
  opacity: 0.6;
}
</style>