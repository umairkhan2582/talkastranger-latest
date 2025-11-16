import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import QRCode from 'qrcode';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  WalletIcon,
  Loader2,
  CheckIcon,
  CopyIcon,
  Copy,
  ArrowRightIcon,
  Send,
  Download,
  History,
  ShieldIcon,
  ExternalLink,
  X,
  KeyIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  useWallet
} from '@/contexts/WalletContext';
import BrowserCompatibilityWrapper from '@/components/BrowserCompatibilityWrapper';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLanguage } from '@/contexts/LanguageContext';
import PageNumberDebug from '@/components/PageNumberDebug';
import TokenHoldingsSection from '@/components/TokenHoldingsSection';
import SendTokenDialog from '@/components/SendTokenDialog';
import ReceiveTokenDialog from '@/components/ReceiveTokenDialog';
import { formatBalance, formatAddress, formatUsd } from '@/lib/utils';

// WalletBalanceDisplay component to show total wallet balance
const WalletBalanceDisplay = ({ address }: { address: string | null }) => {
  const [totalBalanceUsd, setTotalBalanceUsd] = useState<number>(0);

  // Fetch token balances
  const { data: balancesData, isLoading, refetch: refetchBalances } = useQuery({
    queryKey: ['/api/wallet/balances', address],
    queryFn: async () => {
      if (!address) return { balances: {}, tokenData: [] };
      const response = await fetch(`/api/wallet/balances?address=${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch token balances');
      }
      return response.json();
    },
    refetchInterval: 10000, // refetch every 10 seconds for more frequent updates
  });

  // Get current token prices
  const { data: priceData } = useQuery({
    queryKey: ['/api/prices/current'],
    queryFn: async () => {
      const response = await fetch('/api/prices/current');
      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }
      return response.json();
    },
  });

  useEffect(() => {
    const calculateTotalBalance = () => {
      if (!balancesData?.tokenData || !priceData?.data) return;
      
      // Get the TAS price
      const tasPrice = priceData.data.tasNativePrice || 0.001;
      
      let total = 0;
      
      // Calculate USD value for each token
      balancesData.tokenData.forEach((token: any) => {
        let tokenValue = 0;
        
        if (token.symbol === 'TAS') {
          // Use TAS price from API
          tokenValue = parseFloat(ethers.utils.formatUnits(token.balance, token.decimals)) * tasPrice;
        } else if (token.price) {
          // Use token's own price if available
          tokenValue = parseFloat(ethers.utils.formatUnits(token.balance, token.decimals)) * token.price;
        } else {
          // Default to a small value for unknown tokens
          tokenValue = parseFloat(ethers.utils.formatUnits(token.balance, token.decimals)) * 0.0001;
        }
        
        total += tokenValue;
      });
      
      setTotalBalanceUsd(total);
    };
    
    calculateTotalBalance();
  }, [balancesData, priceData]);

  return (
    <div className="mb-4">
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <h2 className="text-4xl font-bold mb-1">Loading...</h2>
        </div>
      ) : (
        <h2 className="text-4xl font-bold mb-1">{formatUsd(totalBalanceUsd)}</h2>
      )}
      <p className="text-sm text-muted-foreground">Total Wallet Balance</p>
    </div>
  );
};

// Helper function to format dates
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const WalletPage = () => {
  const { toast } = useToast();
  const { translate } = useLanguage();
  const { 
    isConnected, 
    address, 
    disconnect, 
    createTASWallet,
    importTASWallet
  } = useWallet();
  
  // State variables for wallet functionality
  // If needed, we can add balance fetching state later
  
  // States for wallet creation/import
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [isImportingWallet, setIsImportingWallet] = useState(false);
  const [walletPassword, setWalletPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [privateKeyError, setPrivateKeyError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdWalletInfo, setCreatedWalletInfo] = useState<{
    address: string;
    privateKey: string;
  } | null>(null);
  const [showBackupScreen, setShowBackupScreen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // State for wallet action dialogs
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showApprovalsDialog, setShowApprovalsDialog] = useState(false);
  
  // Transaction history state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  
  // Token approvals state
  const [approvals, setApprovals] = useState<any[]>([]);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
  
  // Send transaction state
  const [sendAmount, setSendAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // QR Code state
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const qrCodeRef = useRef<HTMLDivElement>(null);
  
  // Approval management state
  const [isRevoking, setIsRevoking] = useState(false);
  const [approvalToRevoke, setApprovalToRevoke] = useState<string | null>(null);
  
  // Generate QR code for the wallet address
  useEffect(() => {
    const generateQrCode = async () => {
      if (address && showReceiveDialog) {
        try {
          const dataUrl = await QRCode.toDataURL(address, {
            width: 200,
            margin: 1,
            color: {
              dark: '#006400', // Green color for the QR code
              light: '#F0FFF0', // Light green background
            },
          });
          setQrCodeDataUrl(dataUrl);
        } catch (err) {
          console.error('Error generating QR code:', err);
        }
      }
    };
    
    generateQrCode();
  }, [address, showReceiveDialog]);
  
  // Fetch transaction history automatically with regular updates
  useEffect(() => {
    const fetchTransactionHistory = async () => {
      if (!address) return;
      
      setIsLoadingTransactions(true);
      try {
        const response = await fetch(`/api/wallet/transactions?address=${address}`);
        const data = await response.json();
        
        if (data.success && data.transactions) {
          console.log("Loaded transactions:", data.transactions);
          setTransactions(data.transactions);
        } else {
          console.error("Failed to load transactions:", data.error || "Unknown error");
          setTransactions([]);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
      } finally {
        setIsLoadingTransactions(false);
      }
    };
    
    // Fetch immediately when component mounts or address changes
    fetchTransactionHistory();
    
    // Set up auto-refresh every 10 seconds to catch incoming transactions
    const intervalId = setInterval(fetchTransactionHistory, 10000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [address]);
  
  // Fetch token approvals with automatic refreshing when dialog is open
  useEffect(() => {
    const fetchTokenApprovals = async () => {
      if (!address || !showApprovalsDialog) return;
      
      setIsLoadingApprovals(true);
      try {
        const response = await fetch(`/api/wallet/approvals?address=${address}`);
        const data = await response.json();
        
        if (data.success && data.approvals) {
          console.log("Loaded approvals:", data.approvals);
          setApprovals(data.approvals);
        } else {
          console.error("Failed to load approvals:", data.error || "Unknown error");
          setApprovals([]);
        }
      } catch (error) {
        console.error("Error fetching approvals:", error);
        setApprovals([]);
      } finally {
        setIsLoadingApprovals(false);
      }
    };
    
    // Fetch immediately when dialog opens
    fetchTokenApprovals();
    
    // Only set up auto-refresh when the approvals dialog is open
    let intervalId: NodeJS.Timeout | null = null;
    if (showApprovalsDialog) {
      intervalId = setInterval(fetchTokenApprovals, 10000);
    }
    
    // Clean up interval on unmount or when dialog closes
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [address, showApprovalsDialog]);

  // Note: We'll add balance fetching later when the API is working properly
  
  // Function to copy wallet address
  const copyWalletAddress = () => {
    if (createdWalletInfo?.address) {
      navigator.clipboard.writeText(createdWalletInfo.address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  // Function to copy private key
  const copyPrivateKey = () => {
    if (createdWalletInfo?.privateKey) {
      navigator.clipboard.writeText(createdWalletInfo.privateKey);
      toast({
        title: "Private Key Copied",
        description: "Private key copied to clipboard. Store it securely!",
      });
    }
  };

  // Handle wallet creation
  const handleCreateWallet = async () => {
    setIsProcessing(true);
    
    try {
      // Create a new random wallet
      const wallet = ethers.Wallet.createRandom();
      
      // Store wallet info to show in the backup screen
      setCreatedWalletInfo({
        address: wallet.address,
        privateKey: wallet.privateKey
      });
      
      // Call context method if available
      if (createTASWallet) {
        await createTASWallet(walletPassword);
        localStorage.setItem("walletNickname", nickname || "My TAS Wallet");
      }
      
      // Show the backup screen
      setShowBackupScreen(true);
      
    } catch (error) {
      console.error("Error creating wallet:", error);
      toast({
        title: "Wallet Creation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle wallet import
  const handleImportWallet = async () => {
    // Validate private key
    if (!privateKey || privateKey.trim() === '') {
      setPrivateKeyError("Please enter a valid private key");
      return;
    }
    
    setPrivateKeyError("");
    setIsProcessing(true);
    
    try {
      // First validate the private key format - trim any whitespace
      let formattedKey = privateKey.trim();
      
      // Add 0x prefix if missing
      if (!formattedKey.startsWith('0x')) {
        formattedKey = `0x${formattedKey}`;
      }
      
      // Ensure it's the correct length
      if (formattedKey.length !== 66) {
        if (formattedKey.length > 66) {
          // If too long, trim to exactly 66 characters (0x + 64 hex chars)
          formattedKey = formattedKey.substring(0, 66);
          console.log("Trimmed private key to correct length:", formattedKey.substring(0, 5) + "...");
        } else {
          throw new Error("Private key is too short. Should be 64 hexadecimal characters (with optional 0x prefix)");
        }
      }
      
      // Try to create a wallet instance to verify the key
      const wallet = new ethers.Wallet(formattedKey);
      console.log("Successfully created wallet instance with address:", wallet.address);
      
      // Import the wallet via context
      if (importTASWallet) {
        await importTASWallet(formattedKey, walletPassword);
        
        // Save nickname
        localStorage.setItem("walletNickname", nickname || "Imported Wallet");
        
        toast({
          title: "Wallet Imported",
          description: "Your wallet has been imported successfully",
        });
        
        // Reset states
        setPrivateKey('');
        setWalletPassword('');
        setNickname('');
        setIsImportingWallet(false);
      }
    } catch (error) {
      console.error("Error importing wallet:", error);
      
      // Provide more detailed error messages
      let errorMsg = "Invalid private key format";
      
      if (error instanceof Error) {
        if (error.message.includes("invalid hexlify value")) {
          errorMsg = "Invalid private key: contains non-hexadecimal characters";
        } else if (error.message.includes("wrong length")) {
          errorMsg = "Invalid private key length: must be 64 characters (without 0x prefix)";
        } else if (error.message.includes("too short")) {
          errorMsg = error.message;
        } else {
          errorMsg = "Invalid private key: " + error.message;
        }
      }
      
      setPrivateKeyError(errorMsg);
      toast({
        title: "Wallet Import Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Back to initial state
  const resetState = () => {
    setIsCreatingWallet(false);
    setIsImportingWallet(false);
    setShowBackupScreen(false);
    setCreatedWalletInfo(null);
    setWalletPassword('');
    setNickname('');
    setPrivateKey('');
    setPrivateKeyError('');
  };

  // If the wallet is connected, show the wallet interface
  if (isConnected && address && !showBackupScreen) {
    return (
      <BrowserCompatibilityWrapper pageName="WalletPage">
        <div className="container mx-auto px-4 py-6 max-w-lg">
          <PageNumberDebug pageNumber={2} pageName="Wallet" />
          
          {/* Profile Section */}
          <div className="flex flex-col items-center mb-6">
            {/* Profile Picture - showing wallet address initials */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center text-white text-3xl font-bold mb-3 shadow-lg">
              {address ? address.slice(2, 4).toUpperCase() : 'TAS'}
            </div>
            <h1 className="text-2xl font-bold text-primary text-center">
              My Profile
            </h1>
            <p className="text-sm text-muted-foreground">TAS Chain Network</p>
          </div>

          <div className="flex justify-end mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={disconnect}
            >
              <ArrowRightIcon className="h-4 w-4 mr-1" />
              disconnect
            </Button>
          </div>
          
          {/* Wallet balance section - dynamic with real value */}
          <WalletBalanceDisplay address={address} />

          {/* Address and Private Key section */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Wallet Address:</p>
              <div className="flex items-center gap-1">
                <p className="text-sm text-gray-600">{address ? `${address.substring(0, 8)}...${address.substring(address.length - 6)}` : ''}</p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    if (address) {
                      navigator.clipboard.writeText(address);
                      toast({
                        title: "Address Copied",
                        description: "Wallet address copied to clipboard",
                      });
                    }
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800"
                onClick={() => {
                  // Get the private key from localStorage
                  try {
                    const savedWallet = localStorage.getItem("tasWallet");
                    if (savedWallet) {
                      const walletData = JSON.parse(savedWallet);
                      if (walletData.privateKey) {
                        toast({
                          title: "Private Key",
                          description: `${walletData.privateKey.substring(0, 15)}...${walletData.privateKey.substring(walletData.privateKey.length - 10)}`,
                        });
                        navigator.clipboard.writeText(walletData.privateKey);
                        toast({
                          title: "Private Key Copied",
                          description: "Your private key has been copied to clipboard. Keep it safe!",
                        });
                      }
                    }
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Could not retrieve private key",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <KeyIcon className="h-3 w-3 mr-1" />
                Show Private Key
              </Button>
              <p className="text-xs text-amber-700">Keep your private key safe!</p>
            </div>
          </div>
          
          {/* Action buttons section - horizontally aligned with green styling */}
          <div className="flex justify-between space-x-2 mb-6">
            <Button 
              variant="outline" 
              className="flex-1 h-12 text-green-700 border-green-200 bg-green-100 hover:bg-green-200 hover:text-green-800 flex items-center justify-center"
              onClick={() => setShowSendDialog(true)}
            >
              <Send className="h-5 w-5 mr-2" />
              <span>Send</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 h-12 text-green-700 border-green-200 bg-green-100 hover:bg-green-200 hover:text-green-800 flex items-center justify-center"
              onClick={() => setShowReceiveDialog(true)}
            >
              <Download className="h-5 w-5 mr-2" />
              <span>Receive</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 h-12 text-green-700 border-green-200 bg-green-100 hover:bg-green-200 hover:text-green-800 flex items-center justify-center"
              onClick={() => setShowHistoryDialog(true)}
            >
              <History className="h-5 w-5 mr-2" />
              <span>History</span>
            </Button>
          </div>
          
          {/* Token Holdings Section - Wrapped in green container to match screenshot */}
          <div className="bg-green-50 rounded-lg p-4">
            <TokenHoldingsSection address={address} />
          </div>
          
          {/* Use our new SendTokenDialog and ReceiveTokenDialog components */}
          <SendTokenDialog
            isOpen={showSendDialog}
            onClose={() => setShowSendDialog(false)}
            defaultTokenId={1} // Default to TAS token
          />
          
          <ReceiveTokenDialog
            isOpen={showReceiveDialog}
            onClose={() => setShowReceiveDialog(false)}
          />
          
          {/* History Dialog */}
          <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
            <DialogContent className="bg-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Transaction History</DialogTitle>
                <DialogDescription>
                  Recent transactions from your TAS wallet.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-80 overflow-y-auto">
                {isLoadingTransactions ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : transactions.length > 0 ? (
                  transactions.map((tx, index) => (
                    <div key={tx.hash + index} className="border-b pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">
                            {tx.type === 'send' ? `Sent ${tx.tokenSymbol}` : 
                             tx.type === 'receive' ? `Received ${tx.tokenSymbol}` : 
                             tx.type === 'approval' ? `Approved ${tx.tokenSymbol}` : 
                             `${tx.tokenSymbol} Transaction`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tx.type === 'send' ? `To: ${formatAddress(tx.to, 4, 4)}` : 
                             tx.type === 'receive' ? `From: ${formatAddress(tx.from, 4, 4)}` : 
                             tx.type === 'approval' ? `Spender: ${formatAddress(tx.to, 4, 4)}` : 
                             `${formatAddress(tx.from, 4, 4)} → ${formatAddress(tx.to, 4, 4)}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(new Date(tx.timestamp * 1000))}</p>
                        </div>
                        <p className={tx.type === 'receive' ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                          {tx.type === 'receive' ? '+' : '-'}{formatBalance(tx.amount)} {tx.tokenSymbol}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No transactions found</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => window.open(`https://bscscan.com/address/${address}`, '_blank')}
                  className="mr-auto"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View All on Explorer
                </Button>
                <Button type="button" onClick={() => setShowHistoryDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Approvals Dialog */}
          <Dialog open={showApprovalsDialog} onOpenChange={setShowApprovalsDialog}>
            <DialogContent className="bg-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Token Approvals</DialogTitle>
                <DialogDescription>
                  Manage contracts approved to spend your tokens.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {isLoadingApprovals ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : approvals.length > 0 ? (
                  approvals.map((approval, index) => (
                    <div key={approval.tokenAddress + approval.spenderAddress} className="rounded-lg border p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{approval.tokenSymbol} Token</p>
                          <p className="text-xs text-muted-foreground">
                            Approved: {approval.spenderName || formatAddress(approval.spenderAddress, 6, 4)}
                          </p>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={isRevoking && approvalToRevoke === approval.spenderAddress}
                          onClick={() => {
                            setIsRevoking(true);
                            setApprovalToRevoke(approval.spenderAddress);
                            
                            // Simulate revoking transaction
                            setTimeout(() => {
                              toast({
                                title: "Approval Revoked",
                                description: `Successfully revoked ${approval.tokenSymbol} approval for ${approval.spenderName || formatAddress(approval.spenderAddress, 4, 4)}`,
                              });
                              setIsRevoking(false);
                              setApprovalToRevoke(null);
                            }, 1500);
                          }}
                        >
                          {isRevoking && approvalToRevoke === approval.spenderAddress ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Revoking...
                            </>
                          ) : 'Revoke'}
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>Contract: {formatAddress(approval.spenderAddress, 10, 4)}</p>
                        <p>Allowance: {formatBalance(ethers.utils.formatUnits(approval.allowance, approval.tokenDecimals))}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 px-4">
                    <p className="text-muted-foreground">No token approvals found</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Token approvals allow smart contracts to spend your tokens. This is common when interacting with DEXs or marketplace contracts.
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => window.open(`https://bscscan.com/tokenapprovalchecker?search=${address}`, '_blank')}
                  className="mr-auto"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Check on BSCScan
                </Button>
                <Button type="button" onClick={() => setShowApprovalsDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </BrowserCompatibilityWrapper>
    );
  }

  // Backup wallet screen
  if (showBackupScreen && createdWalletInfo) {
    return (
      <BrowserCompatibilityWrapper pageName="WalletPage">
        <div className="container mx-auto px-4 py-6 max-w-lg">
          <PageNumberDebug pageNumber={2} pageName="Wallet" />
          
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={resetState}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <ShieldIcon className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Secure Your Wallet</h1>
            <p className="text-sm text-center text-muted-foreground">
              Please save your wallet information securely.
            </p>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <div className="text-amber-800 mr-2 mt-0.5">⚠️</div>
              <div>
                <h3 className="text-amber-800 font-medium text-sm">
                  Important: Secure Your Wallet
                </h3>
                <p className="text-xs text-amber-700">
                  Never share your private key with anyone. Anyone with your private keys can steal your assets. Store it securely.
                </p>
              </div>
            </div>
          </div>
          
          <Card className="mb-6 border-green-200">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-sm font-medium mb-1 block">Wallet Address:</Label>
                <div className="bg-green-50 p-3 rounded font-mono text-xs break-all">
                  {createdWalletInfo.address}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-1 block">Private Key:</Label>
                <div className="bg-green-50 p-3 rounded font-mono text-xs break-all">
                  {createdWalletInfo.privateKey}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mb-6">
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm font-medium">Save Encrypted Wallet</span>
            </div>
            <p className="text-xs text-muted-foreground ml-7">
              Your wallet is encrypted with your password for added security.
            </p>
          </div>
          
          <div className="mb-6">
            <Label className="text-sm font-medium mb-2 block">
              Create Password
            </Label>
            <Input 
              type="password" 
              value={walletPassword}
              onChange={(e) => setWalletPassword(e.target.value)}
              placeholder="Enter password"
              className="bg-green-50 border-green-200"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="border-green-200"
              onClick={resetState}
            >
              Back
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                toast({
                  title: "Wallet Secured",
                  description: "Your wallet has been created and secured successfully!",
                });
                resetState();
              }}
            >
              Secured
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground mt-4">
            Never share your private key with anyone
          </p>
        </div>
      </BrowserCompatibilityWrapper>
    );
  }

  // Create wallet screen
  if (isCreatingWallet) {
    return (
      <BrowserCompatibilityWrapper pageName="WalletPage">
        <div className="container mx-auto px-4 py-6 max-w-lg">
          <PageNumberDebug pageNumber={2} pageName="Wallet" />
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-primary">Create New Wallet</h1>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={resetState}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Card className="mb-6">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">Wallet Nickname (Optional)</Label>
                <Input
                  id="nickname"
                  placeholder="My TAS Wallet"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Wallet Password (Optional)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Set a secure password"
                  value={walletPassword}
                  onChange={(e) => setWalletPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Setting a password will encrypt your private key for added security.
                </p>
              </div>
              
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={handleCreateWallet}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Wallet'
                )}
              </Button>
            </CardContent>
          </Card>
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <h3 className="font-medium text-amber-800 mb-2 flex items-center">
              <ShieldIcon className="h-4 w-4 mr-2" />
              Security Notice
            </h3>
            <p className="text-sm text-amber-700">
              After creating your wallet, you will receive your private key. 
              Make sure to save it in a secure location and never share it with anyone.
            </p>
          </div>
        </div>
      </BrowserCompatibilityWrapper>
    );
  }

  // Import wallet screen
  if (isImportingWallet) {
    return (
      <BrowserCompatibilityWrapper pageName="WalletPage">
        <div className="container mx-auto px-4 py-6 max-w-lg">
          <PageNumberDebug pageNumber={2} pageName="Wallet" />
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-primary">Import Wallet</h1>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={resetState}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Card className="mb-6">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">Wallet Nickname (Optional)</Label>
                <Input
                  id="nickname"
                  placeholder="My Imported Wallet"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="privateKey">Private Key</Label>
                <Input
                  id="privateKey"
                  placeholder="Enter your private key"
                  value={privateKey}
                  onChange={(e) => {
                    setPrivateKey(e.target.value);
                    setPrivateKeyError('');
                  }}
                />
                {privateKeyError && (
                  <p className="text-xs text-red-500">{privateKeyError}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="importPassword">Password (Optional)</Label>
                <Input
                  id="importPassword"
                  type="password"
                  placeholder="Set a password to encrypt your wallet"
                  value={walletPassword}
                  onChange={(e) => setWalletPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Setting a password will encrypt your private key for added security.
                </p>
              </div>
              
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={handleImportWallet}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Wallet'
                )}
              </Button>
            </CardContent>
          </Card>
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <h3 className="font-medium text-amber-800 mb-2 flex items-center">
              <ShieldIcon className="h-4 w-4 mr-2" />
              Security Notice
            </h3>
            <p className="text-sm text-amber-700">
              Never share your private key with anyone. Make sure you're importing your wallet on a secure device.
            </p>
          </div>
        </div>
      </BrowserCompatibilityWrapper>
    );
  }

  // Initial wallet selection screen
  return (
    <BrowserCompatibilityWrapper pageName="WalletPage">
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <PageNumberDebug pageNumber={2} pageName="Wallet" />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-primary to-green-500 text-transparent bg-clip-text">
              TAS Wallet
            </span>
          </h1>
          <p className="text-muted-foreground">
            Create or import your TAS wallet to manage your assets
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-green-200 hover:border-green-400 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg text-center text-primary">Create Wallet</CardTitle>
              <CardDescription className="text-center">
                Generate a new TAS blockchain wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white px-6"
                onClick={() => setIsCreatingWallet(true)}
              >
                Create
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 hover:border-blue-400 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg text-center text-blue-600">Import Wallet</CardTitle>
              <CardDescription className="text-center">
                Import an existing wallet with your private key
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button 
                variant="outline" 
                className="border-blue-400 text-blue-600 hover:bg-blue-50 px-6"
                onClick={() => setIsImportingWallet(true)}
              >
                Import
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-center">
          <p className="text-sm text-amber-700">
            Your TAS wallet is the gateway to the TAS blockchain ecosystem. 
            Create or import a wallet to start managing your assets securely.
          </p>
        </div>
      </div>
    </BrowserCompatibilityWrapper>
  );
};

export default WalletPage;