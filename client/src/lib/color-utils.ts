/**
 * Color utilities for generating consistent colors from strings
 */

// Generate a consistent color based on a string input
export function getRandomColor(input: string): string {
  // Use a deterministic hash function to generate a number from the string
  const hashCode = getHashCode(input);
  
  // List of pleasing colors to select from
  const colors = [
    "#4285F4", // Google Blue
    "#EA4335", // Google Red
    "#FBBC05", // Google Yellow
    "#34A853", // Google Green
    "#673AB7", // Purple
    "#3F51B5", // Indigo
    "#2196F3", // Blue
    "#009688", // Teal
    "#4CAF50", // Green
    "#FF9800", // Orange
    "#FF5722", // Deep Orange
    "#795548", // Brown
    "#607D8B", // Blue Grey
  ];
  
  // Use the hash to select a color
  const index = Math.abs(hashCode) % colors.length;
  return colors[index];
}

// Get a hash code from a string
function getHashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// Generate a linear gradient string
export function getGradient(color1: string, color2: string, angle = 45): string {
  return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
}

// Lighten or darken a hex color
export function adjustColor(color: string, amount: number): string {
  let hex = color;
  
  // Remove # if present
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }
  
  // Convert to RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Generate a series of colors for charts
export function getChartColors(count: number): string[] {
  const baseColors = [
    "#4285F4", // Blue
    "#EA4335", // Red
    "#34A853", // Green
    "#FBBC05", // Yellow
    "#673AB7", // Purple
    "#009688", // Teal
    "#FF5722", // Deep Orange
  ];
  
  // If we need more colors than we have in our base set,
  // generate variations by adjusting brightness
  const colors: string[] = [];
  
  for (let i = 0; i < count; i++) {
    if (i < baseColors.length) {
      colors.push(baseColors[i]);
    } else {
      // Cycle through base colors with adjustments
      const baseIndex = i % baseColors.length;
      const adjustment = -30 * Math.floor(i / baseColors.length);
      colors.push(adjustColor(baseColors[baseIndex], adjustment));
    }
  }
  
  return colors;
}