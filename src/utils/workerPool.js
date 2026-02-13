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

    runRace(tasks) {
        return new Promise((resolve, reject) => {
            let activeCount = tasks.length;
            let resolved = false;
            
            tasks.forEach(taskData => {
                this.run(taskData.data, taskData.onProgress)
                    .then(result => {
                        if (resolved) return;
                        
                        // Heuristic: If solved 100%, we have a winner
                        if (result.solvability === 100) {
                            resolved = true;
                            resolve(result);
                            // Cancel others (optional but good for perf)
                            // We can't easily cancel *specific* other tasks in this pool implementation without IDs
                            // But since this is a "Race", we assume the caller will handle cleanup or we just let them finish
                        } else {
                            // If not fully solved, we wait for others?
                            // Or maybe we collect all results and pick best?
                            // For "Race", we usually want the first *Success*.
                            // If all fail (finish without 100%), we reject or return best.
                            activeCount--;
                            if (activeCount === 0) {
                                // All finished, none 100%. Return the last one (or logic to pick best)
                                resolve(result); 
                            }
                        }
                    })
                    .catch(err => {
                        if (resolved) return;
                        activeCount--;
                        if (activeCount === 0) {
                            reject(new Error('All workers failed'));
                        }
                    });
            });
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
            
            if (e.data.error) {
                workerObj.currentTask.reject(new Error(e.data.error));
            } else {
                workerObj.currentTask.resolve(e.data);
            }
            
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

    cancelAll() {
        this.clearQueue();
        
        // Terminate and restart busy workers
        this.workers.forEach((w, index) => {
            if (w.busy) {
                w.worker.terminate();
                
                if (w.currentTask) {
                    w.currentTask.reject(new Error('Terminated'));
                }

                // Create replacement
                const newWorker = new SolverWorker();
                newWorker.onmessage = (e) => this.handleWorkerMessage(newWorker, e);
                newWorker.onerror = (e) => this.handleWorkerError(newWorker, e);
                
                // Replace in array
                this.workers[index] = { worker: newWorker, busy: false, id: w.id };
            }
        });
        
        // Reset active count since all busy workers were replaced with idle ones
        this.active = 0;
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
