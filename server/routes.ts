import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./database-storage";

// Import route modules
import adminRoutes from './admin-routes';
import blockchainRoutes from './blockchain-routes';
import communityRoutes from './community-routes';
import priceRoutes from './price-routes';
import explorerRoutes from './explorer';
import { deployRouter } from './deploy-route';

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Register route modules
  app.use('/', adminRoutes);
  app.use('/', blockchainRoutes);
  app.use('/', communityRoutes);
  app.use('/', priceRoutes);
  app.use('/api/explorer', explorerRoutes);
  app.use('/', deployRouter);

  // TAS Rewards System API Routes
  app.post('/api/claim-online-reward', async (req, res) => {
    try {
      const { minutes, reward } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = req.user;
      console.log(`[Rewards] User ${user.id} earned ${reward} TAS for ${minutes} minutes online`);
      
      res.json({ 
        success: true, 
        reward: reward,
        message: `Earned ${reward} TAS tokens for staying online!`
      });
    } catch (error) {
      console.error('[Rewards] Online reward claim error:', error);
      res.status(500).json({ error: 'Failed to claim reward' });
    }
  });

  app.post('/api/claim-task-reward', async (req, res) => {
    try {
      const { taskId, reward } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = req.user;
      console.log(`[Rewards] User ${user.id} completed task ${taskId} and earned ${reward} TAS`);
      
      res.json({ 
        success: true, 
        reward: reward,
        message: `Task completed! Earned ${reward} TAS tokens!`
      });
    } catch (error) {
      console.error('[Rewards] Task reward claim error:', error);
      res.status(500).json({ error: 'Failed to claim task reward' });
    }
  });

  app.get('/api/user/rewards-stats', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const stats = {
        dailyEarned: 45,
        weeklyEarned: 280,
        totalEarned: 1250,
        currentStreak: 5,
        onlineTime: 127,
        chatMinutes: 85,
        connectionsToday: 8
      };

      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('[Rewards] Stats retrieval error:', error);
      res.status(500).json({ error: 'Failed to get rewards stats' });
    }
  });

  // TAS Rewards System API Routes
  app.get('/api/user/rewards-stats', async (req, res) => {
    try {
      // Calculate dynamic reward stats based on user activity
      const sessionTime = Math.floor((Date.now() - (req.session.startTime || Date.now())) / 60000);
      const dailyEarned = Math.floor(sessionTime * 2.5); // 2.5 TAS per minute of activity
      const weeklyEarned = dailyEarned * 7;
      const totalEarned = weeklyEarned * 4;
      
      const rewardStats = {
        dailyEarned,
        weeklyEarned,
        totalEarned,
        currentStreak: Math.floor(sessionTime / 10) + 1,
        onlineTime: sessionTime,
        chatMinutes: Math.floor(sessionTime * 0.8),
        connectionsToday: Math.floor(sessionTime / 15)
      };

      res.json({ success: true, data: rewardStats });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to load reward stats' });
    }
  });

  app.post('/api/claim-online-reward', async (req, res) => {
    try {
      const { minutes, reward, walletAddress } = req.body;
      
      // Simulate reward distribution to TAS wallet
      const distributionId = `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Log reward distribution for tracking
      console.log(`[REWARDS] Distributing ${reward} TAS tokens to ${walletAddress} for ${minutes} minutes online`);
      
      res.json({ 
        success: true, 
        message: `${reward} TAS tokens queued for distribution`,
        distributionId,
        walletAddress,
        estimatedArrival: '5-15 minutes'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to claim reward' });
    }
  });

  app.post('/api/claim-task-reward', async (req, res) => {
    try {
      const { taskId, reward, walletAddress } = req.body;
      
      const distributionId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`[REWARDS] Distributing ${reward} TAS tokens to ${walletAddress} for completing task: ${taskId}`);
      
      res.json({ 
        success: true, 
        message: `${reward} TAS tokens queued for distribution`,
        distributionId,
        walletAddress,
        taskId,
        estimatedArrival: '5-15 minutes'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to claim task reward' });
    }
  });

  // Wallet authentication routes
  app.post('/api/auth/connect', async (req, res) => {
    try {
      const { address, nickname, walletType } = req.body;
      
      if (!address || !nickname || !walletType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Store wallet connection in session
      if (!req.session) {
        req.session = {} as any;
      }
      (req.session as any).walletAddress = address;
      (req.session as any).nickname = nickname;
      (req.session as any).walletType = walletType;
      (req.session as any).isConnected = true;
      (req.session as any).connectedAt = Date.now();
      
      console.log(`[Auth] Wallet connected: ${walletType} - ${address.slice(0, 6)}...${address.slice(-4)}`);
      
      res.json({
        success: true,
        address,
        nickname,
        walletType,
        message: 'Wallet connected successfully'
      });
    } catch (error) {
      console.error('[Auth] Connection error:', error);
      res.status(500).json({ error: 'Failed to connect wallet' });
    }
  });

  app.post('/api/auth/disconnect', async (req, res) => {
    try {
      if (req.session) {
        req.session.destroy((err: any) => {
          if (err) {
            console.error('[Auth] Session destroy error:', err);
            return res.status(500).json({ error: 'Failed to disconnect' });
          }
          
          console.log('[Auth] Wallet disconnected successfully');
          res.json({ success: true, message: 'Wallet disconnected' });
        });
      } else {
        res.json({ success: true, message: 'No active session' });
      }
    } catch (error) {
      console.error('[Auth] Disconnect error:', error);
      res.status(500).json({ error: 'Failed to disconnect wallet' });
    }
  });

  app.get('/api/auth/status', (req, res) => {
    const session = req.session as any;
    const isConnected = !!(session && session.isConnected && session.walletAddress);
    
    if (isConnected) {
      res.json({
        success: true,
        isConnected: true,
        address: session.walletAddress,
        nickname: session.nickname,
        walletType: session.walletType,
        connectedAt: session.connectedAt
      });
    } else {
      res.json({
        success: true,
        isConnected: false
      });
    }
  });

  app.post('/api/update-chat-activity', async (req, res) => {
    try {
      const { activityType, duration } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = req.user;
      let reward = 0;

      switch (activityType) {
        case 'message':
          reward = 1;
          break;
        case 'video_minute':
          reward = 10;
          break;
        case 'new_connection':
          reward = 15;
          break;
        case 'quality_rating':
          reward = 50;
          break;
        default:
          reward = 0;
      }

      console.log(`[Rewards] User ${user.id} activity: ${activityType}, earned ${reward} TAS`);
      
      res.json({ 
        success: true, 
        reward: reward,
        activityType: activityType
      });
    } catch (error) {
      console.error('[Rewards] Activity update error:', error);
      res.status(500).json({ error: 'Failed to update activity' });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Chat system data structures
  const chatUsers = new Map<string, { 
    ws: WebSocket; 
    walletAddress: string; 
    isSearching: boolean;
    gender?: string;
    country?: string;
    city?: string;
    area?: string;
  }>();
  const searchingUsers = new Map<string, {
    wallet: string;
    filters: any;
    location: any;
    tasBalance: number;
    hasAdvancedFilters: boolean;
    timestamp: number;
  }>();
  const activeConnections = new Map<string, string>();
  
  // Active sessions to prevent re-matching connected users
  interface ActiveSession {
    user1: string;
    user2: string;
    startedAt: number;
  }
  const activeSessions = new Map<string, ActiveSession>(); // sessionId -> session
  const userToSession = new Map<string, string>(); // wallet -> sessionId
  
  // Price tracking data structures
  const tokenPriceWatchers = new Map<number, Set<WebSocket>>();
  const PRICE_UPDATE_INTERVAL = 30000; // 30 seconds

  // Broadcast functions
  function broadcastOnlineCount() {
    const onlineCount = chatUsers.size;
    chatUsers.forEach(({ ws }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'online_count',
          count: onlineCount
        }));
      }
    });
  }

  function broadcastOnlineUsers() {
    const onlineUsersArray = Array.from(chatUsers.values()).map(user => ({
      id: user.walletAddress,
      walletAddress: user.walletAddress,
      isSearching: user.isSearching,
      gender: user.gender || undefined,
      country: user.country || undefined,
      city: user.city || undefined,
      area: user.area || undefined
    }));

    chatUsers.forEach(({ ws }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'online_users',
          users: onlineUsersArray
        }));
      }
    });
  }

  function broadcastPriceUpdate(tokenId: number, price: number) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'price_update',
          tokenId,
          price
        }));
      }
    });
  }

  // Filter-aware matching function with RANDOMIZATION
  function findFilterMatch(currentWallet: string, filters: any): { wallet: string; user: any } | null {
    const currentUser = chatUsers.get(currentWallet);
    if (!currentUser) return null;

    const currentGender = filters?.gender || 'any';
    const currentLocation = filters?.location || null;
    
    console.log(`[Match] Finding match for ${currentWallet} with filters:`, { gender: currentGender, location: currentLocation });

    // Collect all available candidates
    const availableCandidates: Array<{ wallet: string; user: any; score: number }> = [];

    for (const [wallet, peerUser] of Array.from(chatUsers.entries())) {
      // Skip self
      if (wallet === currentWallet) continue;
      
      // CRITICAL: Skip users already in a session (already chatting)
      if (userToSession.has(wallet)) {
        console.log(`[Match] Skipping ${wallet} - already in session`);
        continue;
      }
      
      // Must be searching
      if (!peerUser.isSearching) continue;
      
      // Check filter compatibility
      const peerGender = peerUser.gender || 'any';
      const peerLocation = peerUser.location || null;
      
      let compatibilityScore = 0;
      
      // Gender compatibility
      const genderCompatible = 
        currentGender === 'any' || 
        peerGender === 'any' || 
        currentGender === peerGender;
      
      if (genderCompatible) {
        compatibilityScore += 10;
        
        // Exact gender match gets bonus points
        if (currentGender === peerGender && currentGender !== 'any') {
          compatibilityScore += 5;
        }
      }
      
      // Location compatibility (if both have location preferences)
      if (currentLocation && peerLocation) {
        if (currentLocation === peerLocation) {
          compatibilityScore += 20; // Location match is high priority
        }
      } else if (!currentLocation || !peerLocation) {
        compatibilityScore += 2; // At least one doesn't care about location
      }
      
      // Add to candidates if any compatibility
      if (compatibilityScore > 0 || (!currentLocation && !currentGender)) {
        availableCandidates.push({ wallet, user: peerUser, score: compatibilityScore || 1 });
      }
    }

    if (availableCandidates.length === 0) {
      console.log(`[Match] ❌ No match available for ${currentWallet}`);
      return null;
    }

    // RANDOMIZE within same score group to prevent sticky pairs
    // Group by score
    const scoreGroups = new Map<number, Array<{ wallet: string; user: any }>>();
    availableCandidates.forEach(candidate => {
      if (!scoreGroups.has(candidate.score)) {
        scoreGroups.set(candidate.score, []);
      }
      scoreGroups.get(candidate.score)!.push({ wallet: candidate.wallet, user: candidate.user });
    });

    // Get highest score group
    const maxScore = Math.max(...Array.from(scoreGroups.keys()));
    const topCandidates = scoreGroups.get(maxScore)!;

    // RANDOMLY select from top candidates - THIS PREVENTS STICKY PAIRS
    const randomIndex = Math.floor(Math.random() * topCandidates.length);
    const selectedMatch = topCandidates[randomIndex];

    console.log(`[Match] ✅ Random match selected from ${topCandidates.length} candidates (score: ${maxScore}): ${currentWallet} ↔ ${selectedMatch.wallet}`);
    return selectedMatch;
  }

  // WebSocket connection handler
  wss.on('connection', (ws) => {
    let userWallet: string | null = null;
    let userId: number | null = null;
    const watchingTokens = new Set<number>();

    console.log('[WebSocket] New connection established');

    // Send immediate acknowledgment
    ws.send(JSON.stringify({
      type: 'connection_established',
      timestamp: Date.now()
    }));

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'register':
            if (!data.walletAddress) return;
            userWallet = data.walletAddress;
            chatUsers.set(userWallet, { 
              ws, 
              walletAddress: userWallet, 
              isSearching: false,
              gender: data.gender,
              country: data.country,
              city: data.city,
              area: data.area,
              location: data.location
            });
            console.log(`[Chat] User registered: ${userWallet}. Total users: ${chatUsers.size}`);
            broadcastOnlineCount();
            broadcastOnlineUsers();
            
            ws.send(JSON.stringify({
              type: 'registration_confirmed',
              walletAddress: userWallet
            }));
            break;
            
          case 'auth':
            userId = data.userId;
            console.log(`[WebSocket] User ${userId} authenticated`);
            break;
            
          case 'watch_token':
            const tokenId = data.tokenId;
            if (tokenId) {
              watchingTokens.add(tokenId);
              console.log(`[WebSocket] User watching token ${tokenId}`);
              
              if (!tokenPriceWatchers.has(tokenId)) {
                tokenPriceWatchers.set(tokenId, new Set());
              }
              tokenPriceWatchers.get(tokenId)!.add(ws);
            }
            break;
            
          case 'join_chat':
          case 'chat_register':
            if (data.walletAddress) {
              userWallet = data.walletAddress;
              chatUsers.set(userWallet, { ws, walletAddress: userWallet, isSearching: false });
              console.log(`[Chat] User registered: ${userWallet}. Total users: ${chatUsers.size}`);
              broadcastOnlineCount();
            }
            break;

          case 'search':
            const { filters = {}, userLocation = null, tasBalance = 0, hasAdvancedFilters = false } = data;
            
            if (!userWallet) return;
            
            const currentUser = chatUsers.get(userWallet);
            if (!currentUser) return;
            
            // CRITICAL: Don't search if already in a session
            if (userToSession.has(userWallet)) {
              console.log(`[Chat] ⚠️ User ${userWallet} already in session, ignoring search`);
              return;
            }
            
            // Mark user as searching
            currentUser.isSearching = true;
            
            console.log(`[Chat] User ${userWallet} started searching with filters:`, filters);
            
            // Use filter-aware matching
            const matchResult = findFilterMatch(userWallet, filters);
            
            // Broadcast updated searching count
            const searchingCount = Array.from(chatUsers.values()).filter(u => u.isSearching).length;
            ws.send(JSON.stringify({
              type: 'searching_count',
              count: searchingCount
            }));
            
            // If found a match, connect them immediately
            if (matchResult && matchResult.user.ws.readyState === WebSocket.OPEN) {
              const matchedPeerWallet = matchResult.wallet;
              const matchedPeerUser = matchResult.user;
              
              console.log(`[Chat] Attempting to connect ${userWallet} with ${matchedPeerWallet}`);
              
              // Create session
              const sessionId = `${userWallet}_${matchedPeerWallet}_${Date.now()}`;
              const session: ActiveSession = {
                user1: userWallet,
                user2: matchedPeerWallet,
                startedAt: Date.now()
              };
              
              // Add to session tracking
              activeSessions.set(sessionId, session);
              userToSession.set(userWallet, sessionId);
              userToSession.set(matchedPeerWallet, sessionId);
              
              // Create connection between users (legacy support)
              activeConnections.set(userWallet, matchedPeerWallet);
              activeConnections.set(matchedPeerWallet, userWallet);
              
              // Mark both users as no longer searching
              currentUser.isSearching = false;
              matchedPeerUser.isSearching = false;
              
              console.log(`[Chat] ✅ Session created: ${sessionId}`);
              
              // Send notification to both users about successful connection
              // Current user who searched becomes the initiator (creates offer)
              ws.send(JSON.stringify({
                type: 'matched',
                isInitiator: true,
                peer: {
                  walletAddress: matchedPeerWallet,
                  gender: matchedPeerUser.gender,
                  country: matchedPeerUser.country,
                  city: matchedPeerUser.city,
                  area: matchedPeerUser.area
                }
              }));
              
              // Matched peer becomes the receiver (waits for offer, creates answer)
              matchedPeerUser.ws.send(JSON.stringify({
                type: 'matched',
                isInitiator: false,
                peer: {
                  walletAddress: userWallet,
                  gender: currentUser.gender,
                  country: currentUser.country,
                  city: currentUser.city,
                  area: currentUser.area
                }
              }));
              
              console.log(`[Chat] Successfully matched: ${userWallet} <-> ${matchedPeerWallet}`);
              
              // Broadcast updated online users and counts
              broadcastOnlineCount();
              broadcastOnlineUsers();
            } else {
              // No peers available - keep searching
              ws.send(JSON.stringify({
                type: 'searching',
                message: 'Looking for available users...'
              }));
            }
            break;
            
          case 'stop_search':
            if (!userWallet) return;
            searchingUsers.delete(userWallet);
            const stopUser = chatUsers.get(userWallet);
            if (stopUser) {
              stopUser.isSearching = false;
            }
            console.log(`[Chat] User ${userWallet} stopped searching. Total searching: ${searchingUsers.size}`);
            break;
            
          case 'message':
          case 'chat_message':
            if (!userWallet || (!data.text && !data.message)) return;
            const messageText = data.text || data.message;
            const connectedPeer = activeConnections.get(userWallet);
            if (connectedPeer) {
              // Send message to connected peer
              const peerUser = chatUsers.get(connectedPeer);
              if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
                peerUser.ws.send(JSON.stringify({
                  type: 'chat_message',
                  message: messageText,
                  sender: 'stranger'
                }));
              }
            }
            break;
            
          case 'offer':
          case 'webrtc_offer':
            if (!userWallet) return;
            const offerPeer = activeConnections.get(userWallet);
            if (offerPeer) {
              // Relay offer to connected peer
              const offerUser = chatUsers.get(offerPeer);
              if (offerUser && offerUser.ws.readyState === WebSocket.OPEN) {
                offerUser.ws.send(JSON.stringify({
                  type: 'webrtc_offer',
                  offer: data.offer
                }));
                console.log(`[WebRTC] Relayed offer from ${userWallet} to ${offerPeer}`);
              }
            }
            break;
            
          case 'answer':
          case 'webrtc_answer':
            if (!userWallet) return;
            const answerPeer = activeConnections.get(userWallet);
            if (answerPeer) {
              const answerUser = chatUsers.get(answerPeer);
              if (answerUser && answerUser.ws.readyState === WebSocket.OPEN) {
                answerUser.ws.send(JSON.stringify({
                  type: 'webrtc_answer',
                  answer: data.answer
                }));
                console.log(`[WebRTC] Relayed answer from ${userWallet} to ${answerPeer}`);
              }
            }
            break;
            
          case 'ice-candidate':
          case 'webrtc_ice_candidate':
            if (!userWallet) return;
            const icePeer = activeConnections.get(userWallet);
            if (icePeer) {
              const iceUser = chatUsers.get(icePeer);
              if (iceUser && iceUser.ws.readyState === WebSocket.OPEN) {
                iceUser.ws.send(JSON.stringify({
                  type: 'webrtc_ice_candidate',
                  candidate: data.candidate
                }));
                console.log(`[WebRTC] Relayed ICE candidate from ${userWallet} to ${icePeer}`);
              }
            }
            break;
            
          case 'video_call_start':
            if (!userWallet) return;
            const videoPeer = activeConnections.get(userWallet);
            if (videoPeer) {
              const videoPeerUser = chatUsers.get(videoPeer);
              if (videoPeerUser && videoPeerUser.ws.readyState === WebSocket.OPEN) {
                console.log(`[Chat] Video call started from ${userWallet} to ${videoPeer} (audio: ${data.hasAudio})`);
                videoPeerUser.ws.send(JSON.stringify({
                  type: 'video_call_incoming',
                  hasAudio: data.hasAudio
                }));
              }
            }
            break;
            
          case 'video_call_accept':
            if (!userWallet) return;
            const acceptPeer = activeConnections.get(userWallet);
            if (acceptPeer) {
              const acceptPeerUser = chatUsers.get(acceptPeer);
              if (acceptPeerUser && acceptPeerUser.ws.readyState === WebSocket.OPEN) {
                console.log(`[Chat] Video call accepted from ${userWallet} to ${acceptPeer}`);
                acceptPeerUser.ws.send(JSON.stringify({
                  type: 'video_call_accepted'
                }));
              }
            }
            break;
            
          case 'video_call_decline':
            if (!userWallet) return;
            const declinePeer = activeConnections.get(userWallet);
            if (declinePeer) {
              const declinePeerUser = chatUsers.get(declinePeer);
              if (declinePeerUser && declinePeerUser.ws.readyState === WebSocket.OPEN) {
                declinePeerUser.ws.send(JSON.stringify({
                  type: 'video_call_declined'
                }));
              }
            }
            break;
          
          case 'find_next':
            // User clicked "Next" button - disconnect and search again
            if (!userWallet) return;
            
            const nextCurrentUser = chatUsers.get(userWallet);
            if (!nextCurrentUser) return;
            
            // CRITICAL: Clean up session FIRST
            const currentSessionId = userToSession.get(userWallet);
            if (currentSessionId) {
              const session = activeSessions.get(currentSessionId);
              if (session) {
                const peer = session.user1 === userWallet ? session.user2 : session.user1;
                
                // Remove from session tracking for BOTH users
                userToSession.delete(userWallet);
                userToSession.delete(peer);
                activeSessions.delete(currentSessionId);
                
                console.log(`[Chat] 🧹 Cleaned up session: ${currentSessionId}`);
                
                // Notify peer that user left
                const nextPeerUser = chatUsers.get(peer);
                if (nextPeerUser && nextPeerUser.ws.readyState === WebSocket.OPEN) {
                  console.log(`[Chat] User ${userWallet} clicked Next, notifying peer ${peer}`);
                  nextPeerUser.ws.send(JSON.stringify({
                    type: 'peer_disconnected',
                    message: 'Stranger disconnected'
                  }));
                  
                  // Auto-restart peer's search (Monkey.app style)
                  nextPeerUser.isSearching = true;
                  console.log(`[Chat] Peer ${peer} auto-searching for new match`);
                }
                
                // Remove legacy connection
                activeConnections.delete(userWallet);
                activeConnections.delete(peer);
              }
            }
            
            // Start searching for next match
            nextCurrentUser.isSearching = true;
            
            // Use filter-aware matching
            const nextMatchResult = findFilterMatch(userWallet, { gender: nextCurrentUser.gender });
            
            if (nextMatchResult && nextMatchResult.user.ws.readyState === WebSocket.OPEN) {
              const newMatchWallet = nextMatchResult.wallet;
              const newMatchUser = nextMatchResult.user;
              
              // Create new session
              const newSessionId = `${userWallet}_${newMatchWallet}_${Date.now()}`;
              const newSession: ActiveSession = {
                user1: userWallet,
                user2: newMatchWallet,
                startedAt: Date.now()
              };
              
              // Add to session tracking
              activeSessions.set(newSessionId, newSession);
              userToSession.set(userWallet, newSessionId);
              userToSession.set(newMatchWallet, newSessionId);
              
              // Create connection (legacy support)
              activeConnections.set(userWallet, newMatchWallet);
              activeConnections.set(newMatchWallet, userWallet);
              
              nextCurrentUser.isSearching = false;
              newMatchUser.isSearching = false;
              
              console.log(`[Chat] ✅ New session created: ${newSessionId}`);
              
              // Notify both users
              ws.send(JSON.stringify({
                type: 'matched',
                isInitiator: true,
                peer: {
                  walletAddress: newMatchWallet,
                  gender: newMatchUser.gender,
                  country: newMatchUser.country,
                  city: newMatchUser.city,
                  area: newMatchUser.area
                }
              }));
              
              newMatchUser.ws.send(JSON.stringify({
                type: 'matched',
                isInitiator: false,
                peer: {
                  walletAddress: userWallet,
                  gender: nextCurrentUser.gender,
                  country: nextCurrentUser.country,
                  city: nextCurrentUser.city,
                  area: nextCurrentUser.area
                }
              }));
              
              console.log(`[Chat] Successfully matched (Next): ${userWallet} <-> ${newMatchWallet}`);
            } else {
              // No match found, keep searching
              ws.send(JSON.stringify({
                type: 'searching',
                message: 'Looking for available users...'
              }));
            }
            break;
          
          case 'user_left':
            if (!userWallet) return;
            const leftPeer = activeConnections.get(userWallet);
            if (leftPeer) {
              // Notify peer
              const leftPeerUser = chatUsers.get(leftPeer);
              if (leftPeerUser && leftPeerUser.ws.readyState === WebSocket.OPEN) {
                console.log(`[Chat] User ${userWallet} left, notifying peer ${leftPeer}`);
                leftPeerUser.ws.send(JSON.stringify({
                  type: 'user_left'
                }));
                
                // CRITICAL FIX: Auto-restart peer's search so they can match with 3rd person
                const peerData = chatUsers.get(leftPeer);
                if (peerData) {
                  peerData.isSearching = true;
                  // Re-add peer to search pool immediately
                  searchingUsers.set(leftPeer, {
                    wallet: leftPeer,
                    filters: peerData.gender ? { gender: peerData.gender } : {},
                    location: { 
                      country: peerData.country, 
                      city: peerData.city, 
                      area: peerData.area 
                    },
                    tasBalance: 0,
                    hasAdvancedFilters: false,
                    timestamp: Date.now()
                  });
                  console.log(`[Chat] ✅ Auto-restarted search for ${leftPeer} after partner left`);
                }
              }
              
              // Clean up BOTH directions
              activeConnections.delete(userWallet);
              activeConnections.delete(leftPeer);
              
              // Remove user who left from searching
              searchingUsers.delete(userWallet);
            }
            break;
            
          case 'end_call':
            if (!userWallet) return;
            const endCallPeer = activeConnections.get(userWallet);
            if (endCallPeer) {
              // Notify peer
              const endCallPeerUser = chatUsers.get(endCallPeer);
              if (endCallPeerUser && endCallPeerUser.ws.readyState === WebSocket.OPEN) {
                endCallPeerUser.ws.send(JSON.stringify({
                  type: 'call_ended'
                }));
              }
              // Clean up BOTH directions
              activeConnections.delete(userWallet);
              activeConnections.delete(endCallPeer);
            } else {
              // No peer, just clean up user's connection
              activeConnections.delete(userWallet);
            }
            break;
            
          case 'unwatch_token':
            const unwatchTokenId = data.tokenId;
            if (unwatchTokenId) {
              watchingTokens.delete(unwatchTokenId);
              tokenPriceWatchers.get(unwatchTokenId)?.delete(ws);
              if (tokenPriceWatchers.get(unwatchTokenId)?.size === 0) {
                tokenPriceWatchers.delete(unwatchTokenId);
              }
            }
            break;
            
          default:
            console.log(`[WebSocket] Unknown message type: ${data.type}`);
        }
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error);
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] Connection closed');
      
      // Remove from price watchers
      watchingTokens.forEach(tokenId => {
        tokenPriceWatchers.get(tokenId)?.delete(ws);
        if (tokenPriceWatchers.get(tokenId)?.size === 0) {
          tokenPriceWatchers.delete(tokenId);
        }
      });
      
      // Remove from chat users if this is a chat user
      if (userWallet) {
        // CRITICAL: Clean up session FIRST
        const sessionId = userToSession.get(userWallet);
        if (sessionId) {
          const session = activeSessions.get(sessionId);
          if (session) {
            const peer = session.user1 === userWallet ? session.user2 : session.user1;
            
            console.log(`[Chat] 🧹 Cleaning up session ${sessionId} due to disconnect`);
            
            // Remove session for BOTH users
            userToSession.delete(userWallet);
            userToSession.delete(peer);
            activeSessions.delete(sessionId);
            
            // Notify peer
            const peerUser = chatUsers.get(peer);
            if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
              peerUser.ws.send(JSON.stringify({
                type: 'peer_disconnected'
              }));
              
              // Auto-restart peer's search so they can match with 3rd person
              peerUser.isSearching = true;
              console.log(`[Chat] ✅ Auto-restarted search for ${peer} after peer disconnected`);
            }
            
            // Clean up legacy connections (both directions)
            activeConnections.delete(userWallet);
            activeConnections.delete(peer);
          }
        }
        
        // Remove user from chat users and searching
        chatUsers.delete(userWallet);
        searchingUsers.delete(userWallet);
        
        // Update online count for remaining users
        broadcastOnlineCount();
        broadcastOnlineUsers();
      }
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });
  });
  
  // Price update functions - DISABLED
  // function updateTokenPrices() {
  //   console.log('[WebSocket] Updating token prices');
  //   tokenPriceWatchers.forEach((clients, tokenId) => {
  //     clients.forEach((client) => {
  //       if (client.readyState === WebSocket.OPEN) {
  //         client.send(JSON.stringify({
  //           type: 'price_update',
  //           tokenId: tokenId,
  //           price: Math.random() * 0.001
  //         }));
  //       }
  //     });
  //   });
  // }

  // DISABLED: Token price updates
  // setInterval(updateTokenPrices, PRICE_UPDATE_INTERVAL);

  function broadcastTokenPrice(token: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'price_update',
          tokenId: token.id,
          price: token.price
        }));
      }
    });
  }

  return httpServer;
}