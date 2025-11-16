import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from "wouter";
import { ethers } from 'ethers';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  ExternalLink,
  QrCode,
  Copy,
  Loader2,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatAddress, formatUsd, formatBalance } from '../lib/utils';
import { formatDate } from '../lib/date';
import SendTokenDialog from './SendTokenDialog';
import ReceiveTokenDialog from './ReceiveTokenDialog';

// Define TokenHoldingsSection props
interface TokenHoldingsSectionProps {
  address: string | null;
}

// Define types
interface Token {
  id: number;
  name: string;
  symbol: string;
  decimals: number;
  contractAddress: string;
  price?: number;
}

interface TokenWithBalance extends Token {
  balance: string;
  valueUsd: number;
}

interface TokenApproval {
  tokenAddress: string;
  spenderAddress: string;
  spenderName: string;
  allowance: string;
  tokenSymbol: string;
  tokenDecimals: number;
}

interface Transaction {
  hash: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  amount: string;
  from: string;
  to: string;
  timestamp: number;
  type: 'send' | 'receive' | 'approval' | 'other';
}

const TokenHoldingsSection = ({ address }: TokenHoldingsSectionProps) => {
  const { toast } = useToast();
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  
  // Helper function to ensure TAS token is always included
  function ensureTASToken(): Token[] {
    const tasTokenAddress = '0xd9541b134b1821736bd323135b8844d3ae408216';
    return [{
      id: 1,
      name: 'TAS Token',
      symbol: 'TAS',
      decimals: 18,
      contractAddress: tasTokenAddress,
      price: 0.001, // Current TAS price
    }];
  }
  
  // Get address from props - this should be the connected user's wallet address
  const walletAddress = address;
  
  // If there's no address from props, try to get from local storage as fallback
  useEffect(() => {
    if (!address) {
      try {
        const savedWallet = localStorage.getItem('tasWallet');
        if (savedWallet) {
          const walletData = JSON.parse(savedWallet);
          if (walletData.address) {
            console.log('[TokenHoldingsSection] Using wallet address from localStorage:', walletData.address);
          }
        }
      } catch (error) {
        console.error('Error loading wallet address:', error);
      }
    }
  }, [address]);
  
  // Fetch token data
  const { data: tokensData, isLoading: isLoadingTokens, refetch: refetchTokens } = useQuery({
    queryKey: ['/api/wallet/balances', address],
    queryFn: async () => {
      const response = await fetch(`/api/wallet/balances?address=${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch token balances');
      }
      console.log("[TokenHoldingsSection] TokensData response:", await response.clone().json());
      return response.json();
    },
    refetchInterval: 10000, // refetch every 10 seconds
    staleTime: 5000, // consider data stale after 5 seconds
  });
  
  // Fetch transaction history
  const { data: txData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['/api/wallet/transactions', address],
    queryFn: async () => {
      const response = await fetch(`/api/wallet/transactions?address=${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
    refetchInterval: 30000, // refetch every 30 seconds
  });
  
  // Fetch token approvals
  const { data: approvalsData, isLoading: isLoadingApprovals } = useQuery({
    queryKey: ['/api/wallet/approvals', address],
    queryFn: async () => {
      const response = await fetch(`/api/wallet/approvals?address=${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch approvals');
      }
      return response.json();
    },
    refetchInterval: 60000, // refetch every minute
  });
  
  // Extract data from API responses
  const balances = tokensData?.balances || {};
  const tokenDataDetails = tokensData?.tokenData || [];
  const transactions: Transaction[] = txData?.transactions || [];
  const approvals: TokenApproval[] = approvalsData?.approvals || [];
  
  // Log wallet address and response data for debugging
  useEffect(() => {
    console.log("[TokenHoldingsSection] Connected wallet address:", address);
    console.log("[TokenHoldingsSection] TokensData response:", tokensData);
    console.log("[TokenHoldingsSection] TokenDataDetails:", tokenDataDetails);
    console.log("[TokenHoldingsSection] Balances:", balances);
  }, [address, tokensData, tokenDataDetails, balances]);
  
  // Get token data from the /api/tokens endpoint
  const { data: tokenListData } = useQuery({
    queryKey: ['/api/tokens'],
    queryFn: async () => {
      const response = await fetch('/api/tokens');
      if (!response.ok) {
        throw new Error('Failed to fetch token list');
      }
      return response.json();
    },
  });
  
  // Get current token prices
  const { data: priceData } = useQuery({
    queryKey: ['/api/prices/current'],
    queryFn: async () => {
      const response = await fetch('/api/prices/current');
      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }
      return response.json();
    },
    refetchInterval: 30000, // refetch every 30 seconds
  });
  
  // Extract tokens and prices from API responses
  const tokenList = tokenListData?.myTokens || [];
  const tasNativePrice = priceData?.data?.tasNativePrice || 0.001;
  
  // Process token balances with real data
  const tokens: TokenWithBalance[] = [];
  
  // Define BSCToken type for better type safety
  interface BSCToken {
    tokenAddress: string;
    name: string;
    symbol: string;
    decimals: string;
    balance: string;
    formattedBalance?: string;
    price?: number;
    isNative?: boolean;
  }
  
  // Process all tokens from BSCScan as they have the most accurate data
  if (tokenDataDetails && tokenDataDetails.length > 0) {
    console.log("[TokenHoldingsSection] Processing token data from BSCScan:", tokenDataDetails);
    
    tokenDataDetails.forEach((bscToken: any, index: number) => {
      // Skip tokens with zero balance unless it's TAS or BNB
      const isZeroBalance = bscToken.balance === '0' || bscToken.formattedBalance === '0';
      if (isZeroBalance && 
          bscToken.symbol !== 'TAS' && 
          bscToken.symbol !== 'BNB' && 
          !bscToken.isNative) {
        return;
      }
      
      // Use formattedBalance if it's provided by the API
      let formattedBalance = bscToken.formattedBalance || bscToken.balance;
      
      // If we still need to format it (it's still in wei format)
      if (!/\./.test(formattedBalance) && /^\d+$/.test(formattedBalance) && formattedBalance.length > 10) {
        try {
          formattedBalance = ethers.utils.formatUnits(
            formattedBalance, 
            parseInt(bscToken.decimals)
          );
          console.log(`[TokenHoldingsSection] Formatted ${bscToken.symbol} balance: ${formattedBalance}`);
        } catch (error) {
          console.error(`[TokenHoldingsSection] Error formatting balance for ${bscToken.symbol}:`, error);
        }
      }
      
      // Get appropriate price, use the price from API if available
      let price = bscToken.price || 0;
      if (bscToken.symbol === 'TAS' && !price) {
        price = tasNativePrice;
      } else if (bscToken.symbol === 'BNB' && !price) {
        price = 350; // Approximate BNB price 
      }
      
      const valueUsd = parseFloat(formattedBalance) * price;
      
      tokens.push({
        id: index + 1, // Generate a sequential ID
        name: bscToken.name,
        symbol: bscToken.symbol,
        decimals: parseInt(bscToken.decimals),
        contractAddress: bscToken.tokenAddress,
        price,
        balance: formattedBalance,
        valueUsd
      });
    });
  }
  
  // Now add any tokens from our API that aren't already in the list
  if (tokenList && tokenList.length > 0) {
    tokenList.forEach((token: Token) => {
      // Check if this token is already in our list
      const exists = tokens.some(t => 
        t.contractAddress.toLowerCase() === token.contractAddress.toLowerCase()
      );
      
      if (!exists) {
        // Get balance for this token (default to 0 if not found)
        const balance = balances[token.contractAddress] || '0';
        
        // Set price based on token (TAS = tasNativePrice, others from API or default to 0)
        let price = 0;
        if (token.symbol === 'TAS') {
          price = tasNativePrice;
        } else if (token.price) {
          price = token.price;
        }
        
        // Calculate USD value
        const valueUsd = parseFloat(balance) * price;
        
        tokens.push({
          ...token,
          balance,
          valueUsd
        });
      }
    });
  }
  
  // Always ensure TAS token is included
  if (tokens.length === 0 || !tokens.some((t: TokenWithBalance) => t.symbol === 'TAS')) {
    const tasTokenBase = ensureTASToken()[0];
    // Use the latest price data
    const currentPrice = tasNativePrice || 0.001;
    
    // Try to get TAS balance from tokenDataDetails first
    let tasBalance = '0';
    const tasTokenInBSC = tokenDataDetails?.find((t: any) => 
      t.tokenAddress.toLowerCase() === tasTokenBase.contractAddress.toLowerCase()
    );
    
    if (tasTokenInBSC) {
      try {
        tasBalance = ethers.utils.formatUnits(
          tasTokenInBSC.balance,
          parseInt(tasTokenInBSC.decimals)
        );
        console.log('[TokenHoldingsSection] Found TAS token in BSC data with balance:', tasBalance);
      } catch (error) {
        console.error('[TokenHoldingsSection] Error formatting TAS balance:', error);
        tasBalance = '0';
      }
    } else {
      // Fall back to balances from API
      tasBalance = balances[tasTokenBase.contractAddress] || '0';
      console.log('[TokenHoldingsSection] Using API balance for TAS:', tasBalance);
    }
    
    const tasValueUsd = parseFloat(tasBalance) * currentPrice;
    
    // Create a complete token with all properties set
    const tasToken: TokenWithBalance = {
      ...tasTokenBase,
      price: currentPrice,
      balance: tasBalance,
      valueUsd: tasValueUsd
    };
    
    console.log('[TokenHoldingsSection] Adding TAS token with data:', tasToken);
    tokens.push(tasToken);
  }
  
  // Calculate total portfolio value
  const totalPortfolioValue = tokens.reduce((total, token) => {
    return total + (token.valueUsd || 0);
  }, 0);
  
  // Sort tokens by value (highest first)
  const sortedTokens = [...tokens].sort((a, b) => {
    return (b.valueUsd || 0) - (a.valueUsd || 0);
  });
  
  // Handle send token action
  const handleSendToken = (tokenId: number) => {
    setSelectedTokenId(tokenId);
    setIsSendDialogOpen(true);
  };
  
  // Show loading state
  if (isLoadingTokens && tokens.length === 0) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-primary">Token Holdings</CardTitle>
          <CardDescription>Loading your balances...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Copy address to clipboard
  const copyAddressToClipboard = () => {
    if (!address) {
      toast({
        title: "No address available",
        description: "Cannot copy wallet address",
        variant: "destructive",
      });
      return;
    }
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(address)
        .then(() => {
          // No success message toast as per user request
        })
        .catch((err) => {
          console.error('Could not copy text: ', err);
          toast({
            title: "Copy failed",
            description: "Please copy the address manually",
            variant: "destructive",
          });
        });
    } else {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        toast({
          title: "Address copied",
          description: "Wallet address copied to clipboard",
        });
      } catch (err) {
        toast({
          title: "Copy failed",
          description: "Please copy the address manually",
          variant: "destructive",
        });
      }
      
      document.body.removeChild(textArea);
    }
  };

  return (
    <div>
      {/* Wallet Address Display */}
      <div className="mb-4 p-3 border border-green-200 rounded-lg bg-green-50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-sm font-medium text-green-800">Wallet Address</h3>
            <div className="flex items-center mt-1">
              <p className="text-xs text-green-700 font-mono truncate max-w-[160px] sm:max-w-[240px]">
                {address ? formatAddress(address, 4, 4) : 'No address available'}
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 ml-1 text-green-600" 
                onClick={copyAddressToClipboard}
                title="Copy address"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setIsReceiveDialogOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center text-xs bg-white border-green-300 text-green-700 hover:bg-green-50"
            >
              <QrCode className="h-3.5 w-3.5 mr-1" />
              Receive
            </Button>
            <Button 
              size="sm"
              onClick={() => {
                setSelectedTokenId(null);
                setIsSendDialogOpen(true);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center text-xs bg-green-600 hover:bg-green-700 text-white"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Send
            </Button>
          </div>
        </div>
      </div>
      
      {/* Header with tokens title and refresh button */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-lg font-semibold text-green-800">Token Holdings</h3>
          <p className="text-sm text-green-700">Your token balances</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            refetchTokens();
            toast({
              title: "Refreshing balances",
              description: "Your token balances are being updated",
            });
          }}
          className="h-8 w-8 p-0 rounded-full"
          title="Refresh balances"
        >
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 1-9 9" />
            <path d="M3 12a9 9 0 0 1 9-9" />
            <path d="M12 21a9 9 0 0 0 9-9" />
            <path d="M12 3a9 9 0 0 0-9 9" />
            <path d="M13 17l-2 2 2 2" />
            <path d="M11 8l2-2-2-2" />
          </svg>
        </Button>
      </div>
      
      {/* Tokens list */}
      {sortedTokens.length > 0 ? (
        <div>
          <div className="mb-4 flex justify-between p-2 bg-green-100 rounded-md">
            <span className="text-sm font-medium text-green-800">Total Portfolio Value</span>
            <span className="text-sm font-semibold text-green-800">{formatUsd(totalPortfolioValue)}</span>
          </div>
          
          <div className="space-y-2">
            {sortedTokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between p-3 rounded-md border border-green-200 bg-white"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-800">
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{token.name}</h4>
                    <p className="text-xs text-green-700">{token.symbol}</p>
                  </div>
                </div>
                
                <div className="space-y-1 text-right">
                  <p className="font-medium text-sm">{formatBalance(token.balance)} {token.symbol}</p>
                  {token.price && (
                    <p className="text-xs text-green-700">{formatUsd(token.valueUsd)}</p>
                  )}
                </div>
                
                <div className="ml-4 flex space-x-1">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 text-green-600 hover:text-green-800 hover:bg-green-50" 
                    onClick={() => handleSendToken(token.id)}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 text-green-600 hover:text-green-800 hover:bg-green-50"
                    asChild
                  >
                    <Link to={`/token/${token.id}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">You don't have any tokens yet</p>
          <div className="flex justify-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsReceiveDialogOpen(true)}
              className="flex items-center"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Receive
            </Button>
            <Button asChild>
              <Link to="/buy-tokens">
                <Plus className="h-4 w-4 mr-2" />
                Buy Tokens
              </Link>
            </Button>
          </div>
        </div>
      )}
      
      {/* Send token dialog */}
      {isSendDialogOpen && (
        <SendTokenDialog
          isOpen={isSendDialogOpen}
          onClose={() => setIsSendDialogOpen(false)}
          defaultTokenId={selectedTokenId || undefined}
          refetchBalances={refetchTokens}
        />
      )}
      
      {/* Receive token dialog */}
      {isReceiveDialogOpen && (
        <ReceiveTokenDialog
          isOpen={isReceiveDialogOpen}
          onClose={() => setIsReceiveDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default TokenHoldingsSection;