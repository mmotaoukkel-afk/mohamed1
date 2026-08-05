// Polyfill global environment variables for tests in Node context
declare global {
  var __DEV__: boolean;
}
(globalThis as any).__DEV__ = true;

