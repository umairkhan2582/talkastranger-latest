import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format a date string or timestamp to a readable format
 * @param dateInput 
 * @returns 
 */
export const formatDate = (dateInput: string | number | Date): string => {
  const date = typeof dateInput === 'number'
    ? new Date(dateInput)
    : new Date(dateInput);
    
  // Check if valid date
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return format(date, 'MMM d, yyyy');
};

/**
 * Format a date string or timestamp to a relative time format (e.g. "2 days ago")
 * @param dateInput 
 * @returns 
 */
export const formatRelativeDate = (dateInput: string | number | Date): string => {
  const date = typeof dateInput === 'number'
    ? new Date(dateInput)
    : new Date(dateInput);
    
  // Check if valid date
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return formatDistanceToNow(date, { addSuffix: true });
};

/**
 * Format a date string or timestamp to a time format (e.g. "2:30 PM")
 * @param dateInput 
 * @returns 
 */
export const formatTime = (dateInput: string | number | Date): string => {
  const date = typeof dateInput === 'number'
    ? new Date(dateInput)
    : new Date(dateInput);
    
  // Check if valid date
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return format(date, 'h:mm a');
};

/**
 * Format a date string or timestamp to a datetime format (e.g. "Apr 25, 2025 2:30 PM")
 * @param dateInput 
 * @returns 
 */
export const formatDateTime = (dateInput: string | number | Date): string => {
  const date = typeof dateInput === 'number'
    ? new Date(dateInput)
    : new Date(dateInput);
    
  // Check if valid date
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return format(date, 'MMM d, yyyy h:mm a');
};