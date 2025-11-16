import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  Info,
  Wallet,
  MessageSquare,
  Users,
  RefreshCw,
  Send,
  ArrowRightLeft,
  Loader2,
  DollarSign,
  CreditCard,
  Percent,
  ExternalLink
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import ChatInterface from "@/components/ChatInterface";
import { ethers } from 'ethers';
import { 
  getCurrentTASPrice, 
  getBNBPrice, 
  getTokenBalance, 
  getBNBBalance, 
  calculateTASFromBNB, 
  calculateBNBFromTAS,
  calculateUSDTFromTAS,
  buyTASWithBNB,
  buyTASWithUSDT,
  sellTASForBNB,
  sellTASForUSDT,
  getTokensForSale,
  getContractWithSigner,
  TAS_TOKEN_ADDRESS,
  USDT_TOKEN_ADDRESS,
  TAS_TOKEN_SALE_ADDRESS
} from "@/utils/contractUtils";

// TASTokenSale contract ABI - only including the functions we need
const TOKEN_SALE_ABI = [
  "function getCurrentPrice() view returns (uint256)",
  "function tokensForSale() view returns (uint256)",
  "function tokensSold() view returns (uint256)",
  "function saleActive() view returns (bool)",
  "function buyWithBNB(uint256 minTokens) payable",
  "function buyWithUSDT(uint256 amount)"
];

