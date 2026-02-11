<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { usePuzzleStore } from '@/stores/puzzle';
import { useI18n } from '@/composables/useI18n';
import { Gamepad2, Palette, CircleHelp, Sun, Moon, Menu, X, ChevronDown, ChevronUp, Monitor } from 'lucide-vue-next';

const store = usePuzzleStore();
const { t, locale, setLocale, locales } = useI18n();

const emit = defineEmits(['open-custom', 'toggle-guide', 'set-theme']);

const isGameOpen = ref(false);
const isThemeOpen = ref(false);
const isLangOpen = ref(false);
const isMobileMenuOpen = ref(false);
const langMenuRef = ref(null);
const searchTerm = ref('');

// Map language codes to country codes for flag-icons
const langToCountry = {
  en: 'gb',
  zh: 'cn',
  'zh-hant': 'tw',
  hi: 'in',
  es: 'es',
  fr: 'fr',
  ar: 'sa',
  bn: 'bd',
  ru: 'ru',
  pt: 'pt',
  ur: 'pk',
  pl: 'pl',
  de: 'de',
  it: 'it',
  nl: 'nl',
  sv: 'se',
  da: 'dk',
  fi: 'fi',
  no: 'no',
  cs: 'cz',
  sk: 'sk',
  hu: 'hu',
  ro: 'ro',
  bg: 'bg',
  el: 'gr',
  uk: 'ua',
  be: 'by',
  sr: 'rs',
  hr: 'hr',
  sl: 'si',
  lt: 'lt',
  lv: 'lv',
  et: 'ee',
  ga: 'ie',
  is: 'is',
  mt: 'mt',
  sq: 'al',
  mk: 'mk',
  bs: 'ba',
  tr: 'tr',
  ca: 'es-ct',
  gl: 'es-ga',
  cy: 'gb-wls',
  gd: 'gb-sct',
  eu: 'es-pv',
  af: 'za',
  am: 'et',
  hy: 'am',
  az: 'az',
  my: 'mm',
  km: 'kh',
  ceb: 'ph',
  fa: 'ir',
  gu: 'in',
  ht: 'ht',
  he: 'il',
  ig: 'ng',
  ilo: 'ph',
  id: 'id',
  ja: 'jp',
  jv: 'id',
  kn: 'in',
  kk: 'kz',
  rw: 'rw',
  rn: 'bi',
  ko: 'kr',
  ku: 'tr',
  ckb: 'iq',
  ky: 'kg',
  lo: 'la',
  ms: 'my',
  mr: 'in',
  mn: 'mn',
  ne: 'np',
  om: 'et',
  ps: 'af',
  pa: 'in',
  so: 'so',
  sw: 'tz',
  tl: 'ph',
  ta: 'in',
  te: 'in',
  th: 'th',
  bo: 'cn',
  ti: 'er',
  uz: 'uz',
  vi: 'vn',
  wo: 'sn',
  yo: 'ng',
  'pt-br': 'br',
  'pt-pt': 'pt',
  'fr-ca': 'ca',
  'nl-be': 'be',
  'es-es': 'es',
  'es-419': 'mx',
  'zh-hant': 'tw',
  'zh-hans': 'cn'
};

const getFlagClass = (code) => {
  const countryCode = langToCountry[code] || code;
  return `fi fi-${countryCode}`;
};

const languages = computed(() => {
  return locales.value
    .map((code) => ({ code, label: t(`language.${code}`) }))
    .sort((a, b) => a.label.localeCompare(b.label, locale.value));
});

const filteredLanguages = computed(() => {
  const q = searchTerm.value.trim().toLowerCase();
  if (!q) return languages.value;
  return languages.value.filter((l) => l.label.toLowerCase().includes(q) || l.code.includes(q));
});

const levels = computed(() => [
  { id: 'easy', label: t('level.easy') },
  { id: 'medium', label: t('level.medium') },
  { id: 'hard', label: t('level.hard') }
]);

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const toggleGameMenu = () => {
  isGameOpen.value = !isGameOpen.value;
  if (isGameOpen.value) {
      isThemeOpen.value = false;
      isLangOpen.value = false;
  }
};

