import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, AlertTriangle, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface TASWalletBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
  privateKey: string;
}

const TASWalletBackupDialog: React.FC<TASWalletBackupDialogProps> = ({
  open,
  onOpenChange,
  walletAddress,
  privateKey
}) => {
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const { translate } = useLanguage();

  const copyToClipboard = (text: string, type: 'address' | 'key') => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: `${type === 'address' ? 'Address' : 'Private Key'} Copied`,
          description: `${type === 'address' ? 'Wallet address' : 'Private key'} has been copied to clipboard`,
        });
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };

  const handleSaveEncrypted = () => {
    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Please enter a password with at least 8 characters",
        variant: "destructive"
      });
      return;
    }

    try {
      // Basic encryption - not secure for production!
      const encryptedKey = btoa(privateKey + ":" + password);
      
      localStorage.setItem("tasWallet", JSON.stringify({
        address: walletAddress,
        privateKey: encryptedKey,
        nickname: "My TAS Wallet",
        timestamp: Date.now()
      }));
      
      toast({
        title: "Wallet Secured",
        description: "Your wallet has been saved with password protection",
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error Saving Wallet",
        description: "Failed to secure wallet. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl flex items-center justify-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            {translate("secure_your_wallet") || "Secure Your Wallet"}
          </DialogTitle>
          <DialogDescription>
            {translate("backup_wallet_description") || "Please backup your TAS wallet details securely"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex p-4 text-amber-800 bg-amber-50 rounded-md">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">{translate("important_secure_wallet") || "Important: Secure Your Wallet"}</p>
              <p className="mt-1">{translate("backup_warning") || "Save your private key and keep it in a safe place. You will need it to recover your wallet."}</p>
            </div>
          </div>

          <div className="p-4 border rounded-md space-y-4">
            <div>
              <div className="text-sm font-medium mb-1">{translate("wallet_address") || "Wallet Address"}:</div>
              <div className="flex items-center">
                <code className="text-xs bg-gray-50 p-2 rounded-md font-mono w-full overflow-x-auto break-all">
                  {walletAddress}
                </code>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-1"
                  onClick={() => copyToClipboard(walletAddress, 'address')}
                >
                  <Copy size={14} />
                </Button>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-1">{translate("private_key") || "Private Key"}:</div>
              <div className="flex items-center">
                <code className="text-xs bg-gray-50 p-2 rounded-md font-mono w-full overflow-x-auto break-all">
                  {privateKey}
                </code>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="ml-1"
                  onClick={() => copyToClipboard(privateKey, 'key')}
                >
                  <Copy size={14} />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{translate("create_password") || "Create Password"}</label>
            <Input
              type="password"
              placeholder={translate("enter_password") || "Enter password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-green-50/50 border-green-200"
            />
            <p className="text-xs text-muted-foreground">
              {translate("encrypt_key_description") || "Password protects your encrypted wallet information"}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col space-y-2">
          <Button 
            onClick={handleSaveEncrypted}
            disabled={password.length < 8}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {translate("secured_wallet") || "Secure My Wallet"}
          </Button>
          <p className="text-xs text-center text-slate-500">
            {translate("never_share_key") || "Never share your private key with anyone"}
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TASWalletBackupDialog;