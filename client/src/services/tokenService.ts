import { getTokenFactoryContract, getProvider } from '@/lib/tasChain';
import { ethers } from 'ethers';

interface TokenInfo {
  id: number;
  address: string;
  name: string;
  symbol: string;
  initialSupply: string;
  creator: string;
  creationTime: string;
  logo: string;
  category: string;
  liquidityReleased: boolean;
}

/**
 * Fetch tokens created using the TokenFactory contract
 */
export const fetchCreatedTokens = async (): Promise<TokenInfo[]> => {
  try {
    // Get the provider and connect to the TokenFactory contract
    const provider = getProvider();
    const tokenFactoryContract = getTokenFactoryContract(provider);
    
    // Get token count from the contract
    const tokenCount = await tokenFactoryContract.getTokenCount();
    const count = parseInt(tokenCount.toString());
    
    if (count === 0) {
      return [];
    }
    
    const tokens: TokenInfo[] = [];
    
    // Fetch information for each token
    for (let i = 0; i < count; i++) {
      try {
        const tokenInfo = await tokenFactoryContract.tokens(i);
        
        // Format creation time
        const creationDate = new Date(Number(tokenInfo.creationTime) * 1000);
        const formattedDate = creationDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        
        tokens.push({
          id: i,
          address: tokenInfo.tokenAddress,
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          initialSupply: ethers.formatUnits(tokenInfo.initialSupply, 18),
          creator: tokenInfo.creator,
          creationTime: formattedDate,
          logo: tokenInfo.logo,
          category: tokenInfo.category,
          liquidityReleased: tokenInfo.liquidityReleased
        });
      } catch (error) {
        console.error(`Error fetching token with ID ${i}:`, error);
      }
    }
    
    return tokens;
  } catch (error) {
    console.error('Error fetching created tokens:', error);
    return [];
  }
};

/**
 * Fetch tokens by category
 */
export const fetchTokensByCategory = async (category: string): Promise<TokenInfo[]> => {
  try {
    const provider = getProvider();
    const tokenFactoryContract = getTokenFactoryContract(provider);
    
    // Get token IDs for the specified category
    const tokenIds = await tokenFactoryContract.getTokensByCategory(category);
    
    if (tokenIds.length === 0) {
      return [];
    }
    
    const tokens: TokenInfo[] = [];
    
    // Fetch information for each token in the category
    for (const id of tokenIds) {
      try {
        const tokenId = parseInt(id.toString());
        const tokenInfo = await tokenFactoryContract.tokens(tokenId);
        
        // Format creation time
        const creationDate = new Date(Number(tokenInfo.creationTime) * 1000);
        const formattedDate = creationDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        
        tokens.push({
          id: tokenId,
          address: tokenInfo.tokenAddress,
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          initialSupply: ethers.formatUnits(tokenInfo.initialSupply, 18),
          creator: tokenInfo.creator,
          creationTime: formattedDate,
          logo: tokenInfo.logo,
          category: tokenInfo.category,
          liquidityReleased: tokenInfo.liquidityReleased
        });
      } catch (error) {
        console.error(`Error fetching token with ID ${id}:`, error);
      }
    }
    
    return tokens;
  } catch (error) {
    console.error(`Error fetching tokens for category ${category}:`, error);
    return [];
  }
};

/**
 * Get available token categories
 */
export const fetchTokenCategories = async (): Promise<string[]> => {
  try {
    const provider = getProvider();
    const tokenFactoryContract = getTokenFactoryContract(provider);
    
    // Get category count
    const categoryCount = await tokenFactoryContract.getCategoryCount();
    const count = parseInt(categoryCount.toString());
    
    if (count === 0) {
      return ['Social', 'Meme', 'Gaming', 'DeFi']; // Default categories if none found
    }
    
    const categories: string[] = [];
    
    // Fetch each category
    for (let i = 0; i < count; i++) {
      try {
        const category = await tokenFactoryContract.categories(i);
        categories.push(category);
      } catch (error) {
        console.error(`Error fetching category with ID ${i}:`, error);
      }
    }
    
    return categories;
  } catch (error) {
    console.error('Error fetching token categories:', error);
    return ['Social', 'Meme', 'Gaming', 'DeFi']; // Default categories if error
  }
};