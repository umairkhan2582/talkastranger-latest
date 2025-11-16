import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { safeNavigate } from "@/lib/browser-utils";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, ChevronDown, TrendingUp, Award, Clock, Wallet, DollarSign,
  ArrowUpDown, Info, ArrowRight, BarChart3, MessageSquare,
  Sparkles, Users, Plus, ExternalLink
} from "lucide-react";

// Token type definition
interface Token {
  id: number;
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  percentChange24h: number;
  volumeTAS: number;
  creator: string;
  createdAt: string;
  logoUrl?: string;
  description?: string;
}

// Token Card Component
const TokenCard = ({ token, onBuy, onSell }: { token: Token, onBuy: (token: Token) => void, onSell: (token: Token) => void }) => {
  const [, navigate] = useLocation();
  
  const handleViewToken = () => {
    safeNavigate(`/token/${token.id}`);
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            {token.logoUrl ? (
              <img src={token.logoUrl} alt={token.name} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-sky-400 flex items-center justify-center text-white font-bold text-xs">
                {token.symbol.slice(0, 2)}
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{token.name}</CardTitle>
              <CardDescription>
                <span className="flex items-center">
                  ${token.symbol}
                  <Badge variant="outline" className="ml-2 text-xs">TAS Chain</Badge>
                </span>
              </CardDescription>
            </div>
          </div>
          <Badge 
            className={`${token.percentChange24h >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            {token.percentChange24h >= 0 ? '+' : ''}{token.percentChange24h}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-500">Price</span>
          <span className="font-semibold">${token.price.toFixed(5)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-500">Market Cap</span>
          <span>${token.marketCap.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500">24h Volume</span>
          <span>${token.volumeTAS.toLocaleString()}</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-2 pt-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => onBuy(token)}
        >
          Buy
        </Button>
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => onSell(token)}
        >
          Sell
        </Button>
        <Button 
          variant="outline" 
          className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-indigo-700 border-indigo-200 mt-2"
          onClick={handleViewToken}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          View Token Page
        </Button>
      </CardFooter>
    </Card>
  );
};

// Trade Dialog Component
const TradeDialog = ({ 
  isOpen, 
  onClose, 
  token, 
  action, 
  userTokens 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  token?: Token, 
  action: 'buy' | 'sell', 
  userTokens: any[] 
}) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(1);
  const [sliderValue, setSliderValue] = useState<number[]>([10]);
  
  if (!token) return null;
  
  const tasBalance = userTokens.find(t => t.symbol === "TAS")?.balance || 0;
  const tokenBalance = userTokens.find(t => t.symbol === token.symbol)?.balance || 0;
  
  const maxAmount = action === 'buy' 
    ? Math.floor(tasBalance / token.price)
    : tokenBalance;
  
  const totalCost = amount * token.price;
  const canProceed = action === 'buy' 
    ? totalCost <= tasBalance && amount > 0
    : amount <= tokenBalance && amount > 0;
  
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    const percentage = value[0];
    const maxValue = action === 'buy' ? Math.floor(tasBalance / token.price) : tokenBalance;
    const newAmount = Math.floor((percentage / 100) * maxValue);
    setAmount(newAmount > 0 ? newAmount : 1);
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setAmount(value);
    
    // Update slider percentage based on amount
    if (maxAmount > 0) {
      const percentage = Math.min(100, Math.floor((value / maxAmount) * 100));
      setSliderValue([percentage]);
    }
  };
  
  const handleTrade = () => {
    toast({
      title: `${action === 'buy' ? 'Purchase' : 'Sale'} Successful`,
      description: `You ${action === 'buy' ? 'bought' : 'sold'} ${amount} ${token.symbol} for ${totalCost.toLocaleString()} TAS`,
    });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === 'buy' ? 'Buy' : 'Sell'} {token.name}
            <Badge variant="outline" className="ml-1">${token.symbol}</Badge>
          </DialogTitle>
          <DialogDescription>
            Current Price: ${token.price.toFixed(5)} per {token.symbol}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="flex justify-between">
              <Label>Amount ({token.symbol})</Label>
              <span className="text-sm text-slate-500">
                {action === 'buy' ? 'Max' : 'Balance'}: {maxAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={handleAmountChange}
                min={0}
                max={maxAmount}
                className="col-span-2 h-9"
              />
              <Button 
                variant="outline" 
                size="sm"
                className="h-9 px-2 flex-shrink-0"
                onClick={() => {
                  setAmount(maxAmount);
                  setSliderValue([100]);
                }}
              >
                Max
              </Button>
            </div>
            
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
              <Slider
                value={sliderValue}
                onValueChange={handleSliderChange}
                max={100}
                step={1}
              />
            </div>
          </div>
          
          <div className="bg-slate-50 p-3 rounded-md space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Total {action === 'buy' ? 'Cost' : 'Receive'}</span>
              <span className="font-semibold">${totalCost.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm">Your TAS Balance</span>
              <span>${tasBalance.toLocaleString()}</span>
            </div>
            
            {action === 'sell' && (
              <div className="flex justify-between">
                <span className="text-sm">Your {token.symbol} Balance</span>
                <span>{tokenBalance.toLocaleString()} {token.symbol}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm pt-2 border-t">
              <span>Balance After Trade</span>
              <span>
                ${action === 'buy' 
                  ? (tasBalance - totalCost).toLocaleString() 
                  : (tasBalance + totalCost).toLocaleString()
                }
              </span>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleTrade} 
            disabled={!canProceed}
            className={!canProceed ? "" : action === 'buy' 
              ? "bg-primary hover:bg-primary-600" 
              : "bg-slate-600 hover:bg-slate-700"}
          >
            {action === 'buy' ? 'Buy' : 'Sell'} {token.symbol}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Label component for form fields
const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
    {children}
  </div>
);

// Main component
const TokenMarketplace = () => {
  const { translate } = useLanguage();
  const { isConnected, openConnectModal } = useWallet();
  const [, navigate] = useLocation();
  const [sortBy, setSortBy] = useState<string>("marketCap");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<Token | undefined>(undefined);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy');
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState<boolean>(false);
  
  // Fetch real tokens from the API
  const { data: tokensData, isLoading } = useQuery({
    queryKey: ["/api/tokens"],
    queryFn: async () => {
      const response = await fetch('/api/tokens');
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
      }
      const data = await response.json();
      console.log("API Response from /api/tokens:", data);
      return data;
    },
  });
  
  // Combine & transform tokens to match required format
  const tokens = React.useMemo(() => {
    if (!tokensData) return [];
    
    // Process myTokens and popularTokens from the API
    const allTokens = [
      ...(tokensData.myTokens || []),
      ...(tokensData.popularTokens || [])
    ];
    
    console.log("Processing tokens from API:", allTokens);
    
    const processedTokens = allTokens.map(token => ({
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      price: token.price || 0.01,
      marketCap: 0, // Will be populated when viewing token details
      percentChange24h: 0, // Will be populated when viewing token details
      volumeTAS: 0, // Will be populated when viewing token details
      creator: "TAS Chain",
      createdAt: new Date().toLocaleDateString(),
      logoUrl: token.icon,
      description: `${token.name} token on TAS Chain`
    }));
    
    console.log("Processed tokens for display:", processedTokens);
    return processedTokens;
  }, [tokensData]);
  
  // Fetch user tokens from wallet via API
  const { data: userTokens } = useQuery({
    queryKey: ["/api/user/tokens"],
    queryFn: async () => {
      if (!isConnected) return [];
      
      try {
        const response = await fetch('/api/user/tokens');
        if (!response.ok) {
          throw new Error('Failed to fetch user tokens');
        }
        const data = await response.json();
        return data.tokens || [];
      } catch (error) {
        console.error("Error fetching user tokens:", error);
        return [];
      }
    },
    enabled: isConnected
  });
  
  // Sort and filter tokens
  const filteredTokens = tokens
    ? tokens.filter(token => 
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === "price") return b.price - a.price;
        if (sortBy === "percentChange24h") return b.percentChange24h - a.percentChange24h;
        if (sortBy === "volumeTAS") return b.volumeTAS - a.volumeTAS;
        return b.marketCap - a.marketCap; // default sort by market cap
      })
    : [];
    
  // No static enhancements - we'll use real blockchain data only
  
  // Handle buy/sell actions
  const handleBuy = (token: Token) => {
    if (!isConnected) {
      openConnectModal();
      return;
    }
    // Directly navigate to the trading page with the buy tab selected
    safeNavigate(`/token/${token.id}/trade?action=buy`);
  };
  
  const handleSell = (token: Token) => {
    if (!isConnected) {
      openConnectModal();
      return;
    }
    // Directly navigate to the trading page with the sell tab selected
    safeNavigate(`/token/${token.id}/trade?action=sell`);
  };
  
  // Close trade dialog
  const closeTradeDialog = () => {
    setIsTradeDialogOpen(false);
    setSelectedToken(undefined);
  };
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl overflow-hidden">
      <div className="text-center mb-8">
        <Badge variant="outline" className="bg-primary bg-opacity-10 text-primary border-primary mb-2">
          <BarChart3 className="mr-1 h-3 w-3" /> TAS Chain Marketplace
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Trade Tokens on <span className="text-primary">TAS Chain</span>
        </h1>
        <p className="text-slate-600 max-w-3xl mx-auto mb-4">
          {translate("marketplace_description") || 
            "Buy and sell tokens created on the TAS Chain. Discover new projects and trade directly with other users through our innovative peer-to-peer marketplace. TAS Chain tokens utilize unique bonding curve mechanisms that ensure automated liquidity and fair price discovery without requiring traditional market makers or liquidity pools."}
        </p>
        
        {/* Featured TASnative Token Card */}
        <div className="max-w-3xl mx-auto mb-8 mt-8 relative">
          <Badge variant="outline" className="bg-indigo-100 text-indigo-600 border-indigo-300 absolute -top-3 left-[50%] transform -translate-x-1/2 z-10 px-3 py-1">
            <Sparkles className="mr-1 h-3 w-3" /> Featured Token
          </Badge>
          <Card className="overflow-hidden hover:shadow-md transition-shadow border-2 border-primary-100 bg-gradient-to-br from-indigo-50 to-sky-50">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    TN
                  </div>
                  <div>
                    <CardTitle className="text-xl">TASnative Token</CardTitle>
                    <CardDescription>
                      <span className="flex items-center">
                        $TASnative
                        <Badge variant="outline" className="ml-2 text-xs">TAS Chain</Badge>
                      </span>
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  +1.2%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-500">Price</span>
                <span className="font-semibold">$0.00100</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-500">Market Cap</span>
                <span>$250,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Status</span>
                <span className="flex items-center text-green-600">
                  <span className="h-2 w-2 bg-green-500 rounded-full mr-1 inline-block"></span> Active
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center pt-2">
              <Button 
                onClick={() => safeNavigate('/token/tasnative')}
                className="w-full bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 text-white"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                View TASnative Details
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 mt-6 max-w-3xl mx-auto">
          <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-start w-full md:w-auto md:flex-1">
            <div className="bg-green-100 rounded-full p-2 mr-3 flex-shrink-0">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-green-800 text-sm">Fixed Price Model</h3>
              <p className="text-xs text-green-700">TAS tokens maintain a fixed price of $0.001 USD for stable and predictable trading.</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start w-full md:w-auto md:flex-1">
            <div className="bg-blue-100 rounded-full p-2 mr-3 flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-800 text-sm">Community Chat</h3>
              <p className="text-xs text-blue-700">Each token has its own dedicated community chat for discussions and trading.</p>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 flex items-start w-full md:w-auto md:flex-1">
            <div className="bg-yellow-100 rounded-full p-2 mr-3 flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-yellow-800 text-sm">Secure Trading</h3>
              <p className="text-xs text-yellow-700">All transactions are secure and transparently recorded on the TASChain blockchain.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div className="w-full md:w-96 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search tokens by name or symbol..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Label>Sort by:</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="marketCap">Market Cap</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="percentChange24h">24h Change</SelectItem>
              <SelectItem value="volumeTAS">Volume</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {isConnected ? (
          <Button 
            className="ml-auto bg-gradient-to-r from-primary to-sky-400 text-white"
            onClick={() => safeNavigate("/create-token")}
          >
            Create New Token
          </Button>
        ) : (
          <Button 
            className="ml-auto" 
            variant="outline" 
            onClick={openConnectModal}
          >
            Connect Wallet to Trade
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-6 w-full overflow-x-auto grid grid-cols-4 max-w-full">
          <TabsTrigger value="all" className="flex items-center justify-center gap-1 whitespace-nowrap">
            <Award className="h-4 w-4 flex-shrink-0" /> <span>All Tokens</span>
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center justify-center gap-1 whitespace-nowrap">
            <TrendingUp className="h-4 w-4 flex-shrink-0" /> <span>Trending</span>
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center justify-center gap-1 whitespace-nowrap">
            <Clock className="h-4 w-4 flex-shrink-0" /> <span>New Launches</span>
          </TabsTrigger>
          <TabsTrigger value="my-tokens" className="flex items-center justify-center gap-1 whitespace-nowrap">
            <Wallet className="h-4 w-4 flex-shrink-0" /> <span>My Tokens</span>
          </TabsTrigger>
        </TabsList>
      
        <TabsContent value="all" className="mt-0">
          {isLoading ? (
            <div className="text-center py-20">
              <p>Loading tokens...</p>
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="text-center py-20">
              <p>No tokens found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTokens.map(token => (
                <TokenCard 
                  key={token.id} 
                  token={token} 
                  onBuy={handleBuy} 
                  onSell={handleSell} 
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="trending" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTokens
              .sort((a, b) => b.percentChange24h - a.percentChange24h)
              .slice(0, 8)
              .map(token => (
                <TokenCard 
                  key={token.id} 
                  token={token} 
                  onBuy={handleBuy} 
                  onSell={handleSell} 
                />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="new" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTokens
              .sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
              .slice(0, 8)
              .map(token => (
                <TokenCard 
                  key={token.id} 
                  token={token} 
                  onBuy={handleBuy} 
                  onSell={handleSell} 
                />
              ))}
          </div>
        </TabsContent>
        
        {isConnected && (
          <TabsContent value="my-tokens" className="mt-0">
            {userTokens && userTokens.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTokens
                  .filter(token => {
                    // Add explicit type checking
                    return Array.isArray(userTokens) && userTokens.some(
                      (ut) => ut && typeof ut === 'object' && 'symbol' in ut && ut.symbol === token.symbol
                    );
                  })
                  .map(token => (
                    <TokenCard 
                      key={token.id} 
                      token={token} 
                      onBuy={handleBuy} 
                      onSell={handleSell} 
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p>You don't own any tokens yet.</p>
                <Button variant="outline" className="mt-4">
                  Explore Tokens to Buy <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
      
      {/* Trade Dialog */}
      {selectedToken && userTokens && (
        <TradeDialog
          isOpen={isTradeDialogOpen}
          onClose={closeTradeDialog}
          token={selectedToken}
          action={tradeAction}
          userTokens={userTokens}
        />
      )}
      
      {/* Market Info Section */}
      {/* Platform Features Section */}
      <div className="mt-16 py-12 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl">
        <div className="text-center mb-8">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary mb-2">
            <Sparkles className="mr-1 h-3 w-3" /> Platform Features
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Key Features of TAS Chain</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Our platform offers unique functionality designed to make token creation, trading and social interaction seamless.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {translate("createTokens") || "Create Your Own Tokens"}
            </h3>
            <p className="text-slate-600 text-sm mb-4 flex-grow">
              {translate("createTokensDescription") || "Create custom tokens with automated bonding curves for instant liquidity on TAS Chain."}
            </p>
            <Button 
              variant="outline" 
              className="w-full mt-auto"
              onClick={() => {
                safeNavigate("/create-token");
              }}
            >
              Create Token <Plus className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Trade & Chat Simultaneously
            </h3>
            <p className="text-slate-600 text-sm mb-4 flex-grow">
              Our unique peer-to-peer trading system lets you exchange tokens directly with other users while chatting in real-time about market trends and opportunities.
            </p>
            <Button 
              variant="outline" 
              className="w-full mt-auto"
              onClick={() => {
                safeNavigate("/find-matches");
              }}
            >
              Find Trading Partners <Users className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Secure & Transparent Blockchain
            </h3>
            <p className="text-slate-600 text-sm mb-4 flex-grow">
              All transactions and token activities are securely recorded on the TASChain blockchain with real-time verification and complete transparency through our public explorer.
            </p>
            <Button 
              variant="outline" 
              className="w-full mt-auto"
              onClick={() => window.open('https://tasonscan.com/explorer?token=0xd9541b134b1821736bd323135b8844d3ae408216', '_blank')}
            >
              View Explorer <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Market Stats Section */}
      <div className="mt-16 bg-slate-50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Info className="h-5 w-5 mr-2 text-primary" />
          <h2 className="text-xl font-semibold">TAS Chain Market Info</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Total Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tokens?.length || 0}</div>
              <p className="text-sm text-slate-500">Unique tokens on TAS Chain</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">24h Trading Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tokens 
                  ? tokens.reduce((sum, token) => sum + token.volumeTAS, 0).toLocaleString()
                  : 0} TAS
              </div>
              <p className="text-sm text-slate-500">Total volume across all pairs</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Total Market Cap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tokens 
                  ? tokens.reduce((sum, token) => sum + token.marketCap, 0).toLocaleString()
                  : 0} TAS
              </div>
              <p className="text-sm text-slate-500">Combined market cap of all tokens</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TokenMarketplace;