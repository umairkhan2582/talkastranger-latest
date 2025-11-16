import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import TASMascot, { MASCOT_NAME } from "./TASMascot";
import { 
  FileText, 
  CreditCard, 
  Copy, 
  Check,
  Users,
  RefreshCcw
} from "lucide-react";
import { useState } from "react";
import logoPath from "@assets/IMG_0221.jpeg";

const HeroSection = () => {
  const { translate } = useLanguage();
  const { isConnected, openConnectModal } = useWallet();
  const [showContract, setShowContract] = useState(false);
  const contractAddress = "0xd9541b134b1821736bd323135b8844d3ae408216";
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative bg-white overflow-hidden rounded-xl shadow-sm mb-12">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-primary-100 opacity-60"></div>
      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-dark-800 leading-tight">
              Trade and Talk on TASChain Platform
            </h1>
            <p className="mt-5 text-lg text-dark-600">
              TASChain is a revolutionary peer-to-peer token trading platform that matches users for direct trading and conversation. Create your own tokens, trade with others, and build your digital asset portfolio on our secure blockchain network.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              {isConnected ? (
                <Link to="/matches">
                  <Button size="lg" className="bg-primary hover:bg-primary-600 text-white shadow-sm">
                    <Users className="mr-2 h-5 w-5" />
                    Find My Matches
                  </Button>
                </Link>
              ) : (
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary-600 text-white shadow-sm"
                  onClick={openConnectModal}
                >
                  <RefreshCcw className="mr-2 h-5 w-5" />
                  Get Started
                </Button>
              )}
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md hover:shadow-lg transition-all"
                onClick={() => window.open(`https://pancakeswap.finance/swap?outputCurrency=${contractAddress}`, '_blank')}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                BUY TAS
              </Button>
              <Link to="/whitepaper">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-dark-300 hover:bg-gray-50 text-dark-700"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Learn More
                </Button>
              </Link>
            </div>
            
            {/* Contract Address Revealer */}
            <div className="mt-3">
              <button 
                onClick={() => setShowContract(!showContract)} 
                className="text-xs text-primary-600 hover:text-primary-800 flex items-center transition-all duration-300"
              >
                {showContract ? "Hide Contract Address" : "Reveal Contract Address"}
              </button>
              
              {showContract && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <img src={logoPath} className="h-7 w-7 object-cover" alt="TAS" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">TASChain Contract</div>
                      <div className="text-base font-medium text-gray-800 font-mono break-all">
                        {contractAddress}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="ml-2 p-2 text-gray-500 hover:text-primary hover:bg-primary-50 rounded-full transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="hidden lg:flex flex-col items-center justify-center">
            <div className="relative">
              {/* Large mascot in hero section */}
              <div className="float-animation">
                <TASMascot size="2xl" animated={true} />
              </div>
              
              {/* Speech bubble */}
              <div className="absolute -top-8 left-0 bg-indigo-100 dark:bg-indigo-900 rounded-xl px-5 py-3 shadow-lg">
                <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  Hi! I'm {MASCOT_NAME}, your guide to the TASChain platform!
                </div>
                <div className="absolute bottom-0 left-8 transform translate-y-1/2 rotate-45 w-4 h-4 bg-indigo-100 dark:bg-indigo-900"></div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <span className="text-lg font-bold text-primary bg-primary-50 px-3 py-1 rounded-full">
                {MASCOT_NAME}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* How it works section */}
      <div id="how-it-works" className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="flex items-center justify-center mb-4">
          <h2 className="text-2xl font-heading font-semibold text-dark-800 text-center">
            How It Works
          </h2>
          {/* Small mascot icon next to heading */}
          <div className="ml-3">
            <TASMascot size="sm" animated={true} />
          </div>
        </div>
        <p className="text-center text-slate-600 mb-8 max-w-2xl mx-auto">
          {MASCOT_NAME} will guide you through the process of getting started with TASChain
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Connect Your Wallet</h3>
            <p className="text-dark-500">Link your cryptocurrency wallet to the TASChain platform to access all trading features and token creation capabilities.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Find Trading Partners</h3>
            <p className="text-dark-500">Get matched with other users based on your token preferences and trading interests. Our system connects you directly with compatible trading partners.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Chat and Trade</h3>
            <p className="text-dark-500">Engage in real-time conversations with your trading partners while seamlessly exchanging tokens. Our integrated chat and trading system makes the process simple and efficient.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
