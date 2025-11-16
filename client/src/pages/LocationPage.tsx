import { useParams, Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { getLocationBySlug, countries, cities, areas, type LocationData } from "@shared/locations";
import { getCityImage } from "@shared/cityImages";
import { getCountryLanguage } from "@shared/countryLanguages";
import { getLocationContent } from "@shared/locationContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, VideoOff, Mic, MicOff, Send, Globe, Users, MessageCircle, Heart, Shield, Languages } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useLanguage } from "@/contexts/LanguageContext";
import WalletConnectionModal from "@/components/WalletConnectionModal";
import { useState, useEffect, useRef } from "react";

interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'stranger';
}

type LocationType = 'country' | 'city' | 'area';

interface LocationPageProps {
  type: LocationType;
}

export default function LocationPage({ type }: LocationPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const location = getLocationBySlug(slug || '', type);
  const { isConnected, openConnectModal } = useWallet();
  const { language, setLanguage } = useLanguage();
  const [, navigate] = useLocation();
  const [showLanguageToast, setShowLanguageToast] = useState(false);
  const [shouldNavigateToChat, setShouldNavigateToChat] = useState(false);

  // Get unique location-specific content
  const locationContent = getLocationContent(slug || '', type);
  
  // Use unique content if available, otherwise generate generic content
  const locationFAQ = locationContent?.faq || [
    {
      q: `Can I really chat with people from ${location?.name} for free?`,
      a: `Absolutely! Talk A Stranger is 100% free. Connect with ${location?.name} girls and boys without any charges, subscriptions, or hidden fees.`
    },
    {
      q: `How many people from ${location?.name} are online?`,
      a: `We have thousands of users from ${location?.name} online at any time. The platform is especially active during evenings and weekends.`
    },
    {
      q: `Do I need to live in ${location?.name} to use this?`,
      a: `No! You can connect with ${location?.name} strangers from anywhere in the world. Many users use our platform to learn about different cultures and make international friends.`
    },
    {
      q: `Is it safe to video chat with ${location?.name} strangers?`,
      a: `Yes! We prioritize your safety. Your conversations are completely anonymous, and we don't store any chat history. You can skip anyone instantly if needed.`
    },
    {
      q: `Can I filter by gender when chatting?`,
      a: `Yes! Our free gender filter lets you choose to chat with girls, boys, or both from ${location?.name}. This feature is available to everyone at no cost.`
    },
    {
      q: `What makes this platform different?`,
      a: `We offer location-specific connections with ${location?.name}, free gender filters, complete anonymity, and HD video quality - all 100% free forever!`
    }
  ];

  const locationMissionVision = locationContent?.missionVision || {
    mission: `To create meaningful connections between people in ${location?.name} and around the world. We believe everyone deserves access to free, safe video chat to meet new people and build friendships.`,
    vision: `To become ${location?.name}'s most popular platform for meeting new people through video chat. We envision a vibrant community where residents and visitors can easily connect.`,
    why: `Unlike generic chat platforms, we focus on connecting people with ${location?.name}. Our location-based matching, free gender filters, and anonymous features make every conversation safe and authentic.`
  };

  // Get city-specific image for city pages
  const cityImageFileName = type === 'city' ? getCityImage(slug || '') : null;
  
  // Get country language info
  const countryLang = type === 'country' ? getCountryLanguage(slug || '') : null;
  
  // Navigate to chat when wallet is connected
  useEffect(() => {
    if (shouldNavigateToChat && isConnected) {
      // Add a small delay to ensure everything is ready
      setTimeout(() => {
        navigate('/');
      }, 100);
    }
  }, [isConnected, shouldNavigateToChat, navigate]);

  // Open modal with pre-selected location for this page
  const handleStartTalking = () => {
    // Store the location preference AND FAQ/Mission data in sessionStorage so TradeNTalk can use it
    sessionStorage.setItem('preferredLocation', JSON.stringify({
      name: location?.name || '',
      type: type,
      faq: locationFAQ,
      missionVision: locationMissionVision
    }));
    
    // If already connected, navigate directly to chat
    if (isConnected) {
      navigate('/');
    } else {
      // Open wallet modal and set flag to navigate after connection
      setShouldNavigateToChat(true);
      openConnectModal?.();
    }
  };

  // Handle language change
  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as any);
    setShowLanguageToast(true);
    setTimeout(() => setShowLanguageToast(false), 3000);
  };

  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Location Not Found</h1>
          <Link href="/">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  const metaTitle = `Talk with Strangers in ${location.name} - Video Chat with ${location.name} Girls & Boys | Talk A Stranger`;
  const metaDescription = `Free random video chat with strangers from ${location.name}. Meet new ${location.name} girls and boys instantly. Anonymous video chatting platform. Start talking now!`;
  
  // Get related locations for internal linking
  const relatedCountries = countries.filter(c => c.slug !== slug).slice(0, 6);
  const relatedCities = cities.filter(c => c.slug !== slug).slice(0, 6);
  const relatedAreas = areas.filter(a => a.slug !== slug).slice(0, 6);

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <link rel="canonical" href={`https://talkastranger.com/location/${type}/${slug}`} />
        <meta name="keywords" content={`talk with strangers ${location.name}, video chat ${location.name}, random chat ${location.name}, meet ${location.name} girls, meet ${location.name} boys, ${location.name} video chat, talk to ${location.name} strangers, ${location.name} chat online`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white py-12 md:py-20">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Language Switcher Button */}
              {countryLang && (
                <div className="flex justify-center mb-4">
                  <Button
                    onClick={() => handleLanguageChange(countryLang.code)}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/40 text-white font-semibold px-4 md:px-6 py-2 md:py-3 rounded-full shadow-lg transition-all text-sm md:text-base"
                    data-testid="button-switch-language"
                  >
                    <Languages className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    <span className="mr-2">{countryLang.flag}</span>
                    Switch to {countryLang.nativeName}
                  </Button>
                </div>
              )}
              
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
                Talk with Strangers in <span className="text-yellow-300">{location.name}</span>
              </h1>
              <p className="text-base md:text-xl lg:text-2xl mb-6 text-white/90">
                {location.description}. Connect instantly with {location.name} girls and boys through free random video chat!
              </p>

              <Button 
                size="lg"
                onClick={handleStartTalking}
                className="w-full md:w-auto bg-white text-purple-600 hover:bg-gray-100 text-base md:text-xl px-8 md:px-12 py-4 md:py-6 rounded-full font-bold shadow-2xl transform hover:scale-105 transition-all mb-3"
                data-testid="button-start-talking-hero"
              >
                <Video className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                Start Talking in {location.name} Now!
              </Button>
              <p className="text-xs md:text-sm text-white/80 mb-4">No registration required • 100% Anonymous • Instant connection</p>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-2 max-w-sm md:max-w-md mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                  <div className="text-lg md:text-2xl mb-1">⚡</div>
                  <div className="font-bold text-[10px] md:text-sm">Instant Match</div>
                  <div className="text-white/60 text-[9px] md:text-xs">Connect fast</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                  <div className="text-lg md:text-2xl mb-1">🌟</div>
                  <div className="font-bold text-[10px] md:text-sm">100% Free</div>
                  <div className="text-white/60 text-[9px] md:text-xs">No fees</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                  <div className="text-lg md:text-2xl mb-1">🔒</div>
                  <div className="font-bold text-[10px] md:text-sm">Safe & Private</div>
                  <div className="text-white/60 text-[9px] md:text-xs">Secure chat</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                  <div className="text-lg md:text-2xl mb-1">🌍</div>
                  <div className="font-bold text-[10px] md:text-sm">Global Reach</div>
                  <div className="text-white/60 text-[9px] md:text-xs">Worldwide</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* City Image Section - Only for City Pages */}
        {type === 'city' && cityImageFileName && (
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-5xl mx-auto">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={`/attached_assets/${cityImageFileName}`}
                  alt={`${location.name} cityscape`}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <p className="text-white text-xl font-semibold">
                    Discover {location.name} - Connect with locals and visitors
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            {/* About Section */}
            <section className="mb-16">
              <h2 className="text-4xl font-bold mb-6 text-gray-800">
                Free Video Chat with Strangers from {location.name}
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Welcome to Talk A Stranger's {location.name} community! Connect with random strangers from {location.name} 
                  through our free video chat platform. Whether you're looking to make new friends, practice languages, 
                  or simply have fun conversations, our platform makes it easy to meet {location.name} girls and boys instantly.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Talk A Stranger is the best place to chat with strangers from {location.name}. Our random video chat 
                  connects you with people based on your preferences, making every conversation unique and exciting. 
                  Join thousands of users from {location.name} who are already using our platform to make meaningful connections.
                </p>
              </div>
            </section>

            {/* Features Grid */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
                Why Choose Talk A Stranger for {location.name}?
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-purple-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800">Meet {location.name} Locals</h3>
                  <p className="text-gray-600">
                    Connect with real people from {location.name}. Filter by gender and location to find exactly 
                    who you want to talk with.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-pink-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800">100% Anonymous</h3>
                  <p className="text-gray-600">
                    No registration required. Your privacy is our priority. Chat anonymously with strangers from {location.name}.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-orange-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mb-4">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800">HD Video Quality</h3>
                  <p className="text-gray-600">
                    Crystal clear video and audio for the best chatting experience with {location.name} strangers.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-blue-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800">Instant Matching</h3>
                  <p className="text-gray-600">
                    Get connected within seconds. Our algorithm finds the best matches from {location.name} for you.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-purple-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800">Global Community</h3>
                  <p className="text-gray-600">
                    While focusing on {location.name}, connect with people from around the world too!
                  </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-red-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800">Make Real Friends</h3>
                  <p className="text-gray-600">
                    Build genuine connections with {location.name} girls and boys. Many users find lasting friendships!
                  </p>
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section className="mb-16 bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
                How to Start Chatting with {location.name} Strangers
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold">
                    1
                  </div>
                  <h3 className="text-xl font-bold mb-3">Click "Start Talking"</h3>
                  <p className="text-gray-600">No sign-up needed. Just click the button and you're ready to go!</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold">
                    2
                  </div>
                  <h3 className="text-xl font-bold mb-3">Choose Your Preferences</h3>
                  <p className="text-gray-600">Select gender filter to match with {location.name} girls or boys</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold">
                    3
                  </div>
                  <h3 className="text-xl font-bold mb-3">Start Video Chatting!</h3>
                  <p className="text-gray-600">Get matched instantly and enjoy conversations with {location.name} strangers</p>
                </div>
              </div>
              <div className="text-center mt-12">
                <Button 
                  size="lg"
                  onClick={handleStartTalking}
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white text-xl px-12 py-6 rounded-full font-bold shadow-xl"
                  data-testid="button-start-talking-content"
                >
                  Start Talking with {location.name} Strangers Now
                </Button>
              </div>
            </section>

            {/* SEO Content Section */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6 text-gray-800">
                Best Random Video Chat Platform for {location.name}
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Talk A Stranger is the premier destination for video chatting with strangers from {location.name}. 
                  Our platform is designed specifically for people who want to meet new {location.name} girls and boys 
                  through random video chat. Whether you're in {location.name} or anywhere else in the world, you can 
                  connect with {location.name} locals and enjoy authentic conversations.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Unlike other chat platforms, Talk A Stranger offers advanced filters that let you connect specifically 
                  with people from {location.name}. Our gender filter is free for everyone, making it easy to find 
                  {location.name} girls or {location.name} boys based on your preference. The platform is optimized 
                  for both desktop and mobile, so you can chat with {location.name} strangers anytime, anywhere.
                </p>
                
                <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800">
                  How to Talk with Strangers in {location.name}
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Starting a conversation with someone from {location.name} is easy on Talk A Stranger. Simply click the 
                  "Start Talking" button, choose your nickname, and select your gender preference. If you have TAS tokens, 
                  you can also filter by location to specifically connect with {location.name} users. The platform will 
                  instantly match you with compatible strangers from {location.name} who are also looking to chat.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Once connected, you'll be in a live video chat with a real person from {location.name}. Be respectful, 
                  friendly, and genuine in your conversations. Many people from {location.name} use our platform to make 
                  friends, practice languages, or simply have fun conversations. Whether you want to learn about {location.name} 
                  culture, share your own experiences, or just have a casual chat, Talk A Stranger makes it possible.
                </p>

                <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800">
                  Why People Love Chatting with {location.name} Strangers
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  People from {location.name} are known for being friendly and welcoming. When you use Talk A Stranger 
                  to connect with {location.name} locals, you'll experience genuine conversations and maybe even make 
                  lifelong friends. Our users report high satisfaction rates when chatting with strangers from {location.name}, 
                  citing the friendly atmosphere and quality connections as top reasons.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  The video chat feature allows for face-to-face interaction, making conversations more personal and 
                  engaging. You can see the real person behind the chat, whether you're talking to {location.name} girls 
                  or {location.name} boys. This transparency creates trust and leads to more meaningful interactions.
                </p>

                <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800">
                  Tips for Great Conversations with {location.name} People
                </h3>
                <ul className="list-disc list-inside text-lg text-gray-700 mb-4 space-y-2">
                  <li>Be respectful and polite when talking to strangers from {location.name}</li>
                  <li>Ask about their culture, traditions, and daily life in {location.name}</li>
                  <li>Share your own experiences and be open to cultural exchange</li>
                  <li>Use the gender filter to match with {location.name} girls or boys based on your preference</li>
                  <li>Be patient and give each conversation a chance before moving to the next person</li>
                  <li>Keep conversations appropriate and follow platform guidelines</li>
                  <li>Share your location if comfortable - many {location.name} users enjoy meeting people who know their area</li>
                </ul>

                <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800">
                  Meeting {location.name} Girls Through Video Chat
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Many users specifically want to meet and talk with {location.name} girls. Our free gender filter makes 
                  this easy - simply select "Female" in your preferences and you'll be matched with {location.name} girls 
                  who are also looking to chat. The platform ensures safe, anonymous conversations where both parties can 
                  feel comfortable.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  {location.name} girls use Talk A Stranger for various reasons - to make friends, practice languages, 
                  have fun conversations, or meet new people. Always approach conversations with respect and genuine interest. 
                  Remember that every person from {location.name} has their own unique story and perspective to share.
                </p>

                <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800">
                  Connecting with {location.name} Boys on Random Chat
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Looking to chat with {location.name} boys? Use our gender filter to select "Male" and get instantly 
                  connected with guys from {location.name}. Whether you want to discuss sports, gaming, culture, or just 
                  have casual conversations, you'll find {location.name} boys ready to chat on our platform 24/7.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  {location.name} boys appreciate genuine conversations and cultural exchange. Many use the platform to 
                  meet new people, improve their communication skills, or simply pass time with interesting conversations. 
                  The video chat format allows for authentic interactions where you can truly get to know someone from {location.name}.
                </p>

                <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800">
                  Safety and Privacy When Chatting with {location.name} Strangers
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Your safety is our top priority when you chat with {location.name} strangers. Talk A Stranger requires 
                  no registration or personal information - you remain completely anonymous throughout your conversations. 
                  We don't store chat history or video recordings, ensuring your privacy when talking to {location.name} 
                  girls and boys.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  While most {location.name} users are friendly and respectful, we provide tools to skip or report 
                  inappropriate behavior. If someone makes you uncomfortable, simply click "Next" to be matched with 
                  a different person from {location.name}. Our community guidelines ensure that everyone can enjoy 
                  safe, positive experiences while chatting with {location.name} strangers.
                </p>

                <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800">
                  Why Choose Talk A Stranger for {location.name} Video Chat
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Talk A Stranger stands out as the best platform for connecting with {location.name} strangers. Our 
                  advanced matching algorithm ensures you're paired with compatible people from {location.name} based 
                  on your preferences. The platform works seamlessly on both desktop and mobile devices, so you can 
                  chat with {location.name} girls and boys wherever you are.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Unlike other random chat platforms, we offer location-specific filtering for TAS token holders, making 
                  it easier to find people specifically from {location.name}. Our free gender filter is available to everyone, 
                  allowing you to choose whether you want to chat with {location.name} girls, {location.name} boys, or both. 
                  Join our growing community and start making connections with {location.name} strangers today!
                </p>
              </div>
            </section>

            {/* Internal Linking - Other Locations */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Chat with Strangers in Other Locations</h2>
              
              {relatedCountries.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4 text-gray-700">Popular Countries</h3>
                  <div className="flex flex-wrap gap-3">
                    {relatedCountries.map((country) => (
                      <Link key={country.slug} href={`/country/${country.slug}`}>
                        <Button variant="outline" className="rounded-full hover:bg-purple-50 hover:border-purple-300">
                          <Globe className="w-4 h-4 mr-2" />
                          {country.name}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {relatedCities.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4 text-gray-700">Popular Cities</h3>
                  <div className="flex flex-wrap gap-3">
                    {relatedCities.map((city) => (
                      <Link key={city.slug} href={`/city/${city.slug}`}>
                        <Button variant="outline" className="rounded-full hover:bg-pink-50 hover:border-pink-300">
                          <Video className="w-4 h-4 mr-2" />
                          {city.name}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {relatedAreas.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-700">Popular Areas</h3>
                  <div className="flex flex-wrap gap-3">
                    {relatedAreas.map((area) => (
                      <Link key={area.slug} href={`/area/${area.slug}`}>
                        <Button variant="outline" className="rounded-full hover:bg-orange-50 hover:border-orange-300">
                          <Users className="w-4 h-4 mr-2" />
                          {area.name}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Final CTA */}
            <section className="text-center bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-2xl p-12 text-white">
              <h2 className="text-4xl font-bold mb-4">
                Ready to Meet {location.name} Strangers?
              </h2>
              <p className="text-xl mb-8 text-white/90">
                Join thousands of users already chatting with {location.name} girls and boys!
              </p>
              <Button 
                size="lg"
                onClick={handleStartTalking}
                className="bg-white text-purple-600 hover:bg-gray-100 text-xl px-12 py-6 rounded-full font-bold shadow-xl transform hover:scale-105 transition-all"
                data-testid="button-start-talking-final"
              >
                <Video className="w-6 h-6 mr-3" />
                Start Talking in {location.name} - Free Forever!
              </Button>
            </section>
          </div>
        </div>
      </div>

      <WalletConnectionModal />
    </>
  );
}
