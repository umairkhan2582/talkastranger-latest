import axios from 'axios';
import ethers from 'ethers';

const BSC_SCAN_API_KEY = process.env.BSC_SCAN_API_KEY || process.env.BSCSCAN_API_KEY;
const BSC_SCAN_API_URL = 'https://api.bscscan.com/api';
const BSC_NODE_URL = 'https://bsc-dataseed.binance.org/';

// Standard ERC20 Token ABI for transfer function
const ERC20_ABI = [
  // Transfer function
  "function transfer(address to, uint256 amount) returns (bool)",
  // Balance function
  "function balanceOf(address owner) view returns (uint256)",
  // Get decimals
  "function decimals() view returns (uint8)",
  // Get symbol
  "function symbol() view returns (string)",
  // Get name
  "function name() view returns (string)"
];

// Special flag for native BNB token
const NATIVE_BNB_ADDRESS = 'native';

// API interfaces
interface TokenBalance {
  tokenAddress: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: string;
  formattedBalance?: string;
  price?: number;
}

interface BNBBalance {
  address: string;
  balance: string;
  formattedBalance?: string;
  price?: number;
}

interface TokenTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

// Get token balances from BSCScan
export async function getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
  try {
    console.log('[BSCScan] Getting token balances for', walletAddress);
    
    // Ensure we always include TAS token
    const tasTokenAddress = '0xd9541b134b1821736bd323135b8844d3ae408216';
    let tasTokenInfo: TokenBalance = {
      tokenAddress: tasTokenAddress,
      symbol: 'TAS',
      name: 'Talk A Stranger', // Default name that will be updated from contract if possible
      balance: '0',
      decimals: '18'
    };
    
    if (!BSC_SCAN_API_KEY) {
      console.warn('[BSCScan] API key not found. Using minimal default data.');
      return [tasTokenInfo];
    }
    
    // Create a provider to interact with the blockchain directly
    const provider = new ethers.providers.JsonRpcProvider(BSC_NODE_URL);
    
    // First try to get TAS token info directly from contract
    try {
      // Create contract instance for TAS token
      const tasContract = new ethers.Contract(tasTokenAddress, ERC20_ABI, provider);
      
      // Get token name directly from contract
      try {
        const contractName = await tasContract.name();
        if (contractName) {
          console.log(`[BSCScan] Got TAS token name from contract: ${contractName}`);
          tasTokenInfo.name = contractName;
        }
      } catch (nameError) {
        console.warn('[BSCScan] Error getting TAS token name from contract:', nameError);
      }
      
      // Get token symbol from contract to ensure accuracy
      try {
        const contractSymbol = await tasContract.symbol();
        if (contractSymbol) {
          console.log(`[BSCScan] Got TAS token symbol from contract: ${contractSymbol}`);
          tasTokenInfo.symbol = contractSymbol;
        }
      } catch (symbolError) {
        console.warn('[BSCScan] Error getting TAS token symbol from contract:', symbolError);
      }
      
      // Get token balance for the wallet
      try {
        const balance = await tasContract.balanceOf(walletAddress);
        if (balance) {
          tasTokenInfo.balance = balance.toString();
          console.log(`[BSCScan] Got TAS balance from contract: ${tasTokenInfo.balance}`);
        }
      } catch (balanceError) {
        console.warn('[BSCScan] Error getting TAS token balance from contract:', balanceError);
        // If contract balance fails, we'll try the API below
      }
    } catch (e) {
      console.error('[BSCScan] Error initializing TAS token contract, falling back to API:', e);
    }
    
    // If we couldn't get balance from contract, fall back to BSCScan API
    if (tasTokenInfo.balance === '0') {
      try {
        const tokenBalanceResponse = await axios.get(BSC_SCAN_API_URL, {
          params: {
            module: 'account',
            action: 'tokenbalance',
            contractaddress: tasTokenAddress,
            address: walletAddress,
            tag: 'latest',
            apikey: BSC_SCAN_API_KEY
          }
        });
        
        if (tokenBalanceResponse.data.status === '1') {
          // Update TAS token balance if available
          tasTokenInfo.balance = tokenBalanceResponse.data.result;
          console.log(`[BSCScan] Got TAS balance from API: ${tasTokenInfo.balance}`);
        }
      } catch (apiError) {
        console.error('[BSCScan] Error getting direct token balance from API:', apiError);
      }
    }
    
    // Now get all token transactions to build the complete token list
    const response = await axios.get(BSC_SCAN_API_URL, {
      params: {
        module: 'account',
        action: 'tokentx',
        address: walletAddress,
        sort: 'desc',
        apikey: BSC_SCAN_API_KEY
      }
    });
    
    const balanceMap: {[key: string]: TokenBalance} = {
      // Always initialize with TAS token even if zero balance
      [tasTokenAddress.toLowerCase()]: tasTokenInfo
    };
    
    // Process transactions to calculate balances
    if (response.data.status === '1' && Array.isArray(response.data.result)) {
      for (const tx of response.data.result) {
        let { contractAddress, tokenSymbol, tokenName, tokenDecimal } = tx;
        const normalizedAddress = contractAddress.toLowerCase();
        
        // Skip processing if this is TAS token (we already have it from direct contract call)
        if (normalizedAddress === tasTokenAddress.toLowerCase() && balanceMap[normalizedAddress]) {
          continue;
        }
        
        // If this is a new token, add it to our map
        if (!balanceMap[normalizedAddress]) {
          // Try to get token info directly from contract
          try {
            const tokenContract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
            
            // Get contract name
            try {
              const contractName = await tokenContract.name();
              if (contractName) {
                tokenName = contractName;
                console.log(`[BSCScan] Got token name from contract: ${tokenName}`);
              }
            } catch (nameError) {
              console.warn(`[BSCScan] Error getting name for token ${contractAddress}:`, nameError);
            }
            
            // Get contract symbol
            try {
              const contractSymbol = await tokenContract.symbol();
              if (contractSymbol) {
                tokenSymbol = contractSymbol;
                console.log(`[BSCScan] Got token symbol from contract: ${tokenSymbol}`);
              }
            } catch (symbolError) {
              console.warn(`[BSCScan] Error getting symbol for token ${contractAddress}:`, symbolError);
            }
            
            // Get contract decimals
            try {
              const contractDecimals = await tokenContract.decimals();
              if (contractDecimals !== undefined) {
                tokenDecimal = contractDecimals.toString();
                console.log(`[BSCScan] Got token decimals from contract: ${tokenDecimal}`);
              }
            } catch (decimalsError) {
              console.warn(`[BSCScan] Error getting decimals for token ${contractAddress}:`, decimalsError);
            }
            
            // Get balance
            try {
              const balance = await tokenContract.balanceOf(walletAddress);
              if (balance) {
                // Add token to our map with the balance from contract
                balanceMap[normalizedAddress] = {
                  tokenAddress: contractAddress,
                  symbol: tokenSymbol,
                  name: tokenName,
                  balance: balance.toString(),
                  decimals: tokenDecimal
                };
                
                console.log(`[BSCScan] Got ${tokenSymbol} balance from contract: ${balance.toString()}`);
                continue; // Skip transaction processing for this token
              }
            } catch (balanceError) {
              console.warn(`[BSCScan] Error getting balance for token ${contractAddress}:`, balanceError);
            }
          } catch (contractError) {
            console.warn(`[BSCScan] Error interacting with token contract ${contractAddress}:`, contractError);
          }
          
          // Fall back to transaction data if contract calls failed
          balanceMap[normalizedAddress] = {
            tokenAddress: contractAddress,
            symbol: tokenSymbol,
            name: tokenName,
            balance: '0',
            decimals: tokenDecimal
          };
        }
        
        // Add or subtract based on transaction direction
        if (tx.to.toLowerCase() === walletAddress.toLowerCase()) {
          // Received tokens
          const currentBalance = BigInt(balanceMap[normalizedAddress].balance);
          const txAmount = BigInt(tx.value);
          balanceMap[normalizedAddress].balance = (currentBalance + txAmount).toString();
        } else if (tx.from.toLowerCase() === walletAddress.toLowerCase()) {
          // Sent tokens
          const currentBalance = BigInt(balanceMap[normalizedAddress].balance);
          const txAmount = BigInt(tx.value);
          
          // Prevent negative balances
          if (currentBalance >= txAmount) {
            balanceMap[normalizedAddress].balance = (currentBalance - txAmount).toString();
          } else {
            balanceMap[normalizedAddress].balance = '0';
          }
        }
      }
    } else {
      console.log('[BSCScan] No token transactions found or API error');
    }
    
    // Always ensure TAS is included even if we don't have transactions
    const tasTokenAddressLower = tasTokenAddress.toLowerCase();
    if (!balanceMap[tasTokenAddressLower]) {
      balanceMap[tasTokenAddressLower] = tasTokenInfo;
    }
    
    // Convert map to array and filter out zero balances
    const result = Object.values(balanceMap).filter(token => 
      token.balance !== '0' || token.tokenAddress.toLowerCase() === tasTokenAddressLower
    );
    
    console.log(`[BSCScan] Found ${result.length} tokens for address ${walletAddress}`);
    
    return result;
  } catch (error) {
    console.error('[BSCScan] Error fetching token balances:', error);
    console.log('[BSCScan] Returning default TAS token with zero balance');
    
    // Always return at least TAS token
    return [{
      tokenAddress: '0xd9541b134b1821736bd323135b8844d3ae408216',
      symbol: 'TAS',
      name: 'TAS Token',
      balance: '0',
      decimals: '18'
    }];
  }
}

