import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
  Avatar, AvatarFallback, AvatarImage 
} from "@/components/ui/avatar";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, Legend
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  InfoIcon, TrendingUp, BarChart3, MessageSquare, Send, 
  Users, LineChart as LineChartIcon, RefreshCw, Clock, DollarSign, Wallet,
  ArrowUp, ArrowDown, Bot, PlusCircle, MinusCircle,
  ExternalLink, ChevronRight, Settings, ZapIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useWallet } from "@/contexts/WalletContext";

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

// Types
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

interface TokenHolder {
  address: string;
  quantity: string;
  percentage: number;
  value: number;
}

interface TradingBot {
  id: number;
  name: string;
  description: string;
  active: boolean;
  strategy: string;
  creator: string;
}

interface BondingCurveDataPoint {
  x: number; // Supply
  y: number; // Price
}

interface TokenDetailData {
  id: number;
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  percentChange24h: number;
  volumeTAS: number;
  liquidity: number;
  holders: number;
  allTimeHigh: number;
  allTimeHighDate: string;
  totalSupply: number;
  circulatingSupply: number;
  creator: string;
  createdAt: string;
  contractAddress?: string;
  description?: string;
  logoUrl?: string;
  bondingCurveData: BondingCurveDataPoint[];
}

interface ChartDataPoint {
  time: string;
  price: number;
  volume: number;
}

// Create mock data for holders based on token data received from API
const generateHolders = (token: TokenDetailData): TokenHolder[] => {
  const totalSupply = token.circulatingSupply;
  const creatorHolding = totalSupply * 0.2; // Creator holds 20%
  const otherHoldings = totalSupply - creatorHolding;
  
  // Generate 10 addresses with some holding distribution
  const holders: TokenHolder[] = [
    {
      address: "0x14c30d9139cbbca09e8232938fe265fbf120eaaa", // User address
      quantity: (otherHoldings * 0.25).toFixed(0),
      percentage: 25,
      value: token.price * (otherHoldings * 0.25)
    }
  ];
  
  // Add 9 more holders with different percentages
  const percentages = [15, 10, 8, 7, 5, 3, 2, 1, 0.5];
  percentages.forEach((pct, i) => {
    const quantity = (otherHoldings * (pct / 100));
    holders.push({
      address: `0x${Array(40).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)).join('')}`,
      quantity: quantity.toFixed(0),
      percentage: pct,
      value: token.price * quantity
    });
  });
  
  // Sort by percentage
  return holders.sort((a, b) => b.percentage - a.percentage);
};

// Create mock data for trading bots
const generateTradingBots = (): TradingBot[] => {
  return [
    {
      id: 1,
      name: "Liquidity Provider Bot",
      description: "Provides liquidity by placing buy and sell orders at key price levels",
      active: true,
      strategy: "Maintain liquidity within 5% of current price",
      creator: "TAS Protocol"
    },
    {
      id: 2,
      name: "Price Stabilizer",
      description: "Reduces volatility by smoothing large price movements",
      active: true,
      strategy: "Buy on 3% dips, sell on 5% pumps",
      creator: "TAS Protocol"
    },
    {
      id: 3,
      name: "DCA Bot",
      description: "Dollar-cost averaging bot for long-term accumulation",
      active: false, 
      strategy: "Buy fixed amount every 24 hours",
      creator: "Community Bot"
    }
  ];
};

