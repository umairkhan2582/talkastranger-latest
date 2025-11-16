import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DeploymentPage() {
  const [privateKey, setPrivateKey] = useState('');
  const [bscScanApiKey, setBscScanApiKey] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<string | null>(null);
  const [deployedAddresses, setDeployedAddresses] = useState<{
    tasToken?: string;
    tokenFactory?: string;
    swapMarket?: string;
  }>({});
  const { toast } = useToast();

  const handleDeploy = async () => {
    if (!privateKey || !bscScanApiKey) {
      toast({
        title: "Missing information",
        description: "Please provide both private key and BSC Scan API key.",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus('Starting deployment...');

    try {
      // Step 1: Deploy TAS Token
      setDeploymentStatus('Deploying TAS Token...');
      const tasTokenResponse = await fetch('/api/deploy/tas-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privateKey, bscScanApiKey }),
      });

      if (!tasTokenResponse.ok) throw new Error('Failed to deploy TAS Token');
      const tasTokenData = await tasTokenResponse.json();
      setDeployedAddresses(prev => ({ ...prev, tasToken: tasTokenData.contractAddress }));
      
      // Step 2: Deploy Token Factory
      setDeploymentStatus('Deploying Token Factory...');
      const tokenFactoryResponse = await fetch('/api/deploy/token-factory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          privateKey, 
          bscScanApiKey,
          tasTokenAddress: tasTokenData.contractAddress 
        }),
      });

      if (!tokenFactoryResponse.ok) throw new Error('Failed to deploy Token Factory');
      const tokenFactoryData = await tokenFactoryResponse.json();
      setDeployedAddresses(prev => ({ ...prev, tokenFactory: tokenFactoryData.contractAddress }));
      
      // Step 3: Deploy Swap Market
      setDeploymentStatus('Deploying Swap Market...');
      const swapMarketResponse = await fetch('/api/deploy/swap-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          privateKey, 
          bscScanApiKey,
          tasTokenAddress: tasTokenData.contractAddress 
        }),
      });

      if (!swapMarketResponse.ok) throw new Error('Failed to deploy Swap Market');
      const swapMarketData = await swapMarketResponse.json();
      setDeployedAddresses(prev => ({ ...prev, swapMarket: swapMarketData.contractAddress }));
      
      setDeploymentStatus('All contracts deployed successfully!');
      toast({
        title: "Deployment Successful",
        description: "All TAS Chain contracts have been deployed to BSC mainnet!",
      });
    } catch (error) {
      console.error('Deployment error:', error);
      setDeploymentStatus(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred during deployment',
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const clearSensitiveData = () => {
    setPrivateKey('');
    setBscScanApiKey('');
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Deploy TAS Chain Contracts</CardTitle>
          <CardDescription>
            Deploy contracts to BSC mainnet. Make sure your wallet has enough BNB for gas fees.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="privateKey">Private Key</Label>
            <Input
              id="privateKey"
              type="password"
              placeholder="Your wallet private key"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This key is only used for deployment and is never stored.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bscScanApiKey">BSC Scan API Key</Label>
            <Input
              id="bscScanApiKey"
              type="password"
              placeholder="Your BSC Scan API key"
              value={bscScanApiKey}
              onChange={(e) => setBscScanApiKey(e.target.value)}
            />
          </div>

          {deploymentStatus && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <p>{deploymentStatus}</p>
              
              {deployedAddresses.tasToken && (
                <p className="mt-2">
                  <strong>TAS Token:</strong> {deployedAddresses.tasToken}
                </p>
              )}
              
              {deployedAddresses.tokenFactory && (
                <p className="mt-1">
                  <strong>Token Factory:</strong> {deployedAddresses.tokenFactory}
                </p>
              )}
              
              {deployedAddresses.swapMarket && (
                <p className="mt-1">
                  <strong>Swap Market:</strong> {deployedAddresses.swapMarket}
                </p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={clearSensitiveData}>Clear</Button>
          <Button onClick={handleDeploy} disabled={isDeploying}>
            {isDeploying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : 'Deploy Contracts'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}