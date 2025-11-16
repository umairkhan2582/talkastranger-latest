import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, ArrowLeft, AlertTriangle, RefreshCw } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import { useWallet } from "@/contexts/WalletContext";
import { useTASChain } from "@/contexts/TASChainContext";
import { ethers } from "ethers";
import { getTASTokenContract, getTokenFactoryContract, createToken as createTASToken, parseUnits } from "@/lib/tasChain";
import { CONTRACT_ADDRESSES } from "@/lib/contract-addresses";
import { TokenDeploymentTracker, TokenDeploymentDetail, createInitialDeployment } from "@/components/TokenDeploymentTracker";
import { apiRequest } from "@/lib/queryClient";
import { 
  createEthersProvider, 
  detectEthereumProvider, 
  isMobileDevice, 
  isMetaMaskBrowser, 
  getCachedVersionInfo 
} from "@/lib/walletDetector";

// Function to force a cache-busting reload
const forceCacheBustingReload = () => {
  const versionParam = getCachedVersionInfo();
  const currentUrl = window.location.href;
  const baseUrl = currentUrl.split('?')[0]; // Remove any existing query params
  window.location.href = `${baseUrl}?${versionParam}`;
};

// Define extended window interface for web3/ethereum providers
declare global {
  interface Window {
    ethereum?: any;
    web3?: {
      currentProvider: any;
    };
  }
}

interface SocialLink {
  platform: string;
  url: string;
}

interface TokenDetails {
  name: string;
  symbol: string;
  supply: number;
  description: string;
  socialLinks: SocialLink[];
  imageBase64: string | null;
  firstBuyAmount: number;
}

interface CreatedTokenDetails {
  name: string;
  symbol: string;
  contractAddress: string;
}

