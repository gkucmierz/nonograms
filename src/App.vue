<script setup>
import { onMounted, ref } from 'vue';
import { usePuzzleStore } from './stores/puzzle';
import GameBoard from './components/GameBoard.vue';
import LevelSelector from './components/LevelSelector.vue';
import StatusPanel from './components/StatusPanel.vue';
import GameActions from './components/GameActions.vue';
import GuidePanel from './components/GuidePanel.vue';
import WinModal from './components/WinModal.vue';
import CustomGameModal from './components/CustomGameModal.vue';
import FixedBar from './components/FixedBar.vue';

// Main App Entry
const store = usePuzzleStore();
const showCustomModal = ref(false);
const showGuide = ref(false);

onMounted(() => {
  if (!store.loadState()) {
    store.initGame(); // Inicjalizacja domyślnej gry jeśli brak zapisu
  }
});
</script>

<template>
  <main class="game-container">
    <FixedBar />

    <header class="game-header">
      <h1>NONOGRAMY</h1>
      <div class="underline"></div>
    </header>

    <div class="game-layout">
      <!-- Level Selection -->
      <LevelSelector 
        @open-custom="showCustomModal = true" 
        @toggle-guide="showGuide = !showGuide"
      />

      <!-- Guide Panel (Conditional) -->
      <transition name="fade">
          <GuidePanel v-if="showGuide" />
      </transition>

      <!-- Status Panel (Time, Moves, Progress) -->
      <StatusPanel />

      <!-- Game Actions (Reset, Random, Undo, Check) -->
      <GameActions />

      <!-- Game Board -->
      <section class="board-section">
        <GameBoard />
      </section>
    </div>

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

.game-header {
  text-align: center;
  margin-bottom: 30px;
  margin-top: 40px;
}

h1 {
  font-size: 3.5rem;
  margin: 0;
  letter-spacing: 5px;
  font-weight: 300;
  color: #fff;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
}

.underline {
  width: 100px;
  height: 3px;
  background: var(--primary-accent);
  margin: 10px auto 0;
  box-shadow: 0 0 10px var(--primary-accent);
}

.game-layout {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 900px;
  align-items: center;
}

/* Remove old glass panel style from game-layout since we split it */
.board-section {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
</style>
