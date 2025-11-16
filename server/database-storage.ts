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
import { db } from "./db";
import { eq, and, or, desc } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByWalletAddress(address: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, address));
    return user || undefined;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values({
      ...user,
      isOnline: true,
      lastActive: new Date(),
      avatarBg: 'bg-primary-100',
      avatarTextColor: 'text-primary-700',
      createdAt: new Date()
    }).returning();
    return newUser;
  }

  async updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    await db.update(users)
      .set({ 
        isOnline, 
        lastActive: new Date() 
      })
      .where(eq(users.id, userId));
  }

  // Token operations
  async getToken(id: number): Promise<Token | undefined> {
    const [token] = await db.select().from(tokens).where(eq(tokens.id, id));
    return token || undefined;
  }

  async getTokenBySymbol(symbol: string): Promise<Token | undefined> {
    const [token] = await db.select().from(tokens).where(eq(tokens.symbol, symbol));
    return token || undefined;
  }

  async getAllTokens(): Promise<Token[]> {
    return await db.select().from(tokens);
  }

  async createToken(token: InsertToken): Promise<Token> {
    const [newToken] = await db.insert(tokens).values({
      ...token,
      isNative: token.isNative || false,
      createdAt: new Date()
    }).returning();
    return newToken;
  }

  async getNativeToken(): Promise<Token | undefined> {
    const [token] = await db.select().from(tokens).where(eq(tokens.isNative, true));
    return token || undefined;
  }

  // User Token operations
  async getUserTokens(userId: number): Promise<UserToken[]> {
    return await db.select().from(userTokens).where(eq(userTokens.userId, userId));
  }

  async getUserToken(userId: number, tokenId: number): Promise<UserToken | undefined> {
    const [userToken] = await db.select().from(userTokens).where(
      and(
        eq(userTokens.userId, userId),
        eq(userTokens.tokenId, tokenId)
      )
    );
    return userToken || undefined;
  }

  async addUserToken(userToken: InsertUserToken): Promise<UserToken> {
    const [newUserToken] = await db.insert(userTokens).values({
      ...userToken,
      updatedAt: new Date()
    }).returning();
    return newUserToken;
  }

  async updateUserToken(id: number, balance: number): Promise<UserToken> {
    const [updatedUserToken] = await db.update(userTokens)
      .set({ 
        balance, 
        updatedAt: new Date() 
      })
      .where(eq(userTokens.id, id))
      .returning();
    
    if (!updatedUserToken) {
      throw new Error(`User token with ID ${id} not found`);
    }
    
    return updatedUserToken;
  }

  // Swap Request operations
  async getSwapRequest(id: number): Promise<SwapRequest | undefined> {
    const [swapRequest] = await db.select().from(swapRequests).where(eq(swapRequests.id, id));
    return swapRequest || undefined;
  }

  async getUserSwapRequests(userId: number): Promise<SwapRequest[]> {
    return await db.select().from(swapRequests).where(eq(swapRequests.userId, userId));
  }

  async createSwapRequest(swapRequest: InsertSwapRequest): Promise<SwapRequest> {
    const now = new Date();
    const [newSwapRequest] = await db.insert(swapRequests).values({
      ...swapRequest,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }).returning();
    return newSwapRequest;
  }

  async updateSwapRequest(id: number, isActive: boolean): Promise<SwapRequest> {
    const [updatedSwapRequest] = await db.update(swapRequests)
      .set({ 
        isActive, 
        updatedAt: new Date() 
      })
      .where(eq(swapRequests.id, id))
      .returning();
    
    if (!updatedSwapRequest) {
      throw new Error(`Swap request with ID ${id} not found`);
    }
    
    return updatedSwapRequest;
  }

  // Match operations
  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match || undefined;
  }

  async getUserMatches(userId: number): Promise<Match[]> {
    return await db.select().from(matches).where(
      or(
        eq(matches.userAId, userId),
        eq(matches.userBId, userId)
      )
    );
  }

  async getAllMatches(): Promise<Match[]> {
    return await db.select().from(matches);
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const now = new Date();
    const [newMatch] = await db.insert(matches).values({
      ...match,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    }).returning();
    
    // Also create a chat for this match
    await this.createChat({ 
      matchId: newMatch.id,
      userAId: newMatch.userAId,
      userBId: newMatch.userBId
    });
    
    return newMatch;
  }

  async updateMatchStatus(id: number, status: string): Promise<Match> {
    const [updatedMatch] = await db.update(matches)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(matches.id, id))
      .returning();
    
    if (!updatedMatch) {
      throw new Error(`Match with ID ${id} not found`);
    }
    
    return updatedMatch;
  }

  // Chat operations
  async getChat(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat || undefined;
  }

  async getChatByMatchId(matchId: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.matchId, matchId));
    return chat || undefined;
  }

  async getChatIdForUsers(userAId: number, userBId: number): Promise<number | undefined> {
    // Find a match between these two users
    const [match] = await db.select().from(matches).where(
      or(
        and(
          eq(matches.userAId, userAId),
          eq(matches.userBId, userBId)
        ),
        and(
          eq(matches.userAId, userBId),
          eq(matches.userBId, userAId)
        )
      )
    );
    
    if (!match) {
      return undefined;
    }
    
    // Find the chat for this match
    const chat = await this.getChatByMatchId(match.id);
    return chat?.id;
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const now = new Date();
    const [newChat] = await db.insert(chats).values({
      ...chat,
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now
    }).returning();
    return newChat;
  }

  // Message operations
  async getMessages(chatId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.timestamp);
  }

  async addMessage(message: InsertMessage): Promise<Message> {
    const now = new Date();
    const [newMessage] = await db.insert(messages).values({
      ...message,
      timestamp: now,
      isRead: false
    }).returning();
    
    // Update the chat's lastMessageAt
    await db.update(chats)
      .set({ lastMessageAt: now })
      .where(eq(chats.id, message.chatId));
    
    return newMessage;
  }

  async markMessagesAsRead(chatId: number, userId: number): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.chatId, chatId),
          eq(messages.isRead, false)
        )
      );
  }

  // TAS Blockchain Operations
  async createBnbToTasSwap(swap: InsertBnbToTasSwap): Promise<BnbToTasSwap> {
    const now = new Date();
    const [newSwap] = await db.insert(bnbToTasSwaps).values({
      ...swap,
      status: "pending",
      transactionHash: null,
      createdAt: now,
      updatedAt: now
    }).returning();
    return newSwap;
  }
  
  async getBnbToTasSwap(id: number): Promise<BnbToTasSwap | undefined> {
    const [swap] = await db.select().from(bnbToTasSwaps).where(eq(bnbToTasSwaps.id, id));
    return swap || undefined;
  }
  
  async getUserBnbToTasSwaps(userId: number): Promise<BnbToTasSwap[]> {
    return await db.select().from(bnbToTasSwaps).where(eq(bnbToTasSwaps.userId, userId));
  }
  
  async updateBnbToTasSwapStatus(id: number, status: string, transactionHash?: string): Promise<BnbToTasSwap> {
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (transactionHash) {
      updateData.transactionHash = transactionHash;
    }
    
    const [updatedSwap] = await db.update(bnbToTasSwaps)
      .set(updateData)
      .where(eq(bnbToTasSwaps.id, id))
      .returning();
    
    if (!updatedSwap) {
      throw new Error(`BNB to TAS swap with ID ${id} not found`);
    }
    
    return updatedSwap;
  }
  
  // TAS Token Creation Operations
  async createTasToken(token: InsertCreatedToken): Promise<CreatedToken> {
    const now = new Date();
    const [newToken] = await db.insert(createdTokens).values({
      ...token,
      status: "pending",
      transactionHash: null,
      createdAt: now,
      updatedAt: now
    }).returning();
    return newToken;
  }
  
  async getCreatedToken(id: number): Promise<CreatedToken | undefined> {
    const [token] = await db.select().from(createdTokens).where(eq(createdTokens.id, id));
    return token || undefined;
  }
  
  async getUserCreatedTokens(userId: number): Promise<CreatedToken[]> {
    return await db.select().from(createdTokens).where(eq(createdTokens.userId, userId));
  }
  
  async updateCreatedTokenStatus(id: number, status: string, transactionHash?: string): Promise<CreatedToken> {
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (transactionHash) {
      updateData.transactionHash = transactionHash;
    }
    
    const [updatedToken] = await db.update(createdTokens)
      .set(updateData)
      .where(eq(createdTokens.id, id))
      .returning();
    
    if (!updatedToken) {
      throw new Error(`Created token with ID ${id} not found`);
    }
    
    return updatedToken;
  }
}