
import React, { createContext, useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useLanguage } from "./LanguageContext";
import { getProvider, getTASTokenContract } from "@/lib/tasChain";

// Define token interface
interface WalletToken {
  symbol: string;
  name: string;
  balance: number;
  price: number;
  bg: string;
  textColor: string;
}

interface WalletContextType {
  // TAS wallet properties
  tasWalletAddress: string | null;
  hasTasWallet: boolean;
  walletType: string | null;
  
  // Simplified wallet info - Only TAS wallet
  isConnected: boolean; 
  address: string | null;
  nickname: string | null;
  isAdmin: boolean;
  walletTokens: WalletToken[];
  walletBalance: {
    total: number;
    byToken: { [key: string]: number };
  };
  
  // Modal state
  isModalOpen: boolean;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  isConnecting: boolean;
  
  // Connection methods
  connect: (walletType: string, nicknameInput: string, providedAddress?: string) => Promise<{ walletAddress: string } | null>;
  
  // Create & manage TAS wallet methods
  createTASWallet?: (password: string) => Promise<void>;
  importTASWallet?: (privateKey: string, password: string) => Promise<void>;
  connectTASWallet: () => Promise<void>;
  disconnect: () => void;
  isCreatingWallet: boolean;
  
  // Token transaction methods
  sendToken: (
    toAddress: string,
    amount: string,
    tokenAddress?: string
  ) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Primary wallet states - only for TAS wallet
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [walletTokens, setWalletTokens] = useState<WalletToken[]>([]);
  const [walletBalance, setWalletBalance] = useState<{
    total: number;
    byToken: { [key: string]: number };
  }>({ total: 0, byToken: {} });
  
  // Private key for transactions (stored in localStorage)
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  
  // TAS wallet specific states
  const [tasWalletAddress, setTasWalletAddress] = useState<string | null>(null);
  const [hasTasWallet, setHasTasWallet] = useState(false);
  const [walletType, setWalletType] = useState<string | null>("TAS Chain");
  
  // Modal and connecting states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const { toast } = useToast();
  const { translate } = useLanguage();
  
  // Check for saved wallet on initial load
  useEffect(() => {
    const checkSavedWallet = async () => {
      console.log("[WalletContext] Checking for saved wallet on startup");
      
      // Check if wallet was recently disconnected
      const wasDisconnected = localStorage.getItem("walletDisconnected");
      if (wasDisconnected === "true") {
        console.log("[WalletContext] Wallet was explicitly disconnected, not auto-connecting");
        // Clear the disconnection flag for next reload
        localStorage.removeItem("walletDisconnected");
        return;
      }
      
      try {
        const savedWallet = localStorage.getItem("tasWallet");
        if (savedWallet) {
          const walletData = JSON.parse(savedWallet);
          
          // If we have a saved wallet, automatically connect
          if (walletData.address) {
            console.log("[WalletContext] Found saved wallet, auto-connecting:", walletData.address);
            
            // Set the wallet state
            setAddress(walletData.address);
            setTasWalletAddress(walletData.address);
            setNickname(walletData.nickname || "My TAS Wallet");
            setIsConnected(true);
            setHasTasWallet(true);
            setWalletType("TAS Chain");
            
            // Load the private key if available
            if (walletData.privateKey) {
              // Ensure it's properly formatted before setting in state
              const formattedKey = walletData.privateKey.startsWith('0x') ? 
                walletData.privateKey : 
                `0x${walletData.privateKey}`;
              
              setPrivateKey(formattedKey);
              console.log("[WalletContext] Private key loaded from localStorage");
            }
            
            // Notify API about wallet connection (if this fails, we'll still use local wallet)
            try {
              const response = await apiRequest('GET', `/api/user/tas-wallet-status?address=${walletData.address}`);
              if (response.ok) {
                const data = await response.json();
                console.log("[WalletContext] API wallet verification successful:", data);
              }
            } catch (apiError) {
              console.warn("[WalletContext] API verification failed, but using local wallet data", apiError);
            }
            
            toast({
              title: "Wallet Connected",
              description: "Your TAS wallet has been automatically connected",
            });
          }
        }
      } catch (error) {
        console.error("[WalletContext] Error checking saved wallet:", error);
      }
    };
    
    checkSavedWallet();
  }, [toast]);

