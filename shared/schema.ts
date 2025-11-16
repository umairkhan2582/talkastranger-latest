import { pgTable, text, serial, integer, boolean, timestamp, varchar, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =========== Users ===========
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  nickname: text("nickname"),
  email: text("email"),
  emailVerified: boolean("email_verified").default(false),
  walletAddress: text("wallet_address"),
  walletType: text("wallet_type"),
  tasWalletAddress: text("tas_wallet_address"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  bio: text("bio"),
  dateOfBirth: text("date_of_birth"),
  website: text("website"),
  isPublicProfile: boolean("is_public_profile").default(true),
  isOnline: boolean("is_online").default(false),
  lastActive: timestamp("last_active").defaultNow(),
  avatarBg: text("avatar_bg").default("bg-primary-100"),
  avatarTextColor: text("avatar_text_color").default("text-primary-700"),
  profileCompleted: boolean("profile_completed").default(false),
  gender: text("gender"),
  country: text("country"),
  city: text("city"),
  area: text("area"),
  createdAt: timestamp("created_at").defaultNow(),
});

// =========== Tokens ===========
export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  price: real("price").notNull().default(0),
  network: text("network").notNull(),
  contractAddress: text("contract_address"),
  bg: text("bg").notNull().default("bg-gray-100"),
  textColor: text("text_color").notNull().default("text-gray-500"),
  isCustom: boolean("is_custom").default(false),
  isNative: boolean("is_native").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// =========== User Tokens ===========
export const userTokens = pgTable("user_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tokenId: integer("token_id").notNull().references(() => tokens.id),
  balance: real("balance").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =========== Swap Requests ===========
export const swapRequests = pgTable("swap_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  offerTokenId: integer("offer_token_id").notNull().references(() => tokens.id),
  offerAmount: real("offer_amount").notNull(),
  wantTokenId: integer("want_token_id").notNull().references(() => tokens.id),
  wantAmount: real("want_amount").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =========== Matches ===========
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  userAId: integer("user_a_id").notNull().references(() => users.id),
  userBId: integer("user_b_id").notNull().references(() => users.id),
  swapRequestAId: integer("swap_request_a_id").notNull().references(() => swapRequests.id),
  swapRequestBId: integer("swap_request_b_id").notNull().references(() => swapRequests.id),
  matchType: text("match_type").notNull().default("near"), // "perfect" or "near"
  status: text("status").notNull().default("pending"), // "pending", "accepted", "rejected", "completed"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =========== Chats ===========
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id),
  userAId: integer("user_a_id").notNull().references(() => users.id),
  userBId: integer("user_b_id").notNull().references(() => users.id),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =========== Messages ===========
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id),
  userId: integer("user_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isRead: boolean("is_read").default(false),
});

