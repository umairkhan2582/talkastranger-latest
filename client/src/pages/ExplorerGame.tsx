import React, { useState, useEffect, useRef } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useSafeNavigate } from "@/lib/BrowserCompatibleRouter";
import { 
  ArrowUpRight, 
  Book, 
  Coins, 
  CubeIcon, 
  Check, 
  Clock, 
  Trophy, 
  Wallet, 
  RefreshCw, 
  Info, 
  Sparkles,
  Award,
  Lightbulb
} from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

// SVG for node connections in the visualization
const NodeConnection = ({ x1, y1, x2, y2, active = false, pending = false }) => (
  <svg 
    style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      pointerEvents: 'none', 
      zIndex: 1 
    }}
  >
    <line 
      x1={x1} 
      y1={y1} 
      x2={x2} 
      y2={y2} 
      stroke={active ? '#4ade80' : pending ? '#f59e0b' : '#e2e8f0'} 
      strokeWidth={active ? 3 : 2} 
      strokeDasharray={pending ? "5,5" : "none"}
    />
  </svg>
);

// Block node component
const BlockNode = ({ 
  id, 
  active = false, 
  confirmed = false, 
  pending = false, 
  onClick, 
  data = null 
}) => {
  const statusColor = confirmed 
    ? 'bg-green-100 border-green-300 text-green-800' 
    : pending 
      ? 'bg-amber-100 border-amber-300 text-amber-800 animate-pulse' 
      : 'bg-slate-100 border-slate-300 text-slate-800';

  return (
    <div 
      className={`relative cursor-pointer border-2 ${active ? 'ring-2 ring-primary' : ''} 
        ${statusColor} rounded-lg p-3 transition-all hover:shadow-md`}
      onClick={onClick}
    >
      <div className="font-mono text-xs mb-1">#{id}</div>
      {confirmed && (
        <Badge variant="outline" className="absolute top-1 right-1 bg-green-100 text-green-800 border-green-300">
          <Check className="h-3 w-3 mr-1" />
          Confirmed
        </Badge>
      )}
      {pending && (
        <Badge variant="outline" className="absolute top-1 right-1 bg-amber-100 text-amber-800 border-amber-300">
          <Clock className="h-3 w-3 mr-1 animate-spin" />
          Pending
        </Badge>
      )}
      {data && (
        <div className="text-xs mt-2 font-mono truncate">
          {data.type === 'transfer' && (
            <span className="text-blue-600">Transfer: {data.amount} tokens</span>
          )}
          {data.type === 'mint' && (
            <span className="text-purple-600">Mint: {data.amount} tokens</span>
          )}
          {data.type === 'burn' && (
            <span className="text-red-600">Burn: {data.amount} tokens</span>
          )}
        </div>
      )}
    </div>
  );
};

// Tutorial steps
const TUTORIAL_STEPS = [
  {
    title: "Welcome to the Blockchain Explorer",
    content: "This interactive tool will help you understand how tokens work on a blockchain. Follow along to learn the basics of blockchain technology.",
    action: "Next"
  },
  {
    title: "Blocks and Chains",
    content: "A blockchain is a series of connected blocks. Each block contains transaction data. Once confirmed, blocks cannot be altered.",
    action: "Next"
  },
  {
    title: "Transactions",
    content: "Transactions represent token transfers between wallets. They are grouped into blocks and then verified by the network.",
    action: "Next"
  },
  {
    title: "Creating Transactions",
    content: "Try creating your own transaction! Click the 'New Transaction' button to mint, transfer, or burn tokens.",
    action: "Try It"
  },
  {
    title: "Mining",
    content: "Mining is the process of confirming transactions and adding them to the blockchain. Click 'Mine Block' to process pending transactions.",
    action: "Try It"
  },
  {
    title: "Rewards",
    content: "Complete all the challenges to earn achievements and learn about blockchain technology.",
    action: "Start Exploring"
  }
];

