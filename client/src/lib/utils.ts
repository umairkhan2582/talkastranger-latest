import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ethers } from "ethers";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a blockchain address to show an abbreviated version
 * @param address The full blockchain address
 * @param start Number of characters to show at the start (default: 4)
 * @param end Number of characters to show at the end (default: 4)
 * @returns Formatted address (e.g., "0x1234...5678")
 */
export function formatAddress(address: string | null, start: number = 4, end: number = 4): string {
  if (!address) return '';
  
  // Make sure we have enough characters
  if (address.length <= start + end) {
    return address;
  }
  
  return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
}

/**
 * Format a currency value to USD format
 * @param value The value to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted value (e.g., "$123.45")
 */
export function formatUsd(value: number | undefined, decimals: number = 2): string {
  if (value === undefined || isNaN(value)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a token balance for display
 * @param balance The balance string or number
 * @param decimals Number of decimal places to show (default: 6)
 * @returns Formatted balance string
 */
export function formatBalance(balance: string | number, decimals: number = 6): string {
  if (!balance) return '0';
  
  let numBalance: number;
  
  if (typeof balance === 'string') {
    // Check if this is a BigNumber string (large number in wei format)
    if (balance.startsWith('0x') || (/^\d+$/.test(balance) && balance.length > 10)) {
      try {
        // Convert from wei to ether units
        numBalance = parseFloat(ethers.utils.formatEther(balance));
      } catch (error) {
        console.warn('[utils] Error formatting balance with ethers:', error);
        // If ethers conversion fails, try to directly parse
        numBalance = parseFloat(balance);
      }
    } else {
      // Already in human readable format
      numBalance = parseFloat(balance);
    }
  } else {
    numBalance = balance;
  }
  
  if (isNaN(numBalance)) return '0';
  
  // For very small numbers, show scientific notation
  if (numBalance > 0 && numBalance < 0.000001) {
    return numBalance.toExponential(2);
  }
  
  // For large numbers, simplify with K, M notation
  if (numBalance >= 1000000) {
    return (numBalance / 1000000).toFixed(2) + 'M';
  }
  if (numBalance >= 100000) {
    return (numBalance / 1000).toFixed(1) + 'k';
  }
  if (numBalance >= 1000) {
    return numBalance.toLocaleString('en-US', {
      maximumFractionDigits: 2
    });
  }
  
  // For regular numbers, limit decimal places
  return numBalance.toLocaleString('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: numBalance < 1 ? decimals : 2,
  });
}