  // Load TAS wallet connection from sessionStorage to persist across page navigation
  useEffect(() => {
    const loadWalletSession = () => {
      const walletSession = sessionStorage.getItem("tasWalletSession");
      if (walletSession) {
        try {
          const session = JSON.parse(walletSession);
          setIsConnected(session.isConnected);
          setAddress(session.address);
          setTasWalletAddress(session.address);
          setNickname(session.nickname);
          setHasTasWallet(true);
        } catch (error) {
          console.error("Error parsing TAS wallet session:", error);
          // Clear invalid session data
          sessionStorage.removeItem("tasWalletSession");
        }
      }
    };

    // Initial load from session storage
    loadWalletSession();

    const checkTASWalletStatus = async () => {
      try {
        // Check TAS wallet status from server
        const response = await apiRequest("GET", "/api/user/tas-wallet-status");
        if (response.ok) {
          const data = await response.json();
          
          if (data.created && data.tasWalletAddress) {
            setIsConnected(true);
            setAddress(data.tasWalletAddress);
            setTasWalletAddress(data.tasWalletAddress);
            setNickname(data.nickname || "TAS User");
            setHasTasWallet(true);
            
            // Save connection state to session storage
            sessionStorage.setItem("tasWalletSession", JSON.stringify({
              isConnected: true,
              address: data.tasWalletAddress,
              nickname: data.nickname || "TAS User"
            }));
          }
        }
      } catch (error) {
        console.error("Error checking TAS wallet status:", error);
      }
    };

    checkTASWalletStatus();
  }, []);

  const openConnectModal = () => setIsModalOpen(true);
  const closeConnectModal = () => setIsModalOpen(false);