// Game challenges
const CHALLENGES = [
  {
    id: 'create_transaction',
    title: 'Create a Transaction',
    description: 'Create your first token transaction',
    xp: 10,
    completed: false
  },
  {
    id: 'mine_block',
    title: 'Mine a Block',
    description: 'Successfully mine your first block',
    xp: 15, 
    completed: false
  },
  {
    id: 'chain_5_blocks',
    title: 'Build a Chain',
    description: 'Create a blockchain with at least 5 blocks',
    xp: 25,
    completed: false
  },
  {
    id: 'all_transaction_types',
    title: 'Transaction Master',
    description: 'Create a mint, transfer, and burn transaction',
    xp: 20,
    completed: false
  },
  {
    id: 'reach_100_tokens',
    title: 'Token Collector',
    description: 'Accumulate a balance of 100 tokens',
    xp: 30,
    completed: false
  }
];

const ExplorerGame = () => {
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [blocks, setBlocks] = useState([{ id: 1, confirmed: true, transactions: [], hash: '0000genesis' }]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [activeBlockId, setActiveBlockId] = useState(1);
  const [userBalance, setUserBalance] = useState(10);
  const [totalSupply, setTotalSupply] = useState(10);
  const [transactionType, setTransactionType] = useState('mint');
  const [transactionAmount, setTransactionAmount] = useState(5);
  const [miningInProgress, setMiningInProgress] = useState(false);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [challenges, setChallenges] = useState(CHALLENGES);
  const [achievements, setAchievements] = useState([]);
  const { isConnected, address } = useWallet();
  const safeNavigate = useSafeNavigate();

  // Set up game state
  useEffect(() => {
    // Initialize game state here
    const savedProgress = localStorage.getItem('blockchain_explorer_progress');
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setBlocks(progress.blocks || blocks);
        setUserBalance(progress.userBalance || userBalance);
        setTotalSupply(progress.totalSupply || totalSupply);
        setXp(progress.xp || xp);
        setLevel(progress.level || level);
        setChallenges(progress.challenges || challenges);
        setAchievements(progress.achievements || achievements);
        // Skip tutorial if user has already started
        if (progress.tutorialCompleted) {
          setShowTutorial(false);
        }
      } catch (e) {
        console.error("Error loading saved progress:", e);
      }
    }
  }, []);

  // Save progress to localStorage when state changes
  useEffect(() => {
    const progress = {
      blocks,
      userBalance,
      totalSupply,
      xp,
      level,
      challenges,
      achievements,
      tutorialCompleted: !showTutorial
    };
    localStorage.setItem('blockchain_explorer_progress', JSON.stringify(progress));
  }, [blocks, userBalance, totalSupply, xp, level, challenges, achievements, showTutorial]);

  // Check for completed challenges
  useEffect(() => {
    const updatedChallenges = [...challenges];
    let xpGained = 0;

    // Check 'create_transaction' challenge
    if (!updatedChallenges[0].completed && pendingTransactions.length > 0) {
      updatedChallenges[0].completed = true;
      xpGained += updatedChallenges[0].xp;
      showAchievement(updatedChallenges[0].title);
    }

    // Check 'mine_block' challenge
    if (!updatedChallenges[1].completed && blocks.length > 1) {
      updatedChallenges[1].completed = true;
      xpGained += updatedChallenges[1].xp;
      showAchievement(updatedChallenges[1].title);
    }

    // Check 'chain_5_blocks' challenge
    if (!updatedChallenges[2].completed && blocks.length >= 5) {
      updatedChallenges[2].completed = true;
      xpGained += updatedChallenges[2].xp;
      showAchievement(updatedChallenges[2].title);
    }

    // Check 'all_transaction_types' challenge
    const transactionTypes = new Set();
    blocks.forEach(block => {
      block.transactions.forEach(tx => {
        transactionTypes.add(tx.type);
      });
    });
    pendingTransactions.forEach(tx => {
      transactionTypes.add(tx.type);
    });
    
    if (!updatedChallenges[3].completed && 
        transactionTypes.has('mint') && 
        transactionTypes.has('transfer') && 
        transactionTypes.has('burn')) {
      updatedChallenges[3].completed = true;
      xpGained += updatedChallenges[3].xp;
      showAchievement(updatedChallenges[3].title);
    }

    // Check 'reach_100_tokens' challenge
    if (!updatedChallenges[4].completed && userBalance >= 100) {
      updatedChallenges[4].completed = true;
      xpGained += updatedChallenges[4].xp;
      showAchievement(updatedChallenges[4].title);
    }

    if (xpGained > 0) {
      setXp(prev => prev + xpGained);
      setChallenges(updatedChallenges);
      toast({
        title: "XP Gained!",
        description: `+${xpGained} XP from completed challenges`,
      });
    }
  }, [blocks, pendingTransactions, userBalance]);

  // Calculate level based on XP
  useEffect(() => {
    const newLevel = Math.floor(xp / 50) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
      toast({
        title: "Level Up!",
        description: `You've reached level ${newLevel}`,
        variant: "default"
      });
    }
  }, [xp, level]);

  // Generate a simple hash for a block
  const generateHash = (blockId, prevHash, transactions) => {
    const blockData = blockId + prevHash + JSON.stringify(transactions);
    let hash = 0;
    for (let i = 0; i < blockData.length; i++) {
      const char = blockData.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  };

  // Create a new transaction
  const createTransaction = () => {
    if (transactionAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Transaction amount must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    const amount = parseInt(transactionAmount);

    // Validate transaction based on type
    if (transactionType === 'transfer' && amount > userBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough tokens for this transfer",
        variant: "destructive"
      });
      return;
    }

    if (transactionType === 'burn' && amount > userBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough tokens to burn",
        variant: "destructive"
      });
      return;
    }

    // Create the transaction
    const newTransaction = {
      id: Math.random().toString(36).substring(2, 9),
      type: transactionType,
      amount: amount,
      from: transactionType === 'mint' ? 'System' : 'YourWallet',
      to: transactionType === 'burn' ? 'Burned' : 'YourWallet',
      timestamp: Date.now()
    };

    setPendingTransactions([...pendingTransactions, newTransaction]);
    
    toast({
      title: "Transaction Created",
      description: `${transactionType} transaction for ${amount} tokens added to pending transactions`,
    });
  };

  // Mine a new block
  const mineBlock = async () => {
    if (pendingTransactions.length === 0) {
      toast({
        title: "No transactions to mine",
        description: "Create some transactions first",
        variant: "destructive"
      });
      return;
    }

    setMiningInProgress(true);

    // Simulate mining work
    await new Promise(resolve => setTimeout(resolve, 2000));

    const lastBlock = blocks[blocks.length - 1];
    const newBlockId = lastBlock.id + 1;
    
    // Process transactions
    pendingTransactions.forEach(tx => {
      if (tx.type === 'mint') {
        setUserBalance(prev => prev + tx.amount);
        setTotalSupply(prev => prev + tx.amount);
      } else if (tx.type === 'burn') {
        setUserBalance(prev => prev - tx.amount);
        setTotalSupply(prev => prev - tx.amount);
      }
      // Transfer doesn't change balance in this simplified model
    });

    // Create new block
    const newHash = generateHash(newBlockId, lastBlock.hash, pendingTransactions);
    const newBlock = {
      id: newBlockId,
      confirmed: true,
      transactions: [...pendingTransactions],
      prevHash: lastBlock.hash,
      hash: newHash,
      timestamp: Date.now()
    };

    setBlocks([...blocks, newBlock]);
    setPendingTransactions([]);
    setActiveBlockId(newBlockId);
    setMiningInProgress(false);

    toast({
      title: "Block Mined",
      description: `Block #${newBlockId} has been added to the blockchain`,
    });
  };

  // Show achievement notification
  const showAchievement = (title) => {
    const newAchievement = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      timestamp: Date.now()
    };
    
    setAchievements(prev => [...prev, newAchievement]);
    
    toast({
      title: "Achievement Unlocked!",
      description: title,
      variant: "default"
    });
  };

  // Handle next tutorial step
  const nextTutorialStep = () => {
    if (tutorialStep === TUTORIAL_STEPS.length - 1) {
      setShowTutorial(false);
    } else {
      setTutorialStep(tutorialStep + 1);
    }
  };

  // Reset game progress
  const resetProgress = () => {
    if (window.confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
      localStorage.removeItem('blockchain_explorer_progress');
      setBlocks([{ id: 1, confirmed: true, transactions: [], hash: '0000genesis' }]);
      setPendingTransactions([]);
      setUserBalance(10);
      setTotalSupply(10);
      setXp(0);
      setLevel(1);
      setChallenges(CHALLENGES);
      setAchievements([]);
      setActiveBlockId(1);
      setShowTutorial(true);
      setTutorialStep(0);
      
      toast({
        title: "Progress Reset",
        description: "All game progress has been reset",
      });
    }
  };

  // Find block by ID
  const getBlockById = (id) => {
    return blocks.find(block => block.id === id);
  };

  // Get active block
  const activeBlock = getBlockById(activeBlockId);

  // Calculate XP progress to next level
  const xpToNextLevel = 50; // Fixed XP per level for simplicity
  const xpProgress = (xp % xpToNextLevel) / xpToNextLevel * 100;

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blockchain Explorer Mini-Game</h1>
          <p className="text-slate-500 mt-2">
            Learn how blockchain and tokens work through interactive exploration
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setShowTutorial(true)}
            className="flex items-center"
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Tutorial
          </Button>
          
          <Button 
            variant="default" 
            onClick={() => safeNavigate("/")}
            className="flex items-center"
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Exit Game
          </Button>
        </div>
      </div>
      
      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{TUTORIAL_STEPS[tutorialStep].title}</CardTitle>
              <CardDescription>
                Step {tutorialStep + 1} of {TUTORIAL_STEPS.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>{TUTORIAL_STEPS[tutorialStep].content}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setShowTutorial(false)}
              >
                Skip Tutorial
              </Button>
              <Button 
                onClick={nextTutorialStep}
              >
                {TUTORIAL_STEPS[tutorialStep].action}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Blockchain Visualization */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CubeIcon className="h-5 w-5 mr-2" />
                Blockchain Visualization
              </CardTitle>
              <CardDescription>
                Blocks connected in an immutable chain
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[400px]">
              {/* Blocks Visualization */}
              <div className="relative">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {blocks.map((block, index) => (
                    <React.Fragment key={block.id}>
                      <BlockNode 
                        id={block.id} 
                        active={activeBlockId === block.id}
                        confirmed={block.confirmed}
                        data={block.transactions && block.transactions.length > 0 ? block.transactions[0] : null}
                        onClick={() => setActiveBlockId(block.id)} 
                      />
                      {/* Connector lines between blocks */}
                      {index < blocks.length - 1 && (
                        <NodeConnection 
                          x1="100%" 
                          y1="50%" 
                          x2="0%" 
                          y2="50%" 
                          active={true} 
                        />
                      )}
                    </React.Fragment>
                  ))}
                  
                  {/* Pending block if there are transactions */}
                  {pendingTransactions.length > 0 && (
                    <>
                      <BlockNode 
                        id={blocks[blocks.length - 1].id + 1} 
                        pending={true}
                        data={pendingTransactions.length > 0 ? pendingTransactions[0] : null}
                        onClick={() => {}} 
                      />
                      <NodeConnection 
                        x1="100%" 
                        y1="50%" 
                        x2="0%" 
                        y2="50%" 
                        pending={true} 
                      />
                    </>
                  )}
                </div>
              </div>
              
              {/* Transaction Controls */}
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-medium">Create Transaction</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="transaction-type">Transaction Type</Label>
                    <select 
                      id="transaction-type"
                      className="w-full rounded-md border border-slate-300 p-2 mt-1"
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value)}
                    >
                      <option value="mint">Mint (Create)</option>
                      <option value="transfer">Transfer</option>
                      <option value="burn">Burn (Destroy)</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="transaction-amount">Amount</Label>
                    <Input 
                      id="transaction-amount"
                      type="number" 
                      min="1"
                      value={transactionAmount}
                      onChange={(e) => setTransactionAmount(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={createTransaction}
                      className="w-full"
                    >
                      New Transaction
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div>
                    <span className="text-sm text-slate-500">Pending Transactions: </span>
                    <Badge variant="outline" className="ml-2">
                      {pendingTransactions.length}
                    </Badge>
                  </div>
                  
                  <Button
                    onClick={mineBlock}
                    disabled={pendingTransactions.length === 0 || miningInProgress}
                    className="bg-gradient-to-r from-amber-500 to-orange-500"
                  >
                    {miningInProgress ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Mining...
                      </>
                    ) : (
                      <>Mine Block</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Block Details */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Block #{activeBlockId} Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeBlock && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Hash</h3>
                      <p className="font-mono text-sm truncate">{activeBlock.hash || 'Genesis Block'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Previous Hash</h3>
                      <p className="font-mono text-sm truncate">{activeBlock.prevHash || 'None'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Transactions</h3>
                      <p>{activeBlock.transactions?.length || 0}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Status</h3>
                      <Badge variant={activeBlock.confirmed ? "success" : "outline"}>
                        {activeBlock.confirmed ? 'Confirmed' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                  
                  {activeBlock.transactions && activeBlock.transactions.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-2">Transaction List</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {activeBlock.transactions.map(tx => (
                          <div key={tx.id} className="bg-slate-50 p-2 rounded border border-slate-200">
                            <div className="flex justify-between">
                              <span className="font-medium text-sm capitalize">{tx.type}</span>
                              <span className="text-sm">{tx.amount} tokens</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              From: {tx.from} • To: {tx.to}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-slate-500">
                      {activeBlockId === 1 ? 
                        "Genesis block has no transactions" : 
                        "No transactions in this block"}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: Wallet & Progress */}
        <div>
          {/* Wallet Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="h-5 w-5 mr-2" />
                Your Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-slate-500">Address</Label>
                  <div className="font-mono text-sm truncate bg-slate-50 p-2 rounded border border-slate-200 mt-1">
                    {isConnected ? address : '0x1234...5678'}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-slate-500">Your Balance</Label>
                  <div className="flex items-center mt-1">
                    <Coins className="h-5 w-5 text-amber-500 mr-2" />
                    <span className="text-2xl font-bold">{userBalance}</span>
                    <span className="ml-2 text-slate-500">tokens</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-slate-500">Total Supply</Label>
                  <div className="flex items-center mt-1">
                    <Sparkles className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-lg font-medium">{totalSupply}</span>
                    <span className="ml-2 text-slate-500">tokens</span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex justify-between items-center">
                    <Label className="text-sm text-slate-500">Level {level}</Label>
                    <span className="text-xs text-slate-500">{xp % xpToNextLevel}/{xpToNextLevel} XP</span>
                  </div>
                  <Progress value={xpProgress} className="h-2 mt-1" />
                </div>
                
                <div className="flex items-center">
                  <Trophy className="h-5 w-5 text-amber-500 mr-2" />
                  <span className="font-medium">Total XP: {xp}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Progress & Challenges */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Challenges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {challenges.map(challenge => (
                  <div 
                    key={challenge.id} 
                    className={`p-3 rounded-lg border ${
                      challenge.completed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{challenge.title}</span>
                      <Badge variant={challenge.completed ? "success" : "outline"}>
                        {challenge.completed ? 'Completed' : `${challenge.xp} XP`}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{challenge.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Achievements & Reset */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Book className="h-5 w-5 mr-2" />
                Learning Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => window.open('https://www.tashain.io/whitepaper', '_blank')}>
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  TAS Chain Whitepaper
                </Button>
                
                <Button variant="outline" className="w-full justify-start" onClick={() => window.open('https://ethereum.org/en/developers/docs/intro-to-ethereum/', '_blank')}>
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Intro to Blockchain
                </Button>
                
                <Button variant="outline" className="w-full justify-start" onClick={() => window.open('https://ethereum.org/en/developers/docs/standards/tokens/erc-20/', '_blank')}>
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Token Standards Guide
                </Button>
              </div>
              
              <div className="mt-6">
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={resetProgress}
                >
                  Reset All Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExplorerGame;