import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useTASChain } from '@/contexts/TASChainContext';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import { CONTRACT_ADDRESSES } from '@/lib/contract-addresses';
import { getTASTokenContract, parseUnits } from '@/lib/tasChain';

const OWNER_ADDRESS = '0x14c30d9139cbbca09e8232938fe265fbf120eaaa';
const TAS_TOKEN_ADDRESS = '0xd9541b134b1821736bd323135b8844d3ae408216';

export default function SendTASToOwner() {
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { signer, provider, address, explorer } = useTASChain();
  const { toast } = useToast();

  const sendTAS = async (amount: string) => {
    if (!signer || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to send TAS tokens.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log('Sending TAS to owner address:', OWNER_ADDRESS);
      
      // Convert amount to wei (TAS has 18 decimals)
      const amountInWei = parseUnits(amount, 18);
      console.log('Amount in wei:', amountInWei.toString());
      
      // Get the TAS token contract with signer
      const tasToken = getTASTokenContract(provider).connect(signer);
      console.log('TAS token contract connected with signer');
      
      // Send transaction
      console.log('Sending transaction...');
      const tx = await tasToken.transfer(OWNER_ADDRESS, amountInWei);
      console.log('Transaction sent, hash:', tx.hash);
      
      // Wait for transaction to be mined
      console.log('Waiting for transaction confirmation...');
      await tx.wait();
      console.log('Transaction confirmed');
      
      setTxHash(tx.hash);
      
      toast({
        title: "TAS Tokens Sent",
        description: `Successfully sent ${amount} TAS to owner`,
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Send TAS to Owner</CardTitle>
        <CardDescription>
          Send TAS tokens directly to the owner wallet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-md overflow-hidden break-all text-xs">
            <p className="font-semibold">Owner Address:</p>
            <p>{OWNER_ADDRESS}</p>
          </div>
          {txHash && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-md overflow-hidden break-all text-xs">
              <p className="font-semibold text-green-800">Transaction Success!</p>
              <a 
                href={explorer.getTxUrl(txHash)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View on Explorer: {txHash.substring(0, 14)}...{txHash.substring(txHash.length - 14)}
              </a>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="flex space-x-2 w-full">
          <Button 
            variant="outline" 
            onClick={() => sendTAS("10000")}
            disabled={isLoading || !signer}
            className="w-full"
          >
            {isLoading ? "Sending..." : "Send 10,000 TAS"}
          </Button>
          <Button 
            onClick={() => sendTAS("100000")}
            disabled={isLoading || !signer}
            className="w-full"
          >
            {isLoading ? "Sending..." : "Send 100,000 TAS"}
          </Button>
        </div>
        <Button 
          variant="destructive" 
          onClick={() => sendTAS("1000000000")}
          disabled={isLoading || !signer}
          className="w-full"
        >
          {isLoading ? "Sending..." : "Send 1 Billion TAS (Entire Supply)"}
        </Button>
      </CardFooter>
    </Card>
  );
}