import { useState, useEffect, useRef } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Globe,
  Shield,
  Clock,
  Coins
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
  location?: {
    city: string;
    country: string;
    area: string;
  };
}

// Country data for filtering
const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
];

const TradeNTalkEnhanced = () => {
  const { isConnected, address, openConnectModal } = useWallet();
  const { toast } = useToast();
  
  // Chat state
  const [isSearching, setIsSearching] = useState(false);
  const [isConnectedToPeer, setIsConnectedToPeer] = useState(false);
  const [connectedPeer, setConnectedPeer] = useState<PeerConnection | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [onlineByCountry, setOnlineByCountry] = useState<Record<string, number>>({});
  
  // TAS Token state
  const [tasBalance, setTasBalance] = useState(0);
  const [audioTrialTimeLeft, setAudioTrialTimeLeft] = useState(0);
  const [hasAudioAccess, setHasAudioAccess] = useState(false);
  const [audioTrialUsed, setAudioTrialUsed] = useState(false);
  
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
    country: '',
    city: '',
    area: '',
    ageRange: { min: 18, max: 65 },
    interests: [] as string[],
    language: 'any',
    gender: 'any'
  });
  const [hasAdvancedFilters, setHasAdvancedFilters] = useState(false);
  
  // Video chat state
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [rtcPeerConnection, setRtcPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<{
    camera: string;
    microphone: string;
  }>({ camera: 'prompt', microphone: 'prompt' });
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioTrialTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check TAS balance and determine audio access
  useEffect(() => {
    const checkTASBalance = async () => {
      if (!address) return;
      
      try {
        const response = await fetch(`/api/wallet/balances?address=${address}`);
        const data = await response.json();
        
        if (data.success && data.tokens) {
          const tasToken = data.tokens.find((token: any) => 
            token.symbol === 'TAS' || token.name.includes('TAS')
          );
          
          if (tasToken) {
            const balance = parseFloat(tasToken.balance);
            setTasBalance(balance);
            setHasAudioAccess(balance >= 1); // Require at least 1 TAS for audio
            setHasAdvancedFilters(balance >= 200); // Require 200+ TAS for advanced filters
          }
        }
      } catch (error) {
        console.error('Error checking TAS balance:', error);
      }
    };

    checkTASBalance();
  }, [address]);

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
              area: data.principalSubdivision || data.locality || 'Unknown',
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
          console.error('[Location] Error getting user location:', error);
        }
      );
    }
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!isConnected || !address) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebSocket] Connected to Trade N Talk');
      
      // Register with wallet address
      ws.send(JSON.stringify({
        type: 'register',
        walletAddress: address
      }));
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        await handleWebSocketMessage(data);
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      console.log('[WebSocket] Disconnected from Trade N Talk');
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

  // Check permissions on component mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      setPermissionStatus({
        camera: cameraPermission.state,
        microphone: microphonePermission.state
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  // Initialize WebRTC peer connection
  const initializePeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });

    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote stream');
      const stream = event.streams[0];
      setRemoteStream(stream);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play().catch(e => {
          console.error('Error playing remote video:', e);
        });
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          data: event.candidate
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsInCall(true);
        toast({
          title: "Video call connected!",
          description: "You are now in a video call with a stranger"
        });
      }
    };

    setRtcPeerConnection(pc);
    return pc;
  };

  const handleWebSocketMessage = async (data: any) => {
    switch (data.type) {
      case 'online_count':
        setOnlineUsers(data.count);
        if (data.byCountry) {
          setOnlineByCountry(data.byCountry);
        }
        console.log('[WebSocket] Online users updated:', data.count);
        break;
        
      case 'registration_confirmed':
        console.log('[WebSocket] Registration confirmed for:', data.walletAddress);
        break;
        
      case 'peer_found':
        setIsConnectedToPeer(true);
        setIsSearching(false);
        setConnectedPeer({
          id: data.peerId,
          walletAddress: data.peerWallet,
          isConnected: true,
          location: data.peerLocation
        });
        
        // Initialize WebRTC peer connection
        initializePeerConnection();
        
        // Automatically start video call
        setTimeout(() => startVideoCall(), 1000);
        
        const locationText = data.peerLocation ? 
          ` from ${data.peerLocation.city}, ${data.peerLocation.country}` : '';
        toast({
          title: "Connected to stranger!",
          description: `Video chat starting${locationText}...`
        });
        break;
        
      case 'offer':
        if (rtcPeerConnection && data.data) {
          try {
            await rtcPeerConnection.setRemoteDescription(data.data);
            
            // Add local stream before creating answer
            if (localStream) {
              localStream.getTracks().forEach(track => {
                rtcPeerConnection.addTrack(track, localStream);
              });
            }
            
            const answer = await rtcPeerConnection.createAnswer();
            await rtcPeerConnection.setLocalDescription(answer);
            
            wsRef.current?.send(JSON.stringify({
              type: 'answer',
              data: answer
            }));
            console.log('[WebRTC] Answer sent');
          } catch (error) {
            console.error('[WebRTC] Error handling offer:', error);
          }
        }
        break;
        
      case 'answer':
        if (rtcPeerConnection && data.data) {
          try {
            await rtcPeerConnection.setRemoteDescription(data.data);
            console.log('[WebRTC] Answer received and set');
          } catch (error) {
            console.error('[WebRTC] Error handling answer:', error);
          }
        }
        break;
        
      case 'ice-candidate':
        if (rtcPeerConnection && data.data) {
          try {
            await rtcPeerConnection.addIceCandidate(data.data);
            console.log('[WebRTC] ICE candidate added');
          } catch (error) {
            console.error('[WebRTC] Error adding ICE candidate:', error);
          }
        }
        break;

      case 'video_call_incoming':
        // Accept incoming video call automatically
        acceptVideoCall(data.hasAudio);
        break;

      case 'video_call_accepted':
        toast({
          title: "Video call accepted!",
          description: "The stranger accepted your video call"
        });
        break;

      case 'video_call_declined':
        toast({
          title: "Call declined",
          description: "The stranger declined your video call",
          variant: "destructive"
        });
        break;

      case 'call_ended':
        endCall();
        toast({
          title: "Call ended",
          description: "The stranger ended the call"
        });
        break;
        
      case 'message':
        const message: ChatMessage = {
          id: Date.now().toString(),
          text: data.text,
          sender: data.sender,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, message]);
        break;
        
      case 'peer_disconnected':
        setIsConnectedToPeer(false);
        setConnectedPeer(null);
        endCall();
        toast({
          title: "Peer disconnected",
          description: "The stranger has disconnected"
        });
        break;
        
      case 'searching':
        console.log('[WebSocket] Searching for peers...');
        break;
    }
  };

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // Close the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      
      await checkPermissions();
      toast({
        title: "Permissions granted!",
        description: "Camera and microphone access granted"
      });
    } catch (error) {
      console.error('Error requesting permissions:', error);
      toast({
        title: "Permission denied",
        description: "Please allow camera and microphone access to use video chat",
        variant: "destructive"
      });
    }
  };

  const startVideoCall = async () => {
    try {
      // Request media stream with video always, audio based on TAS balance or trial
      const constraints = {
        video: true,
        audio: hasAudioAccess || !audioTrialUsed
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setIsVideoEnabled(true);
      
      // Set audio state and start trial if needed
      if (hasAudioAccess) {
        setIsAudioEnabled(true);
      } else if (!audioTrialUsed) {
        setIsAudioEnabled(true);
        setAudioTrialUsed(true);
        setAudioTrialTimeLeft(20);
        
        // Start 20-second trial timer
        audioTrialTimerRef.current = setInterval(() => {
          setAudioTrialTimeLeft(prev => {
            if (prev <= 1) {
              // Turn off audio after trial
              if (stream) {
                stream.getAudioTracks().forEach(track => {
                  track.enabled = false;
                  track.stop();
                });
              }
              setIsAudioEnabled(false);
              toast({
                title: "Audio trial ended",
                description: "Add TAS tokens to continue using audio",
                variant: "destructive"
              });
              if (audioTrialTimerRef.current) {
                clearInterval(audioTrialTimerRef.current);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setIsAudioEnabled(false);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play();
      }

      // Add stream to peer connection if it exists
      if (rtcPeerConnection) {
        stream.getTracks().forEach(track => {
          rtcPeerConnection.addTrack(track, stream);
        });

        // Create and send offer
        const offer = await rtcPeerConnection.createOffer();
        await rtcPeerConnection.setLocalDescription(offer);
        
        wsRef.current?.send(JSON.stringify({
          type: 'offer',
          data: offer
        }));
      }

      // Notify peer about video call start
      wsRef.current?.send(JSON.stringify({
        type: 'video_call_start',
        hasAudio: hasAudioAccess || !audioTrialUsed
      }));

      console.log('[WebRTC] Video call started');
    } catch (error) {
      console.error('[WebRTC] Error starting video call:', error);
      toast({
        title: "Camera access required",
        description: "Please allow camera access to start video chat",
        variant: "destructive"
      });
    }
  };

  const acceptVideoCall = async (peerHasAudio: boolean) => {
    try {
      const constraints = {
        video: true,
        audio: hasAudioAccess || !audioTrialUsed
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setIsVideoEnabled(true);
      
      // Handle audio trial logic (same as startVideoCall)
      if (hasAudioAccess) {
        setIsAudioEnabled(true);
      } else if (!audioTrialUsed) {
        setIsAudioEnabled(true);
        setAudioTrialUsed(true);
        setAudioTrialTimeLeft(20);
        
        audioTrialTimerRef.current = setInterval(() => {
          setAudioTrialTimeLeft(prev => {
            if (prev <= 1) {
              if (stream) {
                stream.getAudioTracks().forEach(track => {
                  track.enabled = false;
                  track.stop();
                });
              }
              setIsAudioEnabled(false);
              toast({
                title: "Audio trial ended",
                description: "Add TAS tokens to continue using audio",
                variant: "destructive"
              });
              if (audioTrialTimerRef.current) {
                clearInterval(audioTrialTimerRef.current);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play();
      }

      // Add stream to peer connection
      if (rtcPeerConnection) {
        stream.getTracks().forEach(track => {
          rtcPeerConnection.addTrack(track, stream);
        });
      }

      wsRef.current?.send(JSON.stringify({
        type: 'video_call_accept'
      }));

      console.log('[WebRTC] Video call accepted');
    } catch (error) {
      console.error('[WebRTC] Error accepting video call:', error);
      wsRef.current?.send(JSON.stringify({
        type: 'video_call_decline'
      }));
    }
  };

  const toggleAudio = () => {
    if (!hasAudioAccess && audioTrialUsed) {
      toast({
        title: "Audio requires TAS tokens",
        description: "You need at least 1 TAS token to use audio features",
        variant: "destructive"
      });
      return;
    }

    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (remoteStream) {
      setRemoteStream(null);
    }
    
    if (rtcPeerConnection) {
      rtcPeerConnection.close();
      setRtcPeerConnection(null);
    }
    
    if (audioTrialTimerRef.current) {
      clearInterval(audioTrialTimerRef.current);
      audioTrialTimerRef.current = null;
    }
    
    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
    setIsInCall(false);
    setAudioTrialTimeLeft(0);
    
    wsRef.current?.send(JSON.stringify({
      type: 'end_call'
    }));
  };

  const startSearch = () => {
    if (!isConnected) {
      openConnectModal();
      return;
    }

    setIsSearching(true);
    setMessages([]);
    
    // Send search request with filters and location
    wsRef.current?.send(JSON.stringify({
      type: 'search',
      filters,
      userLocation,
      tasBalance,
      hasAdvancedFilters
    }));

    toast({
      title: "Searching for strangers...",
      description: "Looking for someone to chat with"
    });
  };

  const stopSearch = () => {
    setIsSearching(false);
    wsRef.current?.send(JSON.stringify({
      type: 'stop_search'
    }));
  };

  const nextPeer = () => {
    if (isConnectedToPeer) {
      endCall();
      setIsConnectedToPeer(false);
      setConnectedPeer(null);
      setMessages([]);
      
      // Start searching for next peer
      setTimeout(() => startSearch(), 500);
    }
  };

  const sendMessage = () => {
    if (!currentMessage.trim() || !isConnectedToPeer) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      text: currentMessage,
      sender: 'me',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, message]);
    
    wsRef.current?.send(JSON.stringify({
      type: 'message',
      text: currentMessage,
      messageId: message.id
    }));

    setCurrentMessage("");
  };

  // Country filter for users with 200+ TAS
  const CountryFilter = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">Location Filters</span>
        {!hasAdvancedFilters && (
          <Badge variant="secondary" className="text-xs">
            <Coins className="h-3 w-3 mr-1" />
            Requires 200+ TAS
          </Badge>
        )}
      </div>
      
      {hasAdvancedFilters ? (
        <div className="grid grid-cols-1 gap-3">
          <Select 
            value={filters.country} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, country: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any country</SelectItem>
              {COUNTRIES.map(country => (
                <SelectItem key={country.code} value={country.code}>
                  {country.flag} {country.name}
                  {onlineByCountry[country.code] && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({onlineByCountry[country.code]} online)
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Input
            placeholder="City (optional)"
            value={filters.city}
            onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
          />
          
          <Input
            placeholder="Area/Region (optional)"
            value={filters.area}
            onChange={(e) => setFilters(prev => ({ ...prev, area: e.target.value }))}
          />
        </div>
      ) : (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Hold 200+ TAS tokens to unlock advanced location filters including country, city, and area selection.
          </p>
        </div>
      )}
    </div>
  );

  if (!isConnected) {
    return (
      <div className="container mx-auto p-4 h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Video className="h-6 w-6" />
              Trade N Talk
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Connect your wallet to start video chatting with strangers
            </p>
            <Button onClick={openConnectModal} className="w-full">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6" />
            Trade N Talk
          </h1>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {onlineUsers} online
          </Badge>
          {userLocation && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {userLocation.city}, {userLocation.country}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={tasBalance >= 1 ? "default" : "destructive"}>
            <Coins className="h-3 w-3 mr-1" />
            {tasBalance.toFixed(2)} TAS
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Search Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <CountryFilter />
          </CardContent>
        </Card>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!isConnectedToPeer ? (
                    <Button 
                      onClick={isSearching ? stopSearch : startSearch}
                      disabled={permissionStatus.camera === 'denied'}
                      className="flex items-center gap-2"
                    >
                      <Search className="h-4 w-4" />
                      {isSearching ? "Stop Search" : "Start Search"}
                    </Button>
                  ) : (
                    <Button onClick={nextPeer} variant="outline">
                      Next Stranger
                    </Button>
                  )}
                  
                  {permissionStatus.camera === 'denied' && (
                    <Button onClick={requestPermissions} variant="outline" size="sm">
                      <Shield className="h-4 w-4 mr-2" />
                      Grant Permissions
                    </Button>
                  )}
                </div>
                
                {isInCall && (
                  <div className="flex items-center gap-2">
                    {audioTrialTimeLeft > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Audio trial: {audioTrialTimeLeft}s
                      </Badge>
                    )}
                    
                    <Button
                      onClick={toggleAudio}
                      variant={isAudioEnabled ? "default" : "secondary"}
                      size="sm"
                      disabled={!hasAudioAccess && audioTrialUsed}
                    >
                      {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      onClick={toggleVideo}
                      variant={isVideoEnabled ? "default" : "secondary"}
                      size="sm"
                    >
                      {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    </Button>
                    
                    <Button onClick={endCall} variant="destructive" size="sm">
                      <PhoneOff className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Video Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-96">
            {/* Remote Video */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-0 h-full">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover bg-gray-900"
                />
                {!remoteStream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                    <div className="text-center">
                      <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm opacity-75">
                        {isConnectedToPeer ? "Waiting for stranger's video..." : "No video call active"}
                      </p>
                    </div>
                  </div>
                )}
                {connectedPeer?.location && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {connectedPeer.location.city}, {connectedPeer.location.country}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Local Video */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-0 h-full">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover bg-gray-800"
                />
                {!localStream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
                    <div className="text-center">
                      <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm opacity-75">Your video</p>
                    </div>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="text-xs">You</Badge>
                </div>
                {!hasAudioAccess && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="destructive" className="text-xs">
                      <MicOff className="h-3 w-3 mr-1" />
                      No TAS
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chat Section */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat
              {isConnectedToPeer && (
                <Badge variant="outline" className="ml-auto">Connected</Badge>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 p-4 space-y-2 overflow-y-auto max-h-80">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {isConnectedToPeer ? "Start a conversation..." : "Connect with someone to start chatting"}
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
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <Separator />
            
            {/* Message Input */}
            <div className="p-4">
              <div className="flex gap-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder={isConnectedToPeer ? "Type a message..." : "Connect to chat"}
                  disabled={!isConnectedToPeer}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!isConnectedToPeer || !currentMessage.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Messages */}
      {isSearching && (
        <div className="fixed bottom-4 right-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="animate-pulse h-2 w-2 bg-primary rounded-full"></div>
                Searching for strangers...
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TradeNTalkEnhanced;