// Get token transactions from BSCScan
export async function getTokenTransactions(walletAddress: string): Promise<TokenTransaction[]> {
  try {
    console.log('[BSCScan] Getting token transactions for', walletAddress);
    
    if (!BSC_SCAN_API_KEY) {
      console.warn('[BSCScan] API key not found. Returning empty transaction list.');
      return [];
    }
    
    // Try to get all token transactions
    const response = await axios.get(BSC_SCAN_API_URL, {
      params: {
        module: 'account',
        action: 'tokentx',
        address: walletAddress,
        sort: 'desc',
        apikey: BSC_SCAN_API_KEY
      }
    });
    
    if (response.data.status === '1' && Array.isArray(response.data.result)) {
      console.log(`[BSCScan] Found ${response.data.result.length} token transactions`);
      return response.data.result;
    }
    
    // If no transactions found but we're specifically looking for TAS transactions
    // Try to get specifically for the TAS contract
    const tasTokenAddress = '0xd9541b134b1821736bd323135b8844d3ae408216';
    
    // Check if the first API call had no results
    if (response.data.status !== '1' || !Array.isArray(response.data.result) || response.data.result.length === 0) {
      try {
        const specificTASResponse = await axios.get(BSC_SCAN_API_URL, {
          params: {
            module: 'account',
            action: 'tokentx',
            contractaddress: tasTokenAddress,
            address: walletAddress,
            sort: 'desc',
            apikey: BSC_SCAN_API_KEY
          }
        });
        
        if (specificTASResponse.data.status === '1' && Array.isArray(specificTASResponse.data.result)) {
          console.log(`[BSCScan] Found ${specificTASResponse.data.result.length} TAS token transactions`);
          return specificTASResponse.data.result;
        }
      } catch (e) {
        console.error('[BSCScan] Error fetching specific TAS transactions:', e);
      }
    }
    
    console.log('[BSCScan] No transactions found');
    return [];
  } catch (error) {
    console.error('[BSCScan] Error fetching token transactions:', error);
    return [];
  }
}

