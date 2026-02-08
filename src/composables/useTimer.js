import { ref, onUnmounted } from 'vue';

export function useTimer() {
  const time = ref(0);
  const timerInterval = ref(null);
  const isRunning = ref(false);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const start = () => {
    if (isRunning.value) return;
    isRunning.value = true;
    const startTime = Date.now() - (time.value * 1000);
    
    timerInterval.value = setInterval(() => {
      time.value = Math.floor((Date.now() - startTime) / 1000);
    }, 1000);
  };

  const stop = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value);
      timerInterval.value = null;
    }
    isRunning.value = false;
  };

  const reset = () => {
    stop();
    time.value = 0;
  };

  onUnmounted(() => {
    stop();
  });

  return {
    time,
    isRunning,
    start,
    stop,
    reset,
    formatTime
  };
}
