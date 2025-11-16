import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import { storage } from './storage';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// TAS token contract address
const TAS_TOKEN_ADDRESS = process.env.TAS_TOKEN_ADDRESS || '0xd9541b134b1821736bd323135b8844d3ae408216';

// Get all tokens for a wallet address
router.get('/api/wallet/tokens', async (req: Request, res: Response) => {
  try {
    const { address } = req.query;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address is required' 
      });
    }
    
    // Get TAS token info from storage
    const tasToken = await storage.getNativeToken();
    
    if (!tasToken) {
      return res.status(500).json({ 
        success: false, 
        error: 'Token information not available' 
      });
    }
    
    // For now, we'll check if there's a local user with this wallet address
    const user = await storage.getUserByWalletAddress(address);
    
    // Get token balance from blockchain
    // In a real implementation, you would call the token contract directly
    // For example: tasTokenContract.balanceOf(address)
    const tasBalance = user?.tasBalance || "0";
    
    // Format balance with commas
    const formattedBalance = Number(tasBalance).toLocaleString();
    
    // Other tokens the user has purchased
    const userTokens = user ? await storage.getUserTokens(user.id) : [];
    
    // Include the TAS native token
    const tokens = [
      {
        id: tasToken.id,
        name: tasToken.name,
        symbol: tasToken.symbol,
        balance: formattedBalance,
        price: tasToken.currentPrice,
        bgColor: "from-primary to-primary-dark",
        change: 0, // Could be calculated from price history
      },
      // Map other tokens
      ...userTokens.map(ut => {
        return {
          id: ut.tokenId,
          name: ut.tokenName || "Unknown Token",
          symbol: ut.tokenSymbol || "???",
          balance: Number(ut.balance).toLocaleString(),
          price: ut.tokenPrice || 0,
          bgColor: "from-yellow-400 to-orange-500", // Use different colors based on token type
          change: 0, // Would need to calculate from price history
        };
      })
    ];
    
    return res.status(200).json({
      success: true,
      tokens
    });
  } catch (error) {
    console.error("Error fetching wallet tokens:", error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch token data' 
    });
  }
});

// Get tokens created by a wallet address
router.get('/api/wallet/created-tokens', async (req: Request, res: Response) => {
  try {
    const { address } = req.query;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address is required' 
      });
    }
    
    // Check if there's a local user with this wallet address
    const user = await storage.getUserByWalletAddress(address);
    
    if (!user) {
      return res.status(200).json({
        success: true,
        tokens: []
      });
    }
    
    // Get tokens created by this user
    const createdTokens = await storage.getUserCreatedTokens(user.id);
    
    // Map to the expected format
    const tokens = createdTokens.map(token => {
      return {
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        balance: "1,000,000", // Creator usually has a significant balance
        price: token.initialPrice || 0.00001,
        bgColor: "from-emerald-400 to-teal-500", // Special color for created tokens
        change: 0, // Would need historical data
      };
    });
    
    return res.status(200).json({
      success: true,
      tokens
    });
  } catch (error) {
    console.error("Error fetching created tokens:", error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch token data' 
    });
  }
});

// Get transaction history for a wallet
router.get('/api/wallet/transactions', async (req: Request, res: Response) => {
  try {
    const { address, days } = req.query;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address is required' 
      });
    }
    
    // Parse days or default to 7
    const daysToShow = days ? parseInt(days as string) : 7;
    
    // Check if there's a local user with this wallet address
    const user = await storage.getUserByWalletAddress(address);
    
    // For now, generate transaction history based on registered swaps and token creations
    let transactions = [];
    
    if (user) {
      // Get BNB to TAS swaps
      const bnbToTasSwaps = await storage.getUserBnbToTasSwaps(user.id);
      
      // Map swaps to transaction format
      const swapTransactions = bnbToTasSwaps.map(swap => {
        return {
          type: 'buy',
          symbol: 'TAS',
          amount: ethers.utils.formatEther(swap.tasAmount),
          price: ethers.utils.formatEther(swap.bnbAmount),
          date: new Date(swap.createdAt).toLocaleString(),
          hash: swap.transactionHash,
        };
      });
      
      // Get token creation transactions
      const createdTokens = await storage.getUserCreatedTokens(user.id);
      
      // Map token creations to transaction format
      const tokenCreationTransactions = createdTokens.map(token => {
        return {
          type: 'create',
          symbol: token.symbol,
          amount: '1,000,000', // Typical initial supply
          price: `${token.creationFeeTas} TAS`,
          date: new Date(token.createdAt).toLocaleString(),
          hash: token.transactionHash,
        };
      });
      
      // Combine all transactions
      transactions = [...swapTransactions, ...tokenCreationTransactions];
      
      // Sort by date, most recent first
      transactions.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      // Filter to only show transactions from the specified number of days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToShow);
      
      transactions = transactions.filter(tx => {
        return new Date(tx.date) >= cutoffDate;
      });
    }
    
    return res.status(200).json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch transaction data' 
    });
  }
});

export default router;