// Get token approvals from BSCScan
// Get BNB balance from BSCScan
export async function getBNBBalance(walletAddress: string): Promise<BNBBalance> {
  try {
    console.log('[BSCScan] Getting BNB balance for', walletAddress);
    
    // Default BNB response
    const defaultResponse: BNBBalance = {
      address: walletAddress,
      balance: '0',
      formattedBalance: '0',
      price: 0 // We'll update this from price API
    };
    
    if (!BSC_SCAN_API_KEY) {
      console.warn('[BSCScan] API key not found. Using default BNB balance.');
      return defaultResponse;
    }
    
    try {
      // First try the direct provider method
      const provider = new ethers.providers.JsonRpcProvider(BSC_NODE_URL);
      const balance = await provider.getBalance(walletAddress);
      
      console.log(`[BSCScan] Got BNB balance from provider: ${balance.toString()}`);
      
      return {
        address: walletAddress,
        balance: balance.toString(),
        formattedBalance: ethers.utils.formatEther(balance)
      };
    } catch (providerError) {
      console.warn('[BSCScan] Error getting BNB balance from provider:', providerError);
      
      // Fall back to BSCScan API
      const response = await axios.get(BSC_SCAN_API_URL, {
        params: {
          module: 'account',
          action: 'balance',
          address: walletAddress,
          tag: 'latest',
          apikey: BSC_SCAN_API_KEY
        }
      });
      
      if (response.data.status === '1') {
        const balance = response.data.result;
        console.log(`[BSCScan] Got BNB balance from API: ${balance}`);
        
        return {
          address: walletAddress,
          balance: balance,
          formattedBalance: ethers.utils.formatEther(balance)
        };
      }
      
      return defaultResponse;
    }
  } catch (error) {
    console.error('[BSCScan] Error fetching BNB balance:', error);
    return {
      address: walletAddress,
      balance: '0',
      formattedBalance: '0'
    };
  }
}

