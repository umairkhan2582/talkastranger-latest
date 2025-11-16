import React, { useState, useEffect } from 'react';
import { useTASChain } from '@/contexts/TASChainContext';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { ExternalLink, Key, Lock, Copy, RefreshCw, AlertCircle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

interface TASWalletProps {
  className?: string;
  showBalance?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

const TASWallet: React.FC<TASWalletProps> = ({
  className = '',
  showBalance = true,
  showActions = true,
  compact = false
}) => {
  const { isConnected, address, balance, refreshBalance, explorer, isLoading } = useTASChain();
  const { openConnectModal } = useWallet();
  const { toast } = useToast();
  const { translate } = useLanguage();
  
  const [privateKeyVisible, setPrivateKeyVisible] = useState(false);
  const [usdBalance, setUsdBalance] = useState<string | null>(null);
  const [hasPrivateKey, setHasPrivateKey] = useState(false);
  
  // Check if we have a private key stored
  useEffect(() => {
    const savedWallet = localStorage.getItem('tasWallet');
    if (savedWallet) {
      try {
        const parsedWallet = JSON.parse(savedWallet);
        if (parsedWallet.privateKey) {
          setHasPrivateKey(true);
        }
      } catch (e) {
        console.error('Error parsing wallet data', e);
      }
    }
  }, []);
  
  // Calculate USD balance
  useEffect(() => {
    if (balance) {
      const tasPrice = 0.15; // Example TAS price in USD
      const balanceNum = parseFloat(balance);
      const usdValue = (balanceNum * tasPrice).toFixed(2);
      setUsdBalance(usdValue);
    }
  }, [balance]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: translate('address_copied') || 'Address Copied',
        description: translate('address_copied_description') || 'Wallet address copied to clipboard',
      });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const revealPrivateKey = async () => {
    // In a real app, you'd prompt for password here
    const savedWallet = localStorage.getItem('tasWallet');
    if (savedWallet) {
      try {
        const parsedWallet = JSON.parse(savedWallet);
        setPrivateKeyVisible(true);
        
        // Auto-hide after 30 seconds for security
        setTimeout(() => {
          setPrivateKeyVisible(false);
        }, 30000);
      } catch (e) {
        console.error('Error parsing wallet', e);
        toast({
          title: translate('error') || 'Error',
          description: translate('wallet_error') || 'Could not access wallet details',
          variant: 'destructive',
        });
      }
    }
  };

  if (!isConnected) {
    return (
      <Card className={`${className} border-dashed`}>
        <CardHeader className={compact ? 'p-4' : 'p-6'}>
          <CardTitle className={compact ? 'text-lg' : 'text-xl'}>
            {translate('connectwallet') || 'Connect TAS Wallet'}
          </CardTitle>
          <CardDescription>
            {translate('wallet_required') || 'Connect your wallet to create and trade tokens'}
          </CardDescription>
        </CardHeader>
        <CardFooter className={compact ? 'p-4 pt-0' : 'p-6 pt-0'}>
          <Button onClick={openConnectModal} className="w-full">
            {translate('connectwallet') || 'Connect Wallet'}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className={compact ? 'p-4 pb-2' : 'p-6 pb-3'}>
        <CardTitle className={compact ? 'text-lg' : 'text-xl'}>
          {translate('taswallet') || 'TAS Chain Wallet'}
        </CardTitle>
        {!compact && (
          <CardDescription>
            {translate('wallet_description') || 'Manage your TAS tokens for creating and trading on TAS Chain'}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={compact ? 'p-4 pt-0' : 'p-6 pt-0'}>
        <div className="space-y-4">
          {/* Wallet Address */}
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              {translate('wallet_address') || 'Wallet Address'}:
            </div>
            <div className="flex items-center justify-between bg-secondary/30 p-2 rounded-md">
              <code className="text-xs font-mono">
                {address ? formatAddress(address) : '...'}
              </code>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={copyAddress}
                  title={translate('copy_address') || 'Copy Address'}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => window.open(explorer.getAddressUrl(address!), '_blank')}
                  title={translate('view_on_explorer') || 'View on Explorer'}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Wallet Balance */}
          {showBalance && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {translate('balance') || 'Balance'}:
              </div>
              <div className="bg-secondary/30 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-semibold">
                      {isLoading ? '...' : balance ? `${parseFloat(balance).toFixed(4)} TAS` : '0 TAS'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {usdBalance ? `≈ $${usdBalance} USD` : '$0.00 USD'}
                    </div>
                  </div>
                  {showActions && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={refreshBalance}
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      {translate('refresh') || 'Refresh'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Private Key Section - Only shown when the user has a TAS Chain created wallet */}
          {hasPrivateKey && showActions && (
            <div>
              <div className="text-sm text-muted-foreground mb-1 flex items-center">
                <Key className="h-3.5 w-3.5 mr-1" />
                {translate('private_key') || 'Private Key'}:
              </div>
              <div className="bg-secondary/30 p-3 rounded-md">
                {privateKeyVisible ? (
                  <div className="space-y-1">
                    <code className="text-xs font-mono block w-full overflow-x-auto">
                      {/* This would show the actual key in a real implementation */}
                      0x7f1d53b44c8b10e484cf4e2440c529bc4c1f3a35b6334711b0ce7d0d2fc392e9
                    </code>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-amber-600 dark:text-amber-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {translate('auto_hide') || 'Auto-hiding in 30 seconds'}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setPrivateKeyVisible(false)}
                      >
                        <Lock className="h-3.5 w-3.5 mr-1" />
                        {translate('hide') || 'Hide'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="text-sm">••••••••••••••••••••••</div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={revealPrivateKey}
                    >
                      {translate('reveal') || 'Reveal'}
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {translate('never_share_key') || 'Never share your private key with anyone'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      {showActions && !compact && (
        <CardFooter className="flex flex-col gap-2">
          <Button 
            className="w-full" 
            onClick={() => window.location.href = '/buy-tokens'}
          >
            {translate('buy_tas_tokens') || 'Buy TAS Tokens'}
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => window.location.href = '/create-token'}
          >
            {translate('create_token') || 'Create Token'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default TASWallet;