import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/contexts/WalletContext";
import { useTASChain } from "@/contexts/TASChainContext";
import { getTASTokenContract } from "@/lib/tasChain";
import { CONTRACT_ADDRESSES } from "@/lib/contract-addresses";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  getBrowserName, 
  safeUpperCase,
  isValidSymbol,
  formatSymbol 
} from "@/lib/browser-utils";
import { useSafeNavigate, useBrowser } from "@/lib/BrowserCompatibleRouter";
import { CrossBrowserInput } from "@/components/ui/cross-browser-input";
import { apiRequest } from "@/lib/queryClient";
import { createTasTokenSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Info, 
  Link, 
  Sparkles, 
  Settings, 
  MessageSquare, 
  Check, 
  X, 
  ArrowUpRight,
  Upload,
  HelpCircle
} from "lucide-react";

interface TokenCreationFormValues {
  name: string;
  symbol: string;
  supply: number;
  description: string;
  logoUrl?: string;
  initialPrice: number;
  type: string;
  curveType: string;
  hasImageUpload: boolean;
  imageBase64: string | null;
}

const CreateToken = () => {
  const { translate } = useLanguage();
  const { isConnected, address } = useWallet();
  const { isConnected: isChainConnected, getTokenFactoryContract, provider, signer } = useTASChain();
  
  // Get contract addresses
  const TOKEN_FACTORY_ADDRESS = CONTRACT_ADDRESSES.TOKEN_FACTORY;
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const safeNavigate = useSafeNavigate(); // Use our cross-browser safe navigation
  const { browserName } = useBrowser(); // Get browser info for debugging
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdTokenDetails, setCreatedTokenDetails] = useState<any>(null);
  
  // Log browser info on component mount for debugging
  useEffect(() => {
    console.log(`[CreateToken] Running in ${browserName} browser`);
  }, [browserName]);

  // Extended validation schema - with cross-browser compatibility fixes
  const formSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters").max(25, "Name cannot exceed 25 characters"),
    symbol: z.string()
      .min(2, "Symbol must be at least 2 characters")
      .max(6, "Symbol cannot exceed 6 characters")
      // Manual transformation and validation for consistency across browsers
      .superRefine((val, ctx) => {
        // Format the symbol (uppercase and remove invalid chars)
        const formatted = formatSymbol(val);
        
        // Log for debugging
        console.log(`[Symbol Validation] Original: "${val}", Formatted: "${formatted}"`);
        
        // Check if valid after formatting
        if (!isValidSymbol(formatted)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Symbol must contain only uppercase letters and numbers"
          });
          return z.NEVER;
        }
        
        // Return the formatted value
        return formatted;
      }),
    supply: z.coerce.number().min(10000, "Minimum supply is 10,000").max(1000000000, "Maximum supply is 1 billion"),
    description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description cannot exceed 500 characters"),
    logoUrl: z.string().optional(),
    initialPrice: z.coerce.number().min(0.001, "Minimum price is 0.001 TAS").max(1000, "Maximum price is 1000 TAS"),
    type: z.string().min(1, "Please select a token type"),
    curveType: z.string().min(1, "Please select a bonding curve type"),
    hasImageUpload: z.boolean().default(false),
    imageBase64: z.string().nullable()
  });

  const form = useForm<TokenCreationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      symbol: "",
      supply: 100000,
      description: "",
      logoUrl: "",
      initialPrice: 0.01,
      type: "social",
      curveType: "linear",
      hasImageUpload: false,
      imageBase64: null
    }
  });

  const watchType = form.watch("type");
  const watchCurveType = form.watch("curveType");
  const watchSupply = form.watch("supply");
  const watchInitialPrice = form.watch("initialPrice");
  const watchName = form.watch("name");
  const watchSymbol = form.watch("symbol");
  const watchHasImageUpload = form.watch("hasImageUpload");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "The image must be less than 2MB in size.",
          variant: "destructive"
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Only image files are allowed.",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64String = event.target.result.toString();
          setImagePreview(base64String);
          form.setValue("imageBase64", base64String);
          form.setValue("hasImageUpload", true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    form.setValue("imageBase64", null);
    form.setValue("hasImageUpload", false);
  };

  const calculateMarketCap = () => {
    return watchSupply * watchInitialPrice;
  };

  const calculateFeeCost = () => {
    // Fee is 50 TAS for token creation
    return 50;
  };

  const goToNextStep = () => {
    if (creationStep === 1) {
      // Validate the first section fields
      const isValid = form.trigger(["name", "symbol", "supply", "description"]);
      if (!isValid) return;
    }
    
    if (creationStep < 3) {
      setCreationStep(creationStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (creationStep > 1) {
      setCreationStep(creationStep - 1);
    }
  };

  // Event handler for token creation - optimized for reliability and performance
  const onSubmit = async (values: TokenCreationFormValues) => {
    console.log("[CreateToken] onSubmit function called with values:", values);
    
    if (!isConnected || !isChainConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a token.",
        variant: "destructive"
      });
      setIsCreating(false);
      return;
    }

    // Prevent duplicate submissions
    if (isCreating) {
      console.log("[CreateToken] Already creating token, ignoring duplicate submission");
      return;
    }

    setIsCreating(true);
    
    // DEBUG MODE: Skip blockchain interaction for testing
    const isDebugMode = false;
    if (isDebugMode) {
      try {
        console.log("[CreateToken] DEBUG MODE: Skipping blockchain, directly creating token");
        
        // Create a simulated token without blockchain interaction
        const response = await apiRequest("GET", "/api/tokens/test-create");
        
        if (!response.ok) {
          throw new Error("Failed to create test token");
        }
        
        const data = await response.json();
        console.log("[CreateToken] Test token created:", data);
        
        // Display success dialog with test data
        setCreatedTokenDetails({
          name: values.name || "Test Token",
          symbol: values.symbol?.toUpperCase() || "TEST",
          contractAddress: "0x123456789abcdef",
        });
        
        setShowSuccessDialog(true);
        setIsCreating(false);
        return;
      } catch (error) {
        console.error("[CreateToken] DEBUG MODE error:", error);
        toast({
          title: "Error in debug mode",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive"
        });
        setIsCreating(false);
        return;
      }
    }
    
    // Performance tracking
    const startTime = performance.now();
    console.log(`[CreateToken] Starting token creation process in ${browserName} browser`);
    
    // Safety cleanup timeout - ensure we reset isCreating after 5 minutes max
    const safetyTimeout = setTimeout(() => {
      console.log("[CreateToken] Safety timeout triggered after 5 minutes");
      setIsCreating(false);
    }, 5 * 60 * 1000);

    try {
      // Step 1: Get token factory contract with optimized error handling
      console.log("[CreateToken] Getting token factory contract");
      const tokenFactory = await getTokenFactoryContract();
      
      if (!tokenFactory) {
        throw new Error("Failed to get token factory contract. Please try again.");
      }
      console.log("[CreateToken] Successfully connected to token factory contract");

      // Step 2: Get the creation fee from the contract with retry logic
      let creationFee;
      try {
        console.log("[CreateToken] Fetching creation fee");
        creationFee = await tokenFactory.creationFee();
        console.log("[CreateToken] Token creation fee:", ethers.utils.formatUnits(creationFee, 18), "TAS");
      } catch (feeError) {
        console.error("[CreateToken] Error fetching creation fee, retrying:", feeError);
        
        // Add small delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Retry once
        creationFee = await tokenFactory.creationFee();
        console.log("[CreateToken] Token creation fee (retry):", ethers.utils.formatUnits(creationFee, 18), "TAS");
      }

      // Step 3: Get TAS contract and check balance
      if (!provider || !signer) {
        throw new Error("No provider or signer available. Please reconnect your wallet.");
      }
      
      console.log("[CreateToken] Getting TAS token contract");
      const tasContract = getTASTokenContract(signer);
      if (!tasContract) {
        throw new Error("Failed to get TAS token contract. Please try again.");
      }

      // Check TAS balance with retry logic
      let tasBalance;
      try {
        console.log("[CreateToken] Checking TAS balance for address:", address);
        tasBalance = await tasContract.balanceOf(address);
        console.log("[CreateToken] Current TAS balance:", ethers.utils.formatUnits(tasBalance, 18), "TAS");
      } catch (balanceError) {
        console.error("[CreateToken] Error checking balance, retrying:", balanceError);
        
        // Add small delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Retry once with different approach
        tasBalance = await tasContract.balanceOf(address);
        console.log("[CreateToken] Current TAS balance (retry):", ethers.utils.formatUnits(tasBalance, 18), "TAS");
      }

      // Check if user has enough TAS
      if (tasBalance.lt(creationFee)) {
        const requiredTAS = ethers.utils.formatUnits(creationFee, 18);
        const currentTAS = ethers.utils.formatUnits(tasBalance, 18);
        throw new Error(`Insufficient TAS balance. You need at least ${requiredTAS} TAS to create a token (you have ${currentTAS} TAS).`);
      }

      // Step 4: Approve the token factory to spend TAS
      console.log("[CreateToken] Approving TAS spend");
      toast({
        title: "Approving TAS Spend",
        description: "Please confirm the transaction to approve spending TAS for token creation",
      });

      let approveTx;
      try {
        // Use gas estimation for better success rate
        const gasEstimate = await tasContract.estimateGas.approve(tokenFactory.address, creationFee);
        console.log("[CreateToken] Gas estimate for approval:", gasEstimate.toString());
        
        // Add 20% buffer to gas estimate
        const gasLimit = gasEstimate.mul(120).div(100);
        
        approveTx = await tasContract.approve(tokenFactory.address, creationFee, {
          gasLimit
        });
        
        console.log("[CreateToken] Approval transaction submitted:", approveTx.hash);
      } catch (error) {
        const approveError = error as Error;
        console.error("[CreateToken] Error in approval transaction:", approveError);
        throw new Error(`Failed to approve TAS spending: ${approveError.message || "Unknown error"}`);
      }

      // Wait for approval transaction with timeout
      console.log("[CreateToken] Waiting for approval transaction to be mined");
      const approvalReceipt = await Promise.race([
        approveTx.wait(),
        // Timeout after 60 seconds
        new Promise((_, reject) => setTimeout(() => reject(new Error("Approval transaction timeout")), 60000))
      ]);
      
      console.log("[CreateToken] Approval transaction mined:", approvalReceipt.transactionHash);
      
      toast({
        title: "TAS Approved",
        description: "Now creating your token on the blockchain. Please confirm the transaction.",
      });

      // Step 5: Create the token
      // Prepare logo URL or base64 data and optimize it if needed
      const logoData = values.hasImageUpload ? values.imageBase64 || "" : "";
      
      console.log("[CreateToken] Preparing to create token with symbol:", values.symbol.toUpperCase());
      
      let tx;
      try {
        // Use gas estimation for better success rate
        const createGasEstimate = await tokenFactory.estimateGas.createToken(
          values.name,
          values.symbol.toUpperCase(),
          values.supply,
          logoData,
          values.type
        );
        
        console.log("[CreateToken] Gas estimate for token creation:", createGasEstimate.toString());
        
        // Add 30% buffer for token creation since it's more complex
        const createGasLimit = createGasEstimate.mul(130).div(100);
        
        // Call the contract to create the token with increased gas limit
        tx = await tokenFactory.createToken(
          values.name,
          values.symbol.toUpperCase(),
          values.supply,
          logoData,
          values.type,
          { gasLimit: createGasLimit }
        );
        
        console.log("[CreateToken] Token creation transaction submitted:", tx.hash);
      } catch (error) {
        const createError = error as Error;
        console.error("[CreateToken] Error in token creation transaction:", createError);
        throw new Error(`Failed to create token: ${createError.message || "Unknown error"}`);
      }

      toast({
        title: "Transaction Submitted",
        description: "Your token creation transaction has been submitted to the blockchain.",
      });

      // Step 6: Wait for transaction with timeout and visual feedback
      console.log("[CreateToken] Waiting for token creation transaction to be mined");
      
      // Set up an interval to display waiting time
      let waitingTime = 0;
      const waitingInterval = setInterval(() => {
        waitingTime += 5;
        if (waitingTime % 15 === 0) {
          toast({
            title: "Transaction Processing",
            description: `Your token is still being created. This may take a few minutes. (${waitingTime} seconds elapsed)`,
          });
        }
      }, 5000);
      
      // Wait for transaction with timeout
      const receipt = await Promise.race([
        tx.wait(),
        // Timeout after 5 minutes
        new Promise((_, reject) => setTimeout(() => reject(new Error("Token creation transaction timeout")), 300000))
      ]).finally(() => clearInterval(waitingInterval));
      
      console.log("[CreateToken] Token creation transaction mined:", receipt.transactionHash);

      // Step 7: Extract token address and save to database
      console.log("[CreateToken] Extracting token address from transaction receipt");
      
      // Parse event logs to get the new token address
      const tokenCreatedEvent = receipt.events?.find((e: any) => e.event === "TokenCreated");
      let contractAddress = "Contract address not found in events";
      
      if (tokenCreatedEvent && tokenCreatedEvent.args) {
        contractAddress = tokenCreatedEvent.args.tokenAddress;
        console.log("[CreateToken] New token contract address:", contractAddress);
      } else {
        console.warn("[CreateToken] TokenCreated event not found in transaction logs");
        
        // Try to find address in the logs without relying on event name
        for (const log of receipt.logs || []) {
          // Try to find logs from the token factory contract
          if (log.address.toLowerCase() === TOKEN_FACTORY_ADDRESS.toLowerCase()) {
            console.log("[CreateToken] Found log from token factory, trying to extract address");
            // The last 32 bytes of the data might contain the address
            if (log.data && log.data.length >= 66) {
              // Extract potential address from the last 32 bytes
              const potentialAddress = '0x' + log.data.slice(-40);
              if (ethers.utils.isAddress(potentialAddress)) {
                contractAddress = potentialAddress;
                console.log("[CreateToken] Extracted potential token address:", contractAddress);
                break;
              }
            }
          }
        }
      }

      // Step 8: Save token data to API
      console.log("[CreateToken] Saving token data to API");
      const tokenData = {
        name: values.name,
        symbol: values.symbol.toUpperCase(), 
        supply: values.supply,
        description: values.description,
        initialPrice: values.initialPrice,
        type: values.type,
        curveType: values.curveType,
        ownerAddress: address || "",
        contractAddress: contractAddress,
        transactionHash: receipt.transactionHash,
        imageBase64: values.hasImageUpload ? values.imageBase64 : null
      };

      // Log the data being sent
      console.log("[CreateToken] Sending token data to API:", {
        ...tokenData,
        imageBase64: tokenData.imageBase64 ? '[IMAGE DATA]' : null
      });

      let result;
      try {
        // Call API to save token details in our database
        const response = await apiRequest("POST", "/api/tokens/create", tokenData);
        
        // Check if the response was successful
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        result = await response.json();
        console.log("[CreateToken] Token saved to database:", result);
        
        // Show success notification
        toast({
          title: "Token Created and Saved!",
          description: `Your token ${values.symbol.toUpperCase()} has been created and saved to the database.`,
        });
      } catch (apiError) {
        console.error("[CreateToken] Error saving token to API:", apiError);
        
        // Make a second attempt with a simplified payload
        try {
          console.log("[CreateToken] Retrying with simplified payload");
          const simplifiedData = {
            name: values.name,
            symbol: values.symbol.toUpperCase(),
            contractAddress: contractAddress,
            transactionHash: receipt.transactionHash,
            initialPrice: values.initialPrice
          };
          
          const retryResponse = await apiRequest("POST", "/api/tokens/create", simplifiedData);
          result = await retryResponse.json();
          console.log("[CreateToken] Token saved on retry:", result);
          
          toast({
            title: "Token Created and Saved",
            description: "Your token was created on the blockchain and saved to our database.",
          });
        } catch (retryError) {
          console.error("[CreateToken] Retry failed:", retryError);
          
          // Show warning but don't fail the whole process
          toast({
            title: "Token Created But Not Saved",
            description: "Your token was created on the blockchain, but we couldn't save all details. You can still use your token.",
            variant: "destructive"
          });
          
          // Create minimal result
          result = { token: { id: 0 } };
        }
      }

      // Calculate total time taken
      const endTime = performance.now();
      const totalTime = ((endTime - startTime) / 1000).toFixed(2);
      console.log(`[CreateToken] Token creation process completed in ${totalTime} seconds`);

      // Step 9: Show success and completion
      setCreatedTokenDetails({
        id: result.token?.id || 0,
        name: values.name,
        symbol: values.symbol.toUpperCase(),
        contractAddress: contractAddress,
        transactionHash: receipt.transactionHash,
        creationTime: totalTime
      });
      
      setShowSuccessDialog(true);
      
      // Show success toast
      toast({
        title: "Token Created Successfully",
        description: `Your token has been created on the blockchain in ${totalTime} seconds! You can now trade and share it with others.`,
      });
    } catch (error: any) {
      console.error("[CreateToken] Token creation error:", error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || "There was an error creating your token.";
      
      // More user-friendly error messages
      if (errorMessage.includes("gas") || errorMessage.includes("underpriced")) {
        errorMessage = "Transaction failed due to network congestion. Please try again with higher gas settings.";
      } else if (errorMessage.includes("timeout")) {
        errorMessage = "The transaction is taking too long to process. It may still complete - check your wallet for confirmation.";
      } else if (errorMessage.includes("rejected") || errorMessage.includes("denied")) {
        errorMessage = "You rejected the transaction in your wallet. Please try again and approve the transaction.";
      }
      
      toast({
        title: "Token Creation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      // Clear safety timeout
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
      }
      
      setIsCreating(false);
      console.log("[CreateToken] Token creation process ended");
    }
  };

  // If not connected, show connect prompt
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Create a New Token</CardTitle>
            <CardDescription>Connect your wallet to create your own TAS Chain token</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-10">
            <p className="mb-4">You need to connect your wallet to create a token.</p>
            <Button 
              onClick={() => safeNavigate("/")}
              className="bg-gradient-to-r from-blue-600 to-primary"
            >
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary mb-2">
          <Sparkles className="mr-1 h-3 w-3" /> Token Creation
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Create Your <span className="text-primary">TAS Chain</span> Token
        </h1>
        <p className="text-slate-600 max-w-3xl mx-auto">
          Launch your own custom token on TAS Chain with automated bonding curves for instant liquidity and token-specific chat communities.
        </p>
        
        {/* EMERGENCY FIX: Debug links */}
        <div className="mt-4 flex gap-2 justify-center">
          <a 
            href="/button-test" 
            className="inline-flex items-center bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded"
            onClick={(e) => {
              console.log("Button test link clicked");
            }}
          >
            Test Buttons on Dedicated Page
          </a>
          
          <a 
            href="/simple-token-creator" 
            className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
            onClick={(e) => {
              console.log("Simple token creator link clicked");
            }}
          >
            Try Simplified Token Creator
          </a>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Token Creation Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Create a New Token</CardTitle>
                <div className="flex space-x-2">
                  <Badge variant={creationStep >= 1 ? "default" : "outline"} className="py-1">1. Basic Info</Badge>
                  <Badge variant={creationStep >= 2 ? "default" : "outline"} className="py-1">2. Economics</Badge>
                  <Badge variant={creationStep >= 3 ? "default" : "outline"} className="py-1">3. Confirm</Badge>
                </div>
              </div>
              <CardDescription>Fill out the form to create your TAS Chain token</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-6">
                  {/* Step 1: Basic Info */}
                  {creationStep === 1 && (
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Token Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. My Awesome Token" {...field} />
                            </FormControl>
                            <FormDescription>
                              The full name of your token (3-25 characters)
                            </FormDescription>
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
                              <CrossBrowserInput 
                                placeholder="e.g. MAT" 
                                formatType="symbol"
                                value={field.value}
                                onChange={(e) => {
                                  // Use the raw value for form state
                                  field.onChange(e.target.value);
                                }}
                                onFormattedValueChange={(formattedValue) => {
                                  // Update field with formatted value
                                  console.log(`[Symbol Input] Cross-browser formatted: "${formattedValue}"`);
                                  field.onChange(formattedValue);
                                }}
                                onBlur={field.onBlur}
                              />
                            </FormControl>
                            <FormDescription>
                              Short ticker symbol for your token (2-6 characters).
                              <span className="text-red-500 block mt-1 text-xs">
                                Note: Symbol must contain only uppercase letters and numbers
                              </span>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="supply"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Supply</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              The total number of tokens to create (10,000 - 1,000,000,000)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe your token and its purpose..." {...field} />
                            </FormControl>
                            <FormDescription>
                              Explain the purpose and benefits of your token (10-500 characters)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div>
                        <FormLabel>Token Logo (Optional)</FormLabel>
                        <div className="mt-2 flex items-center gap-4">
                          <div className="flex-shrink-0 w-20 h-20 border rounded-full flex items-center justify-center overflow-hidden">
                            {imagePreview ? (
                              <img src={imagePreview} alt="Token logo preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="bg-slate-200 w-full h-full flex items-center justify-center">
                                <span className="text-xl text-slate-500 font-semibold">
                                  {watchSymbol ? watchSymbol.toUpperCase().substring(0, 2) : "?"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <Button type="button" variant="outline" className="relative" onClick={() => document.getElementById('logoUpload')?.click()}>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Logo
                                <input 
                                  id="logoUpload" 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={handleImageUpload}
                                />
                              </Button>
                              {imagePreview && (
                                <Button type="button" variant="destructive" onClick={clearImage}>
                                  <X className="h-4 w-4 mr-2" />
                                  Clear
                                </Button>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              Upload a 1:1 aspect ratio image (.jpg, .png), max 2MB
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Step 2: Economics */}
                  {creationStep === 2 && (
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="initialPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Initial Token Price (TAS)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.001" {...field} />
                            </FormControl>
                            <FormDescription>
                              The starting price of your token in TAS (0.001 - 1000)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Token Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select token type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="social">Social Token</SelectItem>
                                <SelectItem value="utility">Utility Token</SelectItem>
                                <SelectItem value="community">Community Token</SelectItem>
                                <SelectItem value="meme">Meme Token</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              The category that best describes your token's purpose
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="curveType"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>Bonding Curve Type</FormLabel>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="flex items-center text-xs text-blue-600"
                                onClick={() => window.open('https://medium.com/@blockchain_simplified/bonding-curves-in-depth-393140a4a704', '_blank')}
                              >
                                <HelpCircle className="h-3 w-3 mr-1" />
                                Learn More
                              </Button>
                            </div>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select bonding curve" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="linear">Linear (y = mx + b)</SelectItem>
                                <SelectItem value="quadratic">Quadratic (y = x²)</SelectItem>
                                <SelectItem value="exponential">Exponential (y = e^x)</SelectItem>
                                <SelectItem value="logarithmic">Logarithmic (y = log(x))</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Controls how the token price changes based on supply
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Visual representation of the bonding curve */}
                      <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Bonding Curve Visualization</h4>
                          <Badge variant="outline">{watchCurveType.charAt(0).toUpperCase() + watchCurveType.slice(1)}</Badge>
                        </div>
                        <div className="h-40 bg-white rounded border p-2 flex items-end">
                          {/* Simple curve visualization using divs */}
                          <div className="w-full h-full flex items-end">
                            {Array.from({ length: 10 }).map((_, i) => {
                              let height = 0;
                              const x = (i + 1) / 10;
                              
                              switch(watchCurveType) {
                                case 'linear':
                                  height = x * 100;
                                  break;
                                case 'quadratic':
                                  height = Math.min(100, (x * x) * 100);
                                  break;
                                case 'exponential':
                                  height = Math.min(100, (Math.exp(x * 2) - 1) * 33);
                                  break;
                                case 'logarithmic':
                                  height = Math.min(100, (Math.log(x * 9 + 1)) * 100);
                                  break;
                                default:
                                  height = x * 100;
                              }
                              
                              return (
                                <div 
                                  key={i} 
                                  className="flex-1 mx-px" 
                                  style={{ 
                                    height: `${height}%`,
                                    backgroundColor: 'rgba(96, 165, 250, 0.5)'
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-slate-500">
                          <span>0%</span>
                          <span>Token Supply</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Step 3: Confirmation */}
                  {creationStep === 3 && (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                        <h3 className="text-blue-800 font-medium flex items-center mb-2">
                          <Info className="h-4 w-4 mr-2" />
                          Token Creation Summary
                        </h3>
                        <p className="text-blue-700 text-sm">
                          Please review your token details carefully. Once created, these parameters cannot be changed.
                        </p>
                      </div>
                    
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-slate-500">Basic Information</h4>
                            <Separator className="my-2" />
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm">Token Name:</span>
                            <span className="font-medium">{watchName}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm">Token Symbol:</span>
                            <span className="font-medium">{watchSymbol.toUpperCase()}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm">Total Supply:</span>
                            <span className="font-medium">{watchSupply.toLocaleString()}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm">Has Custom Logo:</span>
                            <span className="font-medium">{watchHasImageUpload ? "Yes" : "No"}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-slate-500">Economics</h4>
                            <Separator className="my-2" />
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm">Initial Price:</span>
                            <span className="font-medium">{watchInitialPrice} TAS</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm">Initial Market Cap:</span>
                            <span className="font-medium">{calculateMarketCap().toLocaleString()} TAS</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm">Token Type:</span>
                            <span className="font-medium capitalize">{watchType}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm">Bonding Curve:</span>
                            <span className="font-medium capitalize">{watchCurveType}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-slate-500">Creation Fee</h4>
                          <Separator className="my-2" />
                        </div>
                        
                        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-yellow-800 font-medium">Token Creation Fee:</p>
                              <p className="text-yellow-700 text-sm">
                                Creating a token requires a one-time fee paid in TAS tokens
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-yellow-800">{calculateFeeCost()} TAS</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                    
                  {/* Navigation and submission buttons */}
                  <div className="flex justify-between mt-8">
                    {creationStep > 1 ? (
                      <Button type="button" variant="outline" onClick={goToPreviousStep}>
                        Back
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" onClick={() => safeNavigate("/")}>
                        Cancel
                      </Button>
                    )}
                    
                    {creationStep < 3 ? (
                      <Button 
                        type="button" 
                        onClick={goToNextStep}
                        className="bg-gradient-to-r from-blue-600 to-primary hover:opacity-90"
                      >
                        Continue
                      </Button>
                    ) : (
                      /* EMERGENCY FIX: SIMPLIFIED BUTTON */
                      <div className="flex gap-2">
                        <Button 
                          type="button"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            console.log("TEST BUTTON CLICKED");
                            toast({
                              title: "Button Works!",
                              description: "This is a test button to confirm click functionality works"
                            });
                            
                            // Show the success dialog with fake data
                            setCreatedTokenDetails({
                              name: "Test Token",
                              symbol: "TEST",
                              contractAddress: "0x123456789abcdef"
                            });
                            setShowSuccessDialog(true);
                          }}
                        >
                          Test Button
                        </Button>
                        
                        <Button 
                          type="button" 
                          className="bg-gradient-to-r from-blue-600 to-primary hover:opacity-90"
                          disabled={isCreating}
                          onClick={() => {
                            console.log("[CreateToken] Direct form submission");
                            if (!isCreating) {
                              setIsCreating(true);
                              
                              try {
                                // Get current form values
                                const values = form.getValues();
                                console.log("[CreateToken] Form values:", values);
                                
                                // Directly call onSubmit with these values
                                onSubmit(values);
                              } catch (error) {
                                console.error("[CreateToken] Direct submit error:", error);
                                toast({
                                  title: "Error",
                                  description: "An error occurred during form submission",
                                  variant: "destructive"
                                });
                              } finally {
                                // Always restore button state after a delay for visual feedback
                                setTimeout(() => {
                                  setIsCreating(false);
                                }, 2000);
                              }
                            }
                          }}
                        >
                          {isCreating ? (
                            <>
                              <span className="animate-spin mr-2">○</span>
                              Creating...
                            </>
                          ) : "Create Token"}
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        {/* Right sidebar: Information */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Token Creation Guide</CardTitle>
              <CardDescription>Important information about token creation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium flex items-center mb-2">
                  <Settings className="h-4 w-4 mr-2 text-slate-500" />
                  Token Distribution
                </h3>
                <p className="text-sm text-slate-600 mb-2">
                  When you create a token:
                </p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-1 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>80% of the supply will be sent to your wallet</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-1 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>20% will be locked in the bonding curve pool for liquidity</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium flex items-center mb-2">
                  <MessageSquare className="h-4 w-4 mr-2 text-slate-500" />
                  Community Features
                </h3>
                <p className="text-sm text-slate-600 mb-2">
                  Your token will automatically include:
                </p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-1 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>A dedicated token chat for all holders</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-1 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Trading functionality with price charts</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-1 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Detailed analytics and holder information</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium flex items-center mb-2">
                  <Link className="h-4 w-4 mr-2 text-slate-500" />
                  Bonding Curves Explained
                </h3>
                <p className="text-sm text-slate-600 mb-2">
                  Bonding curves determine how token price changes:
                </p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li className="flex items-start mb-1">
                    <span className="font-medium text-blue-600 w-24">Linear:</span>
                    <span>Price increases at a constant rate</span>
                  </li>
                  <li className="flex items-start mb-1">
                    <span className="font-medium text-blue-600 w-24">Quadratic:</span>
                    <span>Price increases faster as supply increases</span>
                  </li>
                  <li className="flex items-start mb-1">
                    <span className="font-medium text-blue-600 w-24">Exponential:</span>
                    <span>Price increases rapidly at higher supply</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium text-blue-600 w-24">Logarithmic:</span>
                    <span>Price increases quickly at first, then slows down</span>
                  </li>
                </ul>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => window.open('https://www.tashain.io/whitepaper', '_blank')}
              >
                Read the TAS Chain Whitepaper
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-green-600">
              <Check className="h-5 w-5 mr-2" />
              Token Creation Initiated
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p>Your token creation request has been submitted to the blockchain.</p>
              
              {createdTokenDetails && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                  <h3 className="font-medium text-green-800 mb-2">Token Details</h3>
                  <div className="space-y-2 text-green-700">
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span className="font-medium">{createdTokenDetails.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Symbol:</span>
                      <span className="font-medium">{createdTokenDetails.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contract Address:</span>
                      <span className="font-medium">{createdTokenDetails.contractAddress}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="mt-4">
                Token creation can take a few minutes to complete. You can check the status in your profile.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => safeNavigate("/")}>
              Return to Marketplace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreateToken;