import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTokenUpdates } from "@/contexts/TokenUpdateContext";
import { useWallet } from "@/contexts/WalletContext";
import { TokenTradePanel } from "@/components/TokenTradePanel";
import { TokenPriceDisplay } from "@/components/TokenPriceDisplay";
import { startPerformanceMetric, endPerformanceMetric } from "@/lib/performance-optimizations";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Wallet,
  Users,
  Coins,
  BarChart3,
  Shield,
  RefreshCcw,
  Clock,
  Eye,
} from "lucide-react";

// Types
interface TokenDetails {
  id: number;
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  percentChange24h: number;
  volumeTAS: number;
  liquidity?: number;
  holders?: number;
  allTimeHigh?: number;
  allTimeHighDate?: string;
  totalSupply?: number;
  circulatingSupply?: number;
  bondingCurveData?: Array<{x: number, y: number}>;
  bg?: string;
  textColor?: string;
  contractAddress?: string;
  network?: string;
}

interface PricePoint {
  time: Date;
  price: number;
  volume?: number;
}

interface TokenHolder {
  address: string;
  balance: number;
  percentage: number;
  isDeveloper?: boolean;
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

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

const formatNumber = (num: number, digits: number = 2): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(digits)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(digits)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(digits)}K`;
  return num.toFixed(digits);
};

// Main component
const SimpleTokenTrading = () => {
  const { toast } = useToast();
  const { address, isConnected, openConnectModal } = useWallet();
  const { tokenAddress } = useParams<{ tokenAddress: string }>();
  const { watchToken, isWebSocketConnected } = useTokenUpdates();
  
  // Convert address to id, with safeguards for different formats
  const tokenId = !isNaN(parseInt(tokenAddress)) ? parseInt(tokenAddress) : 1;
  
  // State
  const [timeframe, setTimeframe] = useState<string>('24h');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  
  // Start performance metrics when component mounts
  useEffect(() => {
    startPerformanceMetric('token_trading_page_load');
    
    return () => {
      endPerformanceMetric('token_trading_page_load');
    };
  }, []);
  
  // Watch this token for real-time updates via WebSocket
  useEffect(() => {
    if (tokenId) {
      console.log(`[SimpleTokenTrading] Watching token ${tokenId}`);
      watchToken(tokenId);
    }
  }, [tokenId, watchToken]);
  
  // Token details query
  const { 
    data: tokenData, 
    isLoading: isLoadingToken, 
    error: tokenError,
    isFetching: isFetchingToken
  } = useQuery({
    queryKey: [`/api/tokens/${tokenId}`],
    queryFn: async () => {
      const start = performance.now();
      try {
        const res = await fetch(`/api/tokens/${tokenId}`);
        if (!res.ok) {
          throw new Error('Error fetching token details');
        }
        const data = await res.json();
        console.log(`[SimpleTokenTrading] Token details loaded in ${(performance.now() - start).toFixed(2)}ms`);
        return data.token as TokenDetails;
      } catch (error) {
        console.error("[SimpleTokenTrading] Error fetching token:", error);
        throw error;
      }
    },
  });
  
  // Token chart data query - optimized to avoid excessive requests
  const { 
    data: chartData, 
    isLoading: isLoadingChart,
    isFetching: isFetchingChart
  } = useQuery({
    queryKey: [`/api/tokens/${tokenId}/chart`, timeframe, refreshKey],
    queryFn: async () => {
      const start = performance.now();
      try {
        const res = await fetch(`/api/tokens/${tokenId}/chart?timeframe=${timeframe}`);
        if (!res.ok) {
          throw new Error('Error fetching chart data');
        }
        const data = await res.json();
        console.log(`[SimpleTokenTrading] Chart data loaded in ${(performance.now() - start).toFixed(2)}ms`);
        return data.pricePoints.map((point: any) => ({
          ...point,
          time: new Date(point.time),
          price: point.price
        }));
      } catch (error) {
        console.error("[SimpleTokenTrading] Error fetching chart data:", error);
        return [];
      }
    },
    enabled: !!tokenData, // Only fetch if token data is available
  });
  
  // Token holders query - optimized with stale time
  const { 
    data: holdersData, 
    isLoading: isLoadingHolders 
  } = useQuery({
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
        console.error("[SimpleTokenTrading] Error fetching holders:", error);
        return [];
      }
    },
    enabled: !!tokenData, // Only fetch if token data is available
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
  });
  
  // Handle refresh of chart data
  const handleRefreshChart = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Refreshing data",
      description: "Chart data is being updated...",
    });
  };
  
  // Error state rendering
  if (tokenError) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center h-[80vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Token Not Found</h1>
          <p className="text-muted-foreground mb-6">The token you are looking for does not exist or has been removed.</p>
          <Button asChild>
            <Link to="/marketplace">Return to Marketplace</Link>
          </Button>
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
          <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto mt-2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="h-64 bg-slate-200 rounded"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back button and network badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link to="/marketplace">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {tokenData?.name} ({tokenData?.symbol})
          </h1>
          {tokenData?.network && (
            <Badge variant="outline" className="ml-2">
              {tokenData.network}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="flex items-center">
              <TokenPriceDisplay
                tokenId={tokenId}
                initialPrice={tokenData?.price}
                size="lg"
                showChange={true}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {isWebSocketConnected ? (
                <span className="text-green-500 flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5" /> Live updates
                </span>
              ) : (
                <span className="text-yellow-500 flex items-center">
                  <span className="h-2 w-2 rounded-full bg-yellow-500 mr-1.5" /> Connecting...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Token stats and holders */}
        <div className="space-y-6">
          {/* Token stats card */}
          <Card>
            <CardHeader>
              <CardTitle>Token Stats</CardTitle>
              <CardDescription>Current market metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Market Cap</p>
                  <p className="font-medium">
                    ${formatNumber(tokenData?.marketCap || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">24h Volume</p>
                  <p className="font-medium">
                    ${formatNumber(tokenData?.volumeTAS || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Holders</p>
                  <p className="font-medium">
                    {formatNumber(tokenData?.holders || 0, 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Liquidity</p>
                  <p className="font-medium">
                    ${formatNumber(tokenData?.liquidity || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Supply</p>
                  <p className="font-medium">
                    {formatNumber(tokenData?.totalSupply || 0, 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Circulating</p>
                  <p className="font-medium">
                    {formatNumber(tokenData?.circulatingSupply || 0, 0)}
                  </p>
                </div>
              </div>
              
              <div className="pt-2 space-y-1">
                <p className="text-sm text-muted-foreground">All Time High</p>
                <div className="flex justify-between">
                  <p className="font-medium">
                    ${tokenData?.allTimeHigh?.toFixed(6)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tokenData?.allTimeHighDate}
                  </p>
                </div>
              </div>
              
              {tokenData?.contractAddress && (
                <div className="pt-2 space-y-1">
                  <p className="text-sm text-muted-foreground">Contract</p>
                  <p className="font-medium text-xs truncate">{tokenData.contractAddress}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Top Holders Card */}
          <Card>
            <CardHeader>
              <CardTitle>Top Holders</CardTitle>
              <CardDescription>Largest token holders</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHolders ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-6 bg-slate-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {holdersData?.slice(0, 5).map((holder, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 text-sm text-muted-foreground">#{i+1}</div>
                        <div className="truncate max-w-[140px]">
                          {holder.address.substring(0, 6)}...{holder.address.substring(holder.address.length - 4)}
                        </div>
                        {holder.isDeveloper && (
                          <Badge variant="outline" className="ml-2">DEV</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatNumber(holder.balance, 0)}</div>
                        <div className="text-xs text-muted-foreground">{holder.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Bonding Curve Card */}
          {tokenData?.bondingCurveData && (
            <Card>
              <CardHeader>
                <CardTitle>Bonding Curve</CardTitle>
                <CardDescription>Price vs. Supply</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={tokenData.bondingCurveData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="x" 
                        tickFormatter={(value) => formatNumber(value, 0)}
                        label={{ value: 'Supply', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        dataKey="y"
                        tickFormatter={(value) => `$${value.toFixed(4)}`}
                        label={{ value: 'Price', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toFixed(6)}`, 'Price']}
                        labelFormatter={(value) => `Supply: ${formatNumber(value as number, 0)}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="y" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={false}
                      />
                      {tokenData.circulatingSupply && (
                        <ReferenceLine 
                          x={tokenData.circulatingSupply} 
                          stroke="green" 
                          strokeDasharray="3 3"
                          label={{ value: 'Current', position: 'insideTopRight' }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Center column - Price chart */}
        <div className="space-y-6 md:col-span-2">
          <Card className="h-[400px]">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Price Chart</CardTitle>
                  <CardDescription>
                    {formatTimeframe(timeframe)} {isFetchingChart && '• Updating...'}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRefreshChart}
                    disabled={isFetchingChart}
                  >
                    <RefreshCcw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>
              </div>
              <div className="flex space-x-1 pt-2">
                <Button 
                  variant={timeframe === '1h' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTimeframe('1h')}
                >
                  1H
                </Button>
                <Button 
                  variant={timeframe === '24h' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTimeframe('24h')}
                >
                  24H
                </Button>
                <Button 
                  variant={timeframe === '7d' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTimeframe('7d')}
                >
                  7D
                </Button>
                <Button 
                  variant={timeframe === '30d' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTimeframe('30d')}
                >
                  30D
                </Button>
                <Button 
                  variant={timeframe === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTimeframe('all')}
                >
                  ALL
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[290px]">
              {isLoadingChart ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="time" 
                      tickFormatter={(time) => {
                        const date = new Date(time);
                        return timeframe === '1h' 
                          ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : timeframe === '24h'
                            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                      }}
                      scale="time"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tickCount={5}
                    />
                    <YAxis 
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => `$${value.toFixed(6)}`}
                    />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip
                      labelFormatter={(label) => formatDate(new Date(label as string))}
                      formatter={(value: number) => [`$${value.toFixed(6)}`, 'Price']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#8884d8" 
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                    />
                    <Line 
                      type="monotone"
                      dataKey="price"
                      stroke="#8884d8"
                      dot={false}
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center">
                  <p className="text-muted-foreground">No chart data available</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleRefreshChart}
                  >
                    <RefreshCcw className="h-4 w-4 mr-1" />
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Trading Card */}
          <Card>
            <CardHeader>
              <CardTitle>Trade {tokenData?.symbol}</CardTitle>
              <CardDescription>Buy or sell with real-time pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <TokenTradePanel
                  tokenId={tokenId}
                  tokenSymbol={tokenData?.symbol ?? ''}
                  tokenName={tokenData?.name ?? ''}
                  initialPrice={tokenData?.price}
                  userBalance={100} // This would be fetched from the blockchain in a real app
                  onTradeComplete={() => {
                    // Refresh chart data after trade is complete
                    setRefreshKey(prev => prev + 1);
                  }}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Token Analysis Tabs */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Token Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="stats" className="mt-2">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="stats">Key Metrics</TabsTrigger>
                  <TabsTrigger value="community">Community</TabsTrigger>
                  <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
                </TabsList>
                
                <TabsContent value="stats" className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Coins className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Price-to-Sales</p>
                        <p className="font-medium">
                          {(tokenData?.marketCap && tokenData?.volumeTAS 
                            ? (tokenData.marketCap / (tokenData.volumeTAS * 365)).toFixed(2) 
                            : "N/A")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Vol/MarketCap</p>
                        <p className="font-medium">
                          {(tokenData?.volumeTAS && tokenData?.marketCap 
                            ? ((tokenData.volumeTAS / tokenData.marketCap) * 100).toFixed(2) 
                            : "N/A")}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Users className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg. per Holder</p>
                        <p className="font-medium">
                          {(tokenData?.totalSupply && tokenData?.holders 
                            ? formatNumber(tokenData.totalSupply / tokenData.holders, 0) 
                            : "N/A")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Wallet className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Liquidity Ratio</p>
                        <p className="font-medium">
                          {(tokenData?.liquidity && tokenData?.marketCap 
                            ? ((tokenData.liquidity / tokenData.marketCap) * 100).toFixed(2) 
                            : "N/A")}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <h3 className="font-medium mb-2">Token Performance</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-muted-foreground">24h</span>
                          {parseFloat(tokenData?.percentChange24h?.toString() || '0') >= 0 ? (
                            <div className="flex items-center text-green-500">
                              <ArrowUp className="h-3 w-3 mr-0.5" />
                              <span>{Math.abs(parseFloat(tokenData?.percentChange24h?.toString() || '0')).toFixed(2)}%</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-500">
                              <ArrowDown className="h-3 w-3 mr-0.5" />
                              <span>{Math.abs(parseFloat(tokenData?.percentChange24h?.toString() || '0')).toFixed(2)}%</span>
                            </div>
                          )}
                        </div>
                        <div className="h-12">
                          {chartData && chartData.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData.slice(-24)}>
                                <Line 
                                  type="monotone" 
                                  dataKey="price" 
                                  stroke={parseFloat(tokenData?.percentChange24h?.toString() || '0') >= 0 ? "#10b981" : "#ef4444"} 
                                  strokeWidth={1.5} 
                                  dot={false} 
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-muted-foreground">7d</span>
                          <div className="flex items-center text-green-500">
                            <ArrowUp className="h-3 w-3 mr-0.5" />
                            <span>2.35%</span>
                          </div>
                        </div>
                        <div className="h-12">
                          {chartData && chartData.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData}>
                                <Line 
                                  type="monotone" 
                                  dataKey="price" 
                                  stroke="#10b981" 
                                  strokeWidth={1.5} 
                                  dot={false} 
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-muted-foreground">30d</span>
                          <div className="flex items-center text-red-500">
                            <ArrowDown className="h-3 w-3 mr-0.5" />
                            <span>1.87%</span>
                          </div>
                        </div>
                        <div className="h-12">
                          {chartData && chartData.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData}>
                                <Line 
                                  type="monotone" 
                                  dataKey="price" 
                                  stroke="#ef4444" 
                                  strokeWidth={1.5} 
                                  dot={false} 
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="community" className="pt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-100 rounded-lg p-4">
                        <h3 className="font-medium mb-2 flex items-center">
                          <Users className="h-4 w-4 mr-2" /> 
                          Community Size
                        </h3>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-bold">{tokenData?.holders?.toLocaleString() || 'N/A'}</span>
                          <span className="text-sm text-muted-foreground">holders</span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-100 rounded-lg p-4">
                        <h3 className="font-medium mb-2 flex items-center">
                          <Eye className="h-4 w-4 mr-2" /> 
                          Market Attention
                        </h3>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-bold">Medium</span>
                          <span className="text-sm text-muted-foreground">visibility</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-100 rounded-lg p-4">
                      <h3 className="font-medium mb-2">Community Links</h3>
                      <p className="text-muted-foreground text-sm">
                        Connect with the {tokenData?.symbol} community and stay updated.
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <Button variant="outline" size="sm" className="w-full">
                          Website
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          Telegram
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          Twitter
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          Discord
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Recent Activity</h3>
                      <div className="space-y-2">
                        <div className="bg-gray-100 rounded-lg p-3 text-sm">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1.5 text-muted-foreground" />
                            <span className="text-muted-foreground">2 hours ago</span>
                          </div>
                          <p>New community AMA scheduled for next week</p>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-3 text-sm">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1.5 text-muted-foreground" />
                            <span className="text-muted-foreground">1 day ago</span>
                          </div>
                          <p>Website update with new roadmap released</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="risks" className="pt-4">
                  <div className="space-y-4">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <h3 className="font-medium mb-2 flex items-center">
                        <Shield className="h-4 w-4 mr-2" /> 
                        Safety Score
                      </h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <span className="text-sm font-medium">75/100</span>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Good overall safety rating with verified contract
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Risk Factors</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
                          <span>Supply Concentration</span>
                          <Badge variant={holdersData?.[0]?.percentage > 50 ? "destructive" : "outline"}>
                            {holdersData?.[0]?.percentage > 50 ? "High" : "Medium"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
                          <span>Liquidity Depth</span>
                          <Badge variant="outline">
                            Medium
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
                          <span>Price Volatility</span>
                          <Badge variant="outline">
                            Medium
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
                          <span>Contract Audit</span>
                          <Badge variant="outline" className="bg-green-100">
                            Verified
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SimpleTokenTrading;