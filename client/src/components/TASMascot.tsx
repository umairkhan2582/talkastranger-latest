import React from 'react';

interface TASMascotProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  animated?: boolean;
  greeting?: boolean;
  showName?: boolean;
}

// Give our mascot a name - Tassy!
export const MASCOT_NAME = "Tassy";

export const TASMascot: React.FC<TASMascotProps> = ({ 
  size = 'md', 
  animated = true,
  greeting = false,
  showName = false
}) => {
  // Size mapping
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
    '2xl': 'w-48 h-48'
  };
  
  // Animation classes
  const animationClass = animated 
    ? 'transition-transform hover:scale-110 duration-300 ease-in-out hover:rotate-3' 
    : '';
    
  // Greeting bubble
  const renderGreeting = () => {
    if (!greeting) return null;
    
    return (
      <div className="absolute -top-12 -right-4 bg-indigo-100 dark:bg-indigo-900 rounded-xl px-3 py-2 shadow-md">
        <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Hello stranger!</div>
        <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-4 h-4 bg-indigo-100 dark:bg-indigo-900"></div>
      </div>
    );
  };

  return (
    <div className={`relative ${animationClass} flex flex-col items-center`}>
      {renderGreeting()}
      <div className={`relative ${sizeMap[size]}`}>
        {/* TAS Mascot - A friendly blockchain character that connects people */}
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Body - Circular with gradient */}
          <circle cx="100" cy="100" r="70" fill="url(#tasGradient)" />
          
          {/* Face */}
          <circle cx="100" cy="90" r="40" fill="#FFFFFF" />
          
          {/* Eyes */}
          <g className={animated ? 'animate-blink' : ''}>
            <circle cx="80" cy="80" r="8" fill="#333333" />
            <circle cx="120" cy="80" r="8" fill="#333333" />
            <circle cx="83" cy="77" r="3" fill="#FFFFFF" />
            <circle cx="123" cy="77" r="3" fill="#FFFFFF" />
          </g>
          
          {/* Smile */}
          <path d="M 75 100 Q 100 125 125 100" stroke="#333333" strokeWidth="4" fill="transparent" />
          
          {/* Blockchain elements */}
          <g className={animated ? 'animate-pulse' : ''}>
            <circle cx="145" cy="60" r="15" fill="url(#nodeGradient)" />
            <circle cx="55" cy="60" r="15" fill="url(#nodeGradient)" />
            <circle cx="60" cy="140" r="15" fill="url(#nodeGradient)" />
            <circle cx="140" cy="140" r="15" fill="url(#nodeGradient)" />
          </g>
          
          {/* Connection lines */}
          <line x1="60" y1="60" x2="100" y2="100" stroke="#6366F1" strokeWidth="2" strokeDasharray="5,5" />
          <line x1="145" y1="60" x2="100" y2="100" stroke="#6366F1" strokeWidth="2" strokeDasharray="5,5" />
          <line x1="60" y1="140" x2="100" y2="100" stroke="#6366F1" strokeWidth="2" strokeDasharray="5,5" />
          <line x1="140" y1="140" x2="100" y2="100" stroke="#6366F1" strokeWidth="2" strokeDasharray="5,5" />
          
          {/* Chat bubble icon */}
          <g transform="translate(85, 140) scale(0.2)">
            <path d="M80 0C35.888 0 0 30.072 0 67.2c0 17.136 7.712 32.88 20.672 45.024 2.368 2.232 3.136 5.568 1.968 8.544l-7.616 19.968c-1.76 4.624 2.496 9.184 7.264 7.792l25.984-7.552a7.985 7.985 0 0 1 5.792.768C63.872 147.888 71.824 150.4 80 150.4c44.112 0 80-30.096 80-67.2S124.112 0 80 0z" fill="#A855F7" />
            <path d="M36 67.2A9.6 9.6 0 0 1 45.6 57.6h68.8a9.6 9.6 0 1 1 0 19.2h-68.8A9.6 9.6 0 0 1 36 67.2zM36 96a9.6 9.6 0 0 1 9.6-9.6h38.4a9.6 9.6 0 1 1 0 19.2h-38.4A9.6 9.6 0 0 1 36 96z" fill="white" />
          </g>
          
          {/* Gradients */}
          <defs>
            <linearGradient id="tasGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
            <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#7E22CE" />
            </linearGradient>
            
            {/* Animation definitions */}
            <style>
              {`
                @keyframes blink {
                  0%, 90%, 100% { transform: scaleY(1); }
                  95% { transform: scaleY(0.1); }
                }
                .animate-blink {
                  animation: blink 3s infinite;
                  transform-origin: center;
                }
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.6; }
                }
                .animate-pulse {
                  animation: pulse 2s infinite;
                }
              `}
            </style>
          </defs>
        </svg>
      </div>
      
      {/* Show mascot name if requested */}
      {showName && (
        <div className="mt-2 text-center">
          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full">{MASCOT_NAME}</span>
        </div>
      )}
    </div>
  );
};

export default TASMascot;