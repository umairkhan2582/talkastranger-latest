import { ethers } from 'ethers';

// TASTokenSale contract ABI - only including the functions we need
const TOKEN_SALE_ABI = [
  // View functions
  "function getCurrentPrice() view returns (uint256)",
  "function getMarketCap() view returns (uint256)",
  "function tokensForSale() view returns (uint256)",
  "function tokensSold() view returns (uint256)",
  "function saleActive() view returns (bool)",
  "function basePrice() view returns (uint256)",
  "function tasToken() view returns (address)",
  "function usdtToken() view returns (address)",
  "function getBNBPrice() view returns (uint256)",
  "function pancakeswapPair() view returns (address)",
  
  // Transaction functions
  "function buyWithBNB(uint256 minTokens) payable",
  "function buyWithUSDT(uint256 amount)",
  "function sellTASForBNB(uint256 tasAmount, uint256 minBNBAmount)",
  "function sellTASForUSDT(uint256 tasAmount, uint256 minUSDTAmount)",
  
  // Events
  "event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost, string paymentToken)"
];

// PancakeSwap Pair ABI - only including the functions we need for price calculation
const PANCAKESWAP_PAIR_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

// PancakeSwap Router ABI - only including the functions we need for price calculation
const PANCAKESWAP_ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)",
  "function getAmountsIn(uint amountOut, address[] memory path) view returns (uint[] memory amounts)",
  "function WETH() view returns (address)"
];

// IERC20 ABI for token operations
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

// Contract addresses
export const TAS_TOKEN_ADDRESS = "0xd9541b134b1821736bd323135b8844d3ae408216";
export const USDT_TOKEN_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
export const TAS_TOKEN_SALE_ADDRESS = "0xF188D5C78dCe3860e63F621b295e95992e77e881"; // TASTokenSale contract address
export const TAS_REWARDS_CONTRACT_ADDRESS = "0x93a1DCe8C46F5F3bEB9399E86c72eE25B60F0531"; // User rewards contract address

// Helper function to get a contract instance with signer
export async function getContractWithSigner(address: string, abi: any, needSigner = true) {
  if (!window.ethereum) {
    throw new Error("MetaMask or compatible wallet not installed");
  }
  
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // If we need a signer (for transactions)
    if (needSigner) {
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      return new ethers.Contract(address, abi, signer);
    }
    
    // If we just need a provider (for view functions)
    return new ethers.Contract(address, abi, provider);
  } catch (error) {
    console.error("Error getting contract:", error);
    throw error;
  }
}

// TAS Token Sale contract functions
export async function getTokenSaleContract(needSigner = true) {
  return getContractWithSigner(TAS_TOKEN_SALE_ADDRESS, TOKEN_SALE_ABI, needSigner);
}

export async function getTokenContract(tokenAddress: string, needSigner = true) {
  return getContractWithSigner(tokenAddress, ERC20_ABI, needSigner);
}

// PancakeSwap LP price fetching
export async function getPancakeSwapPairContract() {
  try {
    // Get the pancakeswap pair address from the token sale contract
    const tokenSaleContract = await getTokenSaleContract(false);
    const pairAddress = await tokenSaleContract.pancakeswapPair();
    
    // Create a contract for the pancakeswap pair
    return getContractWithSigner(pairAddress, PANCAKESWAP_PAIR_ABI, false);
  } catch (error) {
    console.error("Error getting PancakeSwap pair contract:", error);
    throw error;
  }
}

