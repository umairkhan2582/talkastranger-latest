import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  connectToTASChain, 
  getProvider, 
  getTASTokenContract,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  getExplorerTokenUrl,
  formatUnits
} from '@/lib/tasChain';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '@/lib/contract-addresses';
import { useToast } from '@/hooks/use-toast';

// Fixed interface to use proper ethers types
interface TASChainContextType {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  provider: ethers.providers.Provider | null;
  signer: ethers.Signer | null;
  tasBalance: bigint;
  walletType: 'tas' | 'external' | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  explorer: {
    getTxUrl: (hash: string) => string;
    getAddressUrl: (address: string) => string;
    getTokenUrl: (address: string) => string;
  };
  tasToken: {
    address: string;
    getBalance: (address: string) => Promise<string>;
  };
  isLoading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  getTokenFactoryContract: () => Promise<ethers.Contract | null>;
}

export const TASChainContext = createContext<TASChainContextType | undefined>(undefined);

export const useTASChain = () => {
  const context = useContext(TASChainContext);
  if (context === undefined) {
    throw new Error('useTASChain must be used within a TASChainProvider');
  }
  return context;
};

export const TASChainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [tasBalance, setTasBalance] = useState<bigint>(BigInt(0));
  const [walletType, setWalletType] = useState<'tas' | 'external' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Contract addresses - using the deployed BSC Mainnet addresses
  const TAS_TOKEN_ADDRESS = CONTRACT_ADDRESSES.TAS_TOKEN;
  const TOKEN_FACTORY_ADDRESS = CONTRACT_ADDRESSES.TOKEN_FACTORY;
  const SWAP_MARKET_ADDRESS = CONTRACT_ADDRESSES.SWAP_MARKET;

  // Initialize provider
  useEffect(() => {
    const initProvider = async () => {
      try {
        setIsLoading(true);
        const provider = getProvider();
        
        // Set up the provider regardless of current connectivity state
        setProvider(provider);
        
        // Try to detect the network to confirm connectivity
        try {
          await provider.getNetwork();
          // If we get here, the connection is working
        } catch (networkError) {
          console.warn('Network detection failed, will retry on demand:', networkError);
          // We'll continue with the provider anyway, as it might work later when the
          // RPC endpoint becomes available
        }
      } catch (error) {
        console.error('Failed to initialize provider:', error);
        setError('Failed to connect to TASChain. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    initProvider();
    
    // Set up an interval to periodically check connectivity
    const connectivityInterval = setInterval(() => {
      if (provider) {
        provider.getNetwork().catch(err => {
          console.warn('Periodic connectivity check failed:', err);
          // We don't need to update state here, just logging the issue
        });
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(connectivityInterval);
  }, []);

  // Check for saved connection
  useEffect(() => {
    const checkSavedConnection = async () => {
      const savedAddress = localStorage.getItem('tasChainAddress');
      const savedWalletType = localStorage.getItem('walletType');
      
      if (savedAddress && provider) {
        setAddress(savedAddress);
        setIsConnected(true);
        
        // Set wallet type if available
        if (savedWalletType === 'tas' || savedWalletType === 'external') {
          setWalletType(savedWalletType);
        } else {
          // If wallet type not set but we have a TAS wallet, assume it's a TAS wallet
          if (localStorage.getItem('tasWallet')) {
            setWalletType('tas');
            localStorage.setItem('walletType', 'tas');
          } else {
            // Otherwise assume external wallet
            setWalletType('external');
            localStorage.setItem('walletType', 'external');
          }
        }
        
        await fetchBalance(savedAddress);
      }
    };

    if (provider) {
      checkSavedConnection();
    }
  }, [provider]);

  // Fetch account balance
  const fetchBalance = async (accountAddress: string) => {
    if (!provider) return;
    
    try {
      console.log('Fetching TAS balance for address:', accountAddress);
      console.log('Using TAS Token contract address:', TAS_TOKEN_ADDRESS);
      
      const tasTokenContract = getTASTokenContract(provider, TAS_TOKEN_ADDRESS);
      
      // Log the successful contract initialization
      console.log('TAS Token contract initialized successfully');
      
      // Add explicit error handling around the balanceOf call
      let balanceWei;
      try {
        balanceWei = await tasTokenContract.balanceOf(accountAddress);
        console.log('Raw balance retrieved from contract:', balanceWei.toString());
      } catch (balanceError: unknown) {
        console.error('Error calling balanceOf():', balanceError);
        if (balanceError instanceof Error) {
          throw new Error(`Failed to call balanceOf(): ${balanceError.message}`);
        } else {
          throw new Error(`Failed to call balanceOf(): Unknown error`);
        }
      }
      
      // Store the raw bigint balance for use in transactions
      setTasBalance(balanceWei);
      
      // Format for display
      const balanceEther = formatUnits(balanceWei, 18);
      console.log('Formatted TAS balance:', balanceEther);
      setBalance(balanceEther);
      
      return balanceEther;
    } catch (error) {
      console.error('Error fetching balance:', error);
      setError('Failed to fetch TAS balance: ' + (error instanceof Error ? error.message : String(error)));
      
      // Don't set fallback values - only use real data
      setTasBalance(BigInt(0));
      setBalance('0');
      return '0';
    }
  };

  // Refresh balance
  const refreshBalance = async () => {
    if (address) {
      try {
        // Try fetching from blockchain first
        await fetchBalance(address);
      } catch (error) {
        console.warn("Error fetching balance from blockchain, using local balance:", error);
        
        // If fetching from blockchain fails, try getting from localStorage
        // Don't use mock data, just set to 0 if we can't get real data
        setBalance('0');
        setTasBalance(BigInt(0));
      }
    }
  };

  // Connect wallet to TASChain
  const connectWallet = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // OPTION 1: Connect using external wallet (MetaMask, Trust Wallet, etc.)
      if (window.ethereum) {
        try {
          const { account, connected, error } = await connectToTASChain();
          
          if (connected && account) {
            // Create a provider wrapper from the Ethereum provider
            let ethersProvider;
            try {
              // ethers v5 approach (we're using ethers v5 in this project)
              if (ethers.providers && typeof ethers.providers.Web3Provider === 'function') {
                ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
              } else {
                throw new Error('Could not create compatible provider');
              }
            } catch (providerError) {
              console.error('Error creating provider from window.ethereum:', providerError);
              ethersProvider = getProvider(); // Fall back to our custom provider
            }
            
            // Get the signer from the provider
            const ethSigner = await ethersProvider.getSigner();
            
            setProvider(ethersProvider);
            setSigner(ethSigner);
            setIsConnected(true);
            setAddress(account);
            localStorage.setItem('tasChainAddress', account);
            localStorage.setItem('walletType', 'external');
            setWalletType('external');
            
            // Get real TAS balance from blockchain
            await fetchBalance(account);
            
            toast({
              title: "External Wallet Connected",
              description: `Connected to TAS Chain with address ${account.slice(0, 6)}...${account.slice(-4)}`,
            });
            return;
          } else if (error) {
            console.warn("External wallet connection failed:", error);
            toast({
              title: "External Wallet Connection Failed",
              description: "Using TAS Wallet instead. You can try connecting your External Wallet again later.",
              variant: "destructive",
            });
          }
        } catch (err) {
          console.warn("External wallet connection failed:", err);
        }
      }
      
      // OPTION 2: Use TAS wallet if external wallet not available or connection failed
      // Check if we have a saved TAS wallet
      const savedWallet = localStorage.getItem('tasWallet');
      let tasWalletAddress = '';
      
      if (savedWallet) {
        // Load existing TAS wallet
        try {
          const parsedWallet = JSON.parse(savedWallet);
          
          if (parsedWallet.address) {
            tasWalletAddress = parsedWallet.address;
          }
        } catch (e) {
          console.error("Error loading saved TAS wallet:", e);
        }
      }
      
      // If we don't have a saved TAS wallet address, create a new one
      if (!tasWalletAddress) {
        try {
          // Generate a new random address for the TAS wallet
          const wallet = ethers.Wallet.createRandom();
          tasWalletAddress = wallet.address;
          
          // Store wallet info in localStorage
          localStorage.setItem('tasWallet', JSON.stringify({
            address: tasWalletAddress,
            timestamp: Date.now()
          }));
          
          toast({
            title: "New TAS Wallet Created",
            description: `Created and connected new TAS Wallet with address ${tasWalletAddress.slice(0, 6)}...${tasWalletAddress.slice(-4)}`,
          });
        } catch (error) {
          console.error('Error creating TAS wallet:', error);
          setError('Failed to create TAS wallet');
          setIsLoading(false);
          return;
        }
      }
      
      // Connect to the TAS wallet
      const tasProvider = getProvider();
      
      setProvider(tasProvider);
      setIsConnected(true);
      setAddress(tasWalletAddress);
      localStorage.setItem('tasChainAddress', tasWalletAddress);
      localStorage.setItem('walletType', 'tas');
      setWalletType('tas');
      
      // Get real balance from blockchain
      await fetchBalance(tasWalletAddress);
      
      if (savedWallet) {
        toast({
          title: "TAS Wallet Connected",
          description: `Connected to TAS Chain with address ${tasWalletAddress.slice(0, 6)}...${tasWalletAddress.slice(-4)}`,
        });
      }
      
    } catch (err: unknown) {
      console.error('Error connecting wallet:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error connecting wallet.';
      setError(errorMessage);
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    setBalance(null);
    setTasBalance(BigInt(0));
    setSigner(null);
    
    // Clean up storage
    localStorage.removeItem('tasChainAddress');
    const currentWalletType = localStorage.getItem('walletType');
    
    if (currentWalletType === 'tas') {
      // For TAS wallet, we'll remove it entirely
      localStorage.removeItem('tasWallet');
      toast({
        title: "TAS Wallet Disconnected",
        description: "Your TAS Wallet has been disconnected.",
      });
    } else {
      // For external wallet, keep the wallet type setting
      toast({
        title: "External Wallet Disconnected",
        description: "Your External Wallet has been disconnected from TAS Chain.",
      });
    }
    
    localStorage.removeItem('walletType');
    setWalletType(null);
  };

  // Get TAS token balance
  const getTokenBalance = async (address: string): Promise<string> => {
    if (!provider) return '0';
    
    try {
      const tasTokenContract = getTASTokenContract(provider, TAS_TOKEN_ADDRESS);
      const balanceWei = await tasTokenContract.balanceOf(address);
      return formatUnits(balanceWei, 18);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return '0';
    }
  };
  
  // Get TokenFactory contract - optimized for performance and reliability
  const getTokenFactoryContract = async (): Promise<ethers.Contract | null> => {
    if (!provider || !signer) return null;
    
    try {
      console.log('[TASChain] Initializing TokenFactory contract with optimized performance');
      
      // Import ABI with current deployed contract functions
      const tokenFactoryABI = [
        "function createToken(string name, string symbol, uint256 initialSupply, string logo, string category) external returns (address)",
        "function getTokenCount() external view returns (uint256)",
        "function getTokensByCreator(address creator) external view returns (address[])",
        "function getTokensByCategory(string category) external view returns (address[])",
        "function tokens(uint256 index) external view returns (address tokenAddress, string name, string symbol, uint256 initialSupply, address creator, uint256 creationTime, string logo, string category, bool liquidityReleased)",
        "function creationFee() external view returns (uint256)"
      ];
      
      // Create contract instance with optimized error handling
      try {
        // First attempt with signer
        const contract = new ethers.Contract(TOKEN_FACTORY_ADDRESS, tokenFactoryABI, signer);
        
        // Test contract connection with a simple view call
        try {
          // Just verify the contract is responsive
          await contract.creationFee();
          console.log('[TASChain] TokenFactory contract initialized successfully');
          return contract;
        } catch (viewError) {
          console.warn('[TASChain] View function failed, attempting fallback approach:', viewError);
          
          // Just return the contract anyway - the error might be temporary
          // or only affecting view functions
          return contract;
        }
      } catch (contractError) {
        console.error('[TASChain] Primary contract initialization failed, trying provider fallback:', contractError);
        
        // Fallback: try with provider first, then connect signer
        try {
          const contractWithProvider = new ethers.Contract(TOKEN_FACTORY_ADDRESS, tokenFactoryABI, provider);
          return contractWithProvider.connect(signer);
        } catch (fallbackError) {
          console.error('[TASChain] Fallback contract initialization also failed:', fallbackError);
          throw fallbackError;
        }
      }
    } catch (error) {
      console.error('[TASChain] Critical error getting TokenFactory contract:', error);
      
      // Show a more helpful error message
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('connection')) {
          toast({
            title: "Network Connection Issue",
            description: "Unable to connect to the blockchain network. Please check your internet connection and try again.",
            variant: "destructive"
          });
        } else if (error.message.includes('contract') || error.message.includes('ABI')) {
          toast({
            title: "Contract Interaction Error",
            description: "There was a problem communicating with the smart contract. Please try again later.",
            variant: "destructive"
          });
        }
      }
      
      return null;
    }
  };

  const contextValue: TASChainContextType = {
    isConnected,
    address,
    balance,
    provider,
    signer,
    tasBalance,
    walletType,
    connectWallet,
    disconnectWallet,
    explorer: {
      getTxUrl: getExplorerTxUrl,
      getAddressUrl: getExplorerAddressUrl,
      getTokenUrl: getExplorerTokenUrl,
    },
    tasToken: {
      address: TAS_TOKEN_ADDRESS,
      getBalance: getTokenBalance,
    },
    isLoading,
    error,
    refreshBalance,
    getTokenFactoryContract,
  };

  return (
    <TASChainContext.Provider value={contextValue}>
      {children}
    </TASChainContext.Provider>
  );
};