import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Search, Menu, X, ExternalLink, Database, BarChart, Activity } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NETWORK_CONFIG } from "@/lib/contract-addresses";

const ExplorerHeader = () => {
  // In the actual WalletContext, the connect/disconnect functions have different names
  const { isConnected, address, connect: connectWallet, disconnect: disconnectWallet } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTASonscan, setIsTASonscan] = useState(false);
  
  // Check if we're on TASonscan.com
  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname === 'tasonscan.com' || hostname.includes('tasonscan')) {
      setIsTASonscan(true);
    }
    
    // For development - detect if explorer param is set
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('isTASonscan') === 'true') {
      setIsTASonscan(true);
    }
  }, []);

  return (
    <header className={`sticky top-0 z-40 w-full border-b ${isTASonscan ? 'bg-[#1a1c24] text-white' : 'bg-background'}`}>
      <div className="container flex items-center justify-between h-16 mx-auto px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link to={isTASonscan ? "/explorer" : "/"} className="flex items-center font-bold text-xl">
            {isTASonscan ? (
              <>
                <Database className="mr-2 h-6 w-6 text-blue-400" />
                <span className="hidden sm:inline bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">TASonscan</span>
                <span className="sm:hidden bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">TAS</span>
              </>
            ) : (
              <>
                <Activity className="mr-2 h-6 w-6 text-primary" />
                <span>TASChain Explorer</span>
              </>
            )}
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/explorer" className={`text-sm font-medium ${isTASonscan ? 'text-blue-400 hover:text-blue-300' : 'hover:text-primary'}`}>
            Home
          </Link>
          <Link to="/explorer?tab=blocks" className={`text-sm font-medium ${isTASonscan ? 'text-blue-400 hover:text-blue-300' : 'hover:text-primary'}`}>
            Blocks
          </Link>
          <Link to="/explorer?tab=transactions" className={`text-sm font-medium ${isTASonscan ? 'text-blue-400 hover:text-blue-300' : 'hover:text-primary'}`}>
            Transactions
          </Link>
          <Link to="/explorer?tab=tokens" className={`text-sm font-medium ${isTASonscan ? 'text-blue-400 hover:text-blue-300' : 'hover:text-primary'}`}>
            Tokens
          </Link>
          <div className="flex items-center">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${isTASonscan ? 'bg-blue-900/30 text-blue-400' : 'bg-primary/10 text-primary'}`}>
              {NETWORK_CONFIG.name}
            </span>
          </div>
        </nav>

        {/* Connect Wallet Button */}
        <div className="hidden md:flex items-center space-x-4">
          {isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {address?.substring(0, 6)}...{address?.substring(38)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Wallet</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => {
                  navigator.clipboard.writeText(address || "");
                }}>
                  Copy Address
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={disconnectWallet}>
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              onClick={(e) => {
                e.preventDefault();
                connectWallet('metamask', 'Browser Wallet');
              }} 
              size="sm"
            >
              Connect Wallet
            </Button>
          )}
          
          {!isTASonscan && (
            <Button 
              variant="ghost"
              size="icon"
              asChild
            >
              <a 
                href={`https://tasonscan.com/explorer`} 
                target="_blank" 
                rel="noopener noreferrer"
                title="Open TASonscan"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={`md:hidden px-4 py-6 ${isTASonscan ? 'bg-[#1a1c24] text-white border-b border-blue-900/30' : 'bg-background'}`}>
          <nav className="flex flex-col space-y-4">
            <Link to="/explorer" className={`text-sm font-medium ${isTASonscan ? 'text-blue-400 hover:text-blue-300' : 'hover:text-primary'}`}>
              Home
            </Link>
            <Link to="/explorer?tab=blocks" className={`text-sm font-medium ${isTASonscan ? 'text-blue-400 hover:text-blue-300' : 'hover:text-primary'}`}>
              Blocks
            </Link>
            <Link to="/explorer?tab=transactions" className={`text-sm font-medium ${isTASonscan ? 'text-blue-400 hover:text-blue-300' : 'hover:text-primary'}`}>
              Transactions
            </Link>
            <Link to="/explorer?tab=tokens" className={`text-sm font-medium ${isTASonscan ? 'text-blue-400 hover:text-blue-300' : 'hover:text-primary'}`}>
              Tokens
            </Link>
            <div className="flex items-center">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${isTASonscan ? 'bg-blue-900/30 text-blue-400' : 'bg-primary/10 text-primary'}`}>
                {NETWORK_CONFIG.name}
              </span>
            </div>

            {isConnected ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Connected as:</p>
                <div className="flex justify-between">
                  <code className="text-xs bg-secondary px-2 py-1 rounded">
                    {address?.substring(0, 16)}...
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(address || "");
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={disconnectWallet}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  connectWallet('metamask', 'Browser Wallet');
                }}
              >
                Connect Wallet
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default ExplorerHeader;