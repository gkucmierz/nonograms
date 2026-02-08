<script setup>
import { ref } from 'vue';
import { usePuzzleStore } from '@/stores/puzzle';
import { useI18n } from '@/composables/useI18n';

const emit = defineEmits(['close']);
const store = usePuzzleStore();
const { t } = useI18n();

const customSize = ref(10);
const errorMsg = ref('');

const snapToStep = (value, step) => {
  const rounded = Math.round(value / step) * step;
  return Math.max(5, Math.min(80, rounded));
};

const handleSnap = () => {
  customSize.value = snapToStep(Number(customSize.value), 5);
};

const confirm = () => {
  const size = parseInt(customSize.value);
  if (isNaN(size) || size < 5 || size > 80) {
    errorMsg.value = t('custom.sizeError');
    return;
  }
  
  store.initCustomGame(size);
  emit('close');
};
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal glass-panel">
      <h2>{{ t('custom.title') }}</h2>
      <p>{{ t('custom.prompt') }}</p>
      
      <div class="input-group">
        <div class="range-value">{{ customSize }}</div>
        <input 
          type="range" 
          v-model="customSize" 
          min="5" 
          max="80"
          step="1"
          @change="handleSnap"
        />
        <div class="range-scale">
          <span>5</span>
          <span>80</span>
        </div>
      </div>
      
      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

      <div class="actions">
        <button class="btn-neon secondary" @click="emit('close')">{{ t('custom.cancel') }}</button>
        <button class="btn-neon" @click="confirm">{{ t('custom.start') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--modal-overlay);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.modal {
  padding: 40px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  border: 1px solid var(--accent-cyan);
  box-shadow: 0 0 50px rgba(0, 242, 255, 0.2);
  animation: slideUp 0.3s ease;
}

h2 {
  font-size: 2rem;
  color: var(--accent-cyan);
  margin: 0 0 20px 0;
  text-transform: uppercase;
  letter-spacing: 2px;
}

p {
  color: var(--text-color);
  margin-bottom: 20px;
}

.input-group {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.range-value {
    min-width: 64px;
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--panel-bg-strong);
    border: 1px solid var(--panel-border);
    color: var(--text-strong);
    font-size: 1.1rem;
    text-align: center;
}

input[type="range"] {
    -webkit-appearance: none;
    width: min(300px, 70vw);
    height: 8px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--accent-cyan), var(--accent-purple));
    outline: none;
    border: 1px solid var(--panel-border);
    box-shadow: 0 0 10px rgba(0, 242, 255, 0.2);
}

input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--text-strong);
    border: 2px solid var(--accent-cyan);
    box-shadow: 0 0 12px rgba(0, 242, 255, 0.5);
    cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--text-strong);
    border: 2px solid var(--accent-cyan);
    box-shadow: 0 0 12px rgba(0, 242, 255, 0.5);
    cursor: pointer;
}

.range-scale {
    width: min(300px, 70vw);
    display: flex;
    justify-content: space-between;
    color: var(--text-muted);
    font-size: 0.85rem;
}

.error {
    color: #ff4d4d;
    font-size: 0.9rem;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
