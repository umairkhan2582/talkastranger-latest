import { useState, useEffect, useRef } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Search, 
  Users,
  Phone,
  PhoneOff,
  MapPin,
  Filter,
  Send,
  MessageSquare,
  Clock,
  Shield,
  Image,
  AlertCircle,
  Navigation,
  SkipForward,
  Camera,
  Share2,
  Gift,
  Target,
  Globe
} from "lucide-react";
import RealUserIntegration from '@/components/RealUserIntegration';
import TASRewardsSystem from '@/components/TASRewardsSystem';
import FAQSection from '@/components/FAQSection';
import LocationThumbnails from '@/components/LocationThumbnails';
import { Helmet } from "react-helmet";

interface ChatMessage {
  id: string;
  text?: string;
  image?: string;
  sender: 'me' | 'stranger';
  timestamp: Date;
}

interface OnlineUser {
  id: string;
  walletAddress: string;
  gender?: string;
  country?: string;
  city?: string;
  area?: string;
  isSearching: boolean;
  location?: {
    country: string;
    city: string;
    area?: string;
  };
}

export default function TradeNTalkSimple() {
  const { isConnected, address, openConnectModal } = useWallet();
  const { toast } = useToast();
  
  // WebSocket and connection states
  const [isSearching, setIsSearching] = useState(false);
  const [isConnectedToPeer, setIsConnectedToPeer] = useState(false);
  const [connectedPeer, setConnectedPeer] = useState<string | null>(null);
  const [searchingCount, setSearchingCount] = useState(0);
  const [tasBalance, setTasBalance] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  
  // Media states
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [audioTimeLeft, setAudioTimeLeft] = useState(20); // 20 seconds for non-TAS holders
  const [audioTimer, setAudioTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Chat states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [imagesBlocked, setImagesBlocked] = useState(false);
  
  // Location states
  const [userLocation, setUserLocation] = useState<{
    country: string;
    city: string;
    area: string;
  } | null>(null);
  const [peerLocation, setPeerLocation] = useState<{
    country: string;
    city: string;
    area: string;
  } | null>(null);
  
  // Sidebar state
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'users' | 'invite' | 'rewards'>('chat');
  
  // Filter states (TAS holders only)
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: '',
    country: '',
    city: '',
    area: ''
  });
  
  // Load preferred location and gender from sessionStorage
  useEffect(() => {
    // Load gender preference
    const savedGender = sessionStorage.getItem('userGender');
    if (savedGender) {
      console.log('[TradeNTalk] Loading gender preference from sessionStorage:', savedGender);
      setFilters(prev => ({ ...prev, gender: savedGender }));
    }
    
    // Load location preference
    const savedLocation = sessionStorage.getItem('userLocation');
    if (savedLocation) {
      console.log('[TradeNTalk] Loading location preference from sessionStorage:', savedLocation);
      // savedLocation is a simple string like "usa", "uk", etc.
      setFilters(prev => ({ ...prev, country: savedLocation }));
    }
    
    // Load preferred location from sessionStorage (set by location pages)
    const preferredLocationData = sessionStorage.getItem('preferredLocation');
    if (preferredLocationData) {
      try {
        const { name, type } = JSON.parse(preferredLocationData);
        if (name) {
          console.log('[TradeNTalk] Loading preferred location from sessionStorage:', name, type);
          // Set the location based on type
          if (type === 'country') {
            setFilters(prev => ({ ...prev, country: name }));
          } else if (type === 'city') {
            setFilters(prev => ({ ...prev, city: name }));
          } else if (type === 'area') {
            setFilters(prev => ({ ...prev, area: name }));
          }
        }
      } catch (e) {
        console.error('[TradeNTalk] Error parsing preferred location:', e);
      }
    }
  }, []);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check TAS balance for features
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
            console.log(`[TAS Balance] ${balance} TAS tokens detected`);
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

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isConnected || !address) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[TradeNTalk] WebSocket connected');
      
      // Get filters including preferred location from sessionStorage
      let userFilters = { ...filters };
      const preferredLocationData = sessionStorage.getItem('preferredLocation');
      if (preferredLocationData) {
        try {
          const { name, type } = JSON.parse(preferredLocationData);
          if (name) {
            console.log('[TradeNTalk] Using preferred location for registration:', name, type);
            if (type === 'country') {
              userFilters.country = name;
            } else if (type === 'city') {
              userFilters.city = name;
            } else if (type === 'area') {
              userFilters.area = name;
            }
          }
        } catch (e) {
          console.error('[TradeNTalk] Error parsing preferred location:', e);
        }
      }
      
      // Get user's location first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
              const data = await response.json();
              
              const locationData = {
                country: data.countryName || 'Unknown',
                city: data.city || data.locality || 'Unknown',
                area: data.principalSubdivision || ''
              };
              
              setUserLocation(locationData);
              
              // Register with location (use preferredLocation if available, otherwise use geolocated location)
              ws.send(JSON.stringify({
                type: 'register',
                walletAddress: address,
                gender: userFilters.gender,
                country: userFilters.country || locationData.country,
                city: userFilters.city || locationData.city,
                area: userFilters.area || locationData.area,
                location: locationData
              }));
            } catch (error) {
              console.log('Failed to get location details:', error);
              // Register without geolocation
              ws.send(JSON.stringify({
                type: 'register',
                walletAddress: address,
                gender: userFilters.gender,
                country: userFilters.country,
                city: userFilters.city,
                area: userFilters.area
              }));
            }
          },
          () => {
            // Register without location if permission denied
            ws.send(JSON.stringify({
              type: 'register',
              walletAddress: address,
              gender: userFilters.gender,
              country: userFilters.country,
              city: userFilters.city,
              area: userFilters.area
            }));
          }
        );
      } else {
        // Register without location if geolocation not supported
        ws.send(JSON.stringify({
          type: 'register',
          walletAddress: address,
          gender: userFilters.gender,
          country: userFilters.country,
          city: userFilters.city,
          area: userFilters.area
        }));
      }
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('[TradeNTalk] Received:', data.type);

      switch (data.type) {
        case 'searching_count':
          setSearchingCount(data.count || 0);
          break;

        case 'online_users':
          setOnlineUsers(data.users || []);
          break;

        case 'matched':
          console.log('[TradeNTalk] Matched with peer:', data.peer);
          setConnectedPeer(data.peer);
          setIsConnectedToPeer(true);
          setIsSearching(false);
          setMessages([]);
          
          // Set peer location if available
          if (data.peer.location) {
            setPeerLocation(data.peer.location);
          }
          
          toast({
            title: "Connected!",
            description: "Found someone to chat with"
          });
          
          // Start video call automatically
          await startVideoCall();
          break;

        case 'chat_message':
          const newMsg: ChatMessage = {
            id: Date.now().toString(),
            text: data.message,
            sender: 'stranger',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, newMsg]);
          break;

        case 'peer_disconnected':
          console.log('[TradeNTalk] Peer disconnected');
          handlePeerDisconnect();
          break;

        case 'offer':
          await handleOffer(data.offer);
          break;

        case 'answer':
          await handleAnswer(data.answer);
          break;

        case 'ice-candidate':
          await handleIceCandidate(data.candidate);
          break;
      }
    };

    ws.onclose = () => {
      console.log('[TradeNTalk] WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('[TradeNTalk] WebSocket error:', error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isConnected, address]);

  // WebRTC handlers
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate
        }));
      }
    };

    pc.ontrack = (event) => {
      console.log('[TradeNTalk] Received remote stream');
      const [stream] = event.streams;
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    return pc;
  };

  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: true // Always request audio, but we'll manage the timer
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(console.error);
      }
      
      setIsVideoEnabled(true);
      
      // Handle audio based on TAS balance
      if (tasBalance >= 1) {
        setIsAudioEnabled(true);
      } else {
        setIsAudioEnabled(true);
        startAudioTimer(); // Start 20-second timer for non-TAS holders
      }
      
      console.log('[TradeNTalk] Media obtained');
      return stream;
    } catch (error) {
      console.error('[TradeNTalk] Media error:', error);
      throw error;
    }
  };

  // Audio timer for non-TAS holders (20 seconds)
  const startAudioTimer = () => {
    if (tasBalance >= 1) return; // TAS holders get unlimited audio
    
    setAudioTimeLeft(20);
    const timer = setInterval(() => {
      setAudioTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          disableAudio();
          toast({
            title: "Audio Time Expired",
            description: "Get TAS tokens for unlimited audio",
            variant: "destructive"
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setAudioTimer(timer);
  };

  const disableAudio = () => {
    setIsAudioEnabled(false);
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = false;
      }
    }
    setIsAudioEnabled(false);
  };

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim() || !wsRef.current || !isConnectedToPeer) return;
    
    // Check message count limit (10 messages after sending an image)
    if (imagesBlocked && messageCount >= 10) {
      toast({
        title: "Message Limit Reached",
        description: "You can only send 10 messages after sharing an image",
        variant: "destructive"
      });
      return;
    }
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'me',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    setMessageCount(prev => prev + 1);
    
    wsRef.current.send(JSON.stringify({
      type: 'chat_message',
      message: newMessage
    }));
    
    setNewMessage('');
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !wsRef.current || !isConnectedToPeer) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      
      const message: ChatMessage = {
        id: Date.now().toString(),
        image: base64,
        sender: 'me',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, message]);
      setImagesBlocked(true); // Block after 10 messages
      setMessageCount(0); // Reset message count
      
      wsRef.current?.send(JSON.stringify({
        type: 'chat_image',
        image: base64
      }));
      
      toast({
        title: "Image Sent",
        description: "You can now send 10 more messages",
      });
    };
    reader.readAsDataURL(file);
    
    // Reset input
    event.target.value = '';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;
      
      await pc.setRemoteDescription(offer);
      
      const stream = await getUserMedia();
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'answer',
          answer: answer
        }));
      }
      
      console.log('[TradeNTalk] Answer sent');
    } catch (error) {
      console.error('[TradeNTalk] Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer);
        console.log('[TradeNTalk] Answer processed');
      }
    } catch (error) {
      console.error('[TradeNTalk] Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
        console.log('[TradeNTalk] ICE candidate added');
      }
    } catch (error) {
      console.error('[TradeNTalk] Error adding ICE candidate:', error);
    }
  };

  const startVideoCall = async () => {
    try {
      const stream = await getUserMedia();
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;
      
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'offer',
          offer: offer
        }));
      }
      
      console.log('[TradeNTalk] Offer sent');
    } catch (error) {
      console.error('[TradeNTalk] Error starting video call:', error);
    }
  };

  const handlePeerDisconnect = () => {
    setIsConnectedToPeer(false);
    setConnectedPeer(null);
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    toast({
      title: "Disconnected",
      description: "The other person left the chat"
    });
  };

  const startSearching = () => {
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }

    if (!wsRef.current) return;
    
    setIsSearching(true);
    
    // Get location filter from filters state (already populated from sessionStorage)
    const locationFilter = filters.country || filters.city || filters.area;
    
    // Include filters
    const searchData: any = {
      type: 'search',
      walletAddress: address,
      filters: {
        gender: filters.gender // Gender filter available to all users
      },
      tasBalance: tasBalance
    };

    // Add location filters only for TAS holders
    if (tasBalance >= 1 && locationFilter) {
      searchData.filters.country = locationFilter;
    }
    
    wsRef.current.send(JSON.stringify(searchData));
    
    console.log('[TradeNTalk] Starting search with filters:', searchData.filters);
    
    let searchMessage = "Looking for someone to video chat with";
    if (filters.gender && locationFilter && tasBalance >= 1) {
      searchMessage = `Looking for ${filters.gender === 'male' ? 'males' : filters.gender === 'female' ? 'females' : 'people'} from ${locationFilter}`;
    } else if (filters.gender) {
      searchMessage = `Looking for ${filters.gender === 'male' ? 'males' : filters.gender === 'female' ? 'females' : 'people'} to chat with`;
    } else if (locationFilter && tasBalance >= 1) {
      searchMessage = `Looking for people from ${locationFilter}`;
    }
    
    toast({
      title: "Searching...",
      description: searchMessage
    });
  };

  const stopSearching = () => {
    if (!wsRef.current) return;
    
    setIsSearching(false);
    
    wsRef.current.send(JSON.stringify({
      type: 'stop_search'
    }));
    
    console.log('[TradeNTalk] Stopped searching');
  };

  const disconnect = () => {
    if (!wsRef.current) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'disconnect'
    }));
    
    handlePeerDisconnect();
  };

  const findNext = () => {
    if (!wsRef.current) return;
    
    // Disconnect from current peer
    if (isConnectedToPeer) {
      wsRef.current.send(JSON.stringify({
        type: 'disconnect'
      }));
      
      handlePeerDisconnect();
    }
    
    // Reset chat state
    setMessages([]);
    setMessageCount(0);
    setImagesBlocked(false);
    setPeerLocation(null);
    
    // Start searching for new peer
    setTimeout(() => {
      startSearching();
    }, 500);
    
    toast({
      title: "Finding Next Person",
      description: "Looking for someone new to chat with"
    });
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream && tasBalance >= 1) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const shareLocation = () => {
    if (!isConnectedToPeer || !userLocation) {
      toast({
        title: "Cannot Share Location",
        description: "Not connected to peer or location unavailable"
      });
      return;
    }
    
    const locationMessage = `📍 My location: ${userLocation.city}, ${userLocation.country}${userLocation.area ? ` (${userLocation.area})` : ''}`;
    
    const message = {
      id: Date.now().toString(),
      text: locationMessage,
      sender: 'me' as const,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        message: locationMessage,
        sender: 'me'
      }));
    }
    
    toast({
      title: "Location Shared",
      description: "Your location has been shared"
    });
  };

  const handleImageShare = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isConnectedToPeer) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      
      const message = {
        id: Date.now().toString(),
        image: imageData,
        sender: 'me' as const,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, message]);
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'chat_message',
          image: imageData,
          sender: 'me'
        }));
      }
    };
    reader.readAsDataURL(file);
  };



  // If not connected, show friendly welcome flow
  if (!isConnected) {
    return (
      <>
        <Helmet>
          <title>Talk A Stranger - Free Random Video Chat with Strangers Online | Meet Girls & Boys</title>
          <meta name="description" content="Free random video chat with strangers online. Talk to strangers, meet new girls and boys instantly. No registration required. Start anonymous video chatting now!" />
          <meta name="keywords" content="talk to strangers, random video chat, chat with strangers, meet strangers online, talk to stranger girls, talk to stranger boys, free video chat, anonymous chat, stranger chat" />
          <meta property="og:title" content="Talk A Stranger - Free Random Video Chat with Strangers" />
          <meta property="og:description" content="Meet and talk with strangers from around the world through free random video chat. Connect with girls and boys instantly!" />
        </Helmet>
        
        <div className="min-h-screen">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white py-20">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center p-4 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                    <Video className="h-16 w-16 text-white" />
                  </div>
                </div>
                
                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                  Talk with Strangers Online - <span className="text-yellow-300">Free Video Chat</span>
                </h1>
                
                <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-white/95">
                  Meet Random Strangers, Girls & Boys from Around the World
                </h2>
                
                <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed">
                  Connect instantly through random video chat. Talk to strangers, make new friends, 
                  and enjoy anonymous conversations with people from everywhere. No registration required!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                  <Button 
                    onClick={openConnectModal}
                    size="lg"
                    className="bg-white text-purple-600 hover:bg-gray-100 text-xl px-12 py-7 rounded-full font-bold shadow-2xl transform hover:scale-105 transition-all"
                    data-testid="button-start-talking-hero"
                  >
                    <Video className="h-6 w-6 mr-3" />
                    Start Talking Now - It's Free!
                  </Button>
                </div>
                
                <div className="flex flex-wrap justify-center gap-6 text-sm">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    100% Anonymous
                  </div>
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Thousands Online
                  </div>
                  <div className="flex items-center">
                    <Video className="w-5 h-5 mr-2" />
                    HD Video Quality
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Features Section */}
          <div className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
                  Why Talk A Stranger is the Best Random Video Chat Platform
                </h2>
                <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
                  Join millions of people who use Talk A Stranger to meet new friends, practice languages, and have fun conversations with strangers online
                </p>
                
                <div className="grid md:grid-cols-3 gap-8">
                  <Card className="border-2 hover:border-purple-300 transition-all hover:shadow-lg">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Video className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-gray-900">Instant Video Chat</h3>
                      <p className="text-gray-600">
                        Connect with random strangers in seconds. High-quality video and audio for the best chatting experience.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 hover:border-pink-300 transition-all hover:shadow-lg">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-gray-900">Safe & Anonymous</h3>
                      <p className="text-gray-600">
                        Chat anonymously without sharing personal info. Skip anyone you don't want to talk with.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 hover:border-orange-300 transition-all hover:shadow-lg">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Globe className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-gray-900">Global Community</h3>
                      <p className="text-gray-600">
                        Meet people from 150+ locations worldwide. Talk to strangers from any country, city, or area.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
          
          {/* Location Thumbnails */}
          <LocationThumbnails />
          
          {/* FAQ Section */}
          <FAQSection />
          
          {/* Final CTA */}
          <div className="py-16 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-4xl font-bold text-white mb-6">
                Ready to Talk with Strangers?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of people already chatting. Start talking to random strangers, meet new girls and boys, and make friends from around the world!
              </p>
              <Button 
                onClick={openConnectModal}
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 text-xl px-12 py-7 rounded-full font-bold shadow-2xl transform hover:scale-105 transition-all"
                data-testid="button-start-talking-footer"
              >
                <Video className="h-6 w-6 mr-3" />
                Start Free Video Chat Now
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="container mx-auto px-3 py-4 max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Talk A Stranger</h1>
          <p className="text-gray-600 text-sm">Connect with strangers via video chat</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {searchingCount > 0 && (
            <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
              <Users className="w-3 h-3 mr-1" />
              {searchingCount} searching
            </Badge>
          )}
          
          {tasBalance > 0 && (
            <Badge variant="outline" className="text-purple-600 border-purple-600 text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              {tasBalance} TAS
            </Badge>
          )}
          
          {tasBalance >= 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="relative text-xs"
            >
              <Filter className="w-3 h-3 mr-1" />
              More Filters
              <Badge className="ml-1 bg-yellow-500 text-white text-[10px] px-1">
                Pro
              </Badge>
            </Button>
          )}
        </div>
      </div>

      {/* Gender Filter - Available to Everyone */}
      <Card className="mb-4">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium whitespace-nowrap">Find:</label>
            <Select value={filters.gender} onValueChange={(value) => setFilters({...filters, gender: value})}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Anyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Anyone</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-gray-500">Select who you'd like to chat with</span>
          </div>
        </CardContent>
      </Card>

      {/* Premium Location Filters - TAS Holders Only */}
      {showFilters && tasBalance >= 1 && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Shield className="w-4 h-4 mr-2 text-yellow-500" />
              Premium Location Filters (TAS Holders Only)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Country</label>
                <Input
                  placeholder="Enter country"
                  value={filters.country}
                  onChange={(e) => setFilters({...filters, country: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">City</label>
                <Input
                  placeholder="Enter city"
                  value={filters.city}
                  onChange={(e) => setFilters({...filters, city: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Area</label>
                <Input
                  placeholder="Enter area"
                  value={filters.area}
                  onChange={(e) => setFilters({...filters, area: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main Video Area */}
        <div className="flex-1">
          {/* Modern Control Panel - Outside Video Area */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 mb-6 border border-slate-200 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Status & Info */}
              <div className="flex items-center space-x-4">
                {/* Audio Timer */}
                {tasBalance < 1 && isAudioEnabled && audioTimeLeft < 20 && (
                  <div className="flex items-center bg-red-100 text-red-700 px-3 py-2 rounded-full text-sm font-medium animate-pulse">
                    <Clock className="w-4 h-4 mr-2" />
                    Audio: {audioTimeLeft}s
                  </div>
                )}
                
                {/* Peer Location */}
                {peerLocation && isConnectedToPeer && (
                  <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-2 rounded-full text-sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    {peerLocation.city}, {peerLocation.country}
                  </div>
                )}

                {/* Connection Status */}
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isConnectedToPeer ? 'bg-green-500' : isSearching ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="text-sm text-gray-600">
                    {isConnectedToPeer ? 'Connected' : isSearching ? 'Searching...' : 'Ready'}
                  </span>
                </div>
              </div>

              {/* Main Action Buttons */}
              <div className="flex items-center space-x-3">
                {!isConnectedToPeer ? (
                  isSearching ? (
                    <button
                      onClick={stopSearching}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg transform transition duration-200 hover:scale-105 flex items-center"
                    >
                      <PhoneOff className="h-5 w-5 mr-2" />
                      Stop Search
                    </button>
                  ) : (
                    <button
                      onClick={startSearching}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl transform transition duration-200 hover:scale-105 flex items-center"
                      data-testid="button-find-stranger"
                    >
                      <Search className="h-6 w-6 mr-3" />
                      Find A Stranger
                    </button>
                  )
                ) : (
                  <div className="flex items-center space-x-2">
                    {/* Video Toggle */}
                    <button
                      onClick={toggleVideo}
                      className={`p-3 rounded-full transition duration-200 ${
                        isVideoEnabled 
                          ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300' 
                          : 'bg-gray-700 text-white hover:bg-gray-800'
                      }`}
                    >
                      {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </button>
                    
                    {/* Audio Toggle */}
                    <button
                      onClick={toggleAudio}
                      disabled={tasBalance < 1 && audioTimeLeft === 0}
                      className={`p-3 rounded-full transition duration-200 ${
                        isAudioEnabled 
                          ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300' 
                          : 'bg-gray-700 text-white hover:bg-gray-800'
                      } ${tasBalance < 1 && audioTimeLeft === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </button>
                    
                    {/* Next Button */}
                    <button
                      onClick={findNext}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg transform transition duration-200 hover:scale-105 flex items-center"
                    >
                      <SkipForward className="h-5 w-5 mr-2" />
                      Next
                    </button>
                    
                    {/* Disconnect Button */}
                    <button
                      onClick={disconnect}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg transform transition duration-200 hover:scale-105 flex items-center"
                    >
                      <PhoneOff className="h-5 w-5 mr-2" />
                      End
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Video Container */}
          <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 h-[500px]">
              {/* Local Video */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
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
                {!isConnectedToPeer && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center text-gray-400">
                      {isSearching ? (
                        <div className="space-y-2">
                          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                          <p className="text-sm">Searching for someone...</p>
                        </div>
                      ) : (
                        <p className="text-sm">Click "Start Video Chat" to begin</p>
                      )}
                    </div>
                  </div>
                )}
                {isConnectedToPeer && peerLocation && (
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    {peerLocation.city}, {peerLocation.country}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Combined Chat & Users Sidebar */}
        <div className="lg:w-80">
          <Card className="h-[700px] flex flex-col bg-gradient-to-b from-slate-50 to-white border-slate-200 shadow-xl">
            {/* Sleek Tab Header */}
            <CardHeader className="pb-3 border-b border-slate-200">
              <div className="flex space-x-1 bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setSidebarTab('chat')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center ${
                    sidebarTab === 'chat'
                      ? 'bg-white text-slate-900 shadow-md border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Chat
                  {imagesBlocked && messageCount > 0 && (
                    <Badge variant="secondary" className="text-xs ml-1 bg-amber-100 text-amber-700">
                      {10 - messageCount}
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => setSidebarTab('users')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center ${
                    sidebarTab === 'users'
                      ? 'bg-white text-slate-900 shadow-md border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-3 h-3 mr-1" />
                  Online ({onlineUsers.length})
                </button>
                <button
                  onClick={() => setSidebarTab('invite')}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center ${
                    sidebarTab === 'invite'
                      ? 'bg-white text-slate-900 shadow-md border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Share2 className="w-3 h-3 mr-1" />
                  Invite
                </button>
                <button
                  onClick={() => setSidebarTab('rewards')}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center ${
                    sidebarTab === 'rewards'
                      ? 'bg-white text-slate-900 shadow-md border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Gift className="w-3 h-3 mr-1" />
                  Earn
                </button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-4">
              {sidebarTab === 'chat' ? (
                <>
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm mt-12">
                        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">
                          {isConnectedToPeer ? 'Start your conversation!' : 'Connect to someone to start chatting'}
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-xl max-w-[85%] shadow-sm ${
                            message.sender === 'me'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto'
                              : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 mr-auto border border-gray-200'
                          }`}
                        >
                          {message.text && <p className="text-sm leading-relaxed">{message.text}</p>}
                          {message.image && (
                            <img 
                              src={message.image} 
                              alt="Shared image" 
                              className="max-w-full h-auto rounded-lg mt-2 border border-white/20"
                              style={{ maxHeight: '120px' }}
                            />
                          )}
                          <p className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Message Input */}
                  <div className="space-y-3">
                    {imagesBlocked && messageCount > 0 && (
                      <div className="flex items-center space-x-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <AlertCircle className="h-4 w-4" />
                        <span>You can send {10 - messageCount} more messages after sharing an image</span>
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <Input
                        placeholder={isConnectedToPeer ? "Type your message..." : "Connect to chat"}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={!isConnectedToPeer || (imagesBlocked && messageCount >= 10)}
                        className="flex-1 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={!isConnectedToPeer}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button
                        size="sm"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        disabled={!isConnectedToPeer}
                        variant="outline"
                        className="border-slate-300 hover:bg-slate-50 rounded-lg"
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={shareLocation}
                        disabled={!isConnectedToPeer || !userLocation}
                        variant="outline"
                        className="border-slate-300 hover:bg-slate-50 rounded-lg"
                      >
                        <Navigation className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || !isConnectedToPeer || (imagesBlocked && messageCount >= 10)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : sidebarTab === 'users' ? (
                /* Online Users */
                <div className="flex-1 overflow-y-auto">
                  {onlineUsers.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm mt-12">
                      <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No users online</p>
                      <p className="text-xs mt-1">Be the first to start chatting!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {onlineUsers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl hover:from-slate-100 hover:to-slate-200 transition-all duration-200 border border-slate-200 shadow-sm">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                            {user.walletAddress.slice(2, 4).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                              {user.location && (
                                <span className="flex items-center bg-slate-200 px-2 py-1 rounded-full">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {user.location.city}
                                </span>
                              )}
                              <div className="flex items-center space-x-1">
                                <div className={`w-2 h-2 rounded-full ${user.isSearching ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                <Badge 
                                  variant={user.isSearching ? "default" : "secondary"} 
                                  className={`text-xs px-2 py-1 ${user.isSearching ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                                >
                                  {user.isSearching ? 'Searching' : 'Online'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : sidebarTab === 'invite' ? (
                <div className="space-y-4 overflow-y-auto">
                  <RealUserIntegration />
                </div>
              ) : sidebarTab === 'rewards' ? (
                <div className="space-y-4 overflow-y-auto">
                  <TASRewardsSystem />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}