// Function to get real-time external Binance data 
async function getExternalMarketData(): Promise<{ 
  success: boolean; 
  price?: number; 
  volume?: number;
  source?: string;
}> {
  try {
    // Connect to external API to get real-time market data
    // This makes a direct, non-simulated API call to get the latest data from a market aggregator
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tasnative&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true');
    
    if (!response.ok) {
      throw new Error(`Market API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Market data API response:", data);
    
    if (!data.tasnative) {
      throw new Error("Token data not available");
    }
    
    // Extract price and volume information from the response
    const price = data.tasnative.usd;
    const volume = data.tasnative.usd_24h_vol;
    const marketCap = data.tasnative.usd_market_cap;
    
    console.log("Real market data:", { price, volume, marketCap });
    
    return {
      success: true,
      price: price,
      volume: volume,
      source: "CoinGecko"
    };
  } catch (error) {
    console.error("Error fetching market data:", error);
    
    try {
      // As a backup, try CoinPaprika API
      const backupResponse = await fetch('https://api.coinpaprika.com/v1/tickers/tas-tasnative');
      
      if (!backupResponse.ok) {
        throw new Error(`Backup API responded with status: ${backupResponse.status}`);
      }
      
      const backupData = await backupResponse.json();
      console.log("Backup market data:", backupData);
      
      return {
        success: true,
        price: backupData.quotes.USD.price,
        volume: backupData.quotes.USD.volume_24h,
        source: "CoinPaprika"
      };
    } catch (backupError) {
      console.error("Backup market data fetch failed:", backupError);
      
      // If all APIs fail, don't use any simulated data - just return failure
      return { success: false };
    }
  }
}

// Function to get real-time price from PancakeSwap LP
export async function getRealTimeTASPrice() {
  try {
    // First, try to get LP price from PancakeSwap
    const lpPrice = await getPancakeSwapLPPrice();
    
    // Next, try to get external market data from reliable sources
    const marketData = await getExternalMarketData();
    
    // If we have both prices, calculate a volume-weighted average
    if (lpPrice.success && marketData.success && marketData.price !== undefined && marketData.volume !== undefined) {
      // Estimate LP volume (this is just an example - in real life, you'd
      // calculate actual 24h volume from on-chain data)
      const lpVolume = 125000; // Estimated 24h volume in USD
      
      // Calculate volume-weighted average price
      const totalVolume = lpVolume + marketData.volume;
      const weightedAvgPrice = (
        (parseFloat(lpPrice.price || "0") * lpVolume) + 
        (marketData.price * marketData.volume)
      ) / totalVolume;
      
      console.log(`LP Price: ${lpPrice.price}, ${marketData.source || 'External'} Price: ${marketData.price}, Weighted: ${weightedAvgPrice}`);
      
      // Save to localStorage for fallback
      localStorage.setItem('lastKnownTASPrice', weightedAvgPrice.toString());
      
      // Calculate and save market cap
      const circulatingSupply = 250000000;
      const marketCap = (circulatingSupply * weightedAvgPrice).toString();
      localStorage.setItem('lastKnownMarketCap', marketCap);
      
      return weightedAvgPrice.toString();
    } 
    // If we only have LP price
    else if (lpPrice.success && lpPrice.price) {
      console.log("Using only LP price:", lpPrice.price);
      return lpPrice.price;
    }
    // If we only have external market price 
    else if (marketData.success && marketData.price !== undefined) {
      console.log(`Using only ${marketData.source || 'External'} price:`, marketData.price);
      
      // Save to localStorage for fallback
      localStorage.setItem('lastKnownTASPrice', marketData.price.toString());
      
      // Calculate and save market cap
      const circulatingSupply = 250000000;
      const marketCap = (circulatingSupply * marketData.price).toString();
      localStorage.setItem('lastKnownMarketCap', marketCap);
      
      return marketData.price.toString();
    }
    // If we have no price data
    else {
      throw new Error("No price data available");
    }
  } catch (error) {
    console.error("Error getting TAS price:", error);
    
    // Get the last known price from localStorage if available
    const lastKnownPrice = localStorage.getItem('lastKnownTASPrice');
    if (lastKnownPrice) {
      return lastKnownPrice;
    }
    
    // Fall back to a reasonable default (this should match the contract's base price)
    return "0.001";
  }
}

// Helper function to get price from PancakeSwap Router (more accurate than LP calculation)
async function getPancakeSwapLPPrice(): Promise<{ 
  success: boolean; 
  price?: string;
}> {
  try {
    console.log("Fetching LP price directly from PancakeSwap...");
    
    // Use a reliable method: direct provider connection
    const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
    
    // First try the Router approach for more accurate pricing
    try {
      // PancakeSwap Router address - this is the main router address
      const routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
      
      // Create router contract instance
      const routerContract = new ethers.Contract(
        routerAddress,
        PANCAKESWAP_ROUTER_ABI,
        provider
      );
      
      // Get WBNB address from router
      const wbnbAddress = await routerContract.WETH();
      
      // Create the path for getting price (TAS → WBNB)
      const path = [TAS_TOKEN_ADDRESS, wbnbAddress];
      
      // Amount of TAS to swap (1 TAS with 18 decimals)
      const amountIn = ethers.utils.parseEther("1");
      
      // Get expected BNB amount out
      const amounts = await routerContract.getAmountsOut(amountIn, path);
      const bnbAmountOut = amounts[1];
      
      // Hard-code BNB price for now (could be fetched from an oracle)
      const bnbPrice = 350;
      
      // Calculate TAS price in USD (bnbAmount * bnbPrice)
      const bnbAmount = parseFloat(ethers.utils.formatEther(bnbAmountOut));
      const tasPrice = bnbAmount * bnbPrice;
      
      console.log(`Router swap price: 1 TAS = ${bnbAmount} BNB = $${tasPrice}`);
      
      return {
        success: true,
        price: tasPrice.toString()
      };
    } catch (routerError) {
      console.log("Router price fetch failed, falling back to LP calculation:", routerError);
      
      // Fall back to LP calculation if router approach fails
      // Hard-code the PancakeSwap pair address from your constructor params
      const pairAddress = "0xd88892eF17862f89D385Fc52F7F51DEF86c94778";
      
      console.log("Getting price from PancakeSwap pair:", pairAddress);
      
      // Create the pair contract instance with the direct provider
      const pairContract = new ethers.Contract(
        pairAddress,
        PANCAKESWAP_PAIR_ABI,
        provider
      );
      
      // Get token0 and token1 from the pair to determine order
      const token0 = await pairContract.token0();
      const token1 = await pairContract.token1();
      
      console.log("Pair tokens:", token0, token1, "TAS:", TAS_TOKEN_ADDRESS);
      
      // Get reserves from the pair
      const reserves = await pairContract.getReserves();
      const reserve0 = reserves[0];
      const reserve1 = reserves[1];
      
      console.log("Reserves:", ethers.utils.formatEther(reserve0), ethers.utils.formatEther(reserve1));
      
      // Determine which reserve is TAS and which is BNB/USDT
      const isTASToken0 = token0.toLowerCase() === TAS_TOKEN_ADDRESS.toLowerCase();
      
      // Get the reserves in the correct order
      const tasReserve = isTASToken0 ? reserve0 : reserve1;
      const otherReserve = isTASToken0 ? reserve1 : reserve0;
      
      console.log("TAS reserve:", ethers.utils.formatEther(tasReserve));
      console.log("Other reserve:", ethers.utils.formatEther(otherReserve));
      
      // Hard-code BNB price for now to avoid additional contract calls
      // This would typically be fetched from the Chainlink oracle
      const bnbPrice = 350; 
      
      console.log("Using BNB price:", bnbPrice);
      
      // Calculate TAS price in USD
      // For BNB/TAS pair: TAS price = (otherReserve (BNB) * BNB price in USD) / tasReserve
      const otherReserveValue = parseFloat(ethers.utils.formatEther(otherReserve));
      const tasReserveValue = parseFloat(ethers.utils.formatEther(tasReserve));
      
      if (tasReserveValue === 0) {
        console.log("TAS reserve is zero, using default price");
        // If there's no TAS in the pool yet, use a starting price
        return { success: false };
      }
      
      // Calculate price ensuring we respect decimals
      const tasPrice = (otherReserveValue * bnbPrice) / tasReserveValue;
      
      // Ensure we got a valid price (not NaN, infinity, etc.)
      if (!isFinite(tasPrice) || isNaN(tasPrice)) {
        console.log("Invalid price calculation result");
        return { success: false };
      }
      
      console.log("Calculated TAS price from LP:", tasPrice);
      
      return { 
        success: true,
        price: tasPrice.toString()
      };
    }
  } catch (error) {
    console.error("Error getting real-time TAS price from PancakeSwap LP:", error);
    return { success: false };
  }
}

// Function to get current TAS price from contract (fallback)
export async function getCurrentTASPriceFromContract() {
  try {
    const contract = await getTokenSaleContract(false);
    const price = await contract.getCurrentPrice();
    return ethers.utils.formatUnits(price, 18);
  } catch (error) {
    console.error("Error getting TAS price from contract:", error);
    // Get the last known price from local storage if available
    const lastKnownPrice = localStorage.getItem('lastKnownTASPrice');
    if (lastKnownPrice) {
      return lastKnownPrice;
    }
    return "0.001"; // Default price as absolute fallback
  }
}

// Function to get market cap
export async function getMarketCap() {
  try {
    const contract = await getTokenSaleContract(false);
    const marketCap = await contract.getMarketCap();
    return ethers.utils.formatUnits(marketCap, 18);
  } catch (error) {
    console.error("Error getting market cap:", error);
    return "250000"; // Default value as fallback (250k USD)
  }
}

// Main function to get current TAS price (tries LP first, then falls back to contract)
export async function getCurrentTASPrice() {
  try {
    // Try to get the real-time price from PancakeSwap LP first
    const price = await getRealTimeTASPrice();
    // Save successful price to localStorage
    if (price && !isNaN(parseFloat(price))) {
      localStorage.setItem('lastKnownTASPrice', price);
    }
    return price;
  } catch (error) {
    console.error("Error getting TAS price from LP, falling back to contract price:", error);
    // Fall back to contract price
    return getCurrentTASPriceFromContract();
  }
}

// Function to get the BNB price in USD
export async function getBNBPrice() {
  try {
    const contract = await getTokenSaleContract(false);
    const price = await contract.getBNBPrice();
    return ethers.utils.formatUnits(price, 18);
  } catch (error) {
    console.error("Error getting BNB price:", error);
    return "350"; // Default price as fallback
  }
}

// Function to get tokens available for sale
export async function getTokensForSale() {
  try {
    const contract = await getTokenSaleContract(false);
    const tokens = await contract.tokensForSale();
    return ethers.utils.formatUnits(tokens, 18);
  } catch (error) {
    console.error("Error getting tokens for sale:", error);
    return "0";
  }
}

// Function to buy TAS with BNB
export async function buyTASWithBNB(bnbAmount: string, minTokens: string) {
  try {
    const contract = await getTokenSaleContract(true);
    
    // Convert inputs to proper format
    const bnbValue = ethers.utils.parseEther(bnbAmount);
    const minTokensValue = ethers.utils.parseEther(minTokens);
    
    // Call the contract function with proper value
    const tx = await contract.buyWithBNB(minTokensValue, { value: bnbValue });
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Error buying TAS with BNB:", error);
    throw error;
  }
}

// Function to buy TAS with USDT
export async function buyTASWithUSDT(tasAmount: string) {
  try {
    const contract = await getTokenSaleContract(true);
    const tasToken = await getTokenContract(TAS_TOKEN_ADDRESS);
    const usdtToken = await getTokenContract(USDT_TOKEN_ADDRESS);
    
    // Get current price and calculate USDT amount needed
    const currentPrice = await contract.getCurrentPrice();
    const tasValue = ethers.utils.parseEther(tasAmount);
    const usdtValue = tasValue.mul(currentPrice).div(ethers.utils.parseEther("1"));
    
    // First approve USDT transfer
    const tx1 = await usdtToken.approve(TAS_TOKEN_SALE_ADDRESS, usdtValue);
    await tx1.wait();
    
    // Then buy TAS with USDT
    const tx2 = await contract.buyWithUSDT(tasValue);
    const receipt = await tx2.wait();
    
    return receipt;
  } catch (error) {
    console.error("Error buying TAS with USDT:", error);
    throw error;
  }
}

// Function to calculate TAS amount from BNB
export async function calculateTASFromBNB(bnbAmount: string): Promise<string> {
  try {
    if (!bnbAmount || parseFloat(bnbAmount) <= 0) return "0";
    
    const contract = await getTokenSaleContract(false);
    
    // Get BNB price and TAS price
    const bnbPrice = await contract.getBNBPrice();
    const tasPrice = await contract.getCurrentPrice();
    
    // Calculate TAS amount: (BNB * BNB price) / TAS price
    const bnbValue = ethers.utils.parseEther(bnbAmount);
    const bnbInUSD = bnbValue.mul(bnbPrice).div(ethers.utils.parseEther("1"));
    const tasAmount = bnbInUSD.mul(ethers.utils.parseEther("1")).div(tasPrice);
    
    return ethers.utils.formatEther(tasAmount);
  } catch (error) {
    console.error("Error calculating TAS from BNB:", error);
    // Simple fallback calculation based on $350 per BNB and $0.001 per TAS
    return (parseFloat(bnbAmount) * 350 / 0.001).toString();
  }
}

// Function to get token balance
export async function getTokenBalance(tokenAddress: string, address?: string) {
  try {
    const token = await getTokenContract(tokenAddress, false);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // If address not provided, use current connected wallet
    let userAddress = address;
    if (!userAddress) {
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      userAddress = await signer.getAddress();
    }
    
    const balance = await token.balanceOf(userAddress);
    return ethers.utils.formatUnits(balance, 18);
  } catch (error) {
    console.error("Error getting token balance:", error);
    return "0";
  }
}

// Function to get BNB balance 
export async function getBNBBalance(address?: string) {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // If address not provided, use current connected wallet
    let userAddress = address;
    if (!userAddress) {
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      userAddress = await signer.getAddress();
    }
    
    const balance = await provider.getBalance(userAddress);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error("Error getting BNB balance:", error);
    return "0";
  }
}

// Function to sell TAS for BNB
export async function sellTASForBNB(tasAmount: string, minBNBAmount: string) {
  try {
    const contract = await getTokenSaleContract(true);
    const tasToken = await getTokenContract(TAS_TOKEN_ADDRESS, true);
    
    // Convert inputs to proper format
    const tasValue = ethers.utils.parseEther(tasAmount);
    const minBNBValue = ethers.utils.parseEther(minBNBAmount);
    
    // First approve token sale contract to spend TAS tokens
    const tx1 = await tasToken.approve(TAS_TOKEN_SALE_ADDRESS, tasValue);
    await tx1.wait();
    
    // Then sell TAS for BNB
    const tx2 = await contract.sellTASForBNB(tasValue, minBNBValue);
    const receipt = await tx2.wait();
    
    return receipt;
  } catch (error) {
    console.error("Error selling TAS for BNB:", error);
    throw error;
  }
}

// Function to sell TAS for USDT
export async function sellTASForUSDT(tasAmount: string, minUSDTAmount: string) {
  try {
    const contract = await getTokenSaleContract(true);
    const tasToken = await getTokenContract(TAS_TOKEN_ADDRESS, true);
    
    // Convert inputs to proper format
    const tasValue = ethers.utils.parseEther(tasAmount);
    const minUSDTValue = ethers.utils.parseEther(minUSDTAmount);
    
    // First approve token sale contract to spend TAS tokens
    const tx1 = await tasToken.approve(TAS_TOKEN_SALE_ADDRESS, tasValue);
    await tx1.wait();
    
    // Then sell TAS for USDT
    const tx2 = await contract.sellTASForUSDT(tasValue, minUSDTValue);
    const receipt = await tx2.wait();
    
    return receipt;
  } catch (error) {
    console.error("Error selling TAS for USDT:", error);
    throw error;
  }
}

// Function to calculate BNB amount from TAS amount
export async function calculateBNBFromTAS(tasAmount: string): Promise<string> {
  try {
    if (!tasAmount || parseFloat(tasAmount) <= 0) return "0";
    
    const contract = await getTokenSaleContract(false);
    
    // Get BNB price and TAS price
    const bnbPrice = await contract.getBNBPrice();
    const tasPrice = await contract.getCurrentPrice();
    
    // Calculate BNB amount: (TAS * TAS price) / BNB price
    const tasValue = ethers.utils.parseEther(tasAmount);
    const tasInUSD = tasValue.mul(tasPrice).div(ethers.utils.parseEther("1"));
    const bnbAmount = tasInUSD.mul(ethers.utils.parseEther("1")).div(bnbPrice);
    
    return ethers.utils.formatEther(bnbAmount);
  } catch (error) {
    console.error("Error calculating BNB from TAS:", error);
    // Simple fallback calculation based on $350 per BNB and $0.001 per TAS
    return (parseFloat(tasAmount) * 0.001 / 350).toString();
  }
}

// Function to calculate USDT amount from TAS amount
export async function calculateUSDTFromTAS(tasAmount: string): Promise<string> {
  try {
    if (!tasAmount || parseFloat(tasAmount) <= 0) return "0";
    
    const contract = await getTokenSaleContract(false);
    
    // Get TAS price
    const tasPrice = await contract.getCurrentPrice();
    
    // Calculate USDT amount: TAS * TAS price
    const tasValue = ethers.utils.parseEther(tasAmount);
    const usdtAmount = tasValue.mul(tasPrice).div(ethers.utils.parseEther("1"));
    
    return ethers.utils.formatEther(usdtAmount);
  } catch (error) {
    console.error("Error calculating USDT from TAS:", error);
    // Simple fallback calculation based on $0.001 per TAS
    return (parseFloat(tasAmount) * 0.001).toString();
  }
}