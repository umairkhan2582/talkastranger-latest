import { useState, useEffect } from 'react';
import { useTASChain } from '@/contexts/TASChainContext';
import { getProvider } from '@/lib/tasChain';
import { ethers } from 'ethers';

interface TokenHolder {
  address: string;
  balance: string;
  percentage: number;
  isDeveloper?: boolean;
}

interface TokenDetails {
  name: string;
  symbol: string;
  totalSupply: string;
  creator: string;
  holders: TokenHolder[];
  currentPrice: number;
  highestPrice: number;
  maxCap: number;
  capPercentage: number;
  isLoading: boolean;
  error: string | null;
}

// Simplified ABI for TASToken with bonding curve
const TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function currentPrice() view returns (uint256)',
  'function highestPriceReached() view returns (uint256)',
  'function PRICE_CAP() view returns (uint256)',
  'function capPercentageReached() view returns (uint256)',
  'function creator() view returns (address)',
  'function getAllHolders() view returns (address[])',
  'function getHolderPercentage(address holder) view returns (uint256)',
];

export const useTokenDetails = (tokenAddress: string): TokenDetails => {
  const { provider, address } = useTASChain();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<Omit<TokenDetails, 'isLoading' | 'error'>>({
    name: '',
    symbol: '',
    totalSupply: '0',
    creator: '',
    holders: [],
    currentPrice: 0,
    highestPrice: 0,
    maxCap: 15000, // Default max cap $15k
    capPercentage: 0,
  });

  useEffect(() => {
    const fetchTokenDetails = async () => {
      if (!tokenAddress) return;
      
      setIsLoading(true);
      setError(null);

      try {
        // Use the provider from context or create a new one
        const tokenProvider = provider || getProvider();
        const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, tokenProvider);

        // Fetch basic token info
        const [
          name, 
          symbol, 
          totalSupply, 
          creator, 
          currentPrice,
          highestPrice,
          maxCap,
          capPercentage,
          holderAddresses
        ] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.totalSupply(),
          tokenContract.creator(),
          tokenContract.currentPrice(),
          tokenContract.highestPriceReached(),
          tokenContract.PRICE_CAP(),
          tokenContract.capPercentageReached(),
          tokenContract.getAllHolders(),
        ]);

        // Fetch holder balances and percentages
        const holdersPromises = holderAddresses.map(async (holderAddress: string) => {
          const balance = await tokenContract.balanceOf(holderAddress);
          const percentage = await tokenContract.getHolderPercentage(holderAddress);
          
          return {
            address: holderAddress,
            balance: ethers.formatEther(balance),
            percentage: Number(percentage) / 100, // Convert from basis points to percentage
            isDeveloper: holderAddress.toLowerCase() === creator.toLowerCase(),
          };
        });

        const holders = await Promise.all(holdersPromises);

        setDetails({
          name,
          symbol,
          totalSupply: ethers.formatEther(totalSupply),
          creator,
          holders,
          currentPrice: Number(ethers.formatEther(currentPrice)),
          highestPrice: Number(ethers.formatEther(highestPrice)),
          maxCap: Number(ethers.formatEther(maxCap)),
          capPercentage: Number(capPercentage),
        });
      } catch (err) {
        console.error('Error fetching token details:', err);
        setError('Failed to load token details. Please try again later.');
        
        // For development/demonstration purposes
        setDetails({
          name: 'Demo Token',
          symbol: 'DEMO',
          totalSupply: '1000000',
          creator: '0x1234567890abcdef1234567890abcdef12345678',
          holders: [
            {
              address: '0x1234567890abcdef1234567890abcdef12345678',
              balance: '500000',
              percentage: 50,
              isDeveloper: true,
            },
            {
              address: '0xabcdef1234567890abcdef1234567890abcdef12',
              balance: '300000',
              percentage: 30,
              isDeveloper: false,
            },
            {
              address: '0x7890abcdef1234567890abcdef1234567890abcd',
              balance: '200000',
              percentage: 20,
              isDeveloper: false,
            },
          ],
          currentPrice: 5000, // $5000
          highestPrice: 7500, // $7500
          maxCap: 15000, // $15000
          capPercentage: 33, // 33%
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenDetails();
  }, [tokenAddress, provider, address]);

  return {
    ...details,
    isLoading,
    error,
  };
};