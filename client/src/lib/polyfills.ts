/**
 * Basic polyfills for cross-browser compatibility
 * These ensure that essential functions work consistently across all browsers
 */

// Ensure console is always available (IE support)
if (!window.console) {
  (window as any).console = {
    log: function() {},
    warn: function() {},
    error: function() {},
    info: function() {}
  };
}

// Promise polyfill for older browsers
if (typeof Promise === 'undefined') {
  console.warn('Promise not available - loading polyfill');
  // Add a simple Promise polyfill
  (window as any).Promise = function(executor: any) {
    const resolve = function(value: any) {
      if (this.onResolve) {
        setTimeout(() => this.onResolve(value), 0);
      }
    }.bind(this);
    
    const reject = function(reason: any) {
      if (this.onReject) {
        setTimeout(() => this.onReject(reason), 0);
      }
    }.bind(this);
    
    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
    
    return {
      then: function(callback: any) {
        this.onResolve = callback;
        return this;
      },
      catch: function(callback: any) {
        this.onReject = callback;
        return this;
      }
    };
  };
}

// Object.assign polyfill
if (typeof Object.assign !== 'function') {
  console.warn('Object.assign not available - loading polyfill');
  Object.assign = function(target: any, ...sources: any[]) {
    if (target === null || target === undefined) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    
    const to = Object(target);
    
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      if (source !== null && source !== undefined) {
        for (const key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            to[key] = source[key];
          }
        }
      }
    }
    
    return to;
  };
}

// Array.from polyfill
if (!Array.from) {
  console.warn('Array.from not available - loading polyfill');
  Array.from = function(arrayLike: any, mapFn?: any, thisArg?: any) {
    const result = [];
    const length = arrayLike.length;
    
    for (let i = 0; i < length; i++) {
      if (mapFn) {
        result[i] = mapFn.call(thisArg, arrayLike[i], i);
      } else {
        result[i] = arrayLike[i];
      }
    }
    
    return result;
  };
}

// String.prototype.includes polyfill
if (!String.prototype.includes) {
  console.warn('String.prototype.includes not available - loading polyfill');
  String.prototype.includes = function(search: string, start: number = 0) {
    if (typeof start !== 'number') {
      start = 0;
    }
    
    if (start + search.length > this.length) {
      return false;
    }
    
    return this.indexOf(search, start) !== -1;
  };
}

// Array.prototype.includes polyfill
if (!Array.prototype.includes) {
  console.warn('Array.prototype.includes not available - loading polyfill');
  Array.prototype.includes = function(searchElement: any, fromIndex: number = 0) {
    const len = this.length;
    if (len === 0) return false;
    
    let k = Math.max(fromIndex >= 0 ? fromIndex : len + fromIndex, 0);
    
    function sameValueZero(x: any, y: any) {
      return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
    }
    
    while (k < len) {
      if (sameValueZero(this[k], searchElement)) {
        return true;
      }
      k++;
    }
    
    return false;
  };
}

// Fix for Safari form validation issues
(function fixFormValidation() {
  // Safari has issues with form validation, especially with date inputs
  if (typeof document !== 'undefined' && document.createElement) {
    const testInput = document.createElement('input');
    testInput.type = 'date';
    const notADateValue = 'not-a-date';
    testInput.value = notADateValue;
    
    // If the browser does not support date inputs properly
    if (testInput.value === notADateValue) {
      console.warn('Browser does not fully support date input - applying fixes');
      
      // Add extra validation for date inputs
      document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('input[type="date"]').forEach(input => {
          input.addEventListener('change', function(this: HTMLInputElement) {
            const date = new Date(this.value);
            if (isNaN(date.getTime())) {
              this.value = '';
            }
          });
        });
      });
    }
  }
})();

// Ensure requestAnimationFrame is available
if (!window.requestAnimationFrame) {
  console.warn('requestAnimationFrame not available - loading polyfill');
  window.requestAnimationFrame = function(callback: FrameRequestCallback): number {
    return window.setTimeout(() => {
      callback(Date.now());
    }, 1000 / 60);
  };
  
  window.cancelAnimationFrame = function(id: number): void {
    clearTimeout(id);
  };
}

// Ensure TextEncoder is available (needed for some crypto operations)
if (typeof TextEncoder === 'undefined') {
  console.warn('TextEncoder not available - loading polyfill');
  (window as any).TextEncoder = class {
    encode(input: string): Uint8Array {
      const utf8 = unescape(encodeURIComponent(input));
      const result = new Uint8Array(utf8.length);
      for (let i = 0; i < utf8.length; i++) {
        result[i] = utf8.charCodeAt(i);
      }
      return result;
    }
  };
}

export {};