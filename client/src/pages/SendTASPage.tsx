import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { ethers } from 'ethers';
import { parseUnits } from '@/lib/tasChain';

// Your wallet address
const OWNER_ADDRESS = '0x14c30d9139cbbca09e8232938fe265fbf120eaaa';
// TAS token address on BSC
const TAS_TOKEN_ADDRESS = '0xd9541b134b1821736bd323135b8844d3ae408216';

// Simple ERC20 ABI for the transfer function
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

const SendTASPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('1000000');
  const [txHash, setTxHash] = useState<string | null>(null);

  const connectAndSend = async () => {
    setIsLoading(true);
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        toast({
          title: "Wallet Not Detected",
          description: "Please install MetaMask or another Web3 wallet",
          variant: "destructive"
        });
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];

      // Create a provider
      let provider, signer;
      
      // We're using ethers v5 in this project
      if (ethers.providers && typeof ethers.providers.Web3Provider === 'function') {
        // ethers v5 
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
      } else {
        throw new Error("Ethers provider not found");
      }

      // Create contract instance
      const tasToken = new ethers.Contract(TAS_TOKEN_ADDRESS, ERC20_ABI, signer);
      
      // Get decimals
      const decimals = await tasToken.decimals();
      
      // Convert amount to wei - using imported parseUnits or ethers utils based on version
      const amountInWei = parseUnits(amount, decimals);
      
      // Send transaction
      const tx = await tasToken.transfer(OWNER_ADDRESS, amountInWei);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      setTxHash(tx.hash);
      
      toast({
        title: "TAS Tokens Sent Successfully!",
        description: `You sent ${amount} TAS to the owner's wallet`,
      });
    } catch (error) {
      console.error("Error sending TAS:", error);
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Failed to send TAS tokens",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Send <span className="text-primary">TAS Tokens</span> to Owner
        </h1>
        <p className="text-slate-600 max-w-md mx-auto">
          Use this page to send TAS tokens directly to the owner's wallet
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>TAS Token Transfer</CardTitle>
          <CardDescription>
            Send TAS tokens to owner: {OWNER_ADDRESS.slice(0, 6)}...{OWNER_ADDRESS.slice(-4)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount to Send</label>
            <Input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              This will send TAS tokens from your wallet to the owner
            </p>
          </div>

          {txHash && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-md overflow-hidden break-all text-xs">
              <p className="font-semibold text-green-800">Transaction Success!</p>
              <a 
                href={`https://tasonscan.com/explorer?txhash=${txHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View on Explorer: {txHash.substring(0, 14)}...{txHash.substring(txHash.length - 14)}
              </a>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={connectAndSend}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary to-blue-500 text-white"
          >
            {isLoading ? "Sending..." : "Connect and Send TAS"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SendTASPage;