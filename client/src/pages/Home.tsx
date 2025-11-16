import HeroSection from "@/components/HeroSection";
import TokenSelectionSection from "@/components/TokenSelectionSection";
import ChatInterface from "@/components/ChatInterface";
import CreatedTokensSection from "@/components/CreatedTokensSection";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/contexts/WalletContext";
import { useTASChain } from "@/contexts/TASChainContext";
import TASMascot from "@/components/TASMascot";

const Home = () => {
  const { translate } = useLanguage();
  const { isConnected, openConnectModal } = useWallet();
  const { isConnected: isTASConnected } = useTASChain();

  return (
    <div>
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <HeroSection />
        
        {/* TAS Chain Info Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-br from-primary/10 to-sky-100 rounded-xl p-6 relative">
            {/* Add mascot to top-right corner */}
            <div className="absolute -top-10 -right-2 float-animation pulse-glow hidden md:block z-10">
              <TASMascot size="lg" animated={true} greeting={true} />
            </div>
            
            <h2 className="text-2xl font-bold text-primary mb-4">
              TAS Chain Token - The Backbone of Our Ecosystem
            </h2>
            <p className="text-slate-700 mb-6">
              TAS is the native cryptocurrency powering the TASChain blockchain. It serves as the foundation for all transactions, token creation, and trading activities on our platform. With TAS tokens, you can create your own custom tokens with automated bonding curves, participate in peer-to-peer trading, and connect with other traders through our innovative Talk & Trade feature.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/50 rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">
                      Create Your Own Tokens
                    </h3>
                    <p className="text-sm text-slate-600">
                      Create custom tokens with automated bonding curves for instant liquidity on TAS Chain. <a href="https://theseven.meme" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Meme tokens get better trading from the very beginning</a>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/50 rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">
                      Trade & Chat Simultaneously
                    </h3>
                    <p className="text-sm text-slate-600">
                      Our unique peer-to-peer trading system lets you exchange tokens directly with other users while chatting in real-time about market trends and opportunities.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/50 rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">
                      Secure & Transparent Blockchain
                    </h3>
                    <p className="text-sm text-slate-600">
                      All transactions and token activities are securely recorded on the TASChain blockchain with real-time verification and complete transparency through our public explorer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
              <a 
                href="/buy-tokens" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-colors"
              >
                <img src="/logo-icon.png" className="h-4 w-4 mr-1 rounded-full" alt="TAS" />
                BUY TAS
              </a>
              <a 
                href="/whitepaper" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Whitepaper
              </a>
              <a 
                href="/create-token" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Token
              </a>
              <a 
                href="/marketplace" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Token Marketplace
              </a>
              <a 
                href="https://tascanblocks.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-primary rounded-md shadow-sm text-sm font-medium text-primary bg-white hover:bg-primary/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                TAScanblocks.com
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <a 
                href="https://tasonscan.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-primary rounded-md shadow-sm text-sm font-medium text-primary bg-white hover:bg-primary/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                TASonscan.com
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        {isConnected ? (
          <TokenSelectionSection />
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-12 text-center relative">
            {/* Add mascot to connect wallet section */}
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 float-animation pulse-glow">
              <TASMascot size="lg" animated={true} />
            </div>
            
            <div className="mt-10">
              <h2 className="text-2xl font-heading font-semibold text-dark-800 mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-dark-600 mb-6">
                Connect your wallet to access all features of the TASChain platform, including token swapping, trading with other users, and the ability to create your own custom tokens with unique properties.
              </p>
              <button 
                onClick={() => openConnectModal()} 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-primary to-sky-400 hover:from-primary-600 hover:to-sky-500 hover:shadow-lg transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Connect to TASChain
              </button>
            </div>
          </div>
        )}
      </div>
      <CreatedTokensSection />
      
      {/* TASChain Roadmap Section */}
      <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-sky-500">TASChain</span> Roadmap
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Our journey to build the most innovative peer-to-peer token trading and communication platform
            </p>
            
            {/* Mascot display */}
            <div className="flex justify-center mt-6">
              <div className="relative">
                <TASMascot size="lg" animated={true} />
                <div className="absolute -top-8 left-full ml-4 bg-indigo-100 dark:bg-indigo-900 rounded-xl px-5 py-3 shadow-lg w-64">
                  <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    Follow our roadmap to see where TASChain is heading next!
                  </div>
                  <div className="absolute top-1/2 right-full transform -translate-y-1/2 rotate-45 w-4 h-4 bg-indigo-100 dark:bg-indigo-900"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all">
              <h3 className="font-bold text-xl mb-3 text-primary">Phase 1: Foundation <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full ml-2">Completed</span></h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-800 h-5 w-5 text-xs mr-2 mt-0.5">✓</span>
                  TASToken contract deployment on BSC
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-800 h-5 w-5 text-xs mr-2 mt-0.5">✓</span>
                  Development of token sale infrastructure
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-800 h-5 w-5 text-xs mr-2 mt-0.5">✓</span>
                  Core platform architecture
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-800 h-5 w-5 text-xs mr-2 mt-0.5">✓</span>
                  Website and initial exchange listings
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all">
              <h3 className="font-bold text-xl mb-3 text-primary">Phase 2: Growth <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full ml-2">In Progress</span></h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-800 h-5 w-5 text-xs mr-2 mt-0.5">✓</span>
                  Peer-to-peer token swapping
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-800 h-5 w-5 text-xs mr-2 mt-0.5">→</span>
                  Custom token creation platform
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-800 h-5 w-5 text-xs mr-2 mt-0.5">→</span>
                  Talk & Trade matching system
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-800 h-5 w-5 text-xs mr-2 mt-0.5">→</span>
                  Community governance implementation
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all">
              <h3 className="font-bold text-xl mb-3 text-primary">Phase 3: Expansion <span className="bg-slate-100 text-slate-800 text-xs font-medium px-2 py-0.5 rounded-full ml-2">Upcoming</span></h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-800 h-5 w-5 text-xs mr-2 mt-0.5">○</span>
                  TASChain mainnet launch
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-800 h-5 w-5 text-xs mr-2 mt-0.5">○</span>
                  Cross-chain integration
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-800 h-5 w-5 text-xs mr-2 mt-0.5">○</span>
                  Mobile app development
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-800 h-5 w-5 text-xs mr-2 mt-0.5">○</span>
                  Enhanced DeFi capabilities
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      

    </div>
  );
};

export default Home;
