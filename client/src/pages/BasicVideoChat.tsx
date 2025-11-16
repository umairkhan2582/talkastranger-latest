import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BasicVideoChat() {
  const { address } = useWallet();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [hasMediaPermission, setHasMediaPermission] = useState(false);
  const [isGettingMedia, setIsGettingMedia] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Get user media
  const getUserMedia = async (): Promise<MediaStream> => {
    try {
      setIsGettingMedia(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      localStreamRef.current = stream;
      setHasMediaPermission(true);
      setIsGettingMedia(false);
      console.log('[BasicVideo] Media stream obtained');
      return stream;
    } catch (error) {
      console.error('[BasicVideo] Error getting user media:', error);
      setHasMediaPermission(false);
      setIsGettingMedia(false);
      throw error;
    }
  };

  // Request media permission
  const requestMediaPermission = async () => {
    try {
      await getUserMedia();
    } catch (error) {
      console.error('[BasicVideo] Failed to get media permission:', error);
    }
  };

  // Create peer connection
  const createPeerConnection = (): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Monitor connection states
    pc.onconnectionstatechange = () => {
      console.log('[BasicVideo] Connection state:', pc.connectionState);
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log('[BasicVideo] ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        console.log('[BasicVideo] *** ICE CONNECTION ESTABLISHED ***');
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && ws) {
        console.log('[BasicVideo] Sending ICE candidate:', event.candidate.type);
        ws.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate
        }));
      } else if (!event.candidate) {
        console.log('[BasicVideo] ICE gathering complete');
      }
    };

    pc.ontrack = (event) => {
      console.log('[BasicVideo] *** RECEIVED REMOTE TRACK ***', event.track.kind, 'streams:', event.streams.length);
      console.log('[BasicVideo] Track state:', event.track.readyState, 'enabled:', event.track.enabled);
      
      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];
        console.log('[BasicVideo] Remote stream tracks:', remoteStream.getTracks().map(t => t.kind));
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          console.log('[BasicVideo] *** REMOTE VIDEO SET ***');
          
          // Ensure video plays
          remoteVideoRef.current.play().then(() => {
            console.log('[BasicVideo] *** REMOTE VIDEO PLAYING ***');
          }).catch(e => {
            console.error('[BasicVideo] Remote video play failed:', e);
            // Try to enable autoplay
            remoteVideoRef.current!.muted = true;
            remoteVideoRef.current!.play();
          });
          
          // Add event listeners to track video state
          remoteVideoRef.current.onloadedmetadata = () => {
            console.log('[BasicVideo] Remote video metadata loaded');
          };
          remoteVideoRef.current.oncanplay = () => {
            console.log('[BasicVideo] Remote video can play');
          };
        }
      }
    };

    return pc;
  };

  // Handle offer (receiver)
  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      console.log('[BasicVideo] Handling offer from peer');
      
      // Ensure we have local stream first
      if (!localStreamRef.current) {
        console.log('[BasicVideo] Getting media for answer...');
        await getUserMedia();
      }
      
      if (!localStreamRef.current) {
        console.error('[BasicVideo] Failed to get local stream for answer');
        return;
      }
      
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;
      
      // Add local tracks to peer connection BEFORE setting remote description
      console.log('[BasicVideo] Adding local tracks for answer');
      localStreamRef.current.getTracks().forEach(track => {
        console.log('[BasicVideo] Adding track to answer:', track.kind);
        pc.addTrack(track, localStreamRef.current!);
      });

      // Set remote description first, then create answer
      await pc.setRemoteDescription(offer);
      console.log('[BasicVideo] Remote description set, creating answer');
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (ws) {
        ws.send(JSON.stringify({
          type: 'answer',
          answer: answer
        }));
        console.log('[BasicVideo] Answer sent to peer');
      }
    } catch (error) {
      console.error('[BasicVideo] Error handling offer:', error);
    }
  };

  // Handle answer
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      console.log('[BasicVideo] *** RECEIVED ANSWER ***');
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer);
        console.log('[BasicVideo] *** ANSWER SET - CONNECTION SHOULD BE ACTIVE ***');
        
        // Log connection state
        console.log('[BasicVideo] Connection state:', peerConnectionRef.current.connectionState);
        console.log('[BasicVideo] ICE connection state:', peerConnectionRef.current.iceConnectionState);
      }
    } catch (error) {
      console.error('[BasicVideo] Error handling answer:', error);
    }
  };

  // Handle ICE candidate
  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('[BasicVideo] Error handling ICE candidate:', error);
    }
  };

  // Start call (caller)
  const startCall = async () => {
    try {
      console.log('[BasicVideo] *** STARTING CALL AS INITIATOR ***');
      
      // Ensure we have local stream
      let stream = localStreamRef.current;
      if (!stream) {
        console.log('[BasicVideo] Getting media for initiator...');
        stream = await getUserMedia();
      }
      
      if (!stream) {
        console.error('[BasicVideo] No stream available for call');
        return;
      }
      
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;
      
      // Add local tracks to peer connection
      console.log('[BasicVideo] Adding tracks to offer:', stream.getTracks().length);
      stream.getTracks().forEach(track => {
        console.log('[BasicVideo] Adding track to offer:', track.kind, 'enabled:', track.enabled);
        pc.addTrack(track, stream);
      });

      console.log('[BasicVideo] Creating offer...');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);

      console.log('[BasicVideo] *** SENDING OFFER ***');
      if (ws) {
        ws.send(JSON.stringify({
          type: 'offer',
          offer: offer
        }));
      }

      console.log('[BasicVideo] Offer sent, waiting for answer...');
    } catch (error) {
      console.error('[BasicVideo] Error starting call:', error);
    }
  };

  // Check if we already have media permission on mount
  useEffect(() => {
    if (address && localStreamRef.current) {
      setHasMediaPermission(true);
    }
  }, [address]);

  // WebSocket connection
  useEffect(() => {
    if (!address) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('[BasicVideo] WebSocket connected');
      socket.send(JSON.stringify({
        type: 'chat_register',
        walletAddress: address
      }));
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('[BasicVideo] Received:', data.type);

      switch (data.type) {
        case 'chat_matched':
          setIsConnected(true);
          setIsSearching(false);
          console.log('[BasicVideo] Matched with peer:', data.peerWallet);
          console.log('[BasicVideo] My address:', address);
          console.log('[BasicVideo] Should I initiate?', address && data.peerWallet && address < data.peerWallet);
          
          // Only create offer if this user has smaller wallet address
          if (address && data.peerWallet && address < data.peerWallet) {
            console.log('[BasicVideo] I am initiating the call...');
            await startCall();
          } else {
            console.log('[BasicVideo] Waiting for peer to initiate call...');
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
          
        case 'chat_message':
          setMessages(prev => [...prev, `Stranger: ${data.message}`]);
          break;
      }
    };

    socket.onerror = (error) => {
      console.error('[BasicVideo] WebSocket error:', error);
    };

    setWs(socket);

    return () => {
      socket.close();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [address]);

  // Find stranger
  const findStranger = () => {
    if (!hasMediaPermission || !localStreamRef.current) {
      console.log('[BasicVideo] Media permission required before searching');
      return;
    }
    
    if (ws && !isSearching && !isConnected) {
      setIsSearching(true);
      ws.send(JSON.stringify({
        type: 'search',
        walletAddress: address
      }));
      console.log('[BasicVideo] Searching for stranger with wallet:', address);
    }
  };

  // Send message
  const sendMessage = () => {
    if (ws && newMessage.trim() && isConnected) {
      ws.send(JSON.stringify({
        type: 'chat_message',
        message: newMessage
      }));
      setMessages(prev => [...prev, `You: ${newMessage}`]);
      setNewMessage('');
    }
  };

  if (!address) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Basic Video Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please connect your wallet to start video chatting.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Video Section */}
        <Card>
          <CardHeader>
            <CardTitle>Video Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Local Video */}
              <div>
                <p className="text-sm font-medium mb-2">Your Video</p>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-48 bg-gray-900 rounded"
                />
              </div>

              {/* Remote Video */}
              <div>
                <p className="text-sm font-medium mb-2">Stranger's Video</p>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-48 bg-gray-900 rounded"
                />
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                {!hasMediaPermission ? (
                  <Button 
                    onClick={requestMediaPermission}
                    disabled={isGettingMedia}
                    className="flex-1"
                  >
                    {isGettingMedia ? 'Getting Camera...' : 'Enable Camera & Mic'}
                  </Button>
                ) : (
                  <Button 
                    onClick={findStranger}
                    disabled={isSearching || isConnected}
                    className="flex-1"
                  >
                    {isSearching ? 'Searching...' : isConnected ? 'Connected' : 'Find Stranger'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Section */}
        <Card>
          <CardHeader>
            <CardTitle>Text Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Messages */}
              <div className="h-64 overflow-y-auto border rounded p-2 bg-gray-50">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-sm">No messages yet...</p>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className="mb-1 text-sm">
                      {msg}
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={isConnected ? "Type a message..." : "Connect to chat"}
                  disabled={!isConnected}
                  className="flex-1 px-3 py-2 border rounded"
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!isConnected || !newMessage.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Status: {!hasMediaPermission ? 'Camera permission required' : 
                   isConnected ? 'Connected to stranger' : 
                   isSearching ? 'Searching for stranger...' : 
                   'Ready to connect'}
        </p>
        {hasMediaPermission && (
          <p className="text-xs text-green-600 mt-1">
            Camera and microphone enabled
          </p>
        )}
      </div>
    </div>
  );
}