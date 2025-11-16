import { 
  users, type User, type InsertUser,
  tokens, type Token, type InsertToken,
  userTokens, type UserToken, type InsertUserToken,
  swapRequests, type SwapRequest, type InsertSwapRequest,
  matches, type Match, type InsertMatch,
  chats, type Chat, type InsertChat,
  messages, type Message, type InsertMessage,
  createdTokens, type CreatedToken, type InsertCreatedToken,
  bnbToTasSwaps, type BnbToTasSwap, type InsertBnbToTasSwap
} from "@shared/schema";
import { defaultTokens, popularTokens, getTokenColors } from "@/lib/tokens";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(address: string): Promise<User | undefined>;
  getUserByWalletAddressAndEmail(address: string, email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void>;
  updateUserProfile(userId: number, updates: { 
    email?: string, 
    nickname?: string, 
    firstName?: string, 
    lastName?: string, 
    bio?: string, 
    dateOfBirth?: string, 
    website?: string,
    isPublicProfile?: boolean,
    profileCompleted?: boolean 
  }): Promise<User>;
  
  // Token operations
  getToken(id: number): Promise<Token | undefined>;
  getTokenBySymbol(symbol: string): Promise<Token | undefined>;
  getAllTokens(): Promise<Token[]>;
  createToken(token: InsertToken): Promise<Token>;
  getNativeToken(): Promise<Token | undefined>;
  
  // User Token operations
  getUserTokens(userId: number): Promise<UserToken[]>;
  getUserToken(userId: number, tokenId: number): Promise<UserToken | undefined>;
  addUserToken(userToken: InsertUserToken): Promise<UserToken>;
  updateUserToken(id: number, balance: number): Promise<UserToken>;
  
  // Swap Request operations
  getSwapRequest(id: number): Promise<SwapRequest | undefined>;
  getUserSwapRequests(userId: number): Promise<SwapRequest[]>;
  createSwapRequest(swapRequest: InsertSwapRequest): Promise<SwapRequest>;
  updateSwapRequest(id: number, isActive: boolean): Promise<SwapRequest>;
  
  // Match operations
  getMatch(id: number): Promise<Match | undefined>;
  getUserMatches(userId: number): Promise<Match[]>;
  getAllMatches(): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatchStatus(id: number, status: string): Promise<Match>;
  
  // Chat operations
  getChat(id: number): Promise<Chat | undefined>;
  getChatByMatchId(matchId: number): Promise<Chat | undefined>;
  getChatIdForUsers(userAId: number, userBId: number): Promise<number | undefined>;
  createChat(chat: InsertChat): Promise<Chat>;
  
  // Message operations
  getMessages(chatId: number): Promise<Message[]>;
  addMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(chatId: number, userId: number): Promise<void>;
  
  // TAS Blockchain operations
  createBnbToTasSwap(swap: InsertBnbToTasSwap): Promise<BnbToTasSwap>;
  getBnbToTasSwap(id: number): Promise<BnbToTasSwap | undefined>;
  getUserBnbToTasSwaps(userId: number): Promise<BnbToTasSwap[]>;
  updateBnbToTasSwapStatus(id: number, status: string, transactionHash?: string): Promise<BnbToTasSwap>;
  
  // Token Creation operations
  createTasToken(createdToken: InsertCreatedToken): Promise<CreatedToken>;
  getCreatedToken(id: number): Promise<CreatedToken | undefined>;
  getUserCreatedTokens(userId: number): Promise<CreatedToken[]>;
  updateCreatedTokenStatus(id: number, status: string, transactionHash?: string): Promise<CreatedToken>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tokens: Map<number, Token>;
  private userTokens: Map<number, UserToken>;
  private swapRequests: Map<number, SwapRequest>;
  private matches: Map<number, Match>;
  private chats: Map<number, Chat>;
  private messages: Map<number, Message>;
  private createdTokens: Map<number, CreatedToken>;
  private bnbToTasSwaps: Map<number, BnbToTasSwap>;
  
  // Current IDs for auto-increment
  private currentUserId: number;
  private currentTokenId: number;
  private currentUserTokenId: number;
  private currentSwapRequestId: number;
  private currentMatchId: number;
  private currentChatId: number;
  private currentMessageId: number;
  private currentCreatedTokenId: number;
  private currentBnbToTasSwapId: number;
  
  constructor() {
    this.users = new Map();
    this.tokens = new Map();
    this.userTokens = new Map();
    this.swapRequests = new Map();
    this.matches = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.createdTokens = new Map();
    this.bnbToTasSwaps = new Map();
    
    this.currentUserId = 1;
    this.currentTokenId = 1;
    this.currentUserTokenId = 1;
    this.currentSwapRequestId = 1;
    this.currentMatchId = 1;
    this.currentChatId = 1;
    this.currentMessageId = 1;
    this.currentCreatedTokenId = 1;
    this.currentBnbToTasSwapId = 1;
    
    // Initialize with default tokens
    this.initializeDefaultData();
  }
  
  private initializeDefaultData() {
    // Initialize with only the TAS token using the real contract address
    const tasToken: Token = {
      id: this.currentTokenId++,
      name: "TASChain Token",
      symbol: "TAS",
      price: 0.001, // Current market price
      network: "BSC",
      contractAddress: "0xd9541b134b1821736bd323135b8844d3ae408216", // Real TAS contract address on BSC
      bg: "bg-primary-100",
      textColor: "text-primary-600",
      isCustom: false,
      isNative: true,
      createdAt: new Date()
    };
    this.tokens.set(tasToken.id, tasToken);
    
    // No demo users - real users will register through the application
    
    // No demo swap requests, matches or chats - we'll use real data from the blockchain only
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByWalletAddress(address: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === address,
    );
  }
  
  async getUserByWalletAddressAndEmail(address: string, email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === address && user.email === email,
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      isOnline: true,
      lastActive: new Date(),
      avatarBg: 'bg-primary-100',
      avatarTextColor: 'text-primary-700',
      profileCompleted: false,
      emailVerified: false,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.isOnline = isOnline;
      user.lastActive = new Date();
      this.users.set(userId, user);
    }
  }
  
  async updateUserProfile(userId: number, updates: { 
    email?: string, 
    nickname?: string, 
    firstName?: string, 
    lastName?: string, 
    bio?: string, 
    dateOfBirth?: string, 
    website?: string,
    isPublicProfile?: boolean,
    profileCompleted?: boolean 
  }): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Update all fields from the updates object
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        // TypeScript requires this type assertion since we're dynamically accessing properties
        (user as any)[key] = value;
      }
    });
    
    user.lastActive = new Date();
    this.users.set(userId, user);
    
    return user;
  }
  
  // Token operations
  async getToken(id: number): Promise<Token | undefined> {
    return this.tokens.get(id);
  }
  
  async getTokenBySymbol(symbol: string): Promise<Token | undefined> {
    return Array.from(this.tokens.values()).find(
      (token) => token.symbol === symbol,
    );
  }
  
  async getAllTokens(): Promise<Token[]> {
    return Array.from(this.tokens.values());
  }
  
  async createToken(insertToken: InsertToken): Promise<Token> {
    const id = this.currentTokenId++;
    const token: Token = { 
      ...insertToken, 
      id, 
      isNative: insertToken.isNative || false, 
      createdAt: new Date() 
    };
    this.tokens.set(id, token);
    return token;
  }
  
  async getNativeToken(): Promise<Token | undefined> {
    return Array.from(this.tokens.values()).find(
      (token) => token.isNative === true,
    );
  }
  
  // User Token operations
  async getUserTokens(userId: number): Promise<UserToken[]> {
    return Array.from(this.userTokens.values()).filter(
      (userToken) => userToken.userId === userId,
    );
  }
  
  async getUserToken(userId: number, tokenId: number): Promise<UserToken | undefined> {
    return Array.from(this.userTokens.values()).find(
      (userToken) => userToken.userId === userId && userToken.tokenId === tokenId,
    );
  }
  
  async addUserToken(insertUserToken: InsertUserToken): Promise<UserToken> {
    const id = this.currentUserTokenId++;
    const userToken: UserToken = { 
      ...insertUserToken, 
      id, 
      updatedAt: new Date() 
    };
    this.userTokens.set(id, userToken);
    return userToken;
  }
  
  async updateUserToken(id: number, balance: number): Promise<UserToken> {
    const userToken = this.userTokens.get(id);
    if (!userToken) {
      throw new Error(`User token with ID ${id} not found`);
    }
    
    userToken.balance = balance;
    userToken.updatedAt = new Date();
    this.userTokens.set(id, userToken);
    return userToken;
  }
  
  // Swap Request operations
  async getSwapRequest(id: number): Promise<SwapRequest | undefined> {
    return this.swapRequests.get(id);
  }
  
  async getUserSwapRequests(userId: number): Promise<SwapRequest[]> {
    return Array.from(this.swapRequests.values()).filter(
      (swapRequest) => swapRequest.userId === userId,
    );
  }
  
  async createSwapRequest(insertSwapRequest: InsertSwapRequest): Promise<SwapRequest> {
    const id = this.currentSwapRequestId++;
    const now = new Date();
    const swapRequest: SwapRequest = { 
      ...insertSwapRequest, 
      id, 
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    this.swapRequests.set(id, swapRequest);
    return swapRequest;
  }
  
  async updateSwapRequest(id: number, isActive: boolean): Promise<SwapRequest> {
    const swapRequest = this.swapRequests.get(id);
    if (!swapRequest) {
      throw new Error(`Swap request with ID ${id} not found`);
    }
    
    swapRequest.isActive = isActive;
    swapRequest.updatedAt = new Date();
    this.swapRequests.set(id, swapRequest);
    return swapRequest;
  }
  
  // Match operations
  async getMatch(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }
  
  async getUserMatches(userId: number): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(
      (match) => match.userAId === userId || match.userBId === userId,
    );
  }
  
  async getAllMatches(): Promise<Match[]> {
    return Array.from(this.matches.values());
  }
  
  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = this.currentMatchId++;
    const now = new Date();
    const match: Match = { 
      ...insertMatch, 
      id, 
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };
    this.matches.set(id, match);
    
    // Also create a chat for this match
    await this.createChat({ 
      matchId: id,
      userAId: match.userAId,
      userBId: match.userBId
    });
    
    return match;
  }
  
  async updateMatchStatus(id: number, status: string): Promise<Match> {
    const match = this.matches.get(id);
    if (!match) {
      throw new Error(`Match with ID ${id} not found`);
    }
    
    match.status = status;
    match.updatedAt = new Date();
    this.matches.set(id, match);
    return match;
  }
  
  // Chat operations
  async getChat(id: number): Promise<Chat | undefined> {
    return this.chats.get(id);
  }
  
  async getChatByMatchId(matchId: number): Promise<Chat | undefined> {
    return Array.from(this.chats.values()).find(
      (chat) => chat.matchId === matchId,
    );
  }
  
  async getChatIdForUsers(userAId: number, userBId: number): Promise<number | undefined> {
    // Find a match between these two users
    const match = Array.from(this.matches.values()).find(
      (m) => (m.userAId === userAId && m.userBId === userBId) || 
             (m.userAId === userBId && m.userBId === userAId),
    );
    
    if (!match) {
      return undefined;
    }
    
    // Find the chat for this match
    const chat = await this.getChatByMatchId(match.id);
    return chat?.id;
  }
  
  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = this.currentChatId++;
    const now = new Date();
    const chat: Chat = { 
      ...insertChat, 
      id, 
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now
    };
    this.chats.set(id, chat);
    return chat;
  }
  
  // Message operations
  async getMessages(chatId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.chatId === chatId)
      .sort((a, b) => {
        if (!a.timestamp) return -1;
        if (!b.timestamp) return 1;
        return a.timestamp.getTime() - b.timestamp.getTime();
      });
  }
  
  async addMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const now = new Date();
    const message: Message = { 
      ...insertMessage, 
      id, 
      timestamp: now,
      isRead: false
    };
    this.messages.set(id, message);
    
    // Update the chat's lastMessageAt
    const chat = await this.getChat(insertMessage.chatId);
    if (chat) {
      chat.lastMessageAt = now;
      this.chats.set(chat.id, chat);
    }
    
    return message;
  }
  
  async markMessagesAsRead(chatId: number, userId: number): Promise<void> {
    const messagesToUpdate = Array.from(this.messages.values()).filter(
      (message) => message.chatId === chatId && message.userId !== userId && !message.isRead,
    );
    
    for (const message of messagesToUpdate) {
      message.isRead = true;
      this.messages.set(message.id, message);
    }
  }
  
  // TAS Blockchain Operations
  async createBnbToTasSwap(swap: InsertBnbToTasSwap): Promise<BnbToTasSwap> {
    const id = this.currentBnbToTasSwapId++;
    const now = new Date();
    const bnbToTasSwap: BnbToTasSwap = {
      ...swap,
      id,
      status: "pending",
      transactionHash: null,
      createdAt: now,
      updatedAt: now
    };
    this.bnbToTasSwaps.set(id, bnbToTasSwap);
    return bnbToTasSwap;
  }
  
  async getBnbToTasSwap(id: number): Promise<BnbToTasSwap | undefined> {
    return this.bnbToTasSwaps.get(id);
  }
  
  async getUserBnbToTasSwaps(userId: number): Promise<BnbToTasSwap[]> {
    return Array.from(this.bnbToTasSwaps.values()).filter(
      (swap) => swap.userId === userId
    );
  }
  
  async updateBnbToTasSwapStatus(id: number, status: string, transactionHash?: string): Promise<BnbToTasSwap> {
    const swap = this.bnbToTasSwaps.get(id);
    if (!swap) {
      throw new Error(`BNB to TAS swap with ID ${id} not found`);
    }
    
    swap.status = status;
    swap.updatedAt = new Date();
    
    if (transactionHash) {
      swap.transactionHash = transactionHash;
    }
    
    this.bnbToTasSwaps.set(id, swap);
    return swap;
  }
  
  // TAS Token Creation Operations
  async createTasToken(createdToken: InsertCreatedToken): Promise<CreatedToken> {
    const id = this.currentCreatedTokenId++;
    const now = new Date();
    const token: CreatedToken = {
      ...createdToken,
      id,
      status: "pending",
      transactionHash: null,
      createdAt: now,
      updatedAt: now
    };
    this.createdTokens.set(id, token);
    return token;
  }
  
  async getCreatedToken(id: number): Promise<CreatedToken | undefined> {
    return this.createdTokens.get(id);
  }
  
  async getUserCreatedTokens(userId: number): Promise<CreatedToken[]> {
    return Array.from(this.createdTokens.values()).filter(
      (token) => token.userId === userId
    );
  }
  
  async updateCreatedTokenStatus(id: number, status: string, transactionHash?: string): Promise<CreatedToken> {
    const token = this.createdTokens.get(id);
    if (!token) {
      throw new Error(`Created token with ID ${id} not found`);
    }
    
    token.status = status;
    token.updatedAt = new Date();
    
    if (transactionHash) {
      token.transactionHash = transactionHash;
    }
    
    this.createdTokens.set(id, token);
    return token;
  }
}

// Use MemStorage for prototyping until explicitly switching to database
export const storage = new MemStorage();
