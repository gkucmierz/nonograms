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
  },
  completedLines: {
    type: Array,
    default: () => []
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
      :class="{
        'is-active': index === activeIndex,
        'is-completed': completedLines[index],
        'guide-right': orientation === 'col' && (index + 1) % 5 === 0 && index !== size - 1,
        'guide-bottom': orientation === 'row' && (index + 1) % 5 === 0 && index !== size - 1
      }"
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
  /* align-items: flex-end; - Removed to ensure uniform column height */
  padding-left: var(--grid-padding);
  padding-right: var(--grid-padding);
}

.hints-container.row {
  /* align-items: flex-end; - Removed to ensure row hints fill the cell height */
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

.hint-group.is-completed {
  opacity: 0.5;
  background-color: var(--hint-bg);
}

.hint-group.is-completed .hint-num {
  color: var(--text-muted);
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

@media (max-width: 768px) {
    .hint-num {
        font-size: 0.7rem;
        padding: 1px;
    }
    
    .col .hint-group {
        padding: 2px 0;
    }
    
    .row .hint-group {
        padding: 0 4px;
    }
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

/* Guide lines every 5 */
.hint-group.guide-right {
    border-right: 2px solid rgba(0, 242, 255, 0.5);
}
.hint-group.guide-bottom {
    border-bottom: 2px solid rgba(0, 242, 255, 0.5);
}
</style>
