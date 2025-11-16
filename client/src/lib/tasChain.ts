/**
 * TAS Chain Connection Utilities
 * 
 * This module provides utilities for interacting with the TAS blockchain.
 */

// Import ethers properly - we're using namespace imports to avoid compatibility issues
import * as ethers from 'ethers';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from './contract-addresses';

// Using BSC Mainnet configuration from contract-addresses.ts
const TAS_CHAIN_RPC_URL = NETWORK_CONFIG.rpcUrl;
const TAS_CHAIN_CHAIN_ID = NETWORK_CONFIG.chainId;
const TAS_CHAIN_EXPLORER_URL = NETWORK_CONFIG.blockExplorerUrl;

// Contract addresses
const TAS_TOKEN_ADDRESS = CONTRACT_ADDRESSES.TAS_TOKEN;

// Type definitions for compatibility
type Provider = any; // Using any type to avoid ethers version compatibility issues

// Helper functions to handle different ethers versions
export const formatUnits = (value: any, decimals: number): string => {
  try {
    // Try ethers v6 approach
    if (typeof ethers.formatUnits === 'function') {
      return ethers.formatUnits(value, decimals);
    }
    // Fallback for ethers v5
    if (ethers.utils && typeof ethers.utils.formatUnits === 'function') {
      return ethers.utils.formatUnits(value, decimals);
    }
    // Manual fallback
    const divisor = BigInt(10) ** BigInt(decimals);
    return (BigInt(value) / divisor).toString();
  } catch (error) {
    console.error('Error formatting units:', error);
    return '0';
  }
};

export const parseUnits = (value: string, decimals: number): any => {
  try {
    // Try ethers v6 approach
    if (typeof ethers.parseUnits === 'function') {
      return ethers.parseUnits(value, decimals);
    }
    // Fallback for ethers v5
    if (ethers.utils && typeof ethers.utils.parseUnits === 'function') {
      return ethers.utils.parseUnits(value, decimals);
    }
    // Manual fallback
    const multiplier = BigInt(10) ** BigInt(decimals);
    return BigInt(Math.floor(parseFloat(value) * Number(multiplier)));
  } catch (error) {
    console.error('Error parsing units:', error);
    return 0;
  }
};

// Use addresses defined in the imports
const TOKEN_FACTORY_ADDRESS = CONTRACT_ADDRESSES.TOKEN_FACTORY;
const SWAP_MARKET_ADDRESS = CONTRACT_ADDRESSES.SWAP_MARKET;

// TAS Token Contract ABI
const TAS_TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function mint(address to, uint256 amount) returns (bool)',
  'function burn(uint256 amount) returns (bool)',
  'event TokensMinted(address indexed to, uint256 amount)'
];

// Token Factory Contract ABI
const TOKEN_FACTORY_ABI = [
  'function createToken(string name, string symbol, uint256 initialSupply, string logo, string category) returns (address)',
  'function tokens(uint256 index) view returns (address tokenAddress, string name, string symbol, uint256 initialSupply, address creator, uint256 creationTime, string logo, string category, bool liquidityReleased)',
  'function getTokenCount() view returns (uint256)',
  'function getTokensByCategory(string category) view returns (uint256[])',
  'function getCreatorTokens(address creator) view returns (uint256[])',
  'function categories(uint256 index) view returns (string)',
  'function getCategoryCount() view returns (uint256)',
  'event TokenCreated(address tokenAddress, string name, string symbol, uint256 initialSupply, address creator, string logo, string category)',
  'event LiquidityReleased(address tokenAddress, address liquidityPool, uint256 amount)'
];

