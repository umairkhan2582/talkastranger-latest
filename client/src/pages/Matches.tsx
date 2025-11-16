import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import MatchResultsSection from "@/components/MatchResultsSection";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/contexts/WalletContext";
import { useMatches } from "@/hooks/useMatches";

const Matches = () => {
  const { translate } = useLanguage();
  const { isConnected } = useWallet();
  const { toast } = useToast();
  const { matches, isLoading, error } = useMatches();

  useEffect(() => {
    if (error) {
      toast({
        title: translate("error"),
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast, translate]);

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-12 text-center">
          <h2 className="text-2xl font-heading font-semibold text-dark-800 mb-4">
            {translate("connect_wallet_prompt")}
          </h2>
          <p className="text-dark-600 mb-6">
            {translate("connect_wallet_to_see_matches")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm mb-12">
        <div className="p-6">
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-dark-800 leading-tight mb-4">
            {translate("your_matches")}
          </h1>
          <p className="text-lg text-dark-600">
            {translate("matches_description")}
          </p>
        </div>
      </div>
      <MatchResultsSection fullpage={true} />
    </div>
  );
};

export default Matches;
