// This file is being replaced by WalletContext.tsx. 
// We keep this file to maintain compatibility during transition.
// Import the new context from WalletContext.tsx 
import React from 'react';
import { useWallet as useWalletFromContext } from '@/contexts/WalletContext';

// Re-export the hook as useWallet
export const useWallet = useWalletFromContext;

// This dummy component is here only for type compatibility
// The WalletProvider from WalletContext.tsx will be used instead
export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // This function is not actually used
  return React.createElement(React.Fragment, null, children);
};