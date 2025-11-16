import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  ShieldCheck,
  AlertTriangle,
  Check,
  Download,
  QrCode
} from "lucide-react";
import { 
  WalletBackupData, 
  generateWalletQRCode, 
  saveToICloud, 
  saveToGoogleDrive,
  createWalletBackupFile,
  detectDeviceType, 
  getDeviceInfo 
} from "@/lib/backup-utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface WalletBackupDialogProps {
  walletData: {
    address: string;
    privateKey: string;
  };
  password: string;
  onClose: () => void;
  onBackupComplete: () => void;
}

export default function WalletBackupDialog({
  walletData,
  password,
  onClose,
  onBackupComplete,
}: WalletBackupDialogProps) {
  const { translate } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("auto");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [backupComplete, setBackupComplete] = useState<boolean>(false);
  const [deviceType, setDeviceType] = useState<string>("unknown");

  // Prepare wallet data for backup
  const backupData: WalletBackupData = {
    address: walletData.address,
    privateKey: walletData.privateKey,
    password: password,
    timestamp: Date.now(),
    deviceInfo: getDeviceInfo(),
  };

  // Detect device type and set appropriate tab
  useEffect(() => {
    const device = detectDeviceType();
    setDeviceType(device);
    
    // Set default tab based on device
    if (device === 'ios') {
      setActiveTab('icloud');
    } else if (device === 'android') {
      setActiveTab('gdrive');
    } else {
      setActiveTab('qrcode');
    }
  }, []);

  // Generate QR code when QR tab is selected
  useEffect(() => {
    if (activeTab === 'qrcode' && !qrCode) {
      generateQRCode();
    }
  }, [activeTab]);

  const generateQRCode = async () => {
    try {
      setIsLoading(true);
      const qrCodeData = await generateWalletQRCode(backupData, password);
      setQrCode(qrCodeData);
      setIsLoading(false);
    } catch (err) {
      setError(translate("qrcode_generation_error") || "Failed to generate QR Code");
      setIsLoading(false);
    }
  };

  const handleBackupToICloud = async () => {
    try {
      setIsLoading(true);
      await saveToICloud(backupData, password);
      setBackupComplete(true);
      setIsLoading(false);
    } catch (err) {
      setError(translate("icloud_backup_error") || "Failed to backup to iCloud");
      setIsLoading(false);
    }
  };

  const handleBackupToGoogleDrive = async () => {
    try {
      setIsLoading(true);
      await saveToGoogleDrive(backupData, password);
      setBackupComplete(true);
      setIsLoading(false);
    } catch (err) {
      setError(translate("gdrive_backup_error") || "Failed to backup to Google Drive");
      setIsLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      setIsLoading(true);
      const fileName = `TAS_Wallet_Backup_${Date.now()}.taswallet`;
      const fileUrl = createWalletBackupFile(backupData, password);
      
      // Create download link
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setBackupComplete(true);
      setIsLoading(false);
    } catch (err) {
      setError(translate("download_backup_error") || "Failed to download backup file");
      setIsLoading(false);
    }
  };

  const completeBackup = () => {
    onBackupComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full p-6 mx-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {translate("backup_your_wallet") || "Backup Your Wallet"}
          </h2>
          
          {backupComplete && (
            <div className="flex items-center text-green-500">
              <Check className="mr-1 h-5 w-5" />
              <span className="text-sm font-medium">
                {translate("backup_complete") || "Backup Complete"}
              </span>
            </div>
          )}
        </div>
        
        <div className="text-yellow-600 mb-6 bg-yellow-50 p-3 rounded-md flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            {translate("backup_warning") || 
              "It's extremely important to back up your wallet data. If you lose your private key, you will permanently lose access to your wallet and funds."}
          </p>
        </div>

        {error && (
          <div className="text-red-600 mb-6 bg-red-50 p-3 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="auto" className="flex flex-col items-center">
              <ShieldCheck className="h-5 w-5 mb-1" />
              <span>{translate("recommended") || "Recommended"}</span>
            </TabsTrigger>
            
            <TabsTrigger value="icloud" className="flex flex-col items-center" disabled={deviceType !== 'ios'}>
              <ShieldCheck className="h-5 w-5 mb-1" />
              <span>iCloud</span>
            </TabsTrigger>
            
            <TabsTrigger value="gdrive" className="flex flex-col items-center" disabled={deviceType !== 'android'}>
              <ShieldCheck className="h-5 w-5 mb-1" />
              <span>Google Drive</span>
            </TabsTrigger>
            
            <TabsTrigger value="qrcode" className="flex flex-col items-center">
              <QrCode className="h-5 w-5 mb-1" />
              <span>QR Code</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auto" className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                {translate("auto_backup_title") || "Recommended Backup Method"}
              </h3>
              
              {deviceType === 'ios' ? (
                <>
                  <p className="mb-4">
                    {translate("ios_backup_description") || 
                      "We've detected you're using an iOS device. We recommend backing up to iCloud."}
                  </p>
                  <Button 
                    onClick={handleBackupToICloud}
                    disabled={isLoading || backupComplete}
                    className="bg-gradient-to-r from-sky-500 to-blue-600 text-white"
                    size="lg"
                  >
                    {isLoading ? (
                      translate("backing_up") || "Backing up..."
                    ) : (
                      translate("backup_to_icloud") || "Backup to iCloud"
                    )}
                  </Button>
                </>
              ) : deviceType === 'android' ? (
                <>
                  <p className="mb-4">
                    {translate("android_backup_description") || 
                      "We've detected you're using an Android device. We recommend backing up to Google Drive."}
                  </p>
                  <Button 
                    onClick={handleBackupToGoogleDrive}
                    disabled={isLoading || backupComplete}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white"
                    size="lg"
                  >
                    {isLoading ? (
                      translate("backing_up") || "Backing up..."
                    ) : (
                      translate("backup_to_gdrive") || "Backup to Google Drive"
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <p className="mb-4">
                    {translate("desktop_backup_description") || 
                      "We've detected you're using a desktop device. We recommend downloading a backup file."}
                  </p>
                  <Button 
                    onClick={handleDownloadBackup}
                    disabled={isLoading || backupComplete}
                    className="bg-gradient-to-r from-primary to-blue-600 text-white"
                    size="lg"
                  >
                    {isLoading ? (
                      translate("generating_backup") || "Generating backup..."
                    ) : (
                      translate("download_backup") || "Download Backup File"
                    )}
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="icloud" className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                {translate("icloud_backup_title") || "Backup to iCloud"}
              </h3>
              <p className="mb-4">
                {translate("icloud_backup_description") || 
                  "Your wallet data will be encrypted and safely stored in your iCloud account."}
              </p>
              <Button 
                onClick={handleBackupToICloud}
                disabled={isLoading || backupComplete}
                className="bg-gradient-to-r from-sky-500 to-blue-600 text-white"
                size="lg"
              >
                {isLoading ? (
                  translate("backing_up") || "Backing up..."
                ) : (
                  translate("backup_to_icloud") || "Backup to iCloud"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="gdrive" className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                {translate("gdrive_backup_title") || "Backup to Google Drive"}
              </h3>
              <p className="mb-4">
                {translate("gdrive_backup_description") || 
                  "Your wallet data will be encrypted and safely stored in your Google Drive account."}
              </p>
              <Button 
                onClick={handleBackupToGoogleDrive}
                disabled={isLoading || backupComplete}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white"
                size="lg"
              >
                {isLoading ? (
                  translate("backing_up") || "Backing up..."
                ) : (
                  translate("backup_to_gdrive") || "Backup to Google Drive"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="qrcode" className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                {translate("qrcode_backup_title") || "Backup with QR Code"}
              </h3>
              <p className="mb-4">
                {translate("qrcode_backup_description") || 
                  "Your wallet data is encoded in this QR code. Save it somewhere safe by taking a screenshot or printing it."}
              </p>
              
              <div className="flex justify-center mb-4">
                {isLoading ? (
                  <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : qrCode ? (
                  <div className="border p-4 rounded-lg bg-white">
                    <img src={qrCode} alt="Wallet Backup QR Code" className="w-64 h-64" />
                  </div>
                ) : (
                  <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Button onClick={generateQRCode}>
                      {translate("generate_qrcode") || "Generate QR Code"}
                    </Button>
                  </div>
                )}
              </div>
              
              {qrCode && (
                <Button 
                  onClick={() => {
                    setBackupComplete(true);
                  }}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                >
                  {translate("save_qrcode_done") || "I've Saved the QR Code"}
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
          >
            {translate("skip") || "Skip"}
          </Button>
          
          <Button 
            onClick={completeBackup}
            disabled={!backupComplete && activeTab !== 'qrcode'}
            className={backupComplete ? "bg-green-500 text-white" : ""}
          >
            {backupComplete ? (
              translate("finish") || "Finish"
            ) : (
              translate("continue") || "Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

