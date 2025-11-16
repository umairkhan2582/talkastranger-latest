import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import { 
  Avatar, AvatarFallback, AvatarImage 
} from "@/components/ui/avatar";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, Legend, ReferenceLine
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  InfoIcon, TrendingUp, BarChart3, MessageSquare, Send, 
  Users, LineChart as LineChartIcon, RefreshCw, Clock, DollarSign, Wallet,
  ArrowUp, ArrowDown, Bot, PlusCircle, MinusCircle,
  ExternalLink, ChevronRight, Settings, ZapIcon, AlertTriangle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useWallet } from "@/contexts/WalletContext";
import { type PriceData } from '@/hooks/use-price-oracle';
import { useTASNative, type ChartPoint } from '@/hooks/use-tas-native';

// Custom formatter for prices in chart tooltip
const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 6,
  maximumFractionDigits: 9
});

// Convert timestamp to readable date format
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

// Format percentage change with + prefix for positive values
const formatPercentChange = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

// Calculate price change percentage between two prices
const calculatePriceChange = (currentPrice: number, previousPrice: number): number => {
  if (!previousPrice) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
};

// Calculate change over different time periods
const calculateChanges = (priceHistory: PriceData[] | undefined): { 
  change1h: number; 
  change24h: number; 
  change7d: number;
} => {
  if (!priceHistory || priceHistory.length === 0) {
    return { change1h: 0, change24h: 0, change7d: 0 };
  }

  const now = Date.now();
  const latest = priceHistory[priceHistory.length - 1];
  
  // Find prices at specific time points
  const oneHourAgo = priceHistory.find(p => now - p.timestamp < 3600000 + 300000); // 1h + 5min buffer
  const oneDayAgo = priceHistory.find(p => now - p.timestamp < 86400000 + 300000); // 24h + 5min buffer
  const oneWeekAgo = priceHistory.find(p => now - p.timestamp < 604800000 + 300000); // 7d + 5min buffer

  return {
    change1h: oneHourAgo ? calculatePriceChange(latest.tasNativePrice, oneHourAgo.tasNativePrice) : 0,
    change24h: oneDayAgo ? calculatePriceChange(latest.tasNativePrice, oneDayAgo.tasNativePrice) : 0,
    change7d: oneWeekAgo ? calculatePriceChange(latest.tasNativePrice, oneWeekAgo.tasNativePrice) : 0,
  };
};

// Transform price data for chart display
const transformPriceDataForChart = (priceHistory: PriceData[] | undefined): any[] => {
  if (!priceHistory || priceHistory.length === 0) {
    return [];
  }

  return priceHistory.map(point => ({
    timestamp: point.timestamp,
    time: formatTimestamp(point.timestamp),
    price: point.tasNativePrice,
    bnbPrice: point.tasBnbPrice,
    ratio: point.tasNativePrice / point.tasBnbPrice,
  }));
};

// Types
interface TokenHolder {
  address: string;
  quantity: string;
  percentage: number;
  value: number;
}

interface ChatMessage {
  id: number;
  userId: number;
  username: string;
  text: string;
  timestamp: string;
  isBot: boolean;
  profileColor?: string;
  isTrade?: boolean;
  tradeType?: 'buy' | 'sell';
  tradeAmount?: string;
  tradePrice?: number;
}

