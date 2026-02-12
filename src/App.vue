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
import SimulationView from './components/SimulationView.vue';
import FixedBar from './components/FixedBar.vue';
import ReloadPrompt from './components/ReloadPrompt.vue';

// Main App Entry
const store = usePuzzleStore();
const { t, locale, setLocale, locales } = useI18n();
const showCustomModal = ref(false);
const showSimulation = ref(false);
const showGuide = ref(false);
const deferredPrompt = ref(null);
const canInstall = ref(false);
const installDismissed = ref(false);
const isCoarsePointer = ref(false);
const isStandalone = ref(false);
const isIos = ref(false);
const themePreference = ref('system');
const appVersion = __APP_VERSION__;
let displayModeMedia = null;
let prefersColorSchemeMedia = null;

const onKeyDownGlobal = (e) => {
  if (e.key !== 'Escape') return;
  if (showSimulation.value) {
    showSimulation.value = false;
    return;
  }
  if (showCustomModal.value) {
    showCustomModal.value = false;
    return;
  }
  if (store.isGameWon) {
    store.closeWinModal();
  }
};

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
    const ua = navigator.userAgent.toLowerCase();
    isIos.value = /ipad|iphone|ipod/.test(ua) || (ua.includes('mac') && navigator.maxTouchPoints > 1);
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
    window.addEventListener('keydown', onKeyDownGlobal);
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
  window.removeEventListener('keydown', onKeyDownGlobal);
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

    <div v-if="(canInstall || (isIos && !isStandalone)) && !installDismissed" class="install-banner">
      <div class="install-content">
        <img src="/pwa-192x192.png" alt="App Icon" class="install-icon" />
        <div class="install-text">
          <div class="install-title">{{ t('app.title') }}</div>
          <div class="install-desc">
            <span v-if="isIos && !isStandalone">{{ t('pwa.installIos') }}</span>
            <span v-else>{{ t('pwa.installTitle') }}</span>
          </div>
        </div>
      </div>
      <div class="install-actions">
        <button v-if="!isIos" class="btn-neon secondary install-btn" @click="handleInstall">
          {{ installLabel }}
        </button>
        <button class="install-close" @click="installDismissed = true" aria-label="Close">
          ✕
        </button>
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
      <CustomGameModal v-if="showCustomModal" @close="showCustomModal = false" @open-simulation="showSimulation = true" />
      <SimulationView v-if="showSimulation" @close="showSimulation = false" />
      <ReloadPrompt />
    </Teleport>
  </main>
</template>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 20px;
  width: 100%;
  padding-bottom: 50px;
  padding-top: 100px; /* Space for fixed NavBar */
}

.install-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: var(--panel-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--neon-cyan);
  box-shadow: 0 -4px 30px rgba(0, 242, 254, 0.15);
  padding: 16px 20px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 2000;
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@media (min-width: 768px) {
  .install-banner {
    width: 400px;
    bottom: 24px;
    right: 24px;
    left: auto;
    border-radius: 12px;
    border: 1px solid var(--neon-cyan);
    padding-bottom: 16px;
  }
}

.install-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.install-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.install-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.install-title {
  font-weight: bold;
  color: var(--neon-cyan);
  font-size: 1.1rem;
}

.install-desc {
  font-size: 0.9rem;
  color: var(--text-color);
  line-height: 1.3;
}

.install-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.install-btn {
  flex: 1;
  padding: 10px;
  font-size: 0.95rem;
  justify-content: center;
}

.install-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.install-close:hover {
  background: rgba(255,255,255,0.1);
  color: var(--text-color);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.game-layout {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 20px;
  width: 100%;
  padding: 0 20px;
}

/* Center children (except board section which handles itself) */
.game-layout > *:not(.board-section) {
    margin-left: auto;
    margin-right: auto;
    max-width: 1200px; /* Keep constraint for panels */
    width: 100%;
    position: sticky;
    left: 0;
    right: 0;
}

.board-section {
  display: block;
  width: 100%;
  overflow-x: visible;
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
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;
  padding: 10px;
  font-size: 0.8rem;
  color: var(--text-muted);
  opacity: 0.8;
  background: var(--panel-bg);
  backdrop-filter: blur(5px);
  border-top: 1px solid var(--panel-border);
  z-index: 90;
}
</style>