// Generate chat messages with trade activity mixed in
const generateMessages = (token: TokenDetailData): ChatMessage[] => {
  const now = new Date();
  const messages: ChatMessage[] = [];
  
  // Some generic community chat messages
  const chatTexts = [
    "Just joined the community! Excited about this project.",
    "Does anyone know when the next development update is coming?",
    `I've been following ${token.name} for a while, really impressed with the progress.`,
    "How does the bonding curve work exactly?",
    `What's the use case for ${token.symbol}?`,
    "I think we're early on this one.",
    `The roadmap for ${token.symbol} looks promising.`,
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
      const price = token.price * (1 + (Math.random() * 0.1 - 0.05)); // +/- 5% from current price
      
      messages.push({
        id: i + 1,
        userId: 1000 + i,
        username: "TradingBot",
        text: `${isBuy ? 'Bought' : 'Sold'} ${amount.toLocaleString()} ${token.symbol} at ${price.toFixed(6)} TAS`,
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

const TokenDetailPage = () => {
  const { tokenId } = useParams();
  const { toast } = useToast();
  const { isConnected, openConnectModal } = useWallet();
  const [newMessage, setNewMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("info");
  const [innerTab, setInnerTab] = useState<string>("buy");
  
  // Fetch token details
  const { data: tokenData, isLoading: isLoadingToken } = useQuery({
    queryKey: [`/api/tokens/${tokenId}`],
    queryFn: async () => {
      const response = await fetch(`/api/tokens/${tokenId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch token details');
      }
      const data = await response.json();
      return data.token;
    },
  });
  
  // Fetch token chart data
  const { data: chartData, isLoading: isLoadingChart } = useQuery({
    queryKey: [`/api/tokens/${tokenId}/chart`],
    queryFn: async () => {
      const response = await fetch(`/api/tokens/${tokenId}/chart`);
      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }
      const data = await response.json();
      return data.pricePoints;
    },
    enabled: !!tokenId,
  });
  
  // Fetch token holders
  const { data: holdersData, isLoading: isLoadingHolders } = useQuery({
    queryKey: [`/api/tokens/${tokenId}/holders`],
    queryFn: async () => {
      const response = await fetch(`/api/tokens/${tokenId}/holders`);
      if (!response.ok) {
        throw new Error('Failed to fetch token holders');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!tokenId,
  });
  
  // Generate bots data
  const botsData = {
    bots: generateTradingBots()
  };
  
  // Generate chat data
  const [chatData, setChatData] = useState<{messages: ChatMessage[]}>({ messages: [] });
  
  useEffect(() => {
    if (tokenData && tokenData.symbol) {
      try {
        setChatData({
          messages: generateMessages(tokenData)
        });
      } catch (error) {
        console.error("Error generating messages:", error);
        setChatData({ messages: [] });
      }
    }
  }, [tokenData]);
  
  // Handle send message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    if (!isConnected) {
      openConnectModal();
      return;
    }
    
    const newMsg: ChatMessage = {
      id: chatData.messages.length + 1,
      userId: 999, // Current user ID
      username: "You", // Current username
      text: newMessage,
      timestamp: new Date().toISOString(),
      isBot: false,
      profileColor: "#2196F3" // Current user color
    };
    
    setChatData({
      messages: [...chatData.messages, newMsg]
    });
    
    setNewMessage("");
  };
  
  // Handle key press for message sending
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  if (isLoadingToken) {
    return (
      <div className="container mx-auto px-4 py-8 bg-white">
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
  
  if (!tokenData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center bg-white">
        <h2 className="text-2xl font-bold mb-4">Token not found</h2>
        <p>The requested token could not be found. Please check the ID and try again.</p>
      </div>
    );
  }
  
  const holdersArray = holdersData?.holders || generateHolders(tokenData);
  
  return (
    <div className="bg-white min-h-screen">
      {/* Token Header with Stats Cards */}
      <div className="container mx-auto px-4 pt-4">
        <div className="mb-4">
          <div className="flex items-center mb-2">
            {tokenData.logoUrl ? (
              <Avatar className="h-10 w-10 mr-2">
                <AvatarImage src={tokenData.logoUrl} alt={tokenData.name} />
                <AvatarFallback>{tokenData.symbol?.slice(0, 2) || "TA"}</AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center text-white font-bold text-lg mr-2">
                {tokenData.symbol?.slice(0, 2) || "TA"}
              </div>
            )}
            
            <div>
              <div className="flex items-center">
                <h1 className="text-xl font-bold">{tokenData.name}</h1>
                <Badge className="ml-2">${tokenData.symbol}</Badge>
                <Badge variant="outline" className="ml-2">TAS Chain</Badge>
              </div>
              
              <div className="flex items-center mt-1">
                <span className="text-xl font-semibold">${tokenData.price ? tokenData.price.toFixed(5) : '0.00000'}</span>
                <Badge 
                  className={`ml-2 ${tokenData.percentChange24h >= 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'}`}
                >
                  {tokenData.percentChange24h >= 0 ? '+' : ''}{tokenData.percentChange24h}%
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        {/* Key Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-green-700">Holders</p>
            <p className="text-xl font-bold">{tokenData.holders.toLocaleString()}</p>
            <div className="flex items-center text-green-600 opacity-40 mt-1">
              <Users className="h-4 w-4" />
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-700">All Time High</p>
            <p className="text-xl font-bold">${tokenData.allTimeHigh ? tokenData.allTimeHigh.toFixed(6) : '0.000000'}</p>
            <div className="flex items-center text-blue-600 opacity-40 mt-1">
              <LineChartIcon className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab("info")}
              className={`py-3 px-6 flex-1 flex justify-center items-center border-b-2 ${
                activeTab === "info"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              <InfoIcon className="h-4 w-4 mr-2" />
              Info
            </button>
            
            <button
              onClick={() => setActiveTab("chart")}
              className={`py-3 px-6 flex-1 flex justify-center items-center border-b-2 ${
                activeTab === "chart"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              <LineChartIcon className="h-4 w-4 mr-2" />
              Chart
            </button>
            
            <button
              onClick={() => setActiveTab("buysell")}
              className={`py-3 px-6 flex-1 flex justify-center items-center border-b-2 ${
                activeTab === "buysell"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Buy/Sell
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-4">
        {/* INFO TAB */}
        {activeTab === "info" && (
          <div className="space-y-4">
            {/* Token Overview */}
            <div className="bg-green-50 rounded-lg p-4">
              <h2 className="text-lg font-bold mb-2">Token Overview</h2>
              <p className="text-sm text-gray-600 mb-3">
                Basic information about {tokenData.name} token
              </p>
              
              <div className="space-y-3">
                <h3 className="font-medium">About {tokenData.name}</h3>
                <p className="text-sm text-gray-600">
                  {tokenData.description || `${tokenData.name} is a token created on the TAS Chain platform. It maintains a fixed price of $0.001 USD with a total supply of 1 billion tokens.`}
                </p>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Token Contract</span>
                    <p className="font-mono text-xs truncate">
                      {tokenData.contractAddress || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Creator</span>
                    <p>{tokenData.creator}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Created</span>
                    <p>{new Date(tokenData.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Supply</span>
                    <p>{tokenData.totalSupply.toLocaleString()} {tokenData.symbol}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Circulating Supply</span>
                    <p>{tokenData.circulatingSupply.toLocaleString()} {tokenData.symbol}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">LP Token</span>
                    <p>20%</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Market Stats (Row Layout) */}
            <div className="bg-white border rounded-lg p-4">
              <h2 className="text-lg font-bold mb-3">Market Stats</h2>
              <div className="flex flex-wrap gap-y-3 text-sm">
                <div className="flex-1 min-w-[120px]">
                  <p className="text-gray-500">Market Cap</p>
                  <p className="font-semibold">${tokenData.marketCap.toLocaleString()}</p>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <p className="text-gray-500">Liquidity</p>
                  <p className="font-semibold">${tokenData.liquidity.toLocaleString()}</p>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <p className="text-gray-500">Volume</p>
                  <p className="font-semibold">${tokenData.volumeTAS.toLocaleString()}</p>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <p className="text-gray-500">Creation Time</p>
                  <p className="font-semibold">{new Date(tokenData.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            {/* Token Holders */}
            <div className="bg-white border rounded-lg p-4">
              <h2 className="text-lg font-bold mb-3">Token Holders</h2>
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2">Rank</th>
                      <th className="pb-2">Address</th>
                      <th className="pb-2 text-right">Quantity</th>
                      <th className="pb-2 text-right">Percentage</th>
                      <th className="pb-2 text-right">Value ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdersArray.map((holder: TokenHolder, index: number) => (
                      <tr key={holder.address} className="border-b last:border-0">
                        <td className="py-2">{index + 1}</td>
                        <td className="py-2">
                          <div className="flex items-center">
                            <span className="font-mono text-xs truncate max-w-32 md:max-w-48">
                              {holder.address}
                            </span>
                            {index === 0 && (
                              <Badge variant="outline" className="ml-1 text-xs">Creator</Badge>
                            )}
                            {holder.address === "0x14c30d9139cbbca09e8232938fe265fbf120eaaa" && (
                              <Badge variant="secondary" className="ml-1 text-xs">You</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-2 text-right">{parseInt(holder.quantity || "0").toLocaleString()}</td>
                        <td className="py-2 text-right">{holder.percentage || 0}%</td>
                        <td className="py-2 text-right">${(holder.value || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Price Information */}
            <div className="bg-white border rounded-lg p-4">
              <h2 className="text-lg font-bold mb-2">Price Information</h2>
              <p className="text-sm text-gray-600 mb-3">
                This token maintains a fixed price of $0.001 with a total supply of 1 billion tokens. 
                The circulating supply is 25% of the total supply.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-700">Current Price</p>
                  <p className="text-xl font-bold">${tokenData.price ? tokenData.price.toFixed(5) : '0.00000'}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">Circulating Supply</p>
                  <p className="text-xl font-bold">{(tokenData.totalSupply * 0.25).toLocaleString()} {tokenData.symbol}</p>
                </div>
              </div>
            </div>
            
            {/* Community & Bots Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Community Section */}
              <div className="bg-white border rounded-lg p-4">
                <h2 className="text-lg font-bold mb-2">Community</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-blue-500" />
                      <span>Active Users</span>
                    </div>
                    <Badge>{Math.floor(tokenData.holders * 0.6)}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
                      <span>Daily Messages</span>
                    </div>
                    <Badge>{Math.floor(Math.random() * 500) + 100}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                      <span>Growth (7d)</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">+{Math.floor(Math.random() * 20) + 5}%</Badge>
                  </div>
                  
                  <Button className="w-full mt-2" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Join Community
                  </Button>
                </div>
              </div>
              
              {/* Trading Bots Section */}
              <div className="bg-white border rounded-lg p-4">
                <h2 className="text-lg font-bold mb-2">Trading Bots</h2>
                <div className="space-y-3">
                  {botsData.bots.slice(0, 2).map((bot) => (
                    <div key={bot.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{bot.name}</p>
                        <p className="text-xs text-gray-500">{bot.strategy}</p>
                      </div>
                      <Switch checked={bot.active} />
                    </div>
                  ))}
                  
                  <Button className="w-full mt-2" variant="outline" size="sm">
                    <Bot className="h-4 w-4 mr-2" />
                    View All Bots
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* CHART TAB */}
        {activeTab === "chart" && (
          <div className="space-y-4">
            {/* Chart Controls */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Price Chart</h2>
                <div className="flex space-x-1">
                  <button className="py-1 px-3 rounded-md bg-white text-blue-600 border border-blue-200 text-sm">5m</button>
                  <button className="py-1 px-3 rounded-md bg-blue-600 text-white text-sm">1h</button>
                  <button className="py-1 px-3 rounded-md bg-white text-blue-600 border border-blue-200 text-sm">1D</button>
                  <button className="py-1 px-3 rounded-md bg-white text-blue-600 border border-blue-200 text-sm">1W</button>
                </div>
              </div>
              
              {/* Main Chart */}
              {isLoadingChart ? (
                <Skeleton className="h-[350px] w-full" />
              ) : chartData ? (
                <div className="bg-white border rounded-lg p-3">
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis 
                        dataKey="time" 
                        tickFormatter={(time) => new Date(time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                      />
                      <YAxis
                        label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }}
                        tickFormatter={(value) => value.toFixed(6)}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`$${Number(value).toFixed(6)}`, 'Price']}
                        labelFormatter={(time) => new Date(time).toLocaleString()}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#3b82f6" 
                        fill="url(#colorPriceChart)" 
                        fillOpacity={0.5} 
                      />
                      <defs>
                        <linearGradient id="colorPriceChart" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center bg-white border rounded-lg">
                  <p>No chart data available</p>
                </div>
              )}
            </div>
            
            {/* Market Stats & Recent Trades */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Market Stats */}
              <div className="bg-white border rounded-lg p-4">
                <h2 className="text-lg font-bold mb-3">Market Stats</h2>
                <div className="flex flex-wrap gap-y-3 text-sm">
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-gray-500">Market Cap</p>
                    <p className="font-semibold">${tokenData.marketCap.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-gray-500">Liquidity</p>
                    <p className="font-semibold">${tokenData.liquidity.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-gray-500">Volume</p>
                    <p className="font-semibold">${tokenData.volumeTAS.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-gray-500">Creation Time</p>
                    <p className="font-semibold">{new Date(tokenData.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              {/* Recent Trades */}
              <div className="bg-white border rounded-lg p-4">
                <h2 className="text-lg font-bold mb-3">Recent Trades</h2>
                <div className="space-y-2">
                  {(chatData.messages || [])
                    .filter((msg: ChatMessage) => msg.isTrade)
                    .slice(-5)
                    .reverse()
                    .map((trade: ChatMessage) => (
                      <div key={trade.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div className="flex items-center">
                          {trade.tradeType === 'buy' ? (
                            <ArrowUp className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {trade.tradeType === 'buy' ? 'Buy' : 'Sell'} {parseInt(trade.tradeAmount || "0").toLocaleString()} {tokenData.symbol}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(trade.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">${parseFloat(trade.tradePrice?.toString() || "0").toFixed(6)}</p>
                          <p className="text-xs text-gray-500">
                            Total: ${(parseFloat(trade.tradeAmount || "0") * (trade.tradePrice || 0)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  
                  {(!chatData.messages || chatData.messages.filter((msg: ChatMessage) => msg.isTrade).length === 0) && (
                    <div className="text-center py-6 text-gray-500">
                      <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p>No recent trades</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Volume Chart */}
            <div className="bg-white border rounded-lg p-4">
              <h2 className="text-lg font-bold mb-3">Volume (24h)</h2>
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData?.slice(-24).map((point: any, index: number) => ({
                      hour: index,
                      volume: point.volume || Math.random() * 10000
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="hour" />
                    <YAxis tickFormatter={(value) => `${(value/1000).toFixed(1)}k`} />
                    <Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Volume']} />
                    <Bar dataKey="volume" fill="#3b82f6" barSize={12} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        
        {/* BUY/SELL TAB */}
        {activeTab === "buysell" && (
          <div className="space-y-4">
            {/* Buy/Sell Tabs */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {/* Inner Buy/Sell Tabs */}
              <div className="flex mb-4">
                <button
                  onClick={() => setInnerTab("buy")}
                  className={`flex-1 py-3 text-center ${
                    innerTab === "buy"
                      ? "bg-green-500 text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setInnerTab("sell")}
                  className={`flex-1 py-3 text-center ${
                    innerTab === "sell"
                      ? "bg-red-500 text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  Sell
                </button>
              </div>

              <div className="p-4">
                {/* MEV Protection Toggle */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-1">
                    <span className="text-white">MEV protection</span>
                    <InfoIcon className="h-3 w-3 text-gray-400" />
                  </div>
                  <Switch checked={true} />
                </div>

                {/* Buy Tab Content */}
                {innerTab === "buy" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3 text-white">
                      <div className="flex items-center">
                        <img
                          src="https://placehold.co/25x25" 
                          alt="TAS"
                          className="h-6 w-6 rounded-full mr-2"
                        />
                        <div className="font-semibold">{tokenData.symbol}</div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-300 mr-1">Balance:</span>
                        <span>$4,850.35</span>
                      </div>
                    </div>

                    <Button className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 text-white">
                      Buy
                    </Button>

                    <div className="text-center text-green-500 text-sm">
                      <a href="#" className="hover:underline">
                        The Pool was migrated to PancakeSwap
                      </a>
                    </div>

                    <div className="text-gray-400 text-xs mt-6">
                      <p className="mb-2">
                        Disclaimer: Digital assets are highly speculative and involve significant
                        risk of loss. The value of tokens is extremely volatile, and anyone
                        who wishes to trade in any token should be prepared for the
                        possibility of losing their entire investment.
                      </p>
                      <p>
                        TAS Chain makes no representations or warranties regarding the success or profitability of
                        any token developed on the platform. TAS Chain is a public,
                        decentralized, and permissionless platform. Participation by any project
                        should not be seen as an endorsement or recommendation.
                      </p>
                    </div>
                  </div>
                )}

                {/* Sell Tab Content */}
                {innerTab === "sell" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3 text-white">
                      <div className="flex items-center">
                        <img
                          src="https://placehold.co/25x25" 
                          alt="TAS"
                          className="h-6 w-6 rounded-full mr-2"
                        />
                        <div className="font-semibold">{tokenData.symbol}</div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-300 mr-1">Balance:</span>
                        <span>${(1245 * tokenData.price).toFixed(2)} (1,245 {tokenData.symbol})</span>
                      </div>
                    </div>

                    {/* Percentage buttons */}
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <button className="bg-gray-700 text-white p-2 rounded">
                        25%
                      </button>
                      <button className="bg-gray-700 text-white p-2 rounded">
                        50%
                      </button>
                      <button className="bg-gray-700 text-white p-2 rounded">
                        75%
                      </button>
                      <button className="bg-gray-700 text-white p-2 rounded">
                        100%
                      </button>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-3 text-white text-center">
                      <span className="text-gray-300">Amount: </span>
                      <span>0 {tokenData.symbol}</span>
                    </div>

                    <Button className="w-full py-6 text-lg bg-red-600 hover:bg-red-700 text-white">
                      Sell
                    </Button>

                    <div className="text-center text-green-500 text-sm">
                      <a href="#" className="hover:underline">
                        The Pool was migrated to PancakeSwap
                      </a>
                    </div>

                    <div className="text-gray-400 text-xs mt-6">
                      <p className="mb-2">
                        Disclaimer: Digital assets are highly speculative and involve significant
                        risk of loss. The value of tokens is extremely volatile, and anyone
                        who wishes to trade in any token should be prepared for the
                        possibility of losing their entire investment.
                      </p>
                      <p>
                        TAS Chain makes no representations or warranties regarding the success or profitability of
                        any token developed on the platform. TAS Chain is a public,
                        decentralized, and permissionless platform. Participation by any project
                        should not be seen as an endorsement or recommendation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Community Chat */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="bg-white border rounded-lg p-4 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-yellow-600" />
                      {tokenData.name} Community
                    </h2>
                    <Badge variant="outline">{chatData.messages?.length || 0} messages</Badge>
                  </div>
                  
                  <div className="flex-grow overflow-hidden">
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {(chatData.messages || []).map((msg: ChatMessage) => (
                          <div 
                            key={msg.id} 
                            className={`flex ${msg.isBot && msg.isTrade ? 'justify-center' : 'items-start'}`}
                          >
                            {/* Trade notifications */}
                            {msg.isBot && msg.isTrade ? (
                              <div className={`py-2 px-4 rounded-md inline-flex items-center text-xs
                                ${msg.tradeType === 'buy' 
                                  ? 'bg-green-50 text-green-700 border border-green-200' 
                                  : 'bg-red-50 text-red-700 border border-red-200'}`}
                              >
                                {msg.tradeType === 'buy' ? (
                                  <ArrowUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <ArrowDown className="h-3 w-3 mr-1" />
                                )}
                                {msg.text}
                              </div>
                            ) : (
                              <>
                                <Avatar className="h-7 w-7 mr-2">
                                  {msg.profileColor ? (
                                    <div className="h-full w-full" style={{ backgroundColor: msg.profileColor }}>
                                      <div className="h-full w-full flex items-center justify-center text-white font-semibold text-xs">
                                        {msg.username.charAt(0)}
                                      </div>
                                    </div>
                                  ) : (
                                    <AvatarFallback>{msg.username.charAt(0)}</AvatarFallback>
                                  )}
                                </Avatar>
                                
                                <div className="flex-1">
                                  <div className="flex items-center">
                                    <span className="font-semibold text-sm mr-1">{msg.username}</span>
                                    {msg.isBot && (
                                      <Badge variant="secondary" className="text-xs">Bot</Badge>
                                    )}
                                    <span className="text-xs text-gray-500 ml-1">
                                      {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-sm mt-1">{msg.text}</p>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center w-full gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="text-sm"
                      />
                      <Button size="sm" onClick={handleSendMessage} className="shrink-0">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Trading Bots */}
              <div className="space-y-4">
                <div className="bg-white border rounded-lg p-4">
                  <h2 className="text-lg font-bold mb-3 flex items-center">
                    <Bot className="h-4 w-4 mr-2 text-yellow-600" />
                    Trading Bots
                  </h2>
                  
                  <div className="space-y-3">
                    {botsData.bots.map((bot: TradingBot) => (
                      <div key={bot.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-sm">{bot.name}</h4>
                          <Switch checked={bot.active} />
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{bot.description}</p>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Strategy: {bot.strategy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenDetailPage;