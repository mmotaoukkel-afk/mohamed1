/**
 * Task Scheduler / Plan Executor for the Kataraa AI Agent OS.
 * Manages prioritization, concurrency, cancellation, timeouts, and state serialization.
 */

export interface Task {
  id: string;
  name: string;
  priority: number; // Higher runs first
  execute: (signal?: AbortSignal) => Promise<any>;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  result?: any;
  error?: any;
  timeoutMS?: number;
}

export interface SchedulerState {
  tasks: Array<Omit<Task, 'execute'>>;
  currentIndex: number;
  running: boolean;
}

export class TaskScheduler {
  private queue: Task[] = [];
  private isRunning = false;
  private isPaused = false;
  private abortController: AbortController = new AbortController();
  private concurrencyLimit = 2;
  private activeCount = 0;

  constructor(options?: { concurrency?: number }) {
    this.concurrencyLimit = options?.concurrency ?? 2;
  }

  public addTask(task: Task): void {
    task.status = 'PENDING';
    this.queue.push(task);
    this.sortQueue();
  }

  public getQueue(): Task[] {
    return this.queue;
  }

  private sortQueue(): void {
    // Sort by priority (descending)
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Starts or resumes execution of the queue.
   */
  public async start(): Promise<void> {
    if (this.isRunning && !this.isPaused) return;

    this.isRunning = true;
    this.isPaused = false;
    this.abortController = new AbortController();

    await this.processQueue();
  }

  /**
   * Pauses the queue execution. Running tasks will complete, but no new tasks
   * will be spawned from the queue.
   */
  public pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    
    // Set all pending tasks to PAUSED
    for (const t of this.queue) {
      if (t.status === 'PENDING') {
        t.status = 'PAUSED';
      }
    }
  }

  /**
   * Resumes the paused queue.
   */
  public async resume(): Promise<void> {
    if (!this.isPaused) return;
    this.isPaused = false;

    // Reset paused tasks to PENDING
    for (const t of this.queue) {
      if (t.status === 'PAUSED') {
        t.status = 'PENDING';
      }
    }

    await this.processQueue();
  }

  /**
   * Cancels all execution. Aborts currently running tasks immediately.
   */
  public cancel(): void {
    this.abortController.abort();
    this.isRunning = false;
    this.isPaused = false;

    for (const t of this.queue) {
      if (t.status === 'PENDING' || t.status === 'RUNNING' || t.status === 'PAUSED') {
        t.status = 'CANCELLED';
      }
    }
  }

  /**
   * Processes tasks in the queue up to the concurrency limit.
   */
  private async processQueue(): Promise<void> {
    if (this.isPaused || !this.isRunning) return;

    const pending = this.queue.filter((t) => t.status === 'PENDING');
    if (pending.length === 0 && this.activeCount === 0) {
      this.isRunning = false;
      return;
    }

    const availableSlots = this.concurrencyLimit - this.activeCount;
    const tasksToStart = pending.slice(0, Math.max(0, availableSlots));

    if (tasksToStart.length === 0) return;

    const executionPromises = tasksToStart.map(async (task) => {
      this.activeCount++;
      await this.runTask(task);
      this.activeCount--;
      
      // Process next batch recursively
      await this.processQueue();
    });

    await Promise.all(executionPromises);
  }

  /**
   * Runs a single task with timeout and cancellation hooks.
   */
  private async runTask(task: Task): Promise<void> {
    if (this.abortController.signal.aborted) {
      task.status = 'CANCELLED';
      return;
    }

    task.status = 'RUNNING';

    const timeoutMS = task.timeoutMS ?? 5000;
    let timeoutId: any;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Task ${task.id} (${task.name}) timed out after ${timeoutMS}ms`));
      }, timeoutMS);
    });

    const executionPromise = task.execute(this.abortController.signal);

    try {
      // Race the actual execution against the timeout limit
      const result = await Promise.race([executionPromise, timeoutPromise]);
      clearTimeout(timeoutId);
      
      if (this.abortController.signal.aborted) {
        task.status = 'CANCELLED';
      } else {
        task.status = 'COMPLETED';
        task.result = result;
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      if (this.abortController.signal.aborted) {
        task.status = 'CANCELLED';
      } else {
        task.status = 'FAILED';
        task.error = err;
      }
    }
  }

  /**
   * Serializes the queue state (without the executable code blocks)
   * to allow cold-start resume simulation.
   */
  public serializeState(): string {
    const state: SchedulerState = {
      tasks: this.queue.map((t) => ({
        id: t.id,
        name: t.name,
        priority: t.priority,
        status: t.status,
        result: t.result,
        error: t.error ? t.error.message || String(t.error) : undefined,
        timeoutMS: t.timeoutMS,
      })),
      currentIndex: this.queue.findIndex((t) => t.status === 'PENDING' || t.status === 'RUNNING'),
      running: this.isRunning,
    };
    return JSON.stringify(state);
  }

  /**
   * Rehydrates queue statuses from a serialized state (for testing/mock state recovery).
   */
  public deserializeState(json: string, executors: Record<string, (signal?: AbortSignal) => Promise<any>>): void {
    const state: SchedulerState = JSON.parse(json);
    this.queue = state.tasks.map((t) => {
      const executor = executors[t.id];
      if (!executor && (t.status === 'PENDING' || t.status === 'PAUSED')) {
        throw new Error(`Cannot rehydrate task ${t.id} without an execution function.`);
      }
      return {
        ...t,
        execute: executor || (() => Promise.resolve()),
      } as Task;
    });
    this.isRunning = state.running;
    this.isPaused = this.queue.some((t) => t.status === 'PAUSED');
    this.sortQueue();
  }
}
