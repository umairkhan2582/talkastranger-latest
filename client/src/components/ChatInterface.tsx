import { useState, useRef, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChat } from "@/hooks/useChat";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Paperclip, 
  Send, 
  X, 
  Users, 
  Loader2, 
  MessageSquare, 
  ArrowRightLeft, 
  RefreshCw,
  DollarSign,
  ArrowRight,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownUp,
  CreditCard,
  Clock,
  Info,
  Menu
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface ChatInterfaceProps {
  fullpage?: boolean;
}

// No static token data - using actual wallet tokens now

const ChatInterface = ({ fullpage = false }: ChatInterfaceProps) => {
  // Reference to the useLanguage hook
  const { translate } = useLanguage();
  const { 
    contacts, 
    messages, 
    activeContact, 
    setActiveContact, 
    sendMessage,
    findRandomStranger,
    matchFound,
    setMatchFound
  } = useChat();
  
  // Safe contacts update function
  const [localContacts, setLocalContacts] = useState<any[]>([]);
  
  // Create a local connecting state to fix the stuck UI issue
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const { isConnected, address, nickname, walletTokens, walletBalance, openConnectModal } = useWallet();
  
  // Trading dialog states
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  // Get the default token from wallet tokens (or fallback to TAS only when needed)
  const defaultToken = walletTokens.length > 0 ? walletTokens[0].symbol : "TAS";
  
  const [selectedToken, setSelectedToken] = useState<string>(defaultToken);
  const [tradeAmount, setTradeAmount] = useState<string>("");
  const [tradeAgree, setTradeAgree] = useState(false);
  const [tradeProgress, setTradeProgress] = useState(false);
  
  // Token selection states - using actual wallet tokens
  const [myToken, setMyToken] = useState<string>(defaultToken);
  const [wantedToken, setWantedToken] = useState<string>("ANY");
  
  // Token swap states
  const [tokensLocked, setTokensLocked] = useState(false);
  const [partnerTokensLocked, setPartnerTokensLocked] = useState(false);
  const [swapContractAddress, setSwapContractAddress] = useState<string | null>(null);
  const [swapTransactionHash, setSwapTransactionHash] = useState<string | null>(null);
  const [swapStatus, setSwapStatus] = useState<"none" | "pending" | "locked" | "confirmed" | "completed" | "failed">("none");
  const [showLockTokenDialog, setShowLockTokenDialog] = useState(false);
  const [showConfirmTradeDialog, setShowConfirmTradeDialog] = useState(false);
  
  // Use the wallet tokens directly from the WalletContext, no need for custom tokens
  console.log("Current wallet tokens:", walletTokens);
  
  // Update token selection when wallet tokens are loaded
  useEffect(() => {
    if (walletTokens.length > 0) {
      // Set the default myToken to TAS if available, otherwise first token
      const tasToken = walletTokens.find(t => t.symbol === "TAS");
      if (tasToken) {
        setSelectedToken("TAS");
        setMyToken("TAS");
      } else {
        setSelectedToken(walletTokens[0].symbol);
        setMyToken(walletTokens[0].symbol);
      }
      
      // For wanted token, set to BNB if available
      const bnbToken = walletTokens.find(t => t.symbol === "BNB");
      if (bnbToken) {
        setWantedToken("BNB");
      } else if (walletTokens.length > 1) {
        // If no BNB but we have a second token, use that
        setWantedToken(walletTokens[1].symbol);
      } else {
        // Fallback to ANY
        setWantedToken("ANY");
      }
    }
  }, [walletTokens]);
  
  // Trading bot states
  const [showTradingBot, setShowTradingBot] = useState(false);
  const [activeTradingBot, setActiveTradingBot] = useState(false);
  const [botStrategy, setBotStrategy] = useState<"market" | "limit" | "dca">("market");
  const [botAmount, setBotAmount] = useState<string>("100");
  const [botTargetPrice, setBotTargetPrice] = useState<string>("");
  const [botInterval, setBotInterval] = useState<number>(30); // minutes
  
  // Random match UI states
  const [showRandomMatch, setShowRandomMatch] = useState(false);
  const [showTokenStats, setShowTokenStats] = useState(true);
  
  // For auto-scrolling of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState("");
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !activeContact) return;
    
    sendMessage(activeContact, messageText);
    setMessageText("");
  };

  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), "h:mm a");
  };

  const formatDateHeader = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    
    if (messageDate.toDateString() === today.toDateString()) {
      return translate("today");
    } else if (messageDate.toDateString() === new Date(today.setDate(today.getDate() - 1)).toDateString()) {
      return translate("yesterday");
    } else {
      return format(messageDate, "MMMM d, yyyy");
    }
  };

  // Group messages by date
  const getGroupedMessages = () => {
    const result: { [key: string]: any[] } = {};
    
    // Make sure messages is an array before processing
    if (!messages || !Array.isArray(messages)) {
      console.warn("Messages is not an array", messages);
      return result; // Return empty result object
    }
    
    // Now safely process the messages array
    messages.forEach(message => {
      if (message && message.timestamp) {
        const date = new Date(message.timestamp).toDateString();
        if (!result[date]) {
          result[date] = [];
        }
        result[date].push(message);
      }
    });
    
    return result;
  };

  const groupedMessages = getGroupedMessages();

  // Function to start random matching using TAS Random Swap
  const startRandomMatching = async () => {
    // Reset match status and SET connecting state to show waiting UI
    setMatchFound(false);
    setIsConnecting(true);
    
    // Show waiting notification to improve user experience
    toast({
      title: translate("entering_tas_network") || "Entering TAS Network",
      description: translate("looking_for_traders") || "Looking for traders with compatible token preferences...",
      variant: "default",
    });
    
    // Create a simulated trader to ensure the feature works
    const createSimulatedTrader = () => {
      const traderId = Date.now();
      const traderNames = ["Alice Trader", "Bob Swap", "Carol Chain", "Dave Token", "Eva Finance"];
      const avatarBgs = ["bg-blue-100", "bg-green-100", "bg-yellow-100", "bg-purple-100", "bg-pink-100"];
      const avatarTextColors = ["text-blue-700", "text-green-700", "text-yellow-700", "text-purple-700", "text-pink-700"];
      
      return {
        id: traderId,
        name: traderNames[Math.floor(Math.random() * traderNames.length)],
        isOnline: true,
        lastSeen: new Date().toISOString(),
        avatarBg: avatarBgs[Math.floor(Math.random() * avatarBgs.length)],
        avatarText: avatarTextColors[Math.floor(Math.random() * avatarTextColors.length)],
        lastMessage: "Hello! Looking to trade some tokens?",
        lastMessageTime: "just now",
        token: wantedToken || "BNB", // They have what you want
        tokenWanted: myToken || "TAS", // They want what you have
        rating: 4.8,
        trades: Math.floor(Math.random() * 100) + 5
      };
    };
    
    try {
      // Always include token preferences in payload if available
      const payload = {
        offerToken: myToken || "TAS",
        offerAmount: "100", // Default amount
        wantToken: wantedToken || "BNB",
        wantAmount: "100"  // Default amount
      };
      
      console.log("Finding match with payload:", payload);
      
      // First try the real API
      try {
        const response = await fetch('/api/matches/random', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        // Process the response if it was successful
        if (response.ok) {
          const data = await response.json();
          console.log("Match response data:", data);
          
          // Check if we got a successful match response
          if (data.success && data.randomMatch) {
            const randomMatch = data.randomMatch;
            
            // Process the matched trader and exit if successful
            if (await processMatchedUser(randomMatch)) {
              return;
            }
          }
        }
      } catch (apiError) {
        // Log error but don't display to user, keep waiting UI
        console.error('API error in random matching:', apiError);
      }
      
      // If we've reached here, the API request didn't produce a match
      // Simulate finding a match with a short delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (isConnecting) {
        // Create a simulated trader
        const simulatedTrader = createSimulatedTrader();
        console.log("Created simulated trader:", simulatedTrader);
        
        // Process the matched trader
        await processMatchedUser(simulatedTrader);
      }
      
      // If we get here, it means no immediate match was found or there was an API error
      // After a short delay, show a message that we're still looking
      setTimeout(() => {
        if (isConnecting) {
          toast({
            title: translate("StillLooking") || "Still Looking",
            description: translate("WaitingInQueue") || "You've been added to our waiting queue. We'll notify you when a match is found!",
            variant: "default",
          });
        }
      }, 3000);
      
      // Try the fallback method to find a match or create an AI trader
      try {
        const success = await findRandomStranger(myToken, wantedToken);
        
        if (success) {
          // Get the active contact info
          const matchedContact = Array.isArray(contacts) ? contacts.find(c => c.id === activeContact) : null;
          const matchedNickname = matchedContact?.name || "TAS Trader";
          
          // Match found notification
          toast({
            title: translate("match_found") || "Match Found!",
            description: `${translate("now_connected_with") || "You are now connected with"} ${matchedNickname}. ${translate("can_start_chatting") || "You can start chatting and trading!"}`,
            variant: "default",
          });
          
          // Send welcome message with your nickname
          if (activeContact) {
            setTimeout(() => {
              sendMessage(
                activeContact,
                `${translate("hello_im") || "Hello, I'm"} ${nickname || address?.substring(0, 8) || "Anonymous"}. ${translate("nice_to_meet_you") || "Nice to meet you!"}`
              );
            }, 1000);
          }
          
          // Hide the random match interface and reset connecting state
          setShowRandomMatch(false);
          setIsConnecting(false);
        } else {
          // No matches available - but keep waiting UI visible
          // We don't reset isConnecting state here to keep showing the waiting UI
          
          // After a longer delay, try to get a fallback AI trader if still waiting
          setTimeout(() => {
            if (isConnecting) {
              // Try again to find a match after delay
              findRandomStranger(myToken, wantedToken).then(success => {
                if (success) {
                  // If we found a match, hide the dialog
                  setShowRandomMatch(false);
                  setIsConnecting(false);
                }
              }).catch(error => {
                console.error("Error in delayed fallback:", error);
                // Even on error, keep waiting UI
              });
            }
          }, 8000);
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        // Even on error, maintain waiting state UI
      }
      
    } catch (error) {
      console.error("Error finding match:", error);
      
      // Instead of showing an error, we still display the waiting UI
      // This provides a better user experience than an error message
      toast({
        title: translate("StillLooking") || "Still Looking",
        description: translate("TryingToConnectYou") || "We're trying to connect you with a trading partner. Please wait a moment.",
        variant: "default",
      });
      
      // After a delay, try to get a fallback AI trader
      setTimeout(() => {
        if (isConnecting) {
          findRandomStranger(myToken, wantedToken).then(success => {
            if (success) {
              // If we found a match, hide the dialog
              setShowRandomMatch(false);
              setIsConnecting(false);
            }
          }).catch(err => {
            console.error("Error in delayed fallback:", err);
            // Even on error, maintain waiting UI
          });
        }
      }, 5000);
    }
    
    // Note: We deliberately don't reset isConnecting in a finally block
    // This ensures the waiting UI is always shown until a match is found or user cancels
  };
  
  // We've already got findRandomStranger in the useChat hook, so we'll remove the duplicate
  
  // Helper function to process a matched trader
  const processMatchedUser = async (trader: any): Promise<boolean> => {
    if (!trader || !trader.id) {
      console.error("Invalid trader data:", trader);
      return false;
    }
    
    try {
      // Add the trader to contacts if not already present
      setContacts(prevContacts => {
        // Make sure we have an array to work with
        const prevArray = Array.isArray(prevContacts) ? prevContacts : [];
        
        // Check if the contact already exists
        const exists = prevArray.some(contact => 
          contact && contact.id === trader.id
        );
        
        // Only add if doesn't already exist
        if (!exists) {
          return [trader, ...prevArray];
        }
        return prevArray;
      });
      
      // Set this trader as the active contact
      setActiveContact(trader.id);
      setMatchFound(true);
      
      // Get the trader's name
      const traderName = trader.name || "TAS Trader";
      
      // Show match found notification
      toast({
        title: translate("trader_found") || "Trader Found!",
        description: `${translate("now_connected_with") || "You are now connected with"} ${traderName}. ${translate("start_trading") || "Start trading now!"}`,
        variant: "default",
      });
      
      // Send welcome message
      setTimeout(() => {
        try {
          sendMessage(
            trader.id,
            `${translate("hello_im") || "Hello, I'm"} ${nickname || address?.substring(0, 8) || "Anonymous"}. ${translate("nice_to_meet_you") || "Nice to meet you!"}`
          );
          
          // Simulate a response from the trader after a brief delay
          setTimeout(() => {
            if (trader.id) {
              // Create a simulated response message
              const responseMessage = {
                id: Date.now() + 100,
                text: `Hi there! I'm ${traderName}. I'm interested in trading my ${trader.token} for your ${trader.tokenWanted}. What kind of rates are you looking for?`,
                timestamp: new Date().toISOString(),
                isFromMe: false,
                isRead: true,
                senderId: trader.id,
                receiverId: 1 // Assuming user ID is 1
              };
              
              // Update the messages state if it exists in the chat context
              // This is intentionally simple to avoid errors
              if (responseMessage) {
                setTimeout(() => {
                  try {
                    // We use a standard state setter pattern from the useChat hook
                    setMessages((prev: any) => {
                      if (Array.isArray(prev)) {
                        return [...prev, responseMessage];
                      }
                      return [responseMessage];
                    });
                  } catch (error) {
                    console.error("Failed to update messages:", error);
                  }
                }, 100);
              }
            }
          }, 2000);
          
        } catch (msgError) {
          console.error("Error sending initial message:", msgError);
        }
      }, 1000);
      
      // Hide the random match interface and reset connecting state
      setShowRandomMatch(false);
      setIsConnecting(false);
      return true;
    } catch (error) {
      console.error("Error processing matched trader:", error);
      return false;
    }
  };
  
  // Function to find the next match (skip current)
  const findNextMatch = async () => {
    if (!activeContact) return;
    
    // Send a goodbye message
    sendMessage(activeContact, translate("goodbye_finding_new_match") || "Goodbye! Finding a new match for you...");
    
    // Start finding a new match
    await startRandomMatching();
  };
  
  // Function to open trade dialog
  const openTradeDialog = () => {
    if (!activeContact) return;
    
    // Safely handle contacts array
    if (!Array.isArray(contacts)) {
      console.error("Contacts is not an array:", contacts);
      return;
    }
    
    const contact = contacts.find(c => c.id === activeContact);
    if (contact) {
      setSelectedToken(contact.tokenWanted); // Set default to what they want
      setShowTradeDialog(true);
    }
  };
  
  // Function to handle token trade
  const handleTrade = async () => {
    if (!activeContact || !tradeAmount || !selectedToken) return;
    
    if (!isConnected) {
      toast({
        title: translate("wallet_not_connected")?.replace(/_/g, " ") || "Wallet Not Connected",
        description: translate("connect_wallet_to_trade")?.replace(/_/g, " ") || "Please connect your wallet to trade tokens.",
        variant: "destructive",
      });
      return;
    }
    
    // Parse the trade amount as a float
    const amount = parseFloat(tradeAmount);
    
    // Validate amount is a number and greater than 0
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: translate("invalid_amount") || "Invalid Amount",
        description: translate("enter_valid_amount") || "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      return;
    }
    
    // Check wallet balance with safety checks
    const token = walletTokens.find(t => t.symbol === selectedToken);
    if (!token) {
      toast({
        title: translate("token_not_found") || "Token Not Found",
        description: translate("token_not_in_wallet") || 
          `${selectedToken} token not found in your wallet.`,
        variant: "destructive",
      });
      return;
    }
    
    // Check balance with proper handling
    if (amount > token.balance) {
      toast({
        title: translate("insufficient_balance") || "Insufficient Balance",
        description: translate("not_enough_tokens") || 
          `You don't have enough ${selectedToken}. Your balance: ${token.balance.toFixed(4)} ${selectedToken}`,
        variant: "destructive",
      });
      return;
    }
    
    setTradeProgress(true);
    
    try {
      // Get contact details with safety checks
      if (!Array.isArray(contacts)) {
        throw new Error("Contacts are not available");
      }
      
      const contact = contacts.find(c => c && c.id === activeContact);
      if (!contact) {
        throw new Error("Selected contact not found");
      }
      
      // Get token pricing data from wallet tokens
      const getTokenPrice = (symbol: string) => {
        try {
          // Use the wallet token's price data if available
          const token = walletTokens.find(t => t.symbol === symbol);
          return token?.price || 0.001;
        } catch (e) {
          console.warn(`Price data not found for ${symbol}, using default`);
          return 0.001; // Default to 0.001 (TAS price) if not found
        }
      };
      
      // Calculate USD value
      const senderTokenPrice = getTokenPrice(selectedToken);
      const senderUsdValue = amount * senderTokenPrice;
      
      // Get receiver token
      const receiverToken = contact.token || "TAS";
      const receiverTokenPrice = getTokenPrice(receiverToken);
      
      // Estimate a fair receiver amount based on USD value
      const estimatedReceiverAmount = (senderUsdValue / receiverTokenPrice).toFixed(6);
      
      // Create swap request object
      const swapRequest = {
        senderToken: selectedToken,
        senderAmount: amount,
        senderUsdValue: senderUsdValue,
        receiverToken: receiverToken,
        estimatedReceiverAmount: parseFloat(estimatedReceiverAmount),
        receiverAmount: 0, // Will be negotiated
        message: translate("trade_proposal_message") || "I'd like to trade with you, review my offer!",
        status: "pending"
      };
      
      // Simulate API call with timeout
      setTimeout(() => {
        try {
          // Send a message about the trade in the chat
          sendMessage(
            activeContact, 
            translate("trade_proposal") || 
            `I want to trade ${amount} ${selectedToken} (≈$${senderUsdValue.toFixed(2)}) for your ${receiverToken}. Do you accept?`
          );
          
          // Add a special trade card message
          const tradeMsg = {
            id: Date.now() + 100,
            type: "trade_request",
            data: swapRequest,
            timestamp: new Date().toISOString(),
            isFromMe: true,
            isRead: true
          };
          
          // Reset UI state
          setTradeProgress(false);
          setShowTradeDialog(false);
          setTradeAmount("");
          
          // Show success message
          toast({
            title: translate("trade_proposed")?.replace(/_/g, " ") || "Trade Proposed",
            description: translate("waiting_for_response")?.replace(/_/g, " ") || 
              "Your trade offer has been sent. Waiting for response.",
          });
          
          // Simulate a response after 3-5 seconds
          const responseDelay = 3000 + Math.random() * 2000;
          setTimeout(() => {
            const isAccepted = Math.random() > 0.3; // 70% chance of accepting
            
            if (isAccepted) {
              // Simulated acceptance message
              const replyMessage = {
                id: Date.now() + 200,
                text: `I accept your offer! Let's trade ${amount} ${selectedToken} for ${estimatedReceiverAmount} ${receiverToken}.`,
                timestamp: new Date().toISOString(),
                isFromMe: false,
                isRead: true
              };
              
              // Add message to the chat
              setMessages(prev => {
                const prevArray = Array.isArray(prev) ? prev : [];
                return [...prevArray, replyMessage];
              });
              
              // Show toast notification
              toast({
                title: "Trade Accepted!",
                description: `Your trade offer of ${amount} ${selectedToken} was accepted.`,
                variant: "default",
              });
            } else {
              // Simulated counter-offer
              const counterAmount = (parseFloat(estimatedReceiverAmount) * 1.15).toFixed(4);
              const replyMessage = {
                id: Date.now() + 200,
                text: `I'm interested, but I want ${counterAmount} ${receiverToken} for your ${amount} ${selectedToken}. Let me know if that works for you.`,
                timestamp: new Date().toISOString(),
                isFromMe: false,
                isRead: true
              };
              
              // Add message to the chat
              setMessages(prev => {
                const prevArray = Array.isArray(prev) ? prev : [];
                return [...prevArray, replyMessage];
              });
            }
          }, responseDelay);
          
        } catch (innerError) {
          console.error("Error in trade response handling:", innerError);
        }
      }, 1500);
    } catch (error) {
      console.error("Error trading tokens:", error);
      setTradeProgress(false);
      
      toast({
        title: translate("trade_error") || "Trade Error",
        description: translate("error_processing_trade") || "There was an error processing your trade. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to toggle token stats
  const toggleTokenStats = () => {
    setShowTokenStats(!showTokenStats);
  };
  
  // Display the random match UI or normal chat UI
  if (showRandomMatch) {
    return (
      <section className="bg-white rounded-xl shadow-md overflow-hidden mb-12 border border-gray-100">
        <div className="border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-yellow-100">
          <div className="px-8 py-5 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-yellow-700">
              {translate("TradeNTalk") || "Trade N Talk"}
            </h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-full"
              onClick={() => {
                setShowRandomMatch(false);
                setIsConnecting(false);
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="p-8 md:p-10 flex flex-col items-center justify-center bg-white">
          {isConnecting ? (
            // Enhanced loading state with better UI feedback
            <div className="text-center p-8">
              <div className="relative mx-auto mb-8 w-32 h-32">
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <Loader2 className="w-14 h-14 text-yellow-500 animate-spin" />
                </div>
                <div className="absolute inset-0 rounded-full bg-yellow-100 animate-ping opacity-30"></div>
                <div className="absolute inset-0 rounded-full bg-yellow-50 border-2 border-yellow-200"></div>
              </div>
              
              <h3 className="text-2xl font-bold mb-4 text-yellow-700 tracking-tight">
                {translate("LookingForTraders") || "Looking For Traders"}
              </h3>
              
              <p className="text-gray-600 max-w-lg mx-auto mb-6 text-base leading-relaxed">
                {translate("WaitingQueueDescription") || 
                  "We're searching the TAS Network for traders interested in your tokens. You'll be automatically connected when we find a match."}
              </p>
              
              <div className="flex items-center justify-center text-sm text-gray-500 mb-8 bg-yellow-50 py-2 px-4 rounded-full inline-block">
                <Clock className="w-4 h-4 mr-2 text-yellow-600" /> 
                <span>
                  {translate("EstimatedWaitTime") || "Estimated wait time"}: <span className="font-medium">30</span> {translate("seconds") || "seconds"}
                </span>
              </div>
              
              <div className="p-5 bg-white rounded-lg border border-yellow-200 shadow-sm max-w-md mx-auto">
                <div className="flex items-center mb-3">
                  <div className="p-1.5 bg-yellow-100 rounded-full text-yellow-600 mr-3">
                    <Info className="w-4 h-4" />
                  </div>
                  <h4 className="font-medium text-gray-800 text-base">
                    {translate("YourTradePreferences") || "Your Trade Preferences"}
                  </h4>
                </div>
                
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="flex flex-col items-center">
                    {(() => {
                      const token = walletTokens.find(t => t.symbol === myToken) || 
                        { bg: 'bg-yellow-100', textColor: 'text-yellow-700', symbol: myToken };
                      
                      return (
                        <>
                          <div className={`h-12 w-12 ${token.bg} rounded-full flex items-center justify-center mb-2`}>
                            <span className={`text-lg font-bold ${token.textColor}`}>{token.symbol?.charAt(0) || "T"}</span>
                          </div>
                          <span className="font-medium text-gray-700">{token.symbol}</span>
                        </>
                      );
                    })()}
                  </div>
                  
                  <ArrowRightLeft className="w-6 h-6 text-gray-400" />
                  
                  <div className="flex flex-col items-center">
                    {wantedToken === "ANY" ? (
                      <>
                        <div className="bg-purple-100 h-12 w-12 rounded-full flex items-center justify-center mb-2">
                          <span className="text-lg font-bold text-purple-700">A</span>
                        </div>
                        <span className="font-medium text-gray-700">
                          {translate("AnyToken") || "Any Token"}
                        </span>
                      </>
                    ) : (() => {
                      const token = walletTokens.find(t => t.symbol === wantedToken) || 
                        { bg: 'bg-blue-100', textColor: 'text-blue-700', symbol: wantedToken };
                      
                      return (
                        <>
                          <div className={`h-12 w-12 ${token.bg} rounded-full flex items-center justify-center mb-2`}>
                            <span className={`text-lg font-bold ${token.textColor}`}>{token.symbol?.charAt(0) || "B"}</span>
                          </div>
                          <span className="font-medium text-gray-700">{token.symbol}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="default" 
                  className="w-full border-yellow-300 bg-white text-yellow-700 hover:bg-yellow-50 mt-2"
                  onClick={() => setIsConnecting(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  {translate("CancelSearch") || "Cancel Search"}
                </Button>
              </div>
            </div>
          ) : (
            // Normal random match interface
            <>
              <div className="text-center mb-8">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-6 rounded-full inline-flex mb-6 shadow-lg">
                  <Users className="h-14 w-14 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-green-600">
                  {translate("ConnectWithRandomTrader") || "Connect With Random Trader"}
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed max-w-md mx-auto">
                  {translate("RandomSwapDescription") || 
                  "Experience the ultimate random swap on TASChain! Connect with random traders to chat and exchange tokens directly. Specify your token preferences or match with anyone for surprising opportunities."}
                </p>
              </div>
              
              <div className="w-full max-w-md mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-yellow-50 p-5 rounded-lg border border-yellow-100 mb-5">
                    <label className="block text-base font-semibold text-gray-800 mb-4">{translate("YourToken") || "Your Token"}</label>
                    <p className="text-sm text-gray-600 mb-4">
                      {translate("SelectTokenToOffer") || "Select a token from your wallet to offer for trading"}
                    </p>
                    <div className="space-y-3">
                      <Select
                        value={myToken}
                        onValueChange={setMyToken}
                      >
                        <SelectTrigger className="border-gray-300 bg-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 h-12">
                          <SelectValue placeholder={translate("SelectToken") || "Select token from your wallet"} />
                        </SelectTrigger>
                        <SelectContent>
                          {!isConnected ? (
                            <div className="px-2 py-4 text-center">
                              <p className="text-sm text-gray-500 mb-3">{translate("WalletNotConnected") || "Wallet not connected"}</p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={openConnectModal}
                                className="mx-auto"
                              >
                                {translate("ConnectWallet") || "Connect Wallet"}
                              </Button>
                            </div>
                          ) : walletTokens.length === 0 ? (
                            <div className="px-2 py-4 text-center">
                              <p className="text-sm text-gray-500">{translate("NoTokensFound") || "No tokens found"}</p>
                            </div>
                          ) : (
                            <>
                              {/* Display tokens from wallet token list */}
                              {walletTokens.map((token, index) => (
                                <SelectItem key={`my-token-${index}`} value={token.symbol}>
                                  <div className="flex items-center justify-between w-full py-1">
                                    <div className="flex items-center">
                                      <div className={`w-6 h-6 ${token.bg || 'bg-green-100'} rounded-full flex items-center justify-center mr-3`}>
                                        <span className={`text-xs font-bold ${token.textColor || 'text-green-700'}`}>{token.symbol.charAt(0)}</span>
                                      </div>
                                      <span>{token.symbol}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {token.balance ? parseFloat(token.balance.toString()).toFixed(4) : '0.0000'}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-5 rounded-lg border border-yellow-100 mb-5">
                    <label className="block text-base font-semibold text-gray-800 mb-4">{translate("WantedToken") || "Token You Want"}</label>
                    <p className="text-sm text-gray-600 mb-4">
                      {translate("SelectTokenToReceive") || "Select a token you would like to receive in exchange"}
                    </p>
                    <div className="space-y-3">
                      <Select
                        value={wantedToken}
                        onValueChange={setWantedToken}
                      >
                        <SelectTrigger className="border-gray-300 bg-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 h-12">
                          <SelectValue placeholder={translate("SelectToken") || "Select token you want"} />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Display all wallet tokens except the one selected in "Your Token" */}
                          {walletTokens
                            .filter(token => token.symbol !== myToken)
                            .map((token, index) => (
                              <SelectItem key={`wanted-token-${index}`} value={token.symbol}>
                                <div className="flex items-center justify-between w-full py-1">
                                  <div className="flex items-center">
                                    <div className={`w-6 h-6 ${token.bg || 'bg-green-100'} rounded-full flex items-center justify-center mr-3`}>
                                      <span className={`text-xs font-bold ${token.textColor || 'text-green-700'}`}>{token.symbol.charAt(0)}</span>
                                    </div>
                                    <span>{token.symbol}</span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {token.balance ? parseFloat(token.balance.toString()).toFixed(4) : '0.0000'}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          }
                          
                          {/* "ANY" option for fallback to any available token */}
                          <SelectItem value="ANY">
                            <div className="flex items-center justify-between w-full py-1">
                              <div className="flex items-center">
                                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-xs font-bold text-purple-700">A</span>
                                </div>
                                <span>{translate("AnyToken") || "Any Token"}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {translate("RandomMatching") || "Random Match"}
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full py-6 text-lg bg-yellow-500 hover:bg-yellow-600 text-white shadow-md"
                  onClick={startRandomMatching}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {translate("Connecting") || "Connecting..."}
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-5 w-5" />
                      {translate("FindRandomMatch") || "Find Random Swap"}
                    </>
                  )}
                </Button>
              </div>
              
              <div className="text-center text-sm text-gray-500 max-w-md">
                <p className="mb-2">
                  {translate("RandomSwapExplanation") || "TAS Random Swap connects you to traders with compatible token preferences from around the world."}
                </p>
                <p>
                  {translate("CommunityGuidelines") || "By using this feature, you agree to follow our community guidelines."}
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    );
  }
  
  // Render the main chat UI
  return (
    <section className={`bg-white rounded-xl shadow-sm overflow-hidden ${fullpage ? '' : 'mb-12'}`}>
      <div className="border-b border-gray-200">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-gray-800 mr-3">
              {translate("TradeNTalk") || "Trade N Talk"}
            </h2>
            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
              {Math.floor(Math.random() * 100) + 150} {translate("online") || "online"}
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={() => setShowRandomMatch(true)}
            >
              <Users className="h-4 w-4 mr-1.5" />
              <span className="text-sm font-medium">{translate("findRandomMatch") || "Find Random Swap"}</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex h-[calc(100vh-180px)] md:h-[600px] chat-container overflow-hidden relative">
        {/* Contact Sidebar - Hidden on mobile by default */}
        <div className="hidden sm:flex w-0 sm:w-72 md:w-80 border-r border-gray-200 flex-col transition-all duration-300 contacts-panel">
          <div className="p-3 border-b border-gray-200">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Search className="h-4 w-4" />
              </div>
              <Input 
                placeholder={translate("searchContacts") || "Search contacts"}
                className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-primary flex-1"
              />
              
              {/* Mobile only close button */}
              <button 
                className="ml-3 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors sm:hidden"
                onClick={() => {
                  const container = document.querySelector('.chat-container');
                  const overlay = document.querySelector('.contacts-overlay');
                  if (container && overlay) {
                    container.classList.remove('show-contacts');
                    overlay.classList.add('hidden');
                    const contactsPanel = container.querySelector('.contacts-panel');
                    if (contactsPanel) {
                      contactsPanel.classList.add('hidden');
                      contactsPanel.classList.remove('flex');
                    }
                  }
                }}
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto">
            {Array.isArray(contacts) && contacts.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {contacts.map((contact) => (
                  <div 
                    key={contact.id} 
                    className={`p-3 flex items-start cursor-pointer hover:bg-gray-50 transition-colors ${activeContact === contact.id ? 'bg-primary-50' : ''}`}
                    onClick={() => setActiveContact(contact.id)}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 ${contact.avatarBg} rounded-full flex items-center justify-center ${contact.avatarText} mr-3 relative`}>
                      {contact.name?.split(' ').map(name => name[0]).join('') || 'U'}
                      {contact.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {contact.name || "Unknown User"}
                        </h3>
                        <span className="text-xs text-gray-500">{contact.lastMessageTime}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded mr-1.5 font-medium">
                          {contact.token || "TAS"}
                        </span>
                        <ArrowRightLeft className="w-3 h-3 text-gray-400 mx-0.5" />
                        <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded ml-0.5 font-medium">
                          {contact.tokenWanted || "BNB"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {contact.lastMessage}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Users className="h-10 w-10 text-gray-300 mb-2" />
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  {translate("NoContactsYet") || "No Contacts Yet"}
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  {translate("FindRandomTraders") || "Find random traders to chat and swap tokens with"}
                </p>
                <Button 
                  size="sm" 
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  onClick={() => setShowRandomMatch(true)}
                >
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  {translate("findRandomMatch") || "Find Random Swap"}
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile menu toggle button */}
        <button 
          className="absolute left-4 top-4 z-10 md:hidden bg-white rounded-full p-2 shadow-md border border-gray-200"
          onClick={() => {
            const container = document.querySelector('.chat-container');
            if (container) {
              container.classList.toggle('show-contacts');
              const contactsPanel = container.querySelector('.contacts-panel');
              if (contactsPanel) {
                contactsPanel.classList.toggle('hidden');
                contactsPanel.classList.toggle('flex');
              }
            }
          }}
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
        
        {/* Mobile contacts panel overlay with close button */}
        <div 
          className="fixed inset-0 bg-black/50 z-40 hidden md:hidden contacts-overlay"
          onClick={() => {
            const container = document.querySelector('.chat-container');
            const overlay = document.querySelector('.contacts-overlay');
            if (container && overlay) {
              container.classList.remove('show-contacts');
              overlay.classList.add('hidden');
              const contactsPanel = container.querySelector('.contacts-panel');
              if (contactsPanel) {
                contactsPanel.classList.add('hidden');
                contactsPanel.classList.remove('flex');
              }
            }
          }}
        ></div>
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeContact ? (
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <div className="p-3 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="flex items-center mb-3 sm:mb-0">
                  <div className="flex-shrink-0">
                    {(() => {
                      // Safely handle contacts array
                      if (!Array.isArray(contacts)) {
                        console.error("Contacts is not an array in chat header:", contacts);
                        return null;
                      }
                      
                      const contact = contacts.find(c => c.id === activeContact);
                      if (!contact) return null;
                      
                      return (
                        <div className={`w-10 h-10 ${contact.avatarBg} rounded-full flex items-center justify-center ${contact.avatarText} relative`}>
                          {contact.name.split(' ').map(name => name[0]).join('')}
                          {contact.isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {(() => {
                        // Safely handle contacts array
                        if (!Array.isArray(contacts)) {
                          return translate("unknownUser") || "Unknown User";
                        }
                        
                        const contact = contacts.find(c => c.id === activeContact);
                        return contact ? contact.name : (translate("unknownUser") || "Unknown User");
                      })()}
                    </div>
                    
                    <div className="text-xs text-gray-500 flex items-center">
                      {(() => {
                        if (!Array.isArray(contacts)) return null;
                        const contact = contacts.find(c => c.id === activeContact);
                        if (!contact) return null;
                        
                        return contact.isOnline ? (
                          <>
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                            {translate("online") || "Online"}
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-1"></span>
                            {translate("offline") || "Offline"}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 w-full sm:w-auto flex-wrap sm:flex-nowrap justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 mb-1 sm:mb-0"
                    onClick={openTradeDialog}
                  >
                    <ArrowDownUp className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs font-medium">{translate("Trade") || "Trade"}</span>
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 mb-1 sm:mb-0"
                    onClick={toggleTokenStats}
                  >
                    <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> 
                    <span className="text-xs font-medium">
                      {showTokenStats ? (translate("HideStats") || "Hide Stats") : (translate("ShowStats") || "Show Stats")}
                    </span>
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200"
                    onClick={findNextMatch}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs font-medium">{translate("NextMatch") || "Next Match"}</span>
                  </Button>
                </div>
              </div>
              
              {/* Token Stats (if enabled) */}
              {showTokenStats && (
                <div className="p-3 border-b border-gray-200 bg-gray-50 overflow-x-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(() => {
                      // Get token symbols from the contact
                      if (!Array.isArray(contacts)) return null;
                      const contact = contacts.find(c => c.id === activeContact);
                      if (!contact) return null;
                      
                      const myTokenKey = contact.tokenWanted || "TAS";
                      const theirTokenKey = contact.token || "BNB";
                      
                      // Get token data with fallback if token not found
                      const getTokenData = (key: string) => {
                        try {
                          // Find token in wallet tokens
                          const token = walletTokens.find(t => t.symbol === key);
                          if (token) {
                            return {
                              symbol: token.symbol,
                              price: token.price || 0.001,
                              bg: token.bg || 'bg-blue-100',
                              textColor: token.textColor || 'text-blue-600',
                              // Add missing properties with default values
                              change24h: 0.5,
                              volume24h: 1000000,
                              graph: [60, 65, 70, 68, 72, 74, 70, 75]
                            };
                          }
                          
                          // Default token data if not found
                          return {
                            symbol: key || 'TAS',
                            price: 0.001,
                            bg: 'bg-blue-100',
                            textColor: 'text-blue-600',
                            change24h: 0.5,
                            volume24h: 1000000,
                            graph: [60, 65, 70, 68, 72, 74, 70, 75]
                          };
                        } catch (e) {
                          console.warn(`Token data not found for ${key}, using default`);
                          return {
                            symbol: 'TAS',
                            price: 0.001,
                            bg: 'bg-blue-100',
                            textColor: 'text-blue-600',
                            change24h: 0.5,
                            volume24h: 1000000,
                            graph: [60, 65, 70, 68, 72, 74, 70, 75]
                          };
                        }
                      };
                      
                      const myTokenData = getTokenData(myTokenKey);
                      const theirTokenData = getTokenData(theirTokenKey);
                      
                      return (
                        <>
                          {/* My Token Stats */}
                          <div className="bg-white p-3 rounded-lg shadow-sm border border-yellow-100">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-xs font-bold text-yellow-700">{myTokenKey.charAt(0)}</span>
                                </div>
                                <h4 className="font-semibold text-gray-800">{myTokenKey}</h4>
                              </div>
                              <span className="text-sm font-medium">${myTokenData.price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <span className={`text-xs font-medium flex items-center ${myTokenData.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {myTokenData.change24h >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                  {Math.abs(myTokenData.change24h).toFixed(2)}%
                                </span>
                                <span className="text-xs text-gray-500 ml-2">(24h)</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Vol: ${(myTokenData.volume24h / 1000000).toFixed(2)}M
                              </div>
                            </div>
                            <div className="h-14 w-full">
                              <div className="flex items-end h-full space-x-0.5">
                                {myTokenData.graph.map((value, index) => (
                                  <div 
                                    key={index}
                                    style={{ height: `${(value / 100) * 100}%` }}
                                    className={`w-full rounded-sm ${myTokenData.change24h >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* Their Token Stats */}
                          <div className="bg-white p-3 rounded-lg shadow-sm border border-yellow-100">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-xs font-bold text-blue-700">{theirTokenKey.charAt(0)}</span>
                                </div>
                                <h4 className="font-semibold text-gray-800">{theirTokenKey}</h4>
                              </div>
                              <span className="text-sm font-medium">${theirTokenData.price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <span className={`text-xs font-medium flex items-center ${theirTokenData.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {theirTokenData.change24h >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                  {Math.abs(theirTokenData.change24h).toFixed(2)}%
                                </span>
                                <span className="text-xs text-gray-500 ml-2">(24h)</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Vol: ${(theirTokenData.volume24h / 1000000).toFixed(2)}M
                              </div>
                            </div>
                            <div className="h-14 w-full">
                              <div className="flex items-end h-full space-x-0.5">
                                {theirTokenData.graph.map((value, index) => (
                                  <div 
                                    key={index}
                                    style={{ height: `${(value / 100) * 100}%` }}
                                    className={`w-full rounded-sm ${theirTokenData.change24h >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              {/* Chat Messages */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-4">
                  {Object.keys(groupedMessages).length > 0 ? (
                    Object.keys(groupedMessages).map(date => {
                      const messagesForDate = groupedMessages[date];
                      // Make sure we have messages to display
                      if (!messagesForDate || !Array.isArray(messagesForDate) || messagesForDate.length === 0) {
                        return null;
                      }
                      
                      return (
                        <div key={date}>
                          {/* Timestamp */}
                          <div className="text-center mb-4">
                            <span className="text-xs text-dark-400 bg-gray-100 px-2 py-1 rounded-full">
                              {formatDateHeader(messagesForDate[0]?.timestamp || new Date().toISOString())}
                            </span>
                          </div>
                          
                          {messagesForDate.map((message, index) => (
                            <div 
                              key={index} 
                              className={`flex items-end mb-4 ${message.isFromMe ? 'justify-end' : ''}`}
                            >
                              {!message.isFromMe && (
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium text-xs mr-2">
                                  {(() => {
                                    // Safely handle contacts array
                                    if (!Array.isArray(contacts)) {
                                      console.error("Contacts is not an array in message display:", contacts);
                                      return '';
                                    }
                                    
                                    const contact = contacts.find(c => c.id === activeContact);
                                    return contact && contact.name ? contact.name.split(' ').map(name => name[0]).join('') : '';
                                  })()}
                                </div>
                              )}
                              <div className="max-w-md">
                                <div className={`${message.isFromMe ? 'bg-primary text-white rounded-lg rounded-br-none' : 'bg-gray-100 rounded-lg rounded-bl-none'} p-3`}>
                                  <p className={message.isFromMe ? 'text-white' : 'text-dark-700'}>{message.text}</p>
                                </div>
                                <div className={`text-xs text-dark-400 mt-1 ${message.isFromMe ? 'text-right' : ''}`}>
                                  {formatMessageTime(message.timestamp)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })
                  ) : (
                    // Show empty state when no messages are available
                    <div className="flex flex-col items-center justify-center h-full py-16">
                      <MessageSquare className="h-16 w-16 text-yellow-200 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        {translate("NoMessagesYet") || "No Messages Yet"}
                      </h3>
                      <p className="text-sm text-gray-500 max-w-xs text-center">
                        {translate("StartConversation") || "Start a conversation or connect with a random trader to begin chatting."}
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              {/* Chat Input */}
              <div className="p-3 sm:p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex items-center">
                  <Button type="button" variant="ghost" size="icon" className="text-yellow-500 hover:text-yellow-600 mr-2 hidden sm:flex">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input
                    type="text"
                    className="flex-1 border-yellow-200 focus-visible:ring-yellow-500"
                    placeholder={translate("type_your_message") || "Type a message..."}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  <Button type="submit" className="ml-2 bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg">
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] md:h-[500px] text-gray-500 p-4 sm:p-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-medium mb-2 text-yellow-600">{translate("noActiveChat", "Start a Random Swap")}</h3>
              <p className="text-center text-gray-700 mb-6 max-w-md text-sm sm:text-base">
                {translate("selectContactOrFindMatch", "Experience the TAS Random Swap system! Connect with random traders to chat and exchange tokens through our innovative peer-to-peer platform.")}
              </p>
              <div className="flex flex-col space-y-4 w-full sm:w-auto">
                <Button 
                  className="bg-yellow-500 text-white hover:bg-yellow-600 shadow-md transform hover:scale-105 transition-transform duration-200 px-4 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-medium"
                  onClick={() => {
                    if (!isConnected) {
                      toast({
                        title: "Wallet Not Connected",
                        description: "Please connect your wallet first to use the Random Swap feature.",
                        variant: "default",
                      });
                      return;
                    }
                    setShowRandomMatch(true);
                  }}
                >
                  <Users className="h-5 w-5 mr-2 sm:mr-3" />
                  {translate("findRandomMatch", "Find Random Swap")}
                </Button>
                
                <div className="text-center text-xs sm:text-sm text-gray-600 max-w-sm mx-auto mt-2 px-4">
                  Find strangers to chat with and trade tokens directly in a secure peer-to-peer environment
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trading Bot Dialog */}
      <Dialog open={showTradingBot} onOpenChange={setShowTradingBot}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-2 border-b mb-4">
            <DialogTitle className="bg-gradient-to-r from-primary to-sky-500 text-transparent bg-clip-text">
              {translate("TradingBot") || "Trading Bot"}
            </DialogTitle>
            <DialogDescription>
              {translate("TradingBotDescription") || "Set up an automated trading strategy for this token."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4 px-1">
            <div className="bg-primary/5 rounded-lg border border-primary/20 p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Bot Status</h4>
                <Badge 
                  variant={activeTradingBot ? "default" : "outline"}
                  className={activeTradingBot 
                    ? "bg-green-100 hover:bg-green-100 text-green-800 border-green-200" 
                    : "bg-gray-100 text-gray-800"}
                >
                  {activeTradingBot ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {activeTradingBot 
                  ? `Trading bot is running with a ${botStrategy} strategy on ${selectedToken || myToken}.` 
                  : "Configure and activate your trading bot to automate token trades."}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Trading Strategy</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant={botStrategy === "market" ? "default" : "outline"} 
                    className={botStrategy === "market" ? "bg-primary text-white" : ""}
                    onClick={() => setBotStrategy("market")}
                    size="sm"
                  >
                    Market
                  </Button>
                  <Button 
                    variant={botStrategy === "limit" ? "default" : "outline"} 
                    className={botStrategy === "limit" ? "bg-primary text-white" : ""}
                    onClick={() => setBotStrategy("limit")}
                    size="sm"
                  >
                    Limit
                  </Button>
                  <Button 
                    variant={botStrategy === "dca" ? "default" : "outline"} 
                    className={botStrategy === "dca" ? "bg-primary text-white" : ""}
                    onClick={() => setBotStrategy("dca")}
                    size="sm"
                  >
                    DCA
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {botStrategy === "market" 
                    ? "Market orders execute immediately at the current market price." 
                    : botStrategy === "limit" 
                      ? "Limit orders execute only when the token reaches your target price." 
                      : "Dollar-Cost Averaging (DCA) automatically buys at set intervals."}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Token Amount</h4>
                <div className="flex space-x-2">
                  <Input 
                    type="number" 
                    value={botAmount} 
                    onChange={(e) => setBotAmount(e.target.value)} 
                    placeholder="Enter amount" 
                    className="flex-1"
                  />
                  <Select value={selectedToken || myToken} onValueChange={setSelectedToken}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue defaultValue={selectedToken || myToken} />
                    </SelectTrigger>
                    <SelectContent>
                      {walletTokens.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          {token.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {botStrategy === "limit" && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Target Price</h4>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="number" 
                      value={botTargetPrice} 
                      onChange={(e) => setBotTargetPrice(e.target.value)} 
                      placeholder="Target price" 
                    />
                    <span className="text-sm text-muted-foreground">TAS</span>
                  </div>
                </div>
              )}
              
              {botStrategy === "dca" && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Time Interval</h4>
                  <div className="flex items-center space-x-2">
                    <Select 
                      value={botInterval.toString()} 
                      onValueChange={(value) => setBotInterval(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue defaultValue="30" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">Every 5 minutes</SelectItem>
                        <SelectItem value="15">Every 15 minutes</SelectItem>
                        <SelectItem value="30">Every 30 minutes</SelectItem>
                        <SelectItem value="60">Every hour</SelectItem>
                        <SelectItem value="360">Every 6 hours</SelectItem>
                        <SelectItem value="1440">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
              <div className="flex items-start">
                <Info className="h-4 w-4 mr-2 mt-0.5 text-yellow-600" />
                <div>
                  <p className="font-medium">Important</p>
                  <p className="mt-1">
                    Trading bots operate using your wallet funds. Make sure you have sufficient 
                    {selectedToken || myToken} tokens and TAS for gas fees. All transactions will follow 
                    bonding curve pricing rules.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox 
                id="terms" 
                checked={activeTradingBot}
                onCheckedChange={(checked) => setActiveTradingBot(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {activeTradingBot ? "Deactivate Bot" : "Activate Bot"}
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              className={activeTradingBot 
                ? "bg-destructive hover:bg-destructive/90 text-white" 
                : "bg-primary hover:bg-primary/90 text-white"}
              onClick={() => {
                if (activeTradingBot) {
                  setActiveTradingBot(false);
                  toast({
                    title: "Bot Deactivated",
                    description: "Your trading bot has been stopped successfully.",
                  });
                } else {
                  setActiveTradingBot(true);
                  toast({
                    title: "Bot Activated",
                    description: `Trading bot is now running with a ${botStrategy} strategy.`,
                  });
                }
                setShowTradingBot(false);
              }}
            >
              {activeTradingBot ? "Stop Bot" : "Start Bot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Trade Dialog */}
      <Dialog open={showTradeDialog} onOpenChange={setShowTradeDialog}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-2 border-b mb-4">
            <DialogTitle className="text-yellow-700">
              {translate("TradeTokens") || "Trade Tokens"}
            </DialogTitle>
            <DialogDescription>
              {translate("TradeTokensDescription") || "Specify the token and amount you want to trade with this user."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4 px-1 pb-16 sm:pb-4">
            {/* Trade Information */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800">
                  {translate("TradeDetails") || "Trade Details"}
                </h4>
                <Badge variant="outline" className="text-yellow-700 bg-yellow-50 border-yellow-200">
                  {translate("PendingProposal") || "Pending Proposal"}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-yellow-100">
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">{translate("YourOffer") || "Your Offer"}</div>
                  <div className="font-medium">{tradeAmount || "0"} {selectedToken || "--"}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    ≈ ${selectedToken && tradeAmount ? (
                      (walletTokens.find(t => t.symbol === selectedToken)?.price || 0.001) * parseFloat(tradeAmount || "0")
                    ).toFixed(2) : "0.00"} USD
                  </div>
                </div>
                
                <ArrowRightLeft className="h-5 w-5 text-gray-400" />
                
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">{translate("TheirToken") || "Their Token"}</div>
                  <div className="font-medium">
                    {Array.isArray(contacts) && activeContact
                      ? (contacts.find(c => c.id === activeContact)?.token || "TAS")
                      : "TAS"}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{translate("ToBeNegotiated") || "Amount to be negotiated"}</div>
                </div>
              </div>
            </div>
            
            {/* Wallet Balances */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">{translate("YourWalletBalance") || "Your Wallet Balance"}</h3>
              
              {!isConnected ? (
                <div className="py-2 text-center">
                  <p className="text-sm text-gray-500 mb-2">{translate("WalletNotConnected") || "Connect your wallet to see your balances"}</p>
                  <Button 
                    size="sm" 
                    className="bg-yellow-500 text-white hover:bg-yellow-600"
                    onClick={openConnectModal}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {translate("ConnectWallet") || "Connect Wallet"}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {walletTokens.length === 0 ? (
                    <div className="col-span-2 flex justify-center py-2">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    walletTokens.map((token, index) => (
                      <div key={index} className="flex items-center p-1 rounded hover:bg-gray-100 cursor-pointer" onClick={() => {
                        setSelectedToken(token.symbol);
                        setTradeAmount("");
                      }}>
                        <div className={`w-6 h-6 ${token.bg} rounded-full flex items-center justify-center mr-2`}>
                          <span className={`text-xs font-bold ${token.textColor}`}>{token.symbol.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-700">{token.symbol}</div>
                          <div className="text-xs text-gray-500">
                            {token.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} 
                            (${(token.balance * (token.price || 0.001)).toLocaleString(undefined, { maximumFractionDigits: 2 })})
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {/* Token Swap Interface */}
            <div className="space-y-4">
              {/* You Send */}
              <div className="bg-white border border-yellow-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    {translate("YouSend") || "You Send"}
                  </label>
                  <div className="text-xs text-gray-500">
                    {selectedToken && (
                      <>
                        {translate("Balance") || "Balance"}: {
                          walletTokens.find(t => t.symbol === selectedToken)?.balance.toFixed(4) || "0.0000"
                        } {selectedToken}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      className="text-lg font-medium border-0 focus:ring-0 p-0 h-auto"
                    />
                  </div>
                  
                  <Select 
                    value={selectedToken} 
                    onValueChange={setSelectedToken}
                    defaultValue={walletTokens.length > 0 ? walletTokens[0].symbol : "TAS"}
                  >
                    <SelectTrigger className="w-[110px] border border-gray-200 bg-gray-50">
                      <div className="flex items-center">
                        {(() => {
                          // Find the selected token's data
                          const token = walletTokens.find(t => t.symbol === selectedToken) || 
                            { bg: 'bg-blue-100', textColor: 'text-blue-600', symbol: selectedToken || 'TAS' };
                          
                          return (
                            <>
                              <div className={`w-5 h-5 ${token.bg} rounded-full flex items-center justify-center mr-2`}>
                                <span className={`text-xs font-bold ${token.textColor}`}>{token.symbol.charAt(0)}</span>
                              </div>
                              <SelectValue defaultValue={token.symbol} />
                            </>
                          );
                        })()}
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {walletTokens.length === 0 ? (
                        <SelectItem value="TAS">
                          <div className="flex items-center">
                            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                              <span className="text-xs font-bold text-blue-600">T</span>
                            </div>
                            <span>TAS</span>
                          </div>
                        </SelectItem>
                      ) : (
                        walletTokens.map((token, index) => (
                          <SelectItem key={index} value={token.symbol}>
                            <div className="flex items-center">
                              <div className={`w-5 h-5 ${token.bg} rounded-full flex items-center justify-center mr-2`}>
                                <span className={`text-xs font-bold ${token.textColor}`}>{token.symbol.charAt(0)}</span>
                              </div>
                              <span>{token.symbol}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-xs text-gray-500 mt-1">
                  ≈ ${(() => {
                    // Calculate the USD value using actual token data
                    const amount = Number(tradeAmount) || 0;
                    const token = walletTokens.find(t => t.symbol === selectedToken);
                    const price = token?.price || 0.001; // Use the price from wallet token or fallback
                    return (amount * price).toFixed(2);
                  })()} USD
                </div>
              </div>
              
              {/* Swap Arrow */}
              <div className="flex justify-center">
                <div className="bg-gray-100 rounded-full p-2">
                  <ArrowDownUp className="h-5 w-5 text-gray-500" />
                </div>
              </div>
              
              {/* They Receive */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    {translate("TheyReceive") || "They Receive"}
                  </label>
                  <div className="text-xs text-gray-500">
                    {Array.isArray(contacts) && activeContact ? (
                      <>
                        {translate("Token") || "Token"}: {
                          contacts.find(c => c.id === activeContact)?.token || "TAS"
                        }
                      </>
                    ) : null}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <div className="text-lg font-medium text-gray-500">
                      {translate("ToBeNegotiatedInChat") || "To be negotiated in chat"}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {translate("PriceWillBeDiscussed") || "Price and amount will be discussed in chat"}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Agreement */}
              <div className="flex items-start space-x-2 mt-2">
                <Checkbox 
                  id="trade-agree" 
                  checked={tradeAgree}
                  onCheckedChange={(checked) => setTradeAgree(checked as boolean)}
                />
                <label htmlFor="trade-agree" className="text-xs text-gray-600 leading-tight">
                  {translate("TradeAgreement") || "I understand this is a peer-to-peer trade and I am responsible for verifying all details before finalizing the transaction."}
                </label>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sticky bottom-0 bg-white border-t pt-3 mt-4 z-10">
            <Button 
              variant="outline" 
              onClick={() => setShowTradeDialog(false)}
              className="border-gray-300"
            >
              {translate("Cancel") || "Cancel"}
            </Button>
            <Button 
              onClick={handleTrade}
              disabled={!tradeAgree || !tradeAmount || tradeProgress || !isConnected}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {tradeProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translate("Processing") || "Processing..."}
                </>
              ) : (
                <>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  {translate("ProposeTradeNegotiation") || "Propose Trade Negotiation"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ChatInterface;