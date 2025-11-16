import { useState, useEffect, useRef } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Send, 
  Search, 
  MessageCircle, 
  Phone, 
  PhoneOff,
  Filter,
  MapPin,
  Globe
} from "lucide-react";

interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'stranger';
  timestamp: Date;
}

interface PeerConnection {
  id: string;
  walletAddress: string;
  isConnected: boolean;
}

const TradeNTalk = () => {
  const { isConnected, address, openConnectModal } = useWallet();
  const { toast } = useToast();
  
  // Chat state
  const [isSearching, setIsSearching] = useState(false);
  const [isConnectedToPeer, setIsConnectedToPeer] = useState(false);
  const [connectedPeer, setConnectedPeer] = useState<PeerConnection | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(0);
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    city: string;
    country: string;
    area: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [filters, setFilters] = useState({
    ageRange: { min: 18, max: 65 },
    interests: [] as string[],
    language: 'any',
    gender: 'any',
    location: {
      country: '',
      city: '',
      area: ''
    }
  });
  const [filtersUnlocked, setFiltersUnlocked] = useState(false);
  const [tasBalance, setTasBalance] = useState(0);
  const [waitingForNext, setWaitingForNext] = useState(false);
  
  // Video chat state
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [rtcPeerConnection, setRtcPeerConnection] = useState<RTCPeerConnection | null>(null);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            
            const locationData = {
              city: data.city || data.locality || 'Unknown',
              country: data.countryName || 'Unknown',
              area: data.principalSubdivision || data.localityInfo?.administrative?.[0]?.name || 'Unknown',
              latitude,
              longitude
            };
            
            setUserLocation(locationData);
            console.log('[Location] User location detected:', locationData);
          } catch (error) {
            console.error('[Location] Error getting location details:', error);
          }
        },
        (error) => {
          console.error('[Location] Geolocation error:', error);
        }
      );
    }
  }, []);

  // Check TAS balance for advanced features
  useEffect(() => {
    const checkTasBalance = async () => {
      if (!address) return;
      
      try {
        const response = await fetch(`/api/tokens?wallet=${address}`);
        const data = await response.json();
        
        if (data.success) {
          const tasToken = data.myTokens.find((token: any) => 
            token.symbol === 'TAS' || token.name.includes('TAS')
          );
          
          if (tasToken) {
            const balance = parseFloat(tasToken.balance || '0');
            setTasBalance(balance);
            setFiltersUnlocked(balance >= 200);
            
            console.log(`[TAS Balance] ${balance} TAS tokens detected`);
            if (balance >= 200) {
              console.log('[Filters] Advanced location filters unlocked');
            }
          }
        }
      } catch (error) {
        console.error('Error checking TAS wallet status:', error);
      }
    };

    if (isConnected && address) {
      checkTasBalance();
    }
  }, [isConnected, address]);

  // WebSocket connection
  useEffect(() => {
    if (!isConnected || !address) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('[WebSocket] Connecting to:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebSocket] Connection established');
      ws.send(JSON.stringify({
        type: 'join_chat',
        walletAddress: address
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WebSocket] Received message:', data.type);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      console.log('[WebSocket] Connection closed');
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
    };

    return () => {
      if (rtcPeerConnection) {
        rtcPeerConnection.close();
      }
      ws.close();
    };
  }, [isConnected, address]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize WebRTC peer connection
  const initializePeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote stream');
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.play();
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'ice_candidate',
          candidate: event.candidate
        }));
      }
    };

    setRtcPeerConnection(pc);
    return pc;
  };

  const handleWebSocketMessage = async (data: any) => {
    switch (data.type) {
      case 'online_count':
        setOnlineUsers(data.count);
        break;
        
      case 'peer_found':
        setIsConnectedToPeer(true);
        setIsSearching(false);
        setWaitingForNext(false);
        setConnectedPeer({
          id: data.peerId,
          walletAddress: data.peerWallet,
          isConnected: true
        });
        
        // Initialize WebRTC peer connection
        const pc = initializePeerConnection();
        
        // Add local stream if available
        if (localStream) {
          localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
          });
          
          // Create and send offer
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            wsRef.current?.send(JSON.stringify({
              type: 'webrtc_offer',
              offer: offer
            }));
          } catch (error) {
            console.error('Error creating offer:', error);
          }
        }
        
        const locationText = data.peerLocation ? ` from ${data.peerLocation.city}, ${data.peerLocation.country}` : '';
        toast({
          title: "Connected to stranger!",
          description: `Video chat starting${locationText}...`
        });
        break;
        
      case 'auto_start_video':
        // Automatically start video call when connected to peer
        setTimeout(() => startVideoCall(), 500);
        break;
        
      case 'webrtc_offer':
        if (rtcPeerConnection) {
          try {
            await rtcPeerConnection.setRemoteDescription(data.offer);
            const answer = await rtcPeerConnection.createAnswer();
            await rtcPeerConnection.setLocalDescription(answer);
            
            wsRef.current?.send(JSON.stringify({
              type: 'webrtc_answer',
              answer: answer
            }));
          } catch (error) {
            console.error('Error handling offer:', error);
          }
        }
        break;
        
      case 'webrtc_answer':
        if (rtcPeerConnection) {
          try {
            await rtcPeerConnection.setRemoteDescription(data.answer);
          } catch (error) {
            console.error('Error handling answer:', error);
          }
        }
        break;
        
      case 'ice_candidate':
        if (rtcPeerConnection && data.candidate) {
          try {
            await rtcPeerConnection.addIceCandidate(data.candidate);
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        }
        break;
        
      case 'disconnected':
        setIsConnectedToPeer(false);
        setConnectedPeer(null);
        setWaitingForNext(false);
        
        // Close peer connection
        if (rtcPeerConnection) {
          rtcPeerConnection.close();
          setRtcPeerConnection(null);
        }
        
        toast({
          title: "Stranger disconnected",
          description: "The conversation has ended"
        });
        break;
        
      case 'waiting_for_next':
        setWaitingForNext(true);
        toast({
          title: "Finding next stranger",
          description: "Please wait while we connect you...",
        });
        break;
        
      case 'no_users_available':
        setIsSearching(false);
        toast({
          title: "No users found",
          description: "No other users are currently searching. Try again later.",
          variant: "destructive"
        });
        break;
        
      case 'message':
        // Only add message if it's not a duplicate based on messageId
        const messageId = data.messageId || Date.now().toString();
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === messageId);
          if (exists) return prev; // Prevent duplicates
          
          return [...prev, {
            id: messageId,
            text: data.text,
            sender: data.sender || 'stranger',
            timestamp: new Date()
          }];
        });
        break;
        
      case 'video_call_incoming':
        toast({
          title: "Incoming video call",
          description: data.hasAudio ? "Stranger wants to video chat with audio" : "Stranger wants to video chat (camera only)"
        });
        // Auto-accept for demo purposes - in production, show accept/decline buttons
        setTimeout(() => acceptVideoCall(), 1000);
        break;
        
      case 'video_call_accepted':
        toast({
          title: "Video call accepted",
          description: "Starting video connection..."
        });
        break;
        
      case 'video_call_ended':
        stopVideoCall();
        toast({
          title: "Video call ended",
          description: "The video call has been terminated"
        });
        break;
    }
  };

  // Video call functions
  const startVideo = async () => {
    try {
      console.log('[Video] Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }, 
        audio: tasBalance >= 1 // Only enable audio if user has TAS tokens
      });
      
      console.log('[Video] Camera access granted, setting up stream...');
      setLocalStream(stream);
      setIsVideoEnabled(true);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play();
      }
      
      // Add stream to peer connection if it exists
      if (rtcPeerConnection) {
        console.log('[WebRTC] Adding tracks to peer connection');
        stream.getTracks().forEach(track => {
          rtcPeerConnection.addTrack(track, stream);
        });
      }
      
      console.log('[Video] Local video started successfully');
      toast({
        title: "Camera enabled",
        description: tasBalance >= 1 ? "Video and audio ready" : "Video ready (audio requires TAS tokens)"
      });
    } catch (error) {
      console.error('[Video] Failed to start video:', error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to start video chat",
        variant: "destructive"
      });
    }
  };

  const startVideoCall = async () => {
    try {
      await startVideo();
      if (wsRef.current && connectedPeer) {
        wsRef.current.send(JSON.stringify({
          type: 'video_call_start',
          hasAudio: tasBalance >= 1
        }));
      }
    } catch (error) {
      console.error('[Video] Failed to start video call:', error);
    }
  };

  const acceptVideoCall = async () => {
    try {
      await startVideo();
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'video_call_accept'
        }));
      }
    } catch (error) {
      console.error('[Video] Failed to accept video call:', error);
    }
  };

  const stopVideoCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const startSearching = () => {
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }

    if (!wsRef.current) return;
    
    setIsSearching(true);
    setWaitingForNext(false);
    
    // Prepare search data with location and TAS token information
    const searchData = {
      type: 'search',
      walletAddress: address,
      filters: filtersUnlocked ? filters : {},
      userLocation: userLocation,
      tasBalance: tasBalance,
      hasAdvancedFilters: filtersUnlocked
    };
    
    wsRef.current.send(JSON.stringify(searchData));
    
    console.log('[Search] Starting search with criteria:', {
      location: userLocation?.city || 'unknown',
      tasBalance: tasBalance,
      advancedFilters: filtersUnlocked,
      filters: filters
    });
    
    // Show appropriate search message based on TAS balance
    if (tasBalance >= 200 && userLocation && filtersUnlocked) {
      toast({
        title: "Searching with location filters",
        description: `Looking for users near ${userLocation.city}, ${userLocation.country}...`
      });
    } else {
      toast({
        title: "Searching for stranger...",
        description: "Looking for someone to chat with"
      });
    }
  };

  const findNextUser = () => {
    if (!wsRef.current) return;
    
    setWaitingForNext(true);
    setIsConnectedToPeer(false);
    setConnectedPeer(null);
    setMessages([]);
    stopVideoCall();
    
    // Send request for next user
    wsRef.current.send(JSON.stringify({
      type: 'find_next',
      walletAddress: address
    }));
    
    toast({
      title: "Finding next stranger",
      description: "Searching for a new person to chat with..."
    });
  };

  const stopSearching = () => {
    if (!wsRef.current) return;
    
    setIsSearching(false);
    setIsConnectedToPeer(false);
    setConnectedPeer(null);
    setMessages([]);
    stopVideoCall();
    
    wsRef.current.send(JSON.stringify({
      type: 'disconnect',
      walletAddress: address
    }));
    
    toast({
      title: "Disconnected",
      description: "You have stopped searching and disconnected from any active chat"
    });
  };

  const sendMessage = () => {
    if (!currentMessage.trim() || !wsRef.current || !isConnectedToPeer) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      text: currentMessage,
      sender: 'me',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    
    wsRef.current.send(JSON.stringify({
      type: 'message',
      text: currentMessage,
      messageId: message.id
    }));
    
    setCurrentMessage("");
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800 mb-4">
              Trade N Talk - Random Stranger Chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Connect your wallet to start chatting with random strangers from around the world. 
              Experience secure, wallet-based authentication for anonymous conversations.
            </p>
            <Button onClick={openConnectModal} size="lg" className="bg-primary hover:bg-primary-600">
              <Users className="mr-2 h-5 w-5" />
              Connect Wallet to Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Trade N Talk</h1>
        <p className="text-gray-600">Random stranger chat with text and video</p>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Users className="w-4 h-4 mr-1" />
            {onlineUsers} online
          </Badge>
          
          {userLocation && (
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              <MapPin className="w-4 h-4 mr-1" />
              {userLocation.city}, {userLocation.country}
            </Badge>
          )}
          
          {tasBalance > 0 && (
            <Badge variant="outline" className="text-purple-600 border-purple-600">
              {tasBalance} TAS tokens
            </Badge>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {filtersUnlocked && (
            <Badge className="ml-2 bg-yellow-500 text-white text-xs">
              Premium
            </Badge>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Chat Area */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Video Chat</span>
                {isConnectedToPeer && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isVideoEnabled ? stopVideoCall : startVideoCall}
                    >
                      {isVideoEnabled ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                    </Button>
                    {tasBalance >= 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                      >
                        {isAudioEnabled ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px]">
                {/* Local Video */}
                <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                    You
                  </div>
                </div>
                
                {/* Remote Video */}
                <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                    {connectedPeer ? 'Stranger' : 'Waiting...'}
                  </div>
                  {!isConnectedToPeer && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      {isSearching ? (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                          <p>Searching for stranger...</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p>No video call active</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat & Controls */}
        <div className="space-y-6">
          {/* Filters Panel */}
          {showFilters && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chat Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasBalance >= 1 ? (
                  <>
                    <div>
                      <label className="text-sm font-medium">Age Range</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          type="number"
                          value={filters.ageRange.min}
                          onChange={(e) => setFilters(prev => ({ 
                            ...prev, 
                            ageRange: { ...prev.ageRange, min: parseInt(e.target.value) }
                          }))}
                          className="w-20"
                        />
                        <span>to</span>
                        <Input
                          type="number"
                          value={filters.ageRange.max}
                          onChange={(e) => setFilters(prev => ({ 
                            ...prev, 
                            ageRange: { ...prev.ageRange, max: parseInt(e.target.value) }
                          }))}
                          className="w-20"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Gender</label>
                      <select 
                        value={filters.gender} 
                        onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full mt-1 p-2 border rounded"
                      >
                        <option value="any">Any Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {tasBalance >= 200 && (
                      <div>
                        <label className="text-sm font-medium">Location (Advanced) - 200+ TAS</label>
                        <div className="space-y-2 mt-1">
                          <select 
                            value={filters.location.country} 
                            onChange={(e) => setFilters(prev => ({ 
                              ...prev, 
                              location: { ...prev.location, country: e.target.value }
                            }))}
                            className="w-full p-2 border rounded text-sm"
                          >
                            <option value="">Any Country</option>
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="GB">United Kingdom</option>
                            <option value="AU">Australia</option>
                            <option value="DE">Germany</option>
                            <option value="FR">France</option>
                            <option value="JP">Japan</option>
                            <option value="CN">China</option>
                            <option value="IN">India</option>
                            <option value="PK">Pakistan</option>
                            <option value="BR">Brazil</option>
                          </select>
                          <Input
                            type="text"
                            placeholder="City (optional)"
                            value={filters.location.city}
                            onChange={(e) => setFilters(prev => ({ 
                              ...prev, 
                              location: { ...prev.location, city: e.target.value }
                            }))}
                            className="w-full p-2 border rounded text-sm"
                          />
                          <Input
                            type="text"
                            placeholder="Area/State (optional)"
                            value={filters.location.area}
                            onChange={(e) => setFilters(prev => ({ 
                              ...prev, 
                              location: { ...prev.location, area: e.target.value }
                            }))}
                            className="w-full p-2 border rounded text-sm"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium">Language</label>
                      <select 
                        value={filters.language} 
                        onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full mt-1 p-2 border rounded"
                      >
                        <option value="any">Any Language</option>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="zh">Chinese</option>
                        <option value="ja">Japanese</option>
                        <option value="ur">Urdu</option>
                        <option value="hi">Hindi</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Filter className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Hold TAS tokens to unlock advanced filters
                    </p>
                    <p className="text-xs text-gray-500">
                      1+ TAS: Basic filters • 200+ TAS: Location filters
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isSearching && !isConnectedToPeer && (
                <Button onClick={startSearching} className="w-full" size="lg">
                  <Search className="mr-2 h-5 w-5" />
                  Start Searching
                </Button>
              )}
              
              {isSearching && !isConnectedToPeer && (
                <Button onClick={stopSearching} variant="destructive" className="w-full" size="lg">
                  <PhoneOff className="mr-2 h-5 w-5" />
                  Stop Searching
                </Button>
              )}
              
              {isConnectedToPeer && (
                <div className="space-y-2">
                  <Button onClick={findNextUser} variant="outline" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Next Stranger
                  </Button>
                  <Button onClick={stopSearching} variant="destructive" className="w-full">
                    <PhoneOff className="mr-2 h-4 w-4" />
                    End Chat
                  </Button>
                </div>
              )}
              
              {waitingForNext && (
                <div className="text-center py-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Finding next stranger...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <MessageCircle className="mr-2 h-5 w-5" />
                Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages */}
              <div className="h-64 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    {isConnectedToPeer ? (
                      <p>Start a conversation with your stranger!</p>
                    ) : (
                      <p>Connect with someone to start chatting</p>
                    )}
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          message.sender === 'me'
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {isConnectedToPeer && (
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TradeNTalk;