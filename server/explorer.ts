import express, { Request, Response } from "express";
import axios from "axios";
import { ethers } from "ethers";
import { NETWORK_CONFIG, CONTRACT_ADDRESSES } from "../client/src/lib/contract-addresses";
import TASTokenABI from "../contracts/artifacts/contracts/src/TASToken.sol/TASToken.json";

// Create router
const router = express.Router();

// BSC API settings - using public API endpoint 
// Note: We still use the BSC API under the hood, but all links in the UI point to TASonscan
const BSC_API_URL = "https://api.bscscan.com/api";
// Try both environment variable names for the API key
const BSC_API_KEY = process.env.BSCSCAN_API_KEY || process.env.BSC_SCAN_API_KEY || "";

// Log API key status (without exposing the key)
console.log(`[Explorer] BSCScan API Key present: ${Boolean(BSC_API_KEY)}`);

// If we don't have a key, warn about rate limiting
if (!BSC_API_KEY) {
  console.warn("[Explorer] No BSCScan API key provided. API requests may be rate-limited.");
}

// Provider for blockchain connection
const provider = new ethers.providers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);

// TAS Token contract
const tasTokenContract = new ethers.Contract(
  CONTRACT_ADDRESSES.TAS_TOKEN,
  TASTokenABI.abi,
  provider
);

// Get latest blocks
router.get("/blocks", async (req: Request, res: Response) => {
  try {
    // Get the latest block number
    const latestBlockNumber = await provider.getBlockNumber();
    
    // Fetch last 10 blocks
    const blockPromises = [];
    for (let i = 0; i < 10; i++) {
      if (latestBlockNumber - i >= 0) {
        blockPromises.push(provider.getBlock(latestBlockNumber - i));
      }
    }
    
    const blocks = await Promise.all(blockPromises);
    
    res.status(200).json({
      status: "1",
      message: "OK",
      result: blocks
    });
  } catch (error) {
    console.error("Error fetching blocks:", error);
    res.status(500).json({
      status: "0",
      message: "Error fetching blocks",
      result: []
    });
  }
});

// Get latest transactions
router.get("/transactions", async (req: Request, res: Response) => {
  try {
    // Get the latest block
    const latestBlock = await provider.getBlock("latest");
    
    if (!latestBlock || !latestBlock.transactions || latestBlock.transactions.length === 0) {
      return res.status(200).json({
        status: "1",
        message: "No transactions found",
        result: []
      });
    }
    
    // Get the 10 most recent transaction hashes
    const transactionHashes = latestBlock.transactions.slice(0, 10);
    
    // Fetch full transaction data
    const transactionPromises = transactionHashes.map(hash => provider.getTransaction(hash));
    let transactions = await Promise.all(transactionPromises);
    
    // Add receipt data to get status
    const receiptPromises = transactionHashes.map(hash => provider.getTransactionReceipt(hash));
    const receipts = await Promise.all(receiptPromises);
    
    // Combine transaction data with receipt data
    transactions = transactions.map((tx, index) => {
      return {
        ...tx,
        status: receipts[index]?.status,
        gasUsed: receipts[index]?.gasUsed.toString(),
        timeStamp: latestBlock.timestamp
      };
    });
    
    res.status(200).json({
      status: "1",
      message: "OK",
      result: transactions
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      status: "0",
      message: "Error fetching transactions",
      result: []
    });
  }
});

