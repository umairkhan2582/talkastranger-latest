// @ts-nocheck
import QRCode from 'qrcode';

// Interface for wallet data for backup
export interface WalletBackupData {
  address: string;
  privateKey: string;
  password?: string;
  timestamp: number;
  deviceInfo?: string;
}

// Utility to encrypt the wallet data for secure storage
export const encryptWalletData = (data: WalletBackupData, password: string): string => {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }
  
  try {
    // Basic encryption for demo purposes
    // In a real app, use a stronger encryption like AES
    const jsonData = JSON.stringify(data);
    const encodedData = btoa(jsonData); // Base64 encode
    
    // Append a simple checksum to verify data integrity
    const checksum = calculateChecksum(encodedData);
    return `${encodedData}.${checksum}`;
  } catch (error) {
    console.error('Error encrypting wallet data:', error);
    throw new Error('Failed to encrypt wallet data');
  }
};

// Decrypt wallet data
export const decryptWalletData = (encryptedData: string, password: string): WalletBackupData => {
  try {
    // Split the encrypted data and checksum
    const [encodedData, checksum] = encryptedData.split('.');
    
    // Verify checksum
    if (calculateChecksum(encodedData) !== checksum) {
      throw new Error('Data integrity check failed');
    }
    
    // Decode the data
    const jsonData = atob(encodedData); // Base64 decode
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error decrypting wallet data:', error);
    throw new Error('Failed to decrypt wallet data');
  }
};

// Generate a QR code containing wallet data
export const generateWalletQRCode = async (data: WalletBackupData, password: string): Promise<string> => {
  try {
    const encryptedData = encryptWalletData(data, password);
    
    // Generate QR code as a data URL
    const qrCode = await QRCode.toDataURL(encryptedData, {
      errorCorrectionLevel: 'H', // High error correction for better reliability
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    
    return qrCode;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Create a blob for file download with wallet data
export const createWalletBackupFile = (data: WalletBackupData, password: string): string => {
  try {
    const encryptedData = encryptWalletData(data, password);
    const blob = new Blob([encryptedData], { type: 'text/plain' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error creating backup file:', error);
    throw new Error('Failed to create backup file');
  }
};

// Helper function to calculate a simple checksum
const calculateChecksum = (data: string): string => {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data.charCodeAt(i);
  }
  return sum.toString(16); // Convert to hex
};

// Detect the user's device type
export const detectDeviceType = (): 'ios' | 'android' | 'desktop' | 'unknown' => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }
  
  if (/android/.test(userAgent)) {
    return 'android';
  }
  
  if (/windows|mac|linux/.test(userAgent) && !/mobile/.test(userAgent)) {
    return 'desktop';
  }
  
  return 'unknown';
};

// Save to iCloud (iOS-specific functionality)
export const saveToICloud = async (data: WalletBackupData, password: string): Promise<boolean> => {
  try {
    // This is a placeholder for iCloud integration
    // Real iCloud integration requires native iOS capabilities
    // typically through a WebView bridge or Capacitor/Cordova plugin
    
    // For now, we'll generate a download instead
    const fileName = `TAS_Wallet_Backup_${Date.now()}.taswallet`;
    const fileUrl = createWalletBackupFile(data, password);
    
    // Trigger a download for the user
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // In a real app, we would handle the actual iCloud upload here
    console.log('iCloud backup would be saved here in a native app');
    return true;
  } catch (error) {
    console.error('Error saving to iCloud:', error);
    throw new Error('Failed to save to iCloud');
  }
};

// Save to Google Drive (Android-specific functionality)
export const saveToGoogleDrive = async (data: WalletBackupData, password: string): Promise<boolean> => {
  try {
    // This is a placeholder for Google Drive integration
    // Real Google Drive integration requires OAuth and Google Drive API
    
    // For now, we'll generate a download instead
    const fileName = `TAS_Wallet_Backup_${Date.now()}.taswallet`;
    const fileUrl = createWalletBackupFile(data, password);
    
    // Trigger a download for the user
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // In a real app, we would handle the actual Google Drive upload here
    console.log('Google Drive backup would be saved here in a native app');
    return true;
  } catch (error) {
    console.error('Error saving to Google Drive:', error);
    throw new Error('Failed to save to Google Drive');
  }
};

// Get device info for backup record
export const getDeviceInfo = (): string => {
  return `${navigator.platform} - ${navigator.userAgent}`;
};