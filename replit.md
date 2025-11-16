# Overview

TASChain is a decentralized platform that combines peer-to-peer token trading with real-time communication features. The platform operates on the Binance Smart Chain (BSC) and includes a token sale contract, blockchain explorer, video chat functionality, and community engagement features. Users can trade TAS tokens, create custom tokens, participate in video chats with strangers, and earn rewards for platform activities.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (November 16, 2025)

## Latest Updates - UI Improvements
- **Removed Header Images**: Removed all boy/girl chat images from headers on all pages (TradeNTalk.tsx and LocationPage.tsx) for cleaner, faster-loading pages
- **Fixed Scroll Issues**: Added smooth scrolling globally with `scroll-behavior: smooth` and `-webkit-overflow-scrolling: touch` for better mobile experience
- **Fixed Drawer Menu Icons**: Updated Header.tsx drawer to use proper city images instead of broken icon paths
  - Drawer now displays New York, London, Tokyo, Paris, Los Angeles, and Sydney with correct images
  - Each city has unique, professional landmark images
- **Smaller Header Images on Mobile**: Reduced top image grid from 320px to 240px on mobile for better performance

## Complete Image Coverage
- All 12 countries have unique cover images: USA, UK, Canada, Germany, Australia, France, India, Brazil, Mexico, Japan, South Korea, Italy
- All 25 cities have unique cover images:
  - New York, London, Tokyo, Paris, Los Angeles, Sydney, Dubai, Singapore, Mumbai, Toronto, Berlin, Seoul
  - Chicago, Miami, Las Vegas, San Francisco, Boston, Houston, Atlanta, Seattle
  - Manchester, Amsterdam, Barcelona, Rome, Madrid
- All 19 areas/regions have unique cover images:
  - California, Texas, Florida, New York State, Ontario, England, Scotland, Wales
  - Bavaria, Catalonia, Île-de-France, New South Wales, Queensland
  - Tokyo Region, Osaka Region, British Columbia, Quebec, Alberta
  - Maharashtra, Karnataka
- All country/city/area links show online user counts with animated green indicators
- Total: 56 unique location cover images across the platform

# Recent Changes (November 4, 2025)

## Gender and Location Filtering System
- Added three-step wallet connection flow: nickname → gender/location selection → wallet connection
- Gender filter with three options: Male, Female, Both (where "Both" means couple)
  - Available to all users for free
  - Used by backend matching logic to filter compatible peers
- Location filter (country/city/area) as premium feature
  - Requires ≥1 TAS token to use in actual matching
  - Pre-fills from location page visits via sessionStorage
  - Users without TAS tokens can select location but won't get location-filtered matches
- Enhanced backend websocket matching to filter by BOTH gender AND location
- All 150 location pages now have extensive unique SEO content
  - 7 H3 sections covering: how to talk, why people love it, tips, meeting girls, connecting with boys, safety & privacy, why choose platform
  - Location-specific CTAs and content
- Location pages automatically pre-select their location when users click "Start Talking"
  - Uses sessionStorage to pass location preference to TradeNTalkSimple component
  - Users from specific location pages connect with others from that same location

# System Architecture

## Frontend Architecture

**Framework & Build Tool**
- React with TypeScript for type safety
- Vite as the build tool for fast development and optimized production builds
- Tailwind CSS for styling with Radix UI component library
- shadcn/ui theme system for consistent design

**Key UI Components**
- Token trading interface with real-time price updates
- Video chat module (Trade N Talk) with WebRTC for peer-to-peer connections
- Blockchain explorer for viewing transactions and blocks
- Wallet connection interface supporting MetaMask and other Web3 wallets
- Admin dashboard for platform management

**State Management**
- React hooks for local component state
- WebSocket connections for real-time updates
- Session-based authentication for user management

**Mobile Optimization**
- Special handling for GoDaddy masked domains (talkastranger.com, tasonscan.com)
- Responsive design with mobile-first approach
- Custom detection middleware for mobile devices and masked domains

## Backend Architecture

**Server Framework**
- Express.js with TypeScript
- Session management using express-session
- RESTful API design with modular route organization

**WebSocket Integration**
- ws library for WebSocket server
- Real-time communication for video chat matching
- Live price updates and blockchain event notifications
- User presence tracking (online/offline status)

**Route Organization**
- Admin routes: Platform administration and user management
- Blockchain routes: Smart contract interactions and blockchain status
- Community routes: User profiles and community statistics
- Price routes: Token price data and historical charts
- Explorer routes: Blockchain explorer functionality
- Wallet routes: Wallet connection and transaction handling

