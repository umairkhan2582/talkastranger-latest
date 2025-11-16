import { useState, useEffect } from 'react';
import { useTokenUpdates } from '@/contexts/TokenUpdateContext';
import { useWallet } from '@/contexts/WalletContext';
import { TokenPriceDisplay } from './TokenPriceDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { startPerformanceMetric, endPerformanceMetric } from '@/lib/performance-optimizations';

interface TokenTradePanelProps {
  tokenId: number;
  tokenSymbol: string;
  tokenName: string;
  initialPrice?: number;
  userBalance?: number;
  onTradeComplete?: () => void;
}

export function TokenTradePanel({
  tokenId,
  tokenSymbol,
  tokenName,
  initialPrice,
  userBalance = 0,
  onTradeComplete
}: TokenTradePanelProps) {
  const { toast } = useToast();
  const { tokenUpdates, isWebSocketConnected, sendTradeRequest } = useTokenUpdates();
  const { address, isConnected } = useWallet();
  
  const [amount, setAmount] = useState<string>('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(initialPrice || null);
  const [totalValue, setTotalValue] = useState<number>(0);
  
  // Update current price when token updates change
  useEffect(() => {
    if (tokenUpdates[tokenId]) {
      setCurrentPrice(tokenUpdates[tokenId].price);
    }
  }, [tokenUpdates, tokenId]);
  
  // Calculate total value when amount or price changes
  useEffect(() => {
    const amountNum = parseFloat(amount);
    if (!isNaN(amountNum) && currentPrice !== null) {
      setTotalValue(amountNum * currentPrice);
    } else {
      setTotalValue(0);
    }
  }, [amount, currentPrice]);
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimals
    if (/^[0-9]*\.?[0-9]*$/.test(value) || value === '') {
      setAmount(value);
    }
  };
  
  const handleMaxClick = () => {
    if (tradeType === 'sell') {
      // Set max amount to user's token balance
      setAmount(userBalance.toString());
    } else {
      // Set max amount based on available TAS (simulated here)
      const maxTokensCanBuy = 1000; // In a real app, this would be calculated
      setAmount(maxTokensCanBuy.toString());
    }
  };
  
  const handleSubmit = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to trade tokens.",
        variant: "destructive"
      });
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to trade.",
        variant: "destructive"
      });
      return;
    }
    
    if (tradeType === 'sell' && amountNum > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${userBalance} ${tokenSymbol} available to sell.`,
        variant: "destructive"
      });
      return;
    }
    
    if (!isWebSocketConnected) {
      toast({
        title: "Not Connected",
        description: "Please wait until connection to trading network is established.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Start performance timing
      startPerformanceMetric(`${tradeType}_${tokenSymbol}`);
      
      // Send trade request via WebSocket
      const success = sendTradeRequest(tokenId, amountNum, tradeType);
      
      if (!success) {
        toast({
          title: "Trade Failed",
          description: "Unable to send trade request. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      // In a real implementation, we would wait for trade confirmation
      // For now, simulate a successful trade after a delay
      setTimeout(() => {
        // End performance timing
        const duration = endPerformanceMetric(`${tradeType}_${tokenSymbol}`);
        
        toast({
          title: "Trade Successful",
          description: `Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${amountNum} ${tokenSymbol} ${
            duration ? `in ${duration.toFixed(2)}ms` : ''
          }`,
          variant: "default"
        });
        
        // Reset form
        setAmount('');
        
        // Notify parent component
        if (onTradeComplete) {
          onTradeComplete();
        }
        
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      console.error("[TokenTradePanel] Trade error:", error);
      toast({
        title: "Trade Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trade {tokenSymbol}</span>
          <TokenPriceDisplay
            tokenId={tokenId}
            initialPrice={initialPrice}
            size="lg"
            showChange={true}
          />
        </CardTitle>
        <CardDescription>
          {tokenName} • {isWebSocketConnected ? 
            <span className="text-green-500">Live prices</span> : 
            <span className="text-yellow-500">Connecting...</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buy" onValueChange={(value) => setTradeType(value as 'buy' | 'sell')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>
          
          <TabsContent value="buy" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="buy-amount" className="text-sm font-medium">
                  Amount to Buy
                </label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleMaxClick}
                  className="h-6 text-xs"
                  type="button"
                >
                  Max
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="buy-amount"
                  value={amount}
                  onChange={handleAmountChange}
                  className="pr-16"
                  placeholder="0.0"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <span className="text-sm text-gray-500">{tokenSymbol}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Price</span>
                <span>{currentPrice !== null ? `$${currentPrice.toFixed(6)}` : '--'}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Total Value</span>
                <span>${totalValue.toFixed(2)}</span>
              </div>
              {tradeType === 'buy' && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Network Fee</span>
                  <span>$0.25</span>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="sell" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="sell-amount" className="text-sm font-medium">
                  Amount to Sell
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    Balance: {userBalance} {tokenSymbol}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMaxClick}
                    className="h-6 text-xs"
                    type="button"
                  >
                    Max
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Input
                  id="sell-amount"
                  value={amount}
                  onChange={handleAmountChange}
                  className="pr-16"
                  placeholder="0.0"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <span className="text-sm text-gray-500">{tokenSymbol}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Price</span>
                <span>{currentPrice !== null ? `$${currentPrice.toFixed(6)}` : '--'}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Total Value</span>
                <span>${totalValue.toFixed(2)}</span>
              </div>
              {tradeType === 'sell' && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Network Fee</span>
                  <span>$0.15</span>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        {tradeType === 'buy' ? (
          <Button
            disabled={!isConnected || !amount || isSubmitting || !isWebSocketConnected}
            onClick={handleSubmit}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowDownRight className="mr-2 h-4 w-4" />
                Buy {tokenSymbol}
              </>
            )}
          </Button>
        ) : (
          <Button
            disabled={!isConnected || !amount || isSubmitting || parseFloat(amount) > userBalance || !isWebSocketConnected}
            onClick={handleSubmit}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Sell {tokenSymbol}
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}