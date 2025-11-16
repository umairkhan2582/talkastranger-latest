import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  BarChart4,
  Clock,
  Coins,
  DollarSign,
  Eye,
  LucideIcon,
  MessageSquare,
  RefreshCcw,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWallet } from "@/contexts/WalletContext";

// Types
interface TokenDetails {
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
  bg?: string;
  textColor?: string;
  holders?: number;
  liquidity?: number;
  allTimeHigh?: number;
  allTimeHighDate?: string;
  totalSupply?: number;
  circulatingSupply?: number;
  maxSupply?: number;
  bondingCurveData?: Array<{x: number, y: number}>;
}

interface TokenTrade {
  id: string;
  type: 'buy' | 'sell';
  amount: string;
  price: number;
  timestamp: Date;
  hash: string;
  from: string;
  to: string;
}

interface PricePoint {
  time: string;
  price: number;
  volume?: number;
  open?: number;
  close?: number;
  high?: number;
  low?: number;
}

interface TokenHolder {
  address: string;
  balance: number;
  percentage: number;
  isDeveloper?: boolean;
}

interface ChatMessage {
  id: number;
  userId: number;
  address: string;
  username: string;
  text: string;
  timestamp: Date;
  isBot?: boolean;
  profileColor?: string;
}

// Helper functions
const formatTimeframe = (timeframe: string): string => {
  switch (timeframe) {
    case '1h': return 'Last Hour';
    case '24h': return 'Last 24 Hours';
    case '7d': return 'Last 7 Days';
    case '30d': return 'Last 30 Days';
    case 'all': return 'All Time';
    default: return 'Last 24 Hours';
  }
};

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

