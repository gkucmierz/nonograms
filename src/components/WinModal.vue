<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { Fireworks } from 'fireworks-js';
import { usePuzzleStore } from '@/stores/puzzle';

const store = usePuzzleStore();
const fireworksRef = ref(null);
let fireworksInstance = null;

const handleClose = () => {
  store.closeWinModal();
};

const handleKeyDown = (e) => {
  if (e.key === 'Escape') {
    handleClose();
  }
};

onMounted(() => {
  if (fireworksRef.value) {
    fireworksInstance = new Fireworks(fireworksRef.value, {
      autoresize: true,
      opacity: 0.6,
      acceleration: 1.05,
      friction: 0.98,
      gravity: 1.4,
      particles: 60,
      traceLength: 3,
      traceSpeed: 10,
      explosion: 5,
      intensity: 35,
      flickering: 60,
      hue: { min: 170, max: 210 },
      delay: { min: 20, max: 40 },
      rocketsPoint: { min: 50, max: 50 }
    });
    fireworksInstance.start();
  }
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  fireworksInstance?.stop(true);
  fireworksInstance = null;
});
</script>

<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div ref="fireworksRef" class="fireworks-layer"></div>
    <div class="modal glass-panel">
      <h2>GRATULACJE!</h2>
      <p>Rozwiązałeś zagadkę!</p>
      
      <div class="stats">
        <div class="stat">
          <span>Czas:</span>
          <strong>{{ store.elapsedTime }}s</strong>
        </div>
      </div>

      <div class="actions">
        <button class="btn-neon" @click="store.resetGame">Zagraj Ponownie</button>
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
  z-index: 1000;
  animation: fadeIn 0.5s ease;
}

.fireworks-layer {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.modal {
  padding: 40px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  border: 1px solid var(--primary-accent);
  box-shadow: 0 0 50px rgba(0, 242, 255, 0.2);
  animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  z-index: 1001;
}

h2 {
  font-size: 2.5rem;
  color: var(--primary-accent);
  margin: 0 0 10px 0;
  text-shadow: 0 0 20px var(--primary-accent);
}

p {
  color: var(--text-secondary);
  font-size: 1.2rem;
  margin-bottom: 30px;
}

.stats {
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.stat {
  font-size: 1.2rem;
}

.stat strong {
  color: #fff;
  margin-left: 10px;
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
