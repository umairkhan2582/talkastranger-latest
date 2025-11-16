import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMatches } from "@/hooks/useMatches";
import { useChat } from "@/hooks/useChat";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";

interface MatchResultsSectionProps {
  fullpage?: boolean;
}

const MatchResultsSection = ({ fullpage = false }: MatchResultsSectionProps) => {
  const { translate } = useLanguage();
  const { matches, isLoading, error } = useMatches();
  const { startChat } = useChat();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");

  const filteredMatches = matches.filter(match => {
    if (filter === "all") return true;
    if (filter === "perfect") return match.matchType === "perfect";
    if (filter === "near") return match.matchType === "near";
    if (filter === "recent") return new Date(match.lastActive).getTime() > Date.now() - 1000 * 60 * 60 * 24; // Last 24 hours
    return true;
  });

  const handleStartChat = (userId: number) => {
    try {
      startChat(userId);
      toast({
        title: translate("success"),
        description: translate("chat_started"),
      });
    } catch (error) {
      toast({
        title: translate("error"),
        description: `${error}`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <section id="matches-section" className="bg-white rounded-xl shadow-sm p-6 mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading font-semibold text-dark-800">{translate("your_matches")}</h2>
        </div>
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-dark-500">{translate("loading_matches")}</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="matches-section" className="bg-white rounded-xl shadow-sm p-6 mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading font-semibold text-dark-800">{translate("your_matches")}</h2>
        </div>
        <div className="text-center py-10 text-red-500">
          <Info className="h-8 w-8 mx-auto mb-2" />
          <p>{translate("error_loading_matches")}: {error.message}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="matches-section" className="bg-white rounded-xl shadow-sm p-6 mb-12">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-dark-800">{translate("your_matches") || "Your Trading Matches"}</h2>
          <p className="text-sm text-slate-600 mt-1">
            {translate("matches_description") || "Connect with traders who want your tokens and have tokens you're interested in"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-dark-500">{translate("filter_by") || "Filter by"}:</span>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={translate("all_matches") || "All Matches"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{translate("all_matches") || "All Matches"}</SelectItem>
              <SelectItem value="perfect">{translate("perfect_matches") || "Perfect Matches"}</SelectItem>
              <SelectItem value="near">{translate("near_matches") || "Near Matches"}</SelectItem>
              <SelectItem value="recent">{translate("recent_activity") || "Recent Activity"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-blue-800 mb-1">{translate("what_are_matches") || "What Are Trading Matches?"}</h3>
            <p className="text-sm text-blue-700">
              {translate("what_are_matches_description") || "Trading matches are other users who are offering tokens you want and seeking tokens you have. Perfect matches are exact matches of your preferences, while near matches are close but not exact. Chat with your matches to negotiate trades and learn about new tokens."}
            </p>
          </div>
        </div>
      </div>
      
      {filteredMatches.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-dark-500">{translate("no_matches_found")}</p>
          {fullpage && (
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => window.location.href = '/'}
            >
              {translate("find_new_matches")}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match) => (
              <div key={match.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 ${match.avatarBg} rounded-full flex items-center justify-center ${match.avatarText} font-medium`}>
                      {match.displayName.split(' ').map(name => name[0]).join('')}
                    </div>
                    <div className="ml-3">
                      <div className="font-medium">{match.displayName}</div>
                      <div className="text-xs text-dark-400">{translate("active")} {match.lastActive}</div>
                    </div>
                  </div>
                  <div className={`${match.matchType === 'perfect' ? 'bg-success' : 'bg-warning'} text-white text-xs px-2 py-1 rounded-full font-medium`}>
                    {match.matchType === 'perfect' ? translate("perfect_match") : translate("near_match")}
                  </div>
                </div>
                
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg mb-4">
                  <div className="flex items-center">
                    <div className={`${match.offerToken.bg} p-1.5 rounded-full`}>
                      <svg className={`h-5 w-5 ${match.offerToken.textColor}`} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                      </svg>
                    </div>
                    <div className="ml-2">
                      <div className="text-sm font-medium">{match.offerToken.name}</div>
                      <div className="text-xs text-dark-400">{match.offerToken.amount} {match.offerToken.symbol}</div>
                    </div>
                  </div>
                  <div className="text-dark-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div className="flex items-center">
                    <div className={`${match.wantToken.bg} p-1.5 rounded-full`}>
                      <svg className={`h-5 w-5 ${match.wantToken.textColor}`} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                      </svg>
                    </div>
                    <div className="ml-2">
                      <div className="text-sm font-medium">{match.wantToken.name}</div>
                      <div className="text-xs text-dark-400">{match.wantToken.amount} {match.wantToken.symbol}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    className="text-primary hover:text-primary-600 text-sm font-medium flex items-center"
                    onClick={() => toast({
                      title: translate("info"),
                      description: translate("profile_view_not_implemented"),
                    })}
                  >
                    <Info className="h-4 w-4 mr-1" />
                    {translate("view_profile")}
                  </Button>
                  <Button
                    onClick={() => handleStartChat(match.userId)}
                    className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    {translate("start_chat")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredMatches.length >= 3 && (
            <div className="mt-6 text-center">
              <Button 
                variant="ghost" 
                className="text-primary hover:text-primary-600 font-medium flex items-center mx-auto"
                onClick={() => toast({
                  title: translate("info"),
                  description: translate("load_more_not_implemented"),
                })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
                {translate("load_more_matches")}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default MatchResultsSection;
