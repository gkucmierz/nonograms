<script setup>
import { computed } from 'vue';
import { usePuzzleStore } from '@/stores/puzzle';
import { useI18n } from '@/composables/useI18n';

const store = usePuzzleStore();
const { t } = useI18n();

const levels = computed(() => [
  { id: 'easy', label: t('level.easy') },
  { id: 'medium', label: t('level.medium') },
  { id: 'hard', label: t('level.hard') }
]);

const emit = defineEmits(['open-custom', 'toggle-guide']);
</script>

<template>
  <div class="level-selector">
    <button 
      v-for="lvl in levels" 
      :key="lvl.id"
      class="btn-neon" 
      :class="{ active: store.currentLevelId === lvl.id }"
      @click="store.initGame(lvl.id)"
    >
      {{ lvl.label }}
    </button>
    
    <button 
        class="btn-neon"
        :class="{ active: store.currentLevelId === 'custom' }"
        @click="emit('open-custom')"
    >
        {{ t('level.custom') }}
    </button>

    <button 
        class="btn-neon guide-btn"
        @click="emit('toggle-guide')"
    >
        {{ t('level.guide') }}
    </button>
  </div>
</template>

<style scoped>
.level-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
  margin-bottom: 20px;
}

.btn-neon {
  padding: 10px 20px;
  border-radius: 20px;
  text-transform: uppercase;
  font-size: 0.9rem;
  letter-spacing: 1px;
}

.guide-btn {
  /* Specific styling for guide if needed */
}
</style>
