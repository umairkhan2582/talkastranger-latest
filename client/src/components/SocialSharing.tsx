import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, Users, Gift, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function SocialSharing() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const referralLink = `${window.location.origin}?ref=${Math.random().toString(36).substr(2, 8)}`;

  const shareData = {
    title: 'Join me on TalkAStranger - Meet Real People!',
    text: 'I\'m using TalkAStranger to meet interesting people from around the world. Join me for some great conversations!',
    url: referralLink
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Share this link with friends to earn rewards"
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually",
        variant: "destructive"
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyLink();
    }
  };

  const socialPlatforms = [
    {
      name: 'Twitter',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`,
      color: 'bg-blue-500',
      icon: '🐦'
    },
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`,
      color: 'bg-blue-600',
      icon: '📘'
    },
    {
      name: 'WhatsApp',
      url: `https://wa.me/?text=${encodeURIComponent(`${shareData.text} ${shareData.url}`)}`,
      color: 'bg-green-500',
      icon: '💬'
    },
    {
      name: 'Telegram',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`,
      color: 'bg-blue-500',
      icon: '✈️'
    },
    {
      name: 'Discord',
      url: `https://discord.com/channels/@me`,
      color: 'bg-indigo-500',
      icon: '🎮'
    },
    {
      name: 'Reddit',
      url: `https://reddit.com/submit?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(shareData.title)}`,
      color: 'bg-orange-500',
      icon: '🤖'
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Share2 className="w-5 h-5 mr-2" />
          Invite Friends & Earn Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          Share TalkAStranger with friends and both of you get 10 TAS tokens when they join!
        </div>

        {/* Quick Share Button */}
        <Button 
          onClick={handleNativeShare}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Users className="w-4 h-4 mr-2" />
          Share with Friends
        </Button>

        {/* Copy Link */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
          />
          <Button 
            onClick={handleCopyLink}
            variant="outline"
            size="sm"
            className="flex-shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        {/* Social Platforms */}
        <div>
          <div className="text-sm font-medium mb-3">Share on Social Media:</div>
          <div className="grid grid-cols-3 gap-2">
            {socialPlatforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${platform.color} text-white p-3 rounded-lg text-center hover:opacity-90 transition-opacity`}
              >
                <div className="text-lg mb-1">{platform.icon}</div>
                <div className="text-xs font-medium">{platform.name}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Rewards Info */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center mb-2">
            <Gift className="w-4 h-4 mr-2 text-orange-500" />
            <span className="font-medium text-orange-800">Referral Rewards</span>
          </div>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• You get 10 TAS tokens for each friend who joins</li>
            <li>• Your friend gets 10 TAS tokens as a welcome bonus</li>
            <li>• Unlock premium features with more TAS tokens</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}