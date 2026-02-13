import SolverWorker from '../workers/solver.worker.js?worker';

class WorkerPool {
    constructor() {
        this.workers = [];
        this.queue = [];
        this.active = 0;
        this.poolSize = navigator.hardwareConcurrency || 4;
        
        for (let i = 0; i < this.poolSize; i++) {
            const worker = new SolverWorker();
            worker.onmessage = (e) => this.handleWorkerMessage(worker, e);
            worker.onerror = (e) => this.handleWorkerError(worker, e);
            this.workers.push({ worker, busy: false, id: i });
        }
    }

    run(taskData, onProgress) {
        return new Promise((resolve, reject) => {
            const task = { data: taskData, resolve, reject, onProgress };
            const freeWorker = this.workers.find(w => !w.busy);
            
            if (freeWorker) {
                this.execute(freeWorker, task);
            } else {
                this.queue.push(task);
            }
        });
    }

    execute(workerObj, task) {
        workerObj.busy = true;
        workerObj.currentTask = task;
        this.active++;
        workerObj.worker.postMessage(task.data);
    }

    handleWorkerMessage(worker, e) {
        const workerObj = this.workers.find(w => w.worker === worker);
        if (workerObj && workerObj.currentTask) {
            if (e.data.type === 'progress') {
                if (workerObj.currentTask.onProgress) {
                    workerObj.currentTask.onProgress(e.data.percent);
                }
                return; // Don't resolve yet
            }
            
            workerObj.currentTask.resolve(e.data);
            workerObj.currentTask = null;
            workerObj.busy = false;
            this.active--;
            this.processQueue();
        }
    }

    handleWorkerError(worker, e) {
        const workerObj = this.workers.find(w => w.worker === worker);
        if (workerObj && workerObj.currentTask) {
            workerObj.currentTask.reject(e);
            workerObj.currentTask = null;
            workerObj.busy = false;
            this.active--;
            this.processQueue();
        }
    }

    processQueue() {
        if (this.queue.length > 0) {
            const freeWorker = this.workers.find(w => !w.busy);
            if (freeWorker) {
                const task = this.queue.shift();
                this.execute(freeWorker, task);
            }
        }
    }

    clearQueue() {
        this.queue.forEach(task => {
            task.reject(new Error('Cancelled'));
        });
        this.queue = [];
    }

    terminate() {
        this.workers.forEach(w => w.worker.terminate());
        this.workers = [];
        this.queue = [];
    }
}

// Singleton instance
let poolInstance = null;

export const getWorkerPool = () => {
    if (!poolInstance) {
        poolInstance = new WorkerPool();
    }
    return poolInstance;
};