// Generate a random but consistent color based on a string input
function getRandomColor(input: string): string {
  // Use a simple hash function to generate a number from the string
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // List of pleasing colors to select from
  const colors = [
    "#4285F4", // Blue
    "#EA4335", // Red
    "#34A853", // Green
    "#FBBC05", // Yellow
    "#673AB7", // Purple
    "#3F51B5", // Indigo
    "#2196F3", // Blue
    "#009688", // Teal
    "#4CAF50", // Green
    "#FF9800", // Orange
    "#FF5722", // Deep Orange
    "#795548", // Brown
    "#607D8B", // Blue Grey
  ];
  
  // Use the hash to select a color
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Generate chat messages with trade activity
const generateChatMessages = (tokenSymbol: string, currentPrice: number): ChatMessage[] => {
  const now = new Date();
  const messages: ChatMessage[] = [];
  
  // Some generic community chat messages
  const chatTexts = [
    "Just joined the TAS community! Excited about this project.",
    "Does anyone know when the next development update is coming?",
    `I've been following ${tokenSymbol} for a while, really impressed with the progress.`,
    "How does the price oracle work exactly?",
    `What's the use case for ${tokenSymbol}?`,
    "I think we're early on this one.",
    `The roadmap for ${tokenSymbol} looks promising.`,
    "Anyone from the team here?",
    "I just shared this project on Twitter!",
    "How does TAS Chain compare to BSC for token creation?",
    "Is there a whitepaper for this project?",
    "Just bought some on the dip!",
    "HODL gang 💎🙌",
    "I like the tokenomics of this project.",
    "New ATH incoming!"
  ];
  
  // Generate random timestamps within the last 24 hours
  const timestamps = Array(30).fill(0).map(() => {
    const date = new Date(now);
    date.setMinutes(date.getMinutes() - Math.floor(Math.random() * 1440)); // Random time in last 24h
    return date;
  }).sort((a, b) => a.getTime() - b.getTime()); // Sort chronologically
  
  // Mix trades and chat messages
  const usernames = ["TASFan", "Crypto_Wizard", "BlockchainBob", "Hodler99", "MoonHunter", "SatoshiJr", "TokenMaster", "CryptoQueen"];
  
  timestamps.forEach((timestamp, i) => {
    // Every third message is a trade
    if (i % 3 === 0) {
      const isBuy = Math.random() > 0.5;
      const amount = Math.floor(Math.random() * 10000) + 100;
      const price = currentPrice * (1 + (Math.random() * 0.1 - 0.05)); // +/- 5% from current price
      
      messages.push({
        id: i + 1,
        userId: 1000 + i,
        username: "TradingBot",
        text: `${isBuy ? 'Bought' : 'Sold'} ${amount.toLocaleString()} ${tokenSymbol} at ${price.toFixed(6)} TAS`,
        timestamp: timestamp.toISOString(),
        isBot: true,
        profileColor: "#4CAF50",
        isTrade: true,
        tradeType: isBuy ? 'buy' : 'sell',
        tradeAmount: amount.toString(),
        tradePrice: price
      });
    } else {
      // Regular chat message
      const username = usernames[Math.floor(Math.random() * usernames.length)];
      const text = chatTexts[Math.floor(Math.random() * chatTexts.length)];
      
      messages.push({
        id: i + 1,
        userId: 2000 + i,
        username,
        text,
        timestamp: timestamp.toISOString(),
        isBot: false,
        profileColor: getRandomColor(username)
      });
    }
  });
  
  // Sort by timestamp
  return messages.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

// Create mock data for holders
const generateHolders = (currentPrice: number): TokenHolder[] => {
  const totalSupply = 1000000000; // 1 billion
  const creatorHolding = totalSupply * 0.2; // Creator holds 20%
  const otherHoldings = totalSupply - creatorHolding;
  
  // Generate addresses with some holding distribution
  const holders: TokenHolder[] = [
    {
      address: "0x14c30d9139cbbca09e8232938fe265fbf120eaaa", // User address
      quantity: (otherHoldings * 0.25).toFixed(0),
      percentage: 25,
      value: currentPrice * (otherHoldings * 0.25)
    }
  ];
  
  // Add more holders with different percentages
  const percentages = [15, 10, 8, 7, 5, 3, 2, 1, 0.5];
  percentages.forEach((pct, i) => {
    const quantity = (otherHoldings * (pct / 100));
    holders.push({
      address: `0x${Array(40).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)).join('')}`,
      quantity: quantity.toFixed(0),
      percentage: pct,
      value: currentPrice * quantity
    });
  });
  
  // Sort by percentage
  return holders.sort((a, b) => b.percentage - a.percentage);
};

// Main component
const TASNativeTokenPage: React.FC = () => {
  const { toast } = useToast();
  const { isConnected, openConnectModal } = useWallet();
  const [newMessage, setNewMessage] = useState<string>("");
  const [chartInterval, setChartInterval] = useState<'1h' | '1d' | '7d' | '30d'>('1d');
  const [activeTab, setActiveTab] = useState<string>("info");
  const [tradeTab, setTradeTab] = useState<'buy' | 'sell'>('buy');
  const [tradeAmount, setTradeAmount] = useState<string>('');
  
  // Get TASnative data directly from the dedicated endpoints
  const {
    token,
    chartData: nativeChartData,
    holders,
    isLoading,
    errors,
    executeTrade: executeTradeAction
  } = useTASNative(chartInterval);
  
  // Convert chart interval to actual time periods for the API
  useEffect(() => {
    // No need to update any external state, chartInterval is used in hook
  }, [chartInterval]);
  
  // Combine the price info
  const priceInfo = token ? {
    tasNativePrice: token.price, // Fixed price at $0.001
    timestamp: Date.now()
  } : undefined;
  
  // Convert holders data for UI
  const tokenHolders = React.useMemo(() => {
    if (!holders || !token) return [];
    
    return holders.map((holder) => ({
      address: holder.address,
      quantity: holder.balance.toLocaleString(),
      percentage: holder.percentage,
      value: holder.balance * token.price
    }));
  }, [holders, token]);
  
  // Estimated changes based on price
  const changes = React.useMemo(() => {
    // Using percentChange24h from token data
    if (token) {
      const change24h = parseFloat(token.percentChange24h || '0');
      return {
        change1h: change24h / 24, // Estimate hourly change
        change24h,
        change7d: change24h * 7 // Estimate weekly change
      };
    }
    return { change1h: 0, change24h: 0, change7d: 0 };
  }, [token]);
  
  // Format chart data for display
  const chartData = React.useMemo(() => {
    if (!nativeChartData || nativeChartData.length === 0) return [];
    
    return nativeChartData.map(point => ({
      time: point.time,
      price: point.price,
      volume: point.volume
    }));
  }, [nativeChartData]);
  
  // Simulated trades based on chart data
  const recentTrades = React.useMemo(() => {
    if (!nativeChartData || nativeChartData.length === 0) return [];
    
    // Create sample trades from chart points (would be real data in production)
    return nativeChartData.slice(0, 5).map((point, index) => {
      const isEven = index % 2 === 0;
      return {
        id: `trade-${Date.now()}-${index}`,
        type: isEven ? 'buy' : 'sell' as 'buy' | 'sell',
        amount: Math.floor(Math.random() * 10000) + 500,
        price: point.price,
        totalValue: (Math.floor(Math.random() * 10000) + 500) * point.price,
        timestamp: new Date(point.time).getTime(),
        address: `0x${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`,
        username: `User${Math.floor(Math.random() * 900) + 100}`
      };
    });
  }, [nativeChartData]);
  
  // Get token holders from context
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Update chat messages when trades or price changes
  useEffect(() => {
    if (priceInfo) {
      // Generate initial chat messages
      let messages = generateChatMessages('TASnative', priceInfo.tasNativePrice);
      
      // Add trade messages
      if (recentTrades && recentTrades.length > 0) {
        const tradeMessages = recentTrades.map(trade => {
          // Convert string ID to number for ChatMessage type compatibility
          const numericId = typeof trade.id === 'string' 
            ? parseInt(trade.id.replace(/\D/g, ''), 10) || Date.now() 
            : Date.now();
            
          return {
            id: numericId,
            userId: 0,
            username: trade.username || 'Unknown',
            text: `${trade.type === 'buy' ? '🟢 Bought' : '🔴 Sold'} ${trade.amount.toLocaleString()} TASnative @ $${trade.price.toFixed(6)}`,
            timestamp: new Date(trade.timestamp).toISOString(),
            isBot: false,
            profileColor: trade.type === 'buy' ? '#34A853' : '#EA4335',  // Green for buy, red for sell
            isTrade: true,
            tradeType: trade.type,
            tradeAmount: trade.amount.toString(),
            tradePrice: trade.price
          };
        });
        
        // Combine and sort by timestamp (newest first)
        messages = [...messages, ...tradeMessages].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
      
      setChatMessages(messages);
    }
  }, [priceInfo?.tasNativePrice, recentTrades]);
  
  // Handle trade amount input
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setTradeAmount(value);
  };
  
  // Calculate trade total
  const calculateTradeTotal = (): number => {
    if (!tradeAmount || !priceInfo) return 0;
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount)) return 0;
    return amount * priceInfo.tasNativePrice;
  };
  
  // Handle trade execution
  const executeTrade = async () => {
    if (!isConnected) {
      openConnectModal();
      return;
    }
    
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to trade",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Parse the amount as a number
      const amount = parseFloat(tradeAmount);
      
      toast({
        title: `${tradeTab === 'buy' ? 'Buy' : 'Sell'} order submitted`,
        description: `Executing order for ${amount.toLocaleString()} TASnative..`,
        variant: "default"
      });
      
      // Execute the trade through the context action (which integrates with wallet/blockchain)
      const success = await executeTradeAction(tradeTab, amount);
      
      if (success) {
        toast({
          title: `${tradeTab === 'buy' ? 'Buy' : 'Sell'} order completed`,
          description: `Successfully ${tradeTab === 'buy' ? 'bought' : 'sold'} ${amount.toLocaleString()} TASnative at ${priceInfo?.tasNativePrice.toFixed(6)} TAS`,
          variant: "default"
        });
        
        // Reset trade amount
        setTradeAmount('');
      } else {
        toast({
          title: "Trade failed",
          description: "Failed to execute the transaction. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Trade failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Handle send message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    if (!isConnected) {
      openConnectModal();
      return;
    }
    
    const newMsg: ChatMessage = {
      id: Date.now(),
      userId: 999, // Current user ID
      username: "You", // Current username
      text: newMessage,
      timestamp: new Date().toISOString(),
      isBot: false,
      profileColor: "#2196F3" // Current user color
    };
    
    setChatMessages([...chatMessages, newMsg]);
    setNewMessage("");
  };
  
  // Handle key press for message sending
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 bg-background">
        <div className="flex items-center space-x-4 mb-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-[500px] w-full mt-6" />
      </div>
    );
  }
  
  if ((errors.token || errors.chart || errors.holders) || !priceInfo) {
    return (
      <div className="container mx-auto px-4 py-8 text-center bg-background">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading TASnative data</AlertTitle>
          <AlertDescription>
            Unable to load the latest TASnative token information. Please try again later.
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Page
        </Button>
      </div>
    );
  }
  
  return (
    <div className="bg-background min-h-screen pb-12">
      {/* Token Header with Stats Cards */}
      <div className="container mx-auto px-4 pt-6">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center text-white font-bold text-lg mr-3">
              TN
            </div>
            
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold">TASnative Token</h1>
                <Badge className="ml-2">$TASnative</Badge>
                <Badge variant="outline" className="ml-2">TAS Chain</Badge>
              </div>
              
              <div className="flex items-center mt-1">
                <span className="text-2xl font-semibold">${priceInfo.tasNativePrice.toFixed(5)}</span>
                <Badge 
                  className={`ml-2 ${changes.change24h >= 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'}`}
                >
                  {formatPercentChange(changes.change24h)}
                </Badge>
              </div>
            </div>
          </div>
          
          <p className="text-muted-foreground max-w-3xl">
            TASnative is the native token of the TAS blockchain, used for gas fees, 
            token creation, and trading on the TAS platform. It has a fixed price of $0.001
            and is the central cryptocurrency of the TAS ecosystem.
          </p>
        </div>
        
        {/* Key Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Market Cap</CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              <div className="text-lg font-semibold">
                ${(priceInfo.tasNativePrice * 250000000).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on 25% circulating supply
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">1h Change</CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              <div className={`text-lg font-semibold ${changes.change1h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentChange(changes.change1h)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last hour price change
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">24h Change</CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              <div className={`text-lg font-semibold ${changes.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentChange(changes.change24h)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 24 hours price change
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">7d Change</CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              <div className={`text-lg font-semibold ${changes.change7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentChange(changes.change7d)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 7 days price change
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Main Tabs */}
      <div className="container mx-auto px-4">
        <Tabs defaultValue="info" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info" className="flex items-center">
              <InfoIcon className="h-4 w-4 mr-2" />
              Info
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex items-center">
              <LineChartIcon className="h-4 w-4 mr-2" />
              Chart
            </TabsTrigger>
            <TabsTrigger value="buysell" className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Buy/Sell
            </TabsTrigger>
          </TabsList>
          
          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Token Info */}
              <div className="col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>TASnative Token Information</CardTitle>
                    <CardDescription>
                      Native token of the TAS blockchain with special benefits
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Contract Address</h3>
                          <p className="text-sm flex items-center">
                            0xd9541b134b1821736bd323135b8844d3ae408216
                            <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Total Supply</h3>
                          <p className="text-sm">1,000,000,000 TASnative</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Decimals</h3>
                          <p className="text-sm">18</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Token Type</h3>
                          <p className="text-sm">Native Chain Token</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Launch Date</h3>
                          <p className="text-sm">April 15, 2025</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Fixed Price</h3>
                          <p className="text-sm">$0.001 USD</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-sm font-medium">Token Distribution</h3>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: '65%' }}></div>
                            <div className="bg-blue-500 h-2.5 rounded-full mt-1" style={{ width: '20%' }}></div>
                            <div className="bg-yellow-500 h-2.5 rounded-full mt-1" style={{ width: '10%' }}></div>
                            <div className="bg-green-500 h-2.5 rounded-full mt-1" style={{ width: '5%' }}></div>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-xs mt-1">
                            <div>
                              <span className="font-medium">65%</span> - Locked (1 year)
                            </div>
                            <div>
                              <span className="font-medium">20%</span> - Sale Contract
                            </div>
                            <div>
                              <span className="font-medium">10%</span> - Airdrop Contract
                            </div>
                            <div>
                              <span className="font-medium">5%</span> - Project Development
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Token Utility</h3>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li>Gas fees on TAS Chain</li>
                          <li>Token creation (5 TAS per token)</li>
                          <li>Trading fees on TAS platform</li>
                          <li>Governance voting on protocol upgrades</li>
                          <li>Liquidity provider rewards</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Trading History */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Latest Trades</CardTitle>
                    <CardDescription>
                      Recent trading activity for TASnative
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {chatMessages
                        .filter(msg => msg.isTrade)
                        .slice(-5)
                        .map((trade) => (
                          <div key={trade.id} className="flex items-center justify-between p-2 rounded-md border">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full ${trade.tradeType === 'buy' ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                              <div>
                                <div className="text-sm font-medium">
                                  {trade.tradeType === 'buy' ? 'Buy' : 'Sell'} {Number(trade.tradeAmount).toLocaleString()} TASnative
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {trade.tradePrice?.toFixed(6)} TAS
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Total: {(Number(trade.tradeAmount) * (trade.tradePrice || 0)).toFixed(2)} TAS
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Column - Holders and Chat */}
              <div>
                {/* Top Holders */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Top Holders</CardTitle>
                    <CardDescription>
                      Accounts with largest TASnative balance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-2">
                        {tokenHolders.slice(0, 10).map((holder, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
                            <div className="flex items-center">
                              <div className="text-sm font-medium truncate w-24 md:w-32">
                                {holder.address.substring(0, 6)}...{holder.address.substring(holder.address.length - 4)}
                              </div>
                              <div className="ml-2 text-xs bg-gray-100 px-1 rounded">
                                {holder.percentage.toFixed(2)}%
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              {holder.quantity}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
                
                {/* Community Chat */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Community Chat
                    </CardTitle>
                    <CardDescription>
                      Connect with other TASnative holders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-4">
                        {chatMessages.slice(-15).map((message) => (
                          <div key={message.id} className={`flex ${message.isBot ? 'opacity-80' : ''}`}>
                            <div 
                              className="h-8 w-8 rounded-full flex items-center justify-center text-white mr-2"
                              style={{ backgroundColor: message.profileColor }}
                            >
                              {message.username.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center">
                                <span className="font-medium text-sm">{message.username}</span>
                                {message.isBot && (
                                  <Badge variant="outline" className="ml-1 px-1 h-4 text-[10px]">
                                    <Bot className="h-2 w-2 mr-1" />
                                    BOT
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground ml-2">
                                  {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                                </span>
                              </div>
                              <p className={`text-sm mt-1 ${message.isTrade ? (message.tradeType === 'buy' ? 'text-green-600' : 'text-red-600') : ''}`}>
                                {message.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    <div className="flex items-center mt-4">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                      />
                      <Button 
                        size="icon"
                        onClick={handleSendMessage}
                        className="ml-2"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Chart Tab */}
          <TabsContent value="chart" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>TASnative Price Chart</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant={chartInterval === '1h' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setChartInterval('1h')}
                    >
                      1H
                    </Button>
                    <Button 
                      variant={chartInterval === '1d' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setChartInterval('1d')}
                    >
                      1D
                    </Button>
                    <Button 
                      variant={chartInterval === '7d' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setChartInterval('7d')}
                    >
                      7D
                    </Button>
                    <Button 
                      variant={chartInterval === '30d' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setChartInterval('30d')}
                    >
                      30D
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {isLoading ? (
                    <span>Loading chart data...</span>
                  ) : (
                    <span>
                      TASnative price in the last {chartInterval === '1h' ? 'hour' : 
                        chartInterval === '1d' ? 'day' : 
                        chartInterval === '7d' ? 'week' : 'month'}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                      <p>Loading chart data...</p>
                    </div>
                  </div>
                ) : chartData.length > 0 ? (
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0085FF" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#0085FF" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorBnbPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34A853" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#34A853" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="time" 
                          tickFormatter={(time) => {
                            const date = new Date(time);
                            if (chartInterval === '1h') {
                              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            } else {
                              return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                            }
                          }}
                          minTickGap={40}
                        />
                        <YAxis 
                          domain={['auto', 'auto']}
                          tickFormatter={(value) => value.toFixed(6)}
                        />
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <Tooltip 
                          formatter={(value: number, name: string) => {
                            if (name === "price") return [priceFormatter.format(value), "TASnative Price"];
                            if (name === "bnbPrice") return [priceFormatter.format(value), "TAS/BNB Price"];
                            if (name === "ratio") return [`${value.toFixed(2)}x`, "Premium Ratio"];
                            return [value, name];
                          }}
                          labelFormatter={(label) => `Time: ${new Date(label).toLocaleString()}`}
                        />
                        <Legend />
                        {/* TASnative price line */}
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#0085FF" 
                          fillOpacity={1} 
                          fill="url(#colorPrice)" 
                          name="TASnative Price"
                        />
                        
                        {/* TAS/BNB price line */}
                        <Area 
                          type="monotone" 
                          dataKey="bnbPrice" 
                          stroke="#34A853" 
                          fillOpacity={0.3}
                          fill="url(#colorBnbPrice)" 
                          name="TAS/BNB Price"
                        />
                        
                        {/* 1.25x premium reference line */}
                        <ReferenceLine 
                          y={chartData.length > 0 ? chartData[chartData.length - 1].bnbPrice * 1.25 : 0}
                          stroke="#FF7A00" 
                          strokeDasharray="3 3"
                          label={{ 
                            value: "1.25x Premium Target", 
                            position: "right", 
                            fill: "#FF7A00", 
                            fontSize: 10 
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-md">
                    <div className="text-center text-muted-foreground">
                      <LineChartIcon className="h-10 w-10 mx-auto mb-2" />
                      <p>No chart data available for the selected interval</p>
                      <p className="text-sm">Price data will populate as the market develops</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Price Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle>TASnative vs TAS/BNB Price Ratio</CardTitle>
                <CardDescription>
                  Premium ratio between TASnative and TAS/BNB prices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis 
                          dataKey="time" 
                          tickFormatter={(time) => {
                            const date = new Date(time);
                            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                          }}
                          minTickGap={40}
                        />
                        <YAxis 
                          tickFormatter={(value) => value.toFixed(2)}
                        />
                        <Tooltip 
                          formatter={(value: number) => [value.toFixed(2), 'Ratio']}
                          labelFormatter={(label) => `Time: ${new Date(label).toLocaleString()}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="ratio" 
                          stroke="#8884d8" 
                          name="Premium Ratio" 
                          strokeWidth={2}
                        />
                        {/* Reference line at 1.25 (target premium) */}
                        <ReferenceLine y={1.25} stroke="green" strokeDasharray="3 3" label="Target (1.25x)" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50 rounded-md">
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-10 w-10 mx-auto mb-2" />
                        <p>No comparison data available yet</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Buy/Sell Tab */}
          <TabsContent value="buysell" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trade TASnative</CardTitle>
                <CardDescription>
                  Buy or sell TASnative tokens using TAS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 mb-6">
                  <Button
                    variant={tradeTab === 'buy' ? 'default' : 'outline'}
                    className={tradeTab === 'buy' ? 'bg-green-600 hover:bg-green-700' : ''}
                    onClick={() => setTradeTab('buy')}
                  >
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Buy
                  </Button>
                  <Button
                    variant={tradeTab === 'sell' ? 'default' : 'outline'}
                    className={tradeTab === 'sell' ? 'bg-red-600 hover:bg-red-700' : ''}
                    onClick={() => setTradeTab('sell')}
                  >
                    <ArrowDown className="h-4 w-4 mr-2" />
                    Sell
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount" className="mb-2 block">
                      Amount
                    </Label>
                    <div className="relative">
                      <Input
                        id="amount"
                        placeholder="Enter amount to trade"
                        value={tradeAmount}
                        onChange={handleAmountChange}
                        className="pl-10"
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-muted-foreground">TN</span>
                      </div>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-xs" 
                          onClick={() => setTradeAmount('100')}
                        >
                          Min
                        </Button>
                        <Separator orientation="vertical" className="h-4 mx-1" />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-xs" 
                          onClick={() => setTradeAmount('10000')}
                        >
                          Max
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-md">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Price per token</span>
                      <span className="font-medium">{priceInfo.tasNativePrice.toFixed(6)} TAS</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-bold">{calculateTradeTotal().toFixed(2)} TAS</span>
                    </div>
                    {tradeTab === 'buy' && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Fixed Price</span>
                        <span className="text-green-600">
                          $0.00100
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    className={`w-full ${tradeTab === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    onClick={executeTrade}
                  >
                    {tradeTab === 'buy' ? (
                      <>
                        <ArrowUp className="h-4 w-4 mr-2" />
                        Buy TASnative
                      </>
                    ) : (
                      <>
                        <ArrowDown className="h-4 w-4 mr-2" />
                        Sell TASnative
                      </>
                    )}
                  </Button>
                  
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Trading Information</AlertTitle>
                    <AlertDescription>
                      TASnative trades are executed on-chain at a fixed price of $0.001 USD.
                      Trading fees are collected in TAS tokens.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
            
            {/* Market Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Market Information</CardTitle>
                <CardDescription>
                  Current market statistics and information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Price (USD)</h3>
                      <p className="text-lg font-medium">${priceInfo.tasNativePrice.toFixed(5)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Circulating Supply</h3>
                      <p className="text-lg font-medium">250,000,000 (25%)</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Market Cap</h3>
                      <p className="text-lg font-medium">${(priceInfo.tasNativePrice * 250000000).toLocaleString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                      <p className="text-sm">
                        {formatTimestamp(priceInfo.timestamp)} 
                        ({formatDistanceToNow(new Date(priceInfo.timestamp), { addSuffix: true })})
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Token Economics</h3>
                    <p className="text-sm text-muted-foreground">
                      TASnative maintains a fixed price of $0.001 USD. The token has a total supply of 1 billion
                      with 65% locked for 1 year, 20% available in the sale contract against BNB/USDT, 
                      10% allocated for airdrops, and 5% reserved for project development.
                    </p>
                  </div>
                  
                  <Alert variant="default">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <AlertTitle>Connected</AlertTitle>
                    </div>
                    <AlertDescription>
                      Live price updates are active
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TASNativeTokenPage;