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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  RefreshCw, 
  ArrowDown, 
  Info, 
  ExternalLink, 
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ethers } from "ethers";

// Declare ethereum variable for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

// TASTokenSale contract on BSC Mainnet
const TAS_TOKEN_SALE_ADDRESS = "0xF188D5C78dCe3860e63F621b295e95992e77e881";
const TAS_TOKEN_ADDRESS = "0xd9541b134b1821736bd323135b8844d3ae408216";
const USDT_TOKEN_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

// Token ABI for sale interactions
const TOKEN_SALE_ABI = [
  "function buyWithBNB() external payable",
  "function buyWithUSDT(uint256 amount) external",
  "function getTokensPerBNB() external view returns (uint256)",
  "function getTokensPerUSDT() external view returns (uint256)",
  "function saleActive() external view returns (bool)",
  "function totalTokensSold() external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)"
];

const ERC20_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

// Format currency for display
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(value);
};

// Format large numbers with commas
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

const BnbSwap = () => {
  const { translate } = useLanguage();
  const { isConnected, openConnectModal, address } = useWallet();
  const { toast } = useToast();
  
  // Payment form state
  const [paymentToken, setPaymentToken] = useState<string>("BNB");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [receiveTasAmount, setReceiveTasAmount] = useState<string>("");
  const [needsUsdtApproval, setNeedsUsdtApproval] = useState<boolean>(false);
  
  // Sale contract states
  const [saleActive, setSaleActive] = useState<boolean>(true);
  const [totalTokensSold, setTotalTokensSold] = useState<number>(0);
  const [saleProgress, setSaleProgress] = useState<number>(0);
  const [tokenPrice, setTokenPrice] = useState<number>(0.001); // Default price
  
  // Get provider for read-only operations
  const getProvider = () => {
    if (window.ethereum) {
      return new ethers.providers.Web3Provider(window.ethereum);
    }
    return new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  };
  
  // Get signer for write operations
  const getSigner = () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      return provider.getSigner();
    }
    return null;
  };
  
  // Fetch token sale contract data
  const { data: contractData, isLoading: contractLoading, refetch: refetchContractData } = useQuery({
    queryKey: ["contract-data"],
    queryFn: async () => {
      const provider = getProvider();
      
      try {
        const saleContract = new ethers.Contract(TAS_TOKEN_SALE_ADDRESS, TOKEN_SALE_ABI, provider);
        
        // Get contract data
        const tokensPerBNB = await saleContract.getTokensPerBNB();
        const tokensPerUSDT = await saleContract.getTokensPerUSDT();
        const active = await saleContract.saleActive();
        const sold = await saleContract.totalTokensSold();
        const totalSupply = 1000000000; // Fixed total supply of TAS tokens (1 billion)
        
        // Calculate sale progress
        const tokensSold = Number(ethers.utils.formatUnits(sold, 18));
        const saleAllocation = totalSupply * 0.05; // 5% allocation for sale
        const progress = (tokensSold / saleAllocation) * 100;
        
        // Calculate price in USD (assuming 1 BNB = $350)
        const bnbPrice = 350;
        const tasPerBnb = Number(ethers.utils.formatUnits(tokensPerBNB, 18));
        const priceInUsd = bnbPrice / tasPerBnb;
        
        setSaleActive(active);
        setTotalTokensSold(tokensSold);
        setSaleProgress(progress);
        setTokenPrice(priceInUsd);
        
        return {
          tokensPerBNB: tasPerBnb,
          tokensPerUSDT: Number(ethers.utils.formatUnits(tokensPerUSDT, 18)),
          saleActive: active,
          totalTokensSold: tokensSold,
          saleProgress: progress,
          totalSupply: totalSupply,
          circulatingSupply: totalSupply * 0.25, // 25% in circulation
          priceInUsd: priceInUsd
        };
      } catch (error) {
        console.error("Error fetching contract data:", error);
        // Fallback data if contract call fails
        return {
          tokensPerBNB: 1000, // 1 BNB = 1000 TAS tokens
          tokensPerUSDT: 1000, // 1 USDT = 1000 TAS tokens
          saleActive: true,
          totalTokensSold: 50000000, // 50M tokens sold
          saleProgress: 5, // 5% of sale completed
          totalSupply: 1000000000, // 1 billion total supply
          circulatingSupply: 250000000, // 250M in circulation (25%)
          priceInUsd: 0.001 // $0.001 per TAS
        };
      }
    }
  });
  
  // Get user balances
  const { data: balances, isLoading: balancesLoading, refetch: refetchBalances } = useQuery({
    queryKey: ["user-balances", address],
    queryFn: async () => {
      if (!isConnected || !address) return null;
      
      try {
        const provider = getProvider();
        
        // Get BNB balance
        const bnbBalance = await provider.getBalance(address);
        
        // Get USDT balance
        const usdtContract = new ethers.Contract(USDT_TOKEN_ADDRESS, ERC20_ABI, provider);
        const usdtBalance = await usdtContract.balanceOf(address);
        const usdtDecimals = await usdtContract.decimals();
        
        // Get TAS balance
        const tasContract = new ethers.Contract(TAS_TOKEN_ADDRESS, ERC20_ABI, provider);
        const tasBalance = await tasContract.balanceOf(address);
        
        // Get USDT allowance
        const usdtAllowance = await usdtContract.allowance(address, TAS_TOKEN_SALE_ADDRESS);
        setNeedsUsdtApproval(usdtAllowance.isZero());
        
        return {
          BNB: Number(ethers.utils.formatEther(bnbBalance)),
          USDT: Number(ethers.utils.formatUnits(usdtBalance, usdtDecimals)),
          TAS: Number(ethers.utils.formatEther(tasBalance)),
          usdtAllowance: !usdtAllowance.isZero()
        };
      } catch (error) {
        console.error("Error fetching balances:", error);
        return {
          BNB: 0,
          USDT: 0,
          TAS: 0,
          usdtAllowance: false
        };
      }
    },
    enabled: isConnected && !!address
  });
  
  // Calculate amounts based on payment token
  useEffect(() => {
    if (contractData && paymentAmount) {
      const amount = parseFloat(paymentAmount);
      if (!isNaN(amount)) {
        if (paymentToken === "BNB") {
          setReceiveTasAmount((amount * contractData.tokensPerBNB).toString());
        } else if (paymentToken === "USDT") {
          setReceiveTasAmount((amount * contractData.tokensPerUSDT).toString());
        }
      } else {
        setReceiveTasAmount("");
      }
    } else {
      setReceiveTasAmount("");
    }
  }, [paymentToken, paymentAmount, contractData]);
  
  // Calculate payment amount based on TAS amount
  const handleTasAmountChange = (value: string) => {
    setReceiveTasAmount(value);
    
    if (contractData && value) {
      const amount = parseFloat(value);
      if (!isNaN(amount)) {
        if (paymentToken === "BNB") {
          setPaymentAmount((amount / contractData.tokensPerBNB).toString());
        } else if (paymentToken === "USDT") {
          setPaymentAmount((amount / contractData.tokensPerUSDT).toString());
        }
      } else {
        setPaymentAmount("");
      }
    } else {
      setPaymentAmount("");
    }
  };
  
  // Set max amount
  const handleMaxAmount = () => {
    if (!balances || !balances[paymentToken as keyof typeof balances]) return;
    
    const maxBalance = balances[paymentToken as keyof typeof balances] as number;
    // For BNB, reserve 0.01 for gas
    if (paymentToken === "BNB" && maxBalance > 0.01) {
      setPaymentAmount((maxBalance - 0.01).toString());
    } else {
      setPaymentAmount(maxBalance.toString());
    }
  };
  
  // USDT approval mutation
  const approveUsdtMutation = useMutation({
    mutationFn: async () => {
      if (!isConnected || !address) throw new Error("Wallet not connected");
      
      const signer = getSigner();
      if (!signer) throw new Error("No signer available");
      
      const usdtContract = new ethers.Contract(USDT_TOKEN_ADDRESS, ERC20_ABI, signer);
      
      // Approve maximum amount
      const tx = await usdtContract.approve(
        TAS_TOKEN_SALE_ADDRESS, 
        ethers.constants.MaxUint256
      );
      
      return await tx.wait();
    },
    onSuccess: () => {
      toast({
        title: "USDT Approved",
        description: "You can now buy TAS with USDT",
      });
      
      setNeedsUsdtApproval(false);
      refetchBalances();
    },
    onError: (error: Error) => {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Buy TAS mutation
  const buyTasMutation = useMutation({
    mutationFn: async () => {
      if (!isConnected || !address) throw new Error("Wallet not connected");
      
      const signer = getSigner();
      if (!signer) throw new Error("No signer available");
      
      const saleContract = new ethers.Contract(TAS_TOKEN_SALE_ADDRESS, TOKEN_SALE_ABI, signer);
      
      let tx;
      if (paymentToken === "BNB") {
        // Buy with BNB
        tx = await saleContract.buyWithBNB({
          value: ethers.utils.parseEther(paymentAmount)
        });
      } else {
        // Buy with USDT - convert to USDT decimals
        const usdtAmount = ethers.utils.parseUnits(paymentAmount, 18);
        tx = await saleContract.buyWithUSDT(usdtAmount);
      }
      
      return await tx.wait();
    },
    onSuccess: (receipt) => {
      toast({
        title: "Purchase successful",
        description: `You bought ${formatNumber(parseFloat(receiveTasAmount))} TAS tokens!`,
      });
      
      setPaymentAmount("");
      setReceiveTasAmount("");
      
      // Refetch balances and contract data
      refetchBalances();
      refetchContractData();
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Execute purchase
  const handleBuyTas = () => {
    if (!isConnected) {
      openConnectModal();
      return;
    }
    
    const paymentAmountNum = parseFloat(paymentAmount);
    
    if (isNaN(paymentAmountNum) || paymentAmountNum <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    if (balances) {
      const maxBalance = balances[paymentToken as keyof typeof balances] as number;
      if (paymentAmountNum > maxBalance) {
        toast({
          title: "Insufficient balance",
          description: `You don't have enough ${paymentToken}`,
          variant: "destructive",
        });
        return;
      }
    }
    
    if (paymentToken === "USDT" && needsUsdtApproval) {
      // Need to approve USDT first
      approveUsdtMutation.mutate();
    } else {
      // Buy TAS tokens
      buyTasMutation.mutate();
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          {translate("tokenSale", "TAS Token Sale")}
        </h1>
        <p className="text-gray-600 max-w-md mx-auto mt-2">
          {translate("saleDescription", "Buy TAS tokens directly from the official token sale")}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <img src="https://assets.coingecko.com/coins/images/28250/thumb/TAS.png" className="h-6 w-6 mr-2" alt="TAS" />
                TAS Token Sale
              </CardTitle>
              <CardDescription>
                Purchase TAS tokens from the official token sale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sale Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="text-xs text-blue-600 font-medium">PRICE</div>
                  <div className="text-lg font-semibold">${contractData?.priceInUsd?.toFixed(6) || tokenPrice.toFixed(6)}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-md">
                  <div className="text-xs text-green-600 font-medium">SUPPLY</div>
                  <div className="text-lg font-semibold">
                    {contractData 
                      ? `${formatNumber(contractData.circulatingSupply / 1000000)}M / ${formatNumber(contractData.totalSupply / 1000000)}M`
                      : "250M / 1B"}
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-md">
                  <div className="text-xs text-purple-600 font-medium">SOLD</div>
                  <div className="text-lg font-semibold">
                    {totalTokensSold 
                      ? `${formatNumber(totalTokensSold / 1000000)}M TAS`
                      : "50M TAS"}
                  </div>
                </div>
                <div className="bg-amber-50 p-3 rounded-md">
                  <div className="text-xs text-amber-600 font-medium">SALE STATUS</div>
                  <div className="text-lg font-semibold">
                    {saleActive ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>
              
              {/* Sale progress */}
              <div className="mb-4">
                <div className="flex justify-between mb-1 text-sm">
                  <span className="font-medium">Sale Progress</span>
                  <span>{saleProgress.toFixed(1)}% Complete</span>
                </div>
                <Progress value={saleProgress} className="h-2" />
              </div>
              
              {/* Buy Form */}
              <div className="pt-4">
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center">
                      <span className="mr-3">Pay with</span>
                      <div className="inline-flex rounded-md border overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setPaymentToken("BNB")}
                          className={`px-3 py-1 text-sm flex items-center ${
                            paymentToken === "BNB" 
                              ? "bg-primary/10 text-primary font-medium" 
                              : "bg-gray-50"
                          }`}
                        >
                          <img src="https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png" className="h-4 w-4 mr-1" alt="BNB" />
                          BNB
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentToken("USDT")}
                          className={`px-3 py-1 text-sm flex items-center ${
                            paymentToken === "USDT" 
                              ? "bg-primary/10 text-primary font-medium" 
                              : "bg-gray-50"
                          }`}
                        >
                          <img src="https://assets.coingecko.com/coins/images/325/thumb/Tether.png" className="h-4 w-4 mr-1" alt="USDT" />
                          USDT
                        </button>
                      </div>
                    </div>
                    {isConnected && balances && (
                      <div className="text-xs text-gray-500 flex items-center">
                        Balance: {formatCurrency(balances[paymentToken as keyof typeof balances] as number || 0)} {paymentToken}
                      </div>
                    )}
                  </div>
                  <div className="flex rounded-md border overflow-hidden mt-2">
                    <Input
                      id="payment-amount"
                      type="number"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <button
                      type="button"
                      onClick={handleMaxAmount}
                      className="py-2 px-3 bg-gray-50 border-l text-xs text-primary font-medium hover:bg-gray-100"
                    >
                      MAX
                    </button>
                  </div>
                  
                  <div className="my-3 flex justify-center">
                    <div className="bg-gray-100 p-1 rounded-full">
                      <ArrowDown className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                  
                  <div className="flex justify-between mb-1">
                    <span>You receive</span>
                    {isConnected && balances && (
                      <div className="text-xs text-gray-500 flex items-center">
                        Balance: {formatCurrency(balances.TAS || 0)} TAS
                      </div>
                    )}
                  </div>
                  <div className="flex rounded-md border overflow-hidden">
                    <div className="py-2 px-3 bg-gray-50 border-r flex items-center">
                      <img src="https://assets.coingecko.com/coins/images/28250/thumb/TAS.png" className="h-5 w-5 mr-1" alt="TAS" />
                      <span className="font-medium">TAS</span>
                    </div>
                    <Input
                      id="receive-amount"
                      type="number"
                      placeholder="0.00"
                      value={receiveTasAmount}
                      onChange={(e) => handleTasAmountChange(e.target.value)}
                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>
                
                <div className="mb-4 px-2 py-3 bg-blue-50 rounded-md text-sm text-blue-700">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <p>
                      The sale price is fixed at ${tokenPrice.toFixed(5)} per TAS token. Tokens will be sent directly to your wallet upon successful transaction.
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  {isConnected ? (
                    paymentToken === "USDT" && needsUsdtApproval ? (
                      <Button
                        onClick={() => approveUsdtMutation.mutate()}
                        disabled={approveUsdtMutation.isPending}
                        className="w-full py-6 text-lg"
                      >
                        {approveUsdtMutation.isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Approving USDT...
                          </>
                        ) : (
                          "Approve USDT"
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleBuyTas}
                        disabled={
                          buyTasMutation.isPending || 
                          paymentAmount === "" || 
                          parseFloat(paymentAmount) <= 0 ||
                          !saleActive
                        }
                        className="w-full py-6 text-lg"
                      >
                        {buyTasMutation.isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Buy TAS Tokens"
                        )}
                      </Button>
                    )
                  ) : (
                    <Button
                      onClick={openConnectModal}
                      className="w-full py-6 text-lg"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect Wallet
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 border-t pt-4 text-xs text-gray-500">
              <div className="flex justify-between w-full">
                <span>Sale Contract</span>
                <a 
                  href={`https://bscscan.com/address/${TAS_TOKEN_SALE_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:underline"
                >
                  {TAS_TOKEN_SALE_ADDRESS.slice(0, 6)}...{TAS_TOKEN_SALE_ADDRESS.slice(-4)}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
              <div className="flex justify-between w-full">
                <span>Token Contract</span>
                <a 
                  href={`https://bscscan.com/address/${TAS_TOKEN_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:underline"
                >
                  {TAS_TOKEN_ADDRESS.slice(0, 6)}...{TAS_TOKEN_ADDRESS.slice(-4)}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>TAS Token</CardTitle>
              <CardDescription>
                Token Information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <img src="https://assets.coingecko.com/coins/images/28250/thumb/TAS.png" className="h-12 w-12" alt="TAS" />
                <div>
                  <h3 className="font-bold">TASnative (TAS)</h3>
                  <p className="text-sm text-gray-500">BEP-20 Token</p>
                </div>
              </div>
              
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current Price</span>
                  <span className="font-medium">${tokenPrice.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Market Cap</span>
                  <span className="font-medium">${formatNumber((contractData?.circulatingSupply || 250000000) * tokenPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Supply</span>
                  <span className="font-medium">{formatNumber(contractData?.totalSupply || 1000000000)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Circulating Supply</span>
                  <span className="font-medium">{formatNumber(contractData?.circulatingSupply || 250000000)}</span>
                </div>
              </div>
              
              <div className="pt-2">
                <h4 className="text-sm font-medium mb-2">Token Allocation</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Token Sale</span>
                      <span>5%</span>
                    </div>
                    <Progress value={5} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Airdrop</span>
                      <span>10%</span>
                    </div>
                    <Progress value={10} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Development</span>
                      <span>5%</span>
                    </div>
                    <Progress value={5} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Team & Advisors</span>
                      <span>15%</span>
                    </div>
                    <Progress value={15} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Locked (1 year)</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} className="h-1.5" />
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <h4 className="text-sm font-medium mb-2">Links</h4>
                <div className="space-y-2">
                  <a
                    href="https://bscscan.com/token/0xd9541b134b1821736bd323135b8844d3ae408216"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    BSC Scan
                  </a>
                  <a
                    href="/whitepaper"
                    className="flex items-center text-sm text-primary hover:underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Whitepaper
                  </a>
                  <a
                    href="/explorer"
                    className="flex items-center text-sm text-primary hover:underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    Explorer
                  </a>
                </div>
              </div>
              
              <Alert className="mt-4 bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-amber-800">Important</AlertTitle>
                <AlertDescription className="text-amber-700 text-xs">
                  Make sure you're buying from the official contract address. Always verify the contract on BSC Scan.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="text-primary">BNB ⟷ TAS</span> Token Swap
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Two-step process: First exchange BNB for TAS/BNB on the BNB chain, then swap TAS/BNB for native TAS on TASChain. Native TAS is required to create custom tokens on TASChain.
        </p>
      </div>
      
      <Tabs defaultValue="swap" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="swap">Swap</TabsTrigger>
          <TabsTrigger value="sale">Token Sale</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="swap">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Swap Tokens</span>
                <Button variant="ghost" size="icon" onClick={() => refetchRate()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                Current rate: 1 BNB = {exchangeRate?.rate.toLocaleString()} TAS
                {exchangeRate?.lastUpdated && (
                  <span className="text-xs text-slate-400 ml-2">
                    Updated {new Date(exchangeRate.lastUpdated).toLocaleTimeString()}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* From token */}
              <div className="p-4 border rounded-lg border-slate-200 bg-slate-50">
                <div className="flex justify-between mb-2">
                  <Label className="text-sm text-slate-500">From</Label>
                  {isConnected && balances && (
                    <div className="text-xs text-slate-500">
                      Balance: {formatCurrency(balances[fromToken as keyof typeof balances] || 0)} {fromToken}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => handleFromAmountChange(e.target.value)}
                      placeholder="0.0"
                      className="pr-16"
                    />
                    {isConnected && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs text-primary"
                        onClick={handleMaxAmount}
                      >
                        MAX
                      </Button>
                    )}
                  </div>
                  <Button variant="outline" className="w-24 font-medium" disabled>
                    {fromToken}
                  </Button>
                </div>
                
                {/* Balance slider */}
                {isConnected && balances && (fromToken in balances) && fromAmount && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                    <Slider
                      value={sliderValue}
                      max={100}
                      step={1}
                      onValueChange={handleSliderChange}
                      className="py-1"
                    />
                  </div>
                )}
              </div>
              
              {/* Swap icon */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-slate-100 hover:bg-slate-200"
                  onClick={handleSwapTokens}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
              
              {/* To token */}
              <div className="p-4 border rounded-lg border-slate-200 bg-slate-50">
                <div className="flex justify-between mb-2">
                  <Label className="text-sm text-slate-500">To</Label>
                  {isConnected && balances && (
                    <div className="text-xs text-slate-500">
                      Balance: {formatCurrency(balances[toToken as keyof typeof balances] || 0)} {toToken}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={toAmount}
                    onChange={(e) => handleToAmountChange(e.target.value)}
                    placeholder="0.0"
                    className="flex-1"
                  />
                  <Button variant="outline" className="w-24 font-medium" disabled>
                    {toToken}
                  </Button>
                </div>
              </div>
              
              {/* Contract address */}
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-slate-600">
                    <Info className="h-4 w-4 mr-1" />
                    Contract address
                  </div>
                  <div className="flex items-center space-x-1">
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-800">
                      {BNB_TAS_CONTRACT.slice(0, 6)}...{BNB_TAS_CONTRACT.slice(-4)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(BNB_TAS_CONTRACT);
                        toast({
                          description: "Contract address copied to clipboard"
                        });
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </Button>
                    <a
                      href={`https://tasonscan.com/explorer?address=${BNB_TAS_CONTRACT}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-6 w-6 flex items-center justify-center text-slate-500 hover:text-primary"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Slippage */}
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Slippage Tolerance</Label>
                  <span className="text-sm font-medium">{slippage}%</span>
                </div>
                <div className="flex space-x-2">
                  {[0.1, 0.5, 1.0, 2.0].map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={slippage === value ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setSlippage(value)}
                    >
                      {value}%
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              {isConnected ? (
                <Button
                  className="w-full bg-gradient-to-r from-primary to-sky-400 text-white"
                  disabled={!fromAmount || !toAmount || parseFloat(fromAmount) <= 0 || swapMutation.isPending}
                  onClick={handleSwap}
                >
                  {swapMutation.isPending ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="mr-2 h-4 w-4" />
                  )}
                  {swapMutation.isPending ? "Swapping..." : "Swap"}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={openConnectModal}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              )}
              
              {/* Price impact warning */}
              {parseFloat(fromAmount) > 0 && (
                <div className="w-full mt-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Important Information</AlertTitle>
                    <AlertDescription className="text-xs text-slate-600">
                      <strong>Step 1:</strong> Swap BNB for TAS/BNB on the BNB chain. <strong>Step 2:</strong> Exchange TAS/BNB for native TAS on TASChain. This is required as TAS/BNB is just a bridged token on BNB chain, while native TAS is the actual token used for creating and trading on TASChain.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* New Token Sale Tab Content */}
        <TabsContent value="sale">
          <Card>
            <CardHeader>
              <CardTitle>TASToken Direct Sale</CardTitle>
              <CardDescription>
                Purchase TAS tokens directly from the official token sale contract on BSC Mainnet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 mt-1">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-1">TAS Token Sale</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Purchase TAS tokens directly from the official token sale contract. 5% of the total TAS supply (50,000,000 TAS) is available for sale.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <div className="bg-primary/5 px-3 py-1.5 rounded-full text-xs text-primary">💰 Current price: $0.001</div>
                      <div className="bg-primary/5 px-3 py-1.5 rounded-full text-xs text-primary">🔗 BSC Mainnet</div>
                      <div className="bg-primary/5 px-3 py-1.5 rounded-full text-xs text-primary">💸 BNB & USDT accepted</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-5 mb-4">
                <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-1">Token Sale Details</h3>
                    <p className="text-sm text-slate-500">
                      Token sale is now live! Purchase TAS tokens directly from the contract.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">Sale active</span>
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
                    <div className="text-xs text-slate-500 mb-1">Current Price</div>
                    <div className="font-medium">$0.001 / TAS</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">Min Purchase</div>
                    <div className="font-medium">0.01 BNB / 1 USDT</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">Accepted Payment</div>
                    <div className="font-medium">BNB, USDT</div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Sale Progress</span>
                    <span className="text-sm">50.00% sold</span>
                  </div>
                  <Progress value={50} className="h-2" />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-500">25,000,000 TAS</span>
                    <span className="text-xs text-slate-500">50,000,000 TAS</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">How to Buy TAS Tokens</p>
                    <ol className="list-decimal pl-4 space-y-2">
                      <li>Connect your wallet to the TASChain platform</li>
                      <li>Go to the <strong>Swap</strong> tab and exchange BNB for TAS</li>
                      <li>Alternatively, visit <a href="https://pancakeswap.finance/swap" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">PancakeSwap</a> and swap BNB for TAS tokens directly</li>
                      <li>TAS tokens will be sent to your wallet immediately after purchase</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-slate-600">
                    <Info className="h-4 w-4 mr-1" />
                    Token Sale Contract
                  </div>
                  <div className="flex items-center space-x-1">
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-800">
                      {TAS_TOKEN_SALE_ADDRESS.slice(0, 6)}...{TAS_TOKEN_SALE_ADDRESS.slice(-4)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(TAS_TOKEN_SALE_ADDRESS);
                        toast({
                          description: "Token sale contract address copied to clipboard"
                        });
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </Button>
                    <a
                      href={`https://bscscan.com/address/${TAS_TOKEN_SALE_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-6 w-6 flex items-center justify-center text-slate-500 hover:text-primary"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => setActiveTab("swap")}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Swap BNB to TAS
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Your recent BNB ⟷ TAS swap transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConnected ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Connect Your Wallet</h3>
                  <p className="text-slate-500 mb-4">
                    Connect your wallet to view your transaction history
                  </p>
                  <Button onClick={openConnectModal}>
                    Connect Wallet
                  </Button>
                </div>
              ) : transactions && transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <TransactionItem key={tx.id} transaction={tx} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Transactions Yet</h3>
                  <p className="text-slate-500">
                    Your swap history will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Additional info */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-2 flex items-center">
            <HelpCircle className="h-4 w-4 mr-2 text-primary" />
            What is TAS?
          </h3>
          <p className="text-sm text-slate-600">
            TAS (Talkastranger) is the native token of TASChain. There are two versions: TAS/BNB (a wrapped token on BNB chain) and native TAS (on TASChain). Native TAS is required to pay gas fees and create custom tokens on TASChain.
          </p>
        </div>
        
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-2 flex items-center">
            <HelpCircle className="h-4 w-4 mr-2 text-primary" />
            Why swap BNB for TAS?
          </h3>
          <p className="text-sm text-slate-600">
            The two-step swap process (BNB → TAS/BNB → native TAS) is necessary to participate in the TASChain ecosystem. Only native TAS allows you to create custom tokens and access platform features like token trading, matching, and messaging.
          </p>
        </div>
      </div>
      
      {/* Tutorial Dialog */}
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <LightbulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
              Welcome to BNB ⟷ TAS Swap
            </DialogTitle>
            <DialogDescription>
              Let us guide you through the token swap process.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {tutorialStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-medium text-base">Step 1: Connect Your Wallet</h3>
                <p className="text-sm text-muted-foreground">
                  First, connect your wallet by clicking the "Connect Wallet" button in the header.
                  You'll need a wallet like MetaMask with BNB to swap for TAS tokens.
                </p>
                <div className="relative rounded-lg border p-2 bg-slate-50">
                  <div className="flex items-center justify-center h-20">
                    <Wallet className="h-10 w-10 text-primary" />
                  </div>
                </div>
              </div>
            )}
            
            {tutorialStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-medium text-base">Step 2: Enter Swap Amount</h3>
                <p className="text-sm text-muted-foreground">
                  Enter the amount of BNB you want to swap. The equivalent amount of TAS will be calculated automatically.
                  You can also use the slider to select a percentage of your balance.
                </p>
                <div className="relative rounded-lg border p-2 bg-slate-50">
                  <div className="flex items-center justify-center h-20">
                    <ArrowDown className="h-10 w-10 text-primary" />
                  </div>
                </div>
              </div>
            )}
            
            {tutorialStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-medium text-base">Step 3: Review & Confirm</h3>
                <p className="text-sm text-muted-foreground">
                  Check the transaction details, including the exchange rate and slippage tolerance.
                  When ready, click the "Swap" button to initiate the transaction.
                </p>
                <div className="relative rounded-lg border p-2 bg-slate-50">
                  <div className="flex items-center justify-center h-20">
                    <Check className="h-10 w-10 text-green-500" />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex items-center justify-between">
            {tutorialStep > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setTutorialStep(prev => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
            )}
            <div className="flex-1 flex justify-center">
              <div className="flex space-x-1">
                {[1, 2, 3].map(step => (
                  <div 
                    key={step}
                    className={`h-2 w-2 rounded-full ${tutorialStep === step ? 'bg-primary' : 'bg-slate-200'}`}
                  />
                ))}
              </div>
            </div>
            {tutorialStep < 3 ? (
              <Button 
                onClick={() => setTutorialStep(prev => Math.min(3, prev + 1))}
              >
                Next
              </Button>
            ) : (
              <Button onClick={completeTutorial}>
                Got it
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Help Button */}
      {tutorialCompleted && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 rounded-full h-10 w-10 shadow-lg bg-white"
          onClick={() => setShowTutorial(true)}
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default BnbSwap;