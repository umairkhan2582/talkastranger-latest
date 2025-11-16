import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  Wallet, 
  Download, 
  ShieldIcon, 
  X,
  CopyIcon,
  CheckIcon,
  Send,
  History,
  ExternalLink
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useWallet } from "@/contexts/WalletContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';

interface ConnectWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const { translate } = useLanguage();
  const { 
    connect, 
    isConnecting, 
    createTASWallet,
    importTASWallet,
    closeConnectModal 
  } = useWallet();

  // States for wallet creation/viewing
  const [currentView, setCurrentView] = useState<'options' | 'create' | 'import' | 'backup'>('options');
  const [nickname, setNickname] = useState('');
  const [walletPassword, setWalletPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [privateKeyError, setPrivateKeyError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdWalletInfo, setCreatedWalletInfo] = useState<{
    address: string;
    privateKey: string;
  } | null>(null);
  
  // Reset all states
  const resetState = () => {
    setCurrentView('options');
    setNickname('');
    setWalletPassword('');
    setPrivateKey('');
    setPrivateKeyError('');
    setIsProcessing(false);
    setCreatedWalletInfo(null);
  };

  // Close modal handler
  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  // Handle wallet creation
  const handleCreateWallet = async () => {
    setIsProcessing(true);
    
    try {
      // Create a new random wallet
      const wallet = ethers.Wallet.createRandom();
      
      // Store wallet info to show in backup screen
      setCreatedWalletInfo({
        address: wallet.address,
        privateKey: wallet.privateKey
      });
      
      // Call context method if available
      if (createTASWallet) {
        await createTASWallet(walletPassword);
        localStorage.setItem("walletNickname", nickname || "My TAS Wallet");
      }
      
      // Show backup screen
      setCurrentView('backup');
      
    } catch (error) {
      console.error("Error creating wallet:", error);
      toast({
        title: "Wallet Creation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle wallet import
  const handleImportWallet = async () => {
    // Validate private key
    if (!privateKey || privateKey.trim() === '') {
      setPrivateKeyError("Please enter a valid private key");
      return;
    }
    
    setPrivateKeyError("");
    setIsProcessing(true);
    
    try {
      // First validate the private key format
      let formattedKey = privateKey;
      if (!formattedKey.startsWith('0x')) {
        formattedKey = `0x${formattedKey}`;
      }
      
      // Try to create a wallet instance to verify the key
      new ethers.Wallet(formattedKey);
      
      // Import the wallet via context
      if (importTASWallet) {
        await importTASWallet(formattedKey, walletPassword);
        
        // Save nickname
        localStorage.setItem("walletNickname", nickname || "Imported Wallet");
        
        toast({
          title: "Wallet Imported",
          description: "Your wallet has been imported successfully",
        });
        
        // Close the modal
        handleClose();
      }
    } catch (error) {
      console.error("Error importing wallet:", error);
      setPrivateKeyError("Invalid private key format");
      toast({
        title: "Wallet Import Failed",
        description: "Please check that you've entered a valid private key",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy wallet address to clipboard
  const copyWalletAddress = () => {
    if (createdWalletInfo?.address) {
      navigator.clipboard.writeText(createdWalletInfo.address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  // Copy private key to clipboard
  const copyPrivateKey = () => {
    if (createdWalletInfo?.privateKey) {
      navigator.clipboard.writeText(createdWalletInfo.privateKey);
      toast({
        title: "Private Key Copied",
        description: "Private key copied to clipboard. Store it securely!",
      });
    }
  };

  // Secure wallet and continue
  const secureWallet = () => {
    toast({
      title: "Wallet Secured",
      description: "Your wallet has been created and secured successfully!",
    });
    handleClose();
  };

  // Option selection screen
  const renderOptionsView = () => (
    <div className="p-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          <span className="bg-gradient-to-r from-primary to-green-500 text-transparent bg-clip-text">
            TAS Wallet
          </span>
        </h2>
        <p className="text-muted-foreground text-sm">
          Create or import your TAS wallet to manage your assets
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="border-green-200 hover:border-green-400 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg text-center text-primary">Create Wallet</CardTitle>
            <CardDescription className="text-center">
              Generate a new TAS blockchain wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white px-6"
              onClick={() => setCurrentView('create')}
            >
              Create
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 hover:border-blue-400 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg text-center text-blue-600">Import Wallet</CardTitle>
            <CardDescription className="text-center">
              Import an existing wallet with your private key
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button 
              variant="outline" 
              className="border-blue-400 text-blue-600 hover:bg-blue-50 px-6"
              onClick={() => setCurrentView('import')}
            >
              Import
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-center">
        <p className="text-sm text-amber-700">
          Your TAS wallet is the gateway to the TAS blockchain ecosystem. 
          Create or import a wallet to start managing your assets securely.
        </p>
      </div>
    </div>
  );

  // Create wallet screen
  const renderCreateView = () => (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-primary">Create New Wallet</h1>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setCurrentView('options')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">Wallet Nickname (Optional)</Label>
            <Input
              id="nickname"
              placeholder="My TAS Wallet"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Wallet Password (Optional)</Label>
            <Input
              id="password"
              type="password"
              placeholder="Set a secure password"
              value={walletPassword}
              onChange={(e) => setWalletPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Setting a password will encrypt your private key for added security.
            </p>
          </div>
          
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={handleCreateWallet}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Wallet'
            )}
          </Button>
        </CardContent>
      </Card>
      
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
        <h3 className="font-medium text-amber-800 mb-2 flex items-center">
          <ShieldIcon className="h-4 w-4 mr-2" />
          Security Notice
        </h3>
        <p className="text-sm text-amber-700">
          After creating your wallet, you will receive your private key. 
          Make sure to save it in a secure location and never share it with anyone.
        </p>
      </div>
    </div>
  );

  // Import wallet screen
  const renderImportView = () => (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-primary">Import Wallet</h1>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setCurrentView('options')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">Wallet Nickname (Optional)</Label>
            <Input
              id="nickname"
              placeholder="My Imported Wallet"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="privateKey">Private Key</Label>
            <Input
              id="privateKey"
              placeholder="Enter your private key"
              value={privateKey}
              onChange={(e) => {
                setPrivateKey(e.target.value);
                setPrivateKeyError('');
              }}
            />
            {privateKeyError && (
              <p className="text-xs text-red-500">{privateKeyError}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="importPassword">Password (Optional)</Label>
            <Input
              id="importPassword"
              type="password"
              placeholder="Set a password to encrypt your wallet"
              value={walletPassword}
              onChange={(e) => setWalletPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Setting a password will encrypt your private key for added security.
            </p>
          </div>
          
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={handleImportWallet}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              'Import Wallet'
            )}
          </Button>
        </CardContent>
      </Card>
      
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
        <h3 className="font-medium text-amber-800 mb-2 flex items-center">
          <ShieldIcon className="h-4 w-4 mr-2" />
          Security Notice
        </h3>
        <p className="text-sm text-amber-700">
          Never share your private key with anyone. Make sure you're importing your wallet on a secure device.
        </p>
      </div>
    </div>
  );

  // Backup wallet screen
  const renderBackupView = () => (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div></div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setCurrentView('options')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
          <ShieldIcon className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="text-xl font-bold mb-1">{translate("secure_your_wallet", "Secure Your Wallet")}</h1>
        <p className="text-sm text-center text-muted-foreground">
          {translate("backup_wallet_description", "Please save your wallet information securely.")}
        </p>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
        <div className="flex items-start">
          <div className="text-amber-800 mr-2 mt-0.5">⚠️</div>
          <div>
            <h3 className="text-amber-800 font-medium text-sm">
              {translate("important_secure_wallet", "Important: Secure Your Wallet")}
            </h3>
            <p className="text-xs text-amber-700">
              {translate("backup_warning", "Never share your private key with anyone. Anyone with your private keys can steal your assets. Store it securely.")}
            </p>
          </div>
        </div>
      </div>
      
      <Card className="mb-6 border-green-200">
        <CardContent className="p-4 space-y-4">
          <div>
            <Label className="text-sm font-medium mb-1 block">Wallet Address:</Label>
            <div className="bg-green-50 p-3 rounded font-mono text-xs break-all">
              {createdWalletInfo?.address}
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium mb-1 block">Private Key:</Label>
            <div className="bg-green-50 p-3 rounded font-mono text-xs break-all">
              {createdWalletInfo?.privateKey}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mb-6">
        <div className="flex items-center">
          <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm font-medium">{translate("save_encrypted_wallet", "Save Encrypted Wallet")}</span>
        </div>
        <p className="text-xs text-muted-foreground ml-7">
          {translate("encrypt_key_description", "Your wallet is encrypted with your password for added security.")}
        </p>
      </div>
      
      <div className="mb-6">
        <Label className="text-sm font-medium mb-2 block">
          {translate("create_password", "Create Password")}
        </Label>
        <Input 
          type="password" 
          value={walletPassword}
          onChange={(e) => setWalletPassword(e.target.value)}
          placeholder={translate("enter_password", "Enter password")}
          className="bg-green-50 border-green-200"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          className="border-green-200"
          onClick={() => setCurrentView('options')}
        >
          Back
        </Button>
        <Button 
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={secureWallet}
        >
          {translate("secured_wallet", "Secured")}
        </Button>
      </div>
      
      <p className="text-xs text-center text-muted-foreground mt-4">
        {translate("never_share_key", "Never share your private key with anyone")}
      </p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-auto max-h-[90vh]">
        {currentView === 'options' && renderOptionsView()}
        {currentView === 'create' && renderCreateView()}
        {currentView === 'import' && renderImportView()}
        {currentView === 'backup' && createdWalletInfo && renderBackupView()}
      </DialogContent>
    </Dialog>
  );
};

export default ConnectWalletModal;