<script setup>
import { usePuzzleStore } from '@/stores/puzzle';
import { useI18n } from '@/composables/useI18n';

const store = usePuzzleStore();
const { t } = useI18n();

function handleNewRandom() {
    // If currently custom, regenerate custom.
    // If not custom, switch to custom with current size? 
    // Or maybe just re-init current level if it's not custom?
    // "NOWA LOSOWA" implies random.
    // If user is on Easy/Medium/Hard, "Random" might mean "Random predefined" or "Random generated".
    // Let's assume it generates a new random grid of current size.
    store.initCustomGame(store.size);
}
</script>

<template>
  <div class="game-actions">
    <button class="btn-neon secondary" @click="store.resetGame">{{ t('actions.reset') }}</button>
    <button class="btn-neon secondary" @click="handleNewRandom">{{ t('actions.random') }}</button>
    <button class="btn-neon secondary" @click="store.undo">{{ t('actions.undo') }}</button>
  </div>
</template>

<style scoped>
.game-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
  margin-bottom: 30px;
}

.btn-neon.secondary {
  border-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  padding: 10px 25px;
}

.btn-neon.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #fff;
  color: #fff;
}
</style>
