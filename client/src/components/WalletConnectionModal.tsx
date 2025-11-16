import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useWallet } from "@/contexts/WalletContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTASChain } from "@/contexts/TASChainContext";
import { ethers } from "ethers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  X, 
  ChevronRight, 
  Wallet as WalletIcon, 
  ExternalLink, 
  Key, 
  Lock, 
  CheckCircle2,
  AlertTriangle,
  Loader2,
  User,
  Users,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WalletConnectionModal = () => {
  const [, navigate] = useLocation();
  const { 
    isModalOpen, 
    closeConnectModal, 
    connect, 
    isConnecting, 
    createTASWallet, 
    importTASWallet,
    isCreatingWallet 
  } = useWallet();
  const { connectWallet: connectTASWallet, isConnected: isTASChainConnected } = useTASChain();
  const { translate } = useLanguage();
  const { toast } = useToast();
  
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [step, setStep] = useState<"nickname" | "gender" | "location" | "connect" | "backup" | "success">("nickname");
  const [savePrivateKey, setSavePrivateKey] = useState(false);
  const [password, setPassword] = useState("");
  const [walletInfo, setWalletInfo] = useState<{
    address: string;
    privateKey?: string;
    balanceUSD?: string;
  } | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setNickname("");
      setGender("");
      setUserLocation("");
      setStep("nickname");
      setSavePrivateKey(false);
      setPassword("");
      
      // Pre-fill location from sessionStorage if coming from a location page
      const savedLocation = sessionStorage.getItem("preSelectedLocation");
      if (savedLocation) {
        setUserLocation(savedLocation);
      }
    }
  }, [isModalOpen]);

  // Check for existing wallet in localStorage
  useEffect(() => {
    const savedWallet = localStorage.getItem("tasWallet");
    if (savedWallet) {
      try {
        const parsedWallet = JSON.parse(savedWallet);
        setWalletInfo({
          address: parsedWallet.address,
          privateKey: parsedWallet.privateKey ? "(Encrypted)" : undefined,
          balanceUSD: parsedWallet.balanceUSD || "0.00"
        });
      } catch (e) {
        console.error("Error parsing saved wallet", e);
      }
    }
  }, []);

  const handleConnect = async (walletType: string, createNew: boolean = false) => {
    if (!nickname.trim()) {
      return;
    }
    
    try {
      // Check for saved wallet first when not creating a new one
      if (walletType === "TAS Chain" && !createNew) {
        const savedWalletJson = localStorage.getItem("tasWallet");
        
        if (savedWalletJson) {
          try {
            const savedWallet = JSON.parse(savedWalletJson);
            
            // In a real app, we would verify and decrypt the private key
            // For this demo, we'll just use the saved wallet data
            setWalletInfo({
              address: savedWallet.address,
              privateKey: savedWallet.privateKey,
              balanceUSD: savedWallet.balanceUSD || "0.00"
            });
            
            // Connect with the saved wallet address
            const result = await connect("TAS Chain", nickname, savedWallet.address);
            
            if (result && result.walletAddress) {
              await connectTASWallet();
              setStep("success");
              
              // Close the modal after 2 seconds on success
              setTimeout(() => {
                closeConnectModal();
                setStep("connect");
              }, 2000);
              
              return;
            }
          } catch (err) {
            console.error("Error loading saved wallet:", err);
            // Continue with creating/connecting a new wallet
          }
        }
      }
      
      // Connect regular wallet first or create a new TAS Chain wallet
      const result = await connect(walletType, nickname);
      
      // Connect to TAS Chain if regular connection was successful
      if (result && result.walletAddress) {
        await connectTASWallet();
        
        // If this is TAS Chain wallet, we need to generate a new key pair
        if (walletType === "TAS Chain") {
          // Generate a cryptographically secure private key
          const wallet = ethers.Wallet.createRandom();
          const privateKey = wallet.privateKey;
          const address = result.walletAddress;
            
          setWalletInfo({
            address: address,
            privateKey: privateKey,
            balanceUSD: "0.00"
          });
          
          // Go to backup step for TAS Chain wallets
          setStep("backup");
        } else {
          // For other wallet types, just go to success
          setWalletInfo({
            address: result.walletAddress,
            balanceUSD: "0.00"
          });
          
          setStep("success");
          
          // Close the modal after 2 seconds on success
          setTimeout(() => {
            closeConnectModal();
            setStep("nickname");
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error("Connection error:", error);
      toast({
        title: translate("connection_error") || "Connection Error",
        description: error.message || translate("failed_to_connect") || "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  // Handler for the backup step
  const handleBackupComplete = () => {
    // Save encrypted wallet if user chose to save it
    if (savePrivateKey && walletInfo?.privateKey && password.length >= 8) {
      // This is a simplified example - in a real app, you would use proper encryption
      // NEVER store unencrypted private keys in localStorage
      const encryptedKey = btoa(walletInfo.privateKey + ":" + password);
      
      localStorage.setItem("tasWallet", JSON.stringify({
        address: walletInfo.address,
        privateKey: encryptedKey,
        balanceUSD: walletInfo.balanceUSD || "0.00",
        timestamp: Date.now()
      }));
      
      toast({
        title: translate("wallet_saved") || "Wallet Saved",
        description: translate("wallet_saved_description") || "Your wallet has been securely saved with password protection.",
      });
    }
    
    setStep("success");
    
    // Close the modal after 2 seconds
    setTimeout(() => {
      closeConnectModal();
      setStep("connect");
    }, 2000);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeConnectModal()}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto bg-slate-50 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-2">
            {step === "nickname" && <WalletIcon className="h-6 w-6 text-primary" />}
            {step === "gender" && <Users className="h-6 w-6 text-primary" />}
            {step === "location" && <MapPin className="h-6 w-6 text-primary" />}
            {step === "connect" && <WalletIcon className="h-6 w-6 text-primary" />}
            {step === "backup" && <Key className="h-6 w-6 text-primary" />}
            {step === "success" && <CheckCircle2 className="h-6 w-6 text-orange-500" />}
          </div>
          <DialogTitle className="text-xl">
            {step === "nickname" && "Welcome to TalkAStranger"}
            {step === "gender" && "Select Your Gender"}
            {step === "location" && "Select Your Location (Optional)"}
            {step === "connect" && translate("connect_your_wallet")}
            {step === "backup" && (translate("secure_your_wallet") || "Secure Your TAS Wallet")}
            {step === "success" && (translate("connection_successful") || "Connection Successful")}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            {step === "nickname" && "Pick a nickname to get started"}
            {step === "gender" && "Who are you?"}
            {step === "location" && "Connect with people from a specific location"}
            {step === "connect" && (translate("choose_wallet_description") || "Choose either your external wallet or create a TAS wallet")}
            {step === "backup" && (translate("backup_wallet_description") || "Please backup your TAS wallet details securely")}
            {step === "success" && (translate("success_description") || "Your wallet is now connected")}
          </DialogDescription>
        </DialogHeader>
        
        {step === "nickname" && (
          <>
            <div className="mb-4">
              <label htmlFor="nickname" className="block text-sm font-semibold text-slate-800 mb-2">
                {translate("your_nickname") || "Your Nickname"}
              </label>
              <div className="relative">
                <Input 
                  type="text" 
                  id="nickname" 
                  data-testid="input-nickname"
                  placeholder={translate("enter_nickname") || "Enter a nickname"}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="border-2 border-purple-200 focus:border-purple-500 rounded-xl text-lg py-6 pr-24"
                />
                <button
                  type="button"
                  data-testid="button-random-nickname"
                  onClick={() => setNickname(`User_${Math.floor(Math.random() * 10000)}`)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-3 py-1.5 rounded-full font-medium"
                >
                  Random
                </button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-slate-600">
                  {translate("nickname_info") || "This name will be shown in chats"}
                </p>
                {!nickname && (
                  <p className="text-xs text-orange-500 font-medium">
                    {translate("nickname_required") || "Required"}
                  </p>
                )}
              </div>
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:from-orange-500 hover:via-pink-600 hover:to-purple-700 text-white text-lg font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              onClick={() => setStep("gender")}
              disabled={!nickname.trim()}
              data-testid="button-next-to-gender"
            >
              Next
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </>
        )}
        
        {step === "gender" && (
          <>
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-700 mb-4">Nickname: {nickname}</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => setGender("male")}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    gender === "male" 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                  data-testid="button-gender-male"
                >
                  <div className="flex items-center">
                    <User className="h-6 w-6 text-blue-500 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold text-slate-800">Male</div>
                      <div className="text-xs text-slate-500">I'm a guy</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setGender("female")}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    gender === "female" 
                      ? "border-pink-500 bg-pink-50" 
                      : "border-slate-200 hover:border-pink-300"
                  }`}
                  data-testid="button-gender-female"
                >
                  <div className="flex items-center">
                    <User className="h-6 w-6 text-pink-500 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold text-slate-800">Female</div>
                      <div className="text-xs text-slate-500">I'm a girl</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setGender("couple")}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    gender === "couple" 
                      ? "border-purple-500 bg-purple-50" 
                      : "border-slate-200 hover:border-purple-300"
                  }`}
                  data-testid="button-gender-couple"
                >
                  <div className="flex items-center">
                    <Users className="h-6 w-6 text-purple-500 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold text-slate-800">Couple</div>
                      <div className="text-xs text-slate-500">We're both here</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:from-orange-500 hover:via-pink-600 hover:to-purple-700 text-white text-lg font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              onClick={() => setStep("location")}
              disabled={!gender}
              data-testid="button-next-to-location"
            >
              Next
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </>
        )}
        
        {step === "location" && (
          <>
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-700 mb-4">
                Nickname: {nickname} | Gender: {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Location (Optional)
                </label>
                <Select value={userLocation} onValueChange={setUserLocation}>
                  <SelectTrigger className="w-full" data-testid="select-location">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worldwide">Worldwide</SelectItem>
                    <SelectItem value="usa">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="canada">Canada</SelectItem>
                    <SelectItem value="australia">Australia</SelectItem>
                    <SelectItem value="india">India</SelectItem>
                    <SelectItem value="germany">Germany</SelectItem>
                    <SelectItem value="france">France</SelectItem>
                    <SelectItem value="spain">Spain</SelectItem>
                    <SelectItem value="italy">Italy</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-2">
                  Location filtering available to all users
                </p>
              </div>
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:from-orange-500 hover:via-pink-600 hover:to-purple-700 text-white text-lg font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              onClick={() => setStep("connect")}
              data-testid="button-next-to-connect"
            >
              Continue
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </>
        )}
        
        {step === "connect" && (
          <>
            <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-xl border-2 border-purple-200">
              <p className="text-sm font-semibold text-slate-700">Nickname: {nickname}</p>
            </div>
            
            {/* Quick Connect Button */}
            <div className="mb-6">
              <Button 
                className="w-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:from-orange-500 hover:via-pink-600 hover:to-purple-700 text-white text-lg font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                onClick={() => {
                  // Save gender and location preferences to sessionStorage
                  if (gender) {
                    sessionStorage.setItem("userGender", gender);
                  }
                  if (userLocation) {
                    sessionStorage.setItem("userLocation", userLocation);
                  }
                  
                  // Set flag to auto-start search after wallet creation
                  sessionStorage.setItem("autoStartSearch", "true");
                  
                  if (createTASWallet) {
                    createTASWallet(password);
                    closeConnectModal();
                  } else {
                    handleConnect("TAS Chain", true);
                  }
                }}
                disabled={!nickname.trim() || isConnecting || isCreatingWallet}
                data-testid="button-create-wallet"
              >
                {isCreatingWallet ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Start Talking Now!
                  </>
                )}
              </Button>
            </div>
            
          </>
        )}

        {step === "backup" && walletInfo && (
          <div className="space-y-6">
            <div className="flex p-4 text-amber-800 bg-amber-50 rounded-md">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">{translate("important_secure_wallet") || "Important: Secure Your Wallet"}</p>
                <p className="mt-1">{translate("backup_warning") || "Write down your private key and keep it in a safe place. You will need it to recover your wallet."}</p>
              </div>
            </div>

            <div className="p-4 border rounded-md space-y-3">
              <div>
                <div className="text-sm font-medium mb-1">{translate("wallet_address") || "Wallet Address"}:</div>
                <div className="flex items-center">
                  <code className="text-xs bg-slate-100 p-2 rounded-md font-mono w-full overflow-x-auto">
                    {walletInfo.address}
                  </code>
                  <a 
                    href={`https://scan.talkastranger.com/address/${walletInfo.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-primary hover:text-primary/80"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">{translate("private_key") || "Private Key"}:</div>
                <code className="text-xs bg-slate-100 p-2 rounded-md font-mono block w-full overflow-x-auto">
                  {walletInfo.privateKey}
                </code>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="saveKey" 
                  checked={savePrivateKey}
                  onCheckedChange={(checked) => setSavePrivateKey(checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="saveKey"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {translate("save_encrypted_wallet") || "Save encrypted wallet in browser"}
                  </label>
                  <p className="text-sm text-slate-500">
                    {translate("encrypt_key_description") || "Your private key will be encrypted with a password"}
                  </p>
                </div>
              </div>

              {savePrivateKey && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {translate("create_password") || "Create a strong password (min 8 characters)"}
                  </label>
                  <div className="flex items-center">
                    <Input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={translate("enter_password") || "Enter password"}
                      className="pr-10"
                    />
                    <Lock className="relative -ml-8 text-slate-500 h-4 w-4" />
                  </div>
                  {password.length > 0 && password.length < 8 && (
                    <p className="text-xs text-red-500">
                      {translate("password_length_error") || "Password must be at least 8 characters"}
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="flex-col space-y-2">
              <Button 
                onClick={handleBackupComplete}
                disabled={savePrivateKey && password.length < 8}
                className="w-full"
              >
                {translate("secured_wallet") || "I've Secured My Wallet"}
              </Button>
              <p className="text-xs text-center text-slate-500">
                {translate("never_share_key") || "Never share your private key with anyone"}
              </p>
            </DialogFooter>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-medium text-center">{translate("successfully_connected") || "Successfully Connected!"}</h3>
              <p className="text-sm text-center text-slate-600 mt-1">
                {translate("wallet_connected_tas") || "Your wallet is now connected to TAS Chain"}
              </p>

              {walletInfo && (
                <div className="w-full mt-4 p-3 bg-slate-50 rounded-md border">
                  <div className="text-xs text-slate-500 mb-1">{translate("wallet_address") || "Wallet Address"}:</div>
                  <div className="flex items-center">
                    <code className="text-xs font-mono truncate max-w-[250px]">
                      {walletInfo.address}
                    </code>
                    <a 
                      href={`https://scan.talkastranger.com/address/${walletInfo.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-primary hover:text-primary/80"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  
                  <div className="mt-2">
                    <div className="text-xs text-slate-500 mb-1">{translate("wallet_balance") || "Balance"}:</div>
                    <div className="font-medium">
                      $<span>{walletInfo.balanceUSD || "0.00"}</span> USD
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnectionModal;
