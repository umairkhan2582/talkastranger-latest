import { useState, useEffect, useRef } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Search, 
  Users,
  Phone,
  PhoneOff
} from "lucide-react";

export default function VideoChat() {
  const { isConnected, address, openConnectModal } = useWallet();
  const { toast } = useToast();
  
  // WebSocket and connection states
  const [isSearching, setIsSearching] = useState(false);
  const [isConnectedToPeer, setIsConnectedToPeer] = useState(false);
  const [connectedPeer, setConnectedPeer] = useState<string | null>(null);
  const [searchingCount, setSearchingCount] = useState(0);
  
  // Media states
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isConnected || !address) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[VideoChat] WebSocket connected');
      ws.send(JSON.stringify({
        type: 'register',
        walletAddress: address
      }));
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('[VideoChat] Received:', data.type);

      switch (data.type) {
        case 'searching_count':
          setSearchingCount(data.count || 0);
          break;

        case 'matched':
          console.log('[VideoChat] Matched with peer:', data.peer);
          setConnectedPeer(data.peer);
          setIsConnectedToPeer(true);
          setIsSearching(false);
          
          toast({
            title: "Connected!",
            description: "Found someone to chat with"
          });
          
          // Start video call automatically
          await startVideoCall();
          break;

        case 'peer_disconnected':
          console.log('[VideoChat] Peer disconnected');
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
      console.log('[VideoChat] WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('[VideoChat] WebSocket error:', error);
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
      console.log('[VideoChat] Received remote stream');
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
        audio: true
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(console.error);
      }
      
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
      console.log('[VideoChat] Media obtained');
      return stream;
    } catch (error) {
      console.error('[VideoChat] Media error:', error);
      throw error;
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
      
      console.log('[VideoChat] Answer sent');
    } catch (error) {
      console.error('[VideoChat] Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer);
        console.log('[VideoChat] Answer processed');
      }
    } catch (error) {
      console.error('[VideoChat] Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
        console.log('[VideoChat] ICE candidate added');
      }
    } catch (error) {
      console.error('[VideoChat] Error adding ICE candidate:', error);
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
      
      console.log('[VideoChat] Offer sent');
    } catch (error) {
      console.error('[VideoChat] Error starting video call:', error);
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
    
    wsRef.current.send(JSON.stringify({
      type: 'search',
      walletAddress: address
    }));
    
    console.log('[VideoChat] Starting search');
    
    toast({
      title: "Searching...",
      description: "Looking for someone to video chat with"
    });
  };

  const stopSearching = () => {
    if (!wsRef.current) return;
    
    setIsSearching(false);
    
    wsRef.current.send(JSON.stringify({
      type: 'stop_search'
    }));
    
    console.log('[VideoChat] Stopped searching');
  };

  const disconnect = () => {
    if (!wsRef.current) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'disconnect'
    }));
    
    handlePeerDisconnect();
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
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Video Chat</h1>
          <p className="text-gray-600 mt-1">Connect with strangers via video chat</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {searchingCount > 0 && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Users className="w-4 h-4 mr-1" />
              {searchingCount} searching
            </Badge>
          )}
        </div>
      </div>

      <Card className="h-[600px]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Video Chat</span>
            <div className="flex items-center space-x-2">
              {!isConnectedToPeer ? (
                isSearching ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={stopSearching}
                  >
                    <PhoneOff className="h-4 w-4 mr-2" />
                    Stop Search
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={startSearching}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Start Chat
                  </Button>
                )
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAudio}
                  >
                    {isAudioEnabled ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={disconnect}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
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
              {!isVideoEnabled && localStream && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoOff className="h-12 w-12 text-gray-400" />
                </div>
              )}
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
                      <p>Searching for someone...</p>
                      {searchingCount > 0 && (
                        <p className="text-sm text-gray-300 mt-1">{searchingCount} people searching</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Click "Start Chat" to begin</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}