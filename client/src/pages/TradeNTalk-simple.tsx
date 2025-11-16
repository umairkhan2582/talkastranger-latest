import { useState, useEffect, useRef } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Video, VideoOff, Mic, MicOff, Send, MessageCircle, Phone, PhoneOff } from "lucide-react";

interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'stranger';
  timestamp: Date;
}

export default function TradeNTalkSimple() {
  const { address: walletAddress, isConnected } = useWallet();
  const { toast } = useToast();
  
  // WebSocket and peer connection states
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnectedToPeer, setIsConnectedToPeer] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  
  // Media states
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize media stream
  const initializeMedia = async () => {
    try {
      console.log('[MEDIA] Getting user media...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Mute own audio to prevent feedback
        console.log('[MEDIA] Local video stream assigned');
      }
      
      return stream;
    } catch (error) {
      console.error('[MEDIA] Error accessing media devices:', error);
      toast({
        title: "Media Access Error",
        description: "Could not access camera and microphone. Please enable permissions.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Create peer connection
  const createPeerConnection = (stream: MediaStream) => {
    console.log('[WebRTC] Creating peer connection');
    
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };
    
    const pc = new RTCPeerConnection(configuration);
    
    // Add local stream tracks
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
      console.log(`[WebRTC] Added ${track.kind} track to peer connection`);
    });
    
    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      const [remoteStream] = event.streams;
      
      if (remoteStream) {
        console.log('[WebRTC] Setting remote stream');
        setRemoteStream(remoteStream);
        setIsInCall(true);
        
        // Assign to video element
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.muted = false; // Allow remote audio
          
          // Force play for mobile
          setTimeout(() => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.play().catch(e => {
                console.log('[WebRTC] Auto-play failed, will require user interaction');
                // Show play controls
                remoteVideoRef.current!.controls = true;
              });
            }
          }, 100);
        }
      }
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && ws) {
        console.log('[WebRTC] Sending ICE candidate');
        ws.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          walletAddress
        }));
      }
    };
    
    // Connection state logging
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnectedToPeer(false);
        setIsInCall(false);
        setRemoteStream(null);
      }
    };
    
    return pc;
  };

  // WebSocket connection
  useEffect(() => {
    if (!isConnected || !walletAddress) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('[WebSocket] Connected');
      setWs(websocket);
      
      // Register with wallet address
      websocket.send(JSON.stringify({
        type: 'register',
        walletAddress
      }));
    };
    
    websocket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('[WebSocket] Received:', data.type);
      
      switch (data.type) {
        case 'online_count':
          console.log('[WebSocket] Online users:', data.count);
          setOnlineUsers(data.count);
          break;
          
        case 'peer_found':
          console.log('[WebSocket] Peer found, connecting...');
          setIsConnectedToPeer(true);
          setIsSearching(false);
          
          // Initialize media and create peer connection
          const matchStream = await initializeMedia();
          if (matchStream) {
            const pc = createPeerConnection(matchStream);
            peerConnectionRef.current = pc;
            
            // Create and send offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            websocket.send(JSON.stringify({
              type: 'offer',
              offer,
              walletAddress
            }));
          }
          break;
          
        case 'offer':
          console.log('[WebSocket] Received offer');
          const offerStream = await initializeMedia();
          if (offerStream) {
            const pc = createPeerConnection(offerStream);
            peerConnectionRef.current = pc;
            
            await pc.setRemoteDescription(data.offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            websocket.send(JSON.stringify({
              type: 'answer',
              answer,
              walletAddress
            }));
          }
          break;
          
        case 'answer':
          console.log('[WebSocket] Received answer');
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(data.answer);
          }
          break;
          
        case 'ice-candidate':
          console.log('[WebSocket] Received ICE candidate');
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(data.candidate);
          }
          break;
          
        case 'chat-message':
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: data.message,
            sender: 'stranger',
            timestamp: new Date()
          }]);
          break;
          
        case 'peer-disconnected':
          console.log('[WebSocket] Peer disconnected');
          setIsConnectedToPeer(false);
          setIsInCall(false);
          setRemoteStream(null);
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
          }
          break;
      }
    };
    
    websocket.onclose = () => {
      console.log('[WebSocket] Disconnected');
      setWs(null);
      setIsConnectedToPeer(false);
      setIsSearching(false);
    };
    
    setWs(websocket);
    
    return () => {
      websocket.close();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isConnected, walletAddress]);

  // Start searching for a peer
  const startSearch = () => {
    if (!ws) return;
    
    setIsSearching(true);
    ws.send(JSON.stringify({
      type: 'search',
      filters: {
        country: '',
        city: '',
        area: '',
        ageRange: { min: 18, max: 65 },
        interests: [],
        language: 'any',
        gender: 'any'
      },
      userLocation: null,
      tasBalance: 0,
      hasAdvancedFilters: false
    }));
  };

  // Stop search
  const stopSearch = () => {
    if (!ws) return;
    
    setIsSearching(false);
    ws.send(JSON.stringify({
      type: 'stop_search',
      walletAddress
    }));
  };

  // End call
  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (ws) {
      ws.send(JSON.stringify({
        type: 'end-call',
        walletAddress
      }));
    }
    
    setIsConnectedToPeer(false);
    setIsInCall(false);
    setRemoteStream(null);
    setMessages([]);
  };

  // Toggle camera
  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  // Send chat message
  const sendMessage = () => {
    if (!currentMessage.trim() || !ws || !isConnectedToPeer) return;
    
    ws.send(JSON.stringify({
      type: 'chat-message',
      message: currentMessage,
      walletAddress
    }));
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: currentMessage,
      sender: 'me',
      timestamp: new Date()
    }]);
    
    setCurrentMessage("");
  };

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Manual play video (for mobile)
  const playRemoteVideo = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.play().catch(e => {
        console.log('[VIDEO] Manual play failed:', e);
      });
    }
  };

  if (!isConnected || !walletAddress) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
              <p className="text-gray-600">Please connect your wallet to use Trade N Talk</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-6 w-6" />
            Trade N Talk - Simple
            <Badge variant="outline">{onlineUsers} online</Badge>
            {isConnectedToPeer && <Badge variant="outline">Connected</Badge>}
            {isSearching && <Badge variant="secondary">Searching...</Badge>}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Control Panel */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center justify-center">
            {!isConnectedToPeer && !isSearching && (
              <Button onClick={startSearch} size="lg">
                <Phone className="h-4 w-4 mr-2" />
                Start Video Call
              </Button>
            )}
            
            {isSearching && (
              <Button onClick={stopSearch} variant="outline">
                Cancel Search
              </Button>
            )}
            
            {isConnectedToPeer && (
              <>
                <Button onClick={toggleCamera} variant={isCameraOn ? "default" : "destructive"}>
                  {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                
                <Button onClick={toggleMicrophone} variant={isMicOn ? "default" : "destructive"}>
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                
                <Button onClick={endCall} variant="destructive">
                  <PhoneOff className="h-4 w-4 mr-2" />
                  End Call
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Video Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Remote Video */}
        <Card className="aspect-video">
          <CardContent className="p-0 h-full relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover bg-gray-900"
            />
            
            {/* Play Button for Mobile */}
            {remoteStream && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 cursor-pointer"
                onClick={playRemoteVideo}
              >
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="font-bold">TAP TO PLAY</p>
                </div>
              </div>
            )}
            
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center">
                  <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm opacity-75">
                    {isConnectedToPeer ? "Waiting for video..." : "No video call active"}
                  </p>
                </div>
              </div>
            )}
            
            <div className="absolute top-2 left-2">
              <Badge variant="outline">Stranger</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Local Video */}
        <Card className="aspect-video">
          <CardContent className="p-0 h-full relative">
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
              <Badge variant="outline">You</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Section */}
      {isConnectedToPeer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Messages */}
            <div className="h-48 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      message.sender === 'me' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Send Message */}
            <div className="flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button onClick={sendMessage} disabled={!currentMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}