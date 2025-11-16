import { useEffect, useState } from 'react';
import { Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';

/**
 * TASonscan Landing Page
 * This page handles automatic redirection for TASonscan.com visitors to the explorer
 * Works alongside the domain-based detection in App.tsx
 */
export default function TASonscanLanding() {
  const [isRedirecting, setIsRedirecting] = useState(true);
  
  useEffect(() => {
    // Check if we're on TASonscan.com domain
    const hostname = window.location.hostname;
    const isTASonscan = hostname === 'tasonscan.com' || hostname.includes('tasonscan');
    
    if (isTASonscan) {
      console.log('[TASonscan] Landing page detected TASonscan domain, redirecting to explorer');
      
      // Set a small delay before redirecting to show loading state
      const timer = setTimeout(() => {
        window.location.href = '/explorer';
      }, 800);
      
      return () => clearTimeout(timer);
    } else {
      // If not on TASonscan domain, just go to the explorer page
      setIsRedirecting(false);
    }
  }, []);
  
  if (!isRedirecting) {
    return <Redirect to="/explorer" />;
  }
  
  // Show a clean loading screen while redirecting
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          TASonscan Explorer
        </h1>
        <p className="text-gray-400 mb-8">The official explorer for TASChain blockchain</p>
        
        <div className="flex justify-center mb-6">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
        
        <p className="text-gray-500">Redirecting to explorer...</p>
      </div>
    </div>
  );
}