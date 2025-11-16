import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { TokenData } from "@/lib/tokens";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface CustomToken {
  name: string;
  symbol: string;
  network: string;
  contractAddress: string;
}

export const useTokens = () => {
  const { toast } = useToast();
  const { translate } = useLanguage();
  
  // Fetch tokens from API
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/tokens"],
    staleTime: 60000, // 1 minute
  });

  // Add custom token mutation
  const { mutate: addTokenMutation } = useMutation({
    mutationFn: async (tokenData: CustomToken) => {
      const response = await apiRequest("POST", "/api/tokens/custom", tokenData);
      if (!response.ok) {
        throw new Error("Failed to add custom token");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
      toast({
        title: translate("success"),
        description: translate("custom_token_added"),
      });
    },
    onError: (error) => {
      toast({
        title: translate("error"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  });

  const addCustomToken = (tokenData: CustomToken) => {
    addTokenMutation(tokenData);
  };

  // Default to empty arrays if data is not yet loaded
  const myTokens: TokenData[] = data?.myTokens || [];
  const popularTokens: TokenData[] = data?.popularTokens || [];

  return {
    myTokens,
    popularTokens,
    isLoading,
    error,
    addCustomToken,
  };
};