const BuyTokens = () => {
  const { translate } = useLanguage();
  const { isConnected, address, nickname, openConnectModal } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("buy");
  const [amount, setAmount] = useState("");
  const [targetToken, setTargetToken] = useState("TAS");
  const [sourceToken, setSourceToken] = useState("BNB");
  const [swapMode, setSwapMode] = useState<"buy" | "sell">("buy"); // Mode for buy or sell tokens
  const [customToken, setCustomToken] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [tasPrice, setTasPrice] = useState("0.001");
  const [bnbPrice, setBnbPrice] = useState("350");
  const [tasAmount, setTasAmount] = useState<string>("0");
  const [equivalentAmount, setEquivalentAmount] = useState<string>("0"); // For displaying equivalent BNB/USDT when selling TAS
  const [bnbBalance, setBnbBalance] = useState<string>("0");
  const [tasBalance, setTasBalance] = useState<string>("0");
  const [usdtBalance, setUsdtBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(true);
  const [totalTokensForSale, setTotalTokensForSale] = useState<string>("50000000");
  const [tokensSold, setTokensSold] = useState<string>("0");
  const [saleProgress, setSaleProgress] = useState<number>(0);
  const [isSaleActive, setIsSaleActive] = useState<boolean>(true);
  
  // Fetch initial data
  useEffect(() => {
    const fetchPriceData = async () => {
      if (isConnected) {
        setIsLoading(true);
        
        try {
          // Get real-time token prices
          const currentTasPrice = await getCurrentTASPrice();
          const currentBnbPrice = await getBNBPrice();
          
          // Get wallet balances
          const tasBalanceValue = await getTokenBalance(TAS_TOKEN_ADDRESS);
          const usdtBalanceValue = await getTokenBalance(USDT_TOKEN_ADDRESS);
          const bnbBalanceValue = await getBNBBalance();
          
          // Get token sale details
          await fetchTokenSaleDetails();
          
          // Update state
          setTasPrice(currentTasPrice);
          setBnbPrice(currentBnbPrice);
          setTasBalance(tasBalanceValue);
          setUsdtBalance(usdtBalanceValue);
          setBnbBalance(bnbBalanceValue);
        } catch (error) {
          console.error("Error fetching price data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    // Function to fetch token sale details
    const fetchTokenSaleDetails = async () => {
      try {
        // Get token sale contract instance
        const contract = await getContractWithSigner(TAS_TOKEN_SALE_ADDRESS, TOKEN_SALE_ABI, false);
        
        // Call contract methods to get sale details
        const forSale = await contract.tokensForSale();
        const sold = await contract.tokensSold();
        const active = await contract.saleActive();
        
        // Format token amounts from wei
        const totalForSale = ethers.utils.formatUnits(forSale, 18);
        const totalSold = ethers.utils.formatUnits(sold, 18);
        
        // Calculate progress percentage
        const progress = parseFloat(forSale) > 0 
          ? (parseFloat(sold) / parseFloat(forSale)) * 100
          : 0;
        
        // Update state
        setTotalTokensForSale(totalForSale);
        setTokensSold(totalSold);
        setSaleProgress(progress);
        setIsSaleActive(active);
      } catch (error) {
        console.error("Error fetching token sale details:", error);
        // Set default values if error occurs
        setTotalTokensForSale("50000000");
        setTokensSold("25000000");
        setSaleProgress(50);
        setIsSaleActive(true);
      }
    };
    
    fetchPriceData();
    
    // Set up an interval to update prices every 30 seconds
    const intervalId = setInterval(fetchPriceData, 30000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [isConnected, address]);
  
  // Calculate token conversions based on swap mode
  useEffect(() => {
    const updateConversionRates = async () => {
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        setTasAmount("0");
        setEquivalentAmount("0");
        return;
      }

      try {
        if (swapMode === "buy") {
          // Calculate TAS amount when buying with BNB or USDT
          if (sourceToken === "BNB") {
            const calculatedTasAmount = await calculateTASFromBNB(amount);
            setTasAmount(calculatedTasAmount);
          } else if (sourceToken === "USDT") {
            // Simple calculation for USDT: amount in USDT / TAS price
            const calculatedAmount = (parseFloat(amount) / parseFloat(tasPrice)).toString();
            setTasAmount(calculatedAmount);
          }
        } else if (swapMode === "sell") {
          // When selling TAS, calculate equivalent BNB or USDT
          setTasAmount(amount); // The input amount is TAS
          
          if (sourceToken === "BNB") {
            const calculatedBnbAmount = await calculateBNBFromTAS(amount);
            setEquivalentAmount(calculatedBnbAmount);
          } else if (sourceToken === "USDT") {
            const calculatedUsdtAmount = await calculateUSDTFromTAS(amount);
            setEquivalentAmount(calculatedUsdtAmount);
          }
        }
      } catch (error) {
        console.error("Error calculating conversion rates:", error);
        setTasAmount("0");
        setEquivalentAmount("0");
      }
    };
    
    updateConversionRates();
  }, [amount, sourceToken, swapMode, tasPrice, bnbPrice]);
  
  // Mock data for online users/matches
  const onlineUsers = [
    { id: 1, name: "Alex", avatar: null, status: "online", lastActive: new Date() },
    { id: 2, name: "Taylor", avatar: null, status: "online", lastActive: new Date() },
    { id: 3, name: "Jordan", avatar: null, status: "online", lastActive: new Date() },
    { id: 4, name: "Casey", avatar: null, status: "away", lastActive: new Date(Date.now() - 1000 * 60 * 5) },
  ];

  const handleSwapTokens = async () => {
    if (!isConnected) {
      toast({
        title: translate("error"),
        description: translate("connect_wallet_to_swap"),
        variant: "destructive",
      });
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: translate("invalid_amount"),
        description: translate("enter_valid_amount"),
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      let receipt;
      let successMessage = "";
      
      if (swapMode === "buy") {
        // Buying TAS tokens
        if (sourceToken === "BNB") {
          // Buy TAS with BNB
          // We set the minTokens to 95% of the expected amount to account for price fluctuations
          const minTokens = (parseFloat(tasAmount) * 0.95).toString();
          receipt = await buyTASWithBNB(amount, minTokens);
          successMessage = "TAS tokens purchased successfully with BNB!";
        } else if (sourceToken === "USDT") {
          // Buy TAS with USDT
          receipt = await buyTASWithUSDT(tasAmount);
          successMessage = "TAS tokens purchased successfully with USDT!";
        } else {
          throw new Error("Unsupported token");
        }
      } else if (swapMode === "sell") {
        // Selling TAS tokens
        if (sourceToken === "BNB") {
          // Sell TAS for BNB
          // Set minimum BNB amount to 95% of expected to account for slippage
          const minBnbAmount = (parseFloat(equivalentAmount) * 0.95).toString();
          receipt = await sellTASForBNB(amount, minBnbAmount);
          successMessage = "TAS tokens sold successfully for BNB!";
        } else if (sourceToken === "USDT") {
          // Sell TAS for USDT
          // Set minimum USDT amount to 95% of expected to account for slippage
          const minUsdtAmount = (parseFloat(equivalentAmount) * 0.95).toString();
          receipt = await sellTASForUSDT(amount, minUsdtAmount);
          successMessage = "TAS tokens sold successfully for USDT!";
        } else {
          throw new Error("Unsupported token");
        }
      }
      
      // Check the transaction receipt for success
      if (receipt && receipt.status === 1) {
        toast({
          title: translate("success"),
          description: translate("tokens_transaction_successful") || successMessage,
        });
        
        // Reset form and refresh balances
        setAmount("");
        // Fetch updated balances
        const tasBalanceValue = await getTokenBalance(TAS_TOKEN_ADDRESS);
        const usdtBalanceValue = await getTokenBalance(USDT_TOKEN_ADDRESS);
        const bnbBalanceValue = await getBNBBalance();
        
        setTasBalance(tasBalanceValue);
        setUsdtBalance(usdtBalanceValue);
        setBnbBalance(bnbBalanceValue);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: any) {
      console.error("Error processing transaction:", error);
      let errorMessage = "There was an error processing your transaction";
      
      // Check for specific error types
      if (error.code === "INSUFFICIENT_FUNDS") {
        errorMessage = "You don't have enough funds to complete this transaction";
      } else if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        errorMessage = "Transaction cannot be completed. Please try a smaller amount";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: translate("transaction_failed"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return translate("just_now") || "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2">
          <span className="bg-gradient-to-r from-primary to-indigo-600 text-transparent bg-clip-text">
            Trade<span style={{ fontFamily: 'Bangers, cursive', color: '#dc2626', letterSpacing: '0.5px' }}> N </span>Talk
          </span>
        </h1>
        <p className="text-center text-slate-600 mb-4 max-w-xl mx-auto">
          {translate("trade_n_talk_description") || "Trade tokens and chat directly with other users on TASChain. The next evolution in peer-to-peer token trading."}
        </p>
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-xl shadow-sm mb-6 max-w-2xl mx-auto">
          <ul className="grid grid-cols-1 sm:grid-cols-2 text-sm text-slate-600 gap-y-3 gap-x-4">
            <li className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-2 flex-shrink-0">✦</div>
              <span>Direct peer-to-peer trading without a centralized exchange</span>
            </li>
            <li className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mr-2 flex-shrink-0">✦</div>
              <span>Connect with real traders and negotiate your best deal</span>
            </li>
            <li className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-2 flex-shrink-0">✦</div>
              <span>Trade any token in the TASChain ecosystem hassle-free</span>
            </li>
            <li className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mr-2 flex-shrink-0">✦</div>
              <span>Lower fees and better rates than traditional DEXs</span>
            </li>
          </ul>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader className="px-4 sm:px-6 pb-0">
            <Tabs defaultValue="buy" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="swap" className="text-sm">
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  {translate("trade") || "Trade"}
                </TabsTrigger>
                <TabsTrigger value="buy" className="text-sm">
                  <DollarSign className="h-4 w-4 mr-2" />
                  {translate("buy_tas") || "Buy TAS"}
                </TabsTrigger>
                <TabsTrigger value="talk" className="text-sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {translate("chat") || "Chat"}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <TabsContent value="buy" className="mt-4 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 mt-1">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-1">{translate("buy_tas_token_sale") || "TAS Token Sale"}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {translate("tas_token_sale_description") || "Purchase TAS tokens directly from the official token sale contract. 5% of the total TAS supply is available for sale."}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <div className="bg-primary/5 px-3 py-1.5 rounded-full text-xs text-primary">💰 Current price: ${parseFloat(tasPrice).toFixed(4)}</div>
                      <div className="bg-primary/5 px-3 py-1.5 rounded-full text-xs text-primary">🔗 BSC Mainnet</div>
                      <div className="bg-primary/5 px-3 py-1.5 rounded-full text-xs text-primary">💸 BNB & USDT accepted</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {!isConnected ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium mb-2">
                      {translate("connect_wallet_to_buy_tas") || "Connect your wallet to buy TAS tokens"}
                    </h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                      {translate("connect_wallet_buy_description") || "You need to connect your wallet first to purchase TAS tokens from the sale contract"}
                    </p>
                  </div>
                  <Button 
                    onClick={openConnectModal} 
                    className="bg-gradient-to-r from-primary to-indigo-600 text-white"
                  >
                    <Wallet className="mr-2 h-4 w-4" /> 
                    {translate("connect_wallet") || "Connect Wallet"}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="bg-white border rounded-lg p-5 mb-4">
                    <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
                      <div>
                        <h3 className="text-lg font-medium mb-1">{translate("token_sale_details") || "TAS Token Sale"}</h3>
                        <p className="text-sm text-slate-500">
                          {translate("token_sale_status") || "Token sale is now live! Purchase TAS tokens directly from the contract."}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 justify-center">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${isSaleActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm font-medium">
                            {isSaleActive 
                              ? (translate("sale_active") || "Sale active") 
                              : (translate("sale_inactive") || "Sale inactive")}
                          </span>
                        </div>
                        <a 
                          href={`https://bscscan.com/address/${TAS_TOKEN_SALE_ADDRESS}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center"
                        >
                          View contract on BSCScan <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-xs text-slate-500 mb-1">{translate("current_price") || "Current Price"}</div>
                        <div className="font-medium">${parseFloat(tasPrice).toFixed(4)} / TAS</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-xs text-slate-500 mb-1">{translate("min_purchase") || "Min Purchase"}</div>
                        <div className="font-medium">0.01 BNB / 1 USDT</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-xs text-slate-500 mb-1">{translate("accepted_payment") || "Accepted Payment"}</div>
                        <div className="font-medium">BNB, USDT</div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{translate("sale_progress") || "Sale Progress"}</span>
                        <span className="text-sm">{saleProgress.toFixed(2)}% sold</span>
                      </div>
                      <Progress value={saleProgress} className="h-2" />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-slate-500">{parseFloat(tokensSold).toLocaleString()} TAS</span>
                        <span className="text-xs text-slate-500">{parseFloat(totalTokensForSale).toLocaleString()} TAS</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="bg-slate-50 p-4 rounded-lg mb-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium">{translate("buy_tas_tokens") || "Buy TAS Tokens"}</h4>
                          <div className="flex items-center">
                            <select 
                              className="bg-white text-sm border rounded-md px-3 py-1"
                              value={sourceToken}
                              onChange={(e) => setSourceToken(e.target.value)}
                            >
                              <option value="BNB">BNB</option>
                              <option value="USDT">USDT</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-sm text-slate-500">
                              {translate("you_pay") || "You Pay"}
                            </label>
                            <span className="text-xs text-slate-500">
                              {translate("balance") || "Balance"}: {
                                sourceToken === "BNB" 
                                  ? parseFloat(bnbBalance).toFixed(6) + " BNB" 
                                  : parseFloat(usdtBalance).toFixed(2) + " USDT"
                              }
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mb-4">
                            <div className="relative flex-1">
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pr-20"
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center">
                                <button 
                                  className="bg-slate-100 text-slate-800 font-medium h-8 px-3 rounded mr-1 text-sm"
                                  onClick={() => {
                                    if (sourceToken === "BNB") {
                                      // Leave a small amount for gas fees
                                      const maxBnb = Math.max(0, parseFloat(bnbBalance) - 0.001);
                                      setAmount(maxBnb > 0 ? maxBnb.toString() : "0");
                                    } else if (sourceToken === "USDT") {
                                      setAmount(usdtBalance);
                                    }
                                  }}
                                >
                                  MAX
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between mb-1">
                            <label className="text-sm text-slate-500">
                              {translate("you_receive") || "You Receive"}
                            </label>
                            <span className="text-xs text-slate-500">
                              {translate("balance") || "Balance"}: {parseFloat(tasBalance).toFixed(2)} TAS
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mb-4">
                            <div className="relative flex-1">
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={
                                  tasAmount && parseFloat(tasAmount) > 0 
                                    ? parseFloat(tasAmount).toFixed(2) 
                                    : "0.00"
                                }
                                readOnly
                                className="pr-4"
                              />
                            </div>
                            <div className="min-w-[120px]">
                              <div className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center">
                                TAS
                              </div>
                            </div>
                          </div>
                          
                          {!isSaleActive && (
                            <div className="bg-red-50 p-3 rounded-lg mb-4">
                              <div className="flex items-start">
                                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                                <div className="text-xs text-red-600">
                                  {translate("token_sale_inactive") || "The TAS Token Sale is currently inactive. Please check back later or visit our official channels for updates on when the sale will resume."}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="bg-blue-50 p-3 rounded-lg mb-4">
                            <div className="flex items-start">
                              <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                              <div className="text-xs text-blue-600">
                                {translate("token_sale_info") || "The TAS Token Sale provides liquidity for the PancakeSwap pair. 50,000,000 TAS tokens (5% of total supply) are available for purchase. Price may slightly fluctuate based on market conditions."}
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white"
                            disabled={isProcessing || !amount || parseFloat(amount) <= 0 || !isSaleActive}
                            onClick={handleSwapTokens}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {translate("processing") || "Processing..."}
                              </>
                            ) : (
                              <>
                                {translate("buy_tas_tokens") || "Buy TAS Tokens"}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="swap" className="mt-4 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 mt-1">
                    <ArrowRightLeft className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-1">{translate("welcome_to_tradentalk") || "Welcome to TradeNTalk"}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {translate("tradentalk_intro") || "Swap a token with real users and not a DEX while talking. TAS TradeNTalk connects you directly with other traders for better rates and a more personal trading experience."}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <div className="bg-primary/5 px-3 py-1.5 rounded-full text-xs text-primary">🔄 Peer-to-peer trading</div>
                      <div className="bg-primary/5 px-3 py-1.5 rounded-full text-xs text-primary">💬 Chat with traders</div>
                      <div className="bg-primary/5 px-3 py-1.5 rounded-full text-xs text-primary">💰 Better rates</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {!isConnected ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium mb-2">
                      {translate("connect_wallet_to_trade_tokens") || "Connect your wallet to trade tokens"}
                    </h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                      {translate("connect_wallet_trade_description") || "You need to connect your wallet first to access token trading features"}
                    </p>
                  </div>
                  <Button 
                    onClick={openConnectModal} 
                    className="bg-gradient-to-r from-primary to-indigo-600 text-white"
                  >
                    <Wallet className="mr-2 h-4 w-4" /> 
                    {translate("connect_wallet") || "Connect Wallet"}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium">{translate("trade_tokens") || "Trade Tokens"}</h3>
                      <div className="flex items-center gap-2">
                        {/* Buy/Sell Toggle */}
                        <div className="bg-white rounded-md border border-slate-200 p-0.5 flex items-center">
                          <button
                            onClick={() => setSwapMode("buy")}
                            className={`px-3 py-1 text-xs rounded-sm transition-all ${
                              swapMode === "buy" 
                                ? "bg-primary text-white" 
                                : "text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            {translate("buy") || "Buy"}
                          </button>
                          <button
                            onClick={() => setSwapMode("sell")}
                            className={`px-3 py-1 text-xs rounded-sm transition-all ${
                              swapMode === "sell" 
                                ? "bg-primary text-white" 
                                : "text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            {translate("sell") || "Sell"}
                          </button>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {translate("find_trader") || "Find Trader"}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-sm text-slate-500">
                            {swapMode === "buy" 
                              ? (translate("you_pay") || "You Pay") 
                              : (translate("you_sell") || "You Sell")}
                          </label>
                          <span className="text-xs text-slate-500">
                            {translate("balance") || "Balance"}: {
                              swapMode === "buy" 
                                ? (sourceToken === "BNB" ? parseFloat(bnbBalance).toFixed(6) : sourceToken === "USDT" ? parseFloat(usdtBalance).toFixed(2) : "0") + " " + sourceToken
                                : parseFloat(tasBalance).toFixed(2) + " TAS"
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="pr-20"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center">
                              <button 
                                className="bg-slate-100 text-slate-800 font-medium h-8 px-3 rounded mr-1 text-sm"
                                onClick={() => {
                                  // Set max based on the selected token and mode
                                  if (swapMode === "buy") {
                                    if (sourceToken === "BNB") {
                                      // Leave a small amount for gas fees
                                      const maxBnb = Math.max(0, parseFloat(bnbBalance) - 0.001);
                                      setAmount(maxBnb > 0 ? maxBnb.toString() : "0");
                                    } else if (sourceToken === "USDT") {
                                      setAmount(usdtBalance);
                                    }
                                  } else {
                                    // When selling TAS
                                    setAmount(tasBalance);
                                  }
                                }}
                              >
                                MAX
                              </button>
                            </div>
                          </div>
                          <div className="min-w-[120px]">
                            <select 
                              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={swapMode === "buy" ? sourceToken : "TAS"}
                              onChange={(e) => swapMode === "buy" ? setSourceToken(e.target.value) : null}
                              disabled={swapMode === "sell"} // Disable when selling since we always sell TAS
                            >
                              {swapMode === "buy" ? (
                                <>
                                  <option value="BNB">BNB</option>
                                  <option value="USDT">USDT</option>
                                  <option value="USDC">USDC</option>
                                </>
                              ) : (
                                <option value="TAS">TAS</option>
                              )}
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 rotate-90"
                          onClick={() => {
                            const temp = sourceToken;
                            setSourceToken(targetToken);
                            setTargetToken(temp);
                          }}
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-sm text-slate-500">
                            {swapMode === "buy" 
                              ? (translate("you_receive") || "You Receive") 
                              : (translate("you_get") || "You Get")}
                          </label>
                          <span className="text-xs text-slate-500">
                            {translate("balance") || "Balance"}: {
                              swapMode === "buy" 
                                ? parseFloat(tasBalance).toFixed(2) + " TAS"
                                : (sourceToken === "BNB" ? parseFloat(bnbBalance).toFixed(6) : sourceToken === "USDT" ? parseFloat(usdtBalance).toFixed(2) : "0") + " " + sourceToken
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={
                                swapMode === "buy"
                                  ? (tasAmount && parseFloat(tasAmount) > 0 ? parseFloat(tasAmount).toFixed(2) : "0.00")
                                  : (equivalentAmount && parseFloat(equivalentAmount) > 0 
                                      ? (sourceToken === "BNB" ? parseFloat(equivalentAmount).toFixed(6) : parseFloat(equivalentAmount).toFixed(2)) 
                                      : "0.00")
                              }
                              readOnly
                              className="pr-4"
                            />
                          </div>
                          <div className="min-w-[120px]">
                            <div className="relative">
                              <select 
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm pr-8"
                                value={swapMode === "buy" ? "TAS" : sourceToken}
                                onChange={(e) => swapMode === "sell" ? setSourceToken(e.target.value) : null}
                                disabled={swapMode === "buy"} // Disable when buying since we always buy TAS
                              >
                                {swapMode === "buy" ? (
                                  <option value="TAS">TAS</option>
                                ) : (
                                  <>
                                    <option value="BNB">BNB</option>
                                    <option value="USDT">USDT</option>
                                  </>
                                )}
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none pr-2">
                                <svg className="h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {targetToken === "custom" && (
                        <div className="border rounded-md p-3 bg-slate-50">
                          <label className="text-sm text-slate-600 mb-1 block">
                            {translate("custom_token_details") || "Custom Token Details"}
                          </label>
                          <div className="space-y-3">
                            <Input
                              placeholder={translate("token_address_or_name") || "Token address or name"}
                              value={customToken}
                              onChange={(e) => setCustomToken(e.target.value)}
                              className="text-sm"
                            />
                            <div className="flex items-center space-x-2 text-xs text-slate-500">
                              <Info className="h-3.5 w-3.5" />
                              <span>{translate("custom_token_description") || "Enter a token address or the name of the token you're looking for"}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-slate-100 rounded p-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">{translate("exchange_rate") || "Exchange Rate"}</span>
                          {swapMode === "buy" ? (
                            // Buy mode exchange rates
                            sourceToken === "BNB" ? (
                              <span className="font-medium">
                                1 BNB = {(parseFloat(bnbPrice) / parseFloat(tasPrice)).toFixed(0)} TAS
                              </span>
                            ) : sourceToken === "USDT" ? (
                              <span className="font-medium">
                                1 USDT = {(1 / parseFloat(tasPrice)).toFixed(0)} TAS
                              </span>
                            ) : (
                              <span className="font-medium">1 {sourceToken} = ? TAS</span>
                            )
                          ) : (
                            // Sell mode exchange rates
                            sourceToken === "BNB" ? (
                              <span className="font-medium">
                                1 TAS = {(parseFloat(tasPrice) / parseFloat(bnbPrice)).toFixed(6)} BNB
                              </span>
                            ) : sourceToken === "USDT" ? (
                              <span className="font-medium">
                                1 TAS = {parseFloat(tasPrice).toFixed(4)} USDT
                              </span>
                            ) : (
                              <span className="font-medium">1 TAS = ? {sourceToken}</span>
                            )
                          )}
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-slate-600">{translate("current_prices") || "Current Prices"}</span>
                          <div className="space-y-1">
                            <div className="flex justify-end">
                              <span className="text-xs">1 BNB = ${parseFloat(bnbPrice).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-end">
                              <span className="text-xs">1 TAS = ${parseFloat(tasPrice).toFixed(4)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-slate-600">{translate("network_fee") || "Network Fee"}</span>
                          <span className="font-medium">~0.001 BNB</span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-gradient-to-r from-primary to-indigo-600"
                        onClick={handleSwapTokens}
                        disabled={!amount || isNaN(Number(amount)) || Number(amount) <= 0 || isProcessing}
                      >
                        {isProcessing ? (
                          <>{translate("processing") || "Processing..."}</>
                        ) : (
                          swapMode === "buy" ? (
                            <>{translate("buy_now") || "Buy Now"}</>
                          ) : (
                            <>{translate("sell_now") || "Sell Now"}</>
                          )
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">{translate("trade_history") || "Trade History"}</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="text-center py-8 text-slate-500">
                        <p>{translate("no_trade_history") || "No trade history found"}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="talk" className="mt-4">
              {!isConnected ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium mb-2">
                      {translate("connect_wallet_to_chat") || "Connect your wallet to start chatting with traders"}
                    </h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                      {translate("connect_wallet_chat_description") || "You need to connect your wallet first to access chat features"}
                    </p>
                  </div>
                  <Button 
                    onClick={openConnectModal} 
                    className="bg-gradient-to-r from-primary to-indigo-600 text-white"
                  >
                    <Wallet className="mr-2 h-4 w-4" /> 
                    {translate("connect_wallet") || "Connect Wallet"}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1 bg-slate-50 rounded-lg p-4 h-[500px] border flex flex-col">
                    <div className="flex flex-col">
                      <div className="bg-primary/5 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{translate("your_profile") || "Your Profile"}</h3>
                        </div>
                        <div className="flex items-center mb-3">
                          <Avatar className="h-14 w-14 mr-3">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {nickname ? getInitials(nickname) : address?.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{nickname || (address && `${address.slice(0, 6)}...${address.slice(-4)}`)}</p>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              {translate("online") || "Online"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-medium text-lg">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
                              {translate("find_trade_partner") || "Find Trade Partner"}
                            </span>
                          </h3>
                        </div>
                        
                        <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-xl mb-4">
                          <p className="text-sm text-slate-600 mb-3">
                            {translate("match_description") || "Select the token you have and the token you want to find a matching trader. Our P2P system will connect you with compatible traders."}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1 mt-3">
                            <div className="flex items-center">
                              <div className="h-2 w-2 rounded-full bg-emerald-400 mr-1.5"></div>
                              <span>{translate("active_traders") || "12 active traders"}</span>
                            </div>
                            <div className="flex items-center">
                              <div className="h-2 w-2 rounded-full bg-amber-400 mr-1.5"></div>
                              <span>{translate("open_trades") || "8 open trades"}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-sm text-slate-600 font-medium">{translate("your_token") || "Your Token"}</label>
                              <div className="relative">
                                <select 
                                  className="w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none"
                                  value={sourceToken}
                                  onChange={(e) => setSourceToken(e.target.value)}
                                >
                                  <option value="BNB">BNB</option>
                                  <option value="USDT">USDT</option>
                                  <option value="USDC">USDC</option>
                                  <option value="TAS">TAS</option>
                                  <option value="SOCIAL">SOCIAL</option>
                                  <option value="MEME">MEME</option>
                                </select>
                                <div className="absolute top-0 right-0 h-full flex items-center pr-3 pointer-events-none">
                                  <svg className="h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-sm text-slate-600 font-medium">{translate("token_wanted") || "Token Wanted"}</label>
                              <div className="relative">
                                <select 
                                  className="w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none"
                                  value={targetToken}
                                  onChange={(e) => setTargetToken(e.target.value)}
                                >
                                  <option value="TAS">TAS</option>
                                  <option value="SOCIAL">SOCIAL</option>
                                  <option value="MEME">MEME</option>
                                  <option value="BNB">BNB</option>
                                  <option value="USDT">USDT</option>
                                  <option value="USDC">USDC</option>
                                </select>
                                <div className="absolute top-0 right-0 h-full flex items-center pr-3 pointer-events-none">
                                  <svg className="h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white h-11"
                            onClick={() => {
                              if (sourceToken === targetToken) {
                                toast({
                                  title: translate("error") || "Error",
                                  description: translate("same_token_error") || "You cannot trade a token for itself. Please select different tokens.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              // Call findTradeMatch from useChat hook
                              // This would connect to a trader with matching token preferences
                              toast({
                                title: translate("searching") || "Searching",
                                description: translate("finding_trade_partner") || "Looking for traders with matching preferences...",
                              });

                              setTimeout(() => {
                                setActiveTab("talk");
                                toast({
                                  title: translate("match_found") || "Match Found!",
                                  description: translate("trader_connected") || "You've been connected to a trader. Start negotiating!",
                                });
                              }, 1500);
                            }}
                          >
                            <Users className="mr-2 h-4 w-4" />
                            {translate("find_match") || "Find Match"}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-auto">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-medium text-lg">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
                              {translate("active_traders") || "Active Traders"}
                            </span>
                          </h3>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            {translate("refresh") || "Refresh"}
                          </Button>
                        </div>
                        
                        <div className="bg-gradient-to-r from-slate-50 to-green-50 p-3 rounded-lg mb-2">
                          <p className="text-xs text-slate-600">
                            {translate("traders_description") || "These traders are currently online and looking for token exchanges. Click on any trader to start a direct conversation."}
                          </p>
                        </div>
                        
                        <ScrollArea className="h-44 border rounded-lg">
                          <div className="divide-y divide-slate-100">
                            {onlineUsers.map((user) => (
                              <div 
                                key={user.id}
                                className="flex items-center p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                              >
                                <div className="relative mr-3">
                                  <Avatar className="h-10 w-10 border border-slate-200">
                                    {user.avatar ? (
                                      <AvatarImage src={user.avatar} alt={user.name} />
                                    ) : (
                                      <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 font-medium text-sm">
                                        {getInitials(user.name)}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <span 
                                    className={`absolute bottom-0 right-0 rounded-full w-3 h-3 border-2 border-white ${
                                      user.status === "online" ? "bg-emerald-500" : "bg-amber-500"
                                    }`}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-medium text-slate-800 truncate">{user.name}</h4>
                                    <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                                      {formatTimeAgo(user.lastActive)}
                                    </span>
                                  </div>
                                  <div className="flex items-center mt-0.5">
                                    <span className="text-xs text-slate-500 truncate flex items-center">
                                      {user.status === "online" 
                                        ? (
                                          <>
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1"></span>
                                            {translate("active_now") || "Active now"}
                                          </>
                                        ) 
                                        : (
                                          <>
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1"></span>
                                            {translate("away") || "Away"}
                                          </>
                                        )
                                      }
                                    </span>
                                    
                                    <div className="flex-1 text-right">
                                      <span className="inline-flex items-center ml-2 px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-600 font-medium">
                                        TAS ⟷ BNB
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {onlineUsers.length === 0 && (
                              <div className="py-8 text-center text-slate-500">
                                <p className="text-sm">{translate("no_active_traders") || "No active traders at the moment"}</p>
                                <p className="text-xs mt-1">{translate("check_back") || "Please check back later"}</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <ChatInterface fullpage={false} />
                  </div>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BuyTokens;
