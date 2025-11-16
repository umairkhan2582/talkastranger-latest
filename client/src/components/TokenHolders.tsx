import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TokenHolder {
  address: string;
  balance: string;
  percentage: number;
  isDeveloper?: boolean;
}

interface TokenHoldersProps {
  holders: TokenHolder[];
  maxCap: number; // Maximum price cap in USD
  currentPrice: number; // Current token price in USD
  highestPrice: number; // Highest price reached so far
  tokenSymbol: string;
}

const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const getInitials = (address: string) => {
  return address.slice(2, 4).toUpperCase();
};

const TokenHolders: React.FC<TokenHoldersProps> = ({
  holders,
  maxCap,
  currentPrice,
  highestPrice,
  tokenSymbol
}) => {
  // Calculate percentage of cap reached
  const capPercentage = Math.min(100, (currentPrice / maxCap) * 100);
  
  // Sort holders by percentage (descending)
  const sortedHolders = [...holders].sort((a, b) => b.percentage - a.percentage);

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Bonding Curve Progress</h3>
            <span className="text-sm font-medium">
              ${currentPrice.toFixed(2)} / ${maxCap.toFixed(2)}
            </span>
          </div>
          <Progress value={capPercentage} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>0%</span>
            <span>{capPercentage.toFixed(1)}%</span>
            <span>100%</span>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            <span>Highest price reached: ${highestPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Token Holders</h3>
          <div className="space-y-3">
            {sortedHolders.map((holder, index) => (
              <div key={holder.address} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Avatar className={holder.isDeveloper ? "border-2 border-primary" : ""}>
                    <AvatarFallback className="bg-primary/10">
                      {getInitials(holder.address)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="text-sm font-medium hover:underline">
                          {shortenAddress(holder.address)}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{holder.address}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-xs text-muted-foreground">
                      {parseFloat(holder.balance).toFixed(2)} {tokenSymbol}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{holder.percentage.toFixed(2)}%</span>
                  {holder.isDeveloper && (
                    <Badge variant="outline" className="bg-primary/10 text-xs">
                      Developer
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenHolders;