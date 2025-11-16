import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTASChain } from "@/contexts/TASChainContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Wallet, ArrowUpRight, TrendingUp, Award, Sparkles, BarChart4, Clock, Zap, Flame } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { fetchCreatedTokens } from "@/services/tokenService";

interface TokenCardProps {
  id: number;
  name: string;
  symbol: string;
  creator: string;
  initialSupply: string;
  createdAt: string;
  logo?: string;
  status: string;
  category?: string;
  priceChange?: string;
  timeAgo?: string;
  holders?: string;
  socialMetric?: string;
}

const TokenCard = ({ 
  id,
  name, 
  symbol, 
  creator, 
  initialSupply, 
  createdAt, 
  logo, 
  status, 
  category,
  priceChange,
  timeAgo,
  holders,
  socialMetric
}: TokenCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow cursor-pointer">
      <a href={`/token/${id}/trade`} className="block">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {logo ? (
                <img src={logo} alt={`${symbol} logo`} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-sky-400 flex items-center justify-center text-white font-bold">
                  {symbol.slice(0, 2)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-slate-800">{name}</h3>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-slate-500">${symbol}</span>
                  <Badge variant="outline" className="text-[10px] py-0 h-4">TAS Chain</Badge>
                </div>
              </div>
            </div>
            
            {/* Show status badge for all tokens */}
            <Badge 
              variant={status === "completed" ? "default" : status === "pending" ? "outline" : "destructive"}
              className={`${status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}
            >
              {status === "completed" ? "Live" : status === "pending" ? "Pending" : "Failed"}
            </Badge>
          </div>
          
          <div className="mt-3 text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span className="flex items-center"><Wallet className="h-3 w-3 mr-1" /> Creator:</span>
              <span className="text-slate-700 font-medium">{creator}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="flex items-center"><ArrowUpRight className="h-3 w-3 mr-1" /> Initial Supply:</span>
              <span className="text-slate-700 font-medium">{initialSupply}</span>
            </div>
            
            {/* Always show creation date */}
            <div className="flex justify-between">
              <span className="flex items-center"><TrendingUp className="h-3 w-3 mr-1" /> Created:</span>
              <span className="text-slate-700 font-medium">{createdAt}</span>
            </div>
          </div>
        </div>
      </a>
      
      <div className="border-t border-slate-100 bg-slate-50 py-2 px-4 flex">
        <a href={`/token/${id}/trade`} className="w-3/4">
          <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary hover:bg-slate-100">
            Trade Now
          </Button>
        </a>
        <a href={`https://tasonscan.com/token/${id}`} target="_blank" rel="noopener noreferrer" className="w-1/4 ml-1">
          <Button variant="outline" size="sm" className="w-full">
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </div>
  );
};

interface TokenData {
  id: number;
  name: string;
  symbol: string;
  creator: string;
  initialSupply: string;
  createdAt: string;
  status: string;
  category?: string;
  priceChange?: string;
  timeAgo?: string;
  holders?: string;
  socialMetric?: string;
  isNative?: boolean;
}

interface TokensData {
  trending: TokenData[];
  newest: TokenData[];
  popular: TokenData[];
  social: TokenData[];
}

const CreatedTokensSection = () => {
  const { translate } = useLanguage();
  const { explorer } = useTASChain();
  
  // Fetch real token data from the blockchain
  const { data: blockchainTokens, isLoading, error } = useQuery({
    queryKey: ["blockchain-tokens"],
    queryFn: fetchCreatedTokens,
  });
  
  // Create categorized token lists
  const tokensByCategory: TokensData = {
    trending: [],
    newest: [],
    popular: [],
    social: []
  };
  
  // Process tokens and categorize them
  if (blockchainTokens && blockchainTokens.length > 0) {
    // Sort tokens by creation time (newest first)
    const sortedTokens = [...blockchainTokens].sort((a, b) => {
      const dateA = new Date(a.creationTime).getTime();
      const dateB = new Date(b.creationTime).getTime();
      return dateB - dateA; // newest first
    });
    
    // For trending tab - only real tokens, no mock data
    tokensByCategory.trending = sortedTokens.map((token, index) => ({
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      creator: token.creator.slice(0, 6) + '...' + token.creator.slice(-4),
      initialSupply: Number(token.initialSupply).toLocaleString('en-US'),
      createdAt: token.creationTime,
      status: "completed",
      category: "trending"
    }));
    
    // For newest tab - tokens sorted by creation time
    tokensByCategory.newest = sortedTokens.map((token, index) => {
      // Calculate time difference from now to creation time
      const creationDate = new Date(token.creationTime);
      const now = new Date();
      const diffMs = now.getTime() - creationDate.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      
      let timeAgo;
      if (diffHrs < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        timeAgo = `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffHrs < 24) {
        timeAgo = `${diffHrs} ${diffHrs === 1 ? 'hour' : 'hours'} ago`;
      } else {
        const diffDays = Math.floor(diffHrs / 24);
        timeAgo = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      }
      
      return {
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        creator: token.creator.slice(0, 6) + '...' + token.creator.slice(-4),
        initialSupply: Number(token.initialSupply).toLocaleString('en-US'),
        createdAt: token.creationTime,
        status: "completed",
        timeAgo,
        category: "newest"
      };
    });
    
    // For popular tab - only real tokens, no mock data
    tokensByCategory.popular = sortedTokens.map((token, index) => ({
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      creator: token.creator.slice(0, 6) + '...' + token.creator.slice(-4),
      initialSupply: Number(token.initialSupply).toLocaleString('en-US'),
      createdAt: token.creationTime,
      status: "completed",
      category: "popular"
    }));
    
    // For social tab - only real tokens, no mock data
    tokensByCategory.social = sortedTokens.map((token, index) => ({
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      creator: token.creator.slice(0, 6) + '...' + token.creator.slice(-4),
      initialSupply: Number(token.initialSupply).toLocaleString('en-US'),
      createdAt: token.creationTime,
      status: "completed",
      category: "social"
    }));
  }
  
  // We're now using tabs instead of filters, so we'll use this state
  const [activeTab, setActiveTab] = useState("trending");
  
  return (
    <section className="py-12 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Badge 
            variant="outline" 
            className="bg-primary/10 text-primary border-primary mb-2"
          >
            <Award className="h-3 w-3 mr-1" />
            TAS Ecosystem
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Popular Projects on <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-sky-500">TAS Chain</span>
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Create and trade tokens on the TAS Chain blockchain with automated bonding curves for instant liquidity
          </p>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-lg shadow-sm">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading tokens...</span>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="trending" className="w-full" onValueChange={setActiveTab}>
            <div className="flex justify-center mb-6">
              <TabsList className="bg-white border border-slate-200 p-1 rounded-full shadow-sm h-auto">
                <TabsTrigger 
                  value="trending"
                  className={`rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none`}
                >
                  <Flame className="h-4 w-4 mr-1 inline-block" /> 
                  Hottest
                </TabsTrigger>
                <TabsTrigger 
                  value="newest"
                  className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none"
                >
                  <Clock className="h-4 w-4 mr-1 inline-block" /> 
                  Newest
                </TabsTrigger>
                <TabsTrigger 
                  value="popular"
                  className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none"
                >
                  <BarChart4 className="h-4 w-4 mr-1 inline-block" /> 
                  Popular
                </TabsTrigger>
                <TabsTrigger 
                  value="social"
                  className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none"
                >
                  <Sparkles className="h-4 w-4 mr-1 inline-block" /> 
                  Social
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="trending" className="mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tokensByCategory.trending.map((token) => (
                  <TokenCard 
                    key={token.id}
                    id={token.id}
                    name={token.name}
                    symbol={token.symbol}
                    creator={token.creator}
                    initialSupply={token.initialSupply}
                    createdAt={token.createdAt}
                    status={token.status}
                    category={token.category}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="newest" className="mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tokensByCategory.newest.map((token) => (
                  <TokenCard 
                    key={token.id}
                    id={token.id}
                    name={token.name}
                    symbol={token.symbol}
                    creator={token.creator}
                    initialSupply={token.initialSupply}
                    createdAt={token.createdAt}
                    status={token.status}
                    category={token.category}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="popular" className="mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tokensByCategory.popular.map((token) => (
                  <TokenCard 
                    key={token.id}
                    id={token.id}
                    name={token.name}
                    symbol={token.symbol}
                    creator={token.creator}
                    initialSupply={token.initialSupply}
                    createdAt={token.createdAt}
                    status={token.status}
                    category={token.category}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="social" className="mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tokensByCategory.social.map((token) => (
                  <TokenCard 
                    key={token.id}
                    id={token.id}
                    name={token.name}
                    symbol={token.symbol}
                    creator={token.creator}
                    initialSupply={token.initialSupply}
                    createdAt={token.createdAt}
                    status={token.status}
                    category={token.category}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        <div className="text-center mt-8">
          <a href="/create-token">
            <Button className="bg-gradient-to-r from-primary to-sky-400 hover:from-primary-600 hover:to-sky-500 shadow-md hover:shadow-lg transition-all">
              Create Your Own Token
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default CreatedTokensSection;