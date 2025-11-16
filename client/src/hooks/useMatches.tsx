import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface MatchFilter {
  type?: 'all' | 'perfect' | 'near' | 'recent';
}

export const useMatches = () => {
  const { toast } = useToast();
  const { translate } = useLanguage();
  
  // Fetch matches from API
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/matches"],
    staleTime: 60000, // 1 minute
  });

  // Find matches mutation
  const { mutate: findMatchesMutation } = useMutation({
    mutationFn: async (matchData: any) => {
      const response = await apiRequest("POST", "/api/matches/find", matchData);
      if (!response.ok) {
        throw new Error("Failed to find matches");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({
        title: translate("success"),
        description: translate("matches_found"),
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

  const findMatches = (matchData: any) => {
    findMatchesMutation(matchData);
  };

  // Filter matches
  const filterMatches = (filter: MatchFilter) => {
    // This would send a request to filter matches on the server
    // For now we'll just return the matches
    return data?.matches || [];
  };

  return {
    matches: data?.matches || [],
    isLoading,
    error,
    findMatches,
    filterMatches,
  };
};
