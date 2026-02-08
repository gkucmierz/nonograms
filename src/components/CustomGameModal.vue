<script setup>
import { ref } from 'vue';
import { usePuzzleStore } from '@/stores/puzzle';

const emit = defineEmits(['close']);
const store = usePuzzleStore();

const customSize = ref(10);
const errorMsg = ref('');

const confirm = () => {
  const size = parseInt(customSize.value);
  if (isNaN(size) || size < 5 || size > 100) {
    errorMsg.value = 'Rozmiar musi być między 5 a 100!';
    return;
  }
  
  store.initCustomGame(size);
  emit('close');
};
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal glass-panel">
      <h2>GRA WŁASNA</h2>
      <p>Wprowadź rozmiar siatki (5 - 100):</p>
      
      <div class="input-group">
        <input 
          type="number" 
          v-model="customSize" 
          min="5" 
          max="100"
          @keyup.enter="confirm"
        />
      </div>
      
      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

      <div class="actions">
        <button class="btn-neon secondary" @click="emit('close')">Anuluj</button>
        <button class="btn-neon" @click="confirm">Start</button>
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
  background: rgba(0, 0, 0, 0.7);
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
}

input {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--glass-border);
    color: #fff;
    padding: 10px;
    font-size: 1.2rem;
    border-radius: 8px;
    width: 100px;
    text-align: center;
}

input:focus {
    outline: none;
    border-color: var(--accent-cyan);
    box-shadow: 0 0 10px rgba(0, 242, 255, 0.3);
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
