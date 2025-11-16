import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  walletConnectSchema, 
  customTokenSchema,
  tokenRegistrationSchema,
  findMatchesSchema,
  insertMessageSchema,
  type Token
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { tokenColors, getTokenColors } from "@/lib/tokens";
import registerDeployRoutes from "./deploy";
import explorerRoutes from "./explorer";
import { priceOracle } from "./services/priceOracle";
import { blockchainListener } from "./services/blockchainListener";
import { communityStats } from "./services/communityStats";
import priceRoutes from "./price-routes";
import blockchainRoutes from "./blockchain-routes";
import communityRoutes from "./community-routes";
import walletRoutes from "./wallet-routes";
import adminRoutes from "./admin-routes";
import { ethers } from "ethers";

// This keeps track of active WebSocket connections by user ID
const userConnections = new Map<number, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Register deployment routes
  registerDeployRoutes(app);
  
  // Register explorer routes (blockchain explorer)
  app.use('/api/explorer', explorerRoutes);
  
  // Register price API routes
  app.use(priceRoutes);
  
  // Register blockchain API routes
  app.use(blockchainRoutes);
  
  // Register community and user profile API routes
  app.use(communityRoutes);
  
  // Register wallet API routes
  app.use(walletRoutes);
  
  // Register admin API routes
  app.use(adminRoutes);
  
  // Set up WebSocket server with improved performance
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  

  
  // Initialize price oracle with WebSocket server
  priceOracle.initWebSocket(wss);
  priceOracle.start();
  
  // Initialize blockchain listener with WebSocket server
  blockchainListener.initWebSocketServer(wss);
  
  // Connect to BSC blockchain and start listening for TASnative contract events
  const BSC_RPC_URL = process.env.BSC_RPC_URL || 'wss://bsc-testnet.publicnode.com';
  blockchainListener.initialize(BSC_RPC_URL)
    .then(success => {
      if (success) {
        console.log('[Blockchain] Successfully connected to BSC');
        blockchainListener.startListening();
      } else {
        console.error('[Blockchain] Failed to connect to BSC');
      }
    });

  // Chat functionality integrated into main WebSocket server
  const chatUsers = new Map<string, { ws: WebSocket, walletAddress: string, isSearching: boolean }>();
  const searchingUsers = new Map<string, { wallet: string, filters: any, location: any, tasBalance: number, hasAdvancedFilters: boolean, timestamp: number }>();
  const activeConnections = new Map<string, string>(); // Maps user1 to user2 and vice versa

  // Broadcast online user count to all connected users
  const broadcastOnlineCount = () => {
    const onlineCount = chatUsers.size;
    console.log(`[Chat] Broadcasting online count: ${onlineCount} users`);
    chatUsers.forEach(user => {
      if (user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(JSON.stringify({
          type: 'online_count',
          count: onlineCount
        }));
      }
    });
  };

  // Unified WebSocket connection handler
  wss.on('connection', (ws) => {
    let userWallet: string | null = null;
    let userId: number | null = null;
    let isTokenUser = false;
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
            chatUsers.set(userWallet, { ws, walletAddress: userWallet, isSearching: false });
            console.log(`[Chat] User registered: ${userWallet}. Total users: ${chatUsers.size}`);
            broadcastOnlineCount();
            
            // Send registration confirmation
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
              
              // Add to price watchers
              if (!tokenPriceWatchers.has(tokenId)) {
                tokenPriceWatchers.set(tokenId, new Set());
              }
              tokenPriceWatchers.get(tokenId)!.add(ws);
            }
            break;
            
          case 'join_chat':
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
            
            // Store user search data
            searchingUsers.set(userWallet, {
              wallet: userWallet,
              filters,
              location: userLocation,
              tasBalance,
              hasAdvancedFilters,
              timestamp: Date.now()
            });
            
            // Mark user as searching
            const user = chatUsers.get(userWallet);
            if (user) {
              user.isSearching = true;
            }
            
            console.log(`[Chat] User ${userWallet} started searching. Total searching: ${searchingUsers.size}`);
            console.log(`[Chat] Search data received:`, { filters, location: userLocation, tasBalance, hasAdvancedFilters });
            
            // Try to find a compatible peer immediately
            const availablePeers = Array.from(searchingUsers.entries())
              .filter(([wallet, searchData]) => wallet !== userWallet);
            
            if (availablePeers.length > 0) {
              // Find the first available peer
              const [peerWallet, peerSearchData] = availablePeers[0];
              const peerUser = chatUsers.get(peerWallet);
              
              if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
                // Create connection between users
                activeConnections.set(userWallet, peerWallet);
                activeConnections.set(peerWallet, userWallet);
                
                // Remove from searching
                searchingUsers.delete(userWallet);
                searchingUsers.delete(peerWallet);
                
                if (user) user.isSearching = false;
                peerUser.isSearching = false;
                
                console.log(`[Chat] Connected ${userWallet} with ${peerWallet}`);
                
                // Notify both users with auto video start
                ws.send(JSON.stringify({
                  type: 'peer_found',
                  peerId: peerWallet,
                  peerWallet: peerWallet,
                  peerLocation: peerSearchData.location
                }));
                
                peerUser.ws.send(JSON.stringify({
                  type: 'peer_found',
                  peerId: userWallet,
                  peerWallet: userWallet,
                  peerLocation: userLocation
                }));
                
                // Auto-start video for both users
                setTimeout(() => {
                  if (user && user.ws.readyState === WebSocket.OPEN) {
                    user.ws.send(JSON.stringify({
                      type: 'auto_start_video'
                    }));
                  }
                  if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
                    peerUser.ws.send(JSON.stringify({
                      type: 'auto_start_video'
                    }));
                  }
                }, 1000);
                
              } else {
                // Clean up invalid peer
                searchingUsers.delete(peerWallet);
                chatUsers.delete(peerWallet);
                console.log(`[Chat] No other users searching, waiting for peers...`);
              }
            } else {
              console.log(`[Chat] No other users searching, waiting for peers...`);
            }
            break;

          case 'stop_search':
            if (!userWallet) return;
            
            searchingUsers.delete(userWallet);
            const searchUser = chatUsers.get(userWallet);
            if (searchUser) {
              searchUser.isSearching = false;
            }
            console.log(`[Chat] User ${userWallet} stopped searching`);
            break;

          case 'message':
            if (!userWallet) return;
            
            const connectedPeer = activeConnections.get(userWallet);
            if (connectedPeer) {
              const peerUser = chatUsers.get(connectedPeer);
              if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
                const messageId = `${Date.now()}-${Math.random()}`;
                peerUser.ws.send(JSON.stringify({
                  type: 'message',
                  text: data.text,
                  messageId: messageId,
                  senderWallet: userWallet
                }));
                console.log(`[Chat] Message sent from ${userWallet} to ${connectedPeer}`);
              }
            }
            break;

          case 'webrtc_offer':
            if (!userWallet) return;
            const offerPeer = activeConnections.get(userWallet);
            if (offerPeer) {
              const peerUser = chatUsers.get(offerPeer);
              if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
                peerUser.ws.send(JSON.stringify({
                  type: 'webrtc_offer',
                  offer: data.offer
                }));
                console.log(`[WebRTC] Offer sent from ${userWallet} to ${offerPeer}`);
              }
            }
            break;

          case 'webrtc_answer':
            if (!userWallet) return;
            const answerPeer = activeConnections.get(userWallet);
            if (answerPeer) {
              const peerUser = chatUsers.get(answerPeer);
              if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
                peerUser.ws.send(JSON.stringify({
                  type: 'webrtc_answer',
                  answer: data.answer
                }));
                console.log(`[WebRTC] Answer sent from ${userWallet} to ${answerPeer}`);
              }
            }
            break;

          case 'webrtc_ice_candidate':
            if (!userWallet) return;
            const icePeer = activeConnections.get(userWallet);
            if (icePeer) {
              const peerUser = chatUsers.get(icePeer);
              if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
                peerUser.ws.send(JSON.stringify({
                  type: 'webrtc_ice_candidate',
                  candidate: data.candidate
                }));
                console.log(`[WebRTC] ICE candidate sent from ${userWallet} to ${icePeer}`);
              }
            }
            break;

          case 'disconnect':
            if (!userWallet) return;
            
            const disconnectedPeer = activeConnections.get(userWallet);
            if (disconnectedPeer) {
              const peerUser = chatUsers.get(disconnectedPeer);
              if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
                peerUser.ws.send(JSON.stringify({
                  type: 'peer_disconnected'
                }));
              }
              
              // Clean up connections
              activeConnections.delete(userWallet);
              activeConnections.delete(disconnectedPeer);
              console.log(`[Chat] Disconnected ${userWallet} from ${disconnectedPeer}`);
            }
            break;

          case 'video_call_start':
            if (!userWallet) return;
            
            const videoPeer = activeConnections.get(userWallet);
            if (videoPeer) {
              const peerUser = chatUsers.get(videoPeer);
              if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
                peerUser.ws.send(JSON.stringify({
                  type: 'video_call_start'
                }));
              }
            }
            break;
        }
      } catch (error) {
        console.error('[Chat] Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      if (userWallet) {
        console.log(`[Chat] User ${userWallet} disconnected`);
        
        // Clean up user data
        chatUsers.delete(userWallet);
        searchingUsers.delete(userWallet);
        
        // Notify connected peer
        const connectedPeer = activeConnections.get(userWallet);
        if (connectedPeer) {
          const peerUser = chatUsers.get(connectedPeer);
          if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
            peerUser.ws.send(JSON.stringify({
              type: 'peer_disconnected'
            }));
          }
          
          // Clean up connections
          activeConnections.delete(userWallet);
          activeConnections.delete(connectedPeer);
        }
        
        // Update online count for remaining users
        broadcastOnlineCount();
      }
    });

    ws.on('error', (error) => {
      console.error('[Chat] WebSocket error:', error);
    });
  });
  
  // Track users watching specific token prices
  const tokenPriceWatchers = new Map<number, Set<WebSocket>>();
  
  // Token price update interval (30 seconds)
  const PRICE_UPDATE_INTERVAL = 30000;
  
  // Price update function
  function updateTokenPrices() {
    console.log('[WebSocket] Updating token prices');
    tokenPriceWatchers.forEach((clients, tokenId) => {
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          // Send updated price for the token they're watching
          client.send(JSON.stringify({
            type: 'price_update',
            tokenId: tokenId,
            price: Math.random() * 0.001 // Mock price for now
          }));
        }
      });
    });
  }
  
  // Start price update interval
  setInterval(updateTokenPrices, PRICE_UPDATE_INTERVAL);
  
  // Broadcast token price updates to all WebSocket clients
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
          chatUsers.delete(userWallet);
          searchingUsers.delete(userWallet);
          
          // Handle peer disconnection
          const connectedPeer = activeConnections.get(userWallet);
          if (connectedPeer) {
            const peerUser = chatUsers.get(connectedPeer);
            if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
              peerUser.ws.send(JSON.stringify({
                type: 'peer_disconnected'
              }));
            }
            
            // Clean up connections
            activeConnections.delete(userWallet);
            activeConnections.delete(connectedPeer);
          }
          
          // Update online count for remaining users
          broadcastOnlineCount();
        }
      });

      ws.on('error', (error) => {
        console.error('[Chat] WebSocket error:', error);
      });
    });
  
  // Price update functions
  function updateTokenPrices() {
    console.log('[WebSocket] Updating token prices');
    tokenPriceWatchers.forEach((clients, tokenId) => {
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'price_update',
            tokenId: tokenId,
            price: Math.random() * 0.001
          }));
        }
      });
    });
  }

  setInterval(updateTokenPrices, PRICE_UPDATE_INTERVAL);

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
            if (connectedPeer) {
              const peerUser = chatUsers.get(connectedPeer);
              if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
                peerUser.ws.send(JSON.stringify({
                  type: 'message',
                  text: data.text,
                  sender: 'stranger',
                  messageId: data.messageId
                }));
              }
            }
            break;
            
          case 'offer':
          case 'answer':
          case 'ice-candidate':
            if (!userWallet) return;
            const targetPeer = activeConnections.get(userWallet);
            if (targetPeer) {
              const targetUser = chatUsers.get(targetPeer);
              if (targetUser && targetUser.ws.readyState === WebSocket.OPEN) {
                targetUser.ws.send(JSON.stringify({
                  type: data.type,
                  data: data.data
                }));
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
            
          case 'end_call':
            if (!userWallet) return;
            const endCallPeer = activeConnections.get(userWallet);
            if (endCallPeer) {
              const endCallPeerUser = chatUsers.get(endCallPeer);
              if (endCallPeerUser && endCallPeerUser.ws.readyState === WebSocket.OPEN) {
                endCallPeerUser.ws.send(JSON.stringify({
                  type: 'call_ended'
                }));
              }
            }
            
            // Clean up connections
            activeConnections.delete(userWallet);
            activeConnections.delete(endCallPeer || '');
              activeConnections.set(peerWallet, userWallet);
              
              searchingUsers.delete(userWallet);
              searchingUsers.delete(peerWallet);
              if (user) user.isSearching = false;
              peerUser.isSearching = false;
              
              ws.send(JSON.stringify({
                type: 'peer_found',
                peerId: peerWallet,
                peerWallet: peerWallet
              }));
              
              peerUser.ws.send(JSON.stringify({
                type: 'peer_found',
                peerId: userWallet,
                peerWallet: userWallet
              }));
              
              // Auto-start video call when users connect
              setTimeout(() => {
                ws.send(JSON.stringify({
                  type: 'auto_start_video'
                }));
                peerUser.ws.send(JSON.stringify({
                  type: 'auto_start_video'
                }));
              }, 1000);
              
              console.log(`[Chat] Connected ${userWallet} with ${peerWallet}`);
            }
          } else {
            console.log(`[Chat] No other users searching, waiting for peers...`);
            
            ws.send(JSON.stringify({
              type: 'searching',
              message: 'Looking for someone to chat with...'
            }));
          }
        }
        // Handle chat messages for Trade N Talk
        else if (data.type === 'message' && userWallet && data.text) {
          const connectedPeer = activeConnections.get(userWallet);
          if (connectedPeer) {
            const peerUser = chatUsers.get(connectedPeer);
            if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
              // Only send to the connected peer, not back to sender
              peerUser.ws.send(JSON.stringify({
                type: 'message',
                text: data.text,
                messageId: data.messageId || Date.now().toString(), // Include message ID
                sender: 'stranger'
              }));
              console.log(`[Chat] Message sent from ${userWallet} to ${connectedPeer}: ${data.text}`);
            }
          }
        }
        // Handle WebRTC signaling for Trade N Talk
        else if (data.type === 'webrtc_offer' && userWallet) {
          const connectedPeer = activeConnections.get(userWallet);
          if (connectedPeer) {
            const peerUser = chatUsers.get(connectedPeer);
            if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
              peerUser.ws.send(JSON.stringify({
                type: 'webrtc_offer',
                offer: data.offer,
                hasAudio: data.hasAudio || false
              }));
              console.log(`[WebRTC] Offer sent from ${userWallet} to ${connectedPeer}`);
            }
          }
        }
        else if (data.type === 'webrtc_answer' && userWallet) {
          const connectedPeer = activeConnections.get(userWallet);
          if (connectedPeer) {
            const peerUser = chatUsers.get(connectedPeer);
            if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
              peerUser.ws.send(JSON.stringify({
                type: 'webrtc_answer',
                answer: data.answer
              }));
              console.log(`[WebRTC] Answer sent from ${userWallet} to ${connectedPeer}`);
            }
          }
        }
        else if (data.type === 'ice_candidate' && userWallet) {
          const connectedPeer = activeConnections.get(userWallet);
          if (connectedPeer) {
            const peerUser = chatUsers.get(connectedPeer);
            if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
              peerUser.ws.send(JSON.stringify({
                type: 'ice_candidate',
                candidate: data.candidate
              }));
              console.log(`[WebRTC] ICE candidate sent from ${userWallet} to ${connectedPeer}`);
            }
          }
        }
        // Handle video call messages for Trade N Talk
        else if (data.type === 'video_call_start' && userWallet) {
          const connectedPeer = activeConnections.get(userWallet);
          if (connectedPeer) {
            const peerUser = chatUsers.get(connectedPeer);
            if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
              peerUser.ws.send(JSON.stringify({
                type: 'video_call_incoming',
                hasAudio: data.hasAudio
              }));
              console.log(`[Chat] Video call started from ${userWallet} to ${connectedPeer} (audio: ${data.hasAudio})`);
            }
          }
        }
        else if (data.type === 'video_call_accept' && userWallet) {
          const connectedPeer = activeConnections.get(userWallet);
          if (connectedPeer) {
            const peerUser = chatUsers.get(connectedPeer);
            if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
              peerUser.ws.send(JSON.stringify({
                type: 'video_call_accepted'
              }));
              console.log(`[Chat] Video call accepted from ${userWallet} to ${connectedPeer}`);
            }
          }
        }
        else if (data.type === 'video_call_end' && userWallet) {
          const connectedPeer = activeConnections.get(userWallet);
          if (connectedPeer) {
            const peerUser = chatUsers.get(connectedPeer);
            if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
              peerUser.ws.send(JSON.stringify({
                type: 'video_call_ended'
              }));
              console.log(`[Chat] Video call ended from ${userWallet} to ${connectedPeer}`);
            }
          }
        }
        // Handle disconnection for Trade N Talk
        else if (data.type === 'disconnect' && userWallet) {
          const disconnectedPeer = activeConnections.get(userWallet);
          if (disconnectedPeer) {
            const peerUser = chatUsers.get(disconnectedPeer);
            if (peerUser && peerUser.ws.readyState === WebSocket.OPEN) {
              peerUser.ws.send(JSON.stringify({
                type: 'peer_disconnected'
              }));
            }
            
            activeConnections.delete(userWallet);
            activeConnections.delete(disconnectedPeer);
            console.log(`[Chat] Disconnected ${userWallet} from ${disconnectedPeer}`);
          }
        }
        // Handle existing token authentication
        else if (data.type === 'auth' && data.userId) {
          userId = parseInt(data.userId);
          if (!isNaN(userId)) {
            console.log(`[WebSocket] User ${userId} authenticated`);
            userConnections.set(userId, ws);
            
            // Update user's online status
            await storage.updateUserOnlineStatus(userId, true);
            
            // Broadcast to all users that this user is online
            broadcastUserStatus(userId, true);
            
            // Welcome message with connection info
            ws.send(JSON.stringify({
              type: 'auth_success',
              userId,
              message: 'Authentication successful',
              serverTime: new Date().toISOString()
            }));
          }
        } else if (data.type === 'chat_message' && userId && data.contactId && data.message) {
          // Handle chat message
          console.log(`[WebSocket] Chat message from user ${userId} to user ${data.contactId}`);
          const messageData = {
            senderId: userId,
            receiverId: data.contactId,
            text: data.message,
            timestamp: new Date().toISOString()
          };
          
          // Store message in database
          const chatId = await storage.getChatIdForUsers(userId, data.contactId);
          if (chatId) {
            await storage.addMessage({
              chatId,
              userId,
              text: data.message
            });
            
            // Send message to recipient if they are online
            const recipientWs = userConnections.get(data.contactId);
            if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
              recipientWs.send(JSON.stringify({
                type: 'chat_message',
                message: messageData
              }));
            }
          }
        } else if (data.type === 'watch_token' && data.tokenId) {
          // Add user to watchers for this token
          const tokenId = parseInt(data.tokenId);
          if (!isNaN(tokenId)) {
            console.log(`[WebSocket] User watching token ${tokenId}`);
            watchingTokens.add(tokenId);
            
            if (!tokenPriceWatchers.has(tokenId)) {
              tokenPriceWatchers.set(tokenId, new Set());
            }
            
            tokenPriceWatchers.get(tokenId)?.add(ws);
            
            // Send immediate token data
            const token = await storage.getToken(tokenId);
            if (token) {
              ws.send(JSON.stringify({
                type: 'token_update',
                token: {
                  id: token.id,
                  price: token.price,
                  change24h: ((Math.random() * 10) - 5).toFixed(2), // Random change for demo
                  volume24h: token.price * 100000 * (1 + Math.random()),
                  timestamp: Date.now()
                }
              }));
            }
          }
        } else if (data.type === 'unwatch_token' && data.tokenId) {
          // Remove user from watchers for this token
          const tokenId = parseInt(data.tokenId);
          if (!isNaN(tokenId)) {
            console.log(`[WebSocket] User stopped watching token ${tokenId}`);
            watchingTokens.delete(tokenId);
            tokenPriceWatchers.get(tokenId)?.delete(ws);
            
            // Clean up empty sets
            if (tokenPriceWatchers.get(tokenId)?.size === 0) {
              tokenPriceWatchers.delete(tokenId);
            }
          }
        } else if (data.type === 'trade' && userId && data.tokenId && data.amount && data.tradeType) {
          // Process token trade
          console.log(`[WebSocket] Trade request from user ${userId} for token ${data.tokenId}`);
          
          try {
            // In production, this would actually execute the trade on-chain
            // For demo, we'll just simulate trade confirmation
            
            const tokenId = parseInt(data.tokenId);
            const token = await storage.getToken(tokenId);
            
            if (token) {
              const tradeResponse = {
                type: 'trade_confirmation',
                success: true,
                tradeId: Date.now().toString(),
                trade: {
                  tokenId,
                  tokenSymbol: token.symbol,
                  amount: data.amount,
                  price: token.price,
                  total: token.price * data.amount,
                  tradeType: data.tradeType,
                  timestamp: new Date().toISOString(),
                  status: 'completed'
                }
              };
              
              // Send trade confirmation to the user
              ws.send(JSON.stringify(tradeResponse));
              
              // Broadcast price update to all watchers after trade
              broadcastTokenPrice(token);
            }
          } catch (tradeError) {
            ws.send(JSON.stringify({
              type: 'trade_error',
              message: 'Failed to execute trade',
              details: tradeError instanceof Error ? tradeError.message : 'Unknown error'
            }));
          }
        }
      } catch (error) {
        console.error("[WebSocket] Message parsing error:", error);
        
        // Send error message back to client
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
          details: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    });
    
    // Setup ping/pong for connection health monitoring
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);
    
    ws.on('close', async () => {
      console.log(`[WebSocket] Connection closed ${userId ? `for user ${userId}` : ''}`);
      clearInterval(pingInterval);
      
      if (userId !== null) {
        userConnections.delete(userId);
        
        // Update user's online status
        await storage.updateUserOnlineStatus(userId, false);
        
        // Broadcast to all users that this user is offline
        broadcastUserStatus(userId, false);
      }
      
      // Remove from token watchers
      watchingTokens.forEach(tokenId => {
        tokenPriceWatchers.get(tokenId)?.delete(ws);
        if (tokenPriceWatchers.get(tokenId)?.size === 0) {
          tokenPriceWatchers.delete(tokenId);
        }
      });
    });
    
    // Handle errors
    ws.on('error', (err) => {
      console.error("[WebSocket] Connection error:", err);
    });
  });
  
  // Function to broadcast token price updates
  function broadcastTokenPrice(token: any) {
    const priceUpdate = JSON.stringify({
      type: 'token_update',
      token: {
        id: token.id,
        price: token.price,
        change24h: ((Math.random() * 10) - 5).toFixed(2), // Random change for demo
        volume24h: token.price * 100000 * (1 + Math.random()),
        timestamp: Date.now()
      }
    });
    
    const watchers = tokenPriceWatchers.get(token.id);
    if (watchers) {
      watchers.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(priceUpdate);
        }
      });
    }
  }
  
  // Listen for token price updates from the price oracle
  priceOracle.on('tokenPriceUpdated', async ({ id, price }) => {
    try {
      const token = await storage.getToken(id);
      if (token) {
        // Update token price from price oracle
        token.price = price;
        
        // Broadcast the updated price
        broadcastTokenPrice(token);
      }
    } catch (error) {
      console.error(`[Price Oracle] Error broadcasting token ${id} price update:`, error);
    }
  });
  
  // Set up interval for token price updates (only for non-native tokens)
  setInterval(async () => {
    console.log('[WebSocket] Updating token prices');
    
    // Convert keys to array first to avoid iterator issues
    const tokenIds = Array.from(tokenPriceWatchers.keys());
    
    for (const tokenId of tokenIds) {
      try {
        const token = await storage.getToken(tokenId);
        if (token && !token.isNative) {
          // For non-native tokens, use simple random price movement
          // Native tokens are handled by the price oracle
          const priceChange = (Math.random() * 0.02) - 0.01; // -1% to +1%
          token.price = Math.max(0.00001, token.price * (1 + priceChange));
          
          // Broadcast the updated price
          broadcastTokenPrice(token);
        }
      } catch (error) {
        console.error(`[WebSocket] Error updating token ${tokenId} price:`, error);
      }
    }
  }, PRICE_UPDATE_INTERVAL);
  
  // Function to broadcast user status changes
  function broadcastUserStatus(userId: number | null, isOnline: boolean) {
    // If userId is null, don't broadcast
    if (userId === null) return;
    
    const statusUpdate = JSON.stringify({
      type: 'user_status',
      userId,
      isOnline
    });
    
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(statusUpdate);
      }
    });
  }
  
  // API Routes
  
  // Authentication routes
  app.get('/api/auth/status', async (req, res) => {
    // In a real app, this would check the user's session
    // For demo purposes, we'll return not logged in
    res.json({
      isLoggedIn: false,
      address: null,
      nickname: null
    });
  });
  
  app.post('/api/auth/connect', async (req, res) => {
    try {
      const data = walletConnectSchema.parse(req.body);
      
      // Check if user exists by wallet address
      let user = await storage.getUserByWalletAddress(data.address);
      
      if (!user) {
        // Create new user with a timestamp to make username unique
        const timestamp = Date.now().toString().slice(-6);
        user = await storage.createUser({
          username: `${data.nickname.toLowerCase().replace(/\s+/g, '_')}_${timestamp}`,
          password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2), // Secure generated password
          nickname: data.nickname,
          walletAddress: data.address,
          walletType: data.walletType
        });
        
        // Check if TAS token already exists, if not create it
        let tasToken = await storage.getTokenBySymbol('TAS');
        
        if (!tasToken) {
          tasToken = await storage.createToken({
            name: 'Talk A Stranger',
            symbol: 'TAS',
            price: 0.01, // Initial price, will be updated via blockchain
            network: 'BSC',
            contractAddress: '0xd9541b134b1821736bd323135b8844d3ae408216', // TAS token contract address
            bg: 'bg-primary-100',
            textColor: 'text-primary-600',
            isNative: true,
            isCustom: false
          });
        }

        // Add TAS token to user's wallet with initial balance
        await storage.addUserToken({
          userId: user.id,
          tokenId: tasToken.id,
          balance: 1000 // Give 1000 TAS tokens initially
        });
      }
      
      // Update user's online status
      await storage.updateUserOnlineStatus(user.id, true);
      
      res.json({
        success: true,
        userId: user.id,
        nickname: user.nickname,
        address: user.walletAddress
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        console.error('Wallet connection error:', error);
        res.status(500).json({ 
          error: 'Failed to connect wallet',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });
  
  app.post('/api/auth/disconnect', async (req, res) => {
    // In a real app, this would invalidate the user's session
    res.json({ success: true });
  });
  
  // Token routes
  app.get('/api/tokens', async (req, res) => {
    try {
      // Get wallet address from query parameter
      const walletAddress = req.query.address as string;
      
      console.log(`[API] Fetching tokens for wallet: ${walletAddress || 'No address provided'}`);
      
      // Return both TAS token and other blockchain tokens
      const allTokens = await storage.getAllTokens();
      
      // Initialize myTokens array
      let myTokens = [];
      
      // Add TAS token first - use real contract data
      const tasToken = allTokens.find(token => token.symbol === 'TAS');
      if (tasToken) {
        myTokens.push({
          id: tasToken.id,
          name: tasToken.name || "TASChain Token",
          symbol: tasToken.symbol || "TAS",
          price: tasToken.price || 0.001,
          balance: 0, // Will be updated from blockchain in frontend
          network: tasToken.network || "Binance Smart Chain",
          contractAddress: tasToken.contractAddress || "0xd9541b134b1821736bd323135b8844d3ae408216",
          bg: tasToken.bg || "bg-primary-100",
          textColor: tasToken.textColor || "text-primary-600",
          isCustom: false
        });
      }
      
      // Add BNB token for trading
      myTokens.push({
        id: 9999, // Using high ID to avoid conflicts
        name: "Binance Coin",
        symbol: "BNB",
        price: 350, // Will be updated from blockchain in frontend
        balance: 0,
        network: "Binance Smart Chain",
        contractAddress: "native", // Native token marker
        bg: "bg-yellow-100",
        textColor: "text-yellow-700",
        isCustom: false
      });
      
      // If a wallet address is provided, we'll try to get real token balances from BSCScan
      if (walletAddress) {
        try {
          // Import the BSCScan service functions
          const { getTokenBalances, getBNBBalance } = await import('./services/bscscanService');
          
          console.log(`[API] Getting all token balances for ${walletAddress} from BSCScan`);
          
          // Get token balances from BSCScan
          const bscTokens = await getTokenBalances(walletAddress);
          const bnbBalance = await getBNBBalance(walletAddress);
          
          console.log(`[API] Found ${bscTokens.length} tokens from BSCScan`);
          
          // Merge known token data with BSCScan data
          const bscTokenAddresses = new Set(bscTokens.map(t => t.tokenAddress.toLowerCase()));
          
          // Update BNB balance
          const bnbIndex = myTokens.findIndex(t => t.symbol === 'BNB');
          if (bnbIndex !== -1 && bnbBalance) {
            myTokens[bnbIndex].balance = parseFloat(bnbBalance.formattedBalance || '0');
          }
          
          // Update TAS token if found
          const tasIndex = myTokens.findIndex(t => t.symbol === 'TAS');
          const bscTasToken = bscTokens.find(t => 
            t.tokenAddress.toLowerCase() === '0xd9541b134b1821736bd323135b8844d3ae408216'.toLowerCase()
          );
          
          if (tasIndex !== -1 && bscTasToken) {
            myTokens[tasIndex].balance = parseFloat(ethers.utils.formatUnits(bscTasToken.balance, parseInt(bscTasToken.decimals)));
          }
          
          // Add any additional tokens from BSCScan that aren't already in our list
          for (const bscToken of bscTokens) {
            // Skip TAS token as we've already handled it
            if (bscToken.tokenAddress.toLowerCase() === '0xd9541b134b1821736bd323135b8844d3ae408216'.toLowerCase()) {
              continue;
            }
            
            // We need to normalize the token data
            const tokenSymbol = bscToken.symbol;
            const formattedBalance = parseFloat(ethers.utils.formatUnits(bscToken.balance, parseInt(bscToken.decimals)));
            
            // Check if this token exists in our database
            const existingToken = allTokens.find(t => 
              t.contractAddress && 
              t.contractAddress.toLowerCase() === bscToken.tokenAddress.toLowerCase()
            );
            
            // If the token exists in our database, use that data and update the balance
            if (existingToken) {
              const existingIndex = myTokens.findIndex(t => 
                t.contractAddress && 
                t.contractAddress.toLowerCase() === bscToken.tokenAddress.toLowerCase()
              );
              
              if (existingIndex !== -1) {
                // Update the balance
                myTokens[existingIndex].balance = formattedBalance;
              } else {
                // Add the token to our list if it has a non-zero balance
                if (formattedBalance > 0) {
                  myTokens.push({
                    id: existingToken.id,
                    name: existingToken.name,
                    symbol: existingToken.symbol,
                    price: existingToken.price || 0.0001,
                    balance: formattedBalance,
                    network: existingToken.network || "Binance Smart Chain",
                    contractAddress: existingToken.contractAddress,
                    bg: existingToken.bg || "bg-blue-100",
                    textColor: existingToken.textColor || "text-blue-700",
                    isCustom: existingToken.isCustom || false
                  });
                }
              }
            } 
            // If token doesn't exist in our database but has a balance, add it as a new token
            else if (formattedBalance > 0) {
              // Generate consistent colors for the token
              const colors = getTokenColors(tokenSymbol);
              
              // Add this token to our response
              myTokens.push({
                id: 10000 + myTokens.length, // Use a high ID to avoid conflicts
                name: bscToken.name || tokenSymbol,
                symbol: tokenSymbol,
                price: 0.0001, // Default price
                balance: formattedBalance,
                network: "Binance Smart Chain",
                contractAddress: bscToken.tokenAddress,
                bg: colors.bg || "bg-blue-100",
                textColor: colors.textColor || "text-blue-700",
                isCustom: true
              });
            }
          }
          
          console.log(`[API] Final token list has ${myTokens.length} tokens`);
        } catch (bscError) {
          console.error('[API] Error fetching from BSCScan:', bscError);
          // Continue with default token list
        }
      }
      
      // Add all other blockchain tokens from database that haven't been added yet
      const createdTokens = allTokens.filter(token => 
        (token.isCustom || token.contractAddress) && 
        token.symbol !== 'TAS' && 
        token.symbol !== 'BNB' &&
        !myTokens.some(t => t.id === token.id)
      );
      
      createdTokens.forEach(token => {
        myTokens.push({
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          price: token.price || 0.0001,
          balance: 0,
          network: token.network || "Binance Smart Chain",
          contractAddress: token.contractAddress || '',
          bg: token.bg || "bg-blue-100",
          textColor: token.textColor || "text-blue-700",
          isCustom: true
        });
      });
      
      // Prepare tokens for popular list
      const popularTokens = createdTokens.map(token => ({
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        price: token.price,
        balance: 0,
        network: token.network || "Binance Smart Chain",
        contractAddress: token.contractAddress || '',
        bg: token.bg,
        textColor: token.textColor,
        isCustom: true
      }));
      
      res.json({
        myTokens,
        popularTokens
      });
    } catch (error) {
      console.error('Error fetching tokens:', error);
      res.status(500).json({ error: 'Failed to fetch tokens' });
    }
  });
  
  app.post('/api/tokens/custom', async (req, res) => {
    try {
      console.log('Received custom token request:', req.body);
      const data = customTokenSchema.parse(req.body);
      
      // Get color scheme based on symbol or use default
      const colors = getTokenColors(data.symbol);
      
      // Create new custom token with improved error handling
      let token;
      try {
        token = await storage.createToken({
          name: data.name,
          symbol: data.symbol.toUpperCase(),
          price: data.initialPrice || 1.0, 
          network: data.network || "BSC",
          contractAddress: data.contractAddress,
          bg: colors.bg,
          textColor: colors.textColor,
          isNative: false,
          isCustom: true
        });
        
        console.log('Successfully created custom token:', token);
        
        // Broadcast the token price to all connected clients
        broadcastTokenPrice(token);
      } catch (dbError) {
        console.error('Error creating token in database:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      res.json({
        success: true,
        token
      });
    } catch (error) {
      console.error('Token creation error:', error);
      if (error instanceof ZodError) {
        res.status(400).json({ 
          error: fromZodError(error).message,
          details: error.errors
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to add custom token',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });
  
  // Test token creation endpoint for debugging
  app.get('/api/tokens/test-create', async (req, res) => {
    try {
      console.log('[Token Creation API TEST] Creating test token');
      
      // Get color scheme for a test token
      const colors = getTokenColors('TEST');
      
      // Create token entry in database
      const token = await storage.createToken({
        name: "Test Token",
        symbol: "TEST",
        price: 0.01,
        network: "BSC",
        contractAddress: "0x123456789abcdef",
        bg: colors.bg,
        textColor: colors.textColor,
        isNative: false,
        isCustom: true
      });
      
      console.log('[Token Creation API TEST] Created test token record:', token);
      
      // Broadcast the token price to all connected clients
      broadcastTokenPrice(token);
      
      res.json({
        success: true,
        token
      });
    } catch (error) {
      console.error('[Token Creation API TEST] Error:', error);
      res.status(500).json({
        error: 'Failed to create test token',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create a new token record from blockchain deployment
  app.post('/api/tokens/register', async (req, res) => {
    try {
      console.log('[Token Registration API] Received registration data:', req.body);
      
      // Validate and parse the request data
      const data = tokenRegistrationSchema.parse(req.body);
      
      // Get color scheme for token
      const colors = getTokenColors(data.symbol);
      
      // Create token entry in database
      let token: Token;
      try {
        // Prepare token object
        const tokenToCreate = {
          name: data.name,
          symbol: data.symbol.toUpperCase(),
          price: data.initialPrice || 0.01,
          network: "BSC", 
          contractAddress: data.address,
          bg: colors.bg,
          textColor: colors.textColor,
          isNative: false,
          isCustom: true
        };
        
        console.log('[Token Registration API] Registering token with data:', tokenToCreate);
        
        token = await storage.createToken(tokenToCreate);
        
        console.log('[Token Registration API] Registered token record:', token);
        
        // Broadcast the token price to all connected clients
        broadcastTokenPrice(token);
        
        // Update all WebSocket clients about the new token
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'new_token',
              token: {
                id: token.id,
                name: token.name,
                symbol: token.symbol,
                price: token.price,
                network: token.network,
                contractAddress: token.contractAddress,
                bg: token.bg,
                textColor: token.textColor
              }
            }));
          }
        });

        // Create or update transaction record in database
        if (data.transactionHash) {
          // Here you would typically store the transaction in a transactions table
          console.log('[Token Registration API] Transaction hash:', data.transactionHash);
        }
        
        res.json({
          success: true,
          token
        });
      } catch (dbError: unknown) {
        console.error('[Token Registration API] Database error:', dbError);
        throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[Token Registration API] Error:', error);
      
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        res.status(400).json({ 
          error: error instanceof Error ? error.message : 'Unknown error registering token'
        });
      }
    }
  });

  app.post('/api/tokens/create', async (req, res) => {
    try {
      console.log('[Token Creation API] Received blockchain token data:', JSON.stringify({
        ...req.body,
        imageBase64: req.body.imageBase64 ? '[IMAGE DATA]' : null
      }));
      
      // CRITICAL DEBUG - log request information
      console.log('[Token Creation API] Request headers:', req.headers);
      console.log('[Token Creation API] Request method:', req.method);
      console.log('[Token Creation API] Request body keys:', Object.keys(req.body));
      
      console.log('[Token Creation API] Request body properties:', Object.keys(req.body));
      
      // More relaxed validation - check if at least name and symbol exist
      if (!req.body.name || !req.body.symbol) {
        throw new Error('Missing required fields: name and symbol are required');
      }
      
      // Log any missing fields but don't error
      if (!req.body.contractAddress) {
        console.warn('[Token Creation API] Missing contractAddress field');
      }
      
      if (!req.body.transactionHash) {
        console.warn('[Token Creation API] Missing transactionHash field');
      }
      
      // Get color scheme for token
      const colors = getTokenColors(req.body.symbol);
      
      // Create token entry in database
      let token;
      try {
        // Print the prepared token object that will be created
        const tokenToCreate = {
          name: req.body.name,
          symbol: req.body.symbol.toUpperCase(),
          price: req.body.initialPrice || 0.01,
          network: "BSC", // Default to BSC network
          contractAddress: req.body.contractAddress,
          bg: colors.bg,
          textColor: colors.textColor,
          isNative: false,
          isCustom: true
        };
        
        console.log('[Token Creation API] Creating token with data:', tokenToCreate);
        
        token = await storage.createToken(tokenToCreate);
        
        console.log('[Token Creation API] Created token record:', token);
        
        // Broadcast the token price to all connected clients
        broadcastTokenPrice(token);
        
        // Update all WebSocket clients about the new token
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'new_token',
              token: {
                id: token.id,
                name: token.name,
                symbol: token.symbol,
                price: token.price,
                contractAddress: token.contractAddress,
                bg: token.bg,
                textColor: token.textColor
              }
            }));
          }
        });
      } catch (dbError) {
        console.error('[Token Creation API] Database error:', dbError);
        throw new Error(`Failed to save token to database: ${dbError.message}`);
      }
      
      // Create token history record for reference
      try {
        await storage.createTasToken({
          name: req.body.name,
          symbol: req.body.symbol,
          description: req.body.description || '',
          ownerAddress: req.body.ownerAddress,
          contractAddress: req.body.contractAddress,
          transactionHash: req.body.transactionHash,
          supply: req.body.supply || 0,
          initialPrice: req.body.initialPrice || 0.01,
          tokenType: req.body.type || 'social',
          curveType: req.body.curveType || 'linear',
          logoImage: req.body.imageBase64 || '',
          tokenId: token.id, // Link to the token record
          status: 'completed',
          createdAt: new Date(),
        });
        
        console.log('[Token Creation API] Created token history record');
      } catch (historyError) {
        console.error('[Token Creation API] Failed to create history record:', historyError);
        // Don't throw here, we already created the token
      }
      
      res.json({
        success: true,
        token
      });
    } catch (error) {
      console.error('[Token Creation API] Error:', error);
      res.status(500).json({
        error: 'Failed to save token',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Token details endpoint
  app.get('/api/tokens/:tokenId', async (req, res) => {
    try {
      let token;
      
      // Handle special case for "tasnative"
      if (req.params.tokenId === 'tasnative') {
        // Find the token with isNative=true
        const allTokens = await storage.getAllTokens();
        token = allTokens.find(t => t.isNative === true);
        
        if (!token) {
          // If no native token is found, try to find the TAS token as fallback
          token = await storage.getTokenBySymbol('TAS');
        }
      } else {
        // Regular flow for numeric token IDs
        const tokenId = parseInt(req.params.tokenId);
        
        if (isNaN(tokenId)) {
          return res.status(400).json({ error: 'Invalid token ID' });
        }
        
        token = await storage.getToken(tokenId);
      }
      
      if (!token) {
        return res.status(404).json({ error: 'Token not found' });
      }
      
      // Generate bonding curve data points
      // Using x^2 curve for demonstration
      const bondingCurveData = [];
      const maxSupply = 100000000; // 100M max supply
      const currentSupply = 25000000; // 25M current supply
      const basePrice = token.price / Math.sqrt(currentSupply / 1000000); // Set base price to align with current price
      
      // Generate 100 points along the curve
      for (let i = 0; i <= 100; i++) {
        const supplyPoint = (maxSupply / 100) * i;
        const pricePoint = basePrice * Math.sqrt(supplyPoint / 1000000);
        bondingCurveData.push({
          x: supplyPoint,
          y: pricePoint
        });
      }
      
      // Calculate stats based on real token data
      // These calculations would be based on actual blockchain data in production
      const supplyFactor = token.isNative ? 1000000000 : 100000000; // TAS has 1B supply, custom tokens 100M
      const circulatingSupply = token.isNative ? supplyFactor * 0.8 : supplyFactor * 0.2; // 80% circulating for TAS, 20% for custom
      
      // Generate a dynamic percent change
      // In a real implementation, this would be calculated from historical data
      const seed = token.name.length + token.symbol.length; // Use token properties to create consistent "random" values
      const percentChange24h = ((token.symbol === 'TAS' ? 1 : 2) * Math.sin(seed) * 5).toFixed(2);
      
      // Calculate market cap based on circulating supply
      const marketCap = token.price * circulatingSupply;
      
      // Calculate volume - in production this would come from the blockchain
      const volumeTAS = token.price * circulatingSupply * 0.05; // Assume 5% daily volume
      
      // Calculate liquidity - in production this would come from the blockchain
      const liquidity = marketCap * 0.2; // Assume 20% of market cap is liquidity
      
      // Calculate holders - in production this would come from the blockchain
      const holders = token.isNative ? 1000 : Math.floor(100 + (seed % 900));
      
      // Calculate all-time high - in production this would come from historical data
      const allTimeHigh = token.price * (1 + (Math.abs(Math.sin(seed * 2)) * 0.5));
      
      // Format dates based on token data to ensure consistency
      const dateOffset = (seed % 30) * 24 * 60 * 60 * 1000;
      const allTimeHighDate = new Date(Date.now() - dateOffset).toISOString().split('T')[0];
      
      const tokenWithStats = {
        ...token,
        marketCap,
        percentChange24h,
        volumeTAS,
        liquidity,
        holders,
        allTimeHigh,
        allTimeHighDate,
        totalSupply: supplyFactor,
        circulatingSupply,
        bondingCurveData
      };
      
      res.json({
        token: tokenWithStats
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch token details' });
    }
  });
  
  // Token chart data endpoint
  app.get('/api/tokens/:tokenId/chart', async (req, res) => {
    try {
      let token;
      const timeframe = req.query.timeframe || '24h';
      
      // Handle special case for "tasnative"
      if (req.params.tokenId === 'tasnative') {
        // Find the token with isNative=true
        const allTokens = await storage.getAllTokens();
        token = allTokens.find(t => t.isNative === true);
        
        if (!token) {
          // If no native token is found, try to find the TAS token as fallback
          token = await storage.getTokenBySymbol('TAS');
        }
      } else {
        // Regular flow for numeric token IDs
        const tokenId = parseInt(req.params.tokenId);
        
        if (isNaN(tokenId)) {
          return res.status(400).json({ error: 'Invalid token ID' });
        }
        
        token = await storage.getToken(tokenId);
      }
      
      if (!token) {
        return res.status(404).json({ error: 'Token not found' });
      }
      
      // Generate synthetic price data based on token information
      // In a real implementation, this would fetch actual data from a price API or blockchain
      const pricePoints = [];
      const now = new Date();
      
      // Generate synthetic price data for demonstration purposes
      // This would be replaced with real blockchain data in production
      if (token) {
        // Generate 24 data points (hourly for 24h timeframe)
        const currentPrice = token.price || 0.01;
        const volatility = token.symbol === 'TAS' ? 0.03 : 0.05; // 3% for TAS, 5% for others
        
        // Use real token data for the starting price
        for (let i = 24; i >= 0; i--) {
          const pointTime = new Date(now);
          pointTime.setHours(now.getHours() - i);
          
          // Calculate price with some randomness but trending toward current price
          const trendFactor = 1 - (i / 24); // 0 at the beginning, 1 at the end
          const randomFactor = (Math.random() - 0.5) * volatility;
          let pointPrice = currentPrice * (0.9 + (0.1 * trendFactor) + randomFactor);
          
          // Ensure price is positive
          pointPrice = Math.max(pointPrice, 0.00001);
          
          // Calculate volume based on price and volatility
          const volume = currentPrice * 10000 * (1 + Math.random() * volatility * 10);
          
          pricePoints.push({
            time: pointTime.toISOString(),
            price: pointPrice,
            volume: volume
          });
        }
      }
      
      res.json({
        success: true,
        pricePoints
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch chart data' });
    }
  });
  
  // Token holders endpoint
  // Get user tokens
  app.get('/api/user/tokens', async (req, res) => {
    try {
      // In production, this would check the authenticated user
      // For demo purposes, just return the TAS token
      const tasToken = await storage.getTokenBySymbol('TAS');
      
      if (!tasToken) {
        return res.status(404).json({ error: 'No tokens found' });
      }
      
      // Return only real blockchain tokens
      res.json({
        tokens: [{
          id: tasToken.id,
          name: "TAS Token",
          symbol: "TAS",
          balance: 0, // Will be populated from blockchain in the client
          network: "Binance Smart Chain",
          contractAddress: "0xd9541b134b1821736bd323135b8844d3ae408216",
          isNative: true
        }]
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user tokens' });
    }
  });
  
  app.get('/api/tokens/:tokenId/holders', async (req, res) => {
    try {
      let token;
      
      // Handle special case for "tasnative"
      if (req.params.tokenId === 'tasnative') {
        // Find the token with isNative=true
        const allTokens = await storage.getAllTokens();
        token = allTokens.find(t => t.isNative === true);
        
        if (!token) {
          // If no native token is found, try to find the TAS token as fallback
          token = await storage.getTokenBySymbol('TAS');
        }
      } else {
        // Regular flow for numeric token IDs
        const tokenId = parseInt(req.params.tokenId);
        
        if (isNaN(tokenId)) {
          return res.status(400).json({ error: 'Invalid token ID' });
        }
        
        token = await storage.getToken(tokenId);
      }
      
      if (!token) {
        return res.status(404).json({ error: 'Token not found' });
      }
      
      // In production, this would fetch holder data from the blockchain
      // For now, generate a realistic holder list using token data
      const holders = [];
      
      // Get total supply from token properties
      const totalSupply = token.isNative ? 1000000000 : 100000000; // 1B for TAS, 100M for custom tokens
      let remainingSupply = totalSupply;

      // Add primary holder (contract deployer)
      const developerBalance = Math.round(totalSupply * (token.isNative ? 0.8 : 0.6)); // 80% for TAS, 60% for custom
      remainingSupply -= developerBalance;

      holders.push({
        address: "0x14c30d9139cbbca09e8232938fe265fbf120eaaa", // Main wallet address
        balance: developerBalance,
        percentage: Math.round((developerBalance / totalSupply) * 100),
        isDeveloper: true
      });

      // Add holders based on token details (real implementation would fetch from blockchain)
      if (totalSupply > 0 && remainingSupply > 0) {
        // Create a deterministic number of holders based on token properties
        const seed = token.name.length + token.symbol.length;
        const numHolders = token.isNative ? 5 : (3 + (seed % 3)); // 5 holders for TAS, 3-5 for others
        
        const addresses = [
          "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf",
          "0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF", 
          "0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69", 
          "0x1efF47bc3a10a45D4B230B5d10E37751FE6AA718",
          "0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC"
        ];
        
        for (let i = 0; i < numHolders && i < addresses.length; i++) {
          if (remainingSupply <= 0) break;
          
          // Calculate balance based on position (earlier holders have more)
          const holderBalance = Math.round(remainingSupply / (numHolders - i));
          remainingSupply -= holderBalance;
          
          holders.push({
            address: addresses[i],
            balance: holderBalance,
            percentage: Math.round((holderBalance / totalSupply) * 100),
            isDeveloper: false
          });
        }
      }
      
      res.json({
        success: true,
        holders
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch token holders' });
    }
  });
  
  // Token trades endpoint
  app.get('/api/tokens/:tokenId/trades', async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      
      if (isNaN(tokenId)) {
        return res.status(400).json({ error: 'Invalid token ID' });
      }
      
      const token = await storage.getToken(tokenId);
      
      if (!token) {
        return res.status(404).json({ error: 'Token not found' });
      }
      
      // Real-world implementation would fetch trades from blockchain
      // Return empty array for now until we can fetch real trades
      const trades: Array<{id: number, type: string, amount: number, price: number, timestamp: string}> = [];
      
      res.json({
        success: true,
        trades
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch token trades' });
    }
  });
  
  // Token chat endpoint
  app.get('/api/tokens/:tokenId/chat', async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      
      if (isNaN(tokenId)) {
        return res.status(400).json({ error: 'Invalid token ID' });
      }
      
      const token = await storage.getToken(tokenId);
      
      if (!token) {
        return res.status(404).json({ error: 'Token not found' });
      }
      
      // Real-world implementation would fetch actual messages from a database
      // Return an empty array until we have real messages
      const messages = [];
      
      // Add welcome message with real token info
      if (token) {
        messages.push({
          id: 1,
          userId: 0,
          address: "0x0000000000000000000000000000000000000000",
          username: "TAS System",
          text: `Welcome to ${token.name} (${token.symbol}) token chat! This is where token holders can discuss this token.`,
          timestamp: new Date().toISOString(),
          isBot: true,
          profileColor: "#FFD700"
        });
      }
      
      res.json({
        success: true,
        messages: messages.reverse()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch token chat' });
    }
  });
  
  // User token relationship endpoint
  app.get('/api/user/tokens/:tokenId', async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      
      if (isNaN(tokenId)) {
        return res.status(400).json({ error: 'Invalid token ID' });
      }
      
      // Return a fixed relationship state until we implement real token relationship tracking
      res.json({
        isFollowing: false, // Default to not following
        isMember: false, // Default to not a member
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user token relationship' });
    }
  });
  
  // Toggle follow status endpoint
  app.post('/api/user/tokens/:tokenId/follow', async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const { follow } = req.body;
      
      if (isNaN(tokenId)) {
        return res.status(400).json({ error: 'Invalid token ID' });
      }
      
      // In a real app, this would update the user's follow status for the token
      res.json({
        success: true,
        isFollowing: follow
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update follow status' });
    }
  });
  
  // Toggle membership status endpoint
  app.post('/api/user/tokens/:tokenId/membership', async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const { join } = req.body;
      
      if (isNaN(tokenId)) {
        return res.status(400).json({ error: 'Invalid token ID' });
      }
      
      // In a real app, this would update the user's membership status for the token chat
      res.json({
        success: true,
        isMember: join
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update membership status' });
    }
  });
  
  // Post to token chat endpoint
  app.post('/api/tokens/:tokenId/chat', async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const { message } = req.body;
      
      if (isNaN(tokenId)) {
        return res.status(400).json({ error: 'Invalid token ID' });
      }
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      // In a real app, this would store the message in the database
      // and broadcast it to all users in the token chat
      
      res.json({
        success: true,
        message: {
          id: Math.floor(Math.random() * 1000),
          userId: 1, // Assuming user ID 1 for demo
          address: "0x123...456",
          username: "You",
          text: message,
          timestamp: new Date().toISOString(),
          profileColor: "#FFD700"
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send message' });
    }
  });
  
  // Token trade execution endpoint
  app.post('/api/tokens/:tokenId/trade', async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const { type, amount, slippage, antiSniper } = req.body;
      
      if (isNaN(tokenId)) {
        return res.status(400).json({ error: 'Invalid token ID' });
      }
      
      const token = await storage.getToken(tokenId);
      
      if (!token) {
        return res.status(404).json({ error: 'Token not found' });
      }
      
      if (!type || !amount) {
        return res.status(400).json({ error: 'Type and amount are required' });
      }
      
      if (type !== 'buy' && type !== 'sell') {
        return res.status(400).json({ error: 'Type must be buy or sell' });
      }
      
      // This would execute the trade on the blockchain in production
      // Prepare the trade data with real token information
      
      const parsedAmount = parseFloat(amount);
      const slippageMultiplier = 1 + (parseFloat(slippage || '1') / 100) * (type === 'buy' ? 1 : -1);
      const price = token.price * slippageMultiplier;
      const totalPrice = price * parsedAmount;
      
      res.json({
        success: true,
        trade: {
          id: Math.floor(Math.random() * 1000),
          type,
          amount: parsedAmount,
          price,
          totalPrice,
          timestamp: new Date().toISOString(),
          hash: `0x${Math.random().toString(16).substring(2, 30)}`,
          antiSniperProtected: antiSniper
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to execute trade' });
    }
  });
  
  // Match routes
  app.get('/api/matches', async (req, res) => {
    try {
      // Get matches for the current user (hardcoded as 1 for now)
      const userId = 1; // TODO: Get from authenticated user
      const matches = await storage.getUserMatches(userId);
      
      // Format matches for frontend with real data
      const formattedMatches = matches.map(async match => {
        // Get the actual swap requests
        const swapRequestA = await storage.getSwapRequest(match.swapRequestAId);
        const swapRequestB = await storage.getSwapRequest(match.swapRequestBId);
        
        // Get the tokens involved
        const offerTokenObj = swapRequestA ? await storage.getToken(swapRequestA.offerTokenId) : null;
        const wantTokenObj = swapRequestA ? await storage.getToken(swapRequestA.wantTokenId) : null;
        
        // Create token info objects using real data
        const offerToken = offerTokenObj ? {
          name: offerTokenObj.name,
          symbol: offerTokenObj.symbol,
          amount: swapRequestA ? swapRequestA.offerAmount.toString() : '0',
          bg: offerTokenObj.bg || 'bg-blue-100',
          textColor: offerTokenObj.textColor || 'text-blue-600'
        } : {
          name: 'Unknown',
          symbol: '???',
          amount: '0',
          bg: 'bg-gray-100',
          textColor: 'text-gray-600'
        };
        
        const wantToken = wantTokenObj ? {
          name: wantTokenObj.name,
          symbol: wantTokenObj.symbol,
          amount: swapRequestA ? swapRequestA.wantAmount.toString() : '0',
          bg: wantTokenObj.bg || 'bg-green-100',
          textColor: wantTokenObj.textColor || 'text-green-600'
        } : {
          name: 'Unknown',
          symbol: '???',
          amount: '0',
          bg: 'bg-gray-100',
          textColor: 'text-gray-600'
        };
        
        // Get the user for proper display name
        const user = await storage.getUser(match.userBId);
        
        return {
          id: match.id,
          userId: match.userBId,
          displayName: user ? user.nickname || `User ${match.userBId}` : `User ${match.userBId}`,
          lastActive: match.updatedAt ? new Date(match.updatedAt).toLocaleString() : new Date().toLocaleString(),
          avatarBg: user ? user.avatarBg : 'bg-primary-100',
          avatarText: user ? user.avatarTextColor : 'text-primary-700',
          matchType: match.matchType,
          offerToken,
          wantToken
        };
      });
      
      res.json({
        matches: formattedMatches
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch matches' });
    }
  });
  
  app.post('/api/matches/find', async (req, res) => {
    try {
      const data = findMatchesSchema.parse(req.body);
      
      // Find a token by symbol for offer and want tokens
      const offerToken = await storage.getTokenBySymbol(data.offerToken);
      const wantToken = await storage.getTokenBySymbol(data.wantToken);
      
      if (!offerToken || !wantToken) {
        return res.status(404).json({ error: 'One or both tokens not found' });
      }
      
      // Create user's swap request
      const swapRequestA = await storage.createSwapRequest({
        userId: 1, // TODO: Get from authenticated user
        offerTokenId: offerToken.id,
        offerAmount: parseFloat(data.offerAmount),
        wantTokenId: wantToken.id,
        wantAmount: parseFloat(data.wantAmount)
      });
      
      // Find compatible swap requests
      // In a real app, we would search for compatible swap requests here
      
      // Get all users to find a valid user to match with
      const allUsers = await storage.getAllUsers();
      const otherUsers = allUsers.filter(user => user.id !== 1); // Filter out current user
      
      if (otherUsers.length === 0) {
        return res.status(400).json({ error: 'No other users available for matching' });
      }
      
      // Select a random user to match with
      const randomIndex = Math.floor(Math.random() * otherUsers.length);
      const matchedUser = otherUsers[randomIndex];
      
      // Create a simulated match with real user data
      const match = await storage.createMatch({
        userAId: 1, // TODO: Get from authenticated user
        userBId: matchedUser.id, 
        swapRequestAId: swapRequestA.id,
        swapRequestBId: swapRequestA.id, // Using same request as both sides for now
        matchType: 'pending'
      });
      
      res.json({
        success: true,
        match
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        res.status(500).json({ error: 'Failed to find matches' });
      }
    }
  });
  
  // Random match endpoint for Omegle-style matching
  app.post('/api/matches/random', async (req, res) => {
    try {
      const { userId, tokenPreferences } = req.body;
      const currentUserId = parseInt(userId) || 1; // Default to user 1 if not provided
      
      // Get all users except the current user
      const allUsers = await storage.getAllUsers();
      const otherUsers = allUsers.filter(user => user.id !== currentUserId);
      
      if (otherUsers.length === 0) {
        return res.json({
          success: true,
          randomMatch: null,
          message: 'No other users available for matching'
        });
      }
      
      // Choose a random user
      const randomIndex = Math.floor(Math.random() * otherUsers.length);
      const matchedUser = otherUsers[randomIndex];
      
      // Get all tokens to help create a match
      const tokens = await storage.getAllTokens();
      
      if (tokens.length < 2) {
        return res.json({
          success: true,
          randomMatch: null,
          message: 'Not enough tokens available for matching'
        });
      }
      
      // Create swap requests using available tokens
      const offerToken = tokens[0];
      const wantToken = tokens[1];
      
      // Create swap request for user A
      const swapRequestA = await storage.createSwapRequest({
        userId: currentUserId,
        offerTokenId: offerToken.id,
        offerAmount: 10,
        wantTokenId: wantToken.id,
        wantAmount: 10
      });
      
      // Create swap request for user B
      const swapRequestB = await storage.createSwapRequest({
        userId: matchedUser.id,
        offerTokenId: wantToken.id,
        offerAmount: 10,
        wantTokenId: offerToken.id,
        wantAmount: 10
      });
      
      // Create a match
      const match = await storage.createMatch({
        userAId: currentUserId,
        userBId: matchedUser.id,
        swapRequestAId: swapRequestA.id,
        swapRequestBId: swapRequestB.id,
        matchType: 'random'
      });
      
      // Create a chat for the match
      const chat = await storage.createChat({
        matchId: match.id,
        userAId: currentUserId,
        userBId: matchedUser.id
      });
      
      // Format the response
      const randomMatch = {
        id: match.id,
        user: {
          id: matchedUser.id,
          name: matchedUser.nickname || `User ${matchedUser.id}`,
          avatarBg: matchedUser.avatarBg || 'bg-primary-100',
          avatarText: matchedUser.avatarTextColor || 'text-primary-700',
          isOnline: !!matchedUser.isOnline
        },
        chatId: chat.id,
        swapRequestAId: swapRequestA.id,
        swapRequestBId: swapRequestB.id
      };
      
      res.json({
        success: true,
        randomMatch
      });
    } catch (error) {
      console.error('Error in random matching:', error);
      res.status(500).json({ 
        error: 'Failed to find random match',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Chat routes
  app.get('/api/contacts', async (req, res) => {
    try {
      // Get all matches for the user to build contact list
      const userId = 1; // TODO: Get from authenticated user
      const userMatches = await storage.getUserMatches(userId);
      
      // Build contacts from matches
      const contacts = await Promise.all(userMatches.map(async (match) => {
        // Determine the other user in the match
        const contactUserId = match.userAId === userId ? match.userBId : match.userAId;
        const contactUser = await storage.getUser(contactUserId);
        
        if (!contactUser) {
          return null;
        }
        
        // Get chat for this match if it exists
        const chat = await storage.getChatByMatchId(match.id);
        
        // Return contact info
        return {
          id: contactUserId,
          name: contactUser.nickname || `User ${contactUserId}`,
          avatarBg: contactUser.avatarBg || 'bg-primary-100',
          avatarText: contactUser.avatarTextColor || 'text-primary-700',
          lastMessage: chat ? 'Started a conversation' : null,
          lastMessageTime: chat && chat.updatedAt ? 
            new Date(chat.updatedAt) : 
            (match.createdAt ? new Date(match.createdAt) : new Date()),
          unreadCount: 0,
          isOnline: !!contactUser.isOnline,
          matchId: match.id
        };
      }));
      
      // Filter out null entries (users that couldn't be found)
      const validContacts = contacts.filter(contact => contact !== null);
      
      res.json({
        contacts: validContacts
      });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  });
  
  app.get('/api/messages/:contactId', async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      
      if (isNaN(contactId)) {
        return res.status(400).json({ error: 'Invalid contact ID' });
      }
      
      const currentUserId = 1; // TODO: Get from authenticated user
      
      // Find chat between these users
      const chatId = await storage.getChatIdForUsers(currentUserId, contactId);
      
      if (!chatId) {
        // No chat exists yet
        return res.json({
          messages: []
        });
      }
      
      // Get messages from the database
      const dbMessages = await storage.getMessages(chatId);
      
      // Format messages for the frontend
      const messages = dbMessages.map(msg => ({
        id: msg.id,
        senderId: msg.userId,
        receiverId: contactId, // The contact is always the receiver when pulling messages
        text: msg.text,
        timestamp: msg.timestamp,
        isFromMe: msg.userId === currentUserId
      }));
      
      // Mark messages as read
      await storage.markMessagesAsRead(chatId, currentUserId);
      
      res.json({
        messages
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });
  
  app.post('/api/messages', async (req, res) => {
    try {
      const { contactId, message } = req.body;
      
      if (!contactId || !message) {
        return res.status(400).json({ error: 'Contact ID and message are required' });
      }
      
      const currentUserId = 1; // TODO: Get from authenticated user
      
      // Find or create chat between users
      let chatId = await storage.getChatIdForUsers(currentUserId, contactId);
      
      if (!chatId) {
        // Create a new chat. Use 0 as a placeholder for matchId if needed
        const chat = await storage.createChat({
          userAId: currentUserId,
          userBId: contactId
        });
        
        chatId = chat.id;
      }
      
      // Save message to database
      const newMessage = await storage.addMessage({
        chatId,
        userId: currentUserId,
        text: message,
        isRead: false
      });
      
      // Format for response
      const formattedMessage = {
        id: newMessage.id,
        senderId: newMessage.userId,
        receiverId: contactId,
        text: newMessage.text,
        timestamp: newMessage.timestamp,
        isFromMe: true
      };
      
      // Broadcast message via WebSocket if we had WebSocket set up
      
      res.json({
        success: true,
        message: formattedMessage
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });
  
  app.post('/api/chats', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const currentUserId = 1; // TODO: Get from authenticated user
      
      // Check if chat already exists
      let chatId = await storage.getChatIdForUsers(currentUserId, userId);
      
      if (!chatId) {
        // Create a new chat
        const chat = await storage.createChat({
          userAId: currentUserId,
          userBId: userId
        });
        
        chatId = chat.id;
      }
      
      res.json({
        success: true,
        contactId: userId,
        chatId
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      res.status(500).json({ error: 'Failed to start chat' });
    }
  });
  
  // BNB to TAS swap endpoint
  app.post('/api/swap/bnb-to-tas', async (req, res) => {
    try {
      const { fromAmount, fromToken, toAmount, toToken, userId } = req.body;
      
      if (!fromAmount || !fromToken || !toAmount || !toToken) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      if (fromToken !== 'BNB' || toToken !== 'TAS') {
        return res.status(400).json({ error: 'Only BNB to TAS swaps are supported' });
      }
      
      // Create a swap record in the database
      const swap = await storage.createBnbToTasSwap({
        userId: parseInt(userId) || 1, // Default to user 1 if not provided
        bnbAmount: parseFloat(fromAmount),
        tasAmount: parseFloat(toAmount),
        status: 'pending'
      });
      
      // In a real implementation, here you would:
      // 1. Process the transaction on the blockchain
      // 2. Update the transaction status once confirmed
      // 3. Transfer the TAS tokens to the user's wallet
      
      res.json({
        success: true,
        transactionId: swap.id,
        message: 'Swap initiated successfully',
        estimatedTime: '10-15 minutes'
      });
    } catch (error) {
      console.error('BNB to TAS swap error:', error);
      res.status(500).json({ 
        error: 'Failed to process swap',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get user's BNB to TAS swap history
  app.get('/api/swap/bnb-to-tas/history', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Valid user ID is required' });
      }
      
      const swaps = await storage.getUserBnbToTasSwaps(userId);
      
      res.json({ swaps });
    } catch (error) {
      console.error('Error fetching swap history:', error);
      res.status(500).json({ error: 'Failed to fetch swap history' });
    }
  });

  return httpServer;
}
