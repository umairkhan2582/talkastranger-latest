import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ethers } from 'ethers';
import { getTokenContract } from '../utils/contractUtils';
import { TAS_TOKEN_ADDRESS, TAS_TOKEN_SALE_ADDRESS } from '../utils/contractUtils';
import { Loader2 } from 'lucide-react';

export default function TransferToContract() {
  const [amount, setAmount] = useState("50000000");
  const [balance, setBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [activateSuccess, setActivateSuccess] = useState(false);
  const [activateError, setActivateError] = useState("");
  const [activateTxHash, setActivateTxHash] = useState("");
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    async function checkBalance() {
      try {
        if (window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          await provider.send("eth_requestAccounts", []);
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          
          const tasContract = await getTokenContract(TAS_TOKEN_ADDRESS);
          const bal = await tasContract.balanceOf(address);
          setBalance(ethers.utils.formatUnits(bal, 18));
        }
      } catch (err) {
        console.error("Error checking balance:", err);
      }
    }
    
    checkBalance();
  }, []);

  const handleTransfer = async () => {
    setIsLoading(true);
    setError("");
    setSuccess(false);
    setTxHash("");
    
    try {
      const tasContract = await getTokenContract(TAS_TOKEN_ADDRESS, true);
      
      // Convert amount to wei (with 18 decimals)
      const amountWei = ethers.utils.parseUnits(amount, 18);
      
      // Transfer tokens to the contract
      const tx = await tasContract.transfer(TAS_TOKEN_SALE_ADDRESS, amountWei);
      setTxHash(tx.hash);
      
      // Wait for transaction to be mined
      await tx.wait();
      setSuccess(true);
    } catch (err: any) {
      console.error("Transfer error:", err);
      setError(err.message || "Error transferring tokens");
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateSale = async () => {
    setIsActivating(true);
    setActivateError("");
    setActivateSuccess(false);
    setActivateTxHash("");
    
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        
        // Create contract instance with correct ABI for activateSale
        const saleContractABI = ["function activateSale()"];
        const saleContract = new ethers.Contract(
          TAS_TOKEN_SALE_ADDRESS,
          saleContractABI,
          signer
        );
        
        // Call activateSale function
        const tx = await saleContract.activateSale();
        setActivateTxHash(tx.hash);
        
        // Wait for transaction to be mined
        await tx.wait();
        setActivateSuccess(true);
      }
    } catch (err: any) {
      console.error("Activation error:", err);
      setActivateError(err.message || "Error activating sale");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Transfer Tokens to Contract</CardTitle>
          <CardDescription>
            Transfer TAS tokens to the newly deployed contract
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="balance">Current Balance</Label>
              <Input 
                id="balance" 
                value={`${balance} TAS`} 
                disabled 
              />
            </div>
            
            <div>
              <Label htmlFor="contract-address">Contract Address</Label>
              <Input 
                id="contract-address" 
                value={TAS_TOKEN_SALE_ADDRESS} 
                disabled 
              />
            </div>
            
            <div>
              <Label htmlFor="amount">Amount to Transfer</Label>
              <Input 
                id="amount" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                min="0"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Recommended: 50,000,000 TAS (5% of total supply)
              </p>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mt-4">
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Tokens transferred successfully.
                {txHash && (
                  <div className="mt-2">
                    <a 
                      href={`https://bscscan.com/tx/${txHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      View on BSCScan
                    </a>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleTransfer} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transferring...
              </>
            ) : (
              'Transfer Tokens'
            )}
          </Button>
        </CardFooter>
      </Card>

      {success && (
        <Card className="w-full max-w-md mx-auto mt-6">
          <CardHeader>
            <CardTitle>Activate Sale</CardTitle>
            <CardDescription>
              Activate the token sale after transferring tokens
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activateError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{activateError}</AlertDescription>
              </Alert>
            )}
            
            {activateSuccess && (
              <Alert className="mb-4">
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  Sale activated successfully.
                  {activateTxHash && (
                    <div className="mt-2">
                      <a 
                        href={`https://bscscan.com/tx/${activateTxHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        View on BSCScan
                      </a>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleActivateSale} 
              disabled={isActivating}
              className="w-full"
            >
              {isActivating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                'Activate Sale'
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="w-full max-w-md mx-auto mt-6">
        <p className="text-sm text-muted-foreground">
          <strong>Next Steps:</strong>
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground">
          <li className={success ? "line-through" : ""}>Transfer 50,000,000 TAS tokens to the contract</li>
          <li className={activateSuccess ? "line-through" : ""}>Activate the sale by calling activateSale()</li>
          <li>
            <a 
              href={`https://bscscan.com/address/${TAS_TOKEN_SALE_ADDRESS}#code`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Verify the contract on BSCScan
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}