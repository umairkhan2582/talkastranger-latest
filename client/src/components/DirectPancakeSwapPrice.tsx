import React, { useEffect, useState } from 'react';
import { getDirectTASPriceFromPancakeSwap, getTASPriceFromDexScreener } from '../utils/priceUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const DirectPancakeSwapPrice: React.FC = () => {
  const [pancakePrice, setPancakePrice] = useState<number | null>(null);
  const [dexScreenerPrice, setDexScreenerPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get prices from both sources in parallel
      const [dexScreenerPricePromise, routerPricePromise] = [
        getTASPriceFromDexScreener().catch(e => {
          console.error("DexScreener error:", e);
          return null;
        }),
        getDirectTASPriceFromPancakeSwap().catch(e => {
          console.error("PancakeSwap error:", e);
          return null;
        })
      ];
      
      // Wait for both to complete
      const [dexScreenerResult, routerResult] = await Promise.all([
        dexScreenerPricePromise,
        routerPricePromise
      ]);
      
      // Set prices if available
      if (dexScreenerResult !== null) {
        setDexScreenerPrice(dexScreenerResult);
      }
      
      if (routerResult !== null) {
        setPancakePrice(routerResult);
      }
      
      // Check if we got at least one price
      if (dexScreenerResult === null && routerResult === null) {
        setError("Failed to fetch prices from both DexScreener and PancakeSwap");
      } else {
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Error fetching prices:", err);
      setError("Failed to fetch the latest price");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPrices();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
      <CardHeader>
        <CardTitle>TAS Token Price</CardTitle>
        <CardDescription>Real-time prices from multiple sources</CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : (
          <div className="space-y-4">
            {dexScreenerPrice !== null && (
              <div className="bg-primary/10 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">DexScreener API Price:</p>
                <p className="text-3xl font-bold">${dexScreenerPrice.toFixed(6)}</p>
                <p className="text-xs text-muted-foreground mt-1">Latest price from DexScreener API</p>
              </div>
            )}
            
            {pancakePrice !== null && (
              <div className="bg-primary/5 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">PancakeSwap Router Price:</p>
                <p className="text-2xl font-bold">${pancakePrice.toFixed(6)}</p>
                <p className="text-xs text-muted-foreground mt-1">Direct price using PancakeSwap Router</p>
              </div>
            )}
            
            {lastUpdated && (
              <p className="text-xs text-muted-foreground text-center">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={fetchPrices} 
          className="w-full" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : 'Refresh Prices'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DirectPancakeSwapPrice;