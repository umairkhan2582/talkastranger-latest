import { ethers } from 'ethers';
import axios from 'axios';

// PancakeSwap Router ABI - only including the functions we need for price calculation
const PANCAKESWAP_ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)",
  "function WETH() view returns (address)"
];

// PancakeSwap Pair ABI for direct pool price
const PANCAKESWAP_PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)"
];

// TAS Token address on BSC
const TAS_TOKEN_ADDRESS = "0xd9541b134b1821736bd323135b8844d3ae408216";

// PancakeSwap Router address 
const PANCAKESWAP_ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

// PancakeSwap TAS-BNB Pair address
const PANCAKESWAP_TAS_BNB_PAIR = "0xd88892eF17862f89D385Fc52F7F51DEF86c94778";

// BNB price in USD - ideally this would come from an oracle
const BNB_PRICE_USD = 350;

// Direct price calculation from PancakeSwap Router
export async function getDirectTASPriceFromPancakeSwap(): Promise<number> {
  try {
    console.log("Getting TAS price directly from PancakeSwap Router...");
    
    // Use a direct provider connection to BSC
    const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
    
    // Create router contract instance
    const routerContract = new ethers.Contract(
      PANCAKESWAP_ROUTER_ADDRESS,
      PANCAKESWAP_ROUTER_ABI,
      provider
    );
    
    // Get WBNB address from router
    const wbnbAddress = await routerContract.WETH();
    
    // Create the path for getting price (TAS → WBNB)
    const path = [TAS_TOKEN_ADDRESS, wbnbAddress];
    
    // Amount of TAS to swap (1 TAS with 18 decimals)
    const amountIn = ethers.utils.parseEther("1");
    
    // Get expected BNB amount out from the router
    const amounts = await routerContract.getAmountsOut(amountIn, path);
    const bnbAmountOut = amounts[1];
    
    // Convert from wei to ether
    const bnbAmount = parseFloat(ethers.utils.formatEther(bnbAmountOut));
    
    // Calculate TAS price in USD (bnbAmount * bnbPrice)
    const tasPrice = bnbAmount * BNB_PRICE_USD;
    
    console.log(`EXACT PancakeSwap Router price: 1 TAS = ${bnbAmount} BNB = $${tasPrice}`);
    
    return tasPrice;
  } catch (error) {
    console.error("Error getting direct TAS price from PancakeSwap Router:", error);
    throw error;
  }
}

// Get price directly from the liquidity pool (alternative method)
export async function getTASPriceFromPancakeSwapPool(): Promise<number> {
  try {
    console.log("Getting TAS price directly from PancakeSwap Pool...");
    
    // Use a direct provider connection to BSC
    const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
    
    // Create pair contract instance
    const pairContract = new ethers.Contract(
      PANCAKESWAP_TAS_BNB_PAIR,
      PANCAKESWAP_PAIR_ABI,
      provider
    );
    
    // Get token addresses in the pair to determine their order
    const token0 = await pairContract.token0();
    const token1 = await pairContract.token1();
    
    // Get reserves
    const [reserve0, reserve1] = await pairContract.getReserves();
    
    // Determine which reserve is TAS and which is BNB
    let tasBnbRatio;
    if (token0.toLowerCase() === TAS_TOKEN_ADDRESS.toLowerCase()) {
      // token0 is TAS, token1 is BNB
      tasBnbRatio = parseFloat(ethers.utils.formatEther(reserve1)) / 
                   parseFloat(ethers.utils.formatEther(reserve0));
    } else {
      // token0 is BNB, token1 is TAS
      tasBnbRatio = parseFloat(ethers.utils.formatEther(reserve0)) / 
                   parseFloat(ethers.utils.formatEther(reserve1));
    }
    
    // Calculate TAS price in USD
    const tasPrice = tasBnbRatio * BNB_PRICE_USD;
    
    console.log(`EXACT PancakeSwap Pool price: 1 TAS = ${tasBnbRatio} BNB = $${tasPrice}`);
    
    return tasPrice;
  } catch (error) {
    console.error("Error getting TAS price from PancakeSwap Pool:", error);
    throw error;
  }
}

// Get TAS token price and market data from DexScreener API
export async function getTASPriceFromDexScreener(): Promise<number> {
  try {
    console.log("Getting TAS price from DexScreener API...");
    
    // DexScreener API endpoint for TAS token on BSC
    const url = `https://api.dexscreener.com/latest/dex/tokens/${TAS_TOKEN_ADDRESS}`;
    
    const response = await axios.get(url);
    
    // Check if we have valid data
    if (response.data && response.data.pairs && response.data.pairs.length > 0) {
      // Get the first pair (which should be the main TAS/BNB pair)
      const mainPair = response.data.pairs[0];
      
      // Get the USD price
      const priceUsd = parseFloat(mainPair.priceUsd);
      
      console.log(`DexScreener price: 1 TAS = $${priceUsd}`);
      
      return priceUsd;
    } else {
      throw new Error("No valid pairs found in DexScreener response");
    }
  } catch (error) {
    console.error("Error getting TAS price from DexScreener:", error);
    throw error;
  }
}

// Get complete market data including price, market cap, 24h volume, etc.
export async function getTASMarketData(): Promise<{
  price: number;
  marketCap: number;
  fdv: number;
  volume24h: number;
  priceChange24h: number;
  liquidityUsd: number;
  pairAddress: string;
}> {
  try {
    console.log("Getting TAS market data from DexScreener API...");
    
    // DexScreener API endpoint for TAS token on BSC
    const url = `https://api.dexscreener.com/latest/dex/tokens/${TAS_TOKEN_ADDRESS}`;
    
    const response = await axios.get(url);
    
    // Default values in case we don't have data
    const defaultData = {
      price: 0.005,
      marketCap: 1250000, // 250M circulating supply * $0.005
      fdv: 5000000, // 1B total supply * $0.005
      volume24h: 0,
      priceChange24h: 0,
      liquidityUsd: 0,
      pairAddress: PANCAKESWAP_TAS_BNB_PAIR
    };
    
    // Check if we have valid data
    if (response.data && response.data.pairs && response.data.pairs.length > 0) {
      // Get the first pair (which should be the main TAS/BNB pair)
      const mainPair = response.data.pairs[0];
      
      // Calculate market cap based on circulating supply (25% of total)
      const priceUsd = parseFloat(mainPair.priceUsd);
      const circulatingSupply = 250000000; // 25% of 1B total supply
      const totalSupply = 1000000000;
      
      return {
        price: priceUsd,
        marketCap: priceUsd * circulatingSupply,
        fdv: priceUsd * totalSupply,
        volume24h: parseFloat(mainPair.volume?.h24 || "0"),
        priceChange24h: parseFloat(mainPair.priceChange?.h24 || "0"),
        liquidityUsd: parseFloat(mainPair.liquidity?.usd || "0"),
        pairAddress: mainPair.pairAddress
      };
    } else {
      console.warn("No valid pairs found in DexScreener response, using fallback data");
      return defaultData;
    }
  } catch (error) {
    console.error("Error getting TAS market data from DexScreener:", error);
    return {
      price: 0.005,
      marketCap: 1250000, // 250M circulating supply * $0.005
      fdv: 5000000, // 1B total supply * $0.005
      volume24h: 0,
      priceChange24h: 0,
      liquidityUsd: 0,
      pairAddress: PANCAKESWAP_TAS_BNB_PAIR
    };
  }
}

// Get the current BNB price in USD
export async function getBNBPrice(): Promise<number> {
  try {
    console.log("Getting BNB price...");
    
    // Try to get BNB price from Binance API
    const response = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
    
    if (response.data && response.data.price) {
      const bnbPrice = parseFloat(response.data.price);
      console.log(`Binance BNB Price: $${bnbPrice}`);
      return bnbPrice;
    }
    
    // Fall back to default BNB price if API call fails
    console.log(`Using default BNB Price: $${BNB_PRICE_USD}`);
    return BNB_PRICE_USD;
  } catch (error) {
    console.error("Error getting BNB price:", error);
    // Fall back to default BNB price
    return BNB_PRICE_USD;
  }
}

// Function to output all TAS price calculation methods for comparison
export async function logAllTASPriceCalculations(): Promise<void> {
  try {
    console.log("=== TAS PRICE COMPARISON ===");
    
    try {
      const dexScreenerPrice = await getTASPriceFromDexScreener();
      console.log(`DexScreener Price: $${dexScreenerPrice}`);
    } catch (error) {
      console.error("DexScreener price calculation failed:", error);
    }
    
    try {
      const routerPrice = await getDirectTASPriceFromPancakeSwap();
      console.log(`PancakeSwap Router Price: $${routerPrice}`);
    } catch (error) {
      console.error("Router price calculation failed:", error);
    }
    
    try {
      const poolPrice = await getTASPriceFromPancakeSwapPool();
      console.log(`PancakeSwap Pool Price: $${poolPrice}`);
    } catch (error) {
      console.error("Pool price calculation failed:", error);
    }
    
    console.log("======================================");
  } catch (error) {
    console.error("Error logging price calculations:", error);
  }
}