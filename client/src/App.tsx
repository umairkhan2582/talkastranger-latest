import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { WalletProvider } from "./contexts/WalletContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { TASChainProvider } from "./contexts/TASChainContext";
import { TokenUpdateProvider } from "./contexts/TokenUpdateContext";
import { PriceOracleProvider } from "./contexts/PriceOracleContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileNavBar from "./components/MobileNavBar";
import { BrowserCompatibleRouter, useBrowser } from "./lib/BrowserCompatibleRouter";
import { getBrowserName } from "./lib/browser-utils";
import { detectBrowser, applyBrowserFixes, needsStandardization } from "./lib/browserDetector";
import { useState, useEffect } from "react";

// Page imports
import Home from "./pages/Home";
import Matches from "./pages/Matches";
import Messages from "./pages/Messages";
import BuyTokens from "./pages/BuyTokens";
import TokenMarketplace from "./pages/TokenMarketplace";
import TokenDetails from "./pages/TokenDetails";
import TokenDetailPage from "./pages/TokenDetailPage"; // New token detail page with tabs and chat
import TASNativeTokenPage from "./pages/TASNativeTokenPage"; // Special page for TASnative token
import SimpleBnbSwap from "./pages/SimpleBnbSwap";  // Ultra-simplified token sale component
import Wallet from "./pages/Wallet";
import SendTASPage from "./pages/SendTASPage"; // Add direct token transfer page
import Profile from "./pages/Profile"; // User profile page with email verification
import Admin from "./pages/Admin"; // Admin dashboard page
import AdminLogin from "./pages/AdminLogin"; // Admin login page
import TradeNTalk from "./pages/TradeNTalk";
import VideoChat from "./pages/VideoChat";
import UserRegistration from "./pages/UserRegistration";
import TokenTrading from "./pages/TokenTrading";
import SimpleTokenTrading from "./pages/SimpleTokenTrading";
import SimpleTokenCreator from "./pages/SimpleTokenCreator"; // Token Creator
import BlockExplorer from "./pages/BlockExplorer"; // Block Explorer for TASonscan
import TASonscanLanding from "./pages/TASonscanLanding"; // TASonscan landing with auto-redirect
import WhitePaperPage from "./pages/whitepaper-page";
import PrivacyPolicyPage from "./pages/privacy-policy-page";
import TermsOfServicePage from "./pages/terms-of-service-page";
import AboutUsPage from "./pages/about-us-page";
import BrandingPage from "./pages/branding-page";
import ContactPage from "./pages/contact-page";
import DeploymentPage from "./pages/DeploymentPage";
import DeploymentControl from "./pages/DeploymentControl"; // Digital Ocean deployment
import LocationPage from "./pages/LocationPage"; // SEO location pages
import LocationsDirectory from "./pages/LocationsDirectory"; // Locations directory/sitemap