const toggleThemeMenu = () => {
  isThemeOpen.value = !isThemeOpen.value;
  if (isThemeOpen.value) {
      isGameOpen.value = false;
      isLangOpen.value = false;
  }
};

const toggleLangMenu = () => {
  isLangOpen.value = !isLangOpen.value;
  if (isLangOpen.value) {
      isGameOpen.value = false;
      isThemeOpen.value = false;
  }
};

const selectLevel = (id) => {
  store.initGame(id);
  isGameOpen.value = false;
  closeMobileMenu();
};

const openCustom = () => {
  emit('open-custom');
  isGameOpen.value = false;
  closeMobileMenu();
};

const setTheme = (theme) => {
  emit('set-theme', theme);
  isThemeOpen.value = false;
  closeMobileMenu();
};

const selectLanguage = (value) => {
  setLocale(value);
  isLangOpen.value = false;
  closeMobileMenu();
};

const toggleGuide = () => {
    emit('toggle-guide');
    closeMobileMenu();
};

// Close menus when clicking outside
const closeMenus = (e) => {
  if (isMobileMenuOpen.value) return; // Don't close desktop menus if mobile is open (handled separately)

  if (!e.target.closest('.nav-dropdown')) {
    isGameOpen.value = false;
    isThemeOpen.value = false;
    isLangOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', closeMenus);
});

onUnmounted(() => {
  document.removeEventListener('click', closeMenus);
});

// Watch mobile menu to lock body scroll
watch(isMobileMenuOpen, (val) => {
    if (val) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
});
</script>

