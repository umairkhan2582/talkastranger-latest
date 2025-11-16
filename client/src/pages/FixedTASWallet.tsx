import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  ArrowDown, 
  ArrowUp, 
  ClipboardCopy, 
  ExternalLink, 
  Copy,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Bell,
  BellOff,
  WalletIcon,
  QrCode,
  User,
  Check,
  ArrowLeft,
  Plus,
  SearchX,
  History,
  Coins,
  Key,
  Lock,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ethers } from "ethers";

const TASWallet = () => {
  const { translate } = useLanguage();
  const { isConnected, hasTasWallet, tasWalletAddress, address, openConnectModal } = useWallet();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tasBalance, setTasBalance] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("balance");
  const [sendRecipient, setSendRecipient] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isPriceAlertOpen, setIsPriceAlertOpen] = useState(false);
  const [priceAlertValue, setPriceAlertValue] = useState("");
  
  // Fetch any transactions this wallet has made
  const { data: transactionsData } = useQuery({
    queryKey: ['/api/wallet/transactions'],
    queryFn: async () => {
      if (!hasTasWallet) return { transactions: [] };
      const response = await apiRequest('GET', '/api/wallet/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
    enabled: isConnected && hasTasWallet,
  });
  
  // Fetch tokens owned by this wallet
  const { data: tokensData } = useQuery({
    queryKey: ['/api/wallet/tokens'],
    queryFn: async () => {
      if (!hasTasWallet) return { tokens: [] };
      const response = await apiRequest('GET', '/api/wallet/tokens');
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
      }
      return response.json();
    },
    enabled: isConnected && hasTasWallet,
  });
  
  // Fetch user-created tokens
  const { data: createdTokensData } = useQuery({
    queryKey: ['/api/wallet/created-tokens'],
    queryFn: async () => {
      if (!hasTasWallet) return { tokens: [] };
      const response = await apiRequest('GET', '/api/wallet/created-tokens');
      if (!response.ok) {
        throw new Error('Failed to fetch created tokens');
      }
      return response.json();
    },
    enabled: isConnected && hasTasWallet,
  });
  
  // Fetch TAS balance
  useEffect(() => {
    if (isConnected && hasTasWallet && tasWalletAddress) {
      fetchTASBalance();
    }
  }, [isConnected, hasTasWallet, tasWalletAddress]);
  
  // Initialize transaction history from data
  useEffect(() => {
    if (transactionsData?.transactions) {
      setTransactionHistory(transactionsData.transactions);
    }
  }, [transactionsData]);

  // Function to fetch TAS token balance
  const fetchTASBalance = async () => {
    try {
      console.log("Fetching TAS balance for address:", tasWalletAddress);
      
      // Get TAS contract address (this would come from your app configuration)
      const TASTokenAddress = "0xd9541b134b1821736bd323135b8844d3ae408216";
      console.log("Using TAS Token contract address:", TASTokenAddress);
      
      // Connect to TAS token contract
      const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
      const tokenContract = new ethers.Contract(
        TASTokenAddress,
        [
          "function balanceOf(address owner) view returns (uint256)",
          "function decimals() view returns (uint8)",
        ],
        provider
      );
      
      console.log("TAS Token contract initialized successfully");
      
      // Get token decimals
      const decimals = 18; // Default to 18 if not specified
      
      // Get balance
      const balance = await tokenContract.balanceOf(tasWalletAddress);
      console.log("Raw balance retrieved from contract:", balance.toString());
      
      // Format balance with proper decimals
      const formattedBalance = ethers.utils.formatUnits(balance, decimals);
      console.log("Formatted TAS balance:", formattedBalance);
      
      setTasBalance(formattedBalance);
    } catch (error) {
      console.error("Error checking TAS wallet status:", error);
      setTasBalance("0.0");
    }
  };
  
  // Send TAS tokens
  const handleSendTokens = async () => {
    if (!sendRecipient || !sendAmount || !hasTasWallet) {
      toast({
        title: "Invalid Transaction",
        description: "Please enter a valid recipient address and amount",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // This would be a real transaction in production
      // For demo purposes, we'll just simulate it
      
      setTimeout(() => {
        // Show success toast
        toast({
          title: "Transaction Successful",
          description: `Sent ${sendAmount} TAS to ${sendRecipient.substring(0, 10)}...`,
        });
        
        // Reset form
        setSendRecipient("");
        setSendAmount("");
        
        // Add to transaction history
        const newTransaction = {
          id: Date.now(),
          hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          type: 'send',
          amount: parseFloat(sendAmount),
          token: 'TAS',
          timestamp: new Date().toISOString(),
          status: 'completed',
          toAddress: sendRecipient,
        };
        
        setTransactionHistory([newTransaction, ...transactionHistory]);
        
        // Update balance
        if (tasBalance) {
          const newBalance = parseFloat(tasBalance) - parseFloat(sendAmount);
          setTasBalance(Math.max(0, newBalance).toFixed(2));
        }
        
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error("Error sending tokens:", error);
      toast({
        title: "Transaction Failed",
        description: "There was an error processing your transaction",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  // Copy address to clipboard
  const copyToClipboard = () => {
    if (tasWalletAddress) {
      navigator.clipboard.writeText(tasWalletAddress);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };
  
  // Toggle QR code visibility
  const toggleQRCode = () => {
    setShowQRCode(!showQRCode);
  };
  
  // Set price alert
  const handleSetPriceAlert = () => {
    if (!priceAlertValue || isNaN(parseFloat(priceAlertValue))) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price for your alert",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Price Alert Set",
      description: `You'll be notified when TAS reaches $${priceAlertValue}`,
    });
    
    // Close dialog
    setIsPriceAlertOpen(false);
  };

  // If not connected to wallet, show connect prompt
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-sky-500 text-transparent bg-clip-text">
              TAS Wallet
            </span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Manage your TAS Chain assets, send and receive tokens, and track your transaction history
          </p>
        </div>
        
        <Card className="border-primary/20 mb-8">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-sky-50 border-b border-primary/20">
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              You need to connect your wallet to access your TAS Chain assets
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <WalletIcon className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Wallet Connected</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Connect your wallet to view your TAS Chain assets, send and receive tokens, and manage your transaction history
              </p>
              <Button 
                onClick={openConnectModal}
                className="bg-gradient-to-r from-primary to-sky-500 text-white"
              >
                Connect Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If connected but doesn't have a TAS wallet, prompt to create one
  if (!hasTasWallet) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-sky-500 text-transparent bg-clip-text">
              TAS Wallet
            </span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Manage your TAS Chain assets, send and receive tokens, and track your transaction history
          </p>
        </div>
        
        <Card className="border-primary/20 mb-8">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-sky-50 border-b border-primary/20">
            <CardTitle>Create Your TAS Wallet</CardTitle>
            <CardDescription>
              You need to create a TAS Chain wallet to interact with the TAS ecosystem
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex">
                <div className="mr-4">
                  <div className="bg-blue-100 rounded-full p-2">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-blue-800 mb-1">TAS</h3>
                  <p className="text-sm text-blue-700 mb-1">Your Connected Wallet</p>
                  <p className="text-xs font-mono text-blue-600">{address}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg mb-6">
              <p className="text-sm text-amber-800">
                Currently using external wallet. Create a TAS wallet to access TAS Chain features.
              </p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start">
                <div className="bg-green-100 p-1 rounded-full mr-3 mt-0.5">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm">Store and manage TAS Chain tokens</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-green-100 p-1 rounded-full mr-3 mt-0.5">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm">Send and receive TAS tokens with low fees</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-green-100 p-1 rounded-full mr-3 mt-0.5">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm">Create and trade custom tokens on TAS Chain</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={openConnectModal}
                className="flex-1 bg-gradient-to-r from-primary to-sky-500 text-white"
              >
                Create TAS Wallet
              </Button>
              
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Full wallet view with balance and functionality
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-primary to-sky-500 text-transparent bg-clip-text">
            TAS Wallet
          </span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Manage your TAS Chain assets, send and receive tokens, and track your transaction history
        </p>
      </div>
      
      {/* Wallet Overview Card */}
      <Card className="border-primary/20 mb-8">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-sky-50 border-b border-primary/20">
          <CardTitle>TAS Chain Wallet</CardTitle>
          <CardDescription>
            Your TAS Chain wallet balance and address
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row mb-6">
            <div className="md:w-1/2 mb-6 md:mb-0 md:pr-6">
              <div className="mb-2">
                <div className="text-sm text-muted-foreground mb-1">Total Balance</div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">{tasBalance || "0.0"}</span>
                  <span className="ml-2 text-lg">TAS</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {tasBalance ? `≈ $${(parseFloat(tasBalance) * 0.001).toFixed(3)} USD` : "$0.00 USD"}
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">TAS Price</span>
                  <Badge 
                    variant="outline" 
                    className="bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer"
                    onClick={() => setIsPriceAlertOpen(true)}
                  >
                    <Bell className="h-3 w-3 mr-1" />
                    Set Alert
                  </Badge>
                </div>
                <div className="flex items-center">
                  <span className="text-xl font-semibold">$0.001</span>
                  <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200" variant="outline">
                    +2.5%
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2 md:pl-6 md:border-l border-slate-200">
              <div className="text-sm text-muted-foreground mb-1">Wallet Address</div>
              <div className="flex items-center p-3 bg-slate-50 rounded-lg mb-3">
                <div className="font-mono text-sm truncate flex-grow">
                  {tasWalletAddress}
                </div>
                <div className="flex space-x-1 ml-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyToClipboard}>
                    <ClipboardCopy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleQRCode}>
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {showQRCode && (
                <div className="p-3 bg-white border rounded-lg flex justify-center">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${tasWalletAddress}`} 
                    alt="Wallet QR Code" 
                    className="h-32 w-32"
                  />
                </div>
              )}
              
              <div className="flex space-x-2 mt-3">
                <Button className="w-1/2 bg-gradient-to-r from-primary to-sky-500 text-white">
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Send
                </Button>
                <Button variant="outline" className="w-1/2">
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Receive
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs for wallet sections */}
      <Tabs defaultValue="balance" className="mb-8" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="balance">My Tokens</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
          <TabsTrigger value="created">Created Tokens</TabsTrigger>
        </TabsList>
        
        {/* My Tokens Tab */}
        <TabsContent value="balance">
          <Card className="border-primary/20">
            <CardHeader className="border-b">
              <CardTitle>My TAS Chain Tokens</CardTitle>
              <CardDescription>
                View and manage your tokens on the TAS Chain
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                          <span className="text-xs font-bold text-primary">TAS</span>
                        </div>
                        <div>
                          <div>TAS Token</div>
                          <div className="text-xs text-muted-foreground">TASnative</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{tasBalance || "0.0"}</TableCell>
                    <TableCell>${tasBalance ? (parseFloat(tasBalance) * 0.001).toFixed(3) : "0.00"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {tokensData?.tokens?.filter((token: any) => token.symbol !== "TAS").map((token: any) => (
                    <TableRow key={token.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center mr-2">
                            <span className="text-xs font-bold text-sky-600">{token.symbol.substring(0, 2)}</span>
                          </div>
                          <div>
                            <div>{token.name}</div>
                            <div className="text-xs text-muted-foreground">{token.symbol}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{token.balance}</TableCell>
                      <TableCell>${(token.balance * token.price).toFixed(3)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {(!tokensData?.tokens || tokensData.tokens.length <= 1) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="text-muted-foreground">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <SearchX className="h-6 w-6 text-slate-400" />
                          </div>
                          <p>No additional tokens found in your wallet</p>
                          <p className="text-sm">Swap or receive tokens to add them to your wallet</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="border-t flex justify-between bg-slate-50 py-3">
              <Button variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Balances
              </Button>
              <Button size="sm" className="bg-primary text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Token
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Transaction History Tab */}
        <TabsContent value="history">
          <Card className="border-primary/20">
            <CardHeader className="border-b">
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Recent transactions on the TAS Chain
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Transaction Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionHistory.length > 0 ? (
                    transactionHistory.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="flex items-center">
                            {tx.type === 'send' ? (
                              <div className="bg-amber-100 p-1 rounded-full mr-2">
                                <ArrowUp className="h-3 w-3 text-amber-600" />
                              </div>
                            ) : (
                              <div className="bg-green-100 p-1 rounded-full mr-2">
                                <ArrowDown className="h-3 w-3 text-green-600" />
                              </div>
                            )}
                            <span>{tx.type === 'send' ? 'Sent' : 'Received'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.token}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{new Date(tx.timestamp).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(tx.timestamp).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {tx.status === 'completed' ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Confirmed
                            </Badge>
                          ) : tx.status === 'pending' ? (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <span className="font-mono text-xs truncate max-w-[100px]">
                              {tx.hash}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 ml-1" 
                              onClick={() => window.open(`https://scan.talkastranger.com/tx/${tx.hash}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="text-muted-foreground">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <History className="h-6 w-6 text-slate-400" />
                          </div>
                          <p>No transactions found</p>
                          <p className="text-sm">Send or receive tokens to create transaction history</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Created Tokens Tab */}
        <TabsContent value="created">
          <Card className="border-primary/20">
            <CardHeader className="border-b">
              <CardTitle>Created Tokens</CardTitle>
              <CardDescription>
                Tokens you've created on the TAS Chain
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Supply</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Contract</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {createdTokensData?.tokens && createdTokensData.tokens.length > 0 ? (
                    createdTokensData.tokens.map((token: any) => (
                      <TableRow key={token.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                              <span className="text-xs font-bold text-purple-600">{token.symbol.substring(0, 2)}</span>
                            </div>
                            <div>
                              <div>{token.name}</div>
                              <div className="text-xs text-muted-foreground">{token.symbol}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{token.totalSupply.toLocaleString()}</TableCell>
                        <TableCell>
                          {token.status === 'deployed' ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Deployed
                            </Badge>
                          ) : token.status === 'pending' ? (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <span className="font-mono text-xs truncate max-w-[100px]">
                              {token.contractAddress}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 ml-1" 
                              onClick={() => window.open(`https://scan.talkastranger.com/token/${token.contractAddress}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="text-muted-foreground">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <Coins className="h-6 w-6 text-slate-400" />
                          </div>
                          <p>You haven't created any tokens yet</p>
                          <p className="text-sm">Create custom tokens with just 5 TAS</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="border-t flex justify-center bg-slate-50 py-4">
              <Button className="bg-gradient-to-r from-primary to-sky-500 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create New Token
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Price Alert Dialog */}
      <Dialog open={isPriceAlertOpen} onOpenChange={setIsPriceAlertOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Price Alert</DialogTitle>
            <DialogDescription>
              Get notified when TAS reaches your target price
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Target Price
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <Input
                  id="price"
                  value={priceAlertValue}
                  onChange={(e) => setPriceAlertValue(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Alert Type</Label>
              <div className="col-span-3">
                <div className="flex items-center space-x-2">
                  <Switch id="price-above" />
                  <Label htmlFor="price-above">Price above target</Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Notifications</Label>
              <div className="col-span-3">
                <div className="flex items-center space-x-2">
                  <Switch id="browser-notif" defaultChecked />
                  <Label htmlFor="browser-notif">Browser</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPriceAlertOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetPriceAlert}>Set Alert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Send Token Dialog */}
      <Dialog>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send TAS</DialogTitle>
            <DialogDescription>
              Send TAS tokens to another wallet
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipient" className="text-right">
                Recipient
              </Label>
              <Input
                id="recipient"
                placeholder="0x..."
                className="col-span-3"
                value={sendRecipient}
                onChange={(e) => setSendRecipient(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <div className="col-span-3 flex">
                <Input
                  id="amount"
                  placeholder="0.0"
                  className="rounded-r-none"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                />
                <Button variant="outline" className="rounded-l-none border-l-0">
                  TAS
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Balance:</Label>
              <div className="col-span-3">
                <span className="text-sm">{tasBalance || "0.0"} TAS</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSendTokens}
              disabled={isLoading || !sendRecipient || !sendAmount}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Send Tokens"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TASWallet;