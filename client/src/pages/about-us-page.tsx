import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Building2, 
  Globe, 
  Star, 
  TrendingUp, 
  Shield, 
  Rocket, 
  MessageSquare, 
  Zap 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const AboutUsPage = () => {
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
              <Users className="w-3 h-3 mr-1" />
              Our Story
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
            <p className="text-lg text-slate-600 mb-8">
              Welcome to talkastranger.com, your premier destination for exploring 
              and connecting with people and tokens from all around the world
            </p>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Mission and Vision */}
            <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8 mb-8">
              <div className="prose prose-slate max-w-none">
                <h2 className="text-2xl font-bold">Our Mission</h2>
                <p className="text-lg">
                  At talkastranger.com, we're on a mission to revolutionize the way people connect and trade crypto assets. 
                  We believe in creating meaningful relationships through conversations while simplifying cryptocurrency
                  trading through our innovative peer-to-peer platform.
                </p>
                
                <h2 className="text-2xl font-bold mt-8">Our Vision</h2>
                <p className="text-lg">
                  We envision a world where blockchain technology brings people together, creating a global 
                  community where conversations and transactions happen seamlessly, without the complexity of 
                  traditional exchanges or the impersonal nature of typical social networks.
                </p>
              </div>
            </div>
            
            {/* What Makes Us Different */}
            <h2 className="text-2xl font-bold mb-6">What Makes Us Different</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Trade and Talk</h3>
                      <p className="text-slate-600 mt-2">
                        Our unique "Trade N Talk" feature connects you with like-minded traders through real-time 
                        chat while swapping tokens, bringing a social element to cryptocurrency trading.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">TAS Chain Security</h3>
                      <p className="text-slate-600 mt-2">
                        Our platform is built on the innovative TAS Chain, providing high security standards, 
                        faster transactions, and lower fees than traditional blockchain networks.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                      <Rocket className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Create Custom Tokens</h3>
                      <p className="text-slate-600 mt-2">
                        Launch your own cryptocurrency tokens on TAS Chain with just a few clicks, without 
                        needing technical expertise or expensive smart contract development.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Global Community</h3>
                      <p className="text-slate-600 mt-2">
                        Connect with crypto enthusiasts from around the world, share insights, and build 
                        meaningful connections while exploring the cryptocurrency ecosystem.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Our Values */}
            <h2 className="text-2xl font-bold mb-6">Our Core Values</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <Zap className="h-7 w-7 text-yellow-500 mb-3" />
                <h3 className="font-semibold text-lg">Innovation</h3>
                <p className="text-slate-600 mt-1">Constantly pushing boundaries with cutting-edge blockchain technology.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <Shield className="h-7 w-7 text-green-600 mb-3" />
                <h3 className="font-semibold text-lg">Security</h3>
                <p className="text-slate-600 mt-1">Prioritizing the safety of our users and their assets at all times.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <Users className="h-7 w-7 text-blue-600 mb-3" />
                <h3 className="font-semibold text-lg">Community</h3>
                <p className="text-slate-600 mt-1">Building connections and fostering a supportive global network.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <TrendingUp className="h-7 w-7 text-purple-600 mb-3" />
                <h3 className="font-semibold text-lg">Growth</h3>
                <p className="text-slate-600 mt-1">Supporting user development and platform expansion constantly.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <Star className="h-7 w-7 text-amber-500 mb-3" />
                <h3 className="font-semibold text-lg">Excellence</h3>
                <p className="text-slate-600 mt-1">Striving for quality in every aspect of our platform and service.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <Building2 className="h-7 w-7 text-cyan-600 mb-3" />
                <h3 className="font-semibold text-lg">Transparency</h3>
                <p className="text-slate-600 mt-1">Operating with openness in all our platform activities and communications.</p>
              </div>
            </div>
            
            {/* Our Team/Company */}
            <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">Our Company</h2>
              <p className="text-lg mb-4">
                Based in Dubai, UAE, talkastranger.com is a dynamic team of blockchain experts, developers, 
                designers, and crypto enthusiasts dedicated to creating a revolutionary trading and social platform.
              </p>
              <p className="text-lg mb-4">
                We combine deep technical expertise with a passion for cryptocurrency to deliver an exceptional 
                platform that addresses real user needs in the ever-evolving blockchain space.
              </p>
              
              <div className="mt-8 bg-slate-50 p-5 rounded-lg border border-slate-100">
                <h3 className="font-semibold text-lg mb-2">Contact Us</h3>
                <p className="mb-3">
                  <span className="font-medium">Email:</span> info@talkastranger.com
                </p>
                <p className="mb-3">
                  <span className="font-medium">Office:</span> 4th avenue - Ibn Battuta st - Al-furjan, Dubai, UAE
                </p>
                <div className="flex gap-3 mt-4">
                  <a 
                    href="https://facebook.com/talkastranger" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                  >
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                    </svg>
                  </a>
                  <a 
                    href="https://t.me/talkastranger" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                  >
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.356 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUsPage;