import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/main.css'

// Custom directive v-cell-hover (zgodnie z wymaganiami)
// Służy do podświetlania wiersza i kolumny po najechaniu na komórkę
const vCellHover = {
  mounted(el, binding) {
    el.addEventListener('mouseenter', () => {
      // Implementacja logiki hover w komponencie jest zwykle lepsza dla reaktywności Vue,
      // ale jako dyrektywa może manipulować klasami DOM dla wydajności.
      // Tutaj przekażemy zdarzenie do store lub komponentu wyżej, ale
      // dla uproszczenia w dyrektywie, po prostu emitujemy custom event
      el.dispatchEvent(new CustomEvent('cell-hover', { 
        bubbles: true, 
        detail: binding.value 
      }));
    });
    el.addEventListener('mouseleave', () => {
      el.dispatchEvent(new CustomEvent('cell-leave', { bubbles: true }));
    });
  }
}

const app = createApp(App)

app.use(createPinia())
app.directive('cell-hover', vCellHover)

app.mount('#app')

if ('serviceWorker' in navigator) {
  let refreshing = false
  const triggerReload = () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  }
  navigator.serviceWorker.addEventListener('controllerchange', triggerReload)
  const checkForUpdate = () => {
    navigator.serviceWorker.getRegistration().then((registration) => registration?.update())
  }
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate()
  })
  window.addEventListener('focus', checkForUpdate)
}
