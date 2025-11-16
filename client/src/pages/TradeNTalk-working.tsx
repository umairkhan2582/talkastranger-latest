import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/contexts/WalletContext';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users } from 'lucide-react';

interface PeerConnection {
  pc: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

export default function TradeNTalkWorking() {
  const { address } = useWallet();
  const walletAddress = address;
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnectedToPeer, setIsConnectedToPeer] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<PeerConnection>({
    pc: null,
    localStream: null,
    remoteStream: null
  });

  // Initialize WebSocket connection
  useEffect(() => {
    if (!walletAddress) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('[TradeNTalk] WebSocket connected');
      setConnectionStatus('Connected');
      setWs(websocket);
      
      // Register with server
      websocket.send(JSON.stringify({
        type: 'register',
        walletAddress
      }));
    };
    
    websocket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('[TradeNTalk] Received:', data.type);
      
      switch (data.type) {
        case 'online_count':
          setOnlineUsers(data.count);
          break;
          
        case 'searching':
          setConnectionStatus('Searching for stranger...');
          break;
          
        case 'peer_found':
          console.log('[TradeNTalk] Peer found!');
          setIsConnectedToPeer(true);
          setIsSearching(false);
          setConnectionStatus('Stranger found! Connecting...');
          await initializeVideo();
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
          
        case 'call_ended':
        case 'peer_disconnected':
          endCall();
          break;
      }
    };
    
    websocket.onclose = () => {
      console.log('[TradeNTalk] WebSocket disconnected');
      setConnectionStatus('Disconnected');
      setWs(null);
    };
    
    websocket.onerror = (error) => {
      console.error('[TradeNTalk] WebSocket error:', error);
      setConnectionStatus('Connection Error');
    };

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [walletAddress]);

  // Initialize video stream and peer connection
  const initializeVideo = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      peerConnectionRef.current.localStream = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      
      peerConnectionRef.current.pc = pc;
      
      // Add local stream tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('[TradeNTalk] Received remote stream');
        peerConnectionRef.current.remoteStream = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setConnectionStatus('Connected - Video Chat Active');
      };
      
      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && ws) {
          ws.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
            walletAddress
          }));
        }
      };
      
      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (ws) {
        ws.send(JSON.stringify({
          type: 'offer',
          offer: offer,
          walletAddress
        }));
      }
      
    } catch (error) {
      console.error('[TradeNTalk] Error accessing media:', error);
      setConnectionStatus('Camera/Microphone access denied');
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current.pc) {
      await initializeVideo();
    }
    
    const pc = peerConnectionRef.current.pc;
    if (pc) {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      if (ws) {
        ws.send(JSON.stringify({
          type: 'answer',
          answer: answer,
          walletAddress
        }));
      }
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionRef.current.pc;
    if (pc) {
      await pc.setRemoteDescription(answer);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current.pc;
    if (pc) {
      await pc.addIceCandidate(candidate);
    }
  };

  const startSearch = () => {
    if (!ws || !walletAddress) return;
    
    setIsSearching(true);
    setConnectionStatus('Searching...');
    
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

  const stopSearch = () => {
    if (!ws || !walletAddress) return;
    
    setIsSearching(false);
    setConnectionStatus('Connected');
    
    ws.send(JSON.stringify({
      type: 'stop_search',
      walletAddress
    }));
  };

  const endCall = () => {
    // Close peer connection
    if (peerConnectionRef.current.pc) {
      peerConnectionRef.current.pc.close();
      peerConnectionRef.current.pc = null;
    }
    
    // Stop local stream
    if (peerConnectionRef.current.localStream) {
      peerConnectionRef.current.localStream.getTracks().forEach(track => track.stop());
      peerConnectionRef.current.localStream = null;
    }
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    setIsConnectedToPeer(false);
    setIsSearching(false);
    setConnectionStatus('Connected');
    
    // Notify server
    if (ws) {
      ws.send(JSON.stringify({
        type: 'end_call',
        walletAddress
      }));
    }
  };

  const toggleVideo = () => {
    if (peerConnectionRef.current.localStream) {
      const videoTrack = peerConnectionRef.current.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (peerConnectionRef.current.localStream) {
      const audioTrack = peerConnectionRef.current.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please connect your wallet to use Trade N Talk.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Trade N Talk
          </h1>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {onlineUsers} Online
            </Badge>
            <Badge variant={connectionStatus === 'Connected' ? 'default' : 'secondary'}>
              {connectionStatus}
            </Badge>
          </div>
        </div>

        {/* Video Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Local Video */}
          <Card>
            <CardHeader>
              <CardTitle>Your Video</CardTitle>
            </CardHeader>
            <CardContent>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-64 bg-gray-900 rounded-lg object-cover"
              />
            </CardContent>
          </Card>

          {/* Remote Video */}
          <Card>
            <CardHeader>
              <CardTitle>Stranger's Video</CardTitle>
            </CardHeader>
            <CardContent>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-64 bg-gray-900 rounded-lg object-cover"
              />
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-4">
              {!isConnectedToPeer ? (
                <>
                  {!isSearching ? (
                    <Button onClick={startSearch} size="lg" className="px-8">
                      Find Stranger
                    </Button>
                  ) : (
                    <Button onClick={stopSearch} variant="outline" size="lg" className="px-8">
                      Stop Search
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={toggleVideo}
                    variant={videoEnabled ? "default" : "destructive"}
                    size="lg"
                  >
                    {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </Button>
                  
                  <Button
                    onClick={toggleAudio}
                    variant={audioEnabled ? "default" : "destructive"}
                    size="lg"
                  >
                    {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </Button>
                  
                  <Button onClick={endCall} variant="destructive" size="lg" className="px-8">
                    <PhoneOff className="w-5 h-5 mr-2" />
                    End Call
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">How to Use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Click "Find Stranger" to start searching for someone to chat with</li>
              <li>Allow camera and microphone access when prompted</li>
              <li>Wait for a stranger to be found and connected</li>
              <li>Enjoy your video chat! Use controls to toggle video/audio</li>
              <li>Click "End Call" when you're done</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}