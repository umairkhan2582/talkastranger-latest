import { Router, Request, Response } from 'express';
import { blockchainListener } from './services/blockchainListener';
import { priceOracle } from './services/priceOracle';
import { getTokenBalances, getTokenTransactions, getTokenApprovals, sendToken, getBNBBalance } from './services/bscscanService';
import ethers from 'ethers';
import axios from 'axios';

const router = Router();

// API endpoint to check blockchain connection status
router.get('/api/blockchain/status', (req: Request, res: Response) => {
  try {
    // In a real implementation, this would check actual blockchain status
    const status = {
      connected: true,
      contractAddress: '0xd9541b134b1821736bd323135b8844d3ae408216',
      network: 'BSC Testnet',
      lastUpdate: new Date().toISOString()
    };
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('[API] Error getting blockchain status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get blockchain status'
    });
  }
});

// Admin endpoint to trigger a mock transaction event (for demo purposes)
router.post('/api/blockchain/mockEvent', (req: Request, res: Response) => {
  try {
    const { eventType, params } = req.body;
    
    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: 'Event type is required'
      });
    }
    
    let result;
    
    if (eventType === 'transfer') {
      result = blockchainListener.generateMockTradeEvent(
        params?.type || 'buy',
        params?.amount || 10000
      );
      
      // Also trigger a price update since transfers affect price
      priceOracle.forceUpdate();
    } else if (eventType === 'holders') {
      // Import accurate holder data from our module
      const { generateHolderData } = require('../temp/holderData');
      result = generateHolderData();
    } else if (eventType === 'trades') {
      // Generate trade history
      const trades = blockchainListener.generateTradeHistory();
      // Format trade data for consistency
      result = trades.map(trade => ({
        ...trade,
        date: new Date(trade.timestamp).toISOString(),
        timestamp: trade.timestamp,
        amountUsd: (trade.amount * trade.price).toFixed(2),
        symbol: 'TASnative'
      }));
    } else if (eventType === 'all') {
      // Generate all data using accurate holder data
      const { generateHolderData } = require('../temp/holderData');
      const holders = generateHolderData();
      const trades = blockchainListener.generateTradeHistory();
      // Format trade data
      const formattedTrades = trades.map(trade => ({
        ...trade,
        date: new Date(trade.timestamp).toISOString(),
        timestamp: trade.timestamp,
        amountUsd: (trade.amount * trade.price).toFixed(2),
        symbol: 'TASnative'
      }));
      // Trigger price update
      priceOracle.forceUpdate();
      
      result = {
        holders: holders.length,
        trades: formattedTrades.length
      };
    }
    
    res.json({
      success: true,
      message: `Mock ${eventType} event triggered`,
      result
    });
  } catch (error) {
    console.error('[API] Error triggering mock blockchain event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger mock blockchain event'
    });
  }
});