// Get address details
router.get("/address/:address", async (req: Request, res: Response) => {
  try {
    let { address } = req.params;
    
    // Normalize the address
    if (!address || address.toLowerCase() === 'undefined' || address.toLowerCase() === 'null') {
      console.warn(`Invalid address value received: ${address}`);
      return res.status(400).json({
        status: "0",
        message: "Invalid address value. Please provide a valid Ethereum address.",
        result: null
      });
    }
    
    // Remove any extra characters like hashes that might be in the URL
    address = address.split('#')[0];
    address = address.split('?')[0];
    
    // Try to clean up address further in case additional invalid chars
    try {
      // Ensure we have a valid format: 0x followed by 40 hex chars
      const addressMatch = address.match(/(0x[a-fA-F0-9]{40})/);
      if (addressMatch && addressMatch[1]) {
        address = addressMatch[1];
      }
    } catch (e) {
      console.warn(`Error cleaning address: ${e}`);
      // Continue with original address if cleaning fails
    }
    
    // Check if valid Ethereum address
    if (!ethers.utils.isAddress(address)) {
      console.warn(`Invalid address format received: ${address}`);
      return res.status(400).json({
        status: "0",
        message: `Invalid address format: ${address}. Please provide a valid Ethereum address starting with 0x followed by 40 hex characters.`,
        result: null
      });
    }
    
    // Checksum the address for consistency
    address = ethers.utils.getAddress(address);
    
    console.log(`Fetching details for address: ${address}`);
    
    // Fetch basic info in parallel with error handling
    const [balance, code, tasBalance, blockNumber] = await Promise.all([
      provider.getBalance(address).catch((e: any) => {
        console.error(`Failed to get balance for ${address}:`, e);
        return ethers.BigNumber.from(0);
      }),
      provider.getCode(address).catch((e: any) => {
        console.error(`Failed to get code for ${address}:`, e);
        return "0x";
      }),
      tasTokenContract.balanceOf(address).catch((e: any) => {
        console.error(`Failed to get TAS balance for ${address}:`, e);
        return ethers.BigNumber.from(0);
      }),
      provider.getBlockNumber().catch((e: any) => {
        console.error("Failed to get block number:", e);
        return 0;
      })
    ]);
    
    // Check if this is a contract
    const isContract = code !== "0x";
    
    // If BscScan API key is available, fetch more detailed info
    let transactions: any[] = [];
    let tokens: {
      name: string;
      symbol: string;
      contractAddress: string;
      balance: string;
    }[] = [];
    
    if (BSC_API_KEY) {
      try {
        console.log(`Fetching transactions for address ${address} using BSCScan API key`);
        
        // Get transactions
        const txListResponse = await axios.get(BSC_API_URL, {
          params: {
            module: "account",
            action: "txlist",
            address,
            startblock: 0,
            endblock: blockNumber,
            page: 1,
            offset: 10,
            sort: "desc",
            apikey: BSC_API_KEY
          }
        });
        
        console.log(`BSCScan txlist response status: ${txListResponse.data.status}, message: ${txListResponse.data.message}`);
        
        if (txListResponse.data.status === "1") {
          transactions = txListResponse.data.result;
        } else {
          console.warn(`BSCScan API returned error for transactions: ${txListResponse.data.message}`);
        }
        
        // Get BEP-20 tokens balance
        const tokenBalanceResponse = await axios.get(BSC_API_URL, {
          params: {
            module: "account",
            action: "tokenbalance",
            contractaddress: CONTRACT_ADDRESSES.TAS_TOKEN,
            address,
            tag: "latest",
            apikey: BSC_API_KEY
          }
        });
        
        console.log(`BSCScan token balance response status: ${tokenBalanceResponse.data.status}, message: ${tokenBalanceResponse.data.message}`);
        
        if (tokenBalanceResponse.data.status === "1") {
          tokens = [{
            name: "TASChain Token",
            symbol: "TAS",
            contractAddress: CONTRACT_ADDRESSES.TAS_TOKEN,
            balance: ethers.utils.formatUnits(tokenBalanceResponse.data.result, 18)
          }];
        } else {
          console.warn(`BSCScan API returned error for token balance: ${tokenBalanceResponse.data.message}`);
          // Fallback to contract call for TAS token
          tokens = [{
            name: "TASChain Token",
            symbol: "TAS",
            contractAddress: CONTRACT_ADDRESSES.TAS_TOKEN,
            balance: ethers.utils.formatUnits(tasBalance, 18)
          }];
        }
      } catch (apiError) {
        console.error("BSCScan API error:", apiError);
        // Fallback to basic information
        tokens = [{
          name: "TASChain Token",
          symbol: "TAS",
          contractAddress: CONTRACT_ADDRESSES.TAS_TOKEN,
          balance: ethers.utils.formatUnits(tasBalance, 18)
        }];
      }
    } else {
      // If no BSC API key, at least add TAS token based on contract call
      tokens = [{
        name: "TASChain Token",
        symbol: "TAS",
        contractAddress: CONTRACT_ADDRESSES.TAS_TOKEN,
        balance: ethers.utils.formatUnits(tasBalance, 18)
      }];
    }
    
    res.status(200).json({
      status: "1",
      message: "OK",
      result: {
        address,
        balance: ethers.utils.formatEther(balance),
        tasBalance: ethers.utils.formatUnits(tasBalance, 18),
        isContract,
        txCount: transactions.length,
        tokenCount: tokens.length,
        transactions,
        tokens
      }
    });
  } catch (error) {
    console.error("Error fetching address details:", error);
    res.status(500).json({
      status: "0",
      message: "Error fetching address details",
      result: null
    });
  }
});

// Get token list
router.get("/tokens", async (req: Request, res: Response) => {
  try {
    // Import storage from outside the route handler to avoid circular dependencies
    const { storage } = await import("./storage");
    
    // Get all tokens from database
    const databaseTokens = await storage.getAllTokens();
    
    // Format tokens for the response
    const formattedTokens = databaseTokens.map(token => ({
      name: token.name,
      symbol: token.symbol,
      contractAddress: token.contractAddress || "",
      creator: "TAS User",  // Default to TAS User since creator isn't in the schema
      creationTime: token.createdAt ? new Date(token.createdAt).toLocaleString() : "-",
      network: token.network || "BSC"
    }));
    
    // If TAS token isn't in the DB, add it
    const hasTasToken = formattedTokens.some(token => 
      token.contractAddress && token.contractAddress.toLowerCase() === CONTRACT_ADDRESSES.TAS_TOKEN.toLowerCase()
    );
    
    if (!hasTasToken) {
      formattedTokens.unshift({
        name: "TASChain Token",
        symbol: "TAS",
        contractAddress: CONTRACT_ADDRESSES.TAS_TOKEN,
        creator: "TAS Team",
        creationTime: "-",
        network: "BSC"
      });
    }
    
    res.status(200).json({
      status: "1",
      message: "OK",
      result: formattedTokens
    });
  } catch (error) {
    console.error("Error fetching token list:", error);
    res.status(500).json({
      status: "0",
      message: "Error fetching token list",
      result: []
    });
  }
});

// Export the router
export default router;