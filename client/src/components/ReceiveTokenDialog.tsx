import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from "@/contexts/WalletContext";

// Define props
interface ReceiveTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReceiveTokenDialog = ({ isOpen, onClose }: ReceiveTokenDialogProps) => {
  const { toast } = useToast();
  const { address } = useWallet();
  const [isCopied, setIsCopied] = useState(false);
  
  // Handle copy to clipboard
  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address)
        .then(() => {
          setIsCopied(true);
          // No success message toast as per user request
          
          // Reset copied state after 2 seconds
          setTimeout(() => {
            setIsCopied(false);
          }, 2000);
        })
        .catch((error) => {
          toast({
            title: "Copy Failed",
            description: "Failed to copy address to clipboard",
            variant: "destructive",
          });
        });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Receive Tokens</DialogTitle>
          <DialogDescription>
            Share your wallet address to receive tokens.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="flex justify-center">
            {address && (
              <div className="p-2 bg-white rounded-lg border">
                <QRCodeSVG 
                  value={address}
                  size={200}
                  level="H"
                  includeMargin={true}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="wallet-address">Your Wallet Address</Label>
            <div className="flex items-center">
              <Input
                id="wallet-address"
                value={address || ''}
                readOnly
                className="flex-1 font-mono text-sm pr-10 bg-white"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-10 h-8 w-8"
                onClick={handleCopy}
              >
                {isCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Send any BEP-20 token to this address to receive it in your wallet.
            </p>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <h4 className="font-medium text-amber-800 text-sm flex items-center">
              <QrCode className="h-4 w-4 mr-2" />
              Important
            </h4>
            <p className="text-xs text-amber-700 mt-1">
              Only send BEP-20 tokens to this address. Sending other types of tokens may result in permanent loss.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiveTokenDialog;