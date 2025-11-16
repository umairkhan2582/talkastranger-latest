import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useWallet } from "@/contexts/WalletContext";
import { useLanguage } from "@/contexts/LanguageContext";
import WalletConnectionModal from "./WalletConnectionModal";
import LanguageSwitcher from "./LanguageSwitcher";
import Logo from "./Logo";
import TASMascot from "./TASMascot";
import { countries, cities, areas } from "@shared/locations";

import newYorkImg from "@assets/stock_images/famous_landmarks_new_851762c5.jpg";
import londonImg from "@assets/stock_images/london_big_ben_uk_ci_9f1a078f.jpg";
import tokyoImg from "@assets/stock_images/tokyo_japan_skyline__ec5a6ad2.jpg";
import parisImg from "@assets/stock_images/paris_eiffel_tower_f_2cac551e.jpg";
import losAngelesImg from "@assets/stock_images/los_angeles_californ_1d223ed2.jpg";
import sydneyImg from "@assets/stock_images/sydney_opera_house_a_e8a6b46f.jpg";
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  MessageSquare, 
  CreditCard, 
  ShoppingCart, 
  PlusCircle,
  ExternalLink,
  Wallet,
  Info,
  FileText,
  Mail,
  ChevronDown,
  Video,
  ChevronRight,
  Sparkles,
  Globe,
  MapPin,
  Lock,
  TrendingUp,
  Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  const [location] = useLocation();
  const { isConnected, address, openConnectModal, disconnect, createTASWallet } = useWallet();
  const { translate } = useLanguage();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: translate("talk_a_stranger", "Talk A Stranger"), path: "/", icon: <Home className="h-4 w-4 mr-2" /> },
    { label: translate("messages", "Messages"), path: "/messages", icon: <MessageSquare className="h-4 w-4 mr-2" /> },
    { label: translate("wallet", "Wallet"), path: "/wallet", icon: <Wallet className="h-4 w-4 mr-2" /> },
    { label: translate("marketplace", "Marketplace"), path: "/marketplace", icon: <ShoppingCart className="h-4 w-4 mr-2" /> },
    { label: translate("createToken", "Create Token"), path: "/create-token", icon: <PlusCircle className="h-4 w-4 mr-2" /> }
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <div className="relative pr-8">
                <Logo size="md" />
                <div className="absolute -top-5 -right-6 float-animation pulse-glow">
                  <TASMascot size="sm" greeting={location === "/"} />
                </div>
              </div>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-2">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`px-2 py-2 text-xs font-medium flex items-center ${location === item.path ? 'text-primary font-semibold' : 'text-dark-500 hover:text-primary hover:bg-gray-50 rounded-md transition-colors'}`}
                >
                  {item.icon}
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              ))}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="px-2 py-2 text-xs font-medium flex items-center text-dark-500 hover:text-primary hover:bg-gray-50 rounded-md transition-colors cursor-pointer">
                    <Info className="h-4 w-4 mr-1" />
                    <span className="hidden lg:inline">More</span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Quick Links</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link to="/explorer">
                    <DropdownMenuItem className="flex items-center">
                      <ExternalLink className="h-4 w-4 mr-2 text-purple-600" />
                      {translate("explorer", "Explorer")}
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/whitepaper">
                    <DropdownMenuItem className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-600" />
                      White Paper
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/about-us">
                    <DropdownMenuItem className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-pink-600" />
                      About Us
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/contact">
                    <DropdownMenuItem className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-orange-600" />
                      Contact
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Legal</DropdownMenuLabel>
                  <Link to="/privacy-policy">
                    <DropdownMenuItem className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg> Privacy Policy
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/terms-of-service">
                    <DropdownMenuItem className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg> Terms of Service
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* BNB/TAS Swap Button */}
            <div className="hidden md:flex items-center space-x-2 mr-2">
              <button 
                onClick={() => window.open('https://pancakeswap.finance/swap?outputCurrency=0xd9541b134b1821736bd323135b8844d3ae408216', '_blank')}
                className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-md px-3 py-2 text-white shadow-sm flex items-center hover:shadow-md transition-all font-medium"
              >
                <img src="/logo-icon.png" className="h-5 w-5 mr-2 rounded-full" alt="TAS" />
                BUY TAS
              </button>
              <Link to="/bnb-swap" className="bg-gradient-to-r from-yellow-50 to-blue-50 rounded-full px-1 py-0.5 border border-gray-200 shadow-sm flex items-center hover:shadow-md transition-all">
                <div className="text-xs px-2 py-1 font-medium text-yellow-700 flex items-center">
                  <img src="https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png" className="h-4 w-4 mr-1" alt="BNB" />
                  BNB
                </div>
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <div className="text-xs px-2 py-1 font-medium text-blue-700 flex items-center">
                  <img src="https://assets.coingecko.com/coins/images/28250/thumb/TAS.png" className="h-4 w-4 mr-1" alt="TAS" />
                  TAS
                </div>
              </Link>
            </div>
            
            <div className="hidden sm:block">
              <LanguageSwitcher variant="dropdown" />
            </div>
            
            <div className="relative">
              {isConnected ? (
                <Button 
                  variant="outline" 
                  className="flex items-center text-xs sm:text-sm h-9"
                  onClick={() => window.location.href = '/wallet'}
                >
                  <Wallet className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate max-w-[80px] sm:max-w-none">
                    {address?.slice(0, 4)}...{address?.slice(-3)}
                  </span>
                </Button>
              ) : (
                <Button
                  onClick={openConnectModal}
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white flex items-center shadow-md hover:shadow-lg transition-all h-9 text-xs sm:text-sm font-semibold"
                >
                  <Video className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="sm:block">Start Talking</span>
                </Button>
              )}
            </div>
            
            {/* Mobile Menu Drawer */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button 
                  type="button" 
                  className="inline-flex items-center justify-center p-2 rounded-lg md:hidden hover:bg-gray-100 transition-colors"
                >
                  <Menu className="h-6 w-6 text-gray-700" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-[350px] p-0 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
                <SheetHeader className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-6 text-white">
                  <SheetTitle className="text-white text-xl font-bold flex items-center">
                    <Sparkles className="h-6 w-6 mr-2" />
                    Menu
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col h-[calc(100vh-80px)] overflow-y-auto">
                  {/* User Profile Section */}
                  {isConnected && (
                    <div className="bg-white m-4 rounded-xl p-4 shadow-md border-2 border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-3">
                          <Wallet className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 font-medium">Connected Wallet</p>
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Main Navigation */}
                  <div className="px-2 py-4 space-y-1">
                    {navItems.map((item) => (
                      <Link 
                        key={item.path} 
                        href={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                          location === item.path 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                            : 'hover:bg-white text-gray-700 hover:shadow-sm'
                        }`}>
                          <div className="flex items-center">
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 opacity-50" />
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  {/* Additional Links */}
                  <div className="px-2 pb-4 space-y-1">
                    <div className="text-xs font-bold text-gray-500 px-4 py-2 uppercase tracking-wider">
                      Discover
                    </div>
                    
                    <Link href="/explorer" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white text-gray-700 hover:shadow-sm transition-all">
                        <div className="flex items-center">
                          <ExternalLink className="h-4 w-4 mr-3 text-purple-600" />
                          <span className="font-medium">{translate("explorer", "Explorer")}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </div>
                    </Link>
                    
                    <Link href="/whitepaper" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white text-gray-700 hover:shadow-sm transition-all">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-3 text-blue-600" />
                          <span className="font-medium">White Paper</span>
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </div>
                    </Link>
                    
                    <Link href="/about-us" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white text-gray-700 hover:shadow-sm transition-all">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-3 text-pink-600" />
                          <span className="font-medium">About Us</span>
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </div>
                    </Link>
                    
                    <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white text-gray-700 hover:shadow-sm transition-all">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-3 text-orange-600" />
                          <span className="font-medium">Contact</span>
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </div>
                    </Link>
                  </div>
                  
                  {/* Popular Cities Section */}
                  <div className="px-2 pb-4 space-y-1">
                    <div className="text-xs font-bold text-gray-500 px-4 py-2 uppercase tracking-wider flex items-center">
                      <MapPin className="h-3 w-3 mr-2" />
                      Popular Cities
                    </div>
                    
                    <div className="bg-white mx-2 rounded-xl p-3 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        {cities.slice(0, 6).map((city) => {
                          const cityImageMap: Record<string, any> = {
                            'new-york': newYorkImg,
                            'london': londonImg,
                            'tokyo': tokyoImg,
                            'paris': parisImg,
                            'los-angeles': losAngelesImg,
                            'sydney': sydneyImg
                          };
                          const cityImage = cityImageMap[city.slug];
                          return (
                            <Link key={city.slug} href={`/location/city/${city.slug}`} onClick={() => setMobileMenuOpen(false)}>
                              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-pink-50 hover:to-orange-50 transition-all group">
                                {cityImage ? (
                                  <img 
                                    src={cityImage}
                                    alt={city.name}
                                    className="w-8 h-8 rounded-lg object-cover shadow-sm"
                                  />
                                ) : (
                                  <span className="text-xl">🏙️</span>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-pink-600">{city.name}</p>
                                  <p className="text-[10px] text-gray-500">{Math.floor(Math.random() * 300 + 50)} online</p>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Most Users Online Section */}
                  <div className="px-2 pb-4 space-y-1">
                    <div className="text-xs font-bold text-gray-500 px-4 py-2 uppercase tracking-wider flex items-center">
                      <TrendingUp className="h-3 w-3 mr-2" />
                      Most Users Online
                    </div>
                    
                    <div className="bg-white mx-2 rounded-xl p-3 shadow-sm">
                      <div className="space-y-2">
                        {countries.slice(0, 5).map((country, index) => (
                          <Link key={country.slug} href={`/location/country/${country.slug}`} onClick={() => setMobileMenuOpen(false)}>
                            <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all group">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">
                                  {['🇺🇸', '🇬🇧', '🇮🇳', '🇨🇦', '🇦🇺'][index]}
                                </span>
                                <div>
                                  <p className="text-xs font-semibold text-gray-800 group-hover:text-purple-600">{country.name}</p>
                                  <div className="flex items-center space-x-1">
                                    <div className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                                    <p className="text-[10px] text-purple-600 font-medium">{Math.floor(Math.random() * 500 + 200)} online</p>
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 opacity-30 group-hover:opacity-100 group-hover:text-purple-600" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Select Your Area Section */}
                  <div className="px-2 pb-4 space-y-1">
                    <div className="text-xs font-bold text-gray-500 px-4 py-2 uppercase tracking-wider flex items-center">
                      <Map className="h-3 w-3 mr-2" />
                      Select Your Area
                    </div>
                    
                    <div className="bg-white mx-2 rounded-xl p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-3 px-1">Talk with strangers in your local area</p>
                      <div className="grid grid-cols-2 gap-2">
                        {areas.slice(0, 4).map((area) => (
                          <Link key={area.slug} href={`/location/area/${area.slug}`} onClick={() => setMobileMenuOpen(false)}>
                            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 transition-all group border border-gray-100">
                              <span className="text-lg">📍</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-orange-600">{area.name}</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                        <div className="mt-3 text-center">
                          <button className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center justify-center w-full py-2 hover:bg-purple-50 rounded-lg transition-all">
                            View All Areas
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </button>
                        </div>
                      </Link>
                    </div>
                  </div>
                  
                  {/* Add Your Places - Premium/Locked Feature */}
                  <div className="px-2 pb-4 space-y-1">
                    <div className="text-xs font-bold text-gray-500 px-4 py-2 uppercase tracking-wider flex items-center">
                      <PlusCircle className="h-3 w-3 mr-2" />
                      Add Your Places
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 mx-2 rounded-xl p-4 shadow-sm border-2 border-amber-200 relative overflow-hidden">
                      <div className="absolute top-2 right-2">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center shadow-md">
                          <Lock className="h-3 w-3 mr-1" />
                          PREMIUM
                        </div>
                      </div>
                      <div className="mt-2">
                        <Globe className="h-8 w-8 text-amber-600 mb-3" />
                        <h4 className="text-sm font-bold text-gray-800 mb-2">Create Your Own Location</h4>
                        <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                          Add custom places and connect with people from your neighborhood, school, or workplace!
                        </p>
                        <button 
                          onClick={() => {
                            toast({
                              title: "Premium Feature",
                              description: "Add Your Places will be available soon! Stay tuned for this exciting feature.",
                              variant: "default"
                            });
                          }}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs py-2.5 rounded-lg shadow-md flex items-center justify-center transition-all"
                        >
                          <Lock className="h-3 w-3 mr-2" />
                          Coming Soon
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="px-4 pb-6 mt-auto space-y-3">
                    {!isConnected && (
                      <Button
                        onClick={() => {
                          openConnectModal();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-bold py-3 rounded-xl shadow-lg"
                      >
                        <Video className="h-5 w-5 mr-2" />
                        Start Talking
                      </Button>
                    )}
                    
                    <button 
                      onClick={() => {
                        window.open('https://pancakeswap.finance/swap?outputCurrency=0xd9541b134b1821736bd323135b8844d3ae408216', '_blank');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      BUY TAS Token
                    </button>
                    
                    {isConnected && (
                      <Button
                        onClick={() => {
                          disconnect();
                          setMobileMenuOpen(false);
                        }}
                        variant="outline"
                        className="w-full border-2 border-red-200 text-red-600 hover:bg-red-50 font-semibold py-3 rounded-xl"
                      >
                        <X className="h-5 w-5 mr-2" />
                        Disconnect Wallet
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      <WalletConnectionModal />
    </header>
  );
};

export default Header;
