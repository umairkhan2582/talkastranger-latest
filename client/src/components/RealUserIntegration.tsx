import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, Globe, MessageCircle, Share2, ExternalLink, 
  Clock, MapPin, Heart, UserPlus, Zap
} from 'lucide-react';

interface DiscoveryChannel {
  name: string;
  description: string;
  userCount: string;
  category: 'social' | 'chat' | 'gaming' | 'learning';
  url: string;
  icon: string;
  instructions: string;
}

export default function RealUserIntegration() {
  const [activeChannels, setActiveChannels] = useState<DiscoveryChannel[]>([]);
  const { toast } = useToast();

  const discoveryChannels: DiscoveryChannel[] = [
    {
      name: "Discord Communities",
      description: "Join chat-focused Discord servers",
      userCount: "50M+ active users",
      category: "chat",
      url: "https://discord.com/invite/chat",
      icon: "🎮",
      instructions: "Share your TalkAStranger link in #general or #introductions channels"
    },
    {
      name: "Reddit r/chat",
      description: "Connect with people seeking conversations",
      userCount: "500K+ members",
      category: "social",
      url: "https://reddit.com/r/chat",
      icon: "📱",
      instructions: "Post: 'Join me on TalkAStranger for video/text chat with crypto rewards'"
    },
    {
      name: "Reddit r/MeetPeople",
      description: "Platform for meeting new friends",
      userCount: "300K+ members", 
      category: "social",
      url: "https://reddit.com/r/MeetPeople",
      icon: "👥",
      instructions: "Create posts offering TAS tokens for quality conversations"
    },
    {
      name: "Telegram Chat Groups",
      description: "International chat communities",
      userCount: "1B+ users worldwide",
      category: "chat",
      url: "https://t.me/ChatGroup",
      icon: "✈️",
      instructions: "Share in international groups: @WorldwideChat, @GlobalTalk, @ChatLovers"
    },
    {
      name: "Language Exchange Apps",
      description: "Connect with language learners",
      userCount: "10M+ learners",
      category: "learning",
      url: "https://www.conversation-exchange.com",
      icon: "🌍",
      instructions: "Offer TAS token rewards for English/crypto education sessions"
    },
    {
      name: "Gaming Communities",
      description: "Recruit from crypto gaming groups",
      userCount: "100M+ gamers",
      category: "gaming",
      url: "https://discord.gg/cryptogaming",
      icon: "🎯",
      instructions: "Connect with users interested in play-to-earn and crypto rewards"
    }
  ];

  const shareContent = `🚀 Join TalkAStranger - Earn Crypto While Chatting!

✨ What you get:
• Video/text chat with people worldwide
• Earn TAS tokens for conversations  
• Token rewards for quality interactions
• Blockchain-powered social platform

💰 FREE 10 TAS tokens when you join with my link!
🔗 ${window.location.origin}

#TalkAStranger #CryptoChat #EarnTokens #BlockchainSocial`;

  const handleChannelAction = async (channel: DiscoveryChannel) => {
    if (navigator.share && /mobile/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: `Join me on TalkAStranger via ${channel.name}`,
          text: shareContent,
          url: window.location.origin
        });
      } catch (err) {
        copyToClipboard(channel);
      }
    } else {
      window.open(channel.url, '_blank');
      copyToClipboard(channel);
    }
  };

  const copyToClipboard = async (channel: DiscoveryChannel) => {
    const message = `${shareContent}\n\nInstructions for ${channel.name}:\n${channel.instructions}`;
    try {
      await navigator.clipboard.writeText(message);
      toast({
        title: "Content Copied!",
        description: `Share this in ${channel.name} to invite real users`
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please copy the sharing content manually"
      });
    }
  };

  const directPlatformLinks = [
    {
      platform: "WhatsApp Status",
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareContent)}`, '_blank')
    },
    {
      platform: "Twitter/X", 
      action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareContent)}`, '_blank')
    },
    {
      platform: "Facebook",
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(shareContent)}`, '_blank')
    },
    {
      platform: "LinkedIn",
      action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`, '_blank')
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Users className="w-5 h-5 mr-2" />
            Connect with Real Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {discoveryChannels.map((channel) => (
              <div key={channel.name} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{channel.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{channel.name}</div>
                    <div className="text-sm text-gray-600">{channel.description}</div>
                    <div className="flex items-center space-x-3 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {channel.userCount}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {channel.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handleChannelAction(channel)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share & Join
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Quick Social Share
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {directPlatformLinks.map((link) => (
              <Button
                key={link.platform}
                onClick={link.action}
                variant="outline"
                className="h-12 flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{link.platform}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Community Building Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <UserPlus className="w-4 h-4 mt-0.5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">Host Virtual Events</div>
                <div className="text-green-700">Organize crypto education sessions or language exchanges</div>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Heart className="w-4 h-4 mt-0.5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-800">Offer Token Incentives</div>
                <div className="text-blue-700">Reward quality conversations and community building</div>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
              <Globe className="w-4 h-4 mt-0.5 text-purple-600" />
              <div>
                <div className="font-medium text-purple-800">Cross-Platform Promotion</div>
                <div className="text-purple-700">Share across multiple platforms for maximum reach</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-800 mb-2">
              🎯 Growth Strategy
            </div>
            <div className="text-yellow-700 text-sm">
              Share on 3-5 platforms daily to build a steady stream of new users. 
              Focus on quality interactions to create a positive community reputation.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}