// =========== Created Tokens (on TAS Chain) ===========
export const createdTokens = pgTable("created_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tokenId: integer("token_id").notNull().references(() => tokens.id),
  initialSupply: real("initial_supply").notNull(),
  tasTokensCost: real("tas_tokens_cost").notNull(),
  transactionHash: text("transaction_hash"),
  status: text("status").notNull().default("pending"), // "pending", "minting", "completed", "failed"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =========== BNB to TAS Swaps ===========
export const bnbToTasSwaps = pgTable("bnb_to_tas_swaps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bnbAmount: real("bnb_amount").notNull(),
  tasAmount: real("tas_amount").notNull(),
  transactionHash: text("transaction_hash"),
  status: text("status").notNull().default("pending"), // "pending", "processing", "completed", "failed"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =========== Private Chat Requests ===========
export const privateChatRequests = pgTable("private_chat_requests", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  message: text("message"), // Optional message with the request
  status: text("status").notNull().default("pending"), // "pending", "accepted", "rejected"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =========== Private Conversations ===========
export const privateConversations = pgTable("private_conversations", {
  id: serial("id").primaryKey(),
  userAId: integer("user_a_id").notNull().references(() => users.id),
  userBId: integer("user_b_id").notNull().references(() => users.id),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =========== Private Messages ===========
export const privateMessages = pgTable("private_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => privateConversations.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// =========== Token Transfers ===========
export const tokenTransfers = pgTable("token_transfers", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  tokenId: integer("token_id").notNull().references(() => tokens.id),
  amount: real("amount").notNull(),
  transactionHash: text("transaction_hash"),
  status: text("status").notNull().default("pending"), // "pending", "processing", "completed", "failed"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =========== Peer to Peer Swap Proposals ===========
export const p2pSwapProposals = pgTable("p2p_swap_proposals", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => privateConversations.id),
  proposerId: integer("proposer_id").notNull().references(() => users.id),
  proposerTokenId: integer("proposer_token_id").notNull().references(() => tokens.id),
  proposerAmount: real("proposer_amount").notNull(),
  proposerLocked: boolean("proposer_locked").default(false),
  responderId: integer("responder_id").notNull().references(() => users.id),
  responderTokenId: integer("responder_token_id").references(() => tokens.id),
  responderAmount: real("responder_amount"),
  responderLocked: boolean("responder_locked").default(false),
  status: text("status").notNull().default("proposed"), // "proposed", "negotiating", "both_locked", "executing", "completed", "cancelled"
  transactionHashA: text("transaction_hash_a"), // Proposer's transaction
  transactionHashB: text("transaction_hash_b"), // Responder's transaction
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =========== Insert Schemas ===========
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  nickname: true,
  email: true,
  walletAddress: true,
  walletType: true,
  tasWalletAddress: true,
});

export const insertTokenSchema = createInsertSchema(tokens).pick({
  name: true,
  symbol: true,
  price: true,
  network: true,
  contractAddress: true,
  bg: true,
  textColor: true,
  isCustom: true,
  isNative: true,
});

export const insertUserTokenSchema = createInsertSchema(userTokens).pick({
  userId: true,
  tokenId: true,
  balance: true,
});

export const insertSwapRequestSchema = createInsertSchema(swapRequests).pick({
  userId: true,
  offerTokenId: true,
  offerAmount: true,
  wantTokenId: true,
  wantAmount: true,
});

export const insertMatchSchema = createInsertSchema(matches).pick({
  userAId: true,
  userBId: true,
  swapRequestAId: true,
  swapRequestBId: true,
  matchType: true,
});

export const insertChatSchema = createInsertSchema(chats).pick({
  matchId: true,
  userAId: true,
  userBId: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  chatId: true,
  userId: true,
  text: true,
  isRead: true,
});

export const insertCreatedTokenSchema = createInsertSchema(createdTokens).pick({
  userId: true,
  tokenId: true,
  initialSupply: true,
  tasTokensCost: true,
  transactionHash: true,
  status: true,
});

export const insertBnbToTasSwapSchema = createInsertSchema(bnbToTasSwaps).pick({
  userId: true,
  bnbAmount: true,
  tasAmount: true,
  transactionHash: true,
  status: true,
});

export const insertPrivateChatRequestSchema = createInsertSchema(privateChatRequests).pick({
  fromUserId: true,
  toUserId: true,
  message: true,
});

export const insertPrivateConversationSchema = createInsertSchema(privateConversations).pick({
  userAId: true,
  userBId: true,
});

export const insertPrivateMessageSchema = createInsertSchema(privateMessages).pick({
  conversationId: true,
  senderId: true,
  text: true,
});

export const insertTokenTransferSchema = createInsertSchema(tokenTransfers).pick({
  fromUserId: true,
  toUserId: true,
  tokenId: true,
  amount: true,
  transactionHash: true,
});

export const insertP2pSwapProposalSchema = createInsertSchema(p2pSwapProposals).pick({
  conversationId: true,
  proposerId: true,
  proposerTokenId: true,
  proposerAmount: true,
  responderId: true,
  responderTokenId: true,
  responderAmount: true,
});

// =========== Custom Schemas ===========
export const walletConnectSchema = z.object({
  address: z.string().min(1, { message: "Wallet address is required" }),
  nickname: z.string().min(1, { message: "Nickname is required" }),
  walletType: z.string().min(1, { message: "Wallet type is required" }),
});

export const customTokenSchema = z.object({
  name: z.string().min(1, { message: "Token name is required" }),
  symbol: z.string().min(1, { message: "Token symbol is required" }),
  network: z.string().min(1, { message: "Network is required" }),
  contractAddress: z.string().min(1, { message: "Contract address is required" }),
});

export const tokenRegistrationSchema = z.object({
  name: z.string().min(1, { message: "Token name is required" }),
  symbol: z.string().min(1, { message: "Token symbol is required" }),
  address: z.string().min(1, { message: "Contract address is required" }),
  supply: z.string().optional(),
  transactionHash: z.string().optional(),
  initialPrice: z.number().optional().default(0.01),
});

export const createTasTokenSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" })
    .max(25, { message: "Name cannot exceed 25 characters" }),
  symbol: z.string().min(2, { message: "Symbol must be at least 2 characters" })
    .max(6, { message: "Symbol cannot exceed 6 characters" })
    .regex(/^[A-Z0-9]+$/, { message: "Symbol must contain only uppercase letters and numbers" }),
  supply: z.number().min(10000, { message: "Minimum supply is 10,000" })
    .max(1000000000, { message: "Maximum supply is 1 billion" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" })
    .max(500, { message: "Description cannot exceed 500 characters" }),
  initialPrice: z.number().min(0.001, { message: "Minimum price is 0.001 TAS" })
    .max(1000, { message: "Maximum price is 1000 TAS" }),
  type: z.string().min(1, { message: "Token type is required" }),
  curveType: z.string().min(1, { message: "Bonding curve type is required" }),
  ownerAddress: z.string().min(1, { message: "Owner address is required" }),
  imageBase64: z.string().nullable().optional(),
});

export const findMatchesSchema = z.object({
  offerToken: z.string().min(1, { message: "Offer token is required" }),
  offerAmount: z.string().min(1, { message: "Offer amount is required" }),
  wantToken: z.string().min(1, { message: "Want token is required" }),
  wantAmount: z.string().min(1, { message: "Want amount is required" }),
});

// =========== Types ===========
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokens.$inferSelect;

export type InsertUserToken = z.infer<typeof insertUserTokenSchema>;
export type UserToken = typeof userTokens.$inferSelect;

export type InsertSwapRequest = z.infer<typeof insertSwapRequestSchema>;
export type SwapRequest = typeof swapRequests.$inferSelect;

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertCreatedToken = z.infer<typeof insertCreatedTokenSchema>;
export type CreatedToken = typeof createdTokens.$inferSelect;

export type InsertBnbToTasSwap = z.infer<typeof insertBnbToTasSwapSchema>;
export type BnbToTasSwap = typeof bnbToTasSwaps.$inferSelect;

export type InsertPrivateChatRequest = z.infer<typeof insertPrivateChatRequestSchema>;
export type PrivateChatRequest = typeof privateChatRequests.$inferSelect;

export type InsertPrivateConversation = z.infer<typeof insertPrivateConversationSchema>;
export type PrivateConversation = typeof privateConversations.$inferSelect;

export type InsertPrivateMessage = z.infer<typeof insertPrivateMessageSchema>;
export type PrivateMessage = typeof privateMessages.$inferSelect;

export type InsertTokenTransfer = z.infer<typeof insertTokenTransferSchema>;
export type TokenTransfer = typeof tokenTransfers.$inferSelect;

export type InsertP2pSwapProposal = z.infer<typeof insertP2pSwapProposalSchema>;
export type P2pSwapProposal = typeof p2pSwapProposals.$inferSelect;

export type WalletConnect = z.infer<typeof walletConnectSchema>;
export type CustomToken = z.infer<typeof customTokenSchema>;
export type TokenRegistration = z.infer<typeof tokenRegistrationSchema>;
export type FindMatches = z.infer<typeof findMatchesSchema>;
