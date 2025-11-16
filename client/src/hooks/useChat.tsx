import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/hooks/useWallet";

interface Contact {
  id: number;
  name: string;
  isOnline: boolean;
  lastMessage: string;
  lastMessageTime: string;
  avatarBg: string;
  avatarText: string;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  text: string;
  timestamp: string;
  isFromMe: boolean;
}

export const useChat = () => {
  const { toast } = useToast();
  const { translate } = useLanguage();
  const { isConnected } = useWallet();
  const [activeContact, setActiveContact] = useState<number | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Setup WebSocket connection when user is connected
  useEffect(() => {
    if (!isConnected) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log("WebSocket connected");
    };
    
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message') {
          // Add message to messages
          queryClient.invalidateQueries({ queryKey: ["/api/messages", activeContact] });
        } else if (data.type === 'contact_status') {
          // Update contact status
          queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    newSocket.onclose = () => {
      console.log("WebSocket disconnected");
    };
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [isConnected, activeContact]);

  // Fetch contacts from API
  const { data: contactsData } = useQuery({
    queryKey: ["/api/contacts"],
    enabled: isConnected,
    staleTime: 30000, // 30 seconds
  });

  // Fetch messages for active contact
  const { data: messagesData } = useQuery({
    queryKey: ["/api/messages", activeContact],
    enabled: isConnected && activeContact !== null,
    staleTime: 5000, // 5 seconds
  });

  // Send message mutation
  const { mutate: sendMessageMutation } = useMutation({
    mutationFn: async ({ contactId, message }: { contactId: number; message: string }) => {
      const response = await apiRequest("POST", "/api/messages", { contactId, message });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Optimistically update the messages
      queryClient.invalidateQueries({ queryKey: ["/api/messages", variables.contactId] });
      
      // Also send the message through WebSocket for real-time delivery
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'chat_message',
          contactId: variables.contactId,
          message: variables.message
        }));
      }
    },
    onError: (error) => {
      toast({
        title: translate("error"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  });

  // Start chat mutation
  const { mutate: startChatMutation } = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", "/api/chats", { userId });
      if (!response.ok) {
        throw new Error("Failed to start chat");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Set the new chat as active
      setActiveContact(data.contactId);
      
      // Invalidate contacts to include the new chat
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
    onError: (error) => {
      toast({
        title: translate("error"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  });

  const sendMessage = (contactId: number, message: string) => {
    sendMessageMutation({ contactId, message });
  };

  const startChat = (userId: number) => {
    startChatMutation(userId);
  };

  return {
    contacts: contactsData?.contacts || [],
    messages: messagesData?.messages || [],
    activeContact,
    setActiveContact,
    sendMessage,
    startChat,
  };
};
