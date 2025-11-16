import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { apiRequest } from '@/lib/queryClient';

export interface Contact {
  id: number;
  name: string;
  avatarBg: string;
  avatarText: string;
  isOnline: boolean;
  lastMessage: string;
  lastMessageTime: string;
  token: string;
  tokenWanted: string;
}

export interface Message {
  id: number;
  text: string;
  timestamp: string;
  isFromMe: boolean;
  isRead: boolean;
}

export const useChat = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeContact, setActiveContact] = useState<number | null>(null);
  const { address, nickname } = useWallet();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [matchFound, setMatchFound] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!address) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setSocket(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'message') {
          handleNewMessage(data.message);
        } else if (data.type === 'match') {
          handleNewMatch(data.contact);
        } else if (data.type === 'status') {
          handleStatusChange(data.userId, data.isOnline);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setSocket(null);
    };
    
    return () => {
      if (ws) ws.close();
    };
  }, [address]);

  // Load initial contacts
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const response = await apiRequest('GET', '/api/contacts');
        if (response.ok) {
          const data = await response.json();
          
          // Check if data is an object with contacts property or directly an array
          const contactsArray = data.contacts || data;
          
          // Ensure we're always working with an array
          if (Array.isArray(contactsArray)) {
            setContacts(contactsArray);
            
            if (contactsArray.length > 0 && !activeContact) {
              setActiveContact(contactsArray[0].id);
            }
          } else {
            console.error("API returned unexpected contacts format:", data);
            setContacts([]); // Set to empty array as fallback
          }
        }
      } catch (error) {
        console.error('Error loading contacts:', error);
      }
    };
    
    if (address) {
      loadContacts();
    }
  }, [address, activeContact]);

  // Load messages when active contact changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeContact) return;
      
      try {
        const response = await apiRequest('GET', `/api/messages/${activeContact}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };
    
    if (activeContact) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [activeContact]);

  // Handle new message from WebSocket
  const handleNewMessage = useCallback((message: Message) => {
    // Safely add message to messages array
    setMessages(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return [...prevArray, message];
    });
    
    // Update last message in contacts with safety checks
    setContacts(prev => {
      // Make sure prev is an array
      if (!Array.isArray(prev)) {
        console.warn("Contacts is not an array in handleNewMessage", prev);
        return prev || []; // Return original or empty array if falsy
      }
      
      // Now safely map over the array
      return prev.map(contact => 
        contact && contact.id === activeContact
          ? {
              ...contact,
              lastMessage: message.text,
              lastMessageTime: new Date(message.timestamp).toLocaleTimeString()
            }
          : contact
      );
    });
  }, [activeContact]);

  // Handle new match notification
  const handleNewMatch = useCallback((contact: Contact) => {
    // Only proceed if we have a valid contact
    if (!contact || typeof contact !== 'object') {
      console.error("Invalid contact in handleNewMatch:", contact);
      return;
    }
    
    setContacts(prev => {
      // Make sure prev is an array
      const prevArray = Array.isArray(prev) ? prev : [];
      
      // Check if contact already exists to prevent duplicates
      const exists = prevArray.some(c => c && c.id === contact.id);
      
      if (exists) {
        return prevArray; // Don't add duplicate
      }
      
      return [contact, ...prevArray];
    });
    
    setMatchFound(true);
    
    // Switch to new match
    setActiveContact(contact.id);
  }, []);

  // Handle online status change
  const handleStatusChange = useCallback((userId: number, isOnline: boolean) => {
    if (typeof userId !== 'number') {
      console.error("Invalid userId in handleStatusChange:", userId);
      return;
    }
    
    setContacts(prev => {
      // Make sure prev is an array
      if (!Array.isArray(prev)) {
        console.warn("Contacts is not an array in handleStatusChange", prev);
        return prev || []; // Return original or empty array if falsy
      }
      
      // Now safely map over the array
      return prev.map(contact => 
        contact && contact.id === userId
          ? { ...contact, isOnline }
          : contact
      );
    });
  }, []);

  // Send a message
  const sendMessage = useCallback((contactId: number, text: string) => {
    if (!text.trim() || !contactId || !socket) return;

    const message: Omit<Message, 'id'> = {
      text,
      timestamp: new Date().toISOString(),
      isFromMe: true,
      isRead: false
    };

    // Optimistically add message to UI with safety check
    setMessages(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return [...prevArray, { ...message, id: Date.now() }];
    });

    // Send through WebSocket
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'message',
        recipient: contactId,
        text
      }));
    }

    // Update contact's last message - safeguarding against invalid prev
    setContacts(prev => {
      // Ensure we have an array to work with
      if (!Array.isArray(prev)) {
        console.warn("Contacts is not an array in updateLastMessage", prev);
        return prev || []; // Return whatever it was or empty array if falsy
      }
      
      return prev.map(contact => 
        contact.id === contactId
          ? {
              ...contact,
              lastMessage: text,
              lastMessageTime: new Date().toLocaleTimeString()
            }
          : contact
      );
    });
  }, [socket]);

  // Find random stranger for trading and chatting (Omegle-style)
  const findRandomStranger = useCallback(async (myToken?: string, wantedToken?: string) => {
    setIsConnecting(true);
    
    try {
      // Always include token preferences in payload if available
      const endpoint = '/api/matches/random';
      const payload = { 
        offerToken: myToken || "TAS", 
        offerAmount: "100", // Default amount
        wantToken: wantedToken || "BNB",
        wantAmount: "100"  // Default amount
      };
      
      console.log("Finding match with payload:", payload);
      
      // Add user to the waiting pool
      const response = await apiRequest('POST', endpoint, payload);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Match response:", data);
        
        // Check if we got a successful match
        if (data.match || data.randomMatch) {
          const matchData = data.match || data.randomMatch;
          
          // Add new contact to list if not already present
          setContacts(prev => {
            // Make sure prev is always an array before using array methods
            const prevArray = Array.isArray(prev) ? prev : [];
            
            // Check if the contact already exists
            const exists = prevArray.some(contact => 
              contact && contact.id === matchData.id
            );
            
            if (!exists) {
              return [matchData, ...prevArray];
            }
            return prevArray;
          });
          
          setActiveContact(matchData.id);
          setMatchFound(true);
          
          // Notify the WebSocket server about the match
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'match_connected',
              matchId: matchData.id,
              myToken: myToken || 'TAS',
              wantedToken: wantedToken || 'BNB'
            }));
          }
          
          return true;
        } else {
          // No available traders at the moment, use AI trader as fallback
          console.log("No matches available, using fallback trader");
          createChatbot(myToken, wantedToken);
          return true;
        }
      } else {
        // API error, use fallback trader
        console.error("API error when finding match:", response.statusText);
        createChatbot(myToken, wantedToken);
        return true;
      }
    } catch (error) {
      console.error('Error finding match:', error);
      // Error handling fallback
      createChatbot(myToken, wantedToken);
      return true;
    } finally {
      setIsConnecting(false);
    }
  }, [socket]);
  
  // Create a simulated trader (AI-like) contact when no human matches are found
  const createChatbot = useCallback((myToken?: string, wantedToken?: string) => {
    // Generate a random trader profile
    const traders = [
      {
        id: Date.now(),
        name: "Alex Crypto",
        avatarBg: "bg-gradient-to-r from-blue-500 to-indigo-600",
        avatarText: "text-white",
        tokenExpertise: ["TAS", "BNB", "ETH"],
        tradingStyle: "conservative",
        personality: "analytical"
      },
      {
        id: Date.now() + 1,
        name: "Sam Nakamoto",
        avatarBg: "bg-gradient-to-r from-amber-500 to-orange-600",
        avatarText: "text-white",
        tokenExpertise: ["BTC", "TAS", "SOL"],
        tradingStyle: "aggressive",
        personality: "enthusiastic"
      },
      {
        id: Date.now() + 2,
        name: "Jordan Satoshi",
        avatarBg: "bg-gradient-to-r from-emerald-500 to-green-600",
        avatarText: "text-white",
        tokenExpertise: ["DOGE", "CAKE", "BNB"],
        tradingStyle: "moderate",
        personality: "cautious"
      },
      {
        id: Date.now() + 3,
        name: "Riley TASmaster",
        avatarBg: "bg-gradient-to-r from-red-500 to-purple-600",
        avatarText: "text-white",
        tokenExpertise: ["TAS", "MEME", "BTC"],
        tradingStyle: "speculative",
        personality: "bold"
      }
    ];
    
    // Select a random trader
    const randomTrader = traders[Math.floor(Math.random() * traders.length)];
    
    // Create a more natural trading contact
    const botContact: Contact = {
      id: randomTrader.id,
      name: randomTrader.name,
      avatarBg: randomTrader.avatarBg,
      avatarText: randomTrader.avatarText,
      isOnline: true,
      lastMessage: "Hey there, looking to trade?",
      lastMessageTime: new Date().toLocaleTimeString(),
      token: wantedToken || randomTrader.tokenExpertise[0],
      tokenWanted: myToken || randomTrader.tokenExpertise[1]
    };
    
    // Add trader to contacts
    setContacts(prev => {
      // Make sure prev is always an array before using array methods
      const prevArray = Array.isArray(prev) ? prev : [];
      return [botContact, ...prevArray];
    });
    
    // Set trader as active contact
    setActiveContact(randomTrader.id);
    
    // Add initial greeting message
    const greetings = [
      `Hey! I'm looking to trade some ${botContact.token}. Are you interested?`,
      `Hi there! I see you're in the market for ${botContact.tokenWanted}. Let's talk.`,
      `Hello from TASChain! I've got some ${botContact.token} I'm looking to trade. What's your offer?`,
      `Hey, nice to meet you! I'm interested in ${botContact.tokenWanted}. Got some to trade?`
    ];
    
    const initialMessage: Message = {
      id: Date.now(),
      text: greetings[Math.floor(Math.random() * greetings.length)],
      timestamp: new Date().toISOString(),
      isFromMe: false,
      isRead: true
    };
    
    // Initialize messages with safety check
    setMessages(initialMessage ? [initialMessage] : []);
    setMatchFound(true);
    
    // Simulate an active trader by adding a follow-up message
    setTimeout(() => {
      const followupMessages = [
        `What's your price range for ${botContact.tokenWanted}?`,
        `I've been trading ${botContact.token} for a while now. The market looks bullish today.`,
        `Have you seen the latest news about ${botContact.tokenWanted}? The price might go up soon.`,
        `I like the tokenomics of ${botContact.token}. What do you think?`
      ];
      
      const followupMessage: Message = {
        id: Date.now() + 100,
        text: followupMessages[Math.floor(Math.random() * followupMessages.length)],
        timestamp: new Date().toISOString(),
        isFromMe: false,
        isRead: true
      };
      
      setMessages(prev => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return [...prevArray, followupMessage];
      });
    }, 3000);
    
    // Listen for user messages to this AI trader and respond intelligently
    const originalSendMessage = sendMessage;
    const botId = randomTrader.id;
    
    // Override sendMessage temporarily to handle AI responses
    (window as any).aiTraderListener = (message: string) => {
      if (activeContact === botId) {
        setTimeout(() => {
          respondToUserMessage(message, botId, randomTrader);
        }, 1000 + Math.random() * 2000); // Random delay to feel more natural
      }
    };
  }, [sendMessage, activeContact]);
  
  // Handle AI trader responses based on user messages
  const respondToUserMessage = useCallback((userMessage: string, botId: number, trader: any) => {
    const lowerMsg = userMessage.toLowerCase();
    let response = "";
    
    // Simple pattern matching for common trade questions
    if (lowerMsg.includes("price") || lowerMsg.includes("how much")) {
      const prices = {
        "TAS": `1 TAS is around $1.00 right now`,
        "BNB": `BNB is trading at about $335 currently`,
        "ETH": `ETH is at $3,400 today`,
        "BTC": `BTC is hovering around $65,000`,
        "DOGE": `DOGE is at $0.15 currently`,
        "CAKE": `CAKE is trading at $2.78`
      };
      
      const randomToken = trader.tokenExpertise[Math.floor(Math.random() * trader.tokenExpertise.length)];
      response = prices[randomToken as keyof typeof prices] || `I'm thinking about $50 per token is fair`;
    } 
    else if (lowerMsg.includes("trade") || lowerMsg.includes("swap") || lowerMsg.includes("exchange")) {
      response = `I can offer you ${Math.floor(Math.random() * 100) + 10} ${trader.tokenExpertise[0]} for your ${trader.tokenExpertise[1]}. Does that sound fair?`;
    }
    else if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("hey")) {
      response = `Hey there! Good to connect with you. I'm looking to trade some ${trader.tokenExpertise[0]} today. What are you interested in?`;
    }
    else if (lowerMsg.includes("offer") || lowerMsg.includes("deal")) {
      response = `How about this - I'll trade you ${Math.floor(Math.random() * 50) + 20} ${trader.tokenExpertise[0]} at a 2% discount from market rate. What do you think?`;
    }
    else if (lowerMsg.includes("market") || lowerMsg.includes("trend")) {
      const trends = ["bullish", "showing resistance", "consolidating", "breaking out", "correcting slightly"];
      const randomTrend = trends[Math.floor(Math.random() * trends.length)];
      response = `The market for ${trader.tokenExpertise[0]} is looking ${randomTrend} right now. Good time to ${randomTrend === 'bullish' || randomTrend === 'breaking out' ? 'buy' : 'hold'}.`;
    }
    else if (lowerMsg.includes("wait") || lowerMsg.includes("think") || lowerMsg.includes("consider")) {
      response = `No problem, take your time. The offer stands. Let me know when you decide.`;
    }
    else if (lowerMsg.includes("agree") || lowerMsg.includes("yes") || lowerMsg.includes("ok") || lowerMsg.includes("sure")) {
      response = `Great! Click the Trade button above and we can finalize the details.`;
    }
    else if (lowerMsg.includes("no") || lowerMsg.includes("not interested") || lowerMsg.includes("pass")) {
      response = `No worries! Let me know if you change your mind or if you're interested in something else.`;
    }
    else {
      // Default responses for other messages
      const defaultResponses = [
        `Interesting point about ${trader.tokenExpertise[0]}. Have you considered the recent developments?`,
        `I've been trading for about 3 years now. ${trader.tokenExpertise[0]} has been one of my best performers.`,
        `What's your take on the current state of the market? I think we're due for a rally soon.`,
        `I'm particularly interested in ${trader.tokenExpertise[1]} right now. The tokenomics are solid.`,
        `Let me know if you want to discuss specific tokens or if you have a particular trade in mind.`
      ];
      response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
    
    // Add the AI response to messages
    const botResponse: Message = {
      id: Date.now() + 200,
      text: response,
      timestamp: new Date().toISOString(),
      isFromMe: false,
      isRead: true
    };
    
    setMessages(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return [...prevArray, botResponse];
    });
    
    // Update contact's last message
    setContacts(prev => {
      // Make sure prev is always an array before using array methods
      const prevArray = Array.isArray(prev) ? prev : [];
      
      return prevArray.map(contact => 
        contact && contact.id === botId
          ? {
              ...contact,
              lastMessage: response,
              lastMessageTime: new Date().toLocaleTimeString()
            }
          : contact
      );
    });
  }, []);
  
  // Hook into the original sendMessage to catch messages to AI traders
  const originalSendMessage = sendMessage;
  const wrappedSendMessage = useCallback((contactId: number, text: string) => {
    // Call the original sendMessage function
    originalSendMessage(contactId, text);
    
    // If this is an AI trader, trigger the response
    // Make sure contacts is an array before using .some
    const contactsArray = Array.isArray(contacts) ? contacts : [];
    
    if ((window as any).aiTraderListener && 
        contactsArray.some(c => c && c.id === contactId && 
          (c.name?.includes("Crypto") || 
           c.name?.includes("Nakamoto") || 
           c.name?.includes("Satoshi") || 
           c.name?.includes("TASmaster"))
        )) {
      (window as any).aiTraderListener(text);
    }
  }, [originalSendMessage, contacts]);
  
  // Find potential trade matches based on specific tokens
  const findTradeMatch = useCallback((myToken: string, wantedToken: string) => {
    return findRandomStranger(myToken, wantedToken);
  }, [findRandomStranger]);
  
  // Start a chat with a specific user
  const startChat = useCallback((userId: number) => {
    // Set the active contact to the specified user
    setActiveContact(userId);
    
    // Check if we need to load messages for this contact
    if (activeContact !== userId) {
      const loadUserMessages = async () => {
        try {
          const response = await apiRequest('GET', `/api/messages/${userId}`);
          if (response.ok) {
            const data = await response.json();
            setMessages(data);
          }
        } catch (error) {
          console.error('Error loading user messages:', error);
        }
      };
      
      loadUserMessages();
    }
  }, [activeContact]);

  return {
    contacts,
    messages,
    activeContact,
    setActiveContact,
    sendMessage: wrappedSendMessage, // Use the wrapped version
    findTradeMatch,
    findRandomStranger,
    isConnecting,
    matchFound,
    setMatchFound,
    startChat,
    userInfo: {
      nickname: nickname || address?.slice(0, 6) + '...' + address?.slice(-4),
      address
    }
  };
};