export async function getTokenApprovals(walletAddress: string): Promise<any[]> {
  try {
    console.log('[BSCScan] Getting token approvals for', walletAddress);
    
    if (!BSC_SCAN_API_KEY) {
      console.warn('[BSCScan] API key not found. Returning empty approvals list.');
      return [];
    }
    
    try {
      // BSCScan doesn't have a direct API for approvals, we need to look at events
      // Let's try to get the BSCScan logs for the Approval events
      const tasTokenAddress = '0xd9541b134b1821736bd323135b8844d3ae408216';
      const swapMarketAddress = '0x4FE94E5e7AF4b458E0e6Edc3c6D1D87E7d58c027';
      
      // This is an approximation - we're checking for known approval events in logs
      const response = await axios.get(BSC_SCAN_API_URL, {
        params: {
          module: 'logs',
          action: 'getLogs',
          address: tasTokenAddress,
          fromBlock: '0',
          toBlock: 'latest',
          topic0: '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925', // Approval event signature
          apikey: BSC_SCAN_API_KEY
        }
      });
      
      // If we find logs with approvals
      if (response.data.status === '1' && Array.isArray(response.data.result)) {
        const approvals = [];
        const logs = response.data.result;
        
        // Look for approvals related to this wallet
        for (const log of logs) {
          try {
            // Parse topics - the owner is in topic1, the spender in topic2
            const ownerTopic = log.topics[1];
            const spenderTopic = log.topics[2];
            
            // Check if this approval is for our wallet 
            // Note: the address in topics is padded to 32 bytes, but we do a contains check
            if (ownerTopic.toLowerCase().includes(walletAddress.slice(2).toLowerCase())) {
              // Extract spender address from the topic
              let spenderAddress = '0x' + spenderTopic.slice(26);
              if (spenderAddress === swapMarketAddress) {
                approvals.push({
                  tokenAddress: tasTokenAddress,
                  spenderAddress: spenderAddress,
                  spenderName: 'TAS Swap Market',
                  allowance: '1000000000000000000000', // Approximate allowance amount
                  tokenSymbol: 'TAS',
                  tokenDecimals: 18
                });
              }
            }
          } catch (e) {
            console.error('[BSCScan] Error parsing approval log:', e);
          }
        }
        
        if (approvals.length > 0) {
          console.log(`[BSCScan] Found ${approvals.length} token approvals`);
          return approvals;
        }
      }
    } catch (e) {
      console.error('[BSCScan] Error checking for approvals:', e);
    }
    
    // If no approvals found through API, return empty array
    // or provide minimal default data if needed for UI testing
    console.log('[BSCScan] No approvals found, returning empty list');
    return [];
  } catch (error) {
    console.error('[BSCScan] Error fetching token approvals:', error);
    return [];
  }
}

