import React, { useEffect, useState } from "react";
import axios from "axios";
import { useWallet } from "@/contexts/WalletContext";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  Search,
  Shield,
  Activity,
  Database,
  RefreshCw,
  FileText,
  Wallet,
  Globe,
  Clock
} from "lucide-react";
// Import formatEther from tasChain to handle compatibility with different ethers versions
import { formatUnits } from "@/lib/tasChain";
import { NETWORK_CONFIG } from "@/lib/contract-addresses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import ExplorerHeader from "@/components/ExplorerHeader";

// BSC API endpoints
// We still use BSCScan API under the hood, but all UI links show as TASonscan.com
const BSC_API_BASE = "https://api.bscscan.com/api";
const BSC_API_KEY = ""; // Will be using public API with rate limiting

// Utility function to safely format Ethereum values regardless of type
const safeFormatEther = (value: any): string => {
  try {
    if (value === undefined || value === null) return "0";
    
    // Special handling for BigNumber objects with type and hex properties
    if (typeof value === 'object' && value !== null) {
      if (value.type === 'BigNumber' && value.hex) {
        // Handle ethers.js BigNumber representation
        return formatUnits(value.hex, 18);
      }
      
      // For other object types with _hex property (ethers v5 BigNumber)
      if (value._hex) {
        return formatUnits(value._hex, 18);
      }
      
      // For objects with toString method, but be careful with output
      if (value.toString && typeof value.toString === 'function') {
        try {
          const stringValue = value.toString();
          
          // Only process if it's a numeric string (avoid [object Object])
          if (typeof stringValue === 'string' && 
              (stringValue.match(/^[0-9]+$/) || 
               stringValue.match(/^0x[0-9a-fA-F]+$/))) {
            return formatUnits(stringValue, 18);
          }
          return "0"; // Non-numeric string
        } catch (innerError) {
          console.error("Error in toString conversion:", innerError);
          return "0";
        }
      }
      
      // If we get here, return 0 for any other object
      return "0";
    } 
    
    // Handle string values
    if (typeof value === 'string') {
      if (value.startsWith('0x')) {
        // It's a hex string, pass directly to formatUnits
        return formatUnits(value, 18);
      } else {
        // For decimal strings, remove non-numeric chars except dots
        const cleanValue = value.replace(/[^\d.]/g, '') || "0";
        return formatUnits(cleanValue, 18);
      }
    }
    
    // Handle number values 
    if (typeof value === 'number') {
      return formatUnits(value.toString(), 18);
    }
    
    // Default fallback
    return "0";
  } catch (error) {
    console.error("Error formatting Ethereum value:", error);
    return "0";
  }
};

const BlockExplorer = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [blocks, setBlocks] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { isConnected, address } = useWallet();
  const { toast } = useToast();
  
  // Fetch latest blocks and transactions on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          fetchLatestBlocks(),
          fetchLatestTransactions()
        ]);
        
        // Pre-load tokens tab data
        const response = await axios.get("/api/explorer/tokens");
        setTokenInfo({ tokens: response.data.result });
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setErrorMessage("Failed to load explorer data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Check URL parameters for tab selection and address
  useEffect(() => {
    // Check for tab parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['home', 'blocks', 'transactions', 'address', 'tokens'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    // Check if we're on an address page
    const pathname = window.location.pathname;
    if (pathname.startsWith('/address/') || pathname.startsWith('/explorer/address/')) {
      // Extract address from URL path - use proper hex format matching for Ethereum addresses
      const addressMatch = pathname.match(/\/address\/(0x[a-fA-F0-9]+)/) || 
                         pathname.match(/\/explorer\/address\/(0x[a-fA-F0-9]+)/);
      if (addressMatch && addressMatch[1]) {
        const addressValue = addressMatch[1];
        setActiveTab("address");
        setSearchQuery(addressValue);
        // Fetch address data
        fetchAddressDetails(addressValue);
      }
    }
  }, []);
  
  // Function to fetch address details
  const fetchAddressDetails = async (addressValue: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Validate address format before making API call
      if (!addressValue || !addressValue.startsWith('0x') || addressValue.length !== 42) {
        setErrorMessage(`Invalid address format: ${addressValue}. Please provide a valid Ethereum address.`);
        setActiveTab("address");
        setIsLoading(false);
        return;
      }
      
      const response = await axios.get(`/api/explorer/address/${addressValue}`);
      
      if (response.data && response.data.status === "1") {
        setTokenInfo(response.data);
        setActiveTab("address");
      } else {
        // Handle case where API returned success but no data
        console.warn("API returned success but with invalid data format:", response.data);
        setErrorMessage(`Address found but no data available: ${addressValue}`);
      }
    } catch (error) {
      console.error("Error fetching address details:", error);
      // Provide a more helpful error message
      setErrorMessage(
        `We couldn't retrieve data for address: ${addressValue}. ` + 
        `This could be because the address doesn't exist on the blockchain, ` +
        `or our explorer service is currently experiencing issues. ` +
        `Please try again later or verify the address is correct.`
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to fetch latest blocks
  const fetchLatestBlocks = async () => {
    try {
      const response = await axios.get("/api/explorer/blocks");
      setBlocks(response.data.result || []);
    } catch (error) {
      console.error("Error fetching blocks:", error);
      setBlocks([]); 
    }
  };
  
  // Function to fetch latest transactions
  const fetchLatestTransactions = async () => {
    try {
      const response = await axios.get("/api/explorer/transactions");
      setTransactions(response.data.result || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    }
  };
  
  // Handle search submission
  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setErrorMessage("Please enter a search term");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Log search to help with debugging
      console.log(`TASonscan search query: "${trimmedQuery}"`);
      
      // Detect what type of data is being searched
      if (trimmedQuery.length === 66 && trimmedQuery.startsWith("0x")) {
        // Likely a transaction hash
        toast({
          title: "Searching",
          description: "Looking up transaction...",
        });
        setActiveTab("transactions");
        const response = await axios.get(`/api/explorer/transactions?txhash=${trimmedQuery}`);
        if (response.data.result && response.data.result.length > 0) {
          setTransactions([response.data.result[0]]);
          toast({
            title: "Success",
            description: "Transaction found",
            variant: "default",
          });
        } else {
          setErrorMessage("Transaction not found");
          toast({
            title: "Not Found",
            description: "Transaction hash not found in the blockchain",
            variant: "destructive",
          });
        }
      } else if ((trimmedQuery.length === 42 && trimmedQuery.startsWith("0x")) || 
                 trimmedQuery.endsWith(".eth")) {
        // Likely an address
        toast({
          title: "Searching",
          description: "Looking up address details...",
        });
        setActiveTab("address");
        
        // Use the fetchAddressDetails function for consistent error handling
        await fetchAddressDetails(trimmedQuery);
      } else if (!isNaN(Number(trimmedQuery))) {
        // Likely a block number
        toast({
          title: "Searching",
          description: "Looking up block...",
        });
        setActiveTab("blocks");
        const response = await axios.get(`/api/explorer/blocks?blockno=${trimmedQuery}`);
        if (response.data.result && response.data.result.length > 0) {
          setBlocks([response.data.result[0]]);
          toast({
            title: "Success",
            description: "Block found",
            variant: "default",
          });
        } else {
          setErrorMessage("Block not found");
          toast({
            title: "Not Found",
            description: "Block number not found in the blockchain",
            variant: "destructive",
          });
        }
      } else {
        // Try as token symbol
        toast({
          title: "Searching",
          description: "Looking up token by symbol...",
        });
        setActiveTab("tokens");
        try {
          const response = await axios.get(`/api/explorer/tokens?symbol=${trimmedQuery}`);
          if (response.data.result && response.data.result.length > 0) {
            setTokenInfo({ tokens: response.data.result });
            toast({
              title: "Success",
              description: `Found ${response.data.result.length} tokens matching "${trimmedQuery}"`,
              variant: "default",
            });
          } else {
            setErrorMessage(`No results found for "${trimmedQuery}"`);
            toast({
              title: "Not Found",
              description: "No tokens found with that symbol",
              variant: "destructive",
            });
          }
        } catch (tokenError) {
          console.error("Token lookup error:", tokenError);
          setErrorMessage(`Error looking up token: ${trimmedQuery}`);
          toast({
            title: "Token Error",
            description: "Could not retrieve token information",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setErrorMessage("Error processing search. Please try again.");
      toast({
        title: "Search Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Use our custom header */}
      <ExplorerHeader />
      
      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
        <div className="flex flex-col space-y-4 sm:space-y-6">
          {/* Search Section */}
          <div className="flex flex-col space-y-2 sm:space-y-4">
            <h1 className="text-2xl sm:text-3xl font-bold">TAS Chain Explorer</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Browse transactions, blocks, and addresses on the TAS Chain
            </p>
            
            <div className="flex w-full max-w-3xl space-x-1 sm:space-x-2">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by Address / Txn Hash / Block / Token"
                  className="pl-9 pr-2 sm:pr-4 py-2 text-sm sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch}
                className="whitespace-nowrap"
                size="sm"
              >
                Search
              </Button>
            </div>
            
            {errorMessage && (
              <div className="p-3 text-sm rounded-md bg-red-50 text-red-500 border border-red-200">
                {errorMessage}
              </div>
            )}
          </div>
          
          {/* Main Content Tabs */}
          <Tabs defaultValue="home" value={activeTab} onValueChange={setActiveTab}>
            <div className="overflow-x-auto pb-2">
              <TabsList className="mb-4 inline-flex w-auto min-w-full">
                <TabsTrigger value="home" className="text-xs sm:text-sm">Home</TabsTrigger>
                <TabsTrigger value="blocks" className="text-xs sm:text-sm">Blocks</TabsTrigger>
                <TabsTrigger value="transactions" className="text-xs sm:text-sm whitespace-nowrap">Transactions</TabsTrigger>
                <TabsTrigger value="address" className="text-xs sm:text-sm">Address</TabsTrigger>
                <TabsTrigger value="tokens" className="text-xs sm:text-sm">Tokens</TabsTrigger>
              </TabsList>
            </div>
            
            {/* Home Tab */}
            <TabsContent value="home">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Network Stats Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="mr-2 h-5 w-5" /> 
                      TAS Chain Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Market Cap</span>
                        <span className="font-medium">$12.5M</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">TAS Price</span>
                        <span className="font-medium text-green-600">$0.01 (+2.4%)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Latest Block</span>
                        <span className="font-medium">
                          {blocks.length > 0 ? blocks[0].number : "Loading..."}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Avg Block Time</span>
                        <span className="font-medium">3.2s</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Validators</span>
                        <span className="font-medium">21</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Latest Blocks Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Globe className="mr-2 h-5 w-5" /> 
                      Latest Blocks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {isLoading ? (
                        <div className="flex justify-center py-6">
                          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <>
                          {blocks.slice(0, 5).map((block, index) => (
                            <div key={index} className="flex items-center justify-between py-1 border-b">
                              <div className="flex items-center">
                                <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-2 min-w-[2rem]">
                                  <Activity className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <a 
                                    href="#" 
                                    className="text-blue-600 hover:underline font-medium"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSearchQuery(block.number);
                                      handleSearch();
                                    }}
                                  >
                                    {block.number}
                                  </a>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(block.timestamp * 1000).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm">
                                  <span className="font-medium">{block.transactions.length}</span> txns
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  by {block.miner.substring(0, 6)}...{block.miner.substring(38)}
                                </div>
                              </div>
                            </div>
                          ))}
                          {blocks.length === 0 && (
                            <div className="py-6 text-center text-muted-foreground">
                              No blocks found
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="justify-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab("blocks")}
                    >
                      View All Blocks
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Latest Transactions Card */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="mr-2 h-5 w-5" /> 
                      Latest Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 sm:px-6">
                    {isLoading ? (
                      <div className="flex justify-center py-6">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="whitespace-nowrap">Txn Hash</TableHead>
                              <TableHead className="whitespace-nowrap">Block</TableHead>
                              <TableHead className="whitespace-nowrap hidden md:table-cell">Age</TableHead>
                              <TableHead className="whitespace-nowrap">From</TableHead>
                              <TableHead className="whitespace-nowrap">To</TableHead>
                              <TableHead className="whitespace-nowrap hidden sm:table-cell">Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions.slice(0, 5).map((tx, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  <a 
                                    href="#" 
                                    className="text-blue-600 hover:underline"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSearchQuery(tx.hash);
                                      handleSearch();
                                    }}
                                  >
                                    {tx.hash.substring(0, 6)}...
                                  </a>
                                </TableCell>
                                <TableCell>
                                  <a 
                                    href="#" 
                                    className="text-blue-600 hover:underline"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSearchQuery(tx.blockNumber);
                                      handleSearch();
                                    }}
                                  >
                                    {tx.blockNumber}
                                  </a>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {tx.timeStamp 
                                    ? new Date(tx.timeStamp * 1000).toLocaleString()
                                    : 'Unknown time'}
                                </TableCell>
                                <TableCell>
                                  <a 
                                    href="#" 
                                    className="text-blue-600 hover:underline"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSearchQuery(tx.from);
                                      handleSearch();
                                    }}
                                  >
                                    {tx.from.substring(0, 4)}...
                                  </a>
                                </TableCell>
                                <TableCell>
                                  <a 
                                    href="#" 
                                    className="text-blue-600 hover:underline"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSearchQuery(tx.to || "Contract Creation");
                                      handleSearch();
                                    }}
                                  >
                                    {tx.to 
                                      ? `${tx.to.substring(0, 4)}...` 
                                      : 'Contract'}
                                  </a>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  {safeFormatEther(tx.value)} {NETWORK_CONFIG.currency.symbol}
                                </TableCell>
                              </TableRow>
                            ))}
                            {transactions.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                  No transactions found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="justify-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab("transactions")}
                    >
                      View All Transactions
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            
            {/* Blocks Tab */}
            <TabsContent value="blocks">
              <Card>
                <CardHeader>
                  <CardTitle>Latest Blocks</CardTitle>
                  <CardDescription>
                    Recent blocks mined on the TAS Chain
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                  {isLoading ? (
                    <div className="flex justify-center py-6">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Block</TableHead>
                            <TableHead className="whitespace-nowrap hidden md:table-cell">Age</TableHead>
                            <TableHead className="whitespace-nowrap">Txn Count</TableHead>
                            <TableHead className="whitespace-nowrap">Miner</TableHead>
                            <TableHead className="whitespace-nowrap hidden sm:table-cell">Gas Used</TableHead>
                            <TableHead className="whitespace-nowrap hidden lg:table-cell">Gas Limit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {blocks.map((block, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                <a 
                                  href="#" 
                                  className="text-blue-600 hover:underline"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSearchQuery(block.number);
                                    handleSearch();
                                  }}
                                >
                                  {block.number}
                                </a>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {block.timestamp 
                                  ? new Date(block.timestamp * 1000).toLocaleString() 
                                  : 'Unknown time'}
                              </TableCell>
                              <TableCell>{block.transactions.length}</TableCell>
                              <TableCell>
                                <a 
                                  href="#" 
                                  className="text-blue-600 hover:underline"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSearchQuery(block.miner);
                                    handleSearch();
                                  }}
                                >
                                  {block.miner.substring(0, 4)}...
                                </a>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">{block.gasUsed}</TableCell>
                              <TableCell className="hidden lg:table-cell">{block.gasLimit}</TableCell>
                            </TableRow>
                          ))}
                          {blocks.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                No blocks found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tokens Tab */}
            <TabsContent value="tokens">
              <Card>
                <CardHeader>
                  <CardTitle>TAS Chain Tokens</CardTitle>
                  <CardDescription>
                    Tokens deployed on the TAS Chain
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                  {!tokenInfo || !tokenInfo.tokens ? (
                    <div className="flex justify-center py-6">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Token</TableHead>
                            <TableHead className="whitespace-nowrap">Symbol</TableHead>
                            <TableHead className="whitespace-nowrap">Contract</TableHead>
                            <TableHead className="whitespace-nowrap hidden md:table-cell">Network</TableHead>
                            <TableHead className="whitespace-nowrap hidden sm:table-cell">Creator</TableHead>
                            <TableHead className="whitespace-nowrap hidden lg:table-cell">Creation Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tokenInfo.tokens.map((token: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{token.name}</TableCell>
                              <TableCell>{token.symbol}</TableCell>
                              <TableCell>
                                {token.contractAddress ? (
                                  <a 
                                    href="#" 
                                    className="text-blue-600 hover:underline"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSearchQuery(token.contractAddress);
                                      handleSearch();
                                    }}
                                  >
                                    {token.contractAddress.substring(0, 4)}...
                                  </a>
                                ) : (
                                  'Native'
                                )}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{token.network}</TableCell>
                              <TableCell className="hidden sm:table-cell">{token.creator || "TAS Team"}</TableCell>
                              <TableCell className="hidden lg:table-cell">{token.creationTime || "-"}</TableCell>
                            </TableRow>
                          ))}
                          {tokenInfo.tokens.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                No tokens found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Latest Transactions</CardTitle>
                  <CardDescription>
                    Recent transactions on the TAS Chain
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                  {isLoading ? (
                    <div className="flex justify-center py-6">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Txn Hash</TableHead>
                            <TableHead className="whitespace-nowrap">Block</TableHead>
                            <TableHead className="whitespace-nowrap hidden md:table-cell">Age</TableHead>
                            <TableHead className="whitespace-nowrap">From</TableHead>
                            <TableHead className="whitespace-nowrap">To</TableHead>
                            <TableHead className="whitespace-nowrap hidden sm:table-cell">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((tx, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                <a 
                                  href="#" 
                                  className="text-blue-600 hover:underline"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSearchQuery(tx.hash);
                                    handleSearch();
                                  }}
                                >
                                  {tx.hash.substring(0, 6)}...
                                </a>
                              </TableCell>
                              <TableCell>
                                <a 
                                  href="#" 
                                  className="text-blue-600 hover:underline"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSearchQuery(tx.blockNumber);
                                    handleSearch();
                                  }}
                                >
                                  {tx.blockNumber}
                                </a>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {tx.timeStamp 
                                  ? new Date(tx.timeStamp * 1000).toLocaleString() 
                                  : 'Unknown time'}
                              </TableCell>
                              <TableCell>
                                <a 
                                  href="#" 
                                  className="text-blue-600 hover:underline"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSearchQuery(tx.from);
                                    handleSearch();
                                  }}
                                >
                                  {tx.from.substring(0, 4)}...
                                </a>
                              </TableCell>
                              <TableCell>
                                <a 
                                  href="#" 
                                  className="text-blue-600 hover:underline"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSearchQuery(tx.to || "Contract Creation");
                                    handleSearch();
                                  }}
                                >
                                  {tx.to 
                                    ? `${tx.to.substring(0, 4)}...` 
                                    : 'Contract'}
                                </a>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {safeFormatEther(tx.value)} {NETWORK_CONFIG.currency.symbol}
                              </TableCell>
                            </TableRow>
                          ))}
                          {transactions.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                No transactions found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Address Tab */}
            <TabsContent value="address">
              {tokenInfo ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Address Details</CardTitle>
                    <CardDescription>
                      {searchQuery}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">Overview</h3>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <div className="flex justify-between py-1 border-b">
                              <span className="text-muted-foreground">Balance</span>
                              <span className="font-medium">{tokenInfo.balance || "0"} {NETWORK_CONFIG.currency.symbol}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                              <span className="text-muted-foreground">TAS Balance</span>
                              <span className="font-medium">{tokenInfo.tasBalance || "0"} TAS</span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                              <span className="text-muted-foreground">Transactions</span>
                              <span className="font-medium">{tokenInfo.txCount || "0"}</span>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between py-1 border-b">
                              <span className="text-muted-foreground">Tokens</span>
                              <span className="font-medium">{tokenInfo.tokenCount || "0"} types</span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                              <span className="text-muted-foreground">Contract</span>
                              <span className="font-medium">{tokenInfo.isContract ? "Yes" : "No"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Transactions section */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">Transactions</h3>
                        <Separator />
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="whitespace-nowrap">Txn Hash</TableHead>
                                <TableHead className="whitespace-nowrap hidden sm:table-cell">Block</TableHead>
                                <TableHead className="whitespace-nowrap hidden md:table-cell">Age</TableHead>
                                <TableHead className="whitespace-nowrap">From/To</TableHead>
                                <TableHead className="whitespace-nowrap hidden sm:table-cell">Value</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(tokenInfo.transactions || []).map((tx: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">
                                    <a 
                                      href="#" 
                                      className="text-blue-600 hover:underline"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setSearchQuery(tx.hash);
                                        handleSearch();
                                      }}
                                    >
                                      {tx.hash.substring(0, 6)}...
                                    </a>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell">{tx.blockNumber}</TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    {tx.timeStamp ? 
                                      new Date(tx.timeStamp * 1000).toLocaleString() : 
                                      'Unknown time'}
                                  </TableCell>
                                  <TableCell>
                                    {searchQuery.toLowerCase() === tx.from.toLowerCase() ? (
                                      <div className="flex items-center">
                                        OUT <ArrowRight className="h-3 w-3 mx-1" />
                                        <a 
                                          href="#" 
                                          className="text-blue-600 hover:underline"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            setSearchQuery(tx.to);
                                            handleSearch();
                                          }}
                                        >
                                          {tx.to.substring(0, 4)}...
                                        </a>
                                      </div>
                                    ) : (
                                      <div className="flex items-center">
                                        IN <ArrowRight className="h-3 w-3 mx-1" />
                                        <a 
                                          href="#" 
                                          className="text-blue-600 hover:underline"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            setSearchQuery(tx.from);
                                            handleSearch();
                                          }}
                                        >
                                          {tx.from.substring(0, 4)}...
                                        </a>
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell">
                                    {safeFormatEther(tx.value)} {NETWORK_CONFIG.currency.symbol}
                                  </TableCell>
                                </TableRow>
                              ))}
                              {(tokenInfo.transactions || []).length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                                    No transactions found for this address
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                      
                      {/* Tokens section */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">Tokens</h3>
                        <Separator />
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="whitespace-nowrap">Token</TableHead>
                                <TableHead className="whitespace-nowrap">Symbol</TableHead>
                                <TableHead className="whitespace-nowrap hidden md:table-cell">Contract</TableHead>
                                <TableHead className="whitespace-nowrap">Balance</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(tokenInfo.tokens || []).map((token: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{token.name}</TableCell>
                                  <TableCell>{token.symbol}</TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    <a 
                                      href="#" 
                                      className="text-blue-600 hover:underline"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setSearchQuery(token.contractAddress);
                                        handleSearch();
                                      }}
                                    >
                                      {token.contractAddress ? 
                                       `${token.contractAddress.substring(0, 4)}...` : 
                                       'Unknown'}
                                    </a>
                                  </TableCell>
                                  <TableCell>{token.balance}</TableCell>
                                </TableRow>
                              ))}
                              {(tokenInfo.tokens || []).length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                    No tokens found for this address
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start space-y-2">
                    <p className="text-sm text-muted-foreground">
                      * All displayed values are in real-time and pulled directly from the blockchain.
                    </p>
                    {isConnected && address && searchQuery.toLowerCase() === address.toLowerCase() && (
                      <div className="w-full flex justify-between items-center p-4 bg-primary/5 rounded-md">
                        <div>
                          <h4 className="font-medium">This is your wallet</h4>
                          <p className="text-sm text-muted-foreground">You are currently connected with this address</p>
                        </div>
                        <Link href="/wallet">
                          <Button variant="outline" size="sm">
                            <Wallet className="mr-2 h-4 w-4" />
                            Manage Wallet
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Shield className="h-12 w-12 text-muted-foreground" />
                  <h3 className="text-xl font-medium">Search for an address</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Enter a wallet address, contract, or ENS name in the search bar to view details.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default BlockExplorer;