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
  Coins,
  AlertCircle
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

const TradeNTalkFinal = () => {
  const { isConnected, address, openConnectModal } = useWallet();
  const { toast } = useToast();
  
  // Core states
  const [isSearching, setIsSearching] = useState(false);
  const [isConnectedToPeer, setIsConnectedToPeer] = useState(false);
  const [connectedPeer, setConnectedPeer] = useState<PeerConnection | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [onlineByCountry, setOnlineByCountry] = useState<Record<string, number>>({});
  
  // TAS token states
  const [tasBalance, setTasBalance] = useState(0);
  const [audioTrialTimeLeft, setAudioTrialTimeLeft] = useState(0);
  const [hasAudioAccess, setHasAudioAccess] = useState(false);
  const [audioTrialUsed, setAudioTrialUsed] = useState(false);
  
  // Location and filter states
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
  
  // Video call states
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [rtcPeerConnection, setRtcPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [isInCall, setIsInCall] = useState(false);

  // Complete mobile video and audio solution when remoteStream changes
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('[Video] useEffect - COMPLETE mobile solution activation');
      const videoEl = remoteVideoRef.current;
      
      // Step 1: Complete stream reset and reassignment
      videoEl.srcObject = null;
      setTimeout(() => {
        videoEl.srcObject = remoteStream;
        videoEl.load();
        
        // Step 2: Aggressive visibility forcing
        videoEl.style.setProperty('display', 'block', 'important');
        videoEl.style.setProperty('visibility', 'visible', 'important');
        videoEl.style.setProperty('opacity', '1', 'important');
        videoEl.style.zIndex = '9999';
        videoEl.style.position = 'relative';
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        videoEl.style.objectFit = 'cover';
        
        // Step 3: Enable all tracks for audio and video
        remoteStream.getTracks().forEach(track => {
          track.enabled = true;
          console.log('[useEffect] Enabled track:', track.kind, track.label);
        });
        
        // Step 4: Remove all overlays
        document.querySelectorAll('.remote-video-overlay, [class*="overlay"]').forEach(el => el.remove());
        
        // Step 5: Apply mobile-specific solution
        videoEl.muted = true; // Start muted for autoplay
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        
        videoEl.play().then(() => {
          console.log('[useEffect] Video playing - unmuting for audio');
          setTimeout(() => {
            videoEl.muted = false;
            videoEl.volume = 1.0;
          }, 500);
        }).catch(e => {
          console.log('[Video] useEffect play failed:', e);
          videoEl.controls = true; // Show controls if autoplay fails
        });
        console.log('[Video] COMPLETE mobile solution applied via useEffect');
      }, 50);
    }
  }, [remoteStream]);
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

  // Check TAS balance
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
            setHasAudioAccess(balance >= 1);
            setHasAdvancedFilters(balance >= 200);
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

  // Check permissions
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

  // WebSocket connection
  useEffect(() => {
    if (!isConnected || !address) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebSocket] Connected to Trade N Talk');
      
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

  // Effect to handle remote stream updates
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log('[Video Effect] Setting remote stream with tracks:', remoteStream.getTracks().length);
      
      // Log track details for debugging
      remoteStream.getTracks().forEach(track => {
        console.log(`[Video Effect] Remote track: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`);
      });
      
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.autoplay = true;
      remoteVideoRef.current.playsInline = true;
      remoteVideoRef.current.muted = false;
      
      // Force video element to reload and play
      remoteVideoRef.current.load();
      const playPromise = remoteVideoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('[Video Effect] Remote video playing successfully');
        }).catch(e => {
          console.error('[Video Effect] Error playing remote video:', e);
          // Retry with user interaction fallback
          remoteVideoRef.current?.addEventListener('click', () => {
            remoteVideoRef.current?.play().catch(console.error);
          }, { once: true });
        });
      }
    }
  }, [remoteStream]);

  const initializePeerConnection = () => {
    // Mobile-optimized RTCPeerConnection configuration
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    });

    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind, 'enabled:', event.track.enabled);
      console.log('[WebRTC] Remote track readyState:', event.track.readyState);
      console.log('[WebRTC] Event streams length:', event.streams?.length);
      
      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];
        console.log('[WebRTC] Setting remote stream with', remoteStream.getTracks().length, 'tracks');
        
        // Log all tracks in the remote stream
        remoteStream.getTracks().forEach((track, index) => {
          console.log(`[WebRTC] Remote track ${index}:`, {
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
            label: track.label
          });
        });
        
        setRemoteStream(remoteStream);
        
        // Set video call as active when we receive remote stream
        setIsInCall(true);
        console.log('[WebRTC] Video call activated - remote stream received');
        
        // CRITICAL MOBILE VIDEO FIX
        if (remoteVideoRef.current) {
          const video = remoteVideoRef.current;
          
          console.log('[VIDEO STREAM] Stream received - applying mobile fix');
          console.log('[VIDEO STREAM] Stream details:', {
            streamId: remoteStream.id,
            tracks: remoteStream.getTracks().length,
            videoTracks: remoteStream.getVideoTracks().length,
            audioTracks: remoteStream.getAudioTracks().length,
            active: remoteStream.active
          });
          
          // Force enable all tracks with proper mobile settings
          remoteStream.getTracks().forEach((track, i) => {
            console.log(`[VIDEO STREAM] Track ${i}: ${track.kind}, enabled=${track.enabled}, readyState=${track.readyState}`);
            track.enabled = true;
            
            // Apply mobile-specific video track settings
            if (track.kind === 'video') {
              const videoTrack = track as MediaStreamTrack;
              // Ensure video track is not muted
              if (videoTrack.muted) {
                console.log('[VIDEO STREAM] WARNING: Video track is muted - this prevents display');
              }
            }
          });
          
          // IMMEDIATE mobile-compatible assignment
          video.srcObject = remoteStream;
          video.muted = true; // Audio muted, not video
          video.playsInline = true;
          video.autoplay = false; // Let user interaction handle play
          video.controls = false; // We'll use custom play button
          
          // Mobile Safari specific attributes
          video.setAttribute('playsinline', '');
          video.setAttribute('webkit-playsinline', '');
          video.setAttribute('x-webkit-airplay', 'deny');
          
          // Force video element to be ready for mobile interaction
          video.load();
          
          console.log('[VIDEO STREAM] Video element configured for mobile - ready for user interaction');
        }
      } else {
        console.error('[WebRTC] No remote streams received in ontrack event');
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
      console.log('[WebRTC] Connection state changed:', pc.connectionState);
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
      console.log('[WebRTC] Signaling state:', pc.signalingState);
      
      if (pc.connectionState === 'connected') {
        setIsInCall(true);
        console.log('[WebRTC] Peer connection established successfully');
        
        // Enhanced remote video configuration when connection is established
        setTimeout(() => {
          if (remoteStream && remoteVideoRef.current) {
            console.log('[WebRTC] Configuring remote video after connection established');
            console.log('[WebRTC] Remote stream tracks:', remoteStream.getTracks().map(t => ({
              kind: t.kind,
              enabled: t.enabled,
              readyState: t.readyState,
              label: t.label
            })));
            
            remoteVideoRef.current.srcObject = remoteStream;
            
            // Enhanced video element configuration
            remoteVideoRef.current.autoplay = true;
            remoteVideoRef.current.playsInline = true;
            remoteVideoRef.current.setAttribute('webkit-playsinline', 'true');
            remoteVideoRef.current.setAttribute('playsinline', 'true');
            remoteVideoRef.current.style.objectFit = 'cover';
            remoteVideoRef.current.style.width = '100%';
            remoteVideoRef.current.style.height = '100%';
            
            remoteVideoRef.current.play()
              .then(() => console.log('[WebRTC] Remote video playing successfully'))
              .catch(e => console.error('[WebRTC] Remote video play failed:', e));
          } else {
            console.error('[WebRTC] No remote stream available when connection established');
            console.log('[WebRTC] Current remote stream:', remoteStream);
            console.log('[WebRTC] Remote video ref:', remoteVideoRef.current);
          }
        }, 1000);
        
        toast({
          title: "Video call connected!",
          description: "You are now in a video call with a stranger"
        });
      } else if (pc.connectionState === 'failed') {
        console.error('[WebRTC] Connection failed');
        toast({
          title: "Connection failed",
          description: "Unable to establish video call",
          variant: "destructive"
        });
      } else if (pc.connectionState === 'disconnected') {
        console.warn('[WebRTC] Connection disconnected');
      } else if (pc.connectionState === 'closed') {
        console.log('[WebRTC] Connection closed');
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log('[WebRTC] ICE gathering state:', pc.iceGatheringState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
      console.log('[WebRTC] Connection state:', pc.connectionState);
      console.log('[WebRTC] Signaling state:', pc.signalingState);
      
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        console.log('[WebRTC] ICE connection established successfully');
        
        // Set video call as active when ICE is connected
        setIsInCall(true);
        console.log('[WebRTC] Video call state set to active');
        
        // Force remote video configuration when ICE is connected
        setTimeout(() => {
          if (remoteStream && remoteVideoRef.current) {
            console.log('[WebRTC] ICE connected - ensuring remote video plays');
            if (!remoteVideoRef.current.srcObject) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
            remoteVideoRef.current.play()
              .then(() => console.log('[WebRTC] Remote video playing after ICE connection'))
              .catch(e => console.error('[WebRTC] Remote video play failed after ICE:', e));
          }
        }, 500);
      } else if (pc.iceConnectionState === 'failed') {
        console.error('[WebRTC] ICE connection failed');
        toast({
          title: "Connection issues",
          description: "Having trouble connecting to peer",
          variant: "destructive"
        });
      } else if (pc.iceConnectionState === 'disconnected') {
        console.warn('[WebRTC] ICE connection disconnected');
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
        break;
        
      case 'registration_confirmed':
        console.log('[WebSocket] Registration confirmed');
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
        
        // Initialize peer connection and start video call with proper timing
        setTimeout(async () => {
          try {
            console.log('[WebRTC] Starting video call for found peer');
            
            // Create peer connection
            const peerConnection = initializePeerConnection();
            setRtcPeerConnection(peerConnection);
            
            // Get media stream
            const stream = await startVideoCall();
            
            if (peerConnection && stream) {
              // Add tracks to peer connection
              stream.getTracks().forEach((track: MediaStreamTrack) => {
                peerConnection.addTrack(track, stream);
                console.log(`[WebRTC] Added ${track.kind} track to peer connection`);
              });
              
              // Create and send offer
              const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
              });
              await peerConnection.setLocalDescription(offer);
              
              wsRef.current?.send(JSON.stringify({
                type: 'offer',
                data: offer
              }));
              console.log('[WebRTC] Offer sent successfully with media tracks');
            }
          } catch (error) {
            console.error('[WebRTC] Error starting video call:', error);
            toast({
              title: "Camera access failed",
              description: "Please allow camera access and try again",
              variant: "destructive"
            });
          }
        }, 300);
        
        const locationText = data.peerLocation ? 
          ` from ${data.peerLocation.city}, ${data.peerLocation.country}` : '';
        toast({
          title: "Connected to stranger!",
          description: `Video chat starting${locationText}...`
        });
        break;
        
      case 'offer':
        if (data.data) {
          try {
            console.log('[WebRTC] Received offer from peer:', data.data);
            
            // Create new peer connection if none exists
            if (!rtcPeerConnection) {
              console.log('[WebRTC] Creating peer connection for incoming offer');
              const pc = initializePeerConnection();
              setRtcPeerConnection(pc);
              
              // Set remote description first
              await pc.setRemoteDescription(data.data);
              
              // Get local media stream
              const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: hasAudioAccess || audioTrialTimeLeft > 0
              });
              setLocalStream(stream);
              
              // Configure local video
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.play().catch(e => console.log('[Video] Local video play issue:', e));
              }
              
              // Add all tracks to peer connection
              stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
                console.log(`[WebRTC] Added ${track.kind} track to peer connection`);
              });
              
              // Create and send answer
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              
              wsRef.current?.send(JSON.stringify({
                type: 'answer',
                data: answer
              }));
              
              console.log('[WebRTC] Answer sent successfully with', stream.getTracks().length, 'media tracks');
            } else {
              // Use existing peer connection
              await rtcPeerConnection.setRemoteDescription(data.data);
              
              // Ensure we have local tracks
              if (localStream) {
                localStream.getTracks().forEach(track => {
                  const sender = rtcPeerConnection.getSenders().find(s => s.track === track);
                  if (!sender) {
                    rtcPeerConnection.addTrack(track, localStream);
                    console.log(`[WebRTC] Added existing ${track.kind} track`);
                  }
                });
              }
              
              // Create and send answer
              const answer = await rtcPeerConnection.createAnswer();
              await rtcPeerConnection.setLocalDescription(answer);
              
              wsRef.current?.send(JSON.stringify({
                type: 'answer',
                data: answer
              }));
              
              console.log('[WebRTC] Answer sent with existing connection');
            }
          } catch (error) {
            console.error('[WebRTC] Error handling offer:', error);
          }
        }
        break;
        
      case 'answer':
        if (rtcPeerConnection && data.data) {
          try {
            console.log('[WebRTC] Received answer from peer:', data.data);
            await rtcPeerConnection.setRemoteDescription(data.data);
            console.log('[WebRTC] Answer processed successfully - peer connection established');
            
            // Verify connection state
            console.log('[WebRTC] Connection state:', rtcPeerConnection.connectionState);
            console.log('[WebRTC] ICE connection state:', rtcPeerConnection.iceConnectionState);
            
            // Ensure we have local stream for the connection
            if (localStream) {
              localStream.getTracks().forEach(track => {
                const sender = rtcPeerConnection.getSenders().find(s => s.track === track);
                if (!sender) {
                  console.log('[WebRTC] Adding missing track after answer:', track.kind);
                  rtcPeerConnection.addTrack(track, localStream);
                }
              });
            }
          } catch (error) {
            console.error('[WebRTC] Error handling answer:', error);
          }
        }
        break;
        
      case 'ice-candidate':
        if (rtcPeerConnection && data.data) {
          try {
            console.log('[WebRTC] Received ICE candidate:', data.data);
            
            // Check if remote description is set before adding ICE candidate
            if (rtcPeerConnection.remoteDescription) {
              await rtcPeerConnection.addIceCandidate(data.data);
              console.log('[WebRTC] ICE candidate added successfully');
            } else {
              console.log('[WebRTC] Delaying ICE candidate - no remote description yet');
              // Add candidate after a short delay to allow remote description to be set
              setTimeout(async () => {
                try {
                  if (rtcPeerConnection && rtcPeerConnection.remoteDescription) {
                    await rtcPeerConnection.addIceCandidate(data.data);
                    console.log('[WebRTC] Delayed ICE candidate added successfully');
                  }
                } catch (delayedError) {
                  console.error('[WebRTC] Error adding delayed ICE candidate:', delayedError);
                }
              }, 100);
            }
          } catch (error) {
            console.error('[WebRTC] Error adding ICE candidate:', error);
          }
        }
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
    }
  };

  const requestPermissions = async () => {
    try {
      // Mobile-optimized constraints for iOS and Android compatibility
      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[Mobile Permissions] Stream obtained with tracks:', stream.getTracks().length);
      
      // Verify tracks are working on mobile
      stream.getTracks().forEach(track => {
        console.log(`[Mobile Permissions] ${track.kind} track: enabled=${track.enabled}, readyState=${track.readyState}`);
        track.stop();
      });
      
      await checkPermissions();
      toast({
        title: "Permissions granted!",
        description: "Camera and microphone access granted"
      });
    } catch (error) {
      console.error('[Mobile Permissions] Error requesting permissions:', error);
      toast({
        title: "Permission denied",
        description: "Please allow camera and microphone access to use video chat",
        variant: "destructive"
      });
    }
  };

  const startVideoCall = async (): Promise<MediaStream | null> => {
    try {
      // Mobile-optimized constraints for iOS and Android compatibility
      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      };

      console.log('[Mobile WebRTC] Requesting stream with mobile-optimized constraints');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Log stream details for mobile debugging
      console.log('[Mobile WebRTC] Stream obtained:', {
        id: stream.id,
        active: stream.active,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });
      
      // Verify tracks on mobile
      stream.getTracks().forEach(track => {
        console.log(`[Mobile WebRTC] Track: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}, label: ${track.label}`);
      });
      
      // Mobile-specific track verification
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      if (videoTrack) {
        console.log('[Mobile WebRTC] Video track settings:', videoTrack.getSettings());
      }
      if (audioTrack) {
        console.log('[Mobile WebRTC] Audio track settings:', audioTrack.getSettings());
      }
      
      setLocalStream(stream);
      setIsVideoEnabled(true);
      
      // Handle audio trial logic - start trial immediately if no TAS
      if (hasAudioAccess) {
        setIsAudioEnabled(true);
        console.log('[Audio] User has TAS tokens - audio enabled');
      } else if (!audioTrialUsed) {
        setIsAudioEnabled(true);
        setAudioTrialUsed(true);
        setAudioTrialTimeLeft(20);
        
        console.log('[Audio] Starting 20-second audio trial');
        toast({
          title: "Audio trial started",
          description: "You have 20 seconds of free audio. Add TAS tokens for unlimited audio.",
        });
        
        audioTrialTimerRef.current = setInterval(() => {
          setAudioTrialTimeLeft(prev => {
            const newTime = prev - 1;
            console.log(`[Audio Trial] ${newTime} seconds remaining`);
            
            if (newTime <= 0) {
              // Disable audio tracks immediately
              stream.getAudioTracks().forEach(track => {
                track.enabled = false;
                console.log('[Audio Trial] Disabled audio track:', track.id);
              });
              setIsAudioEnabled(false);
              toast({
                title: "Audio trial ended",
                description: "Add TAS tokens to continue using audio",
                variant: "destructive"
              });
              if (audioTrialTimerRef.current) {
                clearInterval(audioTrialTimerRef.current);
                audioTrialTimerRef.current = null;
              }
              return 0;
            }
            return newTime;
          });
        }, 1000);
      } else {
        // Trial already used, disable audio immediately
        stream.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
        setIsAudioEnabled(false);
        console.log('[Audio] Trial already used, audio disabled');
      }

      // Configure local video element with enhanced cross-platform settings
      if (localVideoRef.current) {
        console.log('[WebRTC] Configuring local video element');
        localVideoRef.current.srcObject = stream;
        
        // Enhanced video element attributes for all platforms
        localVideoRef.current.autoplay = true;
        localVideoRef.current.playsInline = true;
        localVideoRef.current.muted = true; // Local video should always be muted
        
        // Cross-platform video attributes
        localVideoRef.current.setAttribute('webkit-playsinline', 'true');
        localVideoRef.current.setAttribute('playsinline', 'true');
        localVideoRef.current.setAttribute('controls', 'false');
        
        // Enhanced styling for proper display
        localVideoRef.current.style.objectFit = 'cover';
        localVideoRef.current.style.width = '100%';
        localVideoRef.current.style.height = '100%';
        localVideoRef.current.style.backgroundColor = '#000';
        localVideoRef.current.style.transform = 'scaleX(-1)'; // Mirror effect for local video
        
        // Force load and play
        localVideoRef.current.load();
        
        try {
          await localVideoRef.current.play();
          console.log('[WebRTC] Local video playing successfully');
        } catch (error) {
          console.error('[WebRTC] Local video play failed:', error);
          // Local video play failure is less critical, continue anyway
        }
      }

      // Initialize peer connection and add tracks for mobile
      if (!rtcPeerConnection) {
        console.log('[Mobile WebRTC] Creating new peer connection for mobile video call');
        const pc = initializePeerConnection();
        setRtcPeerConnection(pc);
        
        // Add all tracks to new peer connection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
          console.log(`[Mobile WebRTC] Added ${track.kind} track to new peer connection:`, track.enabled);
        });
      } else {
        // Update existing peer connection for mobile
        console.log('[Mobile WebRTC] Updating existing peer connection for mobile');
        
        // Remove old tracks
        rtcPeerConnection.getSenders().forEach(sender => {
          if (sender.track) {
            rtcPeerConnection.removeTrack(sender);
            console.log(`[Mobile WebRTC] Removed ${sender.track.kind} track from peer connection`);
          }
        });
        
        // Add new tracks
        stream.getTracks().forEach(track => {
          rtcPeerConnection.addTrack(track, stream);
          console.log(`[Mobile WebRTC] Added ${track.kind} track to existing peer connection:`, track.enabled);
        });

        // Create offer for mobile with optimized settings
        if (rtcPeerConnection.signalingState === 'stable') {
          try {
            const offer = await rtcPeerConnection.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true
            });
            await rtcPeerConnection.setLocalDescription(offer);
            
            wsRef.current?.send(JSON.stringify({
              type: 'offer',
              data: offer
            }));
            console.log('[Mobile WebRTC] Mobile-optimized offer sent with tracks:', stream.getTracks().length);
          } catch (error) {
            console.error('[Mobile WebRTC] Error creating mobile offer:', error);
          }
        }
      }

      // Notify peer about video call start
      wsRef.current?.send(JSON.stringify({
        type: 'video_call_start',
        hasAudio: hasAudioAccess || !audioTrialUsed
      }));

      console.log('[WebRTC] Video call started with audio:', hasAudioAccess || !audioTrialUsed);
      return stream;
    } catch (error) {
      console.error('[WebRTC] Error starting video call:', error);
      toast({
        title: "Camera access required",
        description: "Please allow camera and microphone access to start video chat",
        variant: "destructive"
      });
      return null;
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

          {/* WebRTC Debug Info */}
          {(process.env.NODE_ENV === 'development' || isConnectedToPeer) && (
            <Card className="mb-4">
              <CardContent className="p-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <p className="font-semibold">Connection</p>
                    <p className={isConnectedToPeer ? "text-green-600" : "text-gray-500"}>
                      {isConnectedToPeer ? "Connected" : "Disconnected"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Video Call</p>
                    <p className={isInCall ? "text-green-600" : "text-gray-500"}>
                      {isInCall ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Local Stream</p>
                    <p className={localStream ? "text-green-600" : "text-red-500"}>
                      {localStream ? `${localStream.getTracks().length} tracks` : "None"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Remote Stream</p>
                    <p className={remoteStream ? "text-green-600" : "text-red-500"}>
                      {remoteStream ? `${remoteStream.getTracks().length} tracks` : "None"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Video Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-96">
            {/* Remote Video */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-0 h-full">
                <video
                  ref={remoteVideoRef}
                  playsInline
                  muted
                  controls
                  className="w-full h-full object-cover bg-red-500"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    background: '#ff0000',
                    border: '3px solid #00ff00'
                  }}
                  onPlay={() => console.log('[VIDEO] Remote video playing')}
                  onError={(e) => console.error('[VIDEO] Remote video error:', e)}
                  onLoadedData={() => console.log('[VIDEO] Remote video data loaded')}
                  onClick={() => {
                    console.log('[VIDEO] Remote video clicked');
                    if (remoteVideoRef.current) {
                      remoteVideoRef.current.play().catch(e => console.log('[VIDEO] Manual play failed:', e));
                    }
                  }}
                />
                
                {/* Large Play Button Overlay for Mobile Safari */}
                {remoteStream && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 cursor-pointer z-50"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('[MOBILE PLAY] User tapped play button');
                      const video = remoteVideoRef.current;
                      if (video && remoteStream) {
                        try {
                          // CRITICAL: Ensure stream tracks are active
                          const videoTracks = remoteStream.getVideoTracks();
                          const audioTracks = remoteStream.getAudioTracks();
                          
                          console.log('[MOBILE PLAY] Stream status before play:', {
                            streamActive: remoteStream.active,
                            videoTracks: videoTracks.length,
                            audioTracks: audioTracks.length,
                            videoEnabled: videoTracks.map(t => t.enabled),
                            videoMuted: videoTracks.map(t => t.muted),
                            videoReadyState: videoTracks.map(t => t.readyState)
                          });
                          
                          // Force all tracks to be enabled and unmuted
                          videoTracks.forEach(track => {
                            track.enabled = true;
                            console.log(`[MOBILE PLAY] Video track: enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`);
                          });
                          
                          audioTracks.forEach(track => {
                            track.enabled = true;
                            console.log(`[MOBILE PLAY] Audio track: enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`);
                          });
                          
                          // Reassign stream to ensure fresh connection
                          video.srcObject = null;
                          video.srcObject = remoteStream;
                          video.muted = true; // Mute audio, not video
                          video.playsInline = true;
                          
                          // Force load the new stream
                          video.load();
                          
                          // Wait for video element to be ready
                          await new Promise((resolve) => {
                            const checkReady = () => {
                              if (video.readyState >= 2) { // HAVE_CURRENT_DATA
                                resolve(undefined);
                              } else {
                                setTimeout(checkReady, 50);
                              }
                            };
                            checkReady();
                          });
                          
                          // Force play
                          await video.play();
                          console.log('[MOBILE PLAY] SUCCESS - Video is playing!');
                          
                          // Hide overlay
                          const overlay = e.currentTarget as HTMLElement;
                          overlay.style.display = 'none';
                          
                        } catch (e) {
                          console.log('[MOBILE PLAY] Play failed:', e);
                          // Show native controls as fallback
                          video.controls = true;
                        }
                      }
                    }}
                  >
                    <div className="text-center text-white">
                      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-lg font-bold">TAP TO PLAY VIDEO</p>
                      <p className="text-sm opacity-75">Video stream ready</p>
                    </div>
                  </div>
                )}
                
                {!remoteStream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                    <div className="text-center">
                      <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm opacity-75">
                        {isConnectedToPeer ? (
                          isInCall ? "Connecting video stream..." : "Waiting for stranger's video..."
                        ) : "No video call active"}
                      </p>
                      {isConnectedToPeer && !remoteStream && isInCall && (
                        <p className="text-xs mt-2 opacity-50">
                          Check if stranger has camera permissions enabled
                        </p>
                      )}
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
                      {isConnectedToPeer && (
                        <p className="text-xs mt-2 opacity-50">
                          Camera permission needed to start video
                        </p>
                      )}
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
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-900'
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

export default TradeNTalkFinal;