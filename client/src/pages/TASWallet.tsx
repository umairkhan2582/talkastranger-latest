import React from 'react';
import BrowserCompatibilityWrapper from '@/components/BrowserCompatibilityWrapper';
import PageNumberDebug from '@/components/PageNumberDebug';

const TASWalletPage = () => {
  return (
    <BrowserCompatibilityWrapper pageName="TASWallet">
      <div className="container mx-auto p-4">
        <PageNumberDebug pageNumber={1} pageName="TAS Wallet" />
        
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md border">
          <h2 className="text-2xl font-bold text-center mb-6">Welcome to TAS Wallet</h2>
          <p className="text-center text-lg mb-4">
            Simplified wallet interface for testing
          </p>
          <div className="bg-blue-50 p-4 rounded-md text-center">
            <p className="font-bold">Browser: {navigator.userAgent}</p>
            <p className="text-sm mt-2">Current time: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    </BrowserCompatibilityWrapper>
  );
};

export default TASWalletPage;