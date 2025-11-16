import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useRouter } from 'wouter';

// Browser detection utilities
import { isSafari, isChrome, isFirefox, getBrowserName } from './browser-utils';

// Create context for browser information
type BrowserContextType = {
  browserName: string;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
};

const BrowserContext = createContext<BrowserContextType>({
  browserName: 'unknown',
  isSafari: false,
  isChrome: false,
  isFirefox: false
});

export const useBrowser = () => useContext(BrowserContext);

/**
 * This hook provides a cross-browser compatible navigation function
 * that works consistently in Chrome, Safari, and Firefox.
 */
export function useSafeNavigate() {
  const [, navigate] = useLocation();
  const { isSafari: isSafariBrowser } = useBrowser();
  
  return React.useCallback((to: string) => {
    console.log(`[NAVIGATION] Using safe navigation to ${to} in ${getBrowserName()}`);
    
    // Different behavior for Safari browser
    if (isSafariBrowser) {
      console.log(`[SAFARI NAVIGATION] Using direct location for ${to}`);
      window.location.href = to;
      return;
    }
    
    // Standard wouter navigation for other browsers
    navigate(to);
  }, [navigate, isSafariBrowser]);
}

interface BrowserCompatibleRouterProps {
  children: React.ReactNode;
}

/**
 * A router wrapper that handles cross-browser navigation correctly
 * Fixes issues with wouter navigation, particularly in Safari
 */
export const BrowserCompatibleRouter: React.FC<BrowserCompatibleRouterProps> = ({ children }) => {
  const [browserInfo, setBrowserInfo] = useState<BrowserContextType>({
    browserName: 'unknown',
    isSafari: false,
    isChrome: false,
    isFirefox: false
  });
  
  // Detect browser on mount
  useEffect(() => {
    const browser = getBrowserName();
    console.log(`[BROWSER] Detected browser: ${browser}`);
    
    setBrowserInfo({
      browserName: browser,
      isSafari: isSafari(),
      isChrome: isChrome(),
      isFirefox: isFirefox()
    });
    
    // Apply browser-specific fixes
    if (isSafari()) {
      console.log('[BROWSER] Applying Safari-specific navigation fixes');
      // Safari-specific navigation patches are in cross-browser-fix.ts
    }
  }, []);
  
  return (
    <BrowserContext.Provider value={browserInfo}>
      {children}
    </BrowserContext.Provider>
  );
};

/**
 * A Link replacement that works across all browsers
 * Use this instead of wouter's Link component
 */
export const BrowserSafeLink: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}> = ({ href, children, className, onClick }) => {
  const safeNavigate = useSafeNavigate();
  const { isSafari: isSafariBrowser } = useBrowser();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Call additional onClick handler if provided
    if (onClick) {
      onClick(e);
    }
    
    safeNavigate(href);
  };
  
  return (
    <a 
      href={href} 
      className={className}
      onClick={handleClick}
      // Add data attribute for debugging
      data-browser={getBrowserName()}
    >
      {children}
    </a>
  );
};

// Custom hook for cross-browser URL parameters
export function useURLParams() {
  const { browserName } = useBrowser();
  const location = typeof window !== 'undefined' ? window.location : { search: '' };
  
  // Parse URL params consistently across browsers
  const getParam = (name: string): string | null => {
    console.log(`[URL PARAMS] Getting param ${name} in ${browserName}`);
    
    try {
      const params = new URLSearchParams(location.search);
      return params.get(name);
    } catch (e) {
      console.error('[URL PARAMS] Error parsing URL params:', e);
      
      // Fallback method for older browsers
      const match = RegExp('[?&]' + name + '=([^&]*)').exec(location.search);
      return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    }
  };
  
  return { getParam };
}