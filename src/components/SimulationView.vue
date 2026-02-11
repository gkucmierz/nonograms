
<script setup>
import { ref, computed } from 'vue';
import { generateRandomGrid, calculateHints } from '@/utils/puzzleUtils';
import { solvePuzzle } from '@/utils/solver';
import { X, Play, Square, RotateCcw } from 'lucide-vue-next';

const emit = defineEmits(['close']);

const SIZES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]; 
const DENSITIES = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
const SAMPLES_PER_POINT = 10; // Reduced for web performance demo

const isRunning = ref(false);
const progress = ref(0);
const currentStatus = ref('Ready');
const results = ref([]);
const simulationSpeed = ref(1); // 1 = Normal, 2 = Fast (less render updates)

let stopRequested = false;

const startSimulation = async () => {
    if (isRunning.value) return;
    isRunning.value = true;
    stopRequested = false;
    results.value = [];
    progress.value = 0;

    const totalSteps = SIZES.length * DENSITIES.length;
    let stepCount = 0;

    for (const size of SIZES) {
        for (const density of DENSITIES) {
            if (stopRequested) {
                currentStatus.value = 'Stopped';
                isRunning.value = false;
                return;
            }

            currentStatus.value = `Simulating ${size}x${size} @ ${(density * 100).toFixed(0)}%`;
            
            let totalSolved = 0;
            
            // Run samples
            for (let i = 0; i < SAMPLES_PER_POINT; i++) {
                const grid = generateRandomGrid(size, density);
                const { rowHints, colHints } = calculateHints(grid);
                const { percentSolved } = solvePuzzle(rowHints, colHints);
                totalSolved += percentSolved;
                
                // Yield to UI every few samples to keep it responsive
                if (i % 2 === 0) await new Promise(r => setTimeout(r, 0));
            }

            const avgSolved = totalSolved / SAMPLES_PER_POINT;
            
            results.value.unshift({
                size,
                density,
                avgSolved: avgSolved.toFixed(1)
            });

            stepCount++;
            progress.value = (stepCount / totalSteps) * 100;
        }
    }

    isRunning.value = false;
    currentStatus.value = 'Completed';
};

const stopSimulation = () => {
    stopRequested = true;
};

const getRowColor = (solved) => {
    if (solved >= 90) return 'color-easy';
    if (solved >= 60) return 'color-harder';
    if (solved >= 30) return 'color-hardest';
    return 'color-extreme';
};

</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal glass-panel">
      <div class="header">
        <h2>Difficulty Simulation</h2>
        <button class="close-btn" @click="emit('close')">
            <X />
        </button>
      </div>
      
      <div class="content">
        <div class="controls">
            <div class="status-bar">
                <div class="status-text">{{ currentStatus }}</div>
                <div class="progress-track">
                    <div class="progress-fill" :style="{ width: progress + '%' }"></div>
                </div>
            </div>
            
            <div class="actions">
                <button v-if="!isRunning" class="btn-neon" @click="startSimulation">
                    <Play class="icon" /> Start Simulation
                </button>
                <button v-else class="btn-neon secondary" @click="stopSimulation">
                    <Square class="icon" /> Stop
                </button>
            </div>
        </div>

        <div class="results-container">
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Size</th>
                        <th>Density</th>
                        <th>Solved (Logic)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(row, idx) in results" :key="idx" :class="getRowColor(row.avgSolved)">
                        <td>{{ row.size }}x{{ row.size }}</td>
                        <td>{{ (row.density * 100).toFixed(0) }}%</td>
                        <td>{{ row.avgSolved }}%</td>
                    </tr>
                </tbody>
            </table>
            <div v-if="results.length === 0" class="empty-state">
                Press Start to run Monte Carlo simulation
            </div>
        </div>
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
  background: var(--modal-overlay);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
  animation: fadeIn 0.3s ease;
}

.modal {
  padding: 30px;
  width: 90%;
  max-width: 600px;
  height: 80vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--accent-cyan);
  box-shadow: 0 0 50px rgba(0, 242, 255, 0.2);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

h2 {
    color: var(--accent-cyan);
    margin: 0;
    font-size: 1.5rem;
}

.close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 5px;
}

.close-btn:hover {
    color: var(--text-color);
}

.content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow: hidden;
}

.controls {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--panel-border);
}

.status-bar {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.status-text {
    font-size: 0.9rem;
    color: var(--text-muted);
}

.progress-track {
    width: 100%;
    height: 4px;
    background: var(--panel-bg-strong);
    border-radius: 2px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: var(--accent-cyan);
    transition: width 0.3s ease;
}

.actions {
    display: flex;
    justify-content: flex-end;
}

.btn-neon {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    font-size: 0.9rem;
}

.icon {
    width: 16px;
    height: 16px;
}

.results-container {
    flex: 1;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    padding: 10px;
}

.results-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
}

.results-table th {
    text-align: left;
    padding: 8px;
    color: var(--text-muted);
    border-bottom: 1px solid var(--panel-border);
    position: sticky;
    top: 0;
    background: var(--panel-bg);
}

.results-table td {
    padding: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.color-easy { color: #33ff33; }
.color-harder { color: #ffff33; }
.color-hardest { color: #ff9933; }
.color-extreme { color: #ff3333; }

.empty-state {
    padding: 40px;
    text-align: center;
    color: var(--text-muted);
    font-style: italic;
}

/* Scrollbar styling */
.results-container::-webkit-scrollbar {
  width: 8px;
}

.results-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

.results-container::-webkit-scrollbar-thumb {
  background: var(--panel-border);
  border-radius: 4px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
