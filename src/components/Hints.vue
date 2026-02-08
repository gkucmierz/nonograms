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
  },
  size: {
    type: Number,
    required: true
  }
});
</script>

<template>
  <div 
    class="hints-container" 
    :class="orientation"
    :style="orientation === 'col' 
      ? { gridTemplateColumns: `repeat(${size}, var(--cell-size))` } 
      : { gridTemplateRows: `repeat(${size}, var(--cell-size))` }"
  >
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
  display: grid;
  gap: var(--gap-size);
}

.hints-container.col {
  padding-bottom: var(--grid-padding);
  align-items: flex-end;
  padding-left: var(--grid-padding);
  padding-right: var(--grid-padding);
}

.hints-container.row {
  align-items: flex-end;
  padding: var(--grid-padding) var(--grid-padding) var(--grid-padding) 0;
  width: max-content;
}

.hint-group {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  transition: all 0.3s ease;
  width: 100%;
  height: 100%;
}

.col .hint-group {
  flex-direction: column;
  padding: 4px 2px;
  justify-content: flex-end;
}

.row .hint-group {
  flex-direction: row;
  padding: 2px 8px;
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
