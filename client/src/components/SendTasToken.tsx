import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTASChain } from "@/contexts/TASChainContext";
import { Send, Check, Loader2 } from "lucide-react";
import { CONTRACT_ADDRESSES } from "@/lib/contract-addresses";
import { getTASTokenContract, parseUnits } from "@/lib/tasChain";

interface SendTasTokenProps {
  recipientAddress: string;
  amount?: string;
}

export default function SendTasToken({ recipientAddress, amount = "1000" }: SendTasTokenProps) {
  const { toast } = useToast();
  const { provider, signer, refreshBalance } = useTASChain();
  const [isSending, setIsSending] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSendToken = async () => {
    if (!signer || !provider) {
      // Connect wallet if not connected
      if (window.ethereum) {
        try {
          // Prompt user to connect MetaMask if available
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          // Reload to refresh the connection state
          window.location.reload();
        } catch (error) {
          toast({
            title: "Wallet connection failed",
            description: "Please try connecting your wallet again",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Wallet not detected",
          description: "Please install MetaMask or another Web3 wallet to send TAS tokens",
          variant: "destructive",
        });
      }
      return;
    }

    setIsSending(true);
    try {
      // Get TAS token contract
      const tasTokenContract = getTASTokenContract(signer, CONTRACT_ADDRESSES.TAS_TOKEN);
      
      // Convert amount to wei (considering 18 decimals)
      const amountInWei = parseUnits(amount, 18);
      
      // Send tokens
      const tx = await tasTokenContract.transfer(recipientAddress, amountInWei);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Update UI
      setIsComplete(true);
      
      // Refresh balance
      refreshBalance && refreshBalance();
      
      toast({
        title: "Success!",
        description: `${amount} TAS tokens have been sent to your wallet`,
      });
    } catch (error) {
      console.error("Error sending tokens:", error);
      toast({
        title: "Failed to send tokens",
        description: "An error occurred while sending TAS tokens. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button 
      variant={isComplete ? "outline" : "default"}
      className={`w-full flex items-center justify-center gap-2 ${
        isComplete 
          ? "bg-green-100 border-green-500 text-green-700 hover:bg-green-100 hover:text-green-700" 
          : "bg-gradient-to-r from-primary to-sky-400 text-white hover:from-primary/90 hover:to-sky-400/90 animate-pulse"
      }`}
      onClick={handleSendToken}
      disabled={isSending || isComplete}
      size="lg"
    >
      {isSending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Sending {amount} TAS...
        </>
      ) : isComplete ? (
        <>
          <Check className="h-5 w-5" />
          Tokens Successfully Sent!
        </>
      ) : (
        <>
          <Send className="h-5 w-5" />
          Send {amount} TAS to Wallet
        </>
      )}
    </Button>
  );
}