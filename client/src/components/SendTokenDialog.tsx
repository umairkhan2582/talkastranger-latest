import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ethers } from 'ethers';
import { Loader2, AlertCircle } from 'lucide-react';
import { formatBalance, formatUsd } from '@/lib/utils';
import { useWallet } from '@/contexts/WalletContext';
import { queryClient } from '@/lib/queryClient';

// Define token interface
interface TokenForSending {
  id: number;
  name: string;
  symbol: string;
  balance: string;
  formattedBalance: string;
  decimals: number;
  tokenAddress: string;
  valueUsd?: number;
}

// Define props
interface SendTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTokenId?: number;
  refetchBalances?: () => void;
}

const SendTokenDialog = ({ isOpen, onClose, defaultTokenId, refetchBalances }: SendTokenDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tokens, setTokens] = useState<TokenForSending[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<number | undefined>(defaultTokenId);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  
  // Get user's wallet address
  const { address: walletAddress, sendToken: sendTokenFromWallet } = useWallet();

  // Fetch available tokens with TanStack Query
  const { data: balancesData, isLoading: isLoadingBalances, refetch } = useQuery({
    queryKey: ['/api/wallet/balances', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return { success: false, tokenData: [] };
      const response = await fetch(`/api/wallet/balances?address=${walletAddress}`);
      if (!response.ok) {
        throw new Error('Failed to fetch token balances');
      }
      return response.json();
    },
    enabled: isOpen && !!walletAddress,
    refetchInterval: isOpen ? 15000 : false, // Refresh when open
  });

  // Fetch current prices
  const { data: priceData } = useQuery({
    queryKey: ['/api/prices/current'],
    queryFn: async () => {
      const response = await fetch('/api/prices/current');
      if (!response.ok) {
        throw new Error('Failed to fetch token prices');
      }
      return response.json();
    },
    enabled: isOpen,
  });

  // Process token data when balances are loaded
  useEffect(() => {
    if (balancesData?.success && balancesData.tokenData) {
      console.log("[SendTokenDialog] Processing token data from BSCScan:", balancesData.tokenData);
      
      const tokensToProcess = balancesData.tokenData.length > 0 
        ? balancesData.tokenData 
        : [{
            tokenAddress: '0xd9541b134b1821736bd323135b8844d3ae408216',
            symbol: 'TAS',
            name: 'Talk A Stranger', // Using the official token name from contract
            balance: '0',
            decimals: '18'
          }];
      
      // Get TAS price from prices API
      const tasPrice = priceData?.data?.tasNativePrice || 0.001;
      
      const formattedTokens: TokenForSending[] = [];
      
      // Process each token
      tokensToProcess.forEach((token: any, index: number) => {
        // Use formattedBalance from API if available
        let balanceInUnits: string;
        
        // Check if we already have a formatted balance from the API
        if (token.formattedBalance) {
          balanceInUnits = token.formattedBalance;
          console.log(`[SendTokenDialog] Using pre-formatted ${token.symbol} balance: ${balanceInUnits}`);
        }
        // Otherwise format it if needed (if it's in wei format)
        else if (/^\d+$/.test(token.balance) && token.balance.length > 10) {
          try {
            balanceInUnits = ethers.utils.formatUnits(token.balance, token.decimals);
            console.log(`[SendTokenDialog] Formatted ${token.symbol} balance: ${balanceInUnits} (from ${token.balance})`);
          } catch (error) {
            console.error(`[SendTokenDialog] Error formatting balance for ${token.symbol}:`, error);
            balanceInUnits = '0';
          }
        } else {
          balanceInUnits = token.balance;
        }
        
        // Calculate USD value - use price from API if available
        let valueUsd = 0;
        if (token.price) {
          valueUsd = parseFloat(balanceInUnits) * token.price;
        } else if (token.symbol === 'TAS') {
          valueUsd = parseFloat(balanceInUnits) * tasPrice;
        }
        
        formattedTokens.push({
          id: index + 1,
          name: token.name || `${token.symbol} Token`, // Use name from contract or fallback
          symbol: token.symbol,
          balance: token.balance,
          formattedBalance: balanceInUnits,
          decimals: parseInt(token.decimals),
          tokenAddress: token.tokenAddress,
          valueUsd
        });
      });
      
      // Sort tokens by value (highest first)
      const sortedTokens = formattedTokens.sort((a: TokenForSending, b: TokenForSending) => {
        // Move tokens with actual balance to the top
        const aHasBalance = parseFloat(a.formattedBalance) > 0;
        const bHasBalance = parseFloat(b.formattedBalance) > 0;
        
        if (aHasBalance && !bHasBalance) return -1;
        if (!aHasBalance && bHasBalance) return 1;
        
        // Then sort by USD value
        return (b.valueUsd || 0) - (a.valueUsd || 0);
      });
      
      setTokens(sortedTokens);
      
      // Select default token or first token with balance
      if (!selectedTokenId || !tokens.find(t => t.id === selectedTokenId)) {
        const defaultToken = sortedTokens.find((t: TokenForSending) => parseFloat(t.formattedBalance) > 0);
        setSelectedTokenId(defaultToken?.id || sortedTokens[0]?.id);
      }
    }
  }, [balancesData, priceData, selectedTokenId]);
  
  // Find the currently selected token
  const selectedToken = tokens.find(token => token.id === selectedTokenId);
  
  // Validate amount input to check if it exceeds balance
  useEffect(() => {
    if (selectedToken && amount) {
      const inputAmount = parseFloat(amount);
      const tokenBalance = parseFloat(selectedToken.formattedBalance);
      
      if (inputAmount > tokenBalance) {
        setAmountError(`Exceeds available balance of ${selectedToken.formattedBalance} ${selectedToken.symbol}`);
      } else {
        setAmountError("");
      }
    } else {
      setAmountError("");
    }
  }, [amount, selectedToken]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedToken) {
      toast({
        title: "Error",
        description: "Please select a token to send",
        variant: "destructive",
      });
      return;
    }
    
    if (!recipient || !ethers.utils.isAddress(recipient)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid recipient address",
        variant: "destructive",
      });
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to send",
        variant: "destructive",
      });
      return;
    }
    
    if (amountError) {
      toast({
        title: "Invalid Amount",
        description: amountError,
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`Sending ${amount} ${selectedToken.symbol} to ${recipient}`);
      
      // Use the wallet's token sending function
      const result = await sendTokenFromWallet(
        recipient,
        amount,
        selectedToken.tokenAddress
      );
      
      if (result.success) {
        // No success message toast as per user request
        
        // Reset form fields
        setRecipient("");
        setAmount("");
        
        // Refresh balance data after transaction
        refetch();
        
        // Refresh parent component's data if a callback was provided
        if (refetchBalances) {
          refetchBalances();
        }
        
        // Invalidate relevant queries to ensure UI is updated everywhere
        queryClient.invalidateQueries({ queryKey: ['/api/wallet/balances'] });
        queryClient.invalidateQueries({ queryKey: ['/api/wallet/transactions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
        
        // Close the dialog
        onClose();
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error) {
      console.error("Transaction error:", error);
      
      // Check for insufficient BNB (gas) error
      let errorMsg = "An unknown error occurred";
      
      if (error instanceof Error) {
        const errorString = error.message.toLowerCase();
        
        if (errorString.includes("insufficient funds") || 
            errorString.includes("gas required exceeds") || 
            errorString.includes("intrinsic transaction cost")) {
          errorMsg = "You don't have enough BNB to handle the gas fees";
        } else {
          errorMsg = error.message;
        }
      }
      
      toast({
        title: "Transaction Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Send Tokens</DialogTitle>
          <DialogDescription>
            Enter the recipient address and amount to send.
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingBalances ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading token balances...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="token" className="text-right">
                  Token
                </Label>
                <Select 
                  value={selectedTokenId?.toString()} 
                  onValueChange={(value) => setSelectedTokenId(parseInt(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select token to send" />
                  </SelectTrigger>
                  <SelectContent>
                    {tokens.map(token => (
                      <SelectItem key={token.id} value={token.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{token.name} ({token.symbol})</span>
                          <span className="text-xs text-muted-foreground">
                            {token.formattedBalance} {token.symbol} 
                            {token.valueUsd ? ` (${formatUsd(token.valueUsd)})` : ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedToken && (
                <div className="text-sm text-muted-foreground mb-2">
                  Available: {selectedToken.formattedBalance} {selectedToken.symbol}
                  {selectedToken.valueUsd ? ` (${formatUsd(selectedToken.valueUsd)})` : ''}
                </div>
              )}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recipient" className="text-right">
                  To
                </Label>
                <Input
                  id="recipient"
                  placeholder="0x... (Recipient address)"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="col-span-3"
                  disabled={isLoading}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <div className="col-span-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      id="amount"
                      type="number"
                      step="any" 
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`flex-1 ${amountError ? 'border-red-300 focus-visible:ring-red-400' : ''}`}
                      disabled={isLoading}
                    />
                    {selectedToken && (
                      <div className="text-sm font-medium">{selectedToken.symbol}</div>
                    )}
                  </div>
                  
                  {amountError && (
                    <div className="flex items-center text-xs text-red-500">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {amountError}
                    </div>
                  )}
                </div>
              </div>
              
              {selectedToken && amount && !amountError && (
                <div className="mt-1 text-xs text-muted-foreground text-right">
                  Sending {parseFloat(amount).toFixed(6)} {selectedToken.symbol}
                  {selectedToken.valueUsd ? 
                    ` (${formatUsd(parseFloat(amount) * (selectedToken.valueUsd / parseFloat(selectedToken.formattedBalance)))})` : 
                    ''
                  }
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isLoading || !!amountError}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SendTokenDialog;