import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';

export default function SimpleVideoChat() {
  const { address } = useWallet();
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasMedia, setHasMedia] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState('new');
  const [searchingUsers, setSearchingUsers] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!address) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[SimpleVideo] WebSocket connected');
      ws.send(JSON.stringify({ type: 'register', walletAddress: address }));
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('[SimpleVideo] Received:', data.type);

      switch (data.type) {
        case 'searching_count':
          setSearchingUsers(data.count || 0);
          if (data.count === 1) {
            setStatusMessage('You are the only person searching. Open another tab to test the connection.');
          } else if (data.count > 1) {
            setStatusMessage('Looking for a match...');
          }
          break;
          
        case 'matched':
          console.log('[SimpleVideo] Matched with peer');
          setIsSearching(false);
          setIsConnected(true);
          setStatusMessage('Connected! Starting video call...');
          
          // Start call if we're the initiator (lower wallet address)
          if (address && address.toLowerCase() < data.peerAddress.toLowerCase()) {
            setTimeout(() => initiateCall(), 1000);
          }
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
          
        case 'peer-disconnected':
          handlePeerDisconnection();
          break;
      }
    };

    ws.onclose = () => {
      console.log('[SimpleVideo] WebSocket disconnected');
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          // Reconnect
        }
      }, 3000);
    };

    return () => {
      ws.close();
    };
  }, [address]);

  // Get user media
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
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Ensure local video is muted to prevent feedback
        localVideoRef.current.play().catch(console.error);
      }
      
      setHasMedia(true);
      console.log('[SimpleVideo] Media obtained');
      return stream;
    } catch (error) {
      console.error('[SimpleVideo] Media error:', error);
      throw error;
    }
  };

  // Create peer connection
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
      console.log('[SimpleVideo] Remote track received:', event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      console.log('[SimpleVideo] Connection state:', pc.connectionState);
    };

    return pc;
  };

  // Initiate call
  const initiateCall = async () => {
    try {
      console.log('[SimpleVideo] Initiating call');
      
      if (!localStreamRef.current) {
        await getUserMedia();
      }

      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      // Add local stream tracks
      localStreamRef.current!.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      wsRef.current?.send(JSON.stringify({
        type: 'offer',
        offer: offer
      }));

      console.log('[SimpleVideo] Offer sent');
    } catch (error) {
      console.error('[SimpleVideo] Call initiation failed:', error);
    }
  };

  // Handle incoming offer
  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      console.log('[SimpleVideo] Handling offer');
      
      if (!localStreamRef.current) {
        await getUserMedia();
      }

      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      // Add local stream tracks
      localStreamRef.current!.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });

      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      wsRef.current?.send(JSON.stringify({
        type: 'answer',
        answer: answer
      }));

      console.log('[SimpleVideo] Answer sent');
    } catch (error) {
      console.error('[SimpleVideo] Offer handling failed:', error);
    }
  };

  // Handle answer
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      console.log('[SimpleVideo] Handling answer');
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer);
      }
    } catch (error) {
      console.error('[SimpleVideo] Answer handling failed:', error);
    }
  };

  // Handle ICE candidate
  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('[SimpleVideo] ICE candidate failed:', error);
    }
  };

  // Handle peer disconnection
  const handlePeerDisconnection = () => {
    setIsConnected(false);
    setConnectionState('closed');
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  // Start searching for strangers
  const startSearch = () => {
    if (!hasMedia) {
      getUserMedia().then(() => {
        setIsSearching(true);
        wsRef.current?.send(JSON.stringify({ 
          type: 'search',
          filters: {},
          location: null,
          tasBalance: 0,
          hasAdvancedFilters: false
        }));
      }).catch(console.error);
    } else {
      setIsSearching(true);
      wsRef.current?.send(JSON.stringify({ 
        type: 'search',
        filters: {},
        location: null,
        tasBalance: 0,
        hasAdvancedFilters: false
      }));
    }
  };

  // End call
  const endCall = () => {
    setIsConnected(false);
    setIsSearching(false);
    setConnectionState('closed');
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    wsRef.current?.send(JSON.stringify({ type: 'disconnect' }));
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Simple Video Chat</h1>
        <p className="text-muted-foreground">Connect with strangers via video chat</p>
      </div>

      {/* Status */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant={hasMedia ? "default" : "secondary"}>
          {hasMedia ? "Media Ready" : "No Media"}
        </Badge>
        <Badge variant={isConnected ? "default" : "secondary"}>
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
        <Badge variant="outline">
          Connection: {connectionState}
        </Badge>
        {isSearching && (
          <Badge variant="outline">
            Searching users: {searchingUsers}
          </Badge>
        )}
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">{statusMessage}</p>
          {statusMessage.includes('Open another tab') && (
            <p className="text-xs text-blue-600 mt-1">
              Tip: Open this page in a new tab or incognito window to simulate two users
            </p>
          )}
        </div>
      )}

      {/* Video Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
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
              className="w-full h-64 bg-black rounded-lg object-cover"
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
              className="w-full h-64 bg-black rounded-lg object-cover"
            />
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {!hasMedia && (
          <Button onClick={getUserMedia} variant="outline">
            Enable Camera & Mic
          </Button>
        )}
        
        {hasMedia && !isConnected && !isSearching && (
          <Button onClick={startSearch} className="bg-green-600 hover:bg-green-700">
            Find Stranger
          </Button>
        )}
        
        {isSearching && (
          <Button disabled>
            Searching...
          </Button>
        )}
        
        {isConnected && (
          <>
            <Button 
              onClick={toggleAudio} 
              variant={isAudioEnabled ? "default" : "destructive"}
              size="icon"
            >
              {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            
            <Button 
              onClick={toggleVideo} 
              variant={isVideoEnabled ? "default" : "destructive"}
              size="icon"
            >
              {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            
            <Button onClick={endCall} variant="destructive">
              <PhoneOff className="h-4 w-4 mr-2" />
              End Call
            </Button>
          </>
        )}
      </div>
    </div>
  );
}