<template>
  <nav class="navbar">
    <div class="nav-left">
      <h1 class="app-title">{{ t('app.title') }}</h1>
    </div>

    <!-- Mobile Hamburger -->
    <button class="btn-neon nav-btn icon-only mobile-only" @click="isMobileMenuOpen = true">
        <Menu :size="24" />
    </button>

    <div class="nav-container desktop-only">
      <!-- Game Menu -->
      <div class="nav-dropdown">
        <button class="btn-neon nav-btn" @click.stop="toggleGameMenu">
          <Gamepad2 :size="18" /> {{ t('nav.newGame') }}
        </button>
        <transition name="slide-fade">
          <div v-if="isGameOpen" class="dropdown-menu">
            <button 
              v-for="lvl in levels" 
              :key="lvl.id"
              class="dropdown-item"
              @click="selectLevel(lvl.id)"
            >
              {{ lvl.label }}
            </button>
            <button class="dropdown-item" @click="openCustom">
              {{ t('level.custom') }}
            </button>
          </div>
        </transition>
      </div>

      <!-- Theme Menu -->
      <div class="nav-dropdown">
        <button class="btn-neon nav-btn" @click.stop="toggleThemeMenu">
          <Palette :size="18" /> {{ t('theme.label') }}
        </button>
        <transition name="slide-fade">
          <div v-if="isThemeOpen" class="dropdown-menu theme-menu">
            <button class="dropdown-item" @click="setTheme('system')">
              <Monitor :size="16" /> {{ t('theme.system') }}
            </button>
            <button class="dropdown-item" @click="setTheme('light')">
              <Sun :size="16" /> {{ t('theme.light') }}
            </button>
            <button class="dropdown-item" @click="setTheme('dark')">
              <Moon :size="16" /> {{ t('theme.dark') }}
            </button>
          </div>
        </transition>
      </div>

      <!-- Guide Button -->
      <button class="btn-neon nav-btn" @click="toggleGuide">
        <CircleHelp :size="18" /> {{ t('nav.guide') }}
      </button>

      <!-- Language Menu -->
      <div class="nav-dropdown">
        <button class="btn-neon nav-btn icon-only flag-btn" @click.stop="toggleLangMenu">
           <span class="lang-flag-current">
              <span :class="getFlagClass(locale)"></span>
           </span>
        </button>
        <transition name="slide-fade">
          <div v-if="isLangOpen" class="dropdown-menu lang-menu-dropdown">
            <div class="lang-search">
              <input
                class="lang-search-input"
                type="text"
                :placeholder="t('language.searchPlaceholder')"
                v-model="searchTerm"
                @click.stop
              />
            </div>
            <div class="lang-list">
              <button
                v-for="lang in filteredLanguages"
                :key="lang.code"
                class="dropdown-item"
                :class="{ active: locale === lang.code }"
                @click="selectLanguage(lang.code)"
              >
                <span class="lang-flag-item">
                  <span :class="getFlagClass(lang.code)"></span>
                </span>
                <span class="lang-name">{{ lang.label }}</span>
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Mobile Menu Overlay -->
    <transition name="fade">
        <div v-if="isMobileMenuOpen" class="mobile-menu-overlay">
            <div class="mobile-menu-header">
                <h2 class="mobile-title">{{ t('app.title') }}</h2>
                <button class="btn-neon nav-btn icon-only close-btn" @click="closeMobileMenu">
                    <X :size="24" />
                </button>
            </div>
            
            <div class="mobile-menu-items">
                <!-- Mobile Game Menu -->
                <div class="mobile-group">
                    <button class="mobile-item-trigger" @click="toggleGameMenu">
                        <span class="flex-center gap-10"><Gamepad2 :size="20" /> {{ t('nav.newGame') }}</span>
                        <component :is="isGameOpen ? ChevronUp : ChevronDown" :size="16" />
                    </button>
                    <div v-if="isGameOpen" class="mobile-sub-menu">
                         <button 
                            v-for="lvl in levels" 
                            :key="lvl.id"
                            class="mobile-sub-item"
                            @click="selectLevel(lvl.id)"
                          >
                            {{ lvl.label }}
                          </button>
                          <button class="mobile-sub-item" @click="openCustom">
                            {{ t('level.custom') }}
                          </button>
                    </div>
                </div>

                <!-- Mobile Theme Menu -->
                <div class="mobile-group">
                    <button class="mobile-item-trigger" @click="toggleThemeMenu">
                        <span class="flex-center gap-10"><Palette :size="20" /> {{ t('theme.label') }}</span>
                        <component :is="isThemeOpen ? ChevronUp : ChevronDown" :size="16" />
                    </button>
                     <div v-if="isThemeOpen" class="mobile-sub-menu">
                        <button class="mobile-sub-item" @click="setTheme('system')">
                          <Monitor :size="16" /> {{ t('theme.system') }}
                        </button>
                        <button class="mobile-sub-item" @click="setTheme('light')">
                          <Sun :size="16" /> {{ t('theme.light') }}
                        </button>
                        <button class="mobile-sub-item" @click="setTheme('dark')">
                          <Moon :size="16" /> {{ t('theme.dark') }}
                        </button>
                     </div>
                </div>

                <!-- Mobile Guide -->
                <div class="mobile-group">
                    <button class="mobile-item-trigger" @click="toggleGuide">
                         <span class="flex-center gap-10"><CircleHelp :size="20" /> {{ t('nav.guide') }}</span>
                    </button>
                </div>

                 <!-- Mobile Language -->
                <div class="mobile-group">
                    <button class="mobile-item-trigger" @click="toggleLangMenu">
                        <span class="flex-center gap-10">
                             <span class="lang-flag-current mobile-flag">
                                <span :class="getFlagClass(locale)"></span>
                             </span>
                             {{ t('language.label') }}
                        </span>
                        <component :is="isLangOpen ? ChevronUp : ChevronDown" :size="16" />
                    </button>
                    <div v-if="isLangOpen" class="mobile-sub-menu">
                         <div class="lang-search mobile-search">
                              <input
                                class="lang-search-input"
                                type="text"
                                :placeholder="t('language.searchPlaceholder')"
                                v-model="searchTerm"
                                @click.stop
                              />
                         </div>
                        <div class="lang-list mobile-lang-list">
                             <button
                                v-for="lang in filteredLanguages"
                                :key="lang.code"
                                class="mobile-sub-item"
                                :class="{ active: locale === lang.code }"
                                @click="selectLanguage(lang.code)"
                              >
                                <span class="lang-flag-item">
                                  <span :class="getFlagClass(lang.code)"></span>
                                </span>
                                <span class="lang-name">{{ lang.label }}</span>
                              </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
  </nav>
</template>

<style scoped>
.navbar {
  width: 100%;
  padding: 15px 30px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 242, 254, 0.1);
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}

.nav-left {
  display: flex;
  align-items: center;
}

.app-title {
  font-size: 1.8rem;
  margin: 0;
  letter-spacing: 3px;
  font-weight: 300;
  color: var(--text-strong);
  text-shadow: 0 0 10px var(--title-glow);
}

.nav-container {
  display: flex;
  gap: 20px;
  align-items: center;
}

.nav-dropdown {
  position: relative;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  font-size: 0.95rem;
  min-width: 120px;
  justify-content: center;
}

.nav-btn.icon-only {
  min-width: auto;
  padding: 8px 12px;
}

.nav-btn.flag-btn {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}

.nav-btn.flag-btn:hover {
  background: transparent;
  transform: scale(1.1);
}

.lang-flag-current img, .lang-flag-current svg {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  transition: box-shadow 0.3s ease;
}

.nav-btn.flag-btn:hover .lang-flag-current img,
.nav-btn.flag-btn:hover .lang-flag-current svg {
  box-shadow: 0 0 15px var(--primary-neon);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 10px;
  background: rgba(10, 10, 20, 0.95);
  border: 1px solid var(--primary-neon);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 150px;
  box-shadow: 0 0 20px rgba(0, 242, 254, 0.2);
  z-index: 1000;
}

.lang-menu-dropdown {
  width: 250px;
  right: 0;
  left: auto;
  max-height: 400px;
  overflow-y: auto;
}

.lang-search {
  padding: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 5px;
}

.lang-search-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  outline: none;
}

.lang-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dropdown-item {
  background: transparent;
  border: none;
  color: #fff;
  padding: 10px 15px;
  cursor: pointer;
  text-align: left;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-family: 'Segoe UI', sans-serif;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.dropdown-item:hover, .dropdown-item.active {
  background: rgba(0, 242, 254, 0.15);
  color: var(--primary-neon);
}

.icon {
  font-size: 1.1rem;
}

.lang-flag-current img, .lang-flag-item img {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
  display: block;
}

.lang-flag-current svg, .lang-flag-item svg {
  width: 24px;
  height: 16px;
  display: block;
}

/* Helper */
.flex-center { display: flex; align-items: center; }
.gap-10 { gap: 10px; }

/* Desktop/Mobile Visibility */
.desktop-only { display: flex; }
.mobile-only { display: none; }

@media (max-width: 768px) {
    .desktop-only { display: none; }
    .mobile-only { display: flex; }
    
    .navbar {
        padding: 10px 20px;
    }
}

/* Mobile Overlay */
.mobile-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: rgba(10, 10, 25, 0.98);
    backdrop-filter: blur(20px);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow-y: auto;
}

.mobile-menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    border-bottom: 1px solid rgba(0, 242, 254, 0.2);
    flex-shrink: 0;
}

.mobile-title {
    font-size: 1.8rem;
    color: var(--primary-neon);
    margin: 0;
    letter-spacing: 3px;
    font-weight: 300;
}

.mobile-menu-items {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 20px;
}

.mobile-group {
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-bottom: 10px;
}

.mobile-item-trigger {
    background: transparent;
    border: none;
    color: #fff;
    font-size: 1.2rem;
    padding: 15px 0;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.mobile-sub-menu {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-left: 15px;
    padding-bottom: 10px;
    animation: slideDown 0.3s ease-out;
}

.mobile-sub-item {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    padding: 10px;
    text-align: left;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 4px;
}

.mobile-sub-item:hover, .mobile-sub-item.active {
    color: var(--primary-neon);
    background: rgba(0, 242, 254, 0.1);
}

.mobile-flag {
    margin-right: 5px;
}

@keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>