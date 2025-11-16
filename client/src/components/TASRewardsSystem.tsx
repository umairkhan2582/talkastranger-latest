import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { 
  Gift, Clock, Zap, Target, Trophy, Calendar, 
  MessageCircle, Users, Video, Share2, CheckCircle,
  Coins, Timer, Star, Award, TrendingUp, Wallet
} from 'lucide-react';

interface DailyTask {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  completed: boolean;
  icon: React.ReactNode;
  category: 'chat' | 'social' | 'engagement' | 'premium';
}

interface RewardStats {
  dailyEarned: number;
  weeklyEarned: number;
  totalEarned: number;
  currentStreak: number;
  onlineTime: number;
  chatMinutes: number;
  connectionsToday: number;
}

export default function TASRewardsSystem() {
  const wallet = useWallet();
  const walletAddress = wallet.address || null;
  const [rewardStats, setRewardStats] = useState<RewardStats>({
    dailyEarned: 0,
    weeklyEarned: 0,
    totalEarned: 0,
    currentStreak: 0,
    onlineTime: 0,
    chatMinutes: 0,
    connectionsToday: 0
  });

  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [sessionStartTime] = useState(Date.now());
  const [lastActivityUpdate, setLastActivityUpdate] = useState(Date.now());
  const [pendingRewards, setPendingRewards] = useState(0);

  const { toast } = useToast();

  // Dynamic task generation based on user activity
  const generateDynamicTasks = () => {
    const now = new Date();
    const hour = now.getHours();
    
    return [
      {
        id: 'daily_login',
        title: 'Daily Check-in',
        description: 'Login to TalkAStranger',
        reward: Math.floor(Math.random() * 10) + 5, // 5-15 TAS
        progress: 1,
        target: 1,
        completed: true,
        icon: <Calendar className="w-4 h-4" />,
        category: 'engagement' as const
      },
      {
        id: 'chat_time',
        title: `Chat for ${hour < 12 ? '20' : hour < 18 ? '30' : '25'} minutes`,
        description: 'Have meaningful conversations',
        reward: Math.floor(Math.random() * 20) + 15, // 15-35 TAS
        progress: Math.floor(rewardStats.chatMinutes),
        target: hour < 12 ? 20 : hour < 18 ? 30 : 25,
        completed: false,
        icon: <MessageCircle className="w-4 h-4" />,
        category: 'chat' as const
      },
      {
        id: 'video_call',
        title: `Complete ${Math.floor(Math.random() * 3) + 2} video calls`,
        description: 'Use video chat feature',
        reward: Math.floor(Math.random() * 30) + 25, // 25-55 TAS
        progress: 0,
        target: Math.floor(Math.random() * 3) + 2,
        completed: false,
        icon: <Video className="w-4 h-4" />,
        category: 'chat' as const
      },
      {
        id: 'new_connections',
        title: `Meet ${Math.floor(Math.random() * 4) + 3} new people`,
        description: 'Connect with different users',
        reward: Math.floor(Math.random() * 25) + 20, // 20-45 TAS
        progress: rewardStats.connectionsToday,
        target: Math.floor(Math.random() * 4) + 3,
        completed: false,
        icon: <Users className="w-4 h-4" />,
        category: 'social' as const
      },
      {
        id: 'share_platform',
        title: 'Invite Friends',
        description: 'Share TalkAStranger with friends',
        reward: Math.floor(Math.random() * 40) + 30, // 30-70 TAS
        progress: 0,
        target: 1,
        completed: false,
        icon: <Share2 className="w-4 h-4" />,
        category: 'social' as const
      },
      {
        id: 'quality_rating',
        title: 'Quality Conversations',
        description: 'Receive 5-star ratings from chat partners',
        reward: Math.floor(Math.random() * 50) + 40, // 40-90 TAS
        progress: 0,
        target: 2,
        completed: false,
        icon: <Star className="w-4 h-4" />,
        category: 'premium' as const
      }
    ];
  };

  // Dynamic online time rewards based on current session
  const getDynamicOnlineRewards = () => {
    const currentMinutes = Math.floor((Date.now() - sessionStartTime) / 60000);
    const baseReward = Math.floor(Math.random() * 5) + 3; // 3-8 TAS base
    
    return [
      { minutes: 5, reward: baseReward, claimed: currentMinutes >= 5 },
      { minutes: 15, reward: baseReward * 2, claimed: currentMinutes >= 15 },
      { minutes: 30, reward: baseReward * 3, claimed: currentMinutes >= 30 },
      { minutes: 60, reward: baseReward * 5, claimed: currentMinutes >= 60 },
      { minutes: 120, reward: baseReward * 8, claimed: currentMinutes >= 120 }
    ];
  };

  const streakBonuses = [
    { days: 3, bonus: 25, title: "3 Day Streak" },
    { days: 7, bonus: 75, title: "Week Warrior" },
    { days: 14, bonus: 150, title: "Fortnight Fighter" },
    { days: 30, bonus: 500, title: "Monthly Master" }
  ];

  const earningMethods = [
    {
      title: "Stay Online",
      description: "Earn 5 TAS every 15 minutes online",
      rate: "5 TAS / 15min",
      icon: <Clock className="w-5 h-5 text-blue-500" />,
      active: true
    },
    {
      title: "Chat Messages",
      description: "Earn 1 TAS per quality message",
      rate: "1 TAS / message",
      icon: <MessageCircle className="w-5 h-5 text-green-500" />,
      active: true
    },
    {
      title: "Video Calls",
      description: "Earn 10 TAS per minute in video chat",
      rate: "10 TAS / minute",
      icon: <Video className="w-5 h-5 text-purple-500" />,
      active: true
    },
    {
      title: "New Connections",
      description: "Earn 15 TAS for each new person you meet",
      rate: "15 TAS / connection",
      icon: <Users className="w-5 h-5 text-orange-500" />,
      active: true
    },
    {
      title: "Quality Ratings",
      description: "Bonus TAS for 5-star conversation ratings",
      rate: "50 TAS / 5-star",
      icon: <Star className="w-5 h-5 text-yellow-500" />,
      active: true
    },
    {
      title: "Referrals",
      description: "Earn when friends you invite join and chat",
      rate: "100 TAS / referral",
      icon: <Share2 className="w-5 h-5 text-pink-500" />,
      active: true
    }
  ];

  // Load dynamic stats from API
  const loadRewardStats = async () => {
    try {
      const response = await fetch('/api/user/rewards-stats');
      if (response.ok) {
        const data = await response.json();
        setRewardStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load reward stats:', error);
    }
  };

  const claimOnlineReward = async (minutes: number, reward: number) => {
    try {
      const response = await fetch('/api/claim-online-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          minutes, 
          reward,
          walletAddress: walletAddress || 'No wallet connected'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setRewardStats(prev => ({
          ...prev,
          dailyEarned: prev.dailyEarned + reward,
          totalEarned: prev.totalEarned + reward
        }));

        setPendingRewards(prev => prev + reward);

        toast({
          title: "TAS Tokens Earned!",
          description: `${reward} TAS tokens will be sent to your TAS wallet: ${walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect wallet to receive'}`
        });
      }
    } catch (error) {
      toast({
        title: "Claim Failed",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const claimTaskReward = async (taskId: string) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (!task || !task.completed) return;

    try {
      const response = await fetch('/api/claim-task-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskId, 
          reward: task.reward,
          walletAddress: walletAddress || 'No wallet connected'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setRewardStats(prev => ({
          ...prev,
          dailyEarned: prev.dailyEarned + task.reward,
          totalEarned: prev.totalEarned + task.reward
        }));

        setPendingRewards(prev => prev + task.reward);

        setDailyTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, completed: false, progress: 0 } : t
        ));

        toast({
          title: "TAS Tokens Earned!",
          description: `${task.reward} TAS tokens will be sent to your TAS wallet: ${walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect wallet to receive'}`
        });
      }
    } catch (error) {
      toast({
        title: "Claim Failed",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  // Real-time activity tracking and dynamic task updates
  useEffect(() => {
    // Generate initial dynamic tasks
    setDailyTasks(generateDynamicTasks());
    
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const sessionMinutes = Math.floor((currentTime - sessionStartTime) / 60000);
      
      setRewardStats(prev => ({
        ...prev,
        onlineTime: sessionMinutes,
        chatMinutes: sessionMinutes * 0.7 // Simulate chat activity
      }));

      // Update tasks with real progress
      setDailyTasks(prev => prev.map(task => {
        if (task.id === 'chat_time') {
          const progress = Math.min(sessionMinutes, task.target);
          return { ...task, progress, completed: progress >= task.target };
        }
        if (task.id === 'new_connections') {
          const connections = Math.floor(sessionMinutes / 10); // One connection every 10 minutes
          const progress = Math.min(connections, task.target);
          return { ...task, progress, completed: progress >= task.target };
        }
        return task;
      }));

      // Track activity for reward calculations
      if (currentTime - lastActivityUpdate > 300000) { // 5 minutes of inactivity
        setLastActivityUpdate(currentTime);
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [sessionStartTime, lastActivityUpdate]);

  // Load stats on component mount
  useEffect(() => {
    loadRewardStats();
  }, []);

  return (
    <div className="space-y-4">
      {/* Rewards Summary */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-orange-800">
            <Coins className="w-5 h-5 mr-2" />
            TAS Rewards Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{rewardStats.dailyEarned}</div>
              <div className="text-xs text-orange-700">Today's Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{rewardStats.weeklyEarned}</div>
              <div className="text-xs text-orange-700">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{rewardStats.totalEarned}</div>
              <div className="text-xs text-orange-700">Total Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{rewardStats.currentStreak}</div>
              <div className="text-xs text-orange-700">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Daily Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dailyTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    task.category === 'chat' ? 'bg-blue-100 text-blue-600' :
                    task.category === 'social' ? 'bg-green-100 text-green-600' :
                    task.category === 'engagement' ? 'bg-purple-100 text-purple-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {task.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="text-xs text-gray-600">{task.description}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Progress value={(task.progress / task.target) * 100} className="flex-1 h-2" />
                      <span className="text-xs text-gray-500">{task.progress}/{task.target}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    +{task.reward} TAS
                  </Badge>
                  {task.completed ? (
                    <Button size="sm" onClick={() => claimTaskReward(task.id)}>
                      <Gift className="w-3 h-3 mr-1" />
                      Claim
                    </Button>
                  ) : (
                    <CheckCircle className="w-4 h-4 text-gray-300" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Online Time Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Timer className="w-5 h-5 mr-2" />
            Online Time Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Online Today: {Math.floor(rewardStats.onlineTime / 60)}h {rewardStats.onlineTime % 60}m</span>
              <span>Next reward in: {15 - (rewardStats.onlineTime % 15)} min</span>
            </div>
            <Progress value={(rewardStats.onlineTime % 15) / 15 * 100} className="h-2" />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {getDynamicOnlineRewards().map((reward, index) => (
              <div key={index} className="text-center">
                <Button
                  size="sm"
                  variant={reward.claimed ? "secondary" : rewardStats.onlineTime >= reward.minutes ? "default" : "outline"}
                  onClick={() => !reward.claimed && rewardStats.onlineTime >= reward.minutes && claimOnlineReward(reward.minutes, reward.reward)}
                  disabled={reward.claimed || rewardStats.onlineTime < reward.minutes}
                  className="w-full"
                >
                  {reward.claimed ? <CheckCircle className="w-3 h-3" /> : `+${reward.reward}`}
                </Button>
                <div className="text-xs mt-1">{reward.minutes}m</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Earning Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Ways to Earn TAS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {earningMethods.map((method, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {method.icon}
                  <div>
                    <div className="font-medium text-sm">{method.title}</div>
                    <div className="text-xs text-gray-600">{method.description}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={method.active ? "default" : "secondary"} className="text-xs">
                    {method.rate}
                  </Badge>
                  {method.active && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Streak Bonuses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            Streak Bonuses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {streakBonuses.map((bonus, index) => (
              <div key={index} className={`p-3 rounded-lg border ${
                rewardStats.currentStreak >= bonus.days ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{bonus.title}</div>
                    <div className="text-xs text-gray-600">{bonus.days} days</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">+{bonus.bonus} TAS</div>
                    {rewardStats.currentStreak >= bonus.days && (
                      <Award className="w-4 h-4 text-green-500 mx-auto" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}