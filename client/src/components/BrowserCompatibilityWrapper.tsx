import React from 'react';

interface BrowserCompatibilityWrapperProps {
  pageName: string;
  children: React.ReactNode;
}

const BrowserCompatibilityWrapper: React.FC<BrowserCompatibilityWrapperProps> = ({ 
  pageName, 
  children 
}) => {
  return (
    <div className="browser-compatibility-wrapper">
      {children}
    </div>
  );
};

export default BrowserCompatibilityWrapper;