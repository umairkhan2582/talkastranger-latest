import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, VideoOff, Mic, MicOff, Send, MessageCircle, Users, Shield, Globe, Heart } from "lucide-react";

import usaImg from "@assets/stock_images/united_states_flag_l_692be374.jpg";
import ukImg from "@assets/stock_images/united_kingdom_londo_d880e908.jpg";
import canadaImg from "@assets/stock_images/canada_flag_landmark_00f98674.jpg";
import germanyImg from "@assets/stock_images/germany_flag_landmar_d012ba2a.jpg";
import australiaImg from "@assets/stock_images/australia_flag_landm_9b8b6812.jpg";
import franceImg from "@assets/stock_images/france_paris_eiffel__1142a7a8.jpg";
import indiaImg from "@assets/stock_images/india_flag_landmarks_8e4a6cd7.jpg";
import brazilImg from "@assets/stock_images/brazil_flag_rio_de_j_9d532b2b.jpg";
import mexicoImg from "@assets/stock_images/mexico_flag_landmark_fed362ec.jpg";
import japanImg from "@assets/stock_images/japan_tokyo_flag_8ede2fa4.jpg";
import koreaImg from "@assets/stock_images/south_korea_seoul_fl_d9438289.jpg";
import italyImg from "@assets/stock_images/italy_rome_colosseum_2964ba20.jpg";

import newYorkImg from "@assets/stock_images/famous_landmarks_new_851762c5.jpg";
import londonImg from "@assets/stock_images/london_big_ben_uk_ci_9f1a078f.jpg";
import tokyoImg from "@assets/stock_images/tokyo_japan_skyline__ec5a6ad2.jpg";
import parisImg from "@assets/stock_images/paris_eiffel_tower_f_2cac551e.jpg";
import sydneyImg from "@assets/stock_images/sydney_opera_house_a_e8a6b46f.jpg";
import dubaiImg from "@assets/stock_images/dubai_skyline_city_u_5911445f.jpg";
import losAngelesImg from "@assets/stock_images/los_angeles_californ_1d223ed2.jpg";
import mumbaiImg from "@assets/stock_images/mumbai_india_city_sk_5a83ba02.jpg";
import torontoImg from "@assets/stock_images/toronto_canada_city_b88bcd47.jpg";
import singaporeImg from "@assets/stock_images/singapore_city_skyli_319fae3d.jpg";
import berlinImg from "@assets/stock_images/berlin_germany_city_72c10829.jpg";
import seoulImg from "@assets/stock_images/seoul_south_korea_ci_b652a60f.jpg";
import chicagoImg from "@assets/stock_images/chicago_skyline_city_81e6c643.jpg";
import miamiImg from "@assets/stock_images/miami_beach_florida__0833a301.jpg";
import lasVegasImg from "@assets/stock_images/las_vegas_strip_city_b8e67282.jpg";
import sanFranciscoImg from "@assets/stock_images/san_francisco_golden_cbbad76c.jpg";
import bostonImg from "@assets/stock_images/boston_city_skyline__32f163ef.jpg";
import houstonImg from "@assets/stock_images/houston_texas_city_s_41aa2f9d.jpg";
import atlantaImg from "@assets/stock_images/atlanta_georgia_city_c72516d1.jpg";
import seattleImg from "@assets/stock_images/seattle_skyline_spac_ee1c5423.jpg";
import manchesterImg from "@assets/stock_images/manchester_city_uk_e_5c908a57.jpg";
import amsterdamImg from "@assets/stock_images/amsterdam_canals_cit_19a44b35.jpg";
import barcelonaImg from "@assets/stock_images/barcelona_spain_city_2178156d.jpg";
import romeImg from "@assets/stock_images/rome_italy_colosseum_e45001f6.jpg";
import madridImg from "@assets/stock_images/madrid_spain_city_sk_c7124a0e.jpg";

import californiaImg from "@assets/stock_images/california_landscape_434d14ac.jpg";
import texasImg from "@assets/stock_images/texas_state_capitol__ee863838.jpg";
import floridaImg from "@assets/stock_images/florida_beach_palm_t_491493d2.jpg";
import newYorkStateImg from "@assets/stock_images/new_york_state_statu_9ec5e846.jpg";
import ontarioImg from "@assets/stock_images/ontario_canada_toron_37f03122.jpg";
import englandImg from "@assets/stock_images/england_uk_london_bi_9de0393a.jpg";
import scotlandImg from "@assets/stock_images/scotland_edinburgh_c_07686808.jpg";
import walesImg from "@assets/stock_images/wales_uk_dragon_cast_7ca3e159.jpg";
import bavariaImg from "@assets/stock_images/bavaria_germany_cast_50cebf79.jpg";
import cataloniaImg from "@assets/stock_images/catalonia_barcelona__b505c869.jpg";
import ileDeFranceImg from "@assets/stock_images/paris_france_eiffel__1fc1c26d.jpg";
import newSouthWalesImg from "@assets/stock_images/new_south_wales_sydn_a63ab410.jpg";
import queenslandImg from "@assets/stock_images/queensland_australia_5091ae00.jpg";
import tokyoRegionImg from "@assets/stock_images/tokyo_japan_region_s_c2e2e05f.jpg";
import osakaRegionImg from "@assets/stock_images/osaka_japan_region_c_4e798fa0.jpg";
import britishColumbiaImg from "@assets/stock_images/british_columbia_can_18f51cc3.jpg";
import quebecImg from "@assets/stock_images/quebec_canada_montre_2949edc4.jpg";
import albertaImg from "@assets/stock_images/alberta_canada_rocky_a1133bcd.jpg";
import maharashtraImg from "@assets/stock_images/maharashtra_india_mu_c6a51bf0.jpg";
import karnatakaImg from "@assets/stock_images/karnataka_india_bang_70a59921.jpg";

interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'stranger';
}

