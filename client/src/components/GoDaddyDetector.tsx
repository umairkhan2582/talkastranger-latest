/**
 * GoDaddy Masked URL Handler Component
 * 
 * This component specifically handles the case when a user accesses the site
 * through GoDaddy's masked URL forwarding (like talkastranger.com or tasonscan.com)
 * and ensures proper mobile rendering.
 */
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function GoDaddyDetector() {
  const [isMaskedDomain, setIsMaskedDomain] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMessage, setShowMessage] = useState(true);
  
  useEffect(() => {
    // Check for masked domain indicators
    const checkForMaskedDomain = () => {
      const url = window.location.href.toLowerCase();
      const host = window.location.host.toLowerCase();
      const referrer = document.referrer.toLowerCase();
      
      // Check URL, host and referrer for talkastranger.com or tasonscan.com
      const maskedDomainDetected = 
        url.includes('talkastranger.com') || 
        url.includes('tasonscan.com') || 
        host.includes('talkastranger.com') || 
        host.includes('tasonscan.com') ||
        referrer.includes('talkastranger.com') || 
        referrer.includes('tasonscan.com');
      
      // Detect mobile device
      const mobileDetected = 
        /android|iphone|ipod|ipad|mobile|mobi/i.test(navigator.userAgent.toLowerCase()) || 
        (window.innerWidth <= 768) || 
        (typeof window.orientation !== 'undefined') ||
        navigator.maxTouchPoints > 0;
      
      setIsMaskedDomain(maskedDomainDetected);
      setIsMobile(mobileDetected);
      
      // If we're on a masked domain
      if (maskedDomainDetected) {
        document.documentElement.classList.add('masked-domain');
        
        // Additional fixes for mobile specifically
        if (mobileDetected) {
          document.documentElement.classList.add('masked-mobile');
          
          // Force viewport immediately
          const viewportMeta = document.querySelector('meta[name="viewport"]');
          if (viewportMeta) {
            viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
          }
          
          // Set cookies for server-side detection
          document.cookie = "taschain_mobile=true; path=/; max-age=86400";
          document.cookie = "masked_domain=true; path=/; max-age=86400";
        }
      }
    };
    
    // Run detection immediately
    checkForMaskedDomain();
    
    // Also check on resize for orientation changes
    window.addEventListener('resize', checkForMaskedDomain);
    
    return () => {
      window.removeEventListener('resize', checkForMaskedDomain);
    };
  }, []);
  
  // Only show this component if we're on a masked domain AND mobile
  if (!isMaskedDomain || !isMobile || !showMessage) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 p-3 bg-black/80 text-white z-50 text-sm font-medium">
      <div className="flex items-center justify-between">
        <div>
          For best experience, please open in Safari.
        </div>
        <button 
          onClick={() => setShowMessage(false)}
          className="text-white ml-2"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}