// Send tokens using a private key
export interface SendTokenResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export async function sendToken(
  fromAddress: string,
  toAddress: string,
  amount: number,
  tokenAddress: string,
  privateKey: string
): Promise<SendTokenResult> {
  console.log(`[BSCScan] Sending ${amount} tokens from ${fromAddress} to ${toAddress}`);
  
  try {
    // Add 0x prefix if it's missing but the key is otherwise valid
    if (!privateKey.startsWith('0x') && privateKey.length === 64) {
      console.log('[BSCScan] Adding 0x prefix to private key');
      privateKey = '0x' + privateKey;
    }
    
    // Ensure private key is in the correct format
    if (!privateKey.startsWith('0x')) {
      return {
        success: false,
        error: 'Invalid private key format. Private key must start with 0x.'
      };
    }
    
    // Validate private key length
    if (privateKey.length !== 66) { // 0x + 64 characters
      return {
        success: false,
        error: `Invalid private key length. Expected 66 characters (including 0x), got ${privateKey.length}.`
      };
    }
    
    // Create provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(BSC_NODE_URL);
    
    try {
      const wallet = new ethers.Wallet(privateKey, provider);
      
      // Verify the wallet address matches the fromAddress
      if (wallet.address.toLowerCase() !== fromAddress.toLowerCase()) {
        throw new Error('Private key does not match the from address');
      }
      
      // Special handling for native BNB
      if (tokenAddress === NATIVE_BNB_ADDRESS) {
        return await sendNativeBNB(wallet, toAddress, amount);
      }
      
      // Create contract instance for ERC20 tokens
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
      
      // Get token decimals to format the amount correctly
      let decimals = 18; // Default to 18 decimals (standard for most tokens)
      try {
        decimals = await tokenContract.decimals();
      } catch (error) {
        console.warn('[BSCScan] Error getting token decimals, using default of 18:', error);
      }
      
      // Get token symbol for logging
      let symbol = 'TAS';
      try {
        symbol = await tokenContract.symbol();
      } catch (error) {
        console.warn('[BSCScan] Error getting token symbol, using default of TAS:', error);
      }
      
      // Format the amount with the correct number of decimals
      const formattedAmount = amount.toString();
      const amountInWei = ethers.utils.parseUnits(formattedAmount, decimals);
      
      console.log(`[BSCScan] Sending ${formattedAmount} ${symbol} (${amountInWei.toString()} wei) to ${toAddress}`);
      
      // Send the transaction
      const tx = await tokenContract.transfer(toAddress, amountInWei);
      console.log(`[BSCScan] Transaction sent: ${tx.hash}`);
      
      // Wait for transaction confirmation (1 confirmation)
      const receipt = await tx.wait(1);
      console.log(`[BSCScan] Transaction confirmed in block ${receipt.blockNumber}`);
      
      return {
        success: true,
        transactionHash: tx.hash
      };
    } catch (walletError) {
      console.error('[BSCScan] Wallet error:', walletError);
      return {
        success: false,
        error: walletError instanceof Error ? walletError.message : 'Wallet initialization failed'
      };
    }
  } catch (error) {
    console.error('[BSCScan] Error sending tokens:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Function to send native BNB
async function sendNativeBNB(
  wallet: ethers.Wallet,
  toAddress: string,
  amount: number
): Promise<SendTokenResult> {
  try {
    console.log(`[BSCScan] Sending ${amount} BNB from ${wallet.address} to ${toAddress}`);
    
    // Get current gas price
    const gasPrice = await wallet.provider.getGasPrice();
    console.log(`[BSCScan] Current gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
    
    // Convert BNB amount to wei
    const amountInWei = ethers.utils.parseEther(amount.toString());
    console.log(`[BSCScan] Amount in wei: ${amountInWei.toString()}`);
    
    // Estimate gas required for this transaction
    const gasEstimate = await wallet.provider.estimateGas({
      to: toAddress,
      value: amountInWei
    });
    console.log(`[BSCScan] Estimated gas: ${gasEstimate.toString()}`);
    
    // Calculate maximum amount considering gas costs
    const gasLimit = gasEstimate.mul(12).div(10); // Add 20% buffer
    const gasCost = gasPrice.mul(gasLimit);
    
    // Check if wallet has enough balance for transfer + gas
    const walletBalance = await wallet.getBalance();
    if (walletBalance.lt(amountInWei.add(gasCost))) {
      throw new Error(
        `Insufficient balance. Need ${ethers.utils.formatEther(amountInWei.add(gasCost))} BNB but wallet only has ${ethers.utils.formatEther(walletBalance)} BNB`
      );
    }
    
    // Create transaction
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amountInWei,
      gasPrice,
      gasLimit
    });
    
    console.log(`[BSCScan] BNB transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait(1);
    console.log(`[BSCScan] BNB transaction confirmed in block ${receipt.blockNumber}`);
    
    return {
      success: true,
      transactionHash: tx.hash
    };
  } catch (error) {
    console.error('[BSCScan] Error sending BNB:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}