/**
 * UI Helper functions for formatting and displaying data
 */

/**
 * Format a number with commas for thousands and optional decimal places
 * @param value Number to format
 * @param decimals Maximum decimal places (default = 2)
 * @returns Formatted string
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '0';
  
  // For very small numbers, use scientific notation
  if (value > 0 && value < 0.0001) {
    return value.toExponential(decimals);
  }
  
  // Format with thousand separators and fixed decimal places
  const options = {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  };
  
  return value.toLocaleString('en-US', options);
}

/**
 * Format price with appropriate decimal places based on value
 * @param price Number to format as price
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  if (isNaN(price)) return '$0.00';
  
  if (price >= 1000) {
    return `$${formatNumber(price, 2)}`;
  } else if (price >= 1) {
    return `$${formatNumber(price, 4)}`;
  } else if (price >= 0.01) {
    return `$${formatNumber(price, 6)}`;
  } else if (price >= 0.0001) {
    return `$${formatNumber(price, 8)}`;
  } else {
    return `$${price.toExponential(6)}`;
  }
}

/**
 * Format wallet address to shorter version for display
 * @param address Full wallet address
 * @param startChars Number of characters to show at start (default = 6)
 * @param endChars Number of characters to show at end (default = 4)
 * @returns Shortened address
 */
export function shortenAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}

/**
 * Copy text to clipboard
 * @param text Text to copy
 * @returns Promise that resolves when copy is complete
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return Promise.resolve();
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }
  
  // Fallback for older browsers
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  return new Promise<void>((resolve, reject) => {
    try {
      const successful = document.execCommand('copy');
      if (!successful) {
        console.warn('Fallback copy was unsuccessful');
      }
      resolve();
    } catch (err) {
      console.error('Fallback copy failed', err);
      reject(err);
    } finally {
      document.body.removeChild(textArea);
    }
  });
}

/**
 * Format timestamp as relative time (e.g., "2 hours ago")
 * @param timestamp Timestamp to format (Date object or number)
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: Date | number): string {
  const now = new Date().getTime();
  const timeMs = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  const diffSeconds = Math.floor((now - timeMs) / 1000);
  
  if (diffSeconds < 60) {
    return `${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} ago`;
  }
  
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
  
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  }
  
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
}