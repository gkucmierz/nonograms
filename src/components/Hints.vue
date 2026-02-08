<script setup>
defineProps({
  hints: {
    type: Array,
    required: true
  },
  orientation: {
    type: String,
    required: true,
    validator: (v) => ['row', 'col'].includes(v)
  }
});
</script>

<template>
  <div class="hints-container" :class="orientation">
    <div 
      v-for="(group, index) in hints" 
      :key="index" 
      class="hint-group"
      :class="{ 'hint-alt': index % 2 !== 0 }"
    >
      <span 
        v-for="(num, idx) in group" 
        :key="idx" 
        class="hint-num"
      >
        {{ num }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.hints-container {
  display: flex;
  gap: var(--gap-size);
}

.hints-container.col {
  flex-direction: row;
  margin-bottom: 5px;
  align-items: flex-end;
  padding: 0 5px; /* Match grid padding */
}

.hints-container.row {
  flex-direction: column;
  margin-right: 5px;
  align-items: flex-end;
  padding: 5px 0; /* Match grid padding */
}

.hint-group {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.col .hint-group {
  flex-direction: column;
  width: var(--cell-size);
  padding: 4px 2px;
  justify-content: flex-end;
}

.row .hint-group {
  flex-direction: row;
  height: var(--cell-size);
  padding: 2px 8px;
  width: 100px; /* Stała szerokość */
}

.hint-num {
  font-size: 0.85rem;
  color: #fff;
  font-weight: bold;
  padding: 2px;
}

/* Alternating Colors */
.hint-group.hint-alt .hint-num {
    color: var(--accent-cyan);
}

/* Hover effect for readability */
.hint-group:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--accent-cyan);
}
</style>
