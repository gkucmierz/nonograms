import { ref, computed, onUnmounted } from 'vue';
import { usePuzzleStore } from '@/stores/puzzle';
import { useI18n } from '@/composables/useI18n';

export function useSolver() {
    const store = usePuzzleStore();
    const { t, locale } = useI18n();
    
    const isPlaying = ref(false);
    const isProcessing = ref(false);
    const speedIndex = ref(0);
    const speeds = [1000, 500, 250, 125, 62];
    const speedLabels = ['x1', 'x2', 'x4', 'x8', 'x16'];
    const statusText = ref(t('guide.waiting'));
    
    let intervalId = null;
    let worker = null;
    let requestId = 0;

    function step() {
        if (store.isGameWon) {
            pause();
            statusText.value = t('guide.solved');
            return;
        }
        if (isProcessing.value) return;
        store.markGuideUsed();
        ensureWorker();
        isProcessing.value = true;

        const playerGrid = store.playerGrid.map(row => row.slice());
        const solution = store.solution.map(row => row.slice());
        const id = ++requestId;
        worker.postMessage({ id, playerGrid, solution, locale: locale.value });
    }

    function togglePlay() {
        if (isPlaying.value) {
            pause();
        } else {
            play();
        }
    }

    function play() {
        isPlaying.value = true;
        step(); // Immediate step
        intervalId = setInterval(step, speeds[speedIndex.value]);
    }

    function pause() {
        isPlaying.value = false;
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
    }

    function changeSpeed() {
        speedIndex.value = (speedIndex.value + 1) % speeds.length;
        if (isPlaying.value) {
            pause();
            play();
        }
    }

    function ensureWorker() {
        if (worker) return;
        worker = new Worker(new URL('../workers/solverWorker.js', import.meta.url), { type: 'module' });
        worker.onmessage = (event) => {
            const { type, r, c, state, statusText: text } = event.data;
            if (text) statusText.value = text;
            if (type === 'move') {
                store.setCell(r, c, state);
                isProcessing.value = false;
                if (store.isGameWon) {
                    pause();
                    return;
                }
            } else if (type === 'done') {
                isProcessing.value = false;
                pause();
            } else if (type === 'stuck') {
                isProcessing.value = false;
                pause();
            } else {
                isProcessing.value = false;
            }
        };
    }

    onUnmounted(() => {
        pause();
        worker?.terminate();
        worker = null;
    });

    return {
        isPlaying,
        speedIndex,
        speedLabel: computed(() => speedLabels[speedIndex.value]),
        statusText,
        step,
        togglePlay,
        changeSpeed
    };
}