// Main component
const TokenTrading = () => {
  // Get the token ID from the route parameters
  const { tokenAddress } = useParams<{ tokenAddress: string }>();
  
  // Convert address to id, with safeguards for different formats
  const tokenId = !isNaN(parseInt(tokenAddress)) ? parseInt(tokenAddress) : 1;
  
  // Add debugging logs
  console.log("TokenTrading component rendering", tokenAddress);
  
  // Additional state and hooks
  const { toast } = useToast();
  const { isConnected, openConnectModal } = useWallet();
  const [timeframe, setTimeframe] = useState<string>('24h');
  const [message, setMessage] = useState<string>('');
  const [tradeAmount, setTradeAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(1);
  const [antiSniper, setAntiSniper] = useState<boolean>(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState<boolean>(false);
  
  // Token details query
  const { data: tokenData, isLoading: isLoadingToken, error: tokenError } = useQuery({
    queryKey: [`/api/tokens/${tokenId}`],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/tokens/${tokenId}`);
        if (!res.ok) {
          throw new Error('Error fetching token details');
        }
        const data = await res.json();
        return data.token as TokenDetails;
      } catch (error) {
        console.error("Error fetching token:", error);
        throw error;
      }
    },
  });
  
  // Token chart data query
  const { data: chartData, isLoading: isLoadingChart } = useQuery({
    queryKey: [`/api/tokens/${tokenId}/chart`, timeframe],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/tokens/${tokenId}/chart?timeframe=${timeframe}`);
        if (!res.ok) {
          throw new Error('Error fetching chart data');
        }
        const data = await res.json();
        return data.pricePoints.map((point: any) => {
          // Use the data directly from the API
          return {
            ...point,
            time: new Date(point.time),
            // If the API doesn't provide candle data, we'll use the price for all values
            open: point.open || point.price,
            high: point.high || point.price,
            low: point.low || point.price,
            close: point.close || point.price
          };
        });
      } catch (error) {
        console.error("Error fetching chart data:", error);
        return [];
      }
    },
    enabled: !!tokenData, // Only fetch if token data is available
  });
  
  // Token holders query
  const { data: holdersData, isLoading: isLoadingHolders } = useQuery({
    queryKey: [`/api/tokens/${tokenId}/holders`],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/tokens/${tokenId}/holders`);
        if (!res.ok) {
          throw new Error('Error fetching token holders');
        }
        const data = await res.json();
        return data.holders as TokenHolder[];
      } catch (error) {
        console.error("Error fetching holders:", error);
        return [];
      }
    },
    enabled: !!tokenData, // Only fetch if token data is available
  });
  
  // Recent trades query
  const { data: recentTrades, isLoading: isLoadingTrades } = useQuery({
    queryKey: [`/api/tokens/${tokenId}/trades`],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/tokens/${tokenId}/trades`);
        if (!res.ok) {
          throw new Error('Error fetching recent trades');
        }
        const data = await res.json();
        return data.trades.map((trade: any) => ({
          ...trade,
          timestamp: new Date(trade.timestamp),
        }));
      } catch (error) {
        console.error("Error fetching trades:", error);
        return [];
      }
    },
    enabled: !!tokenData, // Only fetch if token data is available
  });
  
  // User token relationship query (for chat membership)
  const { data: userTokenRelation, isLoading: isLoadingRelation } = useQuery({
    queryKey: [`/api/user/tokens/${tokenId}`],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/user/tokens/${tokenId}`);
        if (!res.ok) {
          throw new Error('Error fetching user token relation');
        }
        return await res.json();
      } catch (error) {
        console.error("Error fetching user relation:", error);
        return { isFollowing: false, isMember: false };
      }
    },
    enabled: isConnected && !!tokenData, // Only fetch if user is connected and token data is available
  });
  
  // Chat messages query
  const { data: chatMessages, isLoading: isLoadingChat } = useQuery({
    queryKey: [`/api/tokens/${tokenId}/chat`],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/tokens/${tokenId}/chat`);
        if (!res.ok) {
          throw new Error('Error fetching chat messages');
        }
        const data = await res.json();
        return data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      } catch (error) {
        console.error("Error fetching chat:", error);
        return [];
      }
    },
    enabled: !!tokenData, // Only fetch if token data is available
  });
  
  // Toggle follow mutation
  const followMutation = useMutation({
    mutationFn: async (follow: boolean) => {
      try {
        const res = await apiRequest('POST', `/api/user/tokens/${tokenId}/follow`, { follow });
        if (!res.ok) {
          throw new Error('Failed to update follow status');
        }
        return await res.json();
      } catch (error) {
        console.error("Follow mutation error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/tokens/${tokenId}`] });
      toast({
        title: !data.isFollowing ? "Unfollowed" : "Following",
        description: !data.isFollowing 
          ? `You are no longer following ${tokenData?.symbol}`
          : `You are now following ${tokenData?.symbol}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Action Failed",
        description: "Could not update follow status. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Toggle membership mutation
  const membershipMutation = useMutation({
    mutationFn: async (join: boolean) => {
      try {
        const res = await apiRequest('POST', `/api/user/tokens/${tokenId}/membership`, { join });
        if (!res.ok) {
          throw new Error('Failed to update membership status');
        }
        return await res.json();
      } catch (error) {
        console.error("Membership mutation error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/tokens/${tokenId}`] });
      toast({
        title: !data.isMember ? "Left Community" : "Joined Community",
        description: !data.isMember 
          ? `You are no longer a member of ${tokenData?.symbol} community`
          : `You are now a member of ${tokenData?.symbol} community`,
      });
      
      // If joining community, automatically scroll to chat
      if (data.isMember) {
        setTimeout(() => {
          document.querySelector('[data-value="chart"]')?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    },
    onError: (error) => {
      toast({
        title: "Action Failed",
        description: "Could not update membership status. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Send chat message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest('POST', `/api/tokens/${tokenId}/chat`, { message });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tokens/${tokenId}/chat`] });
      setMessage('');
    },
  });
  
  // Execute trade mutation
  const tradeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/tokens/${tokenId}/trade`, {
        type: tradeType,
        amount: tradeAmount,
        slippage,
        antiSniper,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setIsTradeModalOpen(false);
      setTradeAmount('');
      
      // Add the trade to the recent trades list optimistically
      if (recentTrades && data.trade) {
        // Use trade data from the API response
        const trade = data.trade;
        const newTrade: TokenTrade = {
          id: trade.id,
          type: trade.type || tradeType,
          amount: trade.amount || tradeAmount,
          price: trade.price,
          timestamp: trade.timestamp ? new Date(trade.timestamp) : new Date(),
          hash: trade.hash,
          from: trade.from || (tradeType === 'buy' ? 'You' : trade.fromAddress || 'DEX Pool'),
          to: trade.to || (tradeType === 'sell' ? 'You' : trade.toAddress || 'DEX Pool'),
        };
        
        queryClient.setQueryData(
          [`/api/tokens/${tokenId}/trades`], 
          [newTrade, ...recentTrades.slice(0, 9)]
        );
      }
      
      // Add a bot message to the chat using message data from API response
      if (chatMessages && data.botMessage) {
        // Use the bot message from the API response
        const botMessage = data.botMessage;
        const optimisticMessage: ChatMessage = {
          id: botMessage.id || Date.now(),
          userId: botMessage.userId || 0,
          address: botMessage.address || "",
          username: botMessage.username || "TradingBot",
          text: botMessage.text || `🔔 New ${tradeType.toUpperCase()} for ${tradeAmount} ${tokenData?.symbol} at ${data.trade.price.toFixed(4)} TAS`,
          timestamp: new Date(),
          isBot: true,
          profileColor: botMessage.profileColor || "#FFD700"
        };
        
        queryClient.setQueryData(
          [`/api/tokens/${tokenId}/chat`],
          [optimisticMessage, ...chatMessages]
        );
      }
      
      toast({
        title: `${tradeType === 'buy' ? 'Purchase' : 'Sale'} Successful`,
        description: `You ${tradeType === 'buy' ? 'bought' : 'sold'} ${tradeAmount} ${tokenData?.symbol} for ${(parseFloat(tradeAmount) * (tokenData?.price || 0)).toLocaleString()} TAS`,
      });
    },
    onError: (error) => {
      toast({
        title: "Trade Failed",
        description: "An error occurred while executing your trade",
        variant: "destructive",
      });
    },
  });
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    if (!isConnected) {
      openConnectModal();
      return;
    }
    
    if (!userTokenRelation?.isMember) {
      toast({
        title: "You need to be a member",
        description: "Join the community to send messages",
        variant: "destructive",
      });
      return;
    }
    
    sendMessageMutation.mutate(message);
  };
  
  const handleToggleFollow = () => {
    if (!isConnected) {
      openConnectModal();
      return;
    }
    
    followMutation.mutate(!userTokenRelation?.isFollowing);
  };
  
  const handleToggleMembership = () => {
    if (!isConnected) {
      openConnectModal();
      return;
    }
    
    membershipMutation.mutate(!userTokenRelation?.isMember);
  };
  
  const handleOpenTradeModal = (type: 'buy' | 'sell') => {
    if (!isConnected) {
      openConnectModal();
      return;
    }
    
    setTradeType(type);
    setTradeAmount('');
    setSlippage(1);
    setAntiSniper(false);
    setIsTradeModalOpen(true);
  };
  
  const handleExecuteTrade = () => {
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    tradeMutation.mutate();
  };
  
  // Error state rendering
  if (tokenError) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center h-[80vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Token Not Found</h1>
          <p className="text-muted-foreground mb-6">The token you are looking for does not exist or has been removed.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (isLoadingToken) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded mt-8"></div>
        </div>
      </div>
    );
  }
  
  // If we reach this point but don't have tokenData, show error
  if (!tokenData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card>
          <CardHeader>
            <CardTitle>Data Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">There was a problem loading the token data. Please try again.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Token Header */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex items-center">
            {tokenData?.logoUrl ? (
              <img 
                src={tokenData.logoUrl} 
                alt={tokenData.name} 
                className="w-12 h-12 rounded-full mr-4" 
              />
            ) : (
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4 ${tokenData?.bg || 'bg-primary'}`}>
                {tokenData?.symbol?.slice(0, 2) || 'XX'}
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                {tokenData?.name}
                <Badge variant="outline" className="ml-2">
                  ${tokenData?.symbol}
                </Badge>
              </h1>
              <div className="flex items-center mt-1">
                <span className="text-xl font-semibold">
                  {tokenData?.price.toLocaleString()} TAS
                </span>
                <Badge 
                  className={`ml-2 ${Number(tokenData?.percentChange24h || 0) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {Number(tokenData?.percentChange24h || 0) >= 0 ? '+' : ''}{Number(tokenData?.percentChange24h || 0).toFixed(2)}%
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={handleToggleFollow}>
              <Eye className="mr-2 h-4 w-4" />
              {userTokenRelation?.isFollowing ? 'Unfollow' : 'Follow'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleToggleMembership}>
              <MessageSquare className="mr-2 h-4 w-4" />
              {userTokenRelation?.isMember ? 'Leave Community' : 'Join Community'}
            </Button>
          </div>
        </div>
      </header>
      
      {/* Community Chat Section - Made Prominent */}
      <div className="mb-6">
        <Card className="overflow-hidden shadow-md">
          <CardHeader className="border-b px-4 py-3 bg-gradient-to-r from-blue-50 to-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {tokenData?.logoUrl ? (
                  <img 
                    src={tokenData.logoUrl} 
                    alt={tokenData.name} 
                    className="w-10 h-10 rounded-full" 
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${tokenData?.bg || 'bg-primary'}`}>
                    {tokenData?.symbol.slice(0, 2)}
                  </div>
                )}
                <div>
                  <CardTitle className="text-base font-bold">{tokenData?.symbol} Community Chat</CardTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{holdersData?.length || 0} members</span>
                    <span>•</span>
                    <span>{userTokenRelation?.isMember ? 'You are a member' : 'Join to chat'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {userTokenRelation?.isMember ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    Member
                  </Badge>
                ) : (
                  <Button variant="default" size="sm" onClick={handleToggleMembership} className="h-8">
                    Join
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <div className="bg-gradient-to-r from-blue-50 to-green-50 h-[300px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollBehavior: 'smooth' }}>
              {isLoadingChat ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse h-16 bg-white/50 rounded-md"></div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Welcome message for new channel visitors */}
                  <div className="bg-white/30 p-3 rounded-lg text-center mx-auto max-w-md shadow-sm">
                    <h3 className="font-semibold">Welcome to {tokenData?.symbol} community!</h3>
                    <p className="text-sm text-muted-foreground">
                      This is the official community chat for {tokenData?.symbol} token holders and traders.
                    </p>
                  </div>
                  
                  {(!chatMessages || chatMessages.length === 0) ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No messages yet. Be the first to say hello!
                    </div>
                  ) : (
                    <>
                      {chatMessages?.slice(0, 3).map((msg: ChatMessage) => (
                        <div key={msg.id} className={`
                          flex items-start gap-2 max-w-[85%] 
                          ${msg.isBot ? 'mx-auto bg-yellow-50/80 p-3 rounded-lg shadow-sm' : 
                             msg.userId === 34 ? 'ml-auto' : ''}
                        `}>
                          {!msg.isBot && msg.userId !== 34 && (
                            <div 
                              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white mt-1"
                              style={{ backgroundColor: msg.profileColor || '#6366f1' }}
                            >
                              {msg.username.charAt(0)}
                            </div>
                          )}
                          
                          <div className={`
                            rounded-lg p-3 break-words
                            ${msg.isBot ? '' :
                              msg.userId === 34 ? 'bg-blue-500 text-white' : 'bg-white'}
                          `}>
                            {!msg.isBot && msg.userId !== 34 && (
                              <div className="font-medium text-sm text-blue-600 mb-1">
                                {msg.username}
                              </div>
                            )}
                            
                            <div className={`text-sm ${msg.isBot ? 'font-medium' : ''}`}>
                              {msg.text}
                            </div>
                            
                            <div className="text-xs text-right mt-1 flex justify-end items-center gap-1">
                              <span className={`${
                                msg.userId === 34 ? 'text-blue-100' : 'text-muted-foreground'
                              }`}>
                                {formatTime(msg.timestamp)}
                              </span>
                              
                              {msg.userId === 34 && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-100">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
            
            {/* Input area with Telegram-style */}
            <div className="p-3 bg-white border-t">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Input 
                  placeholder={userTokenRelation?.isMember ? "Message..." : "Join community to chat"} 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  disabled={!userTokenRelation?.isMember}
                  className="flex-1 bg-gray-50"
                />
                <Button type="submit" size="icon" disabled={!userTokenRelation?.isMember || !message.trim()} className="h-10 w-10 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </Button>
              </form>
              
              {!userTokenRelation?.isMember && (
                <div className="mt-2 text-center">
                  <Button onClick={handleToggleMembership} variant="link" className="text-sm">
                    Join community to participate in discussions
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="info">
            <Eye className="h-4 w-4 mr-2" />
            Info
          </TabsTrigger>
          <TabsTrigger value="chart">
            <BarChart3 className="h-4 w-4 mr-2" />
            Chart
          </TabsTrigger>
          <TabsTrigger value="trade">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Buy/Sell
          </TabsTrigger>
        </TabsList>
        
        {/* Info Tab */}
        <TabsContent value="info" className="space-y-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 flex flex-col items-center">
                  {tokenData?.logoUrl ? (
                    <img 
                      src={tokenData.logoUrl} 
                      alt={tokenData.name} 
                      className="w-32 h-32 rounded-full mb-4" 
                    />
                  ) : (
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-4xl mb-4 ${tokenData?.bg || 'bg-primary'}`}>
                      {tokenData?.symbol.slice(0, 2)}
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-2">
                    {/* Social media buttons would go here */}
                    <Button variant="outline" size="icon" className="rounded-full w-8 h-8 text-blue-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                      </svg>
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{tokenData?.name}</h2>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="font-mono">
                      ${tokenData?.symbol}
                    </Badge>
                    <Badge 
                      className={`${Number(tokenData?.percentChange24h || 0) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {Number(tokenData?.percentChange24h || 0) >= 0 ? '+' : ''}{Number(tokenData?.percentChange24h || 0).toFixed(2)}%
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      Dynamic Pricing
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">
                    {tokenData?.description || `${tokenData?.name} is a community-driven token using a bonding curve mechanism on the TASChain. The token price is determined 
                    by supply and demand, creating a balanced trading ecosystem for all participants. Join the ${tokenData?.symbol} community to participate in discussions and trading.`}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Price</div>
                      <div className="text-lg font-semibold">{tokenData?.price.toFixed(6)} TAS</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Market Cap</div>
                      <div className="text-lg font-semibold">{tokenData?.marketCap.toLocaleString()} TAS</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Volume (24h)</div>
                      <div className="text-lg font-semibold">{tokenData?.volumeTAS.toLocaleString()} TAS</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Holders</div>
                      <div className="text-lg font-semibold">{tokenData?.holders?.toLocaleString() || 0}</div>
                    </div>
                  </div>
                  
                  {/* Bonding Curve Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Bonding Curve</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 order-2 md:order-1">
                          <p className="text-sm text-muted-foreground mb-4">
                            This token uses a bonding curve mechanism where:
                          </p>
                          <ul className="text-sm space-y-2 mb-4">
                            <li className="flex items-start gap-2">
                              <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </div>
                              <span><strong>20%</strong> of the total supply is locked when the token is created</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </div>
                              <span><strong>80%</strong> is available for trading through the bonding curve</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </div>
                              <span>Once the <strong>80%</strong> is fully traded, the bonding curve is broken</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </div>
                              <span>The remaining <strong>20%</strong> is sent to PancakeSwap for continued trading</span>
                            </li>
                          </ul>
                          
                          {/* Progress bar showing how much of the 80% supply is left */}
                          <div className="space-y-2 mt-4">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Bonding Curve Progress</span>
                              <span className="text-muted-foreground">
                                {Math.min(100, Math.round((tokenData?.circulatingSupply || 0) / ((tokenData?.totalSupply || 0) * 0.8) * 100))}% Used
                              </span>
                            </div>
                            <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
                                style={{ 
                                  width: `${Math.min(100, Math.round((tokenData?.circulatingSupply || 0) / ((tokenData?.totalSupply || 0) * 0.8) * 100))}%` 
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>0%</span>
                              <span>Bonding Curve Supply (80% of Total)</span>
                              <span>100%</span>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                              <span>Available: {tokenData?.totalSupply ? 
                                Math.max(0, Math.round((tokenData.totalSupply * 0.8) - (tokenData.circulatingSupply || 0))).toLocaleString() : 0
                              } {tokenData?.symbol}</span>
                              <span>Total Supply: {tokenData?.totalSupply?.toLocaleString() || 0} {tokenData?.symbol}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0 order-1 md:order-2 md:w-64 h-48 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border">
                          {/* Bonding Curve Chart Visualization */}
                          <ResponsiveContainer width="90%" height="80%">
                            <LineChart
                              data={[
                                { x: 0, y: 0 },
                                { x: 20, y: 5 },
                                { x: 40, y: 20 },
                                { x: 60, y: 45 },
                                { x: 80, y: 100 },
                              ]}
                              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                            >
                              <XAxis 
                                dataKey="x" 
                                tickFormatter={(value) => `${value}%`}
                                ticks={[0, 20, 40, 60, 80]}
                              />
                              <YAxis hide />
                              <Tooltip 
                                formatter={(value: any) => [`Price: ${value} TAS`, 'Price']}
                                labelFormatter={(value) => `Supply: ${value}%`}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="y" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                dot={false}
                              />
                              <ReferenceLine 
                                x={Math.min(80, Math.round((tokenData?.circulatingSupply || 0) / (tokenData?.totalSupply || 1) * 100))} 
                                stroke="#f43f5e" 
                                strokeDasharray="3 3"
                                label={{ 
                                  value: 'Current', 
                                  position: 'insideTopRight',
                                  fill: '#f43f5e',
                                  fontSize: 10
                                }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                          <div className="absolute -bottom-4 text-xs font-medium text-center bg-white px-2 border rounded">
                            Bonding Curve
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Token Holders */}
          <Card>
            <CardHeader>
              <CardTitle>Token Holders</CardTitle>
              <CardDescription>Top addresses holding {tokenData?.symbol}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHolders ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse h-12 bg-slate-200 rounded-md"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {holdersData?.slice(0, 5).map((holder, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-mono text-sm">{holder.address}</div>
                          <div className="text-xs text-muted-foreground">{holder.isDeveloper ? 'Developer' : 'Holder'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{holder.balance.toLocaleString()} {tokenData?.symbol}</div>
                        <div className="text-xs text-muted-foreground">{holder.percentage.toFixed(2)}% of supply</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Chart Tab */}
        <TabsContent value="chart" className="space-y-8">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Price Chart</CardTitle>
                  <CardDescription>View historical price performance</CardDescription>
                </div>
                <div className="flex gap-2">
                  {['1h', '24h', '7d', '30d', 'all'].map((tf) => (
                    <Button 
                      key={tf} 
                      variant={timeframe === tf ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setTimeframe(tf)}
                    >
                      {tf}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {isLoadingChart ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div>
                    {/* Fallback to simple line chart with basic data */}
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData || []}
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="time" 
                          tickFormatter={(time) => {
                            if (!time) return '';
                            const date = new Date(time);
                            return formatTime(date);
                          }}
                        />
                        <YAxis 
                          tickFormatter={(value) => Number(value).toFixed(4)}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${Number(value).toFixed(6)} TAS`, 'Price']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#3b82f6" 
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Trades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Trades</span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {isLoadingTrades ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse h-16 bg-slate-200 rounded-md"></div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {recentTrades?.map((trade: TokenTrade) => (
                        <div key={trade.id} className="flex items-center space-x-4 border-b pb-4">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${trade.type === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {trade.type === 'buy' ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {trade.type === 'buy' ? 'Buy' : 'Sell'} {Number(trade.amount).toLocaleString()} {tokenData?.symbol}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(trade.timestamp)} • <span className="font-mono">{trade.hash.substring(0, 8)}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${trade.type === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                              {(trade.price * Number(trade.amount)).toLocaleString()} TAS
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @ {trade.price.toFixed(6)} TAS
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {(!recentTrades || recentTrades.length === 0) && (
                        <div className="text-center py-4 text-muted-foreground">
                          No trades yet
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Telegram-style Community Chat */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {tokenData?.logoUrl ? (
                      <img 
                        src={tokenData.logoUrl} 
                        alt={tokenData.name} 
                        className="w-10 h-10 rounded-full" 
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${tokenData?.bg || 'bg-primary'}`}>
                        {tokenData?.symbol.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base font-bold">{tokenData?.symbol} Community</CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{holdersData?.length || 0} members</span>
                        <span>•</span>
                        <span>{userTokenRelation?.isMember ? 'You are a member' : 'Join to chat'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {userTokenRelation?.isMember ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        Member
                      </Badge>
                    ) : (
                      <Button variant="default" size="sm" onClick={handleToggleMembership} className="h-8">
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <div className="bg-gradient-to-r from-blue-50 to-green-50 h-[350px] flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollBehavior: 'smooth' }}>
                  {isLoadingChat ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse h-16 bg-white/50 rounded-md"></div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Welcome message for new channel visitors */}
                      <div className="bg-white/30 p-3 rounded-lg text-center mx-auto max-w-md shadow-sm">
                        <h3 className="font-semibold">Welcome to {tokenData?.symbol} community!</h3>
                        <p className="text-sm text-muted-foreground">
                          This is the official community chat for {tokenData?.symbol} token holders and traders.
                        </p>
                      </div>
                      
                      {(!chatMessages || chatMessages.length === 0) ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No messages yet. Be the first to say hello!
                        </div>
                      ) : (
                        <>
                          {chatMessages?.map((msg: ChatMessage) => (
                            <div key={msg.id} className={`
                              flex items-start gap-2 max-w-[85%] 
                              ${msg.isBot ? 'mx-auto bg-yellow-50/80 p-3 rounded-lg shadow-sm' : 
                                 msg.userId === 34 ? 'ml-auto' : ''}
                            `}>
                              {!msg.isBot && msg.userId !== 34 && (
                                <div 
                                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white mt-1"
                                  style={{ backgroundColor: msg.profileColor || '#6366f1' }}
                                >
                                  {msg.username.charAt(0)}
                                </div>
                              )}
                              
                              <div className={`
                                rounded-lg p-3 break-words
                                ${msg.isBot ? '' :
                                  msg.userId === 34 ? 'bg-blue-500 text-white' : 'bg-white'}
                              `}>
                                {!msg.isBot && msg.userId !== 34 && (
                                  <div className="font-medium text-sm text-blue-600 mb-1">
                                    {msg.username}
                                  </div>
                                )}
                                
                                <div className={`text-sm ${msg.isBot ? 'font-medium' : ''}`}>
                                  {msg.text}
                                </div>
                                
                                <div className="text-xs text-right mt-1 flex justify-end items-center gap-1">
                                  <span className={`${
                                    msg.userId === 34 ? 'text-blue-100' : 'text-muted-foreground'
                                  }`}>
                                    {formatTime(msg.timestamp)}
                                  </span>
                                  
                                  {msg.userId === 34 && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-100">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
                
                {/* Input area with Telegram-style */}
                <div className="p-3 bg-white border-t">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input 
                      placeholder={userTokenRelation?.isMember ? "Message..." : "Join community to chat"} 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)} 
                      disabled={!userTokenRelation?.isMember}
                      className="flex-1 bg-gray-50"
                    />
                    <Button type="submit" size="icon" disabled={!userTokenRelation?.isMember || !message.trim()} className="h-10 w-10 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </Button>
                  </form>
                  
                  {!userTokenRelation?.isMember && (
                    <div className="mt-2 text-center">
                      <Button onClick={handleToggleMembership} variant="link" className="text-sm">
                        Join community to participate in discussions
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
        
        {/* Buy/Sell Tab */}
        <TabsContent value="trade" className="space-y-8">
          {/* Nested Tabs for Buy and Sell */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Trade {tokenData?.symbol} Tokens</CardTitle>
              <CardDescription>
                Buy or sell {tokenData?.symbol} using the bonding curve mechanism
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="buy" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 rounded-lg overflow-hidden">
                  <TabsTrigger value="buy" className="h-16 rounded-none border-0 data-[state=active]:bg-green-200 data-[state=active]:text-green-800 data-[state=inactive]:bg-gray-100">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <ArrowDown className="h-6 w-6 text-green-600" />
                      <span className="font-medium">Buy {tokenData?.symbol}</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="sell" className="h-16 rounded-none border-0 data-[state=active]:bg-red-200 data-[state=active]:text-red-800 data-[state=inactive]:bg-gray-100">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <ArrowUp className="h-6 w-6 text-red-600" />
                      <span className="font-medium">Sell {tokenData?.symbol}</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
                
                {/* Buy Tab Content */}
                <TabsContent value="buy" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="rounded-lg bg-green-50 border border-green-100 p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-muted-foreground">Current Price</div>
                          <div className="font-medium">{tokenData?.price.toFixed(6)} TAS</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">Bonding Curve</div>
                          <div className="text-sm font-medium text-green-600">
                            <ArrowUp className="h-3 w-3 inline mr-1" />
                            Price increases with supply
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm font-medium">Your Balance</div>
                          <div className="font-medium">1,250,000 TAS</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium">{tokenData?.symbol} Balance</div>
                          <div className="font-medium">0 {tokenData?.symbol}</div>
                        </div>
                      </div>
                      
                      {/* Amount input for Buy */}
                      <div className="space-y-3">
                        <Label htmlFor="buy-amount">Amount to Buy</Label>
                        <div className="relative">
                          <Input
                            id="buy-amount"
                            placeholder="0.00"
                            value={tradeAmount}
                            onChange={(e) => setTradeAmount(e.target.value)}
                            className="pr-16"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                            {tokenData?.symbol}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground flex justify-between">
                          <span>Total cost:</span>
                          <span>{tradeAmount && !isNaN(parseFloat(tradeAmount)) 
                            ? `${(parseFloat(tradeAmount) * tokenData?.price).toLocaleString()} TAS` 
                            : '0 TAS'}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="buy-slippage">Slippage Tolerance: {slippage}%</Label>
                        </div>
                        <Slider
                          id="buy-slippage"
                          defaultValue={[1]}
                          max={5}
                          step={0.1}
                          onValueChange={(values) => setSlippage(values[0])}
                        />
                        <div className="flex gap-2">
                          {[0.5, 1, 3].map((value) => (
                            <Button
                              key={value}
                              variant="outline"
                              size="sm"
                              onClick={() => setSlippage(value)}
                              className={slippage === value ? 'border-primary' : ''}
                            >
                              {value}%
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="antiSniper"
                          checked={antiSniper}
                          onChange={(e) => setAntiSniper(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="antiSniper" className="text-sm cursor-pointer">
                          Enable anti-sniper protection
                        </Label>
                      </div>
                      
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white" 
                        onClick={() => {
                          setTradeType('buy');
                          handleExecuteTrade();
                        }}
                        disabled={!tradeAmount || isNaN(parseFloat(tradeAmount)) || parseFloat(tradeAmount) <= 0}
                      >
                        {tradeMutation.isPending && tradeType === 'buy' ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                            Processing...
                          </>
                        ) : (
                          <>Buy {tokenData?.symbol}</>
                        )}
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-6 bg-gradient-to-br from-green-50 to-blue-50">
                      <h3 className="text-lg font-medium mb-4">Buy Order Preview</h3>
                      <div className="space-y-6">
                        <div className="flex flex-col space-y-2">
                          <span className="text-sm text-muted-foreground">You're buying</span>
                          <span className="text-2xl font-bold">
                            {tradeAmount || '0'} {tokenData?.symbol}
                          </span>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <span className="text-sm text-muted-foreground">You'll pay</span>
                          <span className="text-2xl font-bold">
                            {tradeAmount && !isNaN(parseFloat(tradeAmount)) 
                              ? `${(parseFloat(tradeAmount) * tokenData?.price).toLocaleString()}` 
                              : '0'} TAS
                          </span>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <span className="text-sm text-muted-foreground">Exchange rate</span>
                          <span className="text-lg">
                            1 {tokenData?.symbol} = {tokenData?.price.toFixed(6)} TAS
                          </span>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <span className="text-sm text-muted-foreground">Price impact</span>
                          <span className="text-base text-green-600">
                            {tradeAmount && !isNaN(parseFloat(tradeAmount)) && parseFloat(tradeAmount) > 0
                              ? `+${(Math.min(10, parseFloat(tradeAmount) / 100)).toFixed(2)}%` 
                              : '+0.00%'}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            The price increases as more tokens are purchased due to the bonding curve.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Sell Tab Content */}
                <TabsContent value="sell" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="rounded-lg bg-red-50 border border-red-100 p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-muted-foreground">Current Price</div>
                          <div className="font-medium">{tokenData?.price.toFixed(6)} TAS</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">Bonding Curve</div>
                          <div className="text-sm font-medium text-red-600">
                            <ArrowDown className="h-3 w-3 inline mr-1" />
                            Price decreases with supply
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm font-medium">Your Balance</div>
                          <div className="font-medium">1,250,000 TAS</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium">{tokenData?.symbol} Balance</div>
                          <div className="font-medium">0 {tokenData?.symbol}</div>
                        </div>
                      </div>
                      
                      {/* Amount input for Sell */}
                      <div className="space-y-3">
                        <Label htmlFor="sell-amount">Amount to Sell</Label>
                        <div className="relative">
                          <Input
                            id="sell-amount"
                            placeholder="0.00"
                            value={tradeAmount}
                            onChange={(e) => setTradeAmount(e.target.value)}
                            className="pr-16"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                            {tokenData?.symbol}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground flex justify-between">
                          <span>You'll receive:</span>
                          <span>{tradeAmount && !isNaN(parseFloat(tradeAmount)) 
                            ? `${(parseFloat(tradeAmount) * tokenData?.price * 0.98).toLocaleString()} TAS` 
                            : '0 TAS'}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="sell-slippage">Slippage Tolerance: {slippage}%</Label>
                        </div>
                        <Slider
                          id="sell-slippage"
                          defaultValue={[1]}
                          max={5}
                          step={0.1}
                          onValueChange={(values) => setSlippage(values[0])}
                        />
                        <div className="flex gap-2">
                          {[0.5, 1, 3].map((value) => (
                            <Button
                              key={value}
                              variant="outline"
                              size="sm"
                              onClick={() => setSlippage(value)}
                              className={slippage === value ? 'border-primary' : ''}
                            >
                              {value}%
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-red-600 hover:bg-red-700 text-white" 
                        onClick={() => {
                          setTradeType('sell');
                          handleExecuteTrade();
                        }}
                        disabled={!tradeAmount || isNaN(parseFloat(tradeAmount)) || parseFloat(tradeAmount) <= 0}
                      >
                        {tradeMutation.isPending && tradeType === 'sell' ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                            Processing...
                          </>
                        ) : (
                          <>Sell {tokenData?.symbol}</>
                        )}
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-6 bg-gradient-to-br from-red-50 to-orange-50">
                      <h3 className="text-lg font-medium mb-4">Sell Order Preview</h3>
                      <div className="space-y-6">
                        <div className="flex flex-col space-y-2">
                          <span className="text-sm text-muted-foreground">You're selling</span>
                          <span className="text-2xl font-bold">
                            {tradeAmount || '0'} {tokenData?.symbol}
                          </span>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <span className="text-sm text-muted-foreground">You'll receive</span>
                          <span className="text-2xl font-bold">
                            {tradeAmount && !isNaN(parseFloat(tradeAmount)) 
                              ? `${(parseFloat(tradeAmount) * tokenData?.price * 0.98).toLocaleString()}` 
                              : '0'} TAS
                          </span>
                          <span className="text-xs text-muted-foreground">
                            *After 2% liquidity fee
                          </span>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <span className="text-sm text-muted-foreground">Exchange rate</span>
                          <span className="text-lg">
                            1 {tokenData?.symbol} = {tokenData?.price.toFixed(6)} TAS
                          </span>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <span className="text-sm text-muted-foreground">Price impact</span>
                          <span className="text-base text-red-600">
                            {tradeAmount && !isNaN(parseFloat(tradeAmount)) && parseFloat(tradeAmount) > 0
                              ? `-${(Math.min(10, parseFloat(tradeAmount) / 100)).toFixed(2)}%` 
                              : '-0.00%'}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            The price decreases as tokens are sold due to the bonding curve.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Trading Bots</span>
                {!userTokenRelation?.isMember && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Requires Membership
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Automate your trading strategies to maximize profits and minimize time spent monitoring the market
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-blue-100 hover:border-blue-300 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Market Bot</CardTitle>
                      <span className="bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-1">Popular</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Executes buy/sell orders at current market price immediately when triggered.
                      </p>
                      <div className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span>Fee:</span>
                          <span className="font-medium">1%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Daily limit:</span>
                          <span className="font-medium">5 trades</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => userTokenRelation?.isMember ? 
                          toast({
                            title: "Coming Soon",
                            description: "Trading bots will be available in the next update.",
                          }) :
                          handleToggleMembership()
                        }
                      >
                        {userTokenRelation?.isMember ? "Configure" : "Join to Use"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-emerald-100 hover:border-emerald-300 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Limit Bot</CardTitle>
                      <span className="bg-emerald-100 text-emerald-800 text-xs rounded-full px-2 py-1">Advanced</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Places limit orders at specific price points that execute automatically.
                      </p>
                      <div className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span>Fee:</span>
                          <span className="font-medium">1.5%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active orders:</span>
                          <span className="font-medium">3 max</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => userTokenRelation?.isMember ? 
                          toast({
                            title: "Coming Soon",
                            description: "Trading bots will be available in the next update.",
                          }) :
                          handleToggleMembership()
                        }
                      >
                        {userTokenRelation?.isMember ? "Configure" : "Join to Use"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-purple-100 hover:border-purple-300 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">DCA Bot</CardTitle>
                      <span className="bg-purple-100 text-purple-800 text-xs rounded-full px-2 py-1">Pro</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Dollar-cost averaging at regular intervals to reduce impact of volatility.
                      </p>
                      <div className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span>Fee:</span>
                          <span className="font-medium">2%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Schedule:</span>
                          <span className="font-medium">Custom</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => userTokenRelation?.isMember ? 
                          toast({
                            title: "Coming Soon",
                            description: "Trading bots will be available in the next update.",
                          }) :
                          handleToggleMembership()
                        }
                      >
                        {userTokenRelation?.isMember ? "Configure" : "Join to Use"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="border rounded-lg p-4 bg-blue-50/50 mt-4">
                <h3 className="font-medium mb-2">How Trading Bots Work</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Trading bots execute trades on your behalf according to predefined strategies. All bot activities are displayed in the community chat for transparency.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <div className="bg-green-100 p-1 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <div className="text-xs">
                      <strong>Fully Automated</strong>
                      <p className="text-muted-foreground">No need to monitor the market 24/7</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="bg-blue-100 p-1 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                      </svg>
                    </div>
                    <div className="text-xs">
                      <strong>Customizable</strong>
                      <p className="text-muted-foreground">Set your own parameters and risk tolerance</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {!userTokenRelation?.isMember && (
                <div className="text-center">
                  <Button onClick={handleToggleMembership} variant="default" size="sm">
                    Join {tokenData?.symbol} Community to Use Bots
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Trade Modal */}
      <Dialog open={isTradeModalOpen} onOpenChange={setIsTradeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tradeType === 'buy' ? `Buy ${tokenData?.symbol}` : `Sell ${tokenData?.symbol}`}
            </DialogTitle>
            <DialogDescription>
              {tradeType === 'buy' 
                ? `Purchase ${tokenData?.symbol} tokens using your TAS balance` 
                : `Sell your ${tokenData?.symbol} tokens to receive TAS`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <Input
                  id="amount"
                  placeholder="0.00"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  className="pr-16"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                  {tokenData?.symbol}
                </div>
              </div>
              <div className="text-sm text-muted-foreground flex justify-between">
                <span>Total cost:</span>
                <span>{tradeAmount && !isNaN(parseFloat(tradeAmount)) 
                  ? `${(parseFloat(tradeAmount) * tokenData?.price).toLocaleString()} TAS` 
                  : '0 TAS'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="slippage">Slippage Tolerance ({slippage}%)</Label>
              </div>
              <Slider
                id="slippage"
                defaultValue={[1]}
                max={5}
                step={0.1}
                onValueChange={(values) => setSlippage(values[0])}
              />
              <div className="flex gap-2">
                {[0.5, 1, 3].map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    onClick={() => setSlippage(value)}
                    className={slippage === value ? 'border-primary' : ''}
                  >
                    {value}%
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="antiSniper"
                checked={antiSniper}
                onChange={(e) => setAntiSniper(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="antiSniper" className="text-sm cursor-pointer">
                Enable anti-sniper protection
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              onClick={handleExecuteTrade}
              disabled={tradeMutation.isPending || !tradeAmount || isNaN(parseFloat(tradeAmount)) || parseFloat(tradeAmount) <= 0}
              className={tradeType === 'buy' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'}
            >
              {tradeMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                  Processing...
                </>
              ) : (
                <>{tradeType === 'buy' ? 'Buy' : 'Sell'} {tokenData?.symbol}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TokenTrading;