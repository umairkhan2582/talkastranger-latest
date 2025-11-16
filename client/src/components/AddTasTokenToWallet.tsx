import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Plus } from "lucide-react";
import { CONTRACT_ADDRESSES } from "@/lib/contract-addresses";

export default function AddTasTokenToWallet() {
  const { toast } = useToast();

  const handleAddToken = async () => {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        toast({
          title: "MetaMask not detected",
          description: "Please install MetaMask browser extension to add TAS token",
          variant: "destructive",
        });
        return;
      }

      // Add the TAS token to MetaMask
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: CONTRACT_ADDRESSES.TAS_TOKEN,
            symbol: 'TAS',
            decimals: 18,
            image: 'https://taschain.io/assets/logo.png',
          },
        },
      });

      if (wasAdded) {
        toast({
          title: "Success!",
          description: "TAS token was added to your wallet",
        });
      } else {
        toast({
          title: "Failed to add token",
          description: "You may have denied the request or the token is already added",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding token to wallet:", error);
      toast({
        title: "Error",
        description: "Failed to add token to wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      variant="outline" 
      className="flex items-center gap-2 bg-white border-primary text-primary hover:bg-primary hover:text-white"
      onClick={handleAddToken}
    >
      <Plus className="h-4 w-4" />
      <Wallet className="h-4 w-4" /> 
      Add TAS to Wallet
    </Button>
  );
}

// Add TypeScript declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (request: { method: string; params?: any }) => Promise<any>;
    };
  }
}