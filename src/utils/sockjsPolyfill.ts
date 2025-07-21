/**
 * SockJS polyfill to handle the 'global is not defined' error
 * This adds the necessary global object for SockJS to work in browser environments
 */

// Check if window is defined (browser environment)
if (typeof window !== 'undefined') {
  // Add global to window if it doesn't exist already
  (window as any).global = window;
}

export default function setupSockJSPolyfill() {
  // This function can be imported to ensure the polyfill runs
  // It doesn't need to do anything as the code above runs on import
}