**Smart Contract Integration**
- ethers.js for blockchain interactions
- Hardhat for contract development and deployment
- Support for BSC mainnet and testnet

**Key Contracts**
- TASToken: Main platform token (ERC-20)
- TASTokenSale: Token sale contract with market maker functionality
- TokenFactory: User-created token deployment
- SwapMarket: Peer-to-peer token swaps

## Data Storage

**Database**
- PostgreSQL via Neon serverless database
- Drizzle ORM for type-safe database queries
- Schema includes: users, tokens, user_tokens, swap_requests, matches, chats, messages, created_tokens, bnb_to_tas_swaps

**Storage Interface**
- Abstracted storage layer (IStorage interface)
- Database-backed implementation (DatabaseStorage class)
- Supports both in-memory and persistent storage

**Data Models**
- User profiles with wallet addresses, online status, and profile completion tracking
- Token metadata and balances
- Chat and messaging history
- Token swap requests and transaction records

## Authentication & Authorization

**Wallet-Based Authentication**
- MetaMask and Web3 wallet integration
- Session-based authentication with wallet address verification
- Admin authentication with username/password

**Session Management**
- Express-session for server-side session storage
- 24-hour session expiration
- Secure cookie configuration

**User Roles**
- Regular users: Trading, chatting, token creation
- Admins: Platform management, user moderation, blockchain monitoring

## Real-Time Features

**Price Oracle System**
- Live price tracking for TAS tokens
- Historical price data with configurable intervals (1h, 1d, 7d, 30d)
- Price change notifications via WebSocket

**Blockchain Event Listener**
- Monitors smart contract events
- Emits real-time trade notifications
- Community statistics tracking (holders, transactions, volume)

**Video Chat (Trade N Talk)**
- WebRTC for peer-to-peer video connections
- Random matching system
- Session management with automatic cleanup

# External Dependencies

## Blockchain Services

**Binance Smart Chain**
- Network: BSC Mainnet (Chain ID: 56) and Testnet (Chain ID: 97)
- RPC URL: https://bsc-dataseed.binance.org/
- Block explorer: BSCScan (https://bscscan.com)

**Smart Contract Addresses (BSC Mainnet)**
- TAS Token: 0xFF0Fc825FfE9c690cEb7fB08365d250b418B6A1c
- USDT Token: 0x55d398326f99059fF775485246999027B3197955
- PancakeSwap Pair: 0xd88892eF17862f89D385Fc52F7F51DEF86c94778
- PancakeSwap Router: 0x10ED43C718714eb63d5aA57B78B54704E256024E
- BNB Price Oracle: 0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE
- Token Factory: 0x262351BA892681919a9BaB17D39A8eB1d842Fad0
- Swap Market: 0x4FE94E5e7AF4b458E0e6Edc3c6D1D87E7d58c027

**BSCScan API**
- Contract verification
- Transaction and block data retrieval
- Token holder information
- Environment variable: BSCSCAN_API_KEY or BSC_SCAN_API_KEY

## Database

**Neon Serverless PostgreSQL**
- Connection via @neondatabase/serverless package
- WebSocket-based connection pooling
- Environment variable: DATABASE_URL

## Third-Party Libraries

**Blockchain & Web3**
- ethers.js: Ethereum/BSC blockchain interactions
- @openzeppelin/contracts: Secure smart contract templates
- Hardhat ecosystem: Contract development, testing, and deployment

**UI Components**
- Radix UI: Accessible component primitives
- shadcn/ui: Pre-built component library
- Tailwind CSS: Utility-first styling

**Development Tools**
- Drizzle Kit: Database migrations and schema management
- TypeScript: Type safety across the stack
- Vite: Fast build tooling

**Communication**
- WebSocket (ws): Real-time bidirectional communication
- WebRTC: Peer-to-peer video chat connections

## Environment Variables

Required configuration:
- `DATABASE_URL`: Neon PostgreSQL connection string
- `PRIVATE_KEY`: Wallet private key for contract deployment
- `BSCSCAN_API_KEY` or `BSC_SCAN_API_KEY`: BSCScan API key
- `SESSION_SECRET`: Express session secret key (optional, has default)
- `NODE_ENV`: Environment mode (development/production)

## API Integrations

**PancakeSwap**
- DEX integration for token swaps
- Liquidity pool information
- Price feeds

**Price Oracles**
- BNB/USD price oracle contract
- Custom price tracking for TAS tokens
- Historical price data aggregation