// Swap Market Contract ABI
const SWAP_MARKET_ABI = [
  'function createSwapRequest(address tokenOffered, uint256 amountOffered, address tokenRequested, uint256 amountRequested, uint256 duration) returns (uint256)',
  'function acceptSwapRequest(uint256 requestId) returns (bool)',
  'function cancelSwapRequest(uint256 requestId) returns (bool)',
  'function getSwapRequest(uint256 requestId) view returns (address requester, address tokenOffered, uint256 amountOffered, address tokenRequested, uint256 amountRequested, uint256 creationTime, uint256 expirationTime, bool active, address swappedWith)',
  'function getUserSwapRequests(address user) view returns (uint256[])',
  'function getSwapRequestCount() view returns (uint256)',
  'function getActiveSwapRequests() view returns (uint256[])',
  'event SwapRequested(uint256 indexed requestId, address indexed requester, address tokenOffered, uint256 amountOffered, address tokenRequested, uint256 amountRequested, uint256 expirationTime)',
  'event SwapCompleted(uint256 indexed requestId, address indexed requester, address indexed accepter, address tokenOffered, uint256 amountOffered, address tokenRequested, uint256 amountRequested)',
  'event SwapCancelled(uint256 indexed requestId, address indexed requester)'
];

// TAS Chain provider - with fallbacks for different ethers versions
export const getProvider = () => {
  try {
    // First try ethers v6 approach
    if (typeof ethers.JsonRpcProvider === 'function') {
      return new ethers.JsonRpcProvider(TAS_CHAIN_RPC_URL);
    }
    
    // Fallback for ethers v5
    if (ethers.providers && typeof ethers.providers.JsonRpcProvider === 'function') {
      return new ethers.providers.JsonRpcProvider(TAS_CHAIN_RPC_URL);
    }
    
    // Last resort fallback
    console.warn('Using fallback provider mechanism');
    return {
      getNetwork: () => Promise.resolve({ chainId: TAS_CHAIN_CHAIN_ID, name: 'BSC Testnet' }),
      getSigner: () => ({
        getAddress: () => Promise.resolve('0x0000000000000000000000000000000000000000')
      }),
      _isProvider: true
    };
  } catch (error) {
    console.error('Error creating provider:', error);
    // Return minimal mock provider
    return {
      getNetwork: () => Promise.resolve({ chainId: TAS_CHAIN_CHAIN_ID, name: 'BSC Testnet' }),
      getSigner: () => ({
        getAddress: () => Promise.resolve('0x0000000000000000000000000000000000000000')
      }),
      _isProvider: true
    };
  }
};

// TAS Token contract instance
export const getTASTokenContract = (provider: Provider, address = TAS_TOKEN_ADDRESS) => {
  return new ethers.Contract(address, TAS_TOKEN_ABI, provider);
};

// Token Factory contract
export const getTokenFactoryContract = (provider: Provider, address = TOKEN_FACTORY_ADDRESS) => {
  return new ethers.Contract(address, TOKEN_FACTORY_ABI, provider);
};

// Swap Market contract
export const getSwapMarketContract = (provider: Provider, address = SWAP_MARKET_ADDRESS) => {
  return new ethers.Contract(address, SWAP_MARKET_ABI, provider);
};

// Connect wallet to TAS Chain
export const connectToTASChain = async () => {
  if (window.ethereum) {
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Check if TAS Chain is configured, if not add it
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${TAS_CHAIN_CHAIN_ID.toString(16)}` }],
        });
      } catch (switchError: any) {
        // If chain is not added, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${TAS_CHAIN_CHAIN_ID.toString(16)}`,
                chainName: 'TAS Chain',
                nativeCurrency: {
                  name: 'TAS',
                  symbol: 'TAS',
                  decimals: 18,
                },
                rpcUrls: [TAS_CHAIN_RPC_URL],
                blockExplorerUrls: [TAS_CHAIN_EXPLORER_URL],
              },
            ],
          });
        }
      }
      
      return { account: accounts[0], connected: true };
    } catch (error) {
      console.error('Error connecting to TAS Chain:', error);
      return { account: null, connected: false, error };
    }
  } else {
    console.error('No ethereum wallet detected');
    return { account: null, connected: false, error: new Error('No ethereum wallet detected') };
  }
};

// Format hash for display
export const formatTransactionHash = (hash: string) => {
  return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
};

// Get Explorer URL for transaction
export const getExplorerTxUrl = (txHash: string) => {
  return `${TAS_CHAIN_EXPLORER_URL}/tx/${txHash}`;
};

