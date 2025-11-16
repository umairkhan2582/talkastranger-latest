import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTokens } from "@/hooks/useTokens";
import TokenCard from "./TokenCard";
import { useWallet } from "@/contexts/WalletContext";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Search, PlusCircle } from "lucide-react";

const customTokenSchema = z.object({
  name: z.string().min(1, "Token name is required"),
  symbol: z.string().min(1, "Token symbol is required"),
  network: z.string().min(1, "Network is required"),
  contractAddress: z.string().min(1, "Contract address is required"),
});

const TokenSelectionSection = () => {
  const { translate } = useLanguage();
  const { isConnected, walletTokens } = useWallet();
  const { toast } = useToast();
  const [swapToken, setSwapToken] = useState<string | null>(null);
  const [swapAmount, setSwapAmount] = useState<string>("0.05");
  const [receiveToken, setReceiveToken] = useState<string | null>(null);
  const [receiveAmount, setReceiveAmount] = useState<string>("1850");
  const [searchYourTokens, setSearchYourTokens] = useState("");
  const [searchDesiredTokens, setSearchDesiredTokens] = useState("");
  
  // Fetch tokens from both the wallet context and the API
  const { myTokens: apiTokens, popularTokens, isLoading, addCustomToken } = useTokens();
  
  // Combine wallet tokens with API tokens to ensure we have all available tokens
  const myTokens = useMemo(() => {
    if (walletTokens && walletTokens.length > 0) {
      // Convert wallet tokens to the format expected by component
      const formattedWalletTokens = walletTokens.map((token, index) => ({
        id: index + 1000, // Use high numbers to avoid collision with API token IDs
        symbol: token.symbol,
        name: token.name,
        balance: token.balance,
        price: token.price,
        bg: token.bg || 'bg-green-100',
        textColor: token.textColor || 'text-green-700',
        network: "BSC",
        contractAddress: null,
        isCustom: false,
        isNative: token.symbol === "TAS"
      }));
      
      // Combine with API tokens, removing duplicates by symbol
      const allTokens = [...formattedWalletTokens];
      
      // Only add API tokens that aren't already in wallet tokens
      if (apiTokens && apiTokens.length > 0) {
        apiTokens.forEach(apiToken => {
          if (!allTokens.some(token => token.symbol === apiToken.symbol)) {
            allTokens.push(apiToken);
          }
        });
      }
      
      return allTokens;
    }
    
    // If no wallet tokens, fallback to API tokens
    return apiTokens || [];
  }, [walletTokens, apiTokens]);

  const filteredMyTokens = myTokens.filter(token => 
    token.name.toLowerCase().includes(searchYourTokens.toLowerCase()) || 
    token.symbol.toLowerCase().includes(searchYourTokens.toLowerCase())
  );

  const filteredPopularTokens = popularTokens.filter(token => 
    token.name.toLowerCase().includes(searchDesiredTokens.toLowerCase()) || 
    token.symbol.toLowerCase().includes(searchDesiredTokens.toLowerCase())
  );

  const form = useForm<z.infer<typeof customTokenSchema>>({
    resolver: zodResolver(customTokenSchema),
    defaultValues: {
      name: "",
      symbol: "",
      network: "Ethereum",
      contractAddress: "",
    },
  });

  const handleAddCustomToken = async (values: z.infer<typeof customTokenSchema>) => {
    try {
      const response = await apiRequest("POST", "/api/tokens/custom", values);
      
      if (response.ok) {
        const newToken = await response.json();
        queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
        toast({
          title: translate("success"),
          description: translate("custom_token_added"),
        });
        return true;
      } else {
        toast({
          title: translate("error"),
          description: translate("failed_to_add_token"),
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: translate("error"),
        description: `${error}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const handleFindMatches = async () => {
    if (!isConnected) {
      toast({
        title: translate("error"),
        description: translate("connect_wallet_to_find_matches"),
        variant: "destructive",
      });
      return;
    }

    if (!swapToken || !receiveToken) {
      toast({
        title: translate("error"),
        description: translate("selectTokensFirst") || "Please select tokens first",
        variant: "destructive",
      });
      return;
    }

    try {
      // In a real app, this would send the token selection to find matches
      await apiRequest("POST", "/api/matches/find", {
        offerToken: swapToken,
        offerAmount: swapAmount,
        wantToken: receiveToken,
        wantAmount: receiveAmount
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      
      toast({
        title: translate("success"),
        description: translate("matches_search_initiated"),
      });
      
      // Scroll to matches section
      document.getElementById('matches-section')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      toast({
        title: translate("error"),
        description: `${error}`,
        variant: "destructive",
      });
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-sm p-6 mb-12">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-dark-800">Select Your Tokens</h2>
          <p className="text-sm text-slate-600 mt-1">
            Choose which tokens you want to trade and receive from other platform users. Match with traders who have what you want.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="text-primary hover:text-primary-600 text-sm font-medium flex items-center">
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Custom Token
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Token</DialogTitle>
              <DialogDescription>
                Enter details about your custom token to add it to your wallet and make it available for trading.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddCustomToken)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Bitcoin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Symbol</FormLabel>
                      <FormControl>
                        <Input placeholder="BTC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="network"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Network</FormLabel>
                      <FormControl>
                        <Input placeholder="Ethereum" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contractAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Address</FormLabel>
                      <FormControl>
                        <Input placeholder="0x..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Add Token</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
        {/* I Want to Swap */}
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-dark-500 mb-3">I Want to Swap:</h3>
            <div className="relative">
              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {swapToken ? (
                      <>
                        <div className={`bg-token-500 bg-opacity-10 p-2 rounded-full`}>
                          <svg className="h-6 w-6 text-token-500" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                            <path d="M7.5 13.5L10.5 16.5L16.5 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{myTokens.find(t => t.symbol === swapToken)?.name || swapToken}</div>
                          <div className="text-xs text-dark-400">{swapToken}</div>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400 font-medium">Select token</div>
                    )}
                  </div>
                  <div>
                    <input 
                      type="text" 
                      className="block w-24 text-right border-0 p-0 focus:ring-0 font-medium text-dark-700" 
                      value={swapAmount}
                      onChange={(e) => setSwapAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="text-xs text-dark-400 flex justify-between">
                  <span>{swapToken ? `Network: ${myTokens.find(t => t.symbol === swapToken)?.network || 'Unknown'}` : "Select token to see network"}</span>
                  <span>≈ ${swapToken ? (Number(swapAmount) * (myTokens.find(t => t.symbol === swapToken)?.price || 0)).toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="relative">
                <label htmlFor="search-your-tokens" className="block text-xs font-medium text-dark-500 mb-1">Search Your Tokens:</label>
                <div className="relative">
                  <input 
                    type="text" 
                    id="search-your-tokens" 
                    className="block w-full pr-10 border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm" 
                    placeholder="Search by name or address"
                    value={searchYourTokens}
                    onChange={(e) => setSearchYourTokens(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="col-span-2 text-center py-4 text-gray-500">Loading...</div>
                ) : filteredMyTokens.length > 0 ? (
                  filteredMyTokens.map((token) => (
                    <TokenCard 
                      key={token.id}
                      token={token}
                      onClick={() => setSwapToken(token.symbol)}
                      isSelected={swapToken === token.symbol}
                      showBalance
                    />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-4 text-gray-500">{translate("no_tokens_found")}</div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* I Want to Receive */}
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-dark-500 mb-3">I Want to Receive:</h3>
            
            <div className="relative">
              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {receiveToken ? (
                      <>
                        <div className={`bg-green-100 p-2 rounded-full`}>
                          <svg className="h-6 w-6 text-green-500" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                            <path d="M7.5 13.5L10.5 16.5L16.5 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{popularTokens.find(t => t.symbol === receiveToken)?.name || receiveToken}</div>
                          <div className="text-xs text-dark-400">{receiveToken}</div>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400 font-medium">Select token</div>
                    )}
                  </div>
                  <div>
                    <input 
                      type="text" 
                      className="block w-24 text-right border-0 p-0 focus:ring-0 font-medium text-dark-700" 
                      value={receiveAmount}
                      onChange={(e) => setReceiveAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="text-xs text-dark-400 flex justify-between">
                  <span>{receiveToken ? `Network: ${popularTokens.find(t => t.symbol === receiveToken)?.network || 'Unknown'}` : "Select token to see network"}</span>
                  <span>≈ ${receiveToken ? (Number(receiveAmount) * (popularTokens.find(t => t.symbol === receiveToken)?.price || 0)).toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="relative">
                <label htmlFor="search-desired-tokens" className="block text-xs font-medium text-dark-500 mb-1">Search for Tokens You Want:</label>
                <div className="relative">
                  <input 
                    type="text" 
                    id="search-desired-tokens" 
                    className="block w-full pr-10 border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm" 
                    placeholder="Search by name or address"
                    value={searchDesiredTokens}
                    onChange={(e) => setSearchDesiredTokens(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="col-span-2 text-center py-4 text-gray-500">{translate("loading")}</div>
                ) : filteredPopularTokens.length > 0 ? (
                  filteredPopularTokens.map((token) => (
                    <TokenCard 
                      key={token.id}
                      token={token}
                      onClick={() => setReceiveToken(token.symbol)}
                      isSelected={receiveToken === token.symbol}
                      showPopular
                    />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-4 text-gray-500">{translate("no_tokens_found")}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
        <div className="flex items-start mb-3">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-blue-800 mb-1">How Matching Works</h3>
            <p className="text-sm text-blue-700">
              When you click 'Find Matches', our system searches for other users who have the tokens you want and are seeking the tokens you're offering. Perfect matches happen when both tokens and amounts align closely.
            </p>
          </div>
        </div>
        <div className="flex justify-center">
          <Button 
            onClick={handleFindMatches}
            disabled={!isConnected || !swapToken || !receiveToken} 
            className="bg-gradient-to-r from-primary to-sky-500 hover:from-primary-600 hover:to-sky-600 text-white px-8 py-6 rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            Find Matches
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TokenSelectionSection;
