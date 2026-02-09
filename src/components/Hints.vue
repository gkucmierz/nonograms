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
  },
  activeIndex: {
    type: Number,
    default: null
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
      :class="{ 'is-active': index === activeIndex }"
    >
      <span 
        v-for="(num, idx) in group" 
        :key="idx" 
        class="hint-num"
        :class="{ 'hint-alt': idx % 2 !== 0 }"
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
  background: var(--hint-bg);
  border: 1px solid var(--hint-border);
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
  color: var(--text-strong);
  font-weight: bold;
  padding: 2px;
}

/* Alternating Colors within the group */
.hint-num.hint-alt {
    color: var(--accent-cyan);
}

/* Hover effect for readability */
.hint-group:hover {
    background: var(--hint-hover-bg);
    border-color: var(--accent-cyan);
}

.hint-group.is-active {
    background: rgba(79, 172, 254, 0.2);
    border-color: rgba(79, 172, 254, 0.8);
    box-shadow: 0 0 12px rgba(79, 172, 254, 0.35);
}
</style>