function Router() {
  const { browserName } = useBrowser();
  
  // Log on component mount to help debug navigation
  useEffect(() => {
    console.log(`[App Router] Running in ${browserName} browser`);
  }, [browserName]);
  
  return (
    <Switch>
      <Route path="/">
        <TradeNTalk />
      </Route>
      <Route path="/home">
        <Home />
      </Route>
      <Route path="/matches">
        <Matches />
      </Route>
      <Route path="/messages">
        <Messages />
      </Route>
      <Route path="/buy-tokens">
        <SimpleBnbSwap />
      </Route>
      <Route path="/bnb-swap">
        <SimpleBnbSwap />
      </Route>
      <Route path="/trade-n-talk">
        <TradeNTalk />
      </Route>
      <Route path="/register">
        <UserRegistration />
      </Route>
      <Route path="/video-chat">
        <VideoChat />
      </Route>
      <Route path="/create-token">
        <SimpleTokenCreator />
      </Route>
      {/* Use the same component for both routes */}
      <Route path="/simple-token-creator">
        <SimpleTokenCreator />
      </Route>
      <Route path="/marketplace">
        <TokenMarketplace />
      </Route>
      <Route path="/token/:tokenId">
        <TokenDetailPage />
      </Route>
      <Route path="/token/tasnative">
        <TASNativeTokenPage />
      </Route>
      <Route path="/token/:tokenAddress/details">
        <TokenDetails />
      </Route>
      <Route path="/token/:tokenAddress/trade">
        <SimpleTokenTrading />
      </Route>
      <Route path="/wallet">
        <Wallet />
      </Route>
      <Route path="/send-tas">
        <SendTASPage />
      </Route>
      <Route path="/whitepaper">
        <WhitePaperPage />
      </Route>
      <Route path="/privacy-policy">
        <PrivacyPolicyPage />
      </Route>
      <Route path="/terms-of-service">
        <TermsOfServicePage />
      </Route>
      <Route path="/about-us">
        <AboutUsPage />
      </Route>
      <Route path="/branding">
        <BrandingPage />
      </Route>
      <Route path="/contact">
        <ContactPage />
      </Route>
      <Route path="/profile">
        <Profile />
      </Route>
      <Route path="/deploy">
        <DeploymentControl />
      </Route>
      <Route path="/deploy/contracts">
        <DeploymentPage />
      </Route>
      <Route path="/explorer">
        <BlockExplorer />
      </Route>
      {/* Special routes for address pages */}
      <Route path="/address/:address">
        <BlockExplorer />
      </Route>
      <Route path="/explorer/address/:address">
        <BlockExplorer />
      </Route>
      <Route path="/tasonscan">
        <TASonscanLanding />
      </Route>
      {/* Admin routes */}
      <Route path="/admintower">
        <AdminLogin />
      </Route>
      <Route path="/admintower/login">
        <AdminLogin />
      </Route>
      <Route path="/admintower/dashboard">
        <Admin />
      </Route>
      {/* SEO Location Pages */}
      <Route path="/locations">
        <LocationsDirectory />
      </Route>
      <Route path="/location/country/:slug">
        <LocationPage type="country" />
      </Route>
      <Route path="/location/city/:slug">
        <LocationPage type="city" />
      </Route>
      <Route path="/location/area/:slug">
        <LocationPage type="area" />
      </Route>
      {/* Legacy routes without /location/ prefix for backward compatibility */}
      <Route path="/country/:slug">
        <LocationPage type="country" />
      </Route>
      <Route path="/city/:slug">
        <LocationPage type="city" />
      </Route>
      <Route path="/area/:slug">
        <LocationPage type="area" />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  const [isTASonscan, setIsTASonscan] = useState(false);

  // Detect browser and apply standardization at application startup
  useEffect(() => {
    const browserInfo = detectBrowser();
    console.log(`[App] Initializing in ${browserInfo.type} browser on ${browserInfo.environment}`);
    console.log(`[App] Browser info:`, browserInfo);
    
    // Apply standard fixes for consistent experience
    applyBrowserFixes(browserInfo);
    
    // Log if we needed special standardization
    if (needsStandardization()) {
      console.log('[App] Applied browser standardization for consistent experience');
    }

    // Check if we're on TASonscan.com domain (ONLY on production, not preview)
    const hostname = window.location.hostname;
    const isProductionTASonscan = hostname === 'tasonscan.com' || hostname === 'www.tasonscan.com';
    
    // Don't apply TASonscan redirect logic in Replit preview or development
    if (isProductionTASonscan) {
      setIsTASonscan(true);
      
      const path = window.location.pathname;
      
      // Don't redirect if we're already on explorer or address page
      if (path.includes('/explorer') || path.includes('/address/')) {
        console.log('[TASonscan] Already on a valid explorer path');
      }
      // Auto-redirect to explorer if on the home page
      else if (path === '/' || path === '') {
        console.log('[TASonscan] Redirecting to explorer page');
        window.location.href = '/explorer';
      }
      // Handle address paths correctly
      else if (path.match(/^\/0x[a-fA-F0-9]{40}$/)) {
        // This is a raw address without the /address/ prefix
        const address = path.substring(1); // Remove leading slash
        console.log(`[TASonscan] Redirecting raw address to /address/${address}`);
        window.location.href = `/address/${address}`;
      }
    }
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <WalletProvider>
          <TASChainProvider>
            <TokenUpdateProvider initialTokenIds={[1]}>
              <PriceOracleProvider>
                <BrowserCompatibleRouter>
                  <div className="flex flex-col min-h-screen">
                    {/* Only show main app header/footer when not on TASonscan domain */}
                    {!isTASonscan && <Header />}
                    <main className={`flex-grow ${isTASonscan ? '' : 'pb-16 md:pb-0'}`}>
                      <Router />
                    </main>
                    {!isTASonscan && <Footer />}
                    {!isTASonscan && <MobileNavBar />}
                  </div>
                </BrowserCompatibleRouter>
                <Toaster />
              </PriceOracleProvider>
            </TokenUpdateProvider>
          </TASChainProvider>
        </WalletProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
