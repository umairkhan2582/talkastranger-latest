import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { formatSymbol, safeUpperCase, getBrowserName } from '@/lib/browser-utils';
import { useBrowser } from '@/lib/BrowserCompatibleRouter';

export interface CrossBrowserInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  formatType?: 'symbol' | 'uppercase' | 'none';
  onFormattedValueChange?: (value: string) => void;
}

/**
 * Cross-browser compatible input component
 * Handles formatting consistently across different browsers
 */
export function CrossBrowserInput({
  value,
  defaultValue,
  onChange,
  onBlur,
  formatType = 'none',
  onFormattedValueChange,
  ...props
}: CrossBrowserInputProps) {
  // Get browser info for debugging
  const { browserName, isSafari } = useBrowser();
  
  // State to track the input value
  const [inputValue, setInputValue] = useState<string>(
    (value as string) || (defaultValue as string) || ''
  );
  
  // Ref to track if component is mounted
  const isMounted = useRef(false);
  
  // Update internal state when value prop changes
  useEffect(() => {
    if (value !== undefined && (value as string) !== inputValue) {
      setInputValue((value as string) || '');
    }
  }, [value]);
  
  // Apply formatting on component mount
  useEffect(() => {
    isMounted.current = true;
    
    // Format initial value
    if (inputValue && formatType !== 'none') {
      const formattedValue = formatValue(inputValue);
      
      if (formattedValue !== inputValue) {
        console.log(`[CrossBrowserInput] Initial formatting in ${browserName}:`, 
          { original: inputValue, formatted: formattedValue });
        
        setInputValue(formattedValue);
        
        if (onFormattedValueChange) {
          onFormattedValueChange(formattedValue);
        }
      }
    }
    
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Format value based on specified type
  const formatValue = (val: string): string => {
    if (!val) return '';
    
    switch (formatType) {
      case 'symbol':
        return formatSymbol(val);
      case 'uppercase':
        return safeUpperCase(val);
      default:
        return val;
    }
  };
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Always update internal state with raw value first
    setInputValue(newValue);
    
    // Create a synthetic event with the same shape
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: newValue
      }
    };
    
    // Call the original onChange handler with raw value
    if (onChange) {
      onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
    }
    
    // If we need to format the value, do it immediately for symbol input
    if (formatType !== 'none') {
      const formattedValue = formatValue(newValue);
      
      if (formattedValue !== newValue) {
        console.log(`[CrossBrowserInput] Formatting in ${browserName}:`, 
          { original: newValue, formatted: formattedValue });
          
        // Always update with the formatted value for symbols
        // This ensures consistent behavior cross-browser
        if (isMounted.current && onFormattedValueChange) {
          // For symbols, always apply formatting immediately to ensure validation works
          if (formatType === 'symbol') {
            onFormattedValueChange(formattedValue);
            // Also update the input value directly to keep UI and form state in sync
            setInputValue(formattedValue);
          } else {
            // For other format types, call the callback normally
            onFormattedValueChange(formattedValue);
          }
        }
      }
    }
  };
  
  // Handle blur event - this is where we enforce formatting
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (formatType !== 'none') {
      const formattedValue = formatValue(inputValue);
      
      if (formattedValue !== inputValue) {
        console.log(`[CrossBrowserInput] Blur formatting in ${browserName}:`, 
          { original: inputValue, formatted: formattedValue });
        
        setInputValue(formattedValue);
        
        // Update with formatted value
        if (onFormattedValueChange) {
          onFormattedValueChange(formattedValue);
        }
        
        // Create modified event
        const modifiedEvent = {
          ...e,
          target: {
            ...e.target,
            value: formattedValue
          }
        };
        
        // Call original onBlur with modified event
        if (onBlur) {
          onBlur(modifiedEvent as React.FocusEvent<HTMLInputElement>);
        }
        
        return;
      }
    }
    
    // Call original onBlur if no formatting was needed
    if (onBlur) {
      onBlur(e);
    }
  };
  
  // Special handling for Safari
  const additionalProps: Record<string, any> = {};
  if (isSafari) {
    // Safari needs explicit autoCorrect and spellCheck settings
    additionalProps.autoCorrect = 'off';
    additionalProps.spellCheck = 'false';
    additionalProps.autoCapitalize = 'off';
  }
  
  return (
    <Input
      {...props}
      {...additionalProps}
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      data-browser={browserName}
      data-format-type={formatType}
    />
  );
}