const SimpleTokenCreator = () => {
  const { toast } = useToast();
  const { address, isConnected } = useWallet();
  const { balance: tasTokenBalance, refreshBalance } = useTASChain();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [showDeploymentTracker, setShowDeploymentTracker] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [tokenDetails, setTokenDetails] = useState<TokenDetails>({
    name: "",
    symbol: "",
    supply: 1000000000, // 1 billion supply fixed
    description: "",
    socialLinks: [
      { platform: "twitter", url: "" },
      { platform: "telegram", url: "" },
      { platform: "website", url: "" }
    ],
    imageBase64: null,
    firstBuyAmount: 0.1
  });
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSocialLinkForm, setShowSocialLinkForm] = useState(false);
  const [createdTokenDetails, setCreatedTokenDetails] = useState<CreatedTokenDetails | null>(null);
  const [deploymentDetails, setDeploymentDetails] = useState<TokenDeploymentDetail | null>(null);
  
  const creationFee = 5; // TAS tokens required to create a token
  
  // Check if user has enough TAS tokens
  const hasSufficientBalance = tasTokenBalance ? parseFloat(tasTokenBalance) >= creationFee : false;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTokenDetails({
      ...tokenDetails,
      [name]: name === "supply" ? parseInt(value) || 0 : value
    });
  };

  // Handle description changes
  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setTokenDetails({
      ...tokenDetails,
      description: e.target.value
    });
  };

  // Handle social link changes
  const handleSocialLinkChange = (index: number, field: 'platform' | 'url', value: string) => {
    const updatedLinks = [...tokenDetails.socialLinks];
    updatedLinks[index] = {
      ...updatedLinks[index],
      [field]: value
    };
    
    setTokenDetails({
      ...tokenDetails,
      socialLinks: updatedLinks
    });
  };

  // Add new social link
  const addSocialLink = () => {
    if (tokenDetails.socialLinks.length >= 5) {
      toast({
        title: "Maximum Links Reached",
        description: "You can add a maximum of 5 social links",
        variant: "destructive"
      });
      return;
    }
    
    setTokenDetails({
      ...tokenDetails,
      socialLinks: [...tokenDetails.socialLinks, { platform: "", url: "" }]
    });
  };

  // Remove social link
  const removeSocialLink = (index: number) => {
    const updatedLinks = [...tokenDetails.socialLinks];
    updatedLinks.splice(index, 1);
    
    setTokenDetails({
      ...tokenDetails,
      socialLinks: updatedLinks
    });
  };

  // Handle first buy amount change
  const handleFirstBuyAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setTokenDetails({
      ...tokenDetails,
      firstBuyAmount: value
    });
  };

  // Handle image upload
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
          setTokenDetails({
            ...tokenDetails,
            imageBase64: base64String
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Clear image
  const clearImage = () => {
    setImagePreview(null);
    setTokenDetails({
      ...tokenDetails,
      imageBase64: null
    });
  };
  
  // Handle deployment updates
  const handleDeploymentUpdate = (updatedDeployment: TokenDeploymentDetail) => {
    setDeploymentDetails(updatedDeployment);
    
    // If we have a token address, update the created token details
    if (updatedDeployment.tokenAddress && !createdTokenDetails) {
      setCreatedTokenDetails({
        name: updatedDeployment.tokenName,
        symbol: updatedDeployment.tokenSymbol,
        contractAddress: updatedDeployment.tokenAddress
      });
    }
    
    // If we have a transaction hash, store it
    if (updatedDeployment.transactionHash && !txHash) {
      setTxHash(updatedDeployment.transactionHash);
    }
  };
  
  // Handle deployment completion
  const handleDeploymentComplete = (completedDeployment: TokenDeploymentDetail) => {
    // If the deployment was successful, show the success dialog
    if (completedDeployment.status === 'completed') {
      setShowSuccessDialog(true);
    }
    
    // Set creating to false regardless of success/failure
    setIsCreating(false);
    
    // Refresh the balance
    refreshBalance();
  };
  
  // Start token creation with real-time deployment tracking
  const createToken = async () => {
    try {
      setIsCreating(true);
      
      // Create initial deployment state object
      const initialDeployment = createInitialDeployment(
        tokenDetails.name,
        tokenDetails.symbol.toUpperCase(),
        tokenDetails.supply
      );
      
      // Set the deployment details to show the tracker
      setDeploymentDetails(initialDeployment);
      setShowDeploymentTracker(true);
      
      // --- Step 1: Setup provider and signer using our enhanced wallet detector ---
      // Detect wallet provider with enhanced mobile and cached site support
      console.log("[Token Creator] Detecting wallet provider...");
      const providerSource = await detectEthereumProvider();
      
      if (!providerSource) {
        // Use our helper functions from walletDetector.ts
        const userOnMobile = isMobileDevice();
        const userInMetaMaskBrowser = isMetaMaskBrowser();
        
        console.log(`[Token Creator] No provider detected. Mobile: ${userOnMobile}, MetaMask browser: ${userInMetaMaskBrowser}`);
        
        if (userOnMobile) {
          if (userInMetaMaskBrowser) {
            // In MetaMask mobile browser, but no provider found (likely cached version)
            // Instead of throwing error, show UI for cache-busting reload
            setIsCreating(false);
            
            toast({
              title: "MetaMask Connection Issue",
              description: <div className="flex flex-col space-y-2">
                <span>MetaMask browser detected but wallet not found. This is likely due to a cached version of our site.</span>
                <Button 
                  variant="outline" 
                  className="mt-2 bg-blue-50 text-blue-600" 
                  onClick={() => forceCacheBustingReload()}
                >
                  Refresh with Cache Clear
                </Button>
              </div>,
              duration: 10000,
            });
            
            return; // Exit token creation flow
          } else {
            // For mobile users not in MetaMask browser, show a helpful toast with instructions
            setIsCreating(false);
            
            toast({
              title: "Mobile Wallet Required",
              description: <div className="flex flex-col space-y-2">
                <span>Please open this site in your preferred wallet's browser:</span>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                  <li>MetaMask mobile app</li>
                  <li>Trust Wallet browser</li>
                  <li>Coinbase Wallet</li>
                </ul>
                <span className="text-xs text-gray-500 mt-1">
                  The wallet's built-in browser is required to connect to the blockchain.
                </span>
              </div>,
              duration: 10000,
            });
            
            return; // Exit token creation flow
          }
        } else {
          // Desktop users without a wallet
          setIsCreating(false);
          
          toast({
            title: "Wallet Not Detected",
            description: <div className="flex flex-col space-y-2">
              <span>Please install a wallet extension to create tokens:</span>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                <li>MetaMask (recommended)</li>
                <li>Coinbase Wallet</li>
                <li>Rabby Wallet</li>
              </ul>
              <span className="text-xs text-gray-500 mt-1">
                After installing, refresh this page and try again.
              </span>
            </div>,
            duration: 10000,
          });
          
          return; // Exit token creation flow
        }
      } else {
        console.log("[Token Creator] Provider detected:", providerSource);
      }
      
      // Create ethers provider using our utility that handles different environments
      const provider = await createEthersProvider();
      
      if (!provider) {
        throw new Error("Could not create wallet provider. Please try refreshing the page.")
      }
      const signer = provider.getSigner();
      const signerAddress = await signer.getAddress();
      
      // Update deployment status to show approval step
      let deploymentState = { ...initialDeployment };
      const updateStepStatus = (stepId: string, status: 'pending' | 'in_progress' | 'completed' | 'failed', errorMsg?: string) => {
        if (!deploymentState) return;
        
        // Find the step index
        const stepIndex = deploymentState.steps.findIndex(s => s.id === stepId);
        if (stepIndex === -1) return;
        
        // Update the step
        const updatedSteps = [...deploymentState.steps];
        updatedSteps[stepIndex] = {
          ...updatedSteps[stepIndex],
          status,
          timestamp: new Date()
        };
        
        // Update deployment state with new status
        deploymentState = {
          ...deploymentState,
          steps: updatedSteps,
          status: status === 'failed' ? 'failed' : (stepId === 'register' && status === 'completed') ? 'completed' : 'in_progress',
          errorMessage: errorMsg
        };
        
        setDeploymentDetails(deploymentState);
      };
      
      // --- Step 2: Approve TAS token spending ---
      updateStepStatus('approve', 'in_progress');
      
      // Get contract instances
      const tasTokenContract = getTASTokenContract(provider);
      const tokenFactoryAddress = CONTRACT_ADDRESSES.TOKEN_FACTORY;
      
      // Amount to approve (in wei) - using our helper function
      const creationFeeInWei = parseUnits(creationFee.toString(), 18);
      
      try {
        const tasTokenWithSigner = tasTokenContract.connect(signer);
        const approveTx = await tasTokenWithSigner.approve(tokenFactoryAddress, creationFeeInWei);
        
        // Add transaction hash to deployment info
        deploymentState = {
          ...deploymentState,
          transactionHash: approveTx.hash
        };
        setDeploymentDetails(deploymentState);
        
        // Wait for approval transaction to be confirmed
        await approveTx.wait();
        updateStepStatus('approve', 'completed');
      } catch (error) {
        console.error("Approval error:", error);
        updateStepStatus('approve', 'failed', `Failed to approve TAS spending: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
      
      // --- Step 3: Create token using the factory ---
      updateStepStatus('create', 'in_progress');
      
      try {
        // Convert supply to string for the createToken function
        const supplyStr = tokenDetails.supply.toString();
        
        // Create the token
        const result = await createTASToken(
          signer,
          tokenDetails.name,
          tokenDetails.symbol.toUpperCase(),
          supplyStr,
          "", // No logo for now
          "General" // Default category
        );
        
        if (!result || !result.success) {
          throw new Error("Token creation failed");
        }
        
        // Update deployment with token address and transaction hash
        deploymentState = {
          ...deploymentState,
          tokenAddress: result.tokenAddress,
          transactionHash: result.transactionHash
        };
        setDeploymentDetails(deploymentState);
        
        // Set created token details for success dialog
        setCreatedTokenDetails({
          name: tokenDetails.name,
          symbol: tokenDetails.symbol.toUpperCase(),
          contractAddress: result.tokenAddress
        });
        
        // Store transaction hash
        setTxHash(result.transactionHash);
        
        updateStepStatus('create', 'completed');
      } catch (error) {
        console.error("Token creation error:", error);
        updateStepStatus('create', 'failed', `Failed to create token: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
      
      // --- Step 4: Index the token ---
      updateStepStatus('index', 'in_progress');
      // This is typically done by blockchain indexers automatically
      // We'll just simulate a delay for UX purposes
      await new Promise(resolve => setTimeout(resolve, 3000));
      updateStepStatus('index', 'completed');
      
      // --- Step 5: Initialize token parameters ---
      updateStepStatus('initialize', 'in_progress');
      // Here we would typically set initial trading parameters
      // For now, just simulate it
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateStepStatus('initialize', 'completed');
      
      // --- Step 6: Register on TAS platform ---
      updateStepStatus('register', 'in_progress');
      
      try {
        // Register the token in our database
        const registerResponse = await apiRequest("POST", "/api/tokens/register", {
          name: tokenDetails.name,
          symbol: tokenDetails.symbol.toUpperCase(),
          address: deploymentState.tokenAddress,
          supply: tokenDetails.supply.toString(),
          transactionHash: deploymentState.transactionHash,
          initialPrice: 0.01 // Set initial price for the token
        });
        
        if (!registerResponse.ok) {
          throw new Error("Failed to register token on platform");
        }
        
        updateStepStatus('register', 'completed');
        
        // Mark deployment as completed
        deploymentState = {
          ...deploymentState,
          status: 'completed',
          completedAt: new Date()
        };
        setDeploymentDetails(deploymentState);
        
        // Show success dialog
        setShowSuccessDialog(true);
        
        // Refresh user balance
        refreshBalance();
      } catch (error) {
        console.error("Token registration error:", error);
        updateStepStatus('register', 'failed', `Failed to register token: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Token creation process error:", error);
      toast({
        title: "Token Creation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      setIsCreating(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted with values:", tokenDetails);
    
    if (!tokenDetails.name || !tokenDetails.symbol) {
      toast({
        title: "Missing Information",
        description: "Please provide both token name and symbol",
        variant: "destructive"
      });
      return;
    }
    
    if (!isConnected) {
      setShowWalletDialog(true);
      return;
    }
    
    // Execute the token creation
    createToken();
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header with Badge */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary mb-2">
            <Check className="mr-1 h-3 w-3" /> Token Creation
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Create Your <span className="text-primary">TAS Chain</span> Token
          </h1>
          <p className="text-slate-600 max-w-3xl mx-auto">
            Launch your own custom token on TAS Chain with automated bonding curves for instant liquidity and token-specific chat communities.
          </p>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <Link href="/token-marketplace" className="flex items-center text-blue-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Link>
          
          {isMobileDevice() && (
            <Button
              onClick={() => forceCacheBustingReload()}
              variant="outline"
              size="sm"
              className="text-xs flex items-center px-3"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh Wallet
            </Button>
          )}
        </div>
        
        {showDeploymentTracker && deploymentDetails ? (
          <>
            <div className="mb-6">
              <TokenDeploymentTracker 
                deployment={deploymentDetails}
                onUpdate={handleDeploymentUpdate}
                onComplete={handleDeploymentComplete}
                autoSimulate={false}
              />
            </div>
            <div className="text-center mt-4">
              <Button
                onClick={() => setShowDeploymentTracker(false)}
                variant="outline"
                className="mx-auto"
              >
                Hide Deployment Tracker
              </Button>
            </div>
          </>
        ) : (
          <Card className="border-2 border-slate-200">
            <CardHeader className="border-b bg-slate-50">
              <CardTitle className="flex items-center">
                <span className="bg-primary text-white p-1 rounded-full inline-flex items-center justify-center w-7 h-7 mr-2">
                  <Check className="h-4 w-4" />
                </span>
                Create a New Token
              </CardTitle>
              <CardDescription>
                Fill out the form below to create your own TAS Chain token
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Token Name */}
                    <div>
                      <Label htmlFor="name" className="text-base font-medium">Token Name</Label>
                      <Input 
                        id="name"
                        name="name"
                        placeholder="e.g. My Awesome Token" 
                        value={tokenDetails.name}
                        onChange={handleChange}
                        className="mt-1"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        The full name of your token (3-25 characters)
                      </p>
                    </div>
                    
                    {/* Token Symbol */}
                    <div>
                      <Label htmlFor="symbol" className="text-base font-medium">Token Symbol</Label>
                      <Input 
                        id="symbol"
                        name="symbol"
                        placeholder="e.g. MAT" 
                        value={tokenDetails.symbol}
                        onChange={handleChange}
                        className="mt-1"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Short ticker symbol for your token (2-6 characters)
                      </p>
                    </div>
                  </div>
                  
                  {/* Supply Information (Disabled/Display Only) */}
                  <div>
                    <Label className="text-base font-medium">Token Supply</Label>
                    <div className="flex items-center bg-slate-50 p-3 rounded-md mt-1 border">
                      <span className="font-semibold">1,000,000,000 {tokenDetails.symbol || "Tokens"}</span>
                      <Badge className="ml-2 bg-green-100 text-green-800 font-normal">Fixed Supply</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Your token will have a total supply of 1 billion tokens
                    </p>
                  </div>
                  
                  {/* Description */}
                  <div>
                    <Label htmlFor="description" className="text-base font-medium">Description</Label>
                    <textarea
                      id="description"
                      placeholder="Describe your token and its purpose..."
                      value={tokenDetails.description}
                      onChange={handleDescriptionChange}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Briefly describe your token's purpose and features (10-500 characters)
                    </p>
                  </div>
                  
                  {/* Token Logo */}
                  <div>
                    <Label className="text-base font-medium">Token Logo</Label>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="w-20 h-20 border rounded-md flex items-center justify-center overflow-hidden bg-slate-50">
                        {imagePreview ? (
                          <img 
                            src={imagePreview} 
                            alt="Token logo preview" 
                            className="object-contain w-full h-full" 
                          />
                        ) : (
                          <div className="text-slate-400 text-sm text-center">
                            No logo<br/>uploaded
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="relative"
                            onClick={() => document.getElementById('logoUpload')?.click()}
                          >
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
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="sm"
                              onClick={clearImage}
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Upload a 1:1 aspect ratio image (.jpg, .png), max 2MB
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Social Links */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-base font-medium">Social Links</Label>
                      {tokenDetails.socialLinks.length < 5 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={addSocialLink}
                          className="text-xs"
                        >
                          Add Link
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {tokenDetails.socialLinks.map((link, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-1/3">
                            <Input
                              placeholder="Platform (e.g. Twitter)"
                              value={link.platform}
                              onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              placeholder="URL (e.g. https://twitter.com/...)"
                              value={link.url}
                              onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSocialLink(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Add up to 5 social media or website links for your token
                    </p>
                  </div>
                  
                  {/* First Buy Option (Disabled) */}
                  <div className="border rounded-md p-4 bg-slate-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-base font-medium flex items-center">
                          First Buy Option
                          <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300 bg-amber-50">
                            Coming Soon
                          </Badge>
                        </h3>
                        <p className="text-sm text-gray-500">
                          Make the first purchase of your token right after deployment
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <Label htmlFor="firstBuyAmount">Purchase Amount (TAS)</Label>
                      <Input
                        id="firstBuyAmount"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={tokenDetails.firstBuyAmount}
                        onChange={handleFirstBuyAmountChange}
                        disabled={true}
                        className="mt-1 bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This feature will be enabled soon. You will be able to make an initial purchase of your token right after deployment.
                      </p>
                    </div>
                  </div>
                  
                  {/* Token Distribution Info */}
                  <div className="border rounded-md p-4 bg-blue-50">
                    <h3 className="text-base font-medium">Token Distribution Structure</h3>
                    <p className="text-sm text-gray-700 mt-1">
                      Your token will be distributed as follows:
                    </p>
                    <ul className="text-sm text-gray-700 mt-2 list-disc pl-5 space-y-1">
                      <li><span className="font-medium">80% sent to TASliquidity contract</span> → Used for trading operations</li>
                      <li><span className="font-medium">20% locked in protocol</span> → Ensures long-term stability</li>
                    </ul>
                    <div className="mt-3 p-3 bg-white/50 rounded border border-blue-100">
                      <h4 className="text-sm font-medium text-blue-700">How Trading Works:</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        When users buy your token, TAS is sent to the TASliquidity contract and tokens are sent from TASliquidity to the buyer's wallet. 
                        When users sell, tokens go back to the TASliquidity contract and TAS is sent from TASliquidity to the seller's wallet. 
                        This automatic process creates a seamless trading experience with your token always paired with TAS.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-amber-600 mb-4 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Token creation requires {creationFee} TAS tokens
                  </p>
                  
                  <Button 
                    type="submit" 
                    className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-primary" 
                    disabled={isCreating || !hasSufficientBalance}
                  >
                    {isCreating ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Creating Token...
                      </>
                    ) : !hasSufficientBalance ? (
                      'Insufficient TAS Balance'
                    ) : (
                      'Create Token'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-green-600">
              <Check className="h-5 w-5 mr-2" />
              Token Created Successfully
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p>Your token has been successfully created!</p>
              
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
                      <span>Total Supply:</span>
                      <span className="font-medium">1,000,000,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trading Pair:</span>
                      <span className="font-medium">{createdTokenDetails.symbol}/TAS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contract Address:</span>
                      <span className="font-medium">{createdTokenDetails.contractAddress}</span>
                    </div>
                    {txHash && (
                      <div className="flex justify-between items-start mt-2">
                        <span>Transaction:</span>
                        <a 
                          href={`https://tasonscan.com/explorer?txhash=${txHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate max-w-[200px] text-sm"
                        >
                          {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-green-100">
                    <h4 className="font-medium text-green-800 mb-1">Token Distribution</h4>
                    <ul className="text-sm text-green-700 pl-5 list-disc space-y-1">
                      <li>80% (800,000,000) sent to TASliquidity contract for trading</li>
                      <li>20% (200,000,000) locked in protocol for stability</li>
                    </ul>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Wallet Connection Dialog */}
      <AlertDialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-amber-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Wallet Connection Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p>You need to connect your wallet to create a token.</p>
              <p className="mt-2">Once connected, you'll need at least {creationFee} TAS tokens to create your token.</p>
              
              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <h3 className="font-medium text-amber-800 mb-2">What happens when you connect?</h3>
                <ul className="list-disc pl-5 space-y-1 text-amber-700 text-sm">
                  <li>Your wallet will approve spending TAS tokens ({creationFee} TAS)</li>
                  <li>The token factory will create your custom token with 1 billion supply</li>
                  <li>80% of tokens go to TASliquidity contract for trading operations</li>
                  <li>20% of tokens are locked in the protocol for long-term stability</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogAction onClick={() => setShowWalletDialog(false)}>
              Cancel
            </AlertDialogAction>
            <Button
              onClick={() => {
                setShowWalletDialog(false);
                window.location.href = "/wallet";
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Go to Wallet
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SimpleTokenCreator;