// Get Explorer URL for address
export const getExplorerAddressUrl = (address: string) => {
  return `${TAS_CHAIN_EXPLORER_URL}/address/${address}`;
};

// Get Explorer URL for token
export const getExplorerTokenUrl = (address: string) => {
  return `${TAS_CHAIN_EXPLORER_URL}/token/${address}`;
};

// Create new token on TAS Chain using TokenFactory
export const createToken = async (
  signer: ethers.Signer,
  name: string,
  symbol: string,
  initialSupply: string,
  logo: string,
  category: string
) => {
  try {
    const contract = getTokenFactoryContract(signer.provider!).connect(signer);
    
    // Parse the supply to a BigNumber with 18 decimals
    const supplyValue = parseUnits(initialSupply, 18);
    
    // Call the createToken function from our TokenFactory contract
    const tx = await contract.createToken(
      name, 
      symbol, 
      supplyValue, 
      logo,
      category
    );
    
    const receipt = await tx.wait();
    
    // Find the TokenCreated event to get the token address
    const events = receipt.logs.filter((log: any) => {
      try {
        const parsedLog = contract.interface.parseLog(log);
        return parsedLog && parsedLog.name === 'TokenCreated';
      } catch (e) {
        return false;
      }
    });
    
    let tokenAddress;
    
    if (events.length > 0) {
      // Get token address from event
      const parsedLog = contract.interface.parseLog(events[0]);
      tokenAddress = parsedLog.args.tokenAddress;
    } else {
      console.error('TokenCreated event not found');
      throw new Error('Token creation failed: event not found');
    }
    
    return {
      success: true,
      tokenAddress,
      transactionHash: receipt.hash,
    };
  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
};

// Get tokens by category
export const getTokensByCategory = async (
  provider: ethers.Provider,
  category: string
) => {
  try {
    const contract = getTokenFactoryContract(provider);
    const tokenIds = await contract.getTokensByCategory(category);
    
    const tokens = [];
    for (const id of tokenIds) {
      const tokenInfo = await contract.tokens(id);
      tokens.push({
        id: id.toString(),
        address: tokenInfo.tokenAddress,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        initialSupply: tokenInfo.initialSupply.toString(),
        creator: tokenInfo.creator,
        creationTime: new Date(tokenInfo.creationTime * 1000).toISOString(),
        logo: tokenInfo.logo,
        category: tokenInfo.category,
        liquidityReleased: tokenInfo.liquidityReleased
      });
    }
    
    return tokens;
  } catch (error) {
    console.error('Error getting tokens by category:', error);
    throw error;
  }
};

// Create swap request
export const createSwapRequest = async (
  signer: ethers.Signer,
  tokenOffered: string,
  amountOffered: string,
  tokenRequested: string,
  amountRequested: string,
  durationHours: number
) => {
  try {
    const contract = getSwapMarketContract(signer.provider!).connect(signer);
    
    // Parse the amounts to BigNumbers with 18 decimals
    const offeredAmount = parseUnits(amountOffered, 18);
    const requestedAmount = parseUnits(amountRequested, 18);
    
    // Convert hours to seconds for duration
    const durationSeconds = durationHours * 60 * 60;
    
    // Create the swap request
    const tx = await contract.createSwapRequest(
      tokenOffered,
      offeredAmount,
      tokenRequested,
      requestedAmount,
      durationSeconds
    );
    
    const receipt = await tx.wait();
    
    // Find the SwapRequested event to get the request ID
    const events = receipt.logs.filter((log: any) => {
      try {
        const parsedLog = contract.interface.parseLog(log);
        return parsedLog && parsedLog.name === 'SwapRequested';
      } catch (e) {
        return false;
      }
    });
    
    let requestId;
    
    if (events.length > 0) {
      // Get request ID from event
      const parsedLog = contract.interface.parseLog(events[0]);
      requestId = parsedLog.args.requestId;
    } else {
      console.error('SwapRequested event not found');
      throw new Error('Swap request creation failed: event not found');
    }
    
    return {
      success: true,
      requestId: requestId.toString(),
      transactionHash: receipt.hash,
    };
  } catch (error) {
    console.error('Error creating swap request:', error);
    throw error;
  }
};