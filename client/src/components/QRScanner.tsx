import React, { useRef, useState, useEffect } from 'react';
import QrReader from 'qrcode-reader';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CameraOff, Scan, Smartphone } from 'lucide-react';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onScan }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Start the camera when dialog opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      // Stop the camera when the dialog closes
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setScanning(false);
      setError(null);
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      setScanning(true);
      
      const constraints = {
        video: {
          facingMode: 'environment', // Use the back camera if available
          width: { ideal: 720 },
          height: { ideal: 720 }
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        
        // Start scanning for QR codes
        scanQRCode();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please ensure camera permissions are enabled.");
      setScanning(false);
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const scanInterval = setInterval(() => {
      if (!isOpen) {
        clearInterval(scanInterval);
        return;
      }
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        const qr = new QrReader();
        
        qr.callback = (err: Error | null, result: any) => {
          if (err) {
            // Just continue scanning, don't show an error for each failed frame
            return;
          }
          
          if (result && result.result) {
            clearInterval(scanInterval);
            
            // Check if the result is a valid private key (64 hex characters)
            const privateKey = result.result;
            if (/^[0-9a-fA-F]{64}$/.test(privateKey) || privateKey.startsWith('0x')) {
              onScan(privateKey);
              onClose();
            } else {
              setError("Invalid wallet key detected. Please scan a valid TAS wallet QR code.");
            }
          }
        };
        
        qr.decode(imageData);
      }
    }, 500);
    
    return () => {
      clearInterval(scanInterval);
    };
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanning(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-blue-500 to-primary p-4 text-white">
          <DialogTitle className="text-white">Scan Wallet QR Code</DialogTitle>
          <DialogDescription className="text-white/80">
            Position your wallet QR code within the scanner frame
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6">
          {scanning ? (
            <div className="relative">
              <div className="border-4 border-primary rounded-lg overflow-hidden w-72 h-72 mx-auto">
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Animated scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-primary/70 w-48 h-48 flex items-center justify-center rounded-lg">
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="h-1/2 w-full absolute top-0 border-b-4 border-primary animate-[scan_3s_ease-in-out_infinite]"></div>
                  </div>
                  <Scan className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </div>
              
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4">
              {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center w-full mb-4">
                  <CameraOff className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-sm text-red-500 font-medium mb-2">Camera Error</p>
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center w-full mb-4">
                  <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm text-blue-700 font-medium mb-2">Camera Access Needed</p>
                  <p className="text-xs text-blue-500 mb-2">
                    To scan your wallet QR code, please allow camera access when prompted.
                  </p>
                </div>
              )}
              
              <Button 
                onClick={startCamera}
                className="bg-gradient-to-r from-blue-500 to-primary text-white w-full"
                size="lg"
                disabled={scanning}
              >
                {scanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accessing Camera...
                  </>
                ) : (
                  "Start Camera"
                )}
              </Button>
            </div>
          )}
          
          {scanning && (
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded p-3 text-center">
              <p className="text-xs text-blue-700">
                <span className="font-medium">Tip:</span> Make sure your QR code is well-lit and clearly visible
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="bg-gray-50 border-t p-4">
          <div className="flex w-full justify-between items-center">
            <Button
              variant="outline"
              onClick={handleClose}
              size="sm"
            >
              Cancel
            </Button>
            
            {scanning && (
              <div className="flex items-center">
                <Loader2 className="h-3 w-3 animate-spin mr-2 text-primary" />
                <p className="text-xs text-primary">
                  Scanning...
                </p>
              </div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QRScanner;