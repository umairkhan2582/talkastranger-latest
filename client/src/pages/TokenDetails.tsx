import React from "react";
import { useParams, Link } from "wouter";
import { useTokenDetails } from "@/hooks/useTokenDetails";
import { useTASChain } from "@/contexts/TASChainContext";
import { useLanguage } from "@/contexts/LanguageContext";
import TokenHolders from "@/components/TokenHolders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ChevronLeft, Copy, CreditCard } from "lucide-react";
import { getExplorerTokenUrl } from "@/lib/tasChain";
import { toast } from "@/hooks/use-toast";

const TokenDetails: React.FC = () => {
  const { translate: t } = useLanguage();
  const { tokenAddress } = useParams<{ tokenAddress: string }>();
  const { explorer } = useTASChain();
  const { 
    name, 
    symbol, 
    totalSupply, 
    creator, 
    holders, 
    currentPrice, 
    highestPrice, 
    maxCap, 
    isLoading, 
    error 
  } = useTokenDetails(tokenAddress);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t("copied_to_clipboard"),
      description: `${type} ${t("has_been_copied_to_clipboard")}`,
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const explorerTokenUrl = getExplorerTokenUrl(tokenAddress);

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/marketplace">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t("back_to_marketplace")}
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Skeleton className="h-[500px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/marketplace">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t("back_to_marketplace")}
            </Link>
          </Button>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">{t("error_loading_token")}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              {t("try_again")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/marketplace">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("back_to_marketplace")}
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl font-bold">{name}</CardTitle>
                    <Badge variant="outline" className="ml-2">
                      {symbol}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1">
                    {t("token_created_on_tas_chain")}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={explorerTokenUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t("view_in_explorer")}
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col p-4 rounded-lg bg-secondary/30">
                    <span className="text-sm text-muted-foreground">{t("current_price")}</span>
                    <span className="text-2xl font-bold">${currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col p-4 rounded-lg bg-secondary/30">
                    <span className="text-sm text-muted-foreground">{t("total_supply")}</span>
                    <span className="text-2xl font-bold">{Number(totalSupply).toLocaleString()} {symbol}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-2">{t("token_information")}</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground">{t("contract_address")}</span>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 rounded bg-secondary text-xs font-mono">
                          {formatAddress(tokenAddress)}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => copyToClipboard(tokenAddress, t("contract_address"))}
                          className="h-7 w-7"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground">{t("creator")}</span>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 rounded bg-secondary text-xs font-mono">
                          {formatAddress(creator)}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => copyToClipboard(creator, t("creator_address"))}
                          className="h-7 w-7"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground">{t("price_cap")}</span>
                      <span className="font-medium">${maxCap.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button className="w-full sm:w-auto" asChild>
                    <Link href={`/token/${tokenAddress}/trade`}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      {t("trade_token")}
                    </Link>
                  </Button>
                </div>
                
                {/* Debug link (click directly) */}
                <div className="text-xs text-muted-foreground mt-2 text-center">
                  <a href={`/token/${tokenAddress}/trade`} target="_blank" rel="noopener noreferrer">
                    Direct link to trade page
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <TokenHolders 
            holders={holders}
            maxCap={maxCap}
            currentPrice={currentPrice}
            highestPrice={highestPrice}
            tokenSymbol={symbol}
          />
        </div>
      </div>
    </div>
  );
};

export default TokenDetails;