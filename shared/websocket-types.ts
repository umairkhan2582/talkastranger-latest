// Shared WebSocket message types for client-server communication

// Base message structure
export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
}

// ============================================================================
// Price Oracle Messages
// ============================================================================

export interface PriceData {
  tasNativePrice: number;
  tasUsdPrice: number;
  bnbUsdPrice: number;
  pancakeswapPairAddress: string;
  premiumRatio?: number;
}

export interface ChartDataUpdate {
  currentPrice?: PriceData;
  premiumRatio?: number;
}

export type PriceUpdateMessage = WebSocketMessage<PriceData>;
export type ChartDataUpdateMessage = WebSocketMessage<ChartDataUpdate>;

// ============================================================================
// Token Update Messages
// ============================================================================

export interface TokenUpdateData {
  tokenId: number;
  price?: number;
  holders?: number;
  volume?: number;
}

export type TokenUpdateMessage = WebSocketMessage<TokenUpdateData>;

// ============================================================================
// Video Chat / TradeNTalk Messages
// ============================================================================

export interface PeerInfo {
  id: string;
  nickname?: string;
  gender?: string;
  location?: string;
}

export interface MatchedData {
  peer: PeerInfo;
  sessionId?: string;
}

export interface ChatMessageData {
  from: string;
  message: string;
  timestamp: number;
}

export interface WebRTCSignalData {
  from: string;
  type: 'offer' | 'answer' | 'candidate';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface SearchFilters {
  country?: string;
  city?: string;
  area?: string;
  location?: string;
  ageRange?: { min: number; max: number };
  interests?: string[];
  language?: string;
  gender?: string;
}

export interface StartSearchData {
  userId: string;
  nickname?: string;
  gender?: string;
  filters?: SearchFilters;
  tasBalance?: number;
}

export type MatchedMessage = WebSocketMessage<MatchedData>;
export type ChatMessage = WebSocketMessage<ChatMessageData>;
export type WebRTCSignalMessage = WebSocketMessage<WebRTCSignalData>;
export type StartSearchMessage = WebSocketMessage<StartSearchData>;

// ============================================================================
// Connection Messages
// ============================================================================

export interface AuthData {
  userId: string;
  walletAddress?: string;
  sessionId?: string;
}

export interface ConnectionEstablishedData {
  connectionId: string;
  timestamp: number;
}

export type AuthMessage = WebSocketMessage<AuthData>;
export type ConnectionEstablishedMessage = WebSocketMessage<ConnectionEstablishedData>;

// ============================================================================
// Message Type Discriminator
// ============================================================================

export type WebSocketMessageType =
  | 'price_update'
  | 'chart_data_update'
  | 'token_update'
  | 'matched'
  | 'chat'
  | 'webrtc_offer'
  | 'webrtc_answer'
  | 'webrtc_ice_candidate'
  | 'start_search'
  | 'stop_search'
  | 'auth'
  | 'connection_established'
  | 'peer_disconnected'
  | 'watch_token'
  | 'unwatch_token';

// ============================================================================
// Message Handler Types
// ============================================================================

export type MessageHandler<T = any> = (data: T) => void;

export interface MessageSubscription {
  type: WebSocketMessageType;
  handler: MessageHandler;
}