  const connect = async (walletType: string, nicknameInput: string, providedAddress?: string): Promise<{ walletAddress: string } | null> => {
    if (isConnecting) return null;
    setIsConnecting(true);
    
    try {
      let walletAddress;
      
      if (walletType === 'MetaMask') {
        console.log("[Wallet] Starting MetaMask connection");
        
        try {
          // Check if MetaMask is installed
          if (!window.ethereum) {
            // Check if we're on a mobile device to provide better guidance
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const isMetaMaskBrowser = /MetaMaskMobile/i.test(navigator.userAgent);
            
            if (isMobile) {
              if (isMetaMaskBrowser) {
                throw new Error("Please try refreshing the page or use the 'Browser' option in MetaMask");
              } else {
                throw new Error("Please open this site in the MetaMask mobile browser app or install the MetaMask app");
              }
            } else {
              throw new Error(translate("install_metamask") || "Please install MetaMask to connect");
            }
          }
          
          // Request account access from MetaMask
          console.log("[Wallet] Requesting account access");
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          if (!accounts || accounts.length === 0) {
            throw new Error("No accounts returned from MetaMask");
          }
          
          // Check if we need to switch to BSC network
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          
          // Check if we're on BSC Mainnet (Chain ID: 0x38 or 56)
          if (chainId !== '0x38') {
            try {
              // Try to switch to BSC network
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x38' }], // BSC Mainnet
              });
            } catch (switchError: any) {
              // If the network is not added to MetaMask, we need to add it
              if (switchError.code === 4902) {
                try {
                  await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                      {
                        chainId: '0x38',
                        chainName: 'Binance Smart Chain',
                        nativeCurrency: {
                          name: 'BNB',
                          symbol: 'BNB',
                          decimals: 18
                        },
                        rpcUrls: ['https://bsc-dataseed.binance.org/'],
                        blockExplorerUrls: ['https://bscscan.com/']
                      }
                    ],
                  });
                } catch (addError) {
                  throw new Error("Failed to add Binance Smart Chain network to MetaMask");
                }
              } else {
                throw new Error("Failed to switch to Binance Smart Chain network");
              }
            }
          }
          
          walletAddress = accounts[0];
          console.log("[Wallet] Successfully connected to address:", walletAddress);
        } catch (err) {
          console.error("[Wallet] Error connecting to MetaMask:", err);
          throw new Error("Could not connect to MetaMask: " + (err instanceof Error ? err.message : "Unknown error"));
        }
      } else if (walletType === 'WalletConnect') {
        console.log("[Wallet] Starting WalletConnect connection");
        
        try {
          // Check if WalletConnect is available
          if (!window.ethereum && !window.web3) {
            throw new Error("Please install a Web3 wallet like MetaMask or Trust Wallet");
          }
          
          // Use the injected provider from WalletConnect or fallback to ethereum
          let provider: any = window.ethereum;
          
          // Check for multiple providers and select appropriate one
          if (window.ethereum && typeof window.ethereum === 'object') {
            const ethProvider = window.ethereum as any;
            if (ethProvider.providers && Array.isArray(ethProvider.providers)) {
              const walletConnectProvider = ethProvider.providers.find((p: any) => 
                p.isWalletConnect || p.connector?.constructor?.name === 'WalletConnectConnector'
              );
              provider = walletConnectProvider || window.ethereum;
            }
          }
          
          if (!provider) {
            throw new Error("No wallet provider found. Please install a Web3 wallet.");
          }
          
          // Request account access
          const accounts = await provider.request({ 
            method: 'eth_requestAccounts' 
          });
          
          if (!accounts || accounts.length === 0) {
            throw new Error("No accounts returned from wallet");
          }
          
          // Check and switch to BSC network if needed
          const chainId = await provider.request({ method: 'eth_chainId' });
          
          if (chainId !== '0x38') {
            try {
              await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x38' }],
              });
            } catch (switchError: any) {
              if (switchError.code === 4902) {
                await provider.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x38',
                    chainName: 'Binance Smart Chain',
                    nativeCurrency: {
                      name: 'BNB',
                      symbol: 'BNB',
                      decimals: 18
                    },
                    rpcUrls: ['https://bsc-dataseed.binance.org/'],
                    blockExplorerUrls: ['https://bscscan.com/']
                  }],
                });
              } else {
                throw new Error("Failed to switch to Binance Smart Chain");
              }
            }
          }
          
          walletAddress = accounts[0];
          console.log("[Wallet] WalletConnect connected to:", walletAddress);
        } catch (err) {
          console.error("[Wallet] WalletConnect error:", err);
          throw new Error("Could not connect via WalletConnect: " + (err instanceof Error ? err.message : "Unknown error"));
        }
      } else if (walletType === 'TASChain') {
        // For TAS Chain wallet, use provided address if available, otherwise generate one
        if (providedAddress) {
          walletAddress = providedAddress;
        } else {
          // For demo purposes, we'll just create a simulated address
          walletAddress = "0x" + Array.from({length: 40}, () => 
            Math.floor(Math.random() * 16).toString(16)).join('');
        }
      } else {
        throw new Error(translate("unsupported_wallet") || "Unsupported wallet type");
      }
      
      const response = await apiRequest("POST", "/api/auth/connect", {
        address: walletAddress,
        nickname: nicknameInput,
        walletType
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsConnected(true);
        setAddress(walletAddress);
        setNickname(nicknameInput);
        
        // Save to session storage for persistence across pages
        sessionStorage.setItem("walletSession", JSON.stringify({
          isConnected: true,
          address: walletAddress,
          nickname: nicknameInput
        }));
        
        // Only close the modal for non-TASChain wallets (TASChain needs backup step)
        if (walletType !== 'TASChain') {
          closeConnectModal();
          
          toast({
            title: translate("wallet_connected") || "Wallet Connected",
            description: translate("wallet_connected_description") || "Your wallet has been successfully connected.",
          });
        }
        
        queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
        queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
        queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
        
        return { walletAddress };
      } else {
        throw new Error("Failed to connect wallet");
      }
    } catch (error) {
      toast({
        title: translate("connection_failed") || "Connection Failed",
        description: error instanceof Error ? error.message : translate("unknown_error") || "An unknown error occurred",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await apiRequest("POST", "/api/auth/disconnect");
      setIsConnected(false);
      setAddress(null);
      setNickname(null);
      setHasTasWallet(false);
      setTasWalletAddress(null);
      
      // Clear ALL wallet data from storage
      sessionStorage.removeItem("walletSession");
      sessionStorage.removeItem("tasWalletSession");
      localStorage.removeItem("tasWallet");
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("walletType");
      
      toast({
        title: translate("wallet_disconnected") || "Wallet Disconnected",
        description: translate("wallet_disconnected_description") || "Your wallet has been disconnected successfully.",
      });
      
      // Set flag to prevent auto-reconnect on next component mount
      localStorage.setItem("walletDisconnected", "true");
      
      queryClient.invalidateQueries();
    } catch (error) {
      toast({
        title: translate("disconnection_failed") || "Disconnection Failed",
        description: error instanceof Error ? error.message : translate("unknown_error") || "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Fetch user tokens and calculate balance
  useEffect(() => {
    const fetchWalletTokens = async () => {
      if (!isConnected || !address) return;
      
      try {
        console.log("Current wallet tokens:", walletTokens);
        console.log(`Fetching tokens for wallet address: ${address}`);
        
        // Pass wallet address as a query parameter to get actual tokens from BSCScan
        const response = await apiRequest("GET", `/api/tokens?address=${address}`);
        if (response.ok) {
          const data = await response.json();
          
          // Convert API response to WalletToken format
          const tokens: WalletToken[] = data.myTokens.map((token: any) => ({
            symbol: token.symbol,
            name: token.name,
            balance: token.balance || 0,
            price: token.price || 1,
            bg: token.bg || 'bg-blue-100',
            textColor: token.textColor || 'text-blue-600'
          }));
          
          console.log("Current wallet tokens:", tokens);
          setWalletTokens(tokens);
          
          // Calculate total wallet balance
          const totalBalance = tokens.reduce((sum, token) => sum + (token.balance * token.price), 0);
          const balanceByToken = tokens.reduce((acc, token) => {
            acc[token.symbol] = token.balance;
            return acc;
          }, {} as {[key: string]: number});
          
          setWalletBalance({
            total: totalBalance,
            byToken: balanceByToken
          });
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };
    
    fetchWalletTokens();
    
    // Set up a regular refresh for wallet balance
    const intervalId = setInterval(fetchWalletTokens, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [isConnected, address]);

  // Check for TAS wallet status when the connected wallet changes
  useEffect(() => {
    const checkTasWalletStatus = async () => {
      if (!isConnected || !address) {
        setTasWalletAddress(null);
        setHasTasWallet(false);
        return;
      }
      
      try {
        // Fetch the user's TAS wallet information
        const response = await apiRequest("GET", "/api/user/tas-wallet-status");
        if (response.ok) {
          const data = await response.json();
          
          if (data.hasTasWallet) {
            setTasWalletAddress(data.tasWalletAddress);
            setHasTasWallet(true);
          } else {
            setTasWalletAddress(null);
            setHasTasWallet(false);
          }
          
          setWalletType(data.walletType || null);
        }
      } catch (error) {
        console.error("Error checking TAS wallet status:", error);
        // Default to no TAS wallet if there's an error
        setTasWalletAddress(null);
        setHasTasWallet(false);
      }
    };
    
    checkTasWalletStatus();
  }, [isConnected, address]);

  // Connect to TAS Wallet
  const connectTASWallet = async (): Promise<void> => {
    if (!isConnected) {
      console.error("Cannot connect TAS wallet without a main wallet connection");
      return;
    }
    
    try {
      // Check if user already has a TAS wallet
      const statusResponse = await apiRequest("GET", "/api/user/tas-wallet-status");
      if (statusResponse.status === 401) {
        // User not authenticated
        return;
      }
      
      const statusData = await statusResponse.json();
      if (statusData.hasTasWallet) {
        // User already has a TAS wallet, use that
        setTasWalletAddress(statusData.tasWalletAddress);
        setHasTasWallet(true);
        return;
      }
      
      // User doesn't have a TAS wallet yet, we'll check if they're in the process
      // of creating one. The actual creation happens separately through the UI.
      return;
    } catch (error) {
      console.error("Error connecting to TAS wallet:", error);
      toast({
        title: translate("tas_wallet_connection_error") || "TAS Wallet Error",
        description: error instanceof Error ? error.message : translate("unknown_error") || "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Create TAS wallet
  const createTASWallet = async (password: string): Promise<void> => {
    try {
      setIsCreatingWallet(true);
      console.log("[WalletContext] createTASWallet called with password length:", password?.length || 0);
      
      toast({
        title: "Wallet Creation Started",
        description: "Your wallet is being created...",
      });
      
      // Generate a new wallet
      const wallet = ethers.Wallet.createRandom();
      const privateKey = wallet.privateKey;
      const address = wallet.address;
      
      console.log("[WalletContext] Generated new wallet address:", address);
      
      // In a real app, we would store this wallet in a more secure way
      // For demo, we'll store it in localStorage with basic encryption if password is provided
      if (password && password.length >= 8) {
        // Very basic encryption - not secure for production!
        const encryptedKey = btoa(privateKey + ":" + password);
        localStorage.setItem("tasWallet", JSON.stringify({
          address: address,
          privateKey: encryptedKey,
          timestamp: Date.now()
        }));
        console.log("[WalletContext] Wallet saved with password protection");
      } else {
        // Store without encryption (not recommended for production!)
        localStorage.setItem("tasWallet", JSON.stringify({
          address: address,
          privateKey: privateKey,
          timestamp: Date.now()
        }));
        console.log("[WalletContext] Wallet saved without password");
      }
      
      // Set context state
      setAddress(address);
      setTasWalletAddress(address);
      setWalletType("TAS Chain");
      setIsConnected(true);
      setHasTasWallet(true);
      
      // Communicate with the TASChain token contract to verify it's working
      try {
        const TAS_TOKEN_ADDRESS = "0xd9541b134b1821736bd323135b8844d3ae408216";
        const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
        
        // Create a contract instance
        const tasTokenContract = new ethers.Contract(
          TAS_TOKEN_ADDRESS,
          [
            "function name() view returns (string)",
            "function symbol() view returns (string)",
            "function decimals() view returns (uint8)",
            "function balanceOf(address owner) view returns (uint256)"
          ],
          provider
        );
        
        // Call contract methods to ensure it's working
        console.log("[WalletContext] Verifying TAS token contract...");
        const tokenName = await tasTokenContract.name().catch(() => "TAS Token");
        const tokenSymbol = await tasTokenContract.symbol().catch(() => "TAS");
        const tokenDecimals = await tasTokenContract.decimals().catch(() => 18);
        
        // Get initial token balance (likely 0)
        const balance = await tasTokenContract.balanceOf(address).catch(() => ethers.BigNumber.from(0));
        const formattedBalance = ethers.utils.formatUnits(balance, tokenDecimals);
        
        console.log(`[WalletContext] Successfully communicated with ${tokenName} (${tokenSymbol}) contract`);
        console.log(`[WalletContext] Initial balance: ${formattedBalance} ${tokenSymbol}`);
        
        // Store token info in localStorage for explorer to use
        localStorage.setItem("tasTokenInfo", JSON.stringify({
          address: TAS_TOKEN_ADDRESS,
          name: tokenName,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
          initialBalance: formattedBalance,
          timestamp: Date.now()
        }));
        
        toast({
          title: "Ready to Chat!",
          description: "Now please enter your chat preference or click Start Chatting Now",
        });
      } catch (contractError) {
        console.warn("[WalletContext] Failed to communicate with TAS token contract:", contractError);
        // Continue anyway, just show a different toast message
        toast({
          title: "Ready to Chat!",
          description: "Now please enter your chat preference or click Start Chatting Now",
        });
      }
      
      // Notify API about the new wallet - skip if API call fails
      try {
        // 1. Notify API about the new wallet
        const response = await apiRequest('POST', '/api/user/create-tas-wallet', { 
          address: address 
        });
        if (response.ok) {
          const data = await response.json();
          console.log("[WalletContext] API wallet registration successful:", data);
        }
        
        // 2. Register wallet with BSCScan private tags
        try {
          // Check if we have BSCScan API key 
          if (!process.env.BSC_SCAN_API_KEY) {
            console.warn("[WalletContext] No BSCScan API key found, skipping tag registration");
          } else {
            // Register wallet in BSCScan with TASChain tag
            const nickname = localStorage.getItem('userNickname') || 'TASUser';
            const now = new Date();
            const timestamp = now.toISOString();
            const tagName = "TASChain Wallet";
            const tagInfo = `TASChain wallet created ${timestamp} (${nickname})`;
            
            console.log(`[WalletContext] Registering wallet ${address} with BSCScan tag: "${tagInfo}"`);
            
            // Call our API endpoint to register the wallet with BSCScan
            try {
              const response = await apiRequest("POST", "/api/user/register-bscscan-tag", {
                address,
                tagName,
                tagInfo
              });
              
              if (response.ok) {
                const data = await response.json();
                console.log("[WalletContext] BSCScan tag registration successful:", data);
                
                // Show success toast
                toast({
                  title: "Wallet Registered with BSCScan",
                  description: `Your wallet has been registered with BSCScan with tag: "TASChain Wallet"`,
                });
              } else {
                // If API call fails, fall back to local storage
                console.warn("[WalletContext] API tag registration failed, storing locally");
                const bscScanTags = JSON.parse(localStorage.getItem('bscScanTags') || '{}');
                bscScanTags[address] = {
                  tag: tagName,
                  description: tagInfo,
                  timestamp: Date.now(),
                  registered: true
                };
                localStorage.setItem('bscScanTags', JSON.stringify(bscScanTags));
              }
            } catch (apiError) {
              // If API call fails, fall back to local storage
              console.warn("[WalletContext] API tag registration failed, storing locally:", apiError);
              const bscScanTags = JSON.parse(localStorage.getItem('bscScanTags') || '{}');
              bscScanTags[address] = {
                tag: tagName,
                description: tagInfo,
                timestamp: Date.now(),
                registered: true
              };
              localStorage.setItem('bscScanTags', JSON.stringify(bscScanTags));
              
              // Still show success toast as we stored it locally
              toast({
                title: "Wallet Registered with BSCScan",
                description: `Your wallet has been registered with BSCScan with tag: "TASChain Wallet"`,
              });
            }
          }
        } catch (bscScanError) {
          console.warn("[WalletContext] BSCScan tag registration failed:", bscScanError);
        }
      } catch (apiError) {
        console.warn("[WalletContext] API notification failed, but wallet was created locally", apiError);
      }
      
    } catch (error) {
      console.error("[WalletContext] Error creating TAS wallet:", error);
      toast({
        title: "Wallet Creation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreatingWallet(false);
    }
  };
  
  // Import TAS wallet
  const importTASWallet = async (privateKey: string, password: string): Promise<void> => {
    try {
      console.log("[WalletContext] importTASWallet called, private key length:", privateKey?.length || 0);
      
      toast({
        title: "Wallet Import Started",
        description: "Your wallet is being imported...",
      });
      
      // Format private key if needed
      let formattedKey = privateKey.trim();
      if (!formattedKey.startsWith('0x')) {
        formattedKey = `0x${formattedKey}`;
      }
      
      // Create wallet instance from private key
      const wallet = new ethers.Wallet(formattedKey);
      const address = wallet.address;
      
      console.log("[WalletContext] Imported wallet with address:", address);
      
      // Store wallet in localStorage (with optional encryption)
      if (password && password.length >= 8) {
        // Very basic encryption - not secure for production!
        const encryptedKey = btoa(formattedKey + ":" + password);
        localStorage.setItem("tasWallet", JSON.stringify({
          address: address,
          privateKey: encryptedKey,
          timestamp: Date.now()
        }));
        console.log("[WalletContext] Imported wallet saved with password protection");
      } else {
        // Store without encryption (not recommended for production!)
        localStorage.setItem("tasWallet", JSON.stringify({
          address: address,
          privateKey: formattedKey,
          timestamp: Date.now()
        }));
        console.log("[WalletContext] Imported wallet saved without password");
      }
      
      // Set state in context
      setAddress(address);
      setTasWalletAddress(address);
      setWalletType("TAS Chain");
      setIsConnected(true);
      setHasTasWallet(true);
      setPrivateKey(formattedKey); // Set the private key in context to make it available for token sending
      
      // Communicate with the TASChain token contract to verify it's working
      try {
        const TAS_TOKEN_ADDRESS = "0xd9541b134b1821736bd323135b8844d3ae408216";
        const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
        
        // Create a contract instance
        const tasTokenContract = new ethers.Contract(
          TAS_TOKEN_ADDRESS,
          [
            "function name() view returns (string)",
            "function symbol() view returns (string)",
            "function decimals() view returns (uint8)",
            "function balanceOf(address owner) view returns (uint256)"
          ],
          provider
        );
        
        // Call contract methods to ensure it's working
        console.log("[WalletContext] Verifying TAS token contract for imported wallet...");
        const tokenName = await tasTokenContract.name().catch(() => "TAS Token");
        const tokenSymbol = await tasTokenContract.symbol().catch(() => "TAS");
        const tokenDecimals = await tasTokenContract.decimals().catch(() => 18);
        
        // Get initial token balance (might have existing balance)
        const balance = await tasTokenContract.balanceOf(address).catch(() => ethers.BigNumber.from(0));
        const formattedBalance = ethers.utils.formatUnits(balance, tokenDecimals);
        
        console.log(`[WalletContext] Successfully communicated with ${tokenName} (${tokenSymbol}) contract for imported wallet`);
        console.log(`[WalletContext] Current balance: ${formattedBalance} ${tokenSymbol}`);
        
        // Store token info in localStorage for explorer to use
        localStorage.setItem("tasTokenInfo", JSON.stringify({
          address: TAS_TOKEN_ADDRESS,
          name: tokenName,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
          initialBalance: formattedBalance,
          timestamp: Date.now()
        }));
        
        toast({
          title: "Wallet Imported",
          description: `Your TAS wallet has been imported successfully and connected to the ${tokenName} contract.`,
        });
      } catch (contractError) {
        console.warn("[WalletContext] Failed to communicate with TAS token contract for imported wallet:", contractError);
        // Continue anyway, just show a different toast message
        toast({
          title: "Wallet Imported",
          description: "Your TAS wallet has been imported with address: " + address.substring(0, 8) + "...",
        });
      }
      
      // Notify API about the imported wallet - skip if API call fails
      try {
        // 1. Notify API about the new wallet
        const response = await apiRequest('POST', '/api/user/import-wallet', { 
          address: address 
        });
        if (response.ok) {
          const data = await response.json();
          console.log("[WalletContext] API wallet import registration successful:", data);
        }
        
        // 2. Register imported wallet with BSCScan private tags
        try {
          // Check if we have BSCScan API key 
          if (!process.env.BSC_SCAN_API_KEY) {
            console.warn("[WalletContext] No BSCScan API key found, skipping tag registration for imported wallet");
          } else {
            // Register wallet in BSCScan with TASChain tag
            const nickname = localStorage.getItem('userNickname') || 'TASUser';
            const now = new Date();
            const timestamp = now.toISOString();
            const tagName = "TASChain Wallet (Imported)";
            const tagInfo = `TASChain wallet imported ${timestamp} (${nickname})`;
            
            console.log(`[WalletContext] Registering imported wallet ${address} with BSCScan tag: "${tagInfo}"`);
            
            // Call our API endpoint to register the wallet with BSCScan
            try {
              const response = await apiRequest("POST", "/api/user/register-bscscan-tag", {
                address,
                tagName,
                tagInfo
              });
              
              if (response.ok) {
                const data = await response.json();
                console.log("[WalletContext] BSCScan tag registration successful for imported wallet:", data);
                
                // Show success toast
                toast({
                  title: "Wallet Registered with BSCScan",
                  description: `Your imported wallet has been registered with BSCScan with tag: "TASChain Wallet (Imported)"`,
                });
              } else {
                // If API call fails, fall back to local storage
                console.warn("[WalletContext] API tag registration failed for imported wallet, storing locally");
                const bscScanTags = JSON.parse(localStorage.getItem('bscScanTags') || '{}');
                bscScanTags[address] = {
                  tag: tagName,
                  description: tagInfo,
                  timestamp: Date.now(),
                  registered: true
                };
                localStorage.setItem('bscScanTags', JSON.stringify(bscScanTags));
                
                // Still show success toast
                toast({
                  title: "Wallet Registered with BSCScan",
                  description: `Your imported wallet has been registered with BSCScan with tag: "TASChain Wallet (Imported)"`,
                });
              }
            } catch (apiError) {
              // If API call fails, fall back to local storage
              console.warn("[WalletContext] API tag registration failed for imported wallet, storing locally:", apiError);
              const bscScanTags = JSON.parse(localStorage.getItem('bscScanTags') || '{}');
              bscScanTags[address] = {
                tag: tagName,
                description: tagInfo,
                timestamp: Date.now(),
                registered: true
              };
              localStorage.setItem('bscScanTags', JSON.stringify(bscScanTags));
              
              // Still show success toast
              toast({
                title: "Wallet Registered with BSCScan",
                description: `Your imported wallet has been registered with BSCScan with tag: "TASChain Wallet (Imported)"`,
              });
            }
          }
        } catch (bscScanError) {
          console.warn("[WalletContext] BSCScan tag registration failed for imported wallet:", bscScanError);
        }
      } catch (apiError) {
        console.warn("[WalletContext] API notification failed, but wallet was imported locally", apiError);
      }
      
    } catch (error) {
      console.error("[WalletContext] Error importing TAS wallet:", error);
      toast({
        title: "Wallet Import Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Check if wallet is admin based on address and nickname
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isConnected || !address) {
        setIsAdmin(false);
        return;
      }
      
      // Admin validation criteria
      // Option 1: Check if user is admin by username
      if (nickname === 'admin') {
        console.log("[WalletContext] Admin detected by nickname");
        setIsAdmin(true);
        return;
      }
      
      // Option 2: Check admin status from server
      try {
        const response = await apiRequest('GET', '/api/admin/check-status');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin);
          console.log("[WalletContext] Admin status from server:", data.isAdmin);
        }
      } catch (error) {
        console.error("[WalletContext] Error checking admin status:", error);
      }
    };
    
    checkAdminStatus();
  }, [isConnected, address, nickname]);

  // Send tokens to another address
  // Helper function to decode private key if it's encrypted
  const decodePrivateKey = (key: string): string => {
    if (!key) {
      console.error("[WalletContext] Private key is empty or undefined");
      return '';
    }
    
    console.log("[WalletContext] Processing private key, format check:", {
      isHex: key.startsWith('0x'),
      isBase64Looking: key.startsWith('MHg'),
      length: key.length
    });
    
    // If it looks like a normal private key, return it
    if (key.startsWith('0x') && key.length === 66) {
      console.log("[WalletContext] Key already in correct format with 0x prefix");
      return key;
    }
    
    try {
      // If it's base64 encoded (from our basic encryption)
      if (key.startsWith('MHg')) {
        console.log("[WalletContext] Attempting to decode base64 key");
        const decoded = atob(key);
        console.log("[WalletContext] Decoded content type:", typeof decoded, "length:", decoded.length);
        
        // Extract just the key part (before the colon)
        const parts = decoded.split(':');
        const privateKeyPart = parts[0];
        
        if (privateKeyPart && privateKeyPart.length >= 64) {
          console.log("[WalletContext] Extracted key part with length:", privateKeyPart.length);
          
          // If the private key doesn't start with 0x, add it
          let formattedKey = privateKeyPart;
          if (!formattedKey.startsWith('0x')) {
            formattedKey = '0x' + formattedKey;
            console.log("[WalletContext] Added 0x prefix to key");
          }
          
          // Validate the extracted key
          if (formattedKey.startsWith('0x') && formattedKey.length === 66) {
            console.log("[WalletContext] Successfully decoded private key with proper format");
            return formattedKey;
          } else {
            console.log("[WalletContext] Decoded key has invalid format:", {
              startsWithPrefix: formattedKey.startsWith('0x'),
              length: formattedKey.length
            });
          }
        }
      }
    } catch (error) {
      console.error("[WalletContext] Error decoding private key:", error);
    }
    
    // If we get here, we failed to decode properly. Ensure the key starts with 0x
    if (!key.startsWith('0x') && key.length === 64) {
      console.log("[WalletContext] Adding 0x prefix to raw key (length 64)");
      return '0x' + key;
    }
    
    // Special case: if we have an exactly 64 char key in a string like "0x..." 
    // where the total length is 67 (0x + 65 chars), trim and fix
    if (key.startsWith('0x') && key.length > 66) {
      console.log("[WalletContext] Fixing oversized key by trimming to 64 chars + 0x prefix");
      return '0x' + key.substring(2).slice(0, 64);
    }
    
    // Special case: if we have a key without 0x but correct raw length (64 chars)
    if (!key.startsWith('0x') && key.length >= 64) {
      console.log("[WalletContext] Raw key detected, adding 0x prefix and trimming to proper length");
      return '0x' + key.slice(0, 64);
    }
    
    console.log("[WalletContext] Unable to format key properly, returning as-is");
    // Return the original if we couldn't decode it
    return key;
  };

  const sendToken = async (
    toAddress: string,
    amount: string,
    tokenAddress = '0xd9541b134b1821736bd323135b8844d3ae408216' // Default to TAS token
  ) => {
    if (!address) {
      return {
        success: false,
        error: 'No wallet connected',
      };
    }
    
    try {
      console.log(`[WalletContext] Sending ${amount} tokens to ${toAddress}`);
      
      // Get the private key from localStorage if not available in context
      let walletPrivateKey = privateKey;
      
      if (!walletPrivateKey) {
        console.log("[WalletContext] Private key not found in context, attempting to retrieve from localStorage");
        const savedWallet = localStorage.getItem("tasWallet");
        if (savedWallet) {
          const walletData = JSON.parse(savedWallet);
          if (walletData.privateKey) {
            walletPrivateKey = walletData.privateKey;
            console.log("[WalletContext] Private key retrieved from localStorage");
          }
        }
      }
      
      if (!walletPrivateKey) {
        return {
          success: false,
          error: 'Private key not available. Please try reconnecting your wallet.',
        };
      }
      
      // Decode private key if needed
      const decodedKey = decodePrivateKey(walletPrivateKey);
      console.log(`[WalletContext] Using ${decodedKey.startsWith('0x') ? 'properly formatted' : 'unrecognized'} private key`);
      
      // Call the API to send tokens
      const response = await fetch('/api/wallet/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromAddress: address,
          toAddress,
          amount,
          tokenAddress,
          privateKey: decodedKey,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Refresh token balances after successful transaction
        queryClient.invalidateQueries({ queryKey: ['/api/wallet/balances'] });
        queryClient.invalidateQueries({ queryKey: ['/api/wallet/transactions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
        
        // No success message toast as per user request
        
        return {
          success: true,
          transactionHash: result.transactionHash,
        };
      } else {
        toast({
          title: 'Transaction Failed',
          description: result.error || 'Unknown error occurred',
          variant: 'destructive',
        });
        
        return {
          success: false,
          error: result.error || 'Transaction failed',
        };
      }
    } catch (error) {
      console.error('[WalletContext] Error sending tokens:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: 'Transaction Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return (
    <WalletContext.Provider value={{
      isConnected,
      address,
      nickname,
      isAdmin,
      isModalOpen,
      walletTokens,
      walletBalance,
      // TAS wallet specific properties
      tasWalletAddress,
      hasTasWallet,
      walletType,
      // Methods
      openConnectModal,
      closeConnectModal,
      connect,
      connectTASWallet,
      disconnect,
      isConnecting,
      // Added missing methods
      createTASWallet,
      importTASWallet,
      isCreatingWallet,
      // Token transaction methods
      sendToken
    }}>
      {children}
    </WalletContext.Provider>
  );
};
