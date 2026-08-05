/**
 * Resilience and Fault-Tolerance Mechanisms for the Kataraa AI Agent OS.
 */

// ─── Exponential Backoff with Jitter ─────────────────────────────────────────

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMS?: number;
  maxDelayMS?: number;
  enableJitter?: boolean;
}

/**
 * Executes a function with exponential backoff and random jitter.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  onRetry?: (attempt: number, error: any) => void
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMS = options.baseDelayMS ?? 100;
  const maxDelayMS = options.maxDelayMS ?? 3000;
  const enableJitter = options.enableJitter ?? true;

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxAttempts) {
        throw error;
      }

      let delay = baseDelayMS * Math.pow(2, attempt - 1);
      delay = Math.min(delay, maxDelayMS);

      if (enableJitter) {
        // Add random jitter: +/- 20% of current delay
        const jitter = (Math.random() * 0.4 - 0.2) * delay;
        delay = Math.max(0, delay + jitter);
      }

      if (onRetry) {
        onRetry(attempt, error);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// ─── Circuit Breaker Pattern ──────────────────────────────────────────────────

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Number of failures before tripping
  cooldownPeriodMS?: number; // How long to remain open before trying half-open
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly cooldownPeriodMS: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 3;
    this.cooldownPeriodMS = options.cooldownPeriodMS ?? 5000;
  }

  public getState(): CircuitState {
    this.updateState();
    return this.state;
  }

  /**
   * Executes a protected call through the circuit breaker.
   * Throws an error immediately if the circuit is OPEN.
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.updateState();

    if (this.state === 'OPEN') {
      throw new Error(`Circuit breaker is OPEN. Execution blocked.`);
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      // Successfully recovered
      this.state = 'CLOSED';
      this.failureCount = 0;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    } else if (this.state === 'HALF_OPEN') {
      // Immediate trip back to OPEN upon any failure in half-open state
      this.state = 'OPEN';
    }
  }

  private updateState(): void {
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.cooldownPeriodMS) {
        this.state = 'HALF_OPEN';
      }
    }
  }

  public forceOpen(): void {
    this.state = 'OPEN';
    this.lastFailureTime = Date.now();
  }

  public forceClose(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
  }
}
