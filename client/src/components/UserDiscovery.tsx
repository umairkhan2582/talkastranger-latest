import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Globe, Users, Search, MapPin, Heart, MessageCircle, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RealUser {
  id: string;
  username: string;
  age: number;
  country: string;
  city?: string;
  interests: string[];
  isOnline: boolean;
  lastSeen: Date;
  profilePicture?: string;
  bio?: string;
  commonInterests?: number;
}

export default function UserDiscovery() {
  const [users, setUsers] = useState<RealUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Simulate fetching real users from various sources
  const discoverUsers = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from:
      // 1. Your own user database
      // 2. Integration with social platforms (with permission)
      // 3. Partner networks
      // 4. Public APIs where available
      
      const response = await fetch('/api/discover-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          country: selectedCountry,
          interests: getUserInterests(),
        })
      });
      
      if (response.ok) {
        const discoveredUsers = await response.json();
        setUsers(discoveredUsers);
      }
    } catch (error) {
      // Fallback to promoting the platform through legitimate channels
      showDiscoveryTips();
    } finally {
      setLoading(false);
    }
  };

  const getUserInterests = () => {
    const profile = localStorage.getItem('userProfile');
    return profile ? JSON.parse(profile).interests || [] : [];
  };

  const showDiscoveryTips = () => {
    toast({
      title: "Growing Our Community",
      description: "Share TalkAStranger with friends to connect with more real people!"
    });
  };

  const connectToUser = async (userId: string) => {
    try {
      const response = await fetch('/api/send-connection-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (response.ok) {
        toast({
          title: "Connection Request Sent",
          description: "You'll be notified when they respond!"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const socialDiscoveryMethods = [
    {
      platform: "Discord Communities",
      description: "Join chat servers and invite members",
      action: "Share in Discord",
      icon: "🎮",
      url: "https://discord.com"
    },
    {
      platform: "Reddit Communities", 
      description: "Post in r/chat, r/meetpeople, r/socialskills",
      action: "Post on Reddit",
      icon: "🤖",
      url: "https://reddit.com/r/chat"
    },
    {
      platform: "Telegram Groups",
      description: "Share in international chat groups",
      action: "Share in Telegram",
      icon: "✈️",
      url: "https://t.me"
    },
    {
      platform: "Language Exchange",
      description: "Connect with language learners",
      action: "Find Language Partners",
      icon: "🌍",
      url: "https://www.conversation-exchange.com"
    }
  ];

  useEffect(() => {
    discoverUsers();
  }, [searchQuery, selectedCountry]);

  return (
    <div className="space-y-6">
      {/* User Discovery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Discover Real People
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search by interests, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={discoverUsers} disabled={loading}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {users.length > 0 ? (
              <div className="grid gap-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{user.username}</span>
                          <span className="text-sm text-gray-500">({user.age})</span>
                          {user.isOnline && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>{user.city ? `${user.city}, ` : ''}{user.country}</span>
                        </div>
                        <div className="flex space-x-1 mt-1">
                          {user.interests.slice(0, 3).map((interest) => (
                            <Badge key={interest} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                          {user.commonInterests && user.commonInterests > 0 && (
                            <Badge variant="default" className="text-xs">
                              {user.commonInterests} in common
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => connectToUser(user.id)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Connect
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No users found in your area</p>
                <p className="text-sm">Try expanding your search or invite friends!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social Discovery Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Find People on Other Platforms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {socialDiscoveryMethods.map((method) => (
              <div key={method.platform} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{method.icon}</span>
                  <div>
                    <div className="font-medium">{method.platform}</div>
                    <div className="text-sm text-gray-600">{method.description}</div>
                  </div>
                </div>
                <a
                  href={method.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                >
                  {method.action}
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Community Building Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Build Our Community
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <Heart className="w-4 h-4 mt-0.5 text-red-500" />
              <span>Share your experience on social media with #TalkAStranger</span>
            </div>
            <div className="flex items-start space-x-2">
              <Users className="w-4 h-4 mt-0.5 text-blue-500" />
              <span>Invite friends and earn TAS tokens for each person who joins</span>
            </div>
            <div className="flex items-start space-x-2">
              <Globe className="w-4 h-4 mt-0.5 text-green-500" />
              <span>Join our official Discord and Telegram communities</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}