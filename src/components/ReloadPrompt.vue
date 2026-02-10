<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

const {
  offlineReady,
  needRefresh,
  updateServiceWorker,
} = useRegisterSW()

const close = async () => {
  offlineReady.value = false
  needRefresh.value = false
}
</script>

<template>
  <div
    v-if="offlineReady || needRefresh"
    class="pwa-toast"
    role="alert"
  >
    <div class="message">
      <span v-if="offlineReady">
        {{ t('pwa.offlineReady') }}
      </span>
      <span v-else>
        {{ t('pwa.newContent') }}
      </span>
    </div>
    <div class="buttons">
      <button v-if="needRefresh" class="btn-neon small" @click="updateServiceWorker()">
        {{ t('pwa.reload') }}
      </button>
      <button class="close-btn" @click="close">
        {{ t('pwa.close') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.pwa-toast {
  position: fixed;
  right: 0;
  bottom: 60px; /* Above the footer */
  margin: 16px;
  padding: 15px;
  border: 1px solid var(--banner-border);
  background: var(--banner-bg);
  border-radius: 12px;
  z-index: 2000;
  text-align: left;
  box-shadow: var(--banner-shadow);
  display: flex;
  flex-direction: column;
  gap: 10px;
  backdrop-filter: blur(10px);
  color: var(--text-color);
  max-width: 320px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.message {
  font-size: 0.95rem;
  line-height: 1.4;
}

.buttons {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 5px;
}

.close-btn {
    background: transparent;
    border: 1px solid var(--text-muted);
    color: var(--text-muted);
    padding: 6px 12px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
}

.close-btn:hover {
    border-color: var(--text-color);
    color: var(--text-color);
}

.btn-neon.small {
    padding: 6px 16px;
    font-size: 0.85rem;
}
</style>
