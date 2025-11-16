import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DownloadIcon, ExternalLink, FileText, Globe, Users, BarChart4, Calendar, CreditCard } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const WhitePaperPage = () => {
  const { translate } = useLanguage();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen pb-20">
      {/* Hero section */}
      <section className="bg-gradient-to-b from-primary/10 to-white py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/50">
              <FileText className="w-3 h-3 mr-1" />
              Official Documentation
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">TAS Chain White Paper</h1>
            <p className="text-lg text-slate-600 mb-8">
              An in-depth breakdown of the concept, technology, use cases, and financial feasibility of the TAS blockchain
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button className="bg-primary hover:bg-primary/90 shadow-md">
                <DownloadIcon className="mr-2 h-4 w-4" /> Download PDF
              </Button>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                <ExternalLink className="mr-2 h-4 w-4" /> View on GitHub
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Tabs defaultValue="whitepaper" className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList className="bg-white border border-slate-200 p-1 rounded-full shadow-sm h-auto">
                  <TabsTrigger
                    value="whitepaper"
                    className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none"
                  >
                    <FileText className="h-4 w-4 mr-1 inline-block" /> White Paper
                  </TabsTrigger>
                  <TabsTrigger
                    value="tokenomics"
                    className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none"
                  >
                    <BarChart4 className="h-4 w-4 mr-1 inline-block" /> Tokenomics
                  </TabsTrigger>
                  <TabsTrigger
                    value="roadmap"
                    className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none"
                  >
                    <Calendar className="h-4 w-4 mr-1 inline-block" /> Roadmap
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="whitepaper" className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
                <div className="prose prose-slate max-w-none">
                  <h2 className="text-2xl font-bold">A. Executive Summary</h2>
                  <p>
                    TASChain introduces a revolutionary decentralized platform that combines peer-to-peer (P2P) token trading with 
                    real-time communication features. It reimagines how creators and communities interact in the crypto space, 
                    transforming token trading from a solitary transaction into a vibrant, social marketplace experience.
                  </p>
                  <p>
                    Powered by TalkaStranger.com, our platform eliminates traditional intermediaries, allowing direct interaction 
                    between token creators and potential holders through features like instant AMAs, Trade N Talk modules, and 
                    specialized token boosting systems.
                  </p>

                  <h2 className="text-2xl font-bold mt-8">B. Vision and Mission</h2>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 my-4">
                    <p className="font-semibold text-primary">Vision:</p>
                    <p className="italic">
                      "To revolutionize token trading by creating a socially interactive ecosystem where creators and communities 
                      build authentic relationships while exchanging value."
                    </p>
                    <p className="font-semibold text-primary mt-4">Mission:</p>
                    <p className="italic">
                      "To empower token creators and traders with innovative tools that merge communication and commerce, fostering 
                      transparent, direct relationships and successful token projects."
                    </p>
                  </div>

                  <h2 className="text-2xl font-bold mt-8">C. The Problem</h2>
                  <p>
                    Traditional token trading platforms suffer from several critical limitations:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Lack of direct communication between token creators and potential investors</li>
                    <li>No built-in mechanisms for new tokens to gain visibility and traction</li>
                    <li>Solitary trading experience with minimal community interaction</li>
                    <li>Difficulty establishing trust and authenticity for new projects</li>
                    <li>Limited options for real-time engagement during token launches</li>
                  </ul>

                  <h2 className="text-2xl font-bold mt-8">D. Our Solution</h2>
                  
                  <div className="grid gap-4 md:grid-cols-2 mt-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <Globe className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Peer-to-Peer Trading</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              Direct token swaps between users without traditional exchange intermediaries, reducing fees 
                              and creating genuine person-to-person transactions.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Trade N Talk Module</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              Integrated chat rooms for each token, allowing real-time discussions between token 
                              creators and potential buyers during the trading process.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <CreditCard className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Token Creation Hub</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              Simplified no-code token creation platform built on TASChain's secure blockchain, enabling anyone 
                              to launch their own token without technical barriers.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <BarChart4 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Visibility Boosting System</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              Specialized promotion systems that help new tokens gain visibility across the TASChain 
                              marketplace, creating equal opportunities for emerging projects.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <h2 className="text-2xl font-bold mt-8">E. Technical Architecture</h2>
                  <p>
                    TASChain offers a unique blend of technical innovations that power our socially interactive trading platform:
                  </p>
                  
                  <div className="mt-4 space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold">Blockchain Infrastructure</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Initially deployed on Binance Smart Chain (BSC) with plans to transition to our custom TASChain, 
                        providing scalability, low transaction costs, and high throughput performance. Our architecture is 
                        designed to handle thousands of simultaneous interactions between token creators and communities.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold">Smart Contract Framework</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Audited, secure smart contracts power our token creation tools, P2P trading mechanics, and platform 
                        governance. All contracts are designed with gas optimization in mind to reduce transaction costs.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold">Real-Time Communication Layer</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        A decentralized messaging protocol integrated with our blockchain, enabling secure, encrypted 
                        communications that are directly tied to trading activities and token ownership.
                      </p>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold mt-8">F. Use Cases</h2>
                  
                  <div className="mt-4 space-y-4">
                    <div className="p-4 border rounded-lg bg-slate-50">
                      <h3 className="text-lg font-semibold">New Project Launches</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Creators can launch tokens, immediately engage with early adopters through live AMAs, explain their 
                        vision, and build genuine community relationships from day one.
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-slate-50">
                      <h3 className="text-lg font-semibold">Community-Driven Tokenomics</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Projects can evolve their tokenomics based on direct community feedback through the Trade N Talk module, 
                        creating more sustainable and community-aligned token designs.
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-slate-50">
                      <h3 className="text-lg font-semibold">Social Trading Experience</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Traders can discuss token performance, project development, and market trends in real-time, transforming 
                        trading from a solitary to a social activity.
                      </p>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold mt-8">G. Competitive Advantages</h2>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>
                      <span className="font-medium">First-Mover Advantage:</span> No other trading platform combines direct trading, 
                      integrated real-time communications, and visibility boosting in one ecosystem.
                    </li>
                    <li>
                      <span className="font-medium">Creator Empowerment:</span> Token creators gain unprecedented access to their audience, 
                      building trust through direct engagement.
                    </li>
                    <li>
                      <span className="font-medium">Social Trading Revolution:</span> We move beyond impersonal charts and orderbooks to 
                      create meaningful interactions during the trading process.
                    </li>
                    <li>
                      <span className="font-medium">Enhanced Visibility:</span> New tokens gain exposure through our specialized boosting 
                      mechanisms, creating a level playing field.
                    </li>
                    <li>
                      <span className="font-medium">Secure, Transparent Environment:</span> All interactions are blockchain-verifiable, 
                      creating accountability and trust throughout the ecosystem.
                    </li>
                  </ul>

                  <h2 className="text-2xl font-bold mt-8">H. Conclusion</h2>
                  <p>
                    TASChain represents a paradigm shift in how tokens are created, traded, and promoted. By merging 
                    the traditionally separate domains of communication and commerce, we're creating a next-generation 
                    platform where token creators and communities can interact authentically, build trust, and create 
                    value together.
                  </p>
                  <p>
                    Join us as we build a more transparent, interactive, and community-driven token ecosystem. 
                    TASChain isn't just a trading platform—it's a movement toward a more connected and human-centered 
                    cryptocurrency experience.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="tokenomics" className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
                <div className="prose prose-slate max-w-none">
                  <h2 className="text-2xl font-bold">Token Economics</h2>
                  <p>
                    The TAS token is the native utility token powering the TASChain ecosystem. Our tokenomics model is carefully designed 
                    to ensure long-term sustainability, balanced value distribution, and platform growth.
                  </p>
                  
                  <h3 className="text-xl font-semibold mt-6">Token Overview</h3>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 my-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-primary">Token Name:</p>
                        <p>TASChain Token</p>
                      </div>
                      <div>
                        <p className="font-medium text-primary">Symbol:</p>
                        <p>TAS</p>
                      </div>
                      <div>
                        <p className="font-medium text-primary">Total Supply:</p>
                        <p>1,000,000,000 TAS</p>
                      </div>
                      <div>
                        <p className="font-medium text-primary">Circulating Supply at Launch:</p>
                        <p>250,000,000 TAS (25%)</p>
                      </div>
                      <div>
                        <p className="font-medium text-primary">Blockchain:</p>
                        <p>Initially BSC, migrating to TASChain</p>
                      </div>
                      <div>
                        <p className="font-medium text-primary">Token Type:</p>
                        <p>Utility Token</p>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold mt-6">Token Distribution</h3>
                  <div className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">Public Sale (IDO)</span>
                          <span>15%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: '15%' }}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Initial DEX offering with 2.5-3% TGE unlock, remaining vested over time
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">User Rewards</span>
                          <span>10%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: '10%' }}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Locked until exchange listing, then vested over 25 months for community incentives and platform rewards
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">Team & Advisors</span>
                          <span>15%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: '15%' }}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Locked for 24 months, then vested over 12 months to ensure long-term commitment
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">Reserved/Locked Supply</span>
                          <span>55%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: '55%' }}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Locked for 24 months, then vested linearly over 48 months for ecosystem growth and strategic partnerships
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">Development</span>
                          <span>5%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: '5%' }}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Reserved for future use and leftover from sales
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold mt-8">Token Utility</h3>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>
                      <span className="font-medium">Platform Access:</span> TAS tokens are required to access premium features 
                      on the TalkaStranger.com platform
                    </li>
                    <li>
                      <span className="font-medium">Token Creation:</span> Creating new tokens on the TASChain requires TAS for 
                      deployment and gas fees
                    </li>
                    <li>
                      <span className="font-medium">Visibility Boosting:</span> TAS tokens power the token boosting system, 
                      allowing creators to increase their project's visibility
                    </li>
                    <li>
                      <span className="font-medium">Governance:</span> TAS holders can participate in platform governance decisions 
                      through the upcoming DAO structure
                    </li>
                    <li>
                      <span className="font-medium">Fee Reduction:</span> Holding TAS tokens reduces trading fees across the platform
                    </li>
                    <li>
                      <span className="font-medium">Staking Rewards:</span> Users can stake TAS tokens to earn passive income and 
                      unlock additional platform benefits
                    </li>
                  </ul>
                  
                  <h3 className="text-xl font-semibold mt-8">Vesting Schedule & Exchange Listing</h3>
                  <p>
                    Our vesting schedule is designed to ensure price stability and long-term project sustainability. Vesting is the process where tokens are locked for a specific period before becoming available for sale or transfer, designed to ensure long-term commitment and prevent price volatility.
                  </p>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 my-4">
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-primary">Token Creation Date:</p>
                        <p>April 19, 2025</p>
                      </div>
                      <div>
                        <p className="font-medium text-primary">TGE (Token Generation Event) Unlock:</p>
                        <p>2.5-3% of Public Sale tokens initially unlocked</p>
                      </div>
                      <div>
                        <p className="font-medium text-primary">IDO Vesting:</p>
                        <p>Remaining Public Sale tokens vested gradually over approximately 12-18 months</p>
                      </div>
                      <div>
                        <p className="font-medium text-primary">User Rewards Vesting:</p>
                        <p>Locked until exchange listing, then vested over 25 months</p>
                      </div>
                      <div>
                        <p className="font-medium text-primary">Team & Advisors Vesting:</p>
                        <p>Locked for 24 months, then vested over 12 months</p>
                      </div>
                      <div>
                        <p className="font-medium text-primary">Reserved Supply Vesting:</p>
                        <p>Locked for 24 months, then vested linearly over 48 months</p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold mt-8">Token Value Capture</h3>
                  <p>
                    The TAS token has multiple mechanisms to ensure long-term value appreciation and stability:
                  </p>
                  
                  <div className="grid gap-4 md:grid-cols-2 mt-4">
                    <div className="p-3 border rounded-lg bg-slate-50">
                      <h4 className="font-semibold text-primary">Buyback & Burn</h4>
                      <p className="text-sm text-slate-600 mt-1">
                        15% of all platform fees are used to buy back and burn TAS tokens, creating deflationary pressure
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-lg bg-slate-50">
                      <h4 className="font-semibold text-primary">Staking Rewards</h4>
                      <p className="text-sm text-slate-600 mt-1">
                        Staking incentives encourage long-term holding, reducing circulating supply and increasing scarcity
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-lg bg-slate-50">
                      <h4 className="font-semibold text-primary">Utility-Driven Demand</h4>
                      <p className="text-sm text-slate-600 mt-1">
                        Essential for all platform operations, creating continuous demand as the ecosystem grows
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-lg bg-slate-50">
                      <h4 className="font-semibold text-primary">Strategic Partnerships</h4>
                      <p className="text-sm text-slate-600 mt-1">
                        Expansion of use cases through strategic integrations with other DeFi and Web3 platforms
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="roadmap" className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
                <div className="prose prose-slate max-w-none">
                  <h2 className="text-2xl font-bold">Project Roadmap</h2>
                  <p>
                    Our strategic development plan outlines the evolution of TASChain from conception to a fully 
                    decentralized social trading ecosystem. Each phase builds upon previous achievements to create 
                    a robust, feature-rich platform.
                  </p>
                  
                  <div className="relative border-l-2 border-primary/30 pl-8 mt-8">
                    <div className="mb-10 relative">
                      <div className="absolute -left-10 flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                      <h3 className="text-xl font-semibold">Q2 2025: Foundation Phase</h3>
                      <p className="text-sm text-slate-600 mt-2">
                        Setting the groundwork for our ecosystem
                      </p>
                      <ul className="list-disc pl-6 space-y-1 mt-3">
                        <li>TASChain whitepaper release and website launch</li>
                        <li>Social media establishment across major platforms</li>
                        <li>Core team expansion with blockchain and UI/UX specialists</li>
                        <li>Community-building initiatives with early adopter rewards</li>
                        <li>Initial smart contract architecture development</li>
                      </ul>
                    </div>
                    
                    <div className="mb-10 relative">
                      <div className="absolute -left-10 flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                      <h3 className="text-xl font-semibold">Q3 2025: Token & MVP Launch</h3>
                      <p className="text-sm text-slate-600 mt-2">
                        Introducing our token and base functionality
                      </p>
                      <ul className="list-disc pl-6 space-y-1 mt-3">
                        <li>TAS token sale begins with early supporter incentives</li>
                        <li>Private beta launch of Token Creation Hub</li>
                        <li>TAS token listing on decentralized exchanges</li>
                        <li>Initial version of TalkaStranger.com platform</li>
                        <li>Security audit of all smart contracts</li>
                      </ul>
                    </div>
                    
                    <div className="mb-10 relative">
                      <div className="absolute -left-10 flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                      <h3 className="text-xl font-semibold">Q4 2025: Core Platform Release</h3>
                      <p className="text-sm text-slate-600 mt-2">
                        Deploying essential trading and communication features
                      </p>
                      <ul className="list-disc pl-6 space-y-1 mt-3">
                        <li>Public launch of token trading functionality</li>
                        <li>Trade N Talk module activation across the platform</li>
                        <li>Full Token Creation Hub opening to all users</li>
                        <li>BSC integration complete with bridge functionality</li>
                        <li>Strategic partnerships with DeFi protocols announced</li>
                      </ul>
                    </div>
                    
                    <div className="mb-10 relative">
                      <div className="absolute -left-10 flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                      <h3 className="text-xl font-semibold">Q1 2026: Enhanced Features</h3>
                      <p className="text-sm text-slate-600 mt-2">
                        Expanding functionality for creators and traders
                      </p>
                      <ul className="list-disc pl-6 space-y-1 mt-3">
                        <li>Token Boosting System launch with visibility metrics</li>
                        <li>Instant AMA feature rollout for token creators</li>
                        <li>Enhanced analytics dashboard for token performance</li>
                        <li>Community vote governance testing</li>
                        <li>Liquidity provider incentives program</li>
                      </ul>
                    </div>
                    
                    <div className="mb-10 relative">
                      <div className="absolute -left-10 flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                      <h3 className="text-xl font-semibold">Q2 2026: Mobile & Expansion</h3>
                      <p className="text-sm text-slate-600 mt-2">
                        Extending reach and accessibility
                      </p>
                      <ul className="list-disc pl-6 space-y-1 mt-3">
                        <li>Mobile app development for iOS and Android</li>
                        <li>Strategic partnerships with major crypto influencers</li>
                        <li>Advanced token creation templates with customization</li>
                        <li>Push notification system for trading opportunities</li>
                        <li>Automated marketing tools for token creators</li>
                      </ul>
                    </div>
                    
                    <div className="mb-10 relative">
                      <div className="absolute -left-10 flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                      <h3 className="text-xl font-semibold">Q3 2026: Governance & Independence</h3>
                      <p className="text-sm text-slate-600 mt-2">
                        Moving toward community control
                      </p>
                      <ul className="list-disc pl-6 space-y-1 mt-3">
                        <li>DAO implementation with full governance voting</li>
                        <li>Community-led development initiatives</li>
                        <li>Advanced reputation system for trusted traders</li>
                        <li>Decentralized arbitration system for disputes</li>
                        <li>Automated audit tools for new token contracts</li>
                      </ul>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute -left-10 flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                      <h3 className="text-xl font-semibold">Q4 2026 & Beyond: Cross-Chain Future</h3>
                      <p className="text-sm text-slate-600 mt-2">
                        Expanding the ecosystem across blockchains
                      </p>
                      <ul className="list-disc pl-6 space-y-1 mt-3">
                        <li>Cross-chain compatibility (Ethereum, Solana, Polygon)</li>
                        <li>Global expansion initiatives and localization</li>
                        <li>Full Web3 wallet integrations with direct trading</li>
                        <li>TASChain NFT marketplace with social features</li>
                        <li>Tokenization-as-a-Service platform for enterprises</li>
                        <li>Advanced AI-driven token matching and recommendations</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border mt-8">
                    <h3 className="text-lg font-semibold text-primary">Commitment to Flexibility</h3>
                    <p className="text-sm mt-2">
                      While we are committed to this roadmap, we recognize the importance of adaptability in the rapidly 
                      evolving blockchain space. We may accelerate, modify or reprioritize certain features based on 
                      community feedback, market conditions, and technological developments. All significant changes will be 
                      communicated transparently to our community.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WhitePaperPage;