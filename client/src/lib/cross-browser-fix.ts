/**
 * CRITICAL CROSS-BROWSER COMPATIBILITY FIX
 * 
 * This file contains fixes for all cross-browser compatibility issues in the application.
 * It is imported in the main.tsx file to ensure it runs before any other code.
 * 
 * DO NOT MODIFY THIS FILE WITHOUT EXTENSIVE TESTING IN ALL BROWSERS!
 */

import { isSafari, isChrome, isFirefox, getBrowserName } from './browser-utils';
import { detectBrowser, applyBrowserFixes, BrowserType, EnvironmentType } from './browserDetector';

// Fix for masked URL forwarding from GoDaddy and similar services
// (simplified version that won't cause white screens)
(function fixMaskedRedirects() {
  if (typeof window !== 'undefined') {
    // Apply this fix immediately before anything else loads
    console.log('[MASKED REDIRECT FIX] Applying fixes for masked URL forwarding');
    
    // Force-apply viewport meta for mobile devices immediately
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const mobileViewportContent = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
    
    if (viewportMeta) {
      viewportMeta.setAttribute('content', mobileViewportContent);
    } else {
      const newViewportMeta = document.createElement('meta');
      newViewportMeta.name = 'viewport';
      newViewportMeta.content = mobileViewportContent;
      document.head.appendChild(newViewportMeta);
    }
    
    // Check for mobile device
    const isMobileCheck = /android|iphone|ipod|ipad|mobile|mobi/i.test(navigator.userAgent.toLowerCase()) || 
                         (window.innerWidth <= 768) || 
                         (typeof window.orientation !== 'undefined') ||
                         navigator.maxTouchPoints > 0;
    
    // Just apply simple mobile class without aggressive CSS that breaks the UI
    if (isMobileCheck) {
      document.documentElement.classList.add('mobile-device');
    }
  }
})();

// Display browser info for debugging
console.log(`[BROWSER INFO] Running in ${getBrowserName()} browser`);

// Fix Symbol validation and transformation
(function fixSymbolHandling() {
  // Make sure toUpperCase works consistently
  const originalToUpperCase = String.prototype.toUpperCase;
  String.prototype.toUpperCase = function(): string {
    try {
      const result = originalToUpperCase.call(this);
      return result || '';
    } catch (e) {
      console.warn('[Browser Fix] Error in toUpperCase, using fallback', e);
      // Fallback implementation for Safari
      const str = String(this);
      let result = '';
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code >= 97 && code <= 122) { // a-z
          result += String.fromCharCode(code - 32);
        } else {
          result += str[i];
        }
      }
      return result;
    }
  };
})();

// Fix navigation between pages
(function fixNavigation() {
  if (typeof window !== 'undefined') {
    // Create a global navigation function that works across all browsers
    (window as any).globalSafeNavigate = function(path: string) {
      console.log(`[NAVIGATION] Navigating to ${path} in ${getBrowserName()}`);
      window.location.href = path;
      return false; // Prevent default behavior
    };

    // Patch all links/anchors for Safari
    if (isSafari()) {
      console.log('[SAFARI FIX] Applying navigation fixes for Safari');
      
      // Function to patch anchors
      const patchAnchors = () => {
        document.querySelectorAll('a').forEach(anchor => {
          if (!(anchor as any)._browserFixed && !anchor.getAttribute('target')) {
            anchor.addEventListener('click', (e) => {
              const href = anchor.getAttribute('href');
              if (href && !href.startsWith('#') && !href.startsWith('http')) {
                e.preventDefault();
                console.log(`[SAFARI FIX] Intercepted navigation: ${href}`);
                window.location.href = href;
              }
            });
            (anchor as any)._browserFixed = true;
          }
        });
      };
      
      // Apply immediately and when DOM changes
      window.addEventListener('DOMContentLoaded', patchAnchors);
      
      // Set up observer to catch dynamically added links
      try {
        const observer = new MutationObserver(() => {
          patchAnchors();
        });
        
        // Start observing once DOM is loaded
        window.addEventListener('DOMContentLoaded', () => {
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
        });
      } catch (e) {
        console.warn('[SAFARI FIX] Error setting up MutationObserver, falling back to interval', e);
        // Fallback to interval for older browsers
        setInterval(patchAnchors, 2000);
      }
    }

    // Fix history API for wouter to work in all browsers
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      console.log(`[NAVIGATION FIX] history.pushState called with: ${args[2]}`);
      
      try {
        // Call original
        originalPushState.apply(this, args);
        
        // Dispatch popstate for router to detect
        try {
          const popStateEvent = new PopStateEvent('popstate', { state: args[0] });
          window.dispatchEvent(popStateEvent);
        } catch (e) {
          console.warn('[NAVIGATION FIX] Failed to dispatch popstate event, using location change', e);
          // If PopStateEvent fails (some browsers), use direct navigation
          if (typeof args[2] === 'string') {
            window.location.href = args[2];
          }
        }
      } catch (e) {
        console.warn('[NAVIGATION FIX] history.pushState failed, using direct navigation', e);
        // If pushState fails, use direct navigation
        if (typeof args[2] === 'string') {
          window.location.href = args[2];
        }
      }
    };
  }
})();

