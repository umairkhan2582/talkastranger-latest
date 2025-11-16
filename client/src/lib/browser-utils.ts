/**
 * Cross-browser compatibility utility functions
 * Provides helpers for detecting browser types and handling browser differences
 */

/**
 * Detects if the current browser is Safari
 */
export function isSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return (
    userAgent.indexOf('safari') !== -1 && 
    userAgent.indexOf('chrome') === -1 &&
    userAgent.indexOf('android') === -1
  );
}

/**
 * Detects if the current browser is Chrome
 */
export function isChrome(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  return (
    userAgent.indexOf('chrome') !== -1 && 
    userAgent.indexOf('edge') === -1 &&
    userAgent.indexOf('edg/') === -1 &&
    userAgent.indexOf('opr/') === -1
  );
}

/**
 * Detects if the current browser is Firefox
 */
export function isFirefox(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.indexOf('firefox') !== -1;
}

/**
 * Returns a human-friendly name for the current browser
 */
export function getBrowserName(): string {
  if (isSafari()) return 'Safari';
  if (isChrome()) return 'Chrome';
  if (isFirefox()) return 'Firefox';
  
  // Fallback detection for other browsers
  if (typeof window === 'undefined') return 'Server';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (userAgent.indexOf('edge') !== -1 || userAgent.indexOf('edg/') !== -1) return 'Edge';
  if (userAgent.indexOf('opr/') !== -1) return 'Opera';
  if (userAgent.indexOf('samsung') !== -1) return 'Samsung Browser';
  if (userAgent.indexOf('ucbrowser') !== -1) return 'UC Browser';
  
  return 'Unknown Browser';
}

/**
 * Safely converts a string to uppercase, handling browser differences
 * Particularly important for Safari which has inconsistent toUpperCase() behavior
 */
export function safeUpperCase(value: string): string {
  if (!value) return '';
  
  try {
    return value.toUpperCase();
  } catch (e) {
    console.warn('[Browser Utils] Error in toUpperCase, using fallback implementation', e);
    
    // Fallback implementation for browsers where toUpperCase might not work correctly
    const str = String(value);
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code >= 97 && code <= 122) { // lowercase a-z
        result += String.fromCharCode(code - 32); // convert to uppercase
      } else {
        result += str[i]; // keep as is
      }
    }
    return result;
  }
}

/**
 * Browser-safe navigation function that works in all browsers
 * @deprecated Use useSafeNavigate hook from BrowserCompatibleRouter instead
 */
export function safeNavigate(path: string): void {
  console.warn('[Browser Utils] safeNavigate() is deprecated, use useSafeNavigate hook instead');
  
  if (typeof window === 'undefined') return;
  
  // In Safari, we need to use direct location change
  if (isSafari()) {
    window.location.href = path;
    return;
  }
  
  // For other browsers, attempt pushState
  try {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  } catch (e) {
    console.error('[Browser Utils] Error in navigation, falling back to direct location change', e);
    window.location.href = path;
  }
}

/**
 * Validates if a symbol contains only uppercase letters and numbers
 * Safe to use across all browsers
 */
export function isValidSymbol(symbol: string): boolean {
  if (!symbol) return false;
  // Only uppercase letters and numbers
  return /^[A-Z0-9]+$/.test(symbol);
}

/**
 * Formats a symbol string to be compatible with blockchain requirements
 * - Converts to uppercase
 * - Removes invalid characters
 * - Ensures consistent output across browsers
 */
export function formatSymbol(symbol: string): string {
  if (!symbol) return '';
  
  // First, safely convert to uppercase
  let upperCaseSymbol = safeUpperCase(symbol);
  
  // Filter out any non-alphanumeric characters
  upperCaseSymbol = upperCaseSymbol.replace(/[^A-Z0-9]/g, '');
  
  return upperCaseSymbol;
}

/**
 * Creates a consistent, browser-independent delay function
 */
export function safeDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Browser-safe localStorage wrapper that handles exceptions
 */
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('[Browser Utils] Error accessing localStorage:', e);
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error('[Browser Utils] Error writing to localStorage:', e);
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('[Browser Utils] Error removing from localStorage:', e);
      return false;
    }
  }
};