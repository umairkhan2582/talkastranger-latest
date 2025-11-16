import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/contexts/WalletContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  RefreshCw, 
  ArrowDown, 
  Info, 
  ExternalLink, 
  AlertCircle,
  Loader2,
  Copy,
  Check
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ethers } from "ethers";
import { 
  TAS_TOKEN_ADDRESS, 
  USDT_TOKEN_ADDRESS,
  TAS_TOKEN_SALE_ADDRESS,
  TAS_REWARDS_CONTRACT_ADDRESS,
  getTokenContract,
  getTokenSaleContract,
  buyTASWithBNB,
  buyTASWithUSDT,
  getCurrentTASPriceFromContract,
} from "@/utils/contractUtils";
import { 
  getTASPriceFromDexScreener,
  getBNBPrice,
  getTASMarketData,
} from "@/utils/priceUtils";
import { formatNumber, shortenAddress, copyToClipboard } from "@/utils/uiHelpers";
import TASMascot from "@/components/TASMascot";

// Component for displaying contract addresses with copy
const ContractAddress = ({ label, address }: { label: string; address: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await copyToClipboard(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="flex flex-col space-y-1 mb-2">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="flex items-center">
        <code className="bg-muted p-1 text-xs rounded">{shortenAddress(address)}</code>
        <button 
          onClick={handleCopy} 
          className="ml-1.5 text-muted-foreground hover:text-primary transition-colors"
          aria-label="Copy address"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
};

// Token allocation data for visualization
const tokenAllocation = [
  { name: "Token Sale", percentage: 5, color: "hsl(142, 76%, 46%)" },
  { name: "User Rewards", percentage: 10, color: "hsl(225, 76%, 56%)" },
  { name: "Development", percentage: 5, color: "hsl(280, 76%, 56%)" },
  { name: "Team & Advisors", percentage: 15, color: "hsl(46, 76%, 56%)" },
  { name: "Locked (1 year)", percentage: 65, color: "hsl(0, 76%, 56%)" }
];

// Simple pie chart component to show token allocation
const TokenAllocationChart = () => {
  return (
    <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
      <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">Token Allocation</h3>
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 h-48 relative">
          {/* Visual representation of token allocation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-36 h-36 rounded-full overflow-hidden relative">
              {tokenAllocation.map((item, index) => {
                // Calculate rotation for pie segments
                const previousPercentages = tokenAllocation
                  .slice(0, index)
                  .reduce((sum, segment) => sum + segment.percentage, 0);
                const startAngle = (previousPercentages / 100) * 360;
                const endAngle = ((previousPercentages + item.percentage) / 100) * 360;
                
                return (
                  <div 
                    key={index}
                    className="absolute inset-0"
                    style={{
                      background: `conic-gradient(transparent 0deg, ${item.color} ${startAngle}deg, ${item.color} ${endAngle}deg, transparent ${endAngle}deg)`
                    }}
                  />
                );
              })}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <div className="text-xs font-semibold text-primary">TAS</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* TAS Mascot beside the chart */}
          <div className="absolute -top-3 -right-2 pulse-glow hidden sm:block">
            <TASMascot size="md" animated={true} />
          </div>
          
          {/* Speech bubble */}
          <div className="absolute top-0 -right-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl px-3 py-2 shadow-md hidden sm:block">
            <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300">I'll help explain tokenomics!</div>
            <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-3 h-3 bg-indigo-100 dark:bg-indigo-900"></div>
          </div>
        </div>
        <div className="flex-1 mt-4 md:mt-0 space-y-2">
          {tokenAllocation.map((item, index) => (
            <div key={index} className="flex items-center hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded-md transition-colors">
              <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
              <div className="flex-1 text-sm text-slate-700 dark:text-slate-300">{item.name}</div>
              <div className="font-medium text-slate-900 dark:text-white">{item.percentage}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function SimpleBnbSwap() {
  const { t, language } = useLanguage();
  const { 
    address, 
    isConnected, 
    openConnectModal 
  } = useWallet();
  const { toast } = useToast();
  
  // State for token data
  const [tokenPrice, setTokenPrice] = useState<number>(0.001);
  const [bnbPrice, setBnbPrice] = useState<number>(350);
  const [marketCap, setMarketCap] = useState<string>("250000");
  const [totalTokens, setTotalTokens] = useState<number>(50000000);
  const [tokensSold, setTokensSold] = useState<number>(5000000);
  const [saleProgress, setSaleProgress] = useState<number>(10);
  const [saleActive, setSaleActive] = useState<boolean>(true);
  const [volume24h, setVolume24h] = useState<number>(0);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const [liquidityUsd, setLiquidityUsd] = useState<number>(0);
  
  // State for user data
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [bnbBalance, setBnbBalance] = useState<string>("0");
  const [insufficientBnb, setInsufficientBnb] = useState<boolean>(false);
  
  // State for UI
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBuying, setIsBuying] = useState<boolean>(false);
  const [paymentToken, setPaymentToken] = useState<string>("BNB");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [receiveTasAmount, setReceiveTasAmount] = useState<string>("");
  
  // Fetch all contract data
  const fetchContractData = async () => {
    let hasContractData = false;
    setIsLoading(true);
    
    try {
      // Get comprehensive TAS market data from DexScreener API
      try {
        console.log("Getting TAS market data from DexScreener API...");
        const marketData = await getTASMarketData();
        
        if (marketData.price && !isNaN(marketData.price)) {
          console.log("Got DexScreener market data:", marketData);
          
          // Update all market data in state
          setTokenPrice(marketData.price);
          setMarketCap(marketData.marketCap.toString());
          setVolume24h(marketData.volume24h);
          setPriceChange24h(marketData.priceChange24h);
          setLiquidityUsd(marketData.liquidityUsd);
          
          // Store in localStorage for fallback
          localStorage.setItem('lastKnownTASPrice', marketData.price.toString());
          localStorage.setItem('lastKnownMarketCap', marketData.marketCap.toString());
          localStorage.setItem('lastKnownVolume24h', marketData.volume24h.toString());
          localStorage.setItem('lastKnownPriceChange24h', marketData.priceChange24h.toString());
          localStorage.setItem('lastKnownLiquidityUsd', marketData.liquidityUsd.toString());
          
          hasContractData = true;
        } else {
          throw new Error("Invalid DexScreener market data");
        }
      } catch (dexScreenerError) {
        console.error("Failed to get market data from DexScreener:", dexScreenerError);
        
        // Use contract price as a fallback
        try {
          const contractPriceStr = await getCurrentTASPriceFromContract();
          if (contractPriceStr && !isNaN(parseFloat(contractPriceStr))) {
            const contractPrice = parseFloat(contractPriceStr);
            console.log("Using contract price:", contractPrice);
            setTokenPrice(contractPrice);
            
            // Calculate market cap based on the contract price
            const circulatingSupply = 250000000;
            const calculatedMarketCap = (circulatingSupply * contractPrice).toString();
            setMarketCap(calculatedMarketCap);
            
            localStorage.setItem('lastKnownTASPrice', contractPrice.toString());
            localStorage.setItem('lastKnownMarketCap', calculatedMarketCap);
            
            hasContractData = true;
          } else {
            throw new Error("Invalid contract price data");
          }
        } catch (contractError) {
          console.error("Failed to get price from contract:", contractError);
          
          // Try to use last known values from localStorage
          const lastPrice = localStorage.getItem('lastKnownTASPrice');
          const lastMarketCap = localStorage.getItem('lastKnownMarketCap');
          const lastVolume24h = localStorage.getItem('lastKnownVolume24h');
          const lastPriceChange24h = localStorage.getItem('lastKnownPriceChange24h');
          const lastLiquidityUsd = localStorage.getItem('lastKnownLiquidityUsd');
          
          if (lastPrice && lastMarketCap) {
            setTokenPrice(parseFloat(lastPrice));
            setMarketCap(lastMarketCap);
            if (lastVolume24h) setVolume24h(parseFloat(lastVolume24h));
            if (lastPriceChange24h) setPriceChange24h(parseFloat(lastPriceChange24h));
            if (lastLiquidityUsd) setLiquidityUsd(parseFloat(lastLiquidityUsd));
            
            hasContractData = true;
          } else {
            // Use default value as absolute last resort
            console.log("Using default price fallback: 0.005");
            setTokenPrice(0.005);
            
            // Set default market cap
            const circulatingSupply = 250000000;
            const defaultMarketCap = (circulatingSupply * 0.005).toString();
            setMarketCap(defaultMarketCap);
            
            localStorage.setItem('lastKnownTASPrice', "0.005");
            localStorage.setItem('lastKnownMarketCap', defaultMarketCap);
            
            hasContractData = true;
          }
        }
      }
      
      // Get BNB price (needed for conversion calculations)
      try {
        const bnbPriceData = await getBNBPrice();
        if (bnbPriceData && !isNaN(bnbPriceData)) {
          setBnbPrice(bnbPriceData);
          localStorage.setItem('lastKnownBNBPrice', bnbPriceData.toString());
        } else {
          // Use fallback value
          const lastBnbPrice = localStorage.getItem('lastKnownBNBPrice');
          setBnbPrice(lastBnbPrice ? parseFloat(lastBnbPrice) : 350);
        }
      } catch (bnbErr) {
        console.error("Error getting BNB price:", bnbErr);
        const lastBnbPrice = localStorage.getItem('lastKnownBNBPrice');
        setBnbPrice(lastBnbPrice ? parseFloat(lastBnbPrice) : 350);
      }
      
      try {
        // Get tokens for sale and tokens sold
        const tokenSaleContract = await getTokenSaleContract(false);
        
        // Check if sale is active
        const saleActiveState = await tokenSaleContract.saleActive();
        setSaleActive(saleActiveState);
        
        // Get tokens sold
        const soldTokens = await tokenSaleContract.tokensSold();
        const soldTokensFormatted = parseFloat(ethers.utils.formatUnits(soldTokens, 18));
        setTokensSold(soldTokensFormatted);
        
        // Get total tokens for sale
        const totalTokensForSale = await tokenSaleContract.tokensForSale();
        const totalTokensFormatted = parseFloat(ethers.utils.formatUnits(totalTokensForSale, 18));
        setTotalTokens(totalTokensFormatted);
        
        // Calculate progress
        const progress = (soldTokensFormatted / totalTokensFormatted) * 100;
        setSaleProgress(parseFloat(progress.toFixed(1)));
        
        // Save to localStorage for fallback
        localStorage.setItem('lastKnownTokensSold', soldTokensFormatted.toString());
        localStorage.setItem('lastKnownTotalTokens', totalTokensFormatted.toString());
        localStorage.setItem('lastKnownSaleProgress', progress.toString());
        localStorage.setItem('lastKnownSaleActive', saleActiveState.toString());
        
        hasContractData = true;
      } catch (err) {
        console.error("Error fetching token sale stats:", err);
        
        // Use fallback values from localStorage or defaults
        const lastTokensSold = localStorage.getItem('lastKnownTokensSold');
        setTokensSold(lastTokensSold ? parseFloat(lastTokensSold) : 5000000);
        
        const lastTotalTokens = localStorage.getItem('lastKnownTotalTokens');
        setTotalTokens(lastTotalTokens ? parseFloat(lastTotalTokens) : 50000000);
        
        const lastSaleProgress = localStorage.getItem('lastKnownSaleProgress');
        setSaleProgress(lastSaleProgress ? parseFloat(lastSaleProgress) : 10);
        
        const lastSaleActive = localStorage.getItem('lastKnownSaleActive');
        setSaleActive(lastSaleActive ? lastSaleActive === 'true' : true);
      }
      
      // Get user balances if connected
      if (address) {
        try {
          // Get TAS token balance
          const tasToken = await getTokenContract(TAS_TOKEN_ADDRESS);
          const balance = await tasToken.balanceOf(address);
          const formattedBalance = ethers.utils.formatUnits(balance, 18);
          setTokenBalance(formattedBalance);
          
          // Save to localStorage for fallback
          localStorage.setItem('lastKnownTASBalance', formattedBalance);
          
          // Get BNB balance
          if (window.ethereum) {
            try {
              const provider = new ethers.providers.Web3Provider(window.ethereum);
              const bnbBalance = await provider.getBalance(address);
              const formattedBnbBalance = ethers.utils.formatEther(bnbBalance);
              setBnbBalance(formattedBnbBalance);
              
              // Check if BNB balance is too low for transactions
              const bnbBalanceValue = parseFloat(formattedBnbBalance);
              setInsufficientBnb(bnbBalanceValue < 0.005);
              
              // Save to localStorage for fallback
              localStorage.setItem('lastKnownBNBBalance', formattedBnbBalance);
            } catch (bnbErr) {
              console.error("Error getting BNB balance:", bnbErr);
              const lastBnbBalance = localStorage.getItem('lastKnownBNBBalance');
              setBnbBalance(lastBnbBalance || "0");
            }
          } else {
            console.warn("Ethereum provider not available");
            const lastBnbBalance = localStorage.getItem('lastKnownBNBBalance');
            setBnbBalance(lastBnbBalance || "0");
          }
          
          // Get USDT balance if needed
          if (paymentToken === "USDT") {
            try {
              const usdtToken = await getTokenContract(USDT_TOKEN_ADDRESS);
              const usdtBalance = await usdtToken.balanceOf(address);
              const formattedUsdtBalance = ethers.utils.formatUnits(usdtBalance, 6);
              // We'd need to store this in state if we want to use it
              console.log("USDT Balance:", formattedUsdtBalance);
              
              // Save to localStorage for fallback
              localStorage.setItem('lastKnownUSDTBalance', formattedUsdtBalance);
            } catch (usdtErr) {
              console.error("Error fetching USDT balance:", usdtErr);
              // Use fallback value if available
              const lastUsdtBalance = localStorage.getItem('lastKnownUSDTBalance');
              console.log("Using cached USDT Balance:", lastUsdtBalance || "0");
            }
          }
        } catch (balanceErr) {
          console.error("Error fetching user token balances:", balanceErr);
          // Use fallback values from localStorage
          const lastTasBalance = localStorage.getItem('lastKnownTASBalance');
          setTokenBalance(lastTasBalance || "0");
          
          const lastBnbBalance = localStorage.getItem('lastKnownBNBBalance');
          setBnbBalance(lastBnbBalance || "0");
        }
      }
      
      setIsLoading(false);
      
      if (!hasContractData) {
        toast({
          title: "Network Connection Issues",
          description: "Using cached data. Some prices may not be current.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching contract data:", error);
      
      // Ensure we have default values set
      const lastPrice = localStorage.getItem('lastKnownTASPrice');
      setTokenPrice(lastPrice ? parseFloat(lastPrice) : 0.001);
      
      const lastBnbPrice = localStorage.getItem('lastKnownBNBPrice');
      setBnbPrice(lastBnbPrice ? parseFloat(lastBnbPrice) : 350);
      
      const lastMarketCap = localStorage.getItem('lastKnownMarketCap');
      setMarketCap(lastMarketCap || "250000");
      
      const lastTokensSold = localStorage.getItem('lastKnownTokensSold');
      setTokensSold(lastTokensSold ? parseFloat(lastTokensSold) : 5000000);
      
      const lastTotalTokens = localStorage.getItem('lastKnownTotalTokens');
      setTotalTokens(lastTotalTokens ? parseFloat(lastTotalTokens) : 50000000);
      
      const lastSaleProgress = localStorage.getItem('lastKnownSaleProgress');
      setSaleProgress(lastSaleProgress ? parseFloat(lastSaleProgress) : 10);
      
      const lastSaleActive = localStorage.getItem('lastKnownSaleActive');
      setSaleActive(lastSaleActive ? lastSaleActive === 'true' : true);
      
      toast({
        title: "Connection Error",
        description: "Failed to fetch live token sale data. Using cached data instead.",
        variant: "destructive",
      });
      
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchContractData();
    
    // Set up refresh intervals - different timers for different data
    // Real-time price updates (every 30 seconds) - ONLY using DexScreener
    const priceInterval = setInterval(async () => {
      try {
        // ONLY get TAS price from DexScreener API
        try {
          console.log("Refreshing TAS price from DexScreener API...");
          const dexScreenerPrice = await getTASPriceFromDexScreener();
          
          if (dexScreenerPrice && !isNaN(dexScreenerPrice)) {
            console.log("Refresh - got DexScreener price:", dexScreenerPrice);
            setTokenPrice(dexScreenerPrice);
            localStorage.setItem('lastKnownTASPrice', dexScreenerPrice.toString());
            
            // Calculate market cap based on the DexScreener price
            const circulatingSupply = 250000000;
            const calculatedMarketCap = (circulatingSupply * dexScreenerPrice).toString();
            setMarketCap(calculatedMarketCap);
            
            // Update the TAS amount if payment amount is set
            if (paymentAmount && paymentToken === "BNB") {
              const amount = parseFloat(paymentAmount);
              if (!isNaN(amount)) {
                const tasAmount = amount * (bnbPrice / dexScreenerPrice);
                setReceiveTasAmount(tasAmount.toString());
              }
            }
          } else {
            throw new Error("Invalid DexScreener price data");
          }
        } catch (dexScreenerError) {
          console.error("Refresh - failed to get price from DexScreener:", dexScreenerError);
        }
        
        // Update BNB price regardless of TAS price source
        try {
          const bnbPriceData = await getBNBPrice();
          if (bnbPriceData && !isNaN(bnbPriceData)) {
            setBnbPrice(bnbPriceData);
            localStorage.setItem('lastKnownBNBPrice', bnbPriceData.toString());
          }
        } catch (bnbErr) {
          console.error("Refresh - error updating BNB price:", bnbErr);
        }
      } catch (error) {
        console.error("Refresh - error updating all price data:", error);
      }
    }, 30000);
    
    // Full data refresh (every 60 seconds)
    const fullDataInterval = setInterval(fetchContractData, 60000);
    
    // If user is connected, refresh balances more frequently (every 15 seconds)
    let balanceInterval: NodeJS.Timeout | null = null;
    if (address) {
      balanceInterval = setInterval(async () => {
        try {
          // Get TAS token balance
          const tasToken = await getTokenContract(TAS_TOKEN_ADDRESS);
          const balance = await tasToken.balanceOf(address);
          setTokenBalance(ethers.utils.formatUnits(balance, 18));
          
          // Get BNB balance
          if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const bnbBalance = await provider.getBalance(address);
            const bnbBalanceValue = parseFloat(ethers.utils.formatEther(bnbBalance));
            setBnbBalance(ethers.utils.formatEther(bnbBalance));
            
            // Check if BNB balance is too low for transactions
            setInsufficientBnb(bnbBalanceValue < 0.005);
          }
        } catch (error) {
          console.error("Error updating balance data:", error);
        }
      }, 15000);
    }
    
    return () => {
      clearInterval(priceInterval);
      clearInterval(fullDataInterval);
      if (balanceInterval) clearInterval(balanceInterval);
    };
  }, [address, paymentAmount, paymentToken, bnbPrice, toast]);

  // Handle Max Amount
  const handleMaxAmount = () => {
    if (paymentToken === "BNB") {
      // Leave some BNB for gas
      const maxBnb = Math.max(0, parseFloat(bnbBalance) - 0.01);
      if (maxBnb > 0) {
        setPaymentAmount(maxBnb.toString());
        const tasAmount = maxBnb * (bnbPrice / tokenPrice);
        setReceiveTasAmount(tasAmount.toString());
      }
    } else {
      // For USDT, we'd need to fetch the USDT balance
      setPaymentAmount("100");
      const tasAmount = 100 / tokenPrice;
      setReceiveTasAmount(tasAmount.toString());
    }
  };

  // Handle payment amount change
  const handlePaymentAmountChange = (value: string) => {
    setPaymentAmount(value);
    // Calculate TAS amount
    if (value) {
      const amount = parseFloat(value);
      if (!isNaN(amount)) {
        let tasAmount;
        if (paymentToken === "BNB") {
          tasAmount = amount * (bnbPrice / tokenPrice);
        } else {
          tasAmount = amount / tokenPrice;
        }
        setReceiveTasAmount(tasAmount.toString());
      } else {
        setReceiveTasAmount("");
      }
    } else {
      setReceiveTasAmount("");
    }
  };

  // Handle TAS amount change
  const handleTasAmountChange = (value: string) => {
    setReceiveTasAmount(value);
    // Calculate payment amount
    if (value) {
      const amount = parseFloat(value);
      if (!isNaN(amount)) {
        let payAmount;
        if (paymentToken === "BNB") {
          payAmount = amount / (bnbPrice / tokenPrice);
        } else {
          payAmount = amount * tokenPrice;
        }
        setPaymentAmount(payAmount.toFixed(paymentToken === "BNB" ? 6 : 2));
      } else {
        setPaymentAmount("");
      }
    } else {
      setPaymentAmount("");
    }
  };

  // Handle token purchase
  const handleBuyTas = async () => {
    if (!isConnected) {
      openConnectModal();
      return;
    }
    
    if (!paymentAmount || !receiveTasAmount) {
      toast({
        title: "Missing input",
        description: "Please enter an amount to purchase",
        variant: "destructive",
      });
      return;
    }
    
    // Validate BNB balance if using BNB
    if (paymentToken === "BNB") {
      const bnbValue = parseFloat(paymentAmount);
      const bnbBalanceValue = parseFloat(bnbBalance);
      
      if (bnbValue > bnbBalanceValue) {
        toast({
          title: "Insufficient BNB balance",
          description: `You need ${bnbValue.toFixed(6)} BNB but only have ${bnbBalanceValue.toFixed(6)} BNB`,
          variant: "destructive",
        });
        return;
      }
      
      // Ensure we leave some BNB for gas
      if (bnbBalanceValue - bnbValue < 0.001) {
        toast({
          title: "Not enough BNB for gas",
          description: "Please leave at least 0.001 BNB for gas fees",
          variant: "destructive",
        });
        return;
      }
    }
    
    try {
      setIsBuying(true);
      
      if (paymentToken === "BNB") {
        // Buy with BNB
        toast({
          title: "Processing transaction",
          description: "Please confirm the transaction in your wallet",
        });
        
        const receipt = await buyTASWithBNB(
          paymentAmount,
          receiveTasAmount
        );
        
        toast({
          title: "Purchase successful",
          description: `Successfully purchased ${formatNumber(parseFloat(receiveTasAmount))} TAS tokens`,
        });
        
        // Refresh data after a short delay to allow the blockchain to update
        setTimeout(async () => {
          await fetchContractData();
        }, 2000);
        
        // Clear form
        setPaymentAmount("");
        setReceiveTasAmount("");
      } else {
        // Buy with USDT
        toast({
          title: "Processing transaction",
          description: "Please approve USDT spending and confirm the transaction",
        });
        
        const receipt = await buyTASWithUSDT(receiveTasAmount);
        
        toast({
          title: "Purchase successful",
          description: `Successfully purchased ${formatNumber(parseFloat(receiveTasAmount))} TAS tokens`,
        });
        
        // Refresh data after a short delay to allow the blockchain to update
        setTimeout(async () => {
          await fetchContractData();
        }, 2000);
        
        // Clear form
        setPaymentAmount("");
        setReceiveTasAmount("");
      }
      
      setIsBuying(false);
    } catch (err) {
      const error = err as Error;
      console.error("Error buying tokens:", error);
      
      // Try to extract more user-friendly error message
      let errorMessage = "There was an error processing your purchase";
      
      if (error && typeof error === 'object' && 'message' in error) {
        const message = error.message as string;
        if (message.includes("user rejected transaction")) {
          errorMessage = "Transaction rejected by user";
        } else if (message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for transaction";
        } else if (message.length < 100) {
          errorMessage = message;
        }
      }
      
      toast({
        title: "Transaction failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsBuying(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold mb-4 text-slate-900 dark:text-white">
          {t('bnbSwap.title')}
        </h1>
        <p className="text-lg font-medium mb-6 text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
          {t('bnbSwap.subtitle')}
        </p>
      </div>
      
      {/* Token Sale Status Card */}
      <Card className="mb-8 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardTitle className="text-2xl">
            TASChain Token Sale
          </CardTitle>
          <CardDescription className="text-indigo-100 font-medium">
            {t('bnbSwap.tokenSaleDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-2 text-muted-foreground">Loading token sale data...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
                    {t('bnbSwap.tokenMetrics')}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('bnbSwap.price')}</span>
                      <span className="font-medium text-slate-900 dark:text-white">${tokenPrice.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('bnbSwap.marketCap')}</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        ${formatNumber(parseFloat(marketCap))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">24h Volume</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        ${formatNumber(volume24h)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">24h Change</span>
                      <span className={`font-medium ${priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {priceChange24h > 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('bnbSwap.totalSupply')}</span>
                      <span className="font-medium text-slate-900 dark:text-white">1,000,000,000 TAS</span>
                    </div>
                    {isConnected && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('bnbSwap.yourBalance')}</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {formatNumber(parseFloat(tokenBalance))} TAS
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
                    {t('bnbSwap.tokenSale')}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('bnbSwap.salesStatus')}</span>
                      <Badge 
                        className={saleActive ? "bg-green-600" : "bg-yellow-600"}
                      >
                        {saleActive ? t('bnbSwap.active') : t('bnbSwap.paused')}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('bnbSwap.tokensForSale')}</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {formatNumber(totalTokens)} TAS
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('bnbSwap.tokensSold')}</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {formatNumber(tokensSold)} TAS
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{t('bnbSwap.progress')}</span>
                        <span>{saleProgress.toFixed(1)}%</span>
                      </div>
                      <Progress value={saleProgress} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Token Allocation Chart */}
              <TokenAllocationChart />
              
              {/* Contract Addresses */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-6">
                <div className="flex flex-col space-y-2">
                  <ContractAddress label={t('bnbSwap.tasTokenAddress')} address={TAS_TOKEN_ADDRESS} />
                  <ContractAddress label={t('bnbSwap.tokenSaleAddress')} address={TAS_TOKEN_SALE_ADDRESS} />
                  <ContractAddress label={t('bnbSwap.rewardsContractAddress')} address={TAS_REWARDS_CONTRACT_ADDRESS} />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* BUY $TAS Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="h-8 w-8 mr-2 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
              <Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              BUY TASChain Token
            </span>
          </CardTitle>
          <CardDescription>
            {t('bnbSwap.buySectionDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-2 text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <>
              {/* Payment selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  {t('bnbSwap.payWith')}
                </label>
                <Select
                  value={paymentToken}
                  onValueChange={setPaymentToken}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BNB">BNB</SelectItem>
                    <SelectItem value="USDT">USDT (BEP-20)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Payment amount input */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('bnbSwap.paymentAmount')}
                  </label>
                  {isConnected && (
                    <button
                      onClick={handleMaxAmount}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      {t('bnbSwap.max')}
                    </button>
                  )}
                </div>
                <div className="flex rounded-md shadow-sm border border-slate-300 dark:border-slate-700 overflow-hidden">
                  <Input 
                    type="text"
                    value={paymentAmount}
                    onChange={(e) => handlePaymentAmountChange(e.target.value)}
                    className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="0.0"
                  />
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium flex items-center">
                    {paymentToken}
                  </div>
                </div>
                {isConnected && (
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {paymentToken === "BNB" ? (
                      <span>Balance: {parseFloat(bnbBalance).toFixed(6)} BNB</span>
                    ) : (
                      <span>Balance: Fetching USDT balance...</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Arrow */}
              <div className="flex justify-center my-4">
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <ArrowDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
              </div>
              
              {/* TAS amount output */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  {t('bnbSwap.receiveTAS')}
                </label>
                <div className="flex rounded-md shadow-sm border border-slate-300 dark:border-slate-700 overflow-hidden">
                  <Input 
                    type="text"
                    value={receiveTasAmount}
                    onChange={(e) => handleTasAmountChange(e.target.value)}
                    className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="0.0"
                  />
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium flex items-center">
                    TAS
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  1 TAS = ${tokenPrice.toFixed(6)}
                </div>
              </div>
              
              {/* Buy button */}
              <Button 
                className="w-full h-12 text-base font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                onClick={handleBuyTas}
                disabled={isBuying || !saleActive}
              >
                {isBuying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('bnbSwap.processing')}
                  </>
                ) : !isConnected ? (
                  <>{t('bnbSwap.connectWallet')}</>
                ) : !saleActive ? (
                  <>{t('bnbSwap.salePaused')}</>
                ) : (
                  <>{t('bnbSwap.buyTAS')}</>
                )}
              </Button>
              
              {/* Notes */}
              {insufficientBnb && (
                <Alert className="mt-4 border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                  <AlertTitle>{t('bnbSwap.lowBnbWarningTitle')}</AlertTitle>
                  <AlertDescription>
                    {t('bnbSwap.lowBnbWarningDesc')}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 flex items-start">
            <Info className="h-4 w-4 mr-2 mt-0.5 text-slate-400 dark:text-slate-500" />
            <span>{t('bnbSwap.disclaimer')}</span>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 flex items-start">
            <ExternalLink className="h-4 w-4 mr-2 mt-0.5 text-slate-400 dark:text-slate-500" />
            <a 
              href="/whitepaper"
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('bnbSwap.viewWhitepaper')}
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}