// Fix input handling for token symbols
(function fixInputHandling() {
  if (typeof window !== 'undefined') {
    // Patch input events for consistent behavior
    window.addEventListener('DOMContentLoaded', () => {
      // Monitor all text inputs
      const patchTextInputs = () => {
        document.querySelectorAll('input[type="text"]').forEach(input => {
          if (!(input as any)._inputFixed) {
            // Store original value on focus
            input.addEventListener('focus', function(this: HTMLInputElement) {
              (this as any)._originalValue = this.value;
            });
            
            // Ensure change events trigger consistently
            input.addEventListener('blur', function(this: HTMLInputElement) {
              if ((this as any)._originalValue !== this.value) {
                try {
                  // Manually trigger change event
                  const event = new Event('change', { bubbles: true });
                  this.dispatchEvent(event);
                } catch (e) {
                  console.warn('[INPUT FIX] Failed to dispatch change event', e);
                }
              }
            });
            
            (input as any)._inputFixed = true;
          }
        });
      };
      
      // Run immediately and periodically for dynamically added elements
      patchTextInputs();
      setInterval(patchTextInputs, 2000);
    });
  }
})();

// Fix for Safari's implementation of ethers.js
(function fixEthersJS() {
  if (typeof window !== 'undefined') {
    // Make Buffer available
    if (!(window as any).Buffer) {
      (window as any).Buffer = {
        from: function(data: any) {
          if (typeof data === 'string') {
            return new TextEncoder().encode(data);
          }
          return new Uint8Array();
        },
        isBuffer: function() {
          return false;
        }
      };
    }
    
    // Monitor for ethers and patch it when loaded
    const patchEthers = () => {
      if ((window as any).ethers) {
        const ethers = (window as any).ethers;
        console.log('[ETHERS FIX] Patching ethers.js methods');
        
        // Wrap utility methods safely
        if (ethers.utils) {
          const wrapSafely = (obj: any, methodName: string) => {
            if (typeof obj[methodName] === 'function') {
              const original = obj[methodName];
              obj[methodName] = function(...args: any[]) {
                try {
                  return original.apply(this, args);
                } catch (e) {
                  console.warn(`[ETHERS FIX] Error in ${methodName}, using fallback`, e);
                  return null;
                }
              };
            }
          };
          
          // Apply to common problematic methods
          wrapSafely(ethers.utils, 'arrayify');
          wrapSafely(ethers.utils, 'hexlify');
          wrapSafely(ethers.utils, 'toUtf8String');
          wrapSafely(ethers.utils, 'parseUnits');
          wrapSafely(ethers.utils, 'formatUnits');
        }
      }
    };
    
    // Try immediately, in case ethers is already loaded
    patchEthers();
    
    // Set up periodic checks to catch dynamic loading
    const ethersInterval = setInterval(() => {
      if ((window as any).ethers) {
        patchEthers();
        clearInterval(ethersInterval);
      }
    }, 1000);
    
    // Clear interval after 10 seconds to avoid memory leaks
    setTimeout(() => clearInterval(ethersInterval), 10000);
  }
})();

export {};