const TradeNTalk = () => {
  const { isConnected, address, openConnectModal } = useWallet();
  
  // Get location preference from sessionStorage (set by LocationPage)
  const getLocationPreference = () => {
    const stored = sessionStorage.getItem('preferredLocation');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  };
  
  const [locationPreference, setLocationPreference] = useState<{name: string, type: string} | null>(getLocationPreference());
  
  // Simple state
  const [isSearching, setIsSearching] = useState(false);
  const [isConnectedToPeer, setIsConnectedToPeer] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [chatDuration, setChatDuration] = useState(0);
  const [chatStartTime, setChatStartTime] = useState<number | null>(null);
  
  // Filters
  const [selectedGender, setSelectedGender] = useState<string>('any');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket connection
  useEffect(() => {
    if (!isConnected || !address) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      ws.send(JSON.stringify({ type: 'join_chat', walletAddress: address }));
      ws.send(JSON.stringify({ type: 'register', walletAddress: address }));
      
      // Don't auto-start search - wait for user to select filters and click Start
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleMessage(data);
    };

    ws.onclose = () => console.log('[WS] Disconnected');
    return () => ws.close();
  }, [isConnected, address]);

  // Assign remote stream to video
  useEffect(() => {
    if (!remoteStream || !remoteVideoRef.current) return;
    if (remoteVideoRef.current.srcObject === remoteStream) return;
    
    console.log('[Video] Assigning remote stream');
    remoteVideoRef.current.srcObject = remoteStream;
    remoteVideoRef.current.muted = false;
    remoteVideoRef.current.play().catch(e => {
      console.log('[Video] Autoplay failed, trying muted');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.muted = true;
        remoteVideoRef.current.play();
      }
    });
  }, [remoteStream]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Track unread messages
  useEffect(() => {
    if (!showChat && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'stranger') {
        setUnreadMessages(prev => prev + 1);
      }
    } else if (showChat) {
      setUnreadMessages(0);
    }
  }, [messages, showChat]);

  const handleMessage = async (data: any) => {
    switch (data.type) {
      case 'online_count':
        setOnlineUsers(data.count);
        break;
        
      case 'matched':
        console.log('[Match] Found peer, isInitiator:', data.isInitiator);
        setIsConnectedToPeer(true);
        setIsSearching(false);
        setMessages([]);
        setChatStartTime(Date.now());
        setChatDuration(0);
        initPeerConnection();
        
        // CRITICAL FIX: Only initiator starts video (prevents both users creating offers)
        if (data.isInitiator) {
          console.log('[Match] I am initiator - starting video');
          setTimeout(() => startVideo(), 500);
        } else {
          console.log('[Match] I am receiver - waiting for offer');
        }
        break;
        
      case 'webrtc_offer':
        await handleOffer(data.offer);
        break;
        
      case 'webrtc_answer':
        await handleAnswer(data.answer);
        break;
        
      case 'webrtc_ice_candidate':
        if (data.candidate && pcRef.current) {
          await pcRef.current.addIceCandidate(data.candidate);
        }
        break;
        
      case 'chat_message':
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: data.message,
          sender: 'stranger'
        }]);
        break;
        
      case 'peer_disconnected':
        console.log('[Peer] Disconnected, searching again');
        cleanup();
        setTimeout(() => {
          startSearchWithFilters();
        }, 500);
        break;
    }
  };

  const initPeerConnection = () => {
    if (pcRef.current) pcRef.current.close();
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.ontrack = (event) => {
      console.log('[RTC] Track received:', event.track.kind);
      const stream = event.streams[0];
      if (stream) {
        setRemoteStream(prevStream => {
          if (prevStream && prevStream.id === stream.id) return prevStream;
          console.log('[RTC] New remote stream');
          return stream;
        });
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'webrtc_ice_candidate',
          candidate: event.candidate
        }));
      }
    };

    pcRef.current = pc;
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true
      });
      
      setLocalStream(stream);
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      if (pcRef.current) {
        stream.getTracks().forEach(track => {
          pcRef.current!.addTrack(track, stream);
        });
        
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        
        wsRef.current?.send(JSON.stringify({
          type: 'webrtc_offer',
          offer: offer
        }));
      }
    } catch (error) {
      console.error('[Video] Error:', error);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!pcRef.current) return;
    
    try {
      await pcRef.current.setRemoteDescription(offer);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true
      });
      
      setLocalStream(stream);
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      stream.getTracks().forEach(track => {
        pcRef.current!.addTrack(track, stream);
      });
      
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      
      wsRef.current?.send(JSON.stringify({
        type: 'webrtc_answer',
        answer: answer
      }));
    } catch (error) {
      console.error('[Offer] Error:', error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!pcRef.current) return;
    try {
      console.log('[Answer] Setting remote description');
      await pcRef.current.setRemoteDescription(answer);
      console.log('[Answer] ✅ Answer accepted, connection should be established');
    } catch (error) {
      console.error('[Answer] ❌ Error setting remote description:', error);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const findNext = () => {
    if (!wsRef.current) return;
    
    // Send find_next to disconnect both users
    wsRef.current.send(JSON.stringify({
      type: 'find_next',
      walletAddress: address
    }));
    
    cleanup();
    startSearchWithFilters();
  };

  const cleanup = () => {
    setIsConnectedToPeer(false);
    setMessages([]);
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    setRemoteStream(null);
    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
    
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const sendMessage = () => {
    if (!currentMessage.trim() || !wsRef.current) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'chat_message',
      message: currentMessage
    }));
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: currentMessage,
      sender: 'me'
    }]);
    
    setCurrentMessage("");
  };

  const startSearchWithFilters = () => {
    if (!wsRef.current || !address) return;
    
    setIsSearching(true);
    
    // Determine location from filters or preference
    let finalLocation = null;
    if (selectedCountry || selectedCity || selectedArea) {
      finalLocation = selectedArea || selectedCity || selectedCountry;
    } else if (locationPreference) {
      finalLocation = locationPreference.name;
    }
    
    wsRef.current.send(JSON.stringify({
      type: 'search',
      walletAddress: address,
      filters: { 
        gender: selectedGender,
        location: finalLocation
      },
      userLocation: finalLocation,
      tasBalance: 0,
      hasAdvancedFilters: false
    }));
  };

  // Chat duration timer
  useEffect(() => {
    if (!isConnectedToPeer || !chatStartTime) {
      setChatDuration(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - chatStartTime) / 1000);
      setChatDuration(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnectedToPeer, chatStartTime]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Helmet>
        <title>Talk A Stranger - Free Random Video Chat</title>
        <meta name="description" content="Free random video chat with strangers worldwide. 100% free, no tokens required." />
      </Helmet>

      <div className="min-h-screen bg-black overflow-y-auto scroll-smooth">
        {!isConnected ? (
          <div className="relative w-full bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900">
            <div className="w-full py-6 px-4">
              <div className="text-center text-white max-w-2xl mx-auto w-full">
                <h1 className="text-2xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-pink-300 via-purple-300 to-orange-300 bg-clip-text text-transparent">
                  Meet New Friends! 🌍
                </h1>
                <p className="text-sm md:text-xl mb-4 text-white/90">
                  {locationPreference 
                    ? `Talk with people from ${locationPreference.name}`
                    : "Thousands chatting right now"}
                </p>

                <div className="flex items-center justify-center gap-2 md:gap-4 text-xs md:text-sm text-white/80 mb-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{onlineUsers} Online</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>150+ Countries</span>
                  </div>
                </div>

                <Button 
                  onClick={openConnectModal}
                  size="lg"
                  className="w-full md:w-auto bg-white text-purple-900 hover:bg-gray-100 px-6 md:px-12 py-3 md:py-6 text-base md:text-xl rounded-full font-bold shadow-2xl hover:scale-105 transition-all mb-3"
                  data-testid="button-start-talking"
                >
                  🎉 Start Talking Now →
                </Button>
                <p className="text-white/70 text-xs md:text-sm mb-4">100% Free • No Sign Up • No Tokens</p>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-2 max-w-sm md:max-w-md mx-auto">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                    <div className="text-lg md:text-2xl mb-1">⚡</div>
                    <div className="font-bold text-[10px] md:text-sm">Instant Match</div>
                    <div className="text-white/60 text-[9px] md:text-xs">Connect fast</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                    <div className="text-lg md:text-2xl mb-1">🌟</div>
                    <div className="font-bold text-[10px] md:text-sm">100% Free</div>
                    <div className="text-white/60 text-[9px] md:text-xs">No fees</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                    <div className="text-lg md:text-2xl mb-1">🔒</div>
                    <div className="font-bold text-[10px] md:text-sm">Safe & Private</div>
                    <div className="text-white/60 text-[9px] md:text-xs">Secure chat</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                    <div className="text-lg md:text-2xl mb-1">🌍</div>
                    <div className="font-bold text-[10px] md:text-sm">Global Reach</div>
                    <div className="text-white/60 text-[9px] md:text-xs">Worldwide</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-screen bg-black overflow-hidden">
            {/* Full-screen remote video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              data-testid="video-remote"
            />
            
            {/* Self-view overlay (top-right) - Smaller on mobile, medium on desktop */}
            <div className="absolute top-2 right-2 w-20 h-28 md:top-4 md:right-4 md:w-40 md:h-52 bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-white/20 z-10">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover mirror"
                data-testid="video-local"
              />
              <div className="absolute bottom-1 left-1 text-white text-xs bg-black/50 px-2 py-0.5 rounded">
                You
              </div>
            </div>

            {/* Searching overlay */}
            {!isConnectedToPeer && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-pink-900/90 to-orange-900/90 backdrop-blur-sm z-5 overflow-y-auto">
                <div className="min-h-full flex items-center justify-center py-6 px-4">
                    {isSearching ? (
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
                      <h3 className="text-2xl font-bold mb-2">Finding someone...</h3>
                      <p className="text-white/80">{onlineUsers} users online</p>
                    </div>
                  ) : (
                    <div className="text-center text-white max-w-2xl mx-auto w-full">
                      {/* Above Section - Engaging Text */}
                      <div className="mb-3">
                        <h2 className="text-lg md:text-3xl font-bold mb-1 bg-gradient-to-r from-pink-300 via-purple-300 to-orange-300 bg-clip-text text-transparent">
                          Meet New Friends! 🌍
                        </h2>
                        <p className="text-xs md:text-base text-white/90 mb-3">
                          Thousands chatting right now
                        </p>
                        
                        <div className="flex items-center justify-center gap-2 md:gap-3 text-[10px] md:text-sm text-white/80 mb-3">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span>{onlineUsers} Online</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <span>150+ Countries</span>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-sm md:text-xl font-bold mb-2">Choose Your Preferences</h3>
                    
                    {/* Gender Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Who do you want to talk to?</label>
                      <Select value={selectedGender} onValueChange={setSelectedGender}>
                        <SelectTrigger className="w-full bg-white/10 border-white/30 text-white">
                          <SelectValue placeholder="Select gender preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Males</SelectItem>
                          <SelectItem value="female">Females</SelectItem>
                          <SelectItem value="both">Couples/Both</SelectItem>
                          <SelectItem value="any">Anyone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location Filters */}
                    <div className="mb-4">
                      <label className="block text-xs md:text-sm font-medium mb-2">Location (optional)</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Input
                          placeholder="Country"
                          value={selectedCountry}
                          onChange={(e) => setSelectedCountry(e.target.value)}
                          className="bg-white/10 border-white/30 text-white placeholder:text-white/50 text-sm"
                          data-testid="input-country"
                        />
                        <Input
                          placeholder="City"
                          value={selectedCity}
                          onChange={(e) => setSelectedCity(e.target.value)}
                          className="bg-white/10 border-white/30 text-white placeholder:text-white/50 text-sm"
                          data-testid="input-city"
                        />
                        <Input
                          placeholder="Area"
                          value={selectedArea}
                          onChange={(e) => setSelectedArea(e.target.value)}
                          className="bg-white/10 border-white/30 text-white placeholder:text-white/50 text-sm"
                          data-testid="input-area"
                        />
                      </div>
                      <p className="text-xs text-white/60 mt-1">
                        Match with people from specific locations
                      </p>
                    </div>

                    <Button
                      onClick={startSearchWithFilters}
                      size="lg"
                      className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 md:px-12 py-4 md:py-6 rounded-full text-base md:text-xl font-bold shadow-lg hover:scale-105 transition-all mb-3"
                      data-testid="button-start-search"
                    >
                      🎉 Start Chatting Now
                    </Button>
                    
                    {/* Below Section - Features and Stats */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:text-sm max-w-md mx-auto">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 md:p-3">
                        <div className="text-xl md:text-2xl mb-1">⚡</div>
                        <div className="font-bold text-xs md:text-sm">Instant Match</div>
                        <div className="text-white/60 text-[10px] md:text-xs">Connect in seconds</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 md:p-3">
                        <div className="text-xl md:text-2xl mb-1">🌟</div>
                        <div className="font-bold text-xs md:text-sm">100% Free</div>
                        <div className="text-white/60 text-[10px] md:text-xs">No hidden fees</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 md:p-3">
                        <div className="text-xl md:text-2xl mb-1">🔒</div>
                        <div className="font-bold text-xs md:text-sm">Safe & Private</div>
                        <div className="text-white/60 text-[10px] md:text-xs">Your privacy matters</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 md:p-3">
                        <div className="text-xl md:text-2xl mb-1">🌍</div>
                        <div className="font-bold text-xs md:text-sm">Global Reach</div>
                        <div className="text-white/60 text-[10px] md:text-xs">Chat worldwide</div>
                      </div>
                    </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                {isConnectedToPeer ? (
                  <>
                <Button
                  onClick={toggleVideo}
                  size="lg"
                  className={`${isVideoEnabled ? 'bg-white/20' : 'bg-red-500'} backdrop-blur-sm text-white rounded-full p-4`}
                  data-testid="button-toggle-video"
                >
                  {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </Button>
                
                <Button
                  onClick={toggleAudio}
                  size="lg"
                  className={`${isAudioEnabled ? 'bg-white/20' : 'bg-red-500'} backdrop-blur-sm text-white rounded-full p-4`}
                  data-testid="button-toggle-audio"
                >
                  {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </Button>
                
                <Button
                  onClick={findNext}
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-6 rounded-full text-lg font-bold shadow-lg"
                  data-testid="button-next"
                >
                  Next
                </Button>
                
                <Button
                  onClick={() => setShowChat(!showChat)}
                  size="lg"
                  className="bg-white/20 backdrop-blur-sm text-white rounded-full p-4 relative"
                  data-testid="button-toggle-chat"
                >
                  <MessageCircle className="w-6 h-6" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>

            {/* Chat panel */}
            {showChat && isConnectedToPeer && (
          <div className="absolute right-4 bottom-24 w-80 h-96 bg-black/80 backdrop-blur-md rounded-lg border border-white/20 flex flex-col z-10">
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`p-2 rounded ${
                    msg.sender === 'me'
                      ? 'bg-purple-600 text-white ml-auto'
                      : 'bg-gray-700 text-white'
                  } max-w-[80%] ${msg.sender === 'me' ? 'text-right' : ''}`}
                >
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-white/20 flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                data-testid="input-chat-message"
              />
              <Button
                onClick={sendMessage}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Online count */}
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm z-10">
              {onlineUsers} online
            </div>

            {/* Chat Duration Timer */}
            {isConnectedToPeer && chatDuration > 0 && (
              <div className="absolute top-16 left-4 bg-green-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold z-10">
                ⏱️ {formatDuration(chatDuration)}
              </div>
            )}

            {/* Location indicator */}
            {locationPreference && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-purple-600/90 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-medium z-10">
                Chatting with people from {locationPreference.name}
              </div>
            )}
          </div>
        )}
        {/* End of Video Chat Section */}

        {/* Content Section Below - Location-specific OR general content */}
        <div className="bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 py-16 px-4">
          <div className="max-w-6xl mx-auto">
            {locationPreference ? (
              <>
                {/* Location-Specific Content - Same as location pages */}
                <h2 className="text-4xl font-bold text-white text-center mb-4">
                  Free Video Chat with Strangers from {locationPreference.name}
                </h2>
                <div className="max-w-4xl mx-auto mb-12">
                  <p className="text-white/90 text-center text-lg mb-4">
                    Welcome to Talk A Stranger's {locationPreference.name} community! Connect with random strangers from {locationPreference.name} 
                    through our free video chat platform. Whether you're looking to make new friends, practice languages, 
                    or simply have fun conversations, our platform makes it easy to meet {locationPreference.name} girls and boys instantly.
                  </p>
                  <p className="text-white/80 text-center mb-8">
                    Talk A Stranger is the best place to chat with strangers from {locationPreference.name}. Our random video chat 
                    connects you with people based on your preferences, making every conversation unique and exciting.
                  </p>
                </div>

                {/* Features for Location - ALL 6 FEATURES */}
                <div className="mb-16">
                  <h3 className="text-3xl font-bold text-white text-center mb-8">
                    Why Choose Talk A Stranger for {locationPreference.name}?
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Users className="w-7 h-7 text-white" />
                      </div>
                      <h4 className="text-xl font-bold mb-3 text-white text-center">Meet {locationPreference.name} Locals</h4>
                      <p className="text-white/80 text-center text-sm">
                        Connect with real people from {locationPreference.name}. Filter by gender and location to find exactly who you want to talk with.
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Shield className="w-7 h-7 text-white" />
                      </div>
                      <h4 className="text-xl font-bold mb-3 text-white text-center">100% Anonymous</h4>
                      <p className="text-white/80 text-center text-sm">
                        No registration required. Your privacy is our priority. Chat anonymously with strangers from {locationPreference.name}.
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Video className="w-7 h-7 text-white" />
                      </div>
                      <h4 className="text-xl font-bold mb-3 text-white text-center">HD Video Quality</h4>
                      <p className="text-white/80 text-center text-sm">
                        Crystal clear video and audio for the best chatting experience with {locationPreference.name} strangers.
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <MessageCircle className="w-7 h-7 text-white" />
                      </div>
                      <h4 className="text-xl font-bold mb-3 text-white text-center">Instant Matching</h4>
                      <p className="text-white/80 text-center text-sm">
                        Get connected within seconds. Our algorithm finds the best matches from {locationPreference.name} for you.
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Globe className="w-7 h-7 text-white" />
                      </div>
                      <h4 className="text-xl font-bold mb-3 text-white text-center">Global Community</h4>
                      <p className="text-white/80 text-center text-sm">
                        While focusing on {locationPreference.name}, connect with people from around the world too!
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Heart className="w-7 h-7 text-white" />
                      </div>
                      <h4 className="text-xl font-bold mb-3 text-white text-center">Make Real Friends</h4>
                      <p className="text-white/80 text-center text-sm">
                        Build genuine connections with {locationPreference.name} girls and boys. Many users find lasting friendships!
                      </p>
                    </div>
                  </div>
                </div>

                {/* HOW IT WORKS - 3 STEPS */}
                <div className="mb-16 bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12">
                  <h3 className="text-3xl font-bold text-white text-center mb-8">
                    How to Start Chatting with {locationPreference.name} Strangers
                  </h3>
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold">
                        1
                      </div>
                      <h4 className="text-xl font-bold mb-3 text-white">Click "Start Talking"</h4>
                      <p className="text-white/70">No sign-up needed. Just click the button and you're ready to go!</p>
                    </div>
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-pink-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold">
                        2
                      </div>
                      <h4 className="text-xl font-bold mb-3 text-white">Choose Your Preferences</h4>
                      <p className="text-white/70">Select gender filter to match with {locationPreference.name} girls or boys</p>
                    </div>
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold">
                        3
                      </div>
                      <h4 className="text-xl font-bold mb-3 text-white">Start Video Chatting!</h4>
                      <p className="text-white/70">Get matched instantly and enjoy conversations with {locationPreference.name} strangers</p>
                    </div>
                  </div>
                </div>

                {/* SEO CONTENT SECTIONS - ALL 7 H3 SECTIONS */}
                <div className="mb-16 max-w-4xl mx-auto">
                  <h3 className="text-3xl font-bold text-white mb-6">
                    Best Random Video Chat Platform for {locationPreference.name}
                  </h3>
                  <div className="space-y-4 text-white/80 text-base leading-relaxed">
                    <p>
                      Talk A Stranger is the premier destination for video chatting with strangers from {locationPreference.name}. 
                      Our platform is designed specifically for people who want to meet new {locationPreference.name} girls and boys 
                      through random video chat. Whether you're in {locationPreference.name} or anywhere else in the world, you can 
                      connect with {locationPreference.name} locals and enjoy authentic conversations.
                    </p>
                    <p>
                      Unlike other chat platforms, Talk A Stranger offers advanced filters that let you connect specifically 
                      with people from {locationPreference.name}. Our gender filter is free for everyone, making it easy to find 
                      {locationPreference.name} girls or {locationPreference.name} boys based on your preference. The platform is optimized 
                      for both desktop and mobile, so you can chat with {locationPreference.name} strangers anytime, anywhere.
                    </p>
                  </div>

                  <h4 className="text-2xl font-bold text-white mt-8 mb-4">
                    How to Talk with Strangers in {locationPreference.name}
                  </h4>
                  <div className="space-y-4 text-white/80 text-base leading-relaxed">
                    <p>
                      Starting a conversation with someone from {locationPreference.name} is easy on Talk A Stranger. Simply click the 
                      "Start Talking" button, choose your nickname, and select your gender preference. The platform will 
                      instantly match you with compatible strangers from {locationPreference.name} who are also looking to chat.
                    </p>
                    <p>
                      Once connected, you'll be in a live video chat with a real person from {locationPreference.name}. Be respectful, 
                      friendly, and genuine in your conversations. Many people from {locationPreference.name} use our platform to make 
                      friends, practice languages, or simply have fun conversations.
                    </p>
                  </div>

                  <h4 className="text-2xl font-bold text-white mt-8 mb-4">
                    Why People Love Chatting with {locationPreference.name} Strangers
                  </h4>
                  <div className="space-y-4 text-white/80 text-base leading-relaxed">
                    <p>
                      People from {locationPreference.name} are known for being friendly and welcoming. When you use Talk A Stranger 
                      to connect with {locationPreference.name} locals, you'll experience genuine conversations and maybe even make 
                      lifelong friends. Our users report high satisfaction rates when chatting with strangers from {locationPreference.name}.
                    </p>
                    <p>
                      The video chat feature allows for face-to-face interaction, making conversations more personal and 
                      engaging. You can see the real person behind the chat, whether you're talking to {locationPreference.name} girls 
                      or {locationPreference.name} boys. This transparency creates trust and leads to more meaningful interactions.
                    </p>
                  </div>

                  <h4 className="text-2xl font-bold text-white mt-8 mb-4">
                    Tips for Great Conversations with {locationPreference.name} People
                  </h4>
                  <ul className="list-disc list-inside text-white/80 text-base space-y-2 ml-4">
                    <li>Be respectful and polite when talking to strangers from {locationPreference.name}</li>
                    <li>Ask about their culture, traditions, and daily life in {locationPreference.name}</li>
                    <li>Share your own experiences and be open to cultural exchange</li>
                    <li>Use the gender filter to match with {locationPreference.name} girls or boys based on your preference</li>
                    <li>Be patient and give each conversation a chance before moving to the next person</li>
                    <li>Keep conversations appropriate and follow platform guidelines</li>
                  </ul>

                  <h4 className="text-2xl font-bold text-white mt-8 mb-4">
                    Meeting {locationPreference.name} Girls Through Video Chat
                  </h4>
                  <div className="space-y-4 text-white/80 text-base leading-relaxed">
                    <p>
                      Many users specifically want to meet and talk with {locationPreference.name} girls. Our free gender filter makes 
                      this easy - simply select "Female" in your preferences and you'll be matched with {locationPreference.name} girls 
                      who are also looking to chat. The platform ensures safe, anonymous conversations where both parties can 
                      feel comfortable.
                    </p>
                    <p>
                      {locationPreference.name} girls use Talk A Stranger for various reasons - to make friends, practice languages, 
                      have fun conversations, or meet new people. Always approach conversations with respect and genuine interest.
                    </p>
                  </div>

                  <h4 className="text-2xl font-bold text-white mt-8 mb-4">
                    Connecting with {locationPreference.name} Boys on Random Chat
                  </h4>
                  <div className="space-y-4 text-white/80 text-base leading-relaxed">
                    <p>
                      Looking to chat with {locationPreference.name} boys? Use our gender filter to select "Male" and get instantly 
                      connected with guys from {locationPreference.name}. Whether you want to discuss sports, gaming, culture, or just 
                      have casual conversations, you'll find {locationPreference.name} boys ready to chat on our platform 24/7.
                    </p>
                    <p>
                      {locationPreference.name} boys appreciate genuine conversations and cultural exchange. The video chat format 
                      allows for authentic interactions where you can truly get to know someone from {locationPreference.name}.
                    </p>
                  </div>

                  <h4 className="text-2xl font-bold text-white mt-8 mb-4">
                    Safety and Privacy When Chatting with {locationPreference.name} Strangers
                  </h4>
                  <div className="space-y-4 text-white/80 text-base leading-relaxed">
                    <p>
                      Your safety is our top priority when you chat with {locationPreference.name} strangers. Talk A Stranger requires 
                      no registration or personal information - you remain completely anonymous throughout your conversations. 
                      We don't store chat history or video recordings, ensuring your privacy when talking to {locationPreference.name} 
                      girls and boys.
                    </p>
                    <p>
                      While most {locationPreference.name} users are friendly and respectful, we provide tools to skip or report 
                      inappropriate behavior. If someone makes you uncomfortable, simply click "Next" to be matched with 
                      a different person from {locationPreference.name}.
                    </p>
                  </div>

                  <h4 className="text-2xl font-bold text-white mt-8 mb-4">
                    Why Choose Talk A Stranger for {locationPreference.name} Video Chat
                  </h4>
                  <div className="space-y-4 text-white/80 text-base leading-relaxed">
                    <p>
                      Talk A Stranger stands out as the best platform for connecting with {locationPreference.name} strangers. Our 
                      advanced matching algorithm ensures you're paired with compatible people from {locationPreference.name} based 
                      on your preferences. The platform works seamlessly on both desktop and mobile devices.
                    </p>
                    <p>
                      Unlike other random chat platforms, we offer location-specific connections, making 
                      it easier to find people specifically from {locationPreference.name}. Our free gender filter is available to everyone, 
                      allowing you to choose whether you want to chat with {locationPreference.name} girls, {locationPreference.name} boys, or both. 
                      Join our growing community and start making connections with {locationPreference.name} strangers today!
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-bold text-white text-center mb-4">
                  Talk with Strangers Worldwide
                </h2>
                <p className="text-white/80 text-center mb-12 text-lg">
                  Connect with people from different countries, cities, and areas around the globe
                </p>
              </>
            )}

            {/* Popular Countries */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-white mb-6">Popular Countries</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { code: 'US', name: 'United States', flag: '🇺🇸', slug: 'united-states', img: usaImg, online: 2847 },
                  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', slug: 'united-kingdom', img: ukImg, online: 1523 },
                  { code: 'CA', name: 'Canada', flag: '🇨🇦', slug: 'canada', img: canadaImg, online: 892 },
                  { code: 'AU', name: 'Australia', flag: '🇦🇺', slug: 'australia', img: australiaImg, online: 634 },
                  { code: 'IN', name: 'India', flag: '🇮🇳', slug: 'india', img: indiaImg, online: 1967 },
                  { code: 'DE', name: 'Germany', flag: '🇩🇪', slug: 'germany', img: germanyImg, online: 743 },
                  { code: 'FR', name: 'France', flag: '🇫🇷', slug: 'france', img: franceImg, online: 685 },
                  { code: 'BR', name: 'Brazil', flag: '🇧🇷', slug: 'brazil', img: brazilImg, online: 1124 },
                  { code: 'MX', name: 'Mexico', flag: '🇲🇽', slug: 'mexico', img: mexicoImg, online: 567 },
                  { code: 'JP', name: 'Japan', flag: '🇯🇵', slug: 'japan', img: japanImg, online: 823 },
                  { code: 'KR', name: 'South Korea', flag: '🇰🇷', slug: 'south-korea', img: koreaImg, online: 456 },
                  { code: 'IT', name: 'Italy', flag: '🇮🇹', slug: 'italy', img: italyImg, online: 392 },
                ].map(country => (
                  <a
                    key={country.code}
                    href={`/location/country/${country.slug}`}
                    className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl overflow-hidden transition-all hover:scale-105"
                  >
                    {country.img && (
                      <div className="h-24 md:h-28 overflow-hidden">
                        <img 
                          src={country.img} 
                          alt={country.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                    )}
                    <div className={`p-3 ${!country.img ? 'pt-8' : ''}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xl">{country.flag}</span>
                        <div className="flex items-center gap-1 bg-green-500/90 px-2 py-1 rounded-full">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span className="text-white text-xs font-bold">{country.online}</span>
                        </div>
                      </div>
                      <div className="text-white font-medium text-sm">{country.name}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Popular Cities */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-white mb-6">Popular Cities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { name: 'New York', online: 634, img: newYorkImg },
                  { name: 'London', online: 512, img: londonImg },
                  { name: 'Tokyo', online: 389, img: tokyoImg },
                  { name: 'Paris', online: 267, img: parisImg },
                  { name: 'Los Angeles', online: 423, img: losAngelesImg },
                  { name: 'Sydney', online: 178, img: sydneyImg },
                  { name: 'Dubai', online: 234, img: dubaiImg },
                  { name: 'Singapore', online: 156, img: singaporeImg },
                  { name: 'Mumbai', online: 345, img: mumbaiImg },
                  { name: 'Toronto', online: 198, img: torontoImg },
                  { name: 'Berlin', online: 167, img: berlinImg },
                  { name: 'Seoul', online: 234, img: seoulImg },
                  { name: 'Chicago', online: 289, img: chicagoImg },
                  { name: 'Miami', online: 198, img: miamiImg },
                  { name: 'Las Vegas', online: 176, img: lasVegasImg },
                  { name: 'San Francisco', online: 245, img: sanFranciscoImg },
                  { name: 'Boston', online: 134, img: bostonImg },
                  { name: 'Houston', online: 123, img: houstonImg },
                  { name: 'Atlanta', online: 145, img: atlantaImg },
                  { name: 'Seattle', online: 167, img: seattleImg },
                  { name: 'Manchester', online: 112, img: manchesterImg },
                  { name: 'Amsterdam', online: 189, img: amsterdamImg },
                  { name: 'Barcelona', online: 156, img: barcelonaImg },
                  { name: 'Rome', online: 134, img: romeImg },
                  { name: 'Madrid', online: 123, img: madridImg }
                ].map(city => (
                  <a
                    key={city.name}
                    href={`/location/city/${city.name.toLowerCase().replace(/ /g, '-')}`}
                    className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl overflow-hidden transition-all hover:scale-105"
                  >
                    {city.img && (
                      <div className="h-20 md:h-24 overflow-hidden">
                        <img 
                          src={city.img} 
                          alt={city.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                    )}
                    <div className={`p-3 ${!city.img ? 'pt-6 pb-6' : ''}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-sm">{city.name}</span>
                        <div className="flex items-center gap-1 bg-green-500/90 px-2 py-1 rounded-full">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                          <span className="text-white text-xs font-bold">{city.online}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Popular Areas & Regions */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-white mb-6">Popular Areas & Regions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { name: 'California', online: 567, img: californiaImg },
                  { name: 'Texas', online: 423, img: texasImg },
                  { name: 'Florida', online: 389, img: floridaImg },
                  { name: 'New York State', online: 456, img: newYorkStateImg },
                  { name: 'Ontario', online: 234, img: ontarioImg },
                  { name: 'England', online: 512, img: englandImg },
                  { name: 'Scotland', online: 145, img: scotlandImg },
                  { name: 'Wales', online: 89, img: walesImg },
                  { name: 'Bavaria', online: 123, img: bavariaImg },
                  { name: 'Catalonia', online: 167, img: cataloniaImg },
                  { name: 'Île-de-France', online: 198, img: ileDeFranceImg },
                  { name: 'New South Wales', online: 156, img: newSouthWalesImg },
                  { name: 'Queensland', online: 134, img: queenslandImg },
                  { name: 'Tokyo Region', online: 267, img: tokyoRegionImg },
                  { name: 'Osaka Region', online: 178, img: osakaRegionImg },
                  { name: 'British Columbia', online: 189, img: britishColumbiaImg },
                  { name: 'Quebec', online: 112, img: quebecImg },
                  { name: 'Alberta', online: 98, img: albertaImg },
                  { name: 'Maharashtra', online: 234, img: maharashtraImg },
                  { name: 'Karnataka', online: 156, img: karnatakaImg }
                ].map(area => (
                  <a
                    key={area.name}
                    href={`/location/area/${area.name.toLowerCase().replace(/ /g, '-')}`}
                    className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl overflow-hidden transition-all hover:scale-105"
                  >
                    {area.img && (
                      <div className="h-20 md:h-24 overflow-hidden">
                        <img 
                          src={area.img} 
                          alt={area.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                    )}
                    <div className={`p-3 ${!area.img ? 'pt-6 pb-6' : ''}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-sm">{area.name}</span>
                        <div className="flex items-center gap-1 bg-green-500/90 px-2 py-1 rounded-full">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                          <span className="text-white text-xs font-bold">{area.online}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Mission & Vision - Always show general content */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-white mb-6">Our Mission & Vision</h3>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 space-y-4">
                <div>
                  <h4 className="text-white font-bold text-xl mb-2">🎯 Our Mission</h4>
                  <p className="text-white/80">To connect people from all corners of the world through free, instant, and anonymous video chat. We believe everyone deserves the opportunity to meet new people, learn about different cultures, and make meaningful connections without barriers.</p>
                </div>
                <div>
                  <h4 className="text-white font-bold text-xl mb-2">🌟 Our Vision</h4>
                  <p className="text-white/80">To become the world's most trusted platform for spontaneous human connection. We envision a world where geographical boundaries don't limit friendships, where cultural exchange happens naturally, and where talking to strangers creates lasting memories.</p>
                </div>
                <div>
                  <h4 className="text-white font-bold text-xl mb-2">💡 Why We're Different</h4>
                  <p className="text-white/80">Unlike other platforms, we're 100% free with no hidden costs, no premium tiers, and no restrictions. We combine cutting-edge blockchain technology with simple, intuitive design to create the best stranger chat experience possible.</p>
                </div>
              </div>
            </div>

            {/* FAQ Section - General */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                      <h4 className="text-white font-bold mb-2">Is Talk A Stranger really free?</h4>
                      <p className="text-white/80">Yes! 100% free video chat, text chat, and all features. No tokens, no hidden fees, no premium plans.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                      <h4 className="text-white font-bold mb-2">How do I start chatting?</h4>
                      <p className="text-white/80">Simply connect your wallet (takes 2 seconds), and you'll automatically start matching with strangers online. Click "Next" to find new people.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                      <h4 className="text-white font-bold mb-2">Can I choose who I talk to?</h4>
                      <p className="text-white/80">Yes! Browse our location pages to connect with people from specific countries, cities, or areas around the world.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                      <h4 className="text-white font-bold mb-2">Is it safe and anonymous?</h4>
                      <p className="text-white/80">Absolutely. We don't store any personal information. Your wallet address is your only identifier, and you can disconnect anytime.</p>
                    </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h4 className="text-white font-bold mb-2">Do I need to register?</h4>
                  <p className="text-white/80">No registration required! Just connect your wallet with a username and start chatting instantly. No emails, no passwords, no forms.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h4 className="text-white font-bold mb-2">What if I see inappropriate content?</h4>
                  <p className="text-white/80">Simply click "Next" to instantly disconnect and find a new person. We encourage respectful interactions and provide tools to skip anyone quickly.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h4 className="text-white font-bold mb-2">Can I use it on mobile?</h4>
                  <p className="text-white/80">Yes! Our platform works perfectly on mobile browsers. Use your phone's camera to video chat with strangers anywhere, anytime.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h4 className="text-white font-bold mb-2">How does matching work?</h4>
                  <p className="text-white/80">We use a smart matching system that instantly pairs you with available users. The more people online, the faster you'll connect!</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h4 className="text-white font-bold mb-2">Can I chat without video?</h4>
                  <p className="text-white/80">Yes! You can disable your camera or microphone anytime. Text chat is always available as an alternative communication method.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h4 className="text-white font-bold mb-2">What languages are supported?</h4>
                  <p className="text-white/80">Our platform supports users from all countries speaking any language. Connect with people worldwide and practice language skills!</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h4 className="text-white font-bold mb-2">Is my conversation private?</h4>
                  <p className="text-white/80">Yes! All video and text conversations are peer-to-peer and not recorded. Your privacy is our top priority.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h4 className="text-white font-bold mb-2">How many people can I talk to?</h4>
                  <p className="text-white/80">Unlimited! Chat with as many strangers as you want. There are no daily limits or restrictions on how long you can use the platform.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h4 className="text-white font-bold mb-2">What makes this different from other chat sites?</h4>
                  <p className="text-white/80">We're built on blockchain technology for enhanced privacy, completely free with no ads, and designed for the modern user experience.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h4 className="text-white font-bold mb-2">Can I reconnect with someone?</h4>
                  <p className="text-white/80">Each connection is spontaneous and random. If you had a great chat, exchange social media handles before clicking "Next"!</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h4 className="text-white font-bold mb-2">What internet speed do I need?</h4>
                  <p className="text-white/80">A stable connection with at least 1 Mbps is recommended for smooth video chat. Our platform adapts to your connection quality.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h4 className="text-white font-bold mb-2">Are there age restrictions?</h4>
                  <p className="text-white/80">Yes, you must be 18 years or older to use Talk A Stranger. We take user safety seriously and encourage responsible usage.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h4 className="text-white font-bold mb-2">How do location filters work?</h4>
                  <p className="text-white/80">Click on any country, city, or area from our list to connect with people from that specific location. It's that simple!</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h4 className="text-white font-bold mb-2">What browsers are supported?</h4>
                  <p className="text-white/80">We support all modern browsers including Chrome, Firefox, Safari, and Edge. For best experience, use the latest version.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h4 className="text-white font-bold mb-2">Can I report users?</h4>
                  <p className="text-white/80">Yes! While we don't store conversations, you can skip inappropriate users instantly. Your safety and comfort come first.</p>
                </div>
              </div>
            </div>

            {/* How to Keep Chat Safe & Friendly */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-white mb-6">How to Keep Chat Safe & Friendly</h3>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 space-y-4">
                <div>
                  <h4 className="text-white font-bold text-lg mb-2">🛡️ Stay Safe Online</h4>
                  <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                    <li>Never share personal information (phone number, address, email)</li>
                    <li>Don't click on suspicious links sent by strangers</li>
                    <li>Use the "Next" button if someone makes you uncomfortable</li>
                    <li>Report inappropriate behavior immediately</li>
                    <li>Keep your camera and microphone under your control</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-2">😊 Be Friendly & Respectful</h4>
                  <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                    <li>Start with a friendly greeting and smile</li>
                    <li>Be patient - not everyone speaks the same language</li>
                    <li>Respect different cultures and perspectives</li>
                    <li>Ask interesting questions and listen actively</li>
                    <li>Keep conversations positive and appropriate</li>
                    <li>Treat others how you want to be treated</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-2">✨ Make Great Connections</h4>
                  <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                    <li>Be yourself - authenticity creates better conversations</li>
                    <li>Share your interests and hobbies</li>
                    <li>Ask about their culture, city, or daily life</li>
                    <li>Exchange social media if you had a great chat (optional)</li>
                    <li>Give each person a chance before clicking "Next"</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center pb-12">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="bg-white text-purple-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all hover:scale-105"
              >
                Start Chatting Now →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TradeNTalk;
