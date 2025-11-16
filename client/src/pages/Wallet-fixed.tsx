import React, { useState, useEffect } from 'react';
import BrowserCompatibilityWrapper from '@/components/BrowserCompatibilityWrapper';
import PageNumberDebug from '@/components/PageNumberDebug';
import TASWalletBackupDialog from '@/components/TASWalletBackupDialog';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  ArrowDown, 
  ArrowUp, 
  ClipboardCopy,
  QrCode, 
  Copy,
  RefreshCw,
  ShieldCheck,
  Wallet as WalletIcon,
  SendHorizontal,
  Download,
  History,
  X,
  Wallet,
  Key
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ethers } from "ethers";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface Transaction {
  id: number;
  hash: string;
  type: 'send' | 'receive';
  amount: number;
  token: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  fromAddress?: string;
  toAddress?: string;
}

interface Token {
  id: number;
  name: string;
  symbol: string;
  balance: string;
  price: number;
  value: number;
  network: string;
  contractAddress: string;
  iconUrl?: string;
  priceChange?: string;
}

const WalletPage = () => {
  // Add browser detector
  const [browserInfo, setBrowserInfo] = useState({
    name: 'unknown',
    isMobile: false,
    version: 'unknown',
  });

  useEffect(() => {
    // Simple browser detection
    const ua = window.navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isChrome = /chrome/i.test(ua) && !/edge|edg/i.test(ua);
    const isFirefox = /firefox/i.test(ua);
    const isEdge = /edge|edg/i.test(ua);

    let browserName = 'unknown';
    let version = 'unknown';

    if (isSafari) {
      browserName = 'safari';
      const match = ua.match(/Version\/(\d+)/);
      version = match ? match[1] : 'unknown';
    } else if (isChrome) {
      browserName = 'chrome';
      const match = ua.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'unknown';
    } else if (isFirefox) {
      browserName = 'firefox';
      const match = ua.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'unknown';
    } else if (isEdge) {
      browserName = 'edge';
      const match = ua.match(/Edge\/(\d+)|Edg\/(\d+)/);
      version = match ? (match[1] || match[2]) : 'unknown';
    }

    console.log(`[WALLET PAGE] Browser detected: ${browserName} ${version} (Mobile: ${isMobile})`);
    setBrowserInfo({ name: browserName, isMobile, version });
  }, []);

  const { translate } = useLanguage();
  const { toast } = useToast();
  const { 
    isConnected, 
    address, 
    openConnectModal, 
    hasTasWallet, 
    tasWalletAddress, 
    walletType,
    createTASWallet,
    importTASWallet,
    isCreatingWallet,
    disconnect
  } = useWallet();
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('tokens');
  const [profileTab, setProfileTab] = useState('wallet');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  
  // Generate timestamp for cache busting
  const timestamp = Date.now();
  
  // External wallet data from the API with timestamp for cache busting
  const { data: walletData, isLoading: isWalletDataLoading, refetch: refreshWalletData } = useQuery({
    queryKey: ['/api/wallet/tokens', timestamp],
    queryFn: async () => {
      console.log('[WALLET] Fetching wallet data with timestamp:', timestamp);
      const response = await apiRequest('GET', `/api/wallet/tokens?t=${timestamp}`);
      if (!response.ok) {
        throw new Error('Failed to fetch wallet data');
      }
      return response.json();
    },
    enabled: isConnected,
  });
  
  // Transaction history from the API
  const { data: transactionHistory, isLoading: isTransactionHistoryLoading } = useQuery({
    queryKey: ['/api/wallet/transactions', timestamp],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/wallet/transactions?t=${timestamp}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }
      return response.json();
    },
    enabled: isConnected && activeTab === 'history',
  });
  
  // Send token mutation
  const sendTokenMutation = useMutation({
    mutationFn: async ({ token, amount, address }: { token: string, amount: string, address: string }) => {
      const response = await apiRequest('POST', '/api/wallet/send', {
        token,
        amount,
        address
      });
      
      if (!response.ok) {
        throw new Error('Failed to send tokens');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Token Sent Successfully",
        description: "Your tokens have been sent successfully.",
      });
      setIsSendDialogOpen(false);
      setAmount('');
      setRecipientAddress('');
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/tokens'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/transactions'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Tokens",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getTotalWalletValue = () => {
    if (walletData?.tokens && Array.isArray(walletData.tokens)) {
      return walletData.tokens.reduce((total: number, token: Token) => total + token.value, 0);
    }
    return 0;
  };
  
  const handleSendToken = () => {
    if (!selectedToken || !amount || !recipientAddress) return;
    
    sendTokenMutation.mutate({
      token: selectedToken.symbol,
      amount: amount,
      address: recipientAddress
    });
  };
  
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Address has been copied to clipboard",
      });
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };
  
  const getTokenLogo = (token: Token) => {
    if (token.iconUrl) {
      return token.iconUrl;
    }
    
    // Default logos based on symbol
    switch (token.symbol.toLowerCase()) {
      case 'tas':
        return '/assets/icons/tas-token.png';
      case 'bnb':
        return '/assets/icons/bnb.png';
      case 'eth':
        return '/assets/icons/eth.png';
      default:
        return '/assets/icons/token-default.png';
    }
  };
  
  // States for wallet creation/import
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [nickname, setNickname] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [isWalletCreating, setIsWalletCreating] = useState(false);
  const [createdWalletInfo, setCreatedWalletInfo] = useState<{
    address: string;
    privateKey: string;
  } | null>(null);
  const [privateKeyError, setPrivateKeyError] = useState('');

  // Handle simple wallet creation
  const handleCreateWallet = async () => {
    if (!nickname || nickname.trim() === '') {
      toast({
        title: "Nickname Required",
        description: "Please enter a nickname for your wallet",
        variant: "destructive",
      });
      return;
    }
    
    console.log("[Wallet] Creating wallet with nickname:", nickname);
    
    // Generate a new wallet directly using ethers.js
    try {
      // Set creating state
      setIsWalletCreating(true);
      
      // Create a new random wallet
      const wallet = ethers.Wallet.createRandom();
      const walletAddress = wallet.address;
      const walletPrivateKey = wallet.privateKey;
      
      // Store wallet info temporarily to show in the backup dialog
      setCreatedWalletInfo({
        address: walletAddress,
        privateKey: walletPrivateKey
      });
      
      // Register wallet with context
      if (createTASWallet) {
        try {
          await createTASWallet('');
          
          // Store nickname in local storage
          localStorage.setItem("walletNickname", nickname);
          
          // Show success message
          toast({
            title: "Wallet Created",
            description: "Your TAS wallet has been created successfully!",
          });
          
          // Show the backup dialog
          setIsCreatingNew(false);
          setShowBackupDialog(true);
        } catch (error) {
          console.error("Error registering wallet with context:", error);
          toast({
            title: "Error Registering Wallet",
            description: "Wallet created but couldn't be registered with the system",
            variant: "destructive",
          });
          // Still show the backup dialog
          setIsCreatingNew(false);
          setShowBackupDialog(true);
        }
      } else {
        // No context available, just show the backup dialog
        setIsCreatingNew(false);
        setShowBackupDialog(true);
      }
      
      setIsWalletCreating(false);
    } catch (error) {
      console.error("Error creating wallet:", error);
      toast({
        title: "Wallet Creation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setIsWalletCreating(false);
    }
  };
  
  // Handle import wallet
  const handleImportWallet = async () => {
    // Validate private key
    if (!privateKey || privateKey.length < 64) {
      setPrivateKeyError("Please enter a valid private key");
      return;
    }
    
    if (!nickname || nickname.trim() === '') {
      toast({
        title: "Nickname Required",
        description: "Please enter a nickname for your wallet",
        variant: "destructive",
      });
      return;
    }
    
    setPrivateKeyError("");
    setIsWalletCreating(true);
    
    // Call the importTASWallet function from context
    if (importTASWallet) {
      try {
        await importTASWallet(privateKey, "");
        
        // Save nickname with wallet
        localStorage.setItem("walletNickname", nickname);
        
        toast({
          title: "Wallet Imported",
          description: "Your wallet has been imported successfully",
        });
        
        // Clear form and close import dialog
        setIsImporting(false);
        setPrivateKey('');
        setNickname('');
        setIsWalletCreating(false);
      } catch (error) {
        console.error("Error importing wallet:", error);
        toast({
          title: "Wallet Import Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
        setIsWalletCreating(false);
      }
    } else {
      toast({
        title: "Function Not Available",
        description: "Wallet import function is not available",
        variant: "destructive",
      });
      setIsWalletCreating(false);
    }
  };

  // If wallet is not connected
  if (!isConnected) {
    return (
      <BrowserCompatibilityWrapper pageName="WalletPage">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <PageNumberDebug pageNumber={2} pageName="Wallet" />
          
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-sky-500 text-transparent bg-clip-text">
                TAS Wallet
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Create, import, or connect your TAS wallet to manage assets and track transactions
            </p>
          </div>
          
          {/* Create Wallet Card */}
          {isCreatingNew ? (
            <Card className="mb-6 border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-sky-100/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-primary">Create New Wallet</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setIsCreatingNew(false);
                      setCreatedWalletInfo(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Create a new TAS blockchain wallet
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="nickname" className="text-sm font-medium">
                      Wallet Nickname
                    </label>
                    <Input
                      id="nickname"
                      placeholder="My TAS Wallet"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                  </div>
                  
                  <div className="pt-2">
                    <Button
                      className="w-full bg-gradient-to-r from-primary to-sky-500 text-white"
                      onClick={handleCreateWallet}
                      disabled={isWalletCreating}
                    >
                      {isWalletCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Wallet'
                      )}
                    </Button>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <h4 className="font-medium text-amber-800 flex items-center gap-2 mb-2">
                      <ShieldCheck className="h-4 w-4" />
                      Security Notice
                    </h4>
                    <p className="text-sm text-amber-700">
                      After creating your wallet, you will receive your private key. Make sure to save it in a secure location.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : isImporting ? (
            <Card className="mb-6 border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-sky-100/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-primary">Import Existing Wallet</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsImporting(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Import an existing TAS wallet using your private key
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="nickname" className="text-sm font-medium">
                      Wallet Nickname
                    </label>
                    <Input
                      id="nickname"
                      placeholder="My TAS Wallet"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="privateKey" className="text-sm font-medium">
                      Private Key
                    </label>
                    <Input
                      id="privateKey"
                      placeholder="Enter your private key"
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                    />
                    {privateKeyError && (
                      <p className="text-xs text-red-500">{privateKeyError}</p>
                    )}
                  </div>
                  
                  <div className="pt-2">
                    <Button
                      className="w-full bg-gradient-to-r from-primary to-sky-500 text-white"
                      onClick={handleImportWallet}
                      disabled={isWalletCreating}
                    >
                      {isWalletCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        'Import Wallet'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="text-center border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-sky-100/20">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <WalletIcon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Create New Wallet</CardTitle>
                  <CardDescription>
                    Create a new TAS blockchain wallet
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 pb-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate a new TAS wallet to manage your tokens and interact with the TAS ecosystem.
                  </p>
                  <Button
                    className="bg-gradient-to-r from-primary to-sky-500 text-white"
                    onClick={() => setIsCreatingNew(true)}
                  >
                    Create Wallet
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="text-center border-blue-500/20">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-sky-100/20">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Key className="h-8 w-8 text-blue-500" />
                  </div>
                  <CardTitle>Import Existing Wallet</CardTitle>
                  <CardDescription>
                    Import an existing TAS wallet
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 pb-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Import an existing TAS wallet using your private key to access your assets.
                  </p>
                  <Button
                    variant="outline"
                    className="border-blue-500/50 text-blue-600 hover:bg-blue-50"
                    onClick={() => setIsImporting(true)}
                  >
                    Import Wallet
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          
          <Card className="text-center border-primary/10 mb-6">
            <CardHeader>
              <CardTitle>Connect Existing Wallet</CardTitle>
              <CardDescription>
                Connect with your Web3 wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Connect your MetaMask, Trust Wallet, or other Web3 wallets to access the TAS platform.
              </p>
              <Button 
                onClick={openConnectModal} 
                className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white"
              >
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
          
          {/* Wallet Backup Dialog */}
          {createdWalletInfo && (
            <TASWalletBackupDialog
              open={showBackupDialog}
              onOpenChange={setShowBackupDialog}
              walletAddress={createdWalletInfo.address}
              privateKey={createdWalletInfo.privateKey}
            />
          )}
        </div>
      </BrowserCompatibilityWrapper>
    );
  }

  // Show loading state
  if (isWalletDataLoading) {
    return (
      <BrowserCompatibilityWrapper pageName="WalletPage">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <PageNumberDebug pageNumber={2} pageName="Wallet" />
          
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-sky-500 text-transparent bg-clip-text">
                {translate("wallet_title") || "My Wallet"}
              </span>
            </h1>
          </div>
          <Card className="border-primary/20">
            <CardContent className="pt-6 flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-primary font-medium">Loading wallet data...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </BrowserCompatibilityWrapper>
    );
  }
  
  // Main wallet view
  return (
    <BrowserCompatibilityWrapper pageName="WalletPage">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <PageNumberDebug pageNumber={2} pageName="Wallet" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">
              {walletType || "My Wallet"}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex items-center text-sm gap-1.5"
              onClick={() => refreshWalletData()}
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex items-center text-sm gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {formatAddress(address || '')}
              <Copy className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => address && copyToClipboard(address)} 
              />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex items-center text-sm gap-1.5 ml-2"
              onClick={() => {
                disconnect && disconnect();
                toast({
                  title: "Wallet Disconnected",
                  description: "Your wallet has been disconnected successfully",
                });
              }}
            >
              Disconnect
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="wallet" value={profileTab} onValueChange={setProfileTab} className="mb-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {profileTab === 'wallet' && (
          <div>
            <div className="mb-6">
              <Card className="overflow-hidden border-none shadow-md bg-white relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-sky-500"></div>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h2 className="text-3xl md:text-4xl font-bold">
                      ${getTotalWalletValue().toFixed(2)}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {translate("wallet_balance") || "Total Balance"}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        if (walletData?.tokens?.length > 0) {
                          setSelectedToken(walletData.tokens[0]);
                          setIsSendDialogOpen(true);
                        }
                      }}
                    >
                      <SendHorizontal className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setIsReceiveDialogOpen(true)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Receive
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setIsBackupDialogOpen(true)}
                    >
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Backup
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue="tokens" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="tokens">My Tokens</TabsTrigger>
                <TabsTrigger value="history">Transaction History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tokens" className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {walletData?.tokens && walletData.tokens.map((token: Token) => (
                        <div 
                          key={token.id} 
                          className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setSelectedToken(token);
                            setIsSendDialogOpen(true);
                          }}
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                              <img 
                                src={getTokenLogo(token)} 
                                alt={token.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback for broken images
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/assets/icons/token-default.png';
                                }}
                              />
                            </div>
                            <div>
                              <div className="font-medium">{token.symbol}</div>
                              <div className="text-sm text-muted-foreground">{token.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div>{token.balance}</div>
                            <div className="text-sm text-muted-foreground">
                              ${token.value.toFixed(2)}
                              {token.priceChange && (
                                <Badge 
                                  variant="outline" 
                                  className={`ml-2 ${
                                    token.priceChange.startsWith('+') 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {token.priceChange}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {(!walletData?.tokens || walletData.tokens.length === 0) && (
                        <div className="p-8 text-center">
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <WalletIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">No Tokens</h3>
                          <p className="text-muted-foreground max-w-sm mx-auto">
                            You don't have any tokens in your wallet yet. 
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="history">
                <Card className="border-none shadow-sm">
                  <CardContent className="p-0">
                    {isTransactionHistoryLoading ? (
                      <div className="p-6 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                        <p>Loading transaction history...</p>
                      </div>
                    ) : transactionHistory?.transactions?.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Token</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactionHistory?.transactions && Array.isArray(transactionHistory.transactions) ? transactionHistory.transactions.map((tx: Transaction) => (
                            <TableRow key={tx.id}>
                              <TableCell>
                                <div className="font-medium">{tx.token}</div>
                              </TableCell>
                              <TableCell>{tx.amount}</TableCell>
                              <TableCell>
                                <Badge variant={tx.type === 'receive' ? 'outline' : 'secondary'}>
                                  {tx.type === 'receive' ? 'Received' : 'Sent'}
                                </Badge>
                              </TableCell>
                              <TableCell>{new Date(tx.timestamp).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  tx.status === 'completed' ? 'default' : 
                                  tx.status === 'pending' ? 'outline' : 'destructive'
                                }>
                                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )) : null}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <History className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No Transactions</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                          You haven't made any transactions yet. Send or receive tokens to see them here.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {profileTab === 'profile' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Your public profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <WalletIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">{nickname || "TAS User"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatAddress(address || '')}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="border rounded-md p-4 text-center">
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                  <p className="text-2xl font-bold">{transactionHistory?.transactions?.length || 0}</p>
                </div>
                <div className="border rounded-md p-4 text-center">
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold">${getTotalWalletValue().toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {profileTab === 'settings' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Wallet Settings</CardTitle>
              <CardDescription>Manage your wallet preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-medium mb-2">Security</h3>
                <Button 
                  variant="outline" 
                  onClick={() => setIsBackupDialogOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Backup Wallet
                </Button>
              </div>
              
              <div className="border-b pb-4">
                <h3 className="font-medium mb-2">Wallet Connection</h3>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    disconnect && disconnect();
                    toast({
                      title: "Wallet Disconnected",
                      description: "Your wallet has been disconnected successfully",
                    });
                  }}
                  className="w-full sm:w-auto"
                >
                  Disconnect Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Send Dialog */}
        <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send {selectedToken?.symbol}</DialogTitle>
              <DialogDescription>
                Enter the recipient address and amount to send
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="recipient" className="text-sm font-medium">
                  Recipient Address
                </label>
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="amount" className="text-sm font-medium">
                  Amount
                </label>
                <Input
                  id="amount"
                  placeholder="0.00"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {selectedToken && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <div>Available: {selectedToken.balance} {selectedToken.symbol}</div>
                    <div>
                      <button
                        type="button"
                        className="underline text-primary"
                        onClick={() => setAmount(selectedToken.balance.toString())}
                      >
                        Max
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendToken}
                disabled={!amount || !recipientAddress || sendTokenMutation.isPending}
              >
                {sendTokenMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Receive Dialog */}
        <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Receive Tokens</DialogTitle>
              <DialogDescription>
                Share your wallet address to receive tokens
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center p-4">
              {showQRCode ? (
                <>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`}
                    alt="Wallet QR Code"
                    className="mb-4 border p-2 rounded"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQRCode(false)}
                  >
                    Show Address
                  </Button>
                </>
              ) : (
                <>
                  <div className="mb-4 p-4 bg-gray-50 rounded-md w-full break-all text-center font-mono">
                    {address}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => address && copyToClipboard(address)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Address
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQRCode(true)}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Show QR Code
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Backup Dialog */}
        <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Backup Wallet</DialogTitle>
              <DialogDescription>
                Save your wallet details to secure your funds
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="p-4 bg-amber-50 rounded-md text-amber-800 text-sm">
                <h4 className="font-semibold mb-2 flex items-center">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Important Security Warning
                </h4>
                <p>
                  Your private key gives full access to your wallet. Never share it with anyone 
                  and keep it in a secure location.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Wallet Address</label>
                <div className="flex">
                  <div className="flex-1 bg-gray-50 p-2 rounded-l-md font-mono text-sm truncate">
                    {address}
                  </div>
                  <Button 
                    variant="outline" 
                    className="rounded-l-none"
                    onClick={() => address && copyToClipboard(address)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {!showQRCode ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowQRCode(true)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Show QR Code
                </Button>
              ) : (
                <div className="flex flex-col items-center pb-2">
                  <div className="bg-white p-4 rounded-lg border mb-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`}
                      alt="Wallet Address QR Code"
                      className="w-40 h-40"
                    />
                  </div>
                  <p className="text-sm text-center text-muted-foreground mb-2">
                    Scan this QR code to get your wallet address
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQRCode(false)}
                  >
                    Hide QR Code
                  </Button>
                </div>
              )}
              
              {!showPrivateKey ? (
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => setShowPrivateKey(true)}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Reveal Private Key
                </Button>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center justify-between">
                      <span>Private Key</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => createdWalletInfo?.privateKey && copyToClipboard(createdWalletInfo.privateKey)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </label>
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm font-mono break-all">
                      {createdWalletInfo?.privateKey}
                    </div>
                    <p className="text-xs text-red-500 font-medium">
                      IMPORTANT: Save this private key. It cannot be recovered if lost!
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowPrivateKey(false)}
                  >
                    Hide Private Key
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Wallet Backup Dialog */}
        {createdWalletInfo && (
          <TASWalletBackupDialog
            open={showBackupDialog}
            onOpenChange={setShowBackupDialog}
            walletAddress={createdWalletInfo.address}
            privateKey={createdWalletInfo.privateKey}
          />
        )}
      </div>
    </BrowserCompatibilityWrapper>
  );
};

export default WalletPage;