// API endpoints for token data
router.get('/api/blockchain/holders', (_req: Request, res: Response) => {
  try {
    // Import from the new module with actual holder data
    const { generateHolderData } = require('../temp/holderData');
    const holders = generateHolderData();
    
    res.json({
      success: true,
      data: {
        holders,
        totalHolders: holders.length, 
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('[API] Error getting token holders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token holders'
    });
  }
});

router.get('/api/blockchain/trades', (_req: Request, res: Response) => {
  try {
    // Generate fresh trade data
    const trades = blockchainListener.generateTradeHistory();
    
    // Format the trades with proper date formatting
    const formattedTrades = trades.map(trade => ({
      ...trade,
      // Format date string for consistency
      date: new Date(trade.timestamp).toISOString(),
      // Keep timestamp for backward compatibility
      timestamp: trade.timestamp,
      // Add formatted amount in USD
      amountUsd: (trade.amount * trade.price).toFixed(2),
      // Add TAS symbol 
      symbol: 'TASnative'
    }));
    
    res.json({
      success: true,
      data: {
        trades: formattedTrades,
        totalTrades: formattedTrades.length,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('[API] Error getting token trades:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token trades'
    });
  }
});

// Wallet-related API endpoints
// Get wallet balances for a specific address
router.get('/api/wallet/balances', async (req: Request, res: Response) => {
  try {
    const address = req.query.address as string || '0xd9541b134b1821736bd323135b8844d3ae408216';
    
    console.log(`[API] Fetching wallet balances for address: ${address}`);
    
    // Get BNB balance from BSCScan
    const bnbBalance = await getBNBBalance(address);
    console.log(`[API] BNB balance from BSCScan:`, bnbBalance);
    
    // Get token balances from BSCScan
    const tokenBalances = await getTokenBalances(address);
    console.log(`[API] Raw token balances from BSCScan:`, tokenBalances);
    
    // Format balances into the expected format
    const balances: Record<string, string> = {};
    
    // Add BNB balance to the balances object
    balances['BNB'] = bnbBalance.formattedBalance || '0';
    console.log(`[API] Formatted balance for BNB: ${bnbBalance.formattedBalance || '0'}`);
    
    // Filter out duplicate TAS tokens (same address with different case)
    const uniqueTokenBalances = tokenBalances.filter((token, index, self) => {
      // Keep only the first occurrence with a given lowercase address
      const lowerAddress = token.tokenAddress.toLowerCase();
      return index === self.findIndex(t => t.tokenAddress.toLowerCase() === lowerAddress);
    });
    
    // Process each unique token balance
    for (const token of uniqueTokenBalances) {
      // Convert balance to proper format with decimals
      const formattedBalance = ethers.utils.formatUnits(token.balance, parseInt(token.decimals));
      balances[token.tokenAddress] = formattedBalance;
      balances[token.symbol] = formattedBalance; // Also add by symbol for easier access
      console.log(`[API] Formatted balance for ${token.symbol}: ${formattedBalance}`);
    }
    
    // Always ensure TAS token is included (even with zero balance)
    if (!balances['0xd9541b134b1821736bd323135b8844d3ae408216']) {
      balances['0xd9541b134b1821736bd323135b8844d3ae408216'] = '0';
      balances['TAS'] = '0';
      console.log(`[API] Adding default TAS token with zero balance`);
    }
    
    // Enhanced token data with additional fields
    const enhancedTokenData = [
      // Add BNB as a token entry
      {
        tokenAddress: 'native',  // Special marker for native token
        symbol: 'BNB',
        name: 'Binance Coin',
        balance: bnbBalance.balance || '0',
        decimals: '18',
        formattedBalance: bnbBalance.formattedBalance || '0',
        price: 350, // Approximate BNB price, ideally should be fetched from a price API
        isNative: true
      },
      // Add other tokens
      ...uniqueTokenBalances.map(token => {
        // Format the balance for display convenience
        const formattedBalance = ethers.utils.formatUnits(token.balance, parseInt(token.decimals));
        
        // Get token price (TAS = 0.001, others are currently unknown)
        let price = null;
        if (token.symbol === 'TAS') {
          price = 0.001; // TAS token price from price oracle
        }
        
        return {
          ...token,
          formattedBalance,
          price
        };
      })
    ];
    
    res.json({
      success: true,
      address,
      balances,
      // Include enhanced token data with prices and formatted balances
      tokenData: enhancedTokenData
    });
  } catch (error) {
    console.error('[API] Error getting wallet balances:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet balances'
    });
  }
});

// Get wallet transaction history
router.get('/api/wallet/transactions', async (req: Request, res: Response) => {
  try {
    const address = req.query.address as string || '0xd9541b134b1821736bd323135b8844d3ae408216';
    
    // Get ERC20 token transactions from BSCScan
    const bscTokenTransactions = await getTokenTransactions(address);
    
    // Format token transactions for our frontend
    const tokenTransactions = bscTokenTransactions.map(tx => {
      // Determine transaction type based on direction
      const type = tx.from.toLowerCase() === address.toLowerCase() ? 'send' : 'receive';
      
      // Convert from wei to token units using token decimals
      const amount = ethers.utils.formatUnits(tx.value, parseInt(tx.tokenDecimal));
      
      // Standardize TAS token name
      let tokenName = tx.tokenName;
      if (tx.tokenSymbol === 'TAS' && (tokenName === 'TASChain Token' || tokenName.includes('TAS'))) {
        tokenName = 'TAS Token';
      }
      
      // Enhanced transaction object with more information
      return {
        hash: tx.hash,
        tokenAddress: tx.contractAddress,
        tokenSymbol: tx.tokenSymbol,
        tokenName: tokenName,
        amount,
        from: tx.from,
        to: tx.to,
        timestamp: parseInt(tx.timeStamp),
        type, // 'send' or 'receive'
        blockNumber: tx.blockNumber,
        confirmations: tx.confirmations,
        status: 'completed' // All transactions from BSCScan are confirmed
      };
    });
    
    // Get BNB transactions
    let bnbTransactions = [];
    try {
      if (process.env.BSC_SCAN_API_KEY || process.env.BSCSCAN_API_KEY) {
        const apiKey = process.env.BSC_SCAN_API_KEY || process.env.BSCSCAN_API_KEY;
        
        // Fetch normal transactions (for BNB transfers)
        const response = await axios.get('https://api.bscscan.com/api', {
          params: {
            module: 'account',
            action: 'txlist',
            address,
            sort: 'desc',
            apikey: apiKey
          }
        });
        
        if (response.data.status === '1' && Array.isArray(response.data.result)) {
          // Filter for successful BNB transfers (value > 0, no contract interaction)
          bnbTransactions = response.data.result
            .filter((tx: any) => 
              tx.isError === '0' && 
              tx.value !== '0' && 
              (tx.input === '0x' || tx.input === '')
            )
            .map((tx: any) => {
              // Determine transaction type based on direction
              const type = tx.from.toLowerCase() === address.toLowerCase() ? 'send' : 'receive';
              
              // Format BNB amount
              const amount = ethers.utils.formatEther(tx.value);
              
              return {
                hash: tx.hash,
                tokenAddress: 'native', // Special marker for native BNB
                tokenSymbol: 'BNB',
                tokenName: 'Binance Coin',
                amount,
                from: tx.from,
                to: tx.to,
                timestamp: parseInt(tx.timeStamp),
                type,
                blockNumber: tx.blockNumber,
                confirmations: tx.confirmations
              };
            });
            
          console.log(`[API] Found ${bnbTransactions.length} BNB transactions for address ${address}`);
        }
      }
    } catch (bnbError) {
      console.error('[API] Error fetching BNB transactions:', bnbError);
      // Continue with token transactions even if BNB transactions fail
    }
    
    // Combine both transaction types
    const allTransactions = [...tokenTransactions, ...bnbTransactions];
    
    // Sort by timestamp (newest first)
    allTransactions.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    
    res.json({
      success: true,
      address,
      transactions: allTransactions
    });
  } catch (error) {
    console.error('[API] Error getting wallet transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet transactions'
    });
  }
});

// Get token approvals
router.get('/api/wallet/approvals', async (req: Request, res: Response) => {
  try {
    const address = req.query.address as string || '0xd9541b134b1821736bd323135b8844d3ae408216';
    
    // Get approvals from BSCScan
    const approvals = await getTokenApprovals(address);
    
    res.json({
      success: true,
      address,
      approvals
    });
  } catch (error) {
    console.error('[API] Error getting token approvals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token approvals'
    });
  }
});

// API endpoint to send tokens
router.post('/api/wallet/send', async (req: Request, res: Response) => {
  try {
    const { 
      fromAddress, 
      toAddress, 
      amount, 
      tokenAddress = '0xd9541b134b1821736bd323135b8844d3ae408216', // Default to TAS token
      privateKey 
    } = req.body;
    
    // Validate required fields
    if (!fromAddress || !toAddress || !amount || !privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fromAddress, toAddress, amount, privateKey'
      });
    }
    
    // Format private key properly if needed
    let formattedPrivateKey = privateKey;
    
    // Add 0x prefix if missing but the key is otherwise valid
    if (!formattedPrivateKey.startsWith('0x') && formattedPrivateKey.length === 64) {
      console.log('[API] Adding 0x prefix to private key');
      formattedPrivateKey = '0x' + formattedPrivateKey;
    }
    
    // Validate private key format
    if (!formattedPrivateKey.startsWith('0x')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid private key format. Private key must start with 0x.'
      });
    }
    
    if (formattedPrivateKey.length !== 66) { // 0x + 64 characters
      return res.status(400).json({
        success: false,
        error: `Invalid private key length. Expected 66 characters (including 0x), got ${formattedPrivateKey.length}.`
      });
    }
    
    // Convert amount to proper format for the blockchain
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }
    
    console.log(`[API] Processing token transfer request: ${fromAddress} -> ${toAddress} (${amount} tokens)`);
    
    try {
      // Call the token send function from bscscanService with the formatted private key
      const result = await sendToken(fromAddress, toAddress, parsedAmount, tokenAddress, formattedPrivateKey);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error || 'Transaction failed'
        });
      }
      
      res.json({
        success: true,
        message: 'Token transfer completed',
        transactionHash: result.transactionHash,
        fromAddress,
        toAddress,
        amount: parsedAmount,
        tokenAddress
      });
    } catch (txError) {
      console.error('[API] Transaction error:', txError);
      return res.status(400).json({
        success: false,
        error: txError instanceof Error ? txError.message : 'Transaction failed'
      });
    }
  } catch (error) {
    console.error('[API] Error sending tokens:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send tokens'
    });
  }
});

export default router;