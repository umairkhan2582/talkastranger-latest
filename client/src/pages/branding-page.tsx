import React, { useRef } from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DemoVideo from "@/components/DemoVideo";
import BrandingImage from "@/components/BrandingImages";
import { 
  Play, 
  ChevronRight, 
  Zap, 
  BarChart3, 
  MessageSquare, 
  Users, 
  Globe, 
  Shield, 
  Sparkles, 
  CircleDollarSign,
  SearchCheck,
  Repeat,
  PlusCircle,
  LineChart,
  ArrowUpRight
} from "lucide-react";

const BrandingPage = () => {
  const { translate } = useLanguage();
  const videoSectionRef = useRef<HTMLDivElement>(null);

  const brandingCategories = [
    {
      title: "TASNative Token",
      tagline: "Your gateway to the TAS ecosystem - where transparency meets opportunity",
      description: "TASNative Token offers real-time price tracking, detailed holder information, and transparent distribution data. Created by Mr.TAS with 3% holdings and supported by the TAS DAO Treasury, it's the foundation of our secure trading ecosystem with a fixed initial price of $0.001.",
      color: "bg-gradient-to-r from-blue-600 to-cyan-500",
      textColor: "text-white",
      icon: <BarChart3 className="h-8 w-8 mb-2" />,
      imagePath: "/client/src/assets/high-quality/tas-token-detail.png",
      features: [
        "Real-time price tracking with detailed charts",
        "Transparent holder information including Mr.TAS (3%)",
        "DAO Treasury support for platform stability",
        "Fixed initial price of $0.001 for stable growth"
      ]
    },
    {
      title: "Talk n Trade Feature",
      tagline: "Connect, Chat, and Exchange - All in One Secure Space",
      description: "Talk n Trade brings a revolutionary approach to cryptocurrency exchanges by combining social interaction with trading. Match with users who have complementary token preferences, chat directly in our Telegram-style interface, and execute trades without ever leaving the conversation.",
      color: "bg-gradient-to-r from-green-600 to-teal-500", 
      textColor: "text-white",
      icon: <MessageSquare className="h-8 w-8 mb-2" />,
      imagePath: "/client/src/assets/high-quality/chat-interface.png",
      features: [
        "Instant messaging with potential trading partners",
        "Integrated trading functionality within chat",
        "Telegram-style interface familiar to crypto users",
        "Secure end-to-end trading experience"
      ]
    },
    {
      title: "Match Swap",
      tagline: "Find Your Perfect Trading Partner in Seconds",
      description: "Match Swap intelligently pairs you with users who want what you have and have what you want. Our algorithm ensures compatible trading preferences, eliminating the need to scroll through order books or wait for market fills. Just match, chat, and swap!",
      color: "bg-gradient-to-r from-purple-600 to-indigo-500",
      textColor: "text-white",
      icon: <Repeat className="h-8 w-8 mb-2" />,
      imagePath: "/client/src/assets/high-quality/wallet-dashboard.png",
      features: [
        "Intelligent matching based on complementary tokens",
        "Streamlined trading without order books",
        "Direct peer-to-peer exchange with no middlemen",
        "Quick and efficient swap completion"
      ]
    },
    {
      title: "Token Creation on TASChain",
      tagline: "Launch Your Vision in Minutes, Not Months",
      description: "Create your own token on TASChain with just a few clicks and 5 TAS. Set your token supply (default: 1 billion), upload a custom image, add social media links, and instantly participate in a market with real holders and active trading. Your token, your rules, minimal barriers.",
      color: "bg-gradient-to-r from-yellow-500 to-orange-500",
      textColor: "text-white",
      icon: <PlusCircle className="h-8 w-8 mb-2" />,
      imagePath: "/client/src/assets/high-quality/token-created.png",
      features: [
        "Simple token creation process (just 5 TAS fee)",
        "Customizable token supply (default: 1 billion)",
        "Upload custom images and branding",
        "Add up to 5 social media links for your token"
      ]
    },
    {
      title: "TASonscan Explorer",
      tagline: "Complete Transparency from Block to Transaction",
      description: "TASonscan provides a comprehensive view of the entire ecosystem - from block details to transaction histories. Track token movements, analyze holder distributions, and validate transactions with complete confidence in our purpose-built explorer.",
      color: "bg-gradient-to-r from-pink-600 to-rose-500",
      textColor: "text-white",
      icon: <SearchCheck className="h-8 w-8 mb-2" />,
      imagePath: "/client/src/assets/high-quality/token-explorer.png",
      features: [
        "Track all token movements across the ecosystem",
        "View detailed holder distribution analytics",
        "Validate transactions with complete confidence",
        "Explore block details and historical data"
      ]
    }
  ];

  // For the video section
  const videoScriptSections = [
    {
      title: "Opening",
      time: "0:00-0:15",
      script: "Welcome to TalkAStranger.com - where cryptocurrency trading becomes social. The revolutionary platform that combines the power of blockchain with meaningful connections.",
      visualDescription: "TAS platform homepage with animated logo"
    },
    {
      title: "TASnative Token",
      time: "0:15-0:30",
      script: "At the heart of our ecosystem is the TASnative Token. With transparent distribution, real-time price tracking, and a community-driven approach, it's your gateway to unlimited possibilities.",
      visualDescription: "TASnative token page with price chart and holder information"
    },
    {
      title: "Talk n Trade",
      time: "0:30-0:45",
      script: "Our unique Talk n Trade feature revolutionizes cryptocurrency exchanges. Connect with users worldwide, engage in conversations, and execute trades all from one seamless interface.",
      visualDescription: "Matching with another user and opening a chat window"
    },
    {
      title: "Match Swap",
      time: "0:45-1:00",
      script: "Finding the perfect trading partner has never been easier. Match Swap intelligently pairs you with users who want what you have and have what you want - no more scrolling through endless order books.",
      visualDescription: "Matching algorithm pairing users based on token preferences"
    },
    {
      title: "Token Creation",
      time: "1:00-1:15",
      script: "Launch your vision in minutes, not months. With just 5 TAS, you can create your own token, set your supply, upload your branding, and instantly participate in a thriving marketplace.",
      visualDescription: "Token creation process demonstration"
    },
    {
      title: "TASonscan Explorer",
      time: "1:15-1:30",
      script: "Experience complete transparency with our purpose-built TASonscan Explorer. Track token movements, analyze distributions, and validate transactions with confidence.",
      visualDescription: "Navigating through the blockchain explorer"
    },
    {
      title: "Closing",
      time: "1:30-1:45",
      script: "Join thousands of users already discovering the future of social trading at TalkAStranger.com. Connect. Trade. Thrive.",
      visualDescription: "Return to homepage with call-to-action buttons highlighted"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>TAS Branding | talkastranger.com</title>
        <meta
          name="description"
          content="Discover the unique branding and features of the talkastranger.com platform."
        />
      </Helmet>

      {/* Hero section */}
      <section className="bg-gradient-to-r from-slate-800 to-slate-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              TAS Platform Branding
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              A revolutionary approach to blockchain communication and trading
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <Badge variant="secondary" className="text-sm px-3 py-1">TASChain</Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">Cryptocurrency</Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">Trading</Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">Connection</Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">Token Creation</Badge>
            </div>
            <Button 
              onClick={() => {
                videoSectionRef.current?.scrollIntoView({ 
                  behavior: "smooth", 
                  block: "start" 
                });
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-700 hover:from-green-600 hover:to-emerald-800 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all"
            >
              <Play className="h-5 w-5 mr-2" /> Watch Demo Video
            </Button>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Core Features & Ecosystem</h2>
            
            <div className="space-y-12">
              {brandingCategories.map((category, index) => (
                <Card key={index} className="overflow-hidden border-0 shadow-lg">
                  <div className={`${category.color} p-6`}>
                    <div className="flex items-center">
                      <div className={`${category.textColor} mr-3`}>
                        {category.icon}
                      </div>
                      <div>
                        <h3 className={`text-2xl font-bold ${category.textColor}`}>{category.title}</h3>
                        <p className={`text-lg font-medium mt-1 ${category.textColor}`}>"{category.tagline}"</p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-slate-700 mb-4">{category.description}</p>
                        <ul className="space-y-2">
                          {category.features.map((feature, i) => (
                            <li key={i} className="flex items-start">
                              <ChevronRight className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                              <span className="text-slate-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-slate-100 rounded-lg p-2 flex items-center justify-center">
                        <div className="text-center w-full">
                          <div className="rounded-lg w-full h-auto flex items-center justify-center mb-2 overflow-hidden">
                            {category.title === "TASNative Token" && (
                              <BrandingImage 
                                imageKey="tokenDetail" 
                                alt={`Screenshot of ${category.title}`} 
                                className="w-full h-auto object-cover shadow-md"
                              />
                            )}
                            {category.title === "Talk n Trade Feature" && (
                              <BrandingImage 
                                imageKey="chatInterface" 
                                alt={`Screenshot of ${category.title}`} 
                                className="w-full h-auto object-cover shadow-md"
                              />
                            )}
                            {category.title === "Match Swap" && (
                              <BrandingImage 
                                imageKey="walletDashboard" 
                                alt={`Screenshot of ${category.title}`} 
                                className="w-full h-auto object-cover shadow-md"
                              />
                            )}
                            {category.title === "Token Creation on TASChain" && (
                              <BrandingImage 
                                imageKey="tokenCreated" 
                                alt={`Screenshot of ${category.title}`} 
                                className="w-full h-auto object-cover shadow-md"
                              />
                            )}
                            {category.title === "TASonscan Explorer" && (
                              <BrandingImage 
                                imageKey="tokenExplorer" 
                                alt={`Screenshot of ${category.title}`} 
                                className="w-full h-auto object-cover shadow-md"
                              />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 italic">Visual representation of {category.title}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50 border-t px-6 py-3">
                    <Button variant="outline" className="ml-auto">
                      Learn More <ArrowUpRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <Separator className="my-16" />

            {/* Demo Video Section */}
            <div ref={videoSectionRef} className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl shadow-lg p-8 mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
                <Play className="h-6 w-6 text-green-500 mr-2" />
                Platform Demo Video
              </h2>
              <p className="text-slate-300 mb-8">
                Watch our platform demo to see the TAS ecosystem in action. Experience the innovative features that make TalkAStranger.com the future of social trading.
              </p>
              
              <div className="mb-8">
                <DemoVideo 
                  title="TalkAStranger Platform Overview" 
                  description="A comprehensive walkthrough of the platform's core features including TASnative token, Talk n Trade, Match Swap, and Token Creation."
                />
              </div>
              
              <div className="p-4 bg-slate-700 rounded-lg mb-8 border border-slate-600">
                <div className="flex items-center text-white mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-green-400 mr-2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                  </svg>
                  <span className="font-medium">Voice-Over Production Notes</span>
                </div>
                <p className="text-slate-300 text-sm mb-2">
                  Our professional voice-over is recorded with a confident, engaging male voice that conveys expertise and innovation. 
                  The tone matches our platform's character - friendly yet authoritative, professional but approachable.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                  <div className="bg-slate-800 p-2 rounded border border-slate-600">
                    <span className="font-semibold block mb-1 text-green-400">Voice Type:</span>
                    Male, 30-45 age range, native English speaker
                  </div>
                  <div className="bg-slate-800 p-2 rounded border border-slate-600">
                    <span className="font-semibold block mb-1 text-green-400">Delivery Style:</span>
                    Confident, engaging, conversational
                  </div>
                  <div className="bg-slate-800 p-2 rounded border border-slate-600">
                    <span className="font-semibold block mb-1 text-green-400">Production Quality:</span>
                    Studio-grade, no background noise, professionally mixed
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-4 text-white">Video Script Breakdown</h3>
              <div className="space-y-6">
                {videoScriptSections.map((section, index) => (
                  <div key={index} className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                    <div className="bg-slate-700 px-4 py-3 border-b border-slate-600 flex justify-between items-center">
                      <h3 className="font-semibold text-white">{section.title}</h3>
                      <span className="text-xs bg-slate-600 px-2 py-1 rounded text-slate-200">{section.time}</span>
                    </div>
                    <div className="p-4">
                      <p className="text-slate-300 italic mb-3">"{section.script}"</p>
                      <div className="bg-slate-700 p-3 rounded-lg border border-slate-600">
                        <p className="text-sm text-slate-300 flex items-start">
                          <Zap className="h-4 w-4 text-amber-400 mr-2 flex-shrink-0 mt-0.5" />
                          <span>Visual: {section.visualDescription}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Voice Over Production Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-lg p-8 mb-12 border border-indigo-100">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-indigo-800">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-indigo-600 mr-2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                Professional Voice Over Production
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="col-span-2">
                  <p className="text-slate-700 mb-4">
                    Our promotional video features professional voice-over narration to create an engaging and immersive experience. The voice talent was carefully selected to match the innovative yet trustworthy character of the TAS platform.
                  </p>
                  
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-indigo-100 mb-6">
                    <h3 className="font-semibold text-indigo-800 mb-3">Voice Talent Specifications</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                          </svg>
                        </div>
                        <span className="text-slate-700"><strong>Voice Type:</strong> Professional male voice artist with clear, authoritative yet approachable tone</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                          </svg>
                        </div>
                        <span className="text-slate-700"><strong>Delivery Style:</strong> Confident, engaging, with good pacing to match visual transitions</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                          </svg>
                        </div>
                        <span className="text-slate-700"><strong>Recording Quality:</strong> Studio-quality audio (48kHz/24-bit) with professional post-processing</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                          </svg>
                        </div>
                        <span className="text-slate-700"><strong>Background Music:</strong> Custom-selected track with modern, tech-forward feel that builds throughout the video</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-indigo-100">
                    <h3 className="font-semibold text-indigo-800 mb-3">Production Notes</h3>
                    <p className="text-slate-700 mb-4">
                      The voice-over was recorded in sections that perfectly align with the on-screen demonstrations of each feature. Special emphasis was placed on key terms like "TASnative Token," "Talk n Trade," and "Match Swap" to reinforce brand recognition.
                    </p>
                    <p className="text-slate-700">
                      Sound effects subtly enhance the user experience, with gentle notification sounds for chat messages and success tones for completed trades, creating an immersive audio landscape that complements the visual elements.
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-5 rounded-lg shadow-sm border border-indigo-100 flex flex-col">
                  <h3 className="font-semibold text-indigo-800 mb-4">Voice Demo</h3>
                  
                  <div className="bg-indigo-50 rounded-lg p-5 flex-grow flex flex-col items-center justify-center">
                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-indigo-600">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                      </svg>
                    </div>
                    <p className="text-slate-700 text-center mb-6">
                      Professional voice samples available for preview
                    </p>
                    
                    <div className="w-full bg-white rounded-lg shadow-sm border border-indigo-100 p-3 flex items-center">
                      <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      </div>
                      <div className="flex-grow">
                        <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                          <div className="h-full w-2/3 bg-indigo-500 rounded-full"></div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-slate-500">01:12</span>
                          <span className="text-xs text-slate-500">01:48</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Download Voice Demo
                    </Button>
                    <Button variant="outline" className="w-full border-indigo-600 text-indigo-600 hover:bg-indigo-50">
                      Request Custom Recording
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Ecosystem Overview */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
              <h2 className="text-2xl font-bold mb-6">TAS Ecosystem Overview</h2>
              <p className="text-slate-700 mb-8">
                The TalkAStranger platform creates a unique ecosystem where blockchain technology and social interaction converge. 
                Our suite of integrated features creates a seamless experience from token creation to trading and community building.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                  <CircleDollarSign className="h-10 w-10 text-blue-500 mb-4" />
                  <h3 className="font-bold text-lg text-blue-800 mb-2">Token Economy</h3>
                  <p className="text-slate-700">
                    Powered by TASnative with a fixed initial price of $0.001 and transparent distribution model: 65% locked, 20% sale, 10% airdrop, 5% development.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-xl border border-green-100 shadow-sm">
                  <Users className="h-10 w-10 text-green-500 mb-4" />
                  <h3 className="font-bold text-lg text-green-800 mb-2">Social Trading</h3>
                  <p className="text-slate-700">
                    Direct peer-to-peer trading through meaningful connections, with matched preferences and real-time communication.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100 shadow-sm">
                  <Globe className="h-10 w-10 text-purple-500 mb-4" />
                  <h3 className="font-bold text-lg text-purple-800 mb-2">Global Network</h3>
                  <p className="text-slate-700">
                    Connect with traders worldwide, supported by multi-language functionality and 24/7 blockchain operations.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-100 shadow-sm">
                  <Sparkles className="h-10 w-10 text-amber-500 mb-4" />
                  <h3 className="font-bold text-lg text-amber-800 mb-2">Token Creation</h3>
                  <p className="text-slate-700">
                    Launch your own token with minimal barriers - just 5 TAS fee, customizable supply, and instant market access.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-xl border border-rose-100 shadow-sm">
                  <Shield className="h-10 w-10 text-rose-500 mb-4" />
                  <h3 className="font-bold text-lg text-rose-800 mb-2">Security & Transparency</h3>
                  <p className="text-slate-700">
                    Complete on-chain verification through TASonscan explorer with full visibility of all transactions and token movements.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-100 shadow-sm">
                  <LineChart className="h-10 w-10 text-cyan-500 mb-4" />
                  <h3 className="font-bold text-lg text-cyan-800 mb-2">Analytics & Insights</h3>
                  <p className="text-slate-700">
                    Real-time market data, price tracking, community growth metrics, and trading volume analysis.
                  </p>
                </div>
              </div>
              
              <div className="rounded-xl overflow-hidden border shadow-sm">
                <div className="bg-slate-800 px-6 py-4">
                  <h3 className="text-white font-bold">How TAS Works: User Journey</h3>
                </div>
                <div className="p-6 bg-white">
                  <ol className="relative border-l border-slate-200">
                    <li className="mb-8 ml-6">
                      <span className="absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 bg-blue-100 border border-blue-600 text-blue-800 font-bold">1</span>
                      <h4 className="font-bold text-lg mb-1">Connect Wallet & Access Platform</h4>
                      <p className="text-slate-700 mb-2">User connects their wallet to access the TAS platform with full functionality.</p>
                      <div className="text-xs bg-blue-50 text-blue-800 px-3 py-1 rounded-full inline-block">Entry Point</div>
                    </li>
                    <li className="mb-8 ml-6">
                      <span className="absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 bg-green-100 border border-green-600 text-green-800 font-bold">2</span>
                      <h4 className="font-bold text-lg mb-1">Explore or Create Tokens</h4>
                      <p className="text-slate-700 mb-2">Browse existing tokens on the platform or create a new token with just 5 TAS.</p>
                      <div className="text-xs bg-green-50 text-green-800 px-3 py-1 rounded-full inline-block">Engagement</div>
                    </li>
                    <li className="mb-8 ml-6">
                      <span className="absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 bg-purple-100 border border-purple-600 text-purple-800 font-bold">3</span>
                      <h4 className="font-bold text-lg mb-1">Get Matched with Trading Partners</h4>
                      <p className="text-slate-700 mb-2">The Match Swap algorithm connects users with compatible trading preferences.</p>
                      <div className="text-xs bg-purple-50 text-purple-800 px-3 py-1 rounded-full inline-block">Connection</div>
                    </li>
                    <li className="mb-8 ml-6">
                      <span className="absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 bg-amber-100 border border-amber-600 text-amber-800 font-bold">4</span>
                      <h4 className="font-bold text-lg mb-1">Talk n Trade in Chat Interface</h4>
                      <p className="text-slate-700 mb-2">Connect through the Telegram-style chat and execute trades directly in the conversation.</p>
                      <div className="text-xs bg-amber-50 text-amber-800 px-3 py-1 rounded-full inline-block">Interaction</div>
                    </li>
                    <li className="ml-6">
                      <span className="absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 bg-rose-100 border border-rose-600 text-rose-800 font-bold">5</span>
                      <h4 className="font-bold text-lg mb-1">Track & Verify on TASonscan</h4>
                      <p className="text-slate-700 mb-2">View transaction history and token movements through the transparent explorer.</p>
                      <div className="text-xs bg-rose-50 text-rose-800 px-3 py-1 rounded-full inline-block">Verification</div>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BrandingPage;