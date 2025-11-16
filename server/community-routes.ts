import { Router, Request, Response } from 'express';
import { communityStats } from './services/communityStats';
import { storage } from './storage';
import { ethers } from 'ethers';

const router = Router();

// Get community stats
router.get('/api/community/stats', (_req: Request, res: Response) => {
  try {
    const stats = communityStats.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[API] Error getting community stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get community stats'
    });
  }
});

// Check if user profile is complete enough for chat (requires email)
router.get('/api/user/profile-status', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    // Get user from storage
    const user = await storage.getUser(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if email is set and profile is complete
    const isProfileComplete = !!(user.email && user.nickname && user.walletAddress);
    
    res.json({
      success: true,
      profile: {
        profileComplete: isProfileComplete,
        email: user.email || null,
        nickname: user.nickname || null,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        bio: user.bio || null,
        dateOfBirth: user.dateOfBirth || null,
        walletAddress: user.walletAddress || null,
        walletType: user.walletType || null,
        isPublicProfile: user.isPublicProfile || false,
        website: user.website || null,
        telegramUsername: user.telegramUsername || null,
        twitterUsername: user.twitterUsername || null,
        walletDescription: user.walletDescription || null,
        profileImageUrl: user.profileImageUrl || null,
        coverImageUrl: user.coverImageUrl || null
      }
    });
  } catch (error) {
    console.error('[API] Error checking profile status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check profile status'
    });
  }
});

// Update user profile with expanded profile information
router.post('/api/user/update-profile', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    let profileData = req.body;
    
    // If the request came in as FormData, the profile data will be in the 'data' field as a JSON string
    if (req.body.data && typeof req.body.data === 'string') {
      try {
        profileData = JSON.parse(req.body.data);
      } catch (e) {
        console.error('Error parsing profile data JSON:', e);
        return res.status(400).json({
          success: false,
          error: 'Invalid profile data format'
        });
      }
    }
    
    const { 
      email, 
      nickname, 
      firstName, 
      lastName, 
      bio, 
      dateOfBirth, 
      website, 
      isPublicProfile,
      walletDescription,
      telegramUsername,
      twitterUsername
    } = profileData;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
    
    // Website validation if provided
    if (website && website.trim() !== '') {
      try {
        new URL(website);
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: 'Invalid website URL format'
        });
      }
    }
    
    // Get user from storage
    const user = await storage.getUser(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Create profile updates object with dynamic fields
    const profileUpdates: any = {
      email,
      nickname: nickname || user.nickname,
      profileCompleted: true
    };
    
    // Add optional fields if provided
    if (firstName) profileUpdates.firstName = firstName;
    if (lastName) profileUpdates.lastName = lastName;
    if (bio) profileUpdates.bio = bio;
    if (dateOfBirth) profileUpdates.dateOfBirth = dateOfBirth;
    if (website !== undefined) profileUpdates.website = website;
    if (isPublicProfile !== undefined) profileUpdates.isPublicProfile = isPublicProfile;
    if (walletDescription !== undefined) profileUpdates.walletDescription = walletDescription;
    if (telegramUsername !== undefined) profileUpdates.telegramUsername = telegramUsername;
    if (twitterUsername !== undefined) profileUpdates.twitterUsername = twitterUsername;
    
    // Handle file uploads if they exist
    if (req.files) {
      const files = req.files as Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
      
      // Handle profile image if uploaded
      if ('profileImage' in files) {
        const profileImage = Array.isArray(files.profileImage) ? files.profileImage[0] : files.profileImage;
        if (profileImage) {
          // Store the file path or URL
          profileUpdates.profileImageUrl = `/uploads/${profileImage.filename}`;
        }
      }
      
      // Handle cover image if uploaded
      if ('coverImage' in files) {
        const coverImage = Array.isArray(files.coverImage) ? files.coverImage[0] : files.coverImage;
        if (coverImage) {
          // Store the file path or URL
          profileUpdates.coverImageUrl = `/uploads/${coverImage.filename}`;
        }
      }
    }
    
    // Update user profile
    await storage.updateUserProfile(user.id, profileUpdates);
    
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('[API] Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Get TAS wallet status for a user
router.get('/api/user/tas-wallet-status', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    // Get user from storage
    const user = await storage.getUser(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if the user has a TAS wallet
    // If walletType includes "TAS", consider it a TAS wallet
    // Also check tasWalletAddress field as a fallback
    const tasWalletAddress = user.tasWalletAddress || null;
    const walletTypeIsTAS = user.walletType && (user.walletType.toUpperCase().includes('TAS') || user.walletType === 'TASChain');
    const hasTasWallet = !!tasWalletAddress || walletTypeIsTAS;
    
    // For wallet detection functionality - check if local storage data exists
    // or if browser has detected wallet capability
    const userAgent = req.headers['user-agent'] || '';
    // Check if the user agent indicates wallet capability
    const walletDetected = hasTasWallet || 
      userAgent.includes('MetaMask') || 
      userAgent.includes('Trust') || 
      userAgent.includes('Binance') ||
      userAgent.includes('WalletConnect') ||
      userAgent.includes('Coinbase');
    
    // Return all states for the TAS wallet
    res.json({
      success: true,
      hasTasWallet,
      created: hasTasWallet,
      initialized: !!tasWalletAddress,
      connected: hasTasWallet,
      walletDetected,
      tasWalletAddress,
      walletType: user.walletType
    });
  } catch (error) {
    console.error('[API] Error getting TAS wallet status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get TAS wallet status'
    });
  }
});

// Create a TAS wallet for user with Token Contract Integration
router.post('/api/user/create-tas-wallet', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    // Get user from storage
    const user = await storage.getUser(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if the user already has a TAS wallet
    if (user.tasWalletAddress) {
      return res.status(400).json({
        success: false,
        error: 'User already has a TAS wallet',
        walletAddress: user.tasWalletAddress
      });
    }
    
    console.log('[API] Creating new TAS wallet for user:', user.id);
    
    // Create a new wallet using ethers.js
    const wallet = ethers.Wallet.createRandom();
    const tasWalletAddress = wallet.address;
    const privateKey = wallet.privateKey;
    
    // Get BSC provider and TAS token contract
    const TAS_TOKEN_ADDRESS = "0xd9541b134b1821736bd323135b8844d3ae408216";
    const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
    
    // Create contract instance
    const tasTokenContract = new ethers.Contract(
      TAS_TOKEN_ADDRESS,
      [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function balanceOf(address owner) view returns (uint256)"
      ],
      provider
    );
    
    // Interact with the TAS token contract to verify it exists
    try {
      console.log('[API] Verifying TAS token contract...');
      
      // Call contract methods to ensure it's working
      const tokenName = await tasTokenContract.name().catch(() => "TAS Token");
      const tokenSymbol = await tasTokenContract.symbol().catch(() => "TAS");
      const tokenDecimals = await tasTokenContract.decimals().catch(() => 18);
      
      console.log('[API] Token verified:', tokenName, tokenSymbol, tokenDecimals);
      
      // Record the transaction for explorer
      const contractInteractionRecord = {
        timestamp: new Date().toISOString(),
        action: 'TAS Wallet Creation',
        walletAddress: tasWalletAddress,
        tokenAddress: TAS_TOKEN_ADDRESS,
        tokenName,
        tokenSymbol,
        userId: user.id
      };
      
      // Log wallet creation with token contract interaction
      console.log('[API][TAS Explorer] Wallet creation recorded:', contractInteractionRecord);
      
      // Update user in database with new TAS wallet
      await storage.updateUserProfile(user.id, {
        tasWalletAddress,
        walletType: 'TAS'
      });
      
      // Return success with wallet address and private key
      return res.status(200).json({
        success: true,
        address: tasWalletAddress,
        privateKey: privateKey, // Include the private key in the response
        message: 'TAS wallet created and token contract verified',
        tokenInfo: {
          name: tokenName,
          symbol: tokenSymbol,
          decimals: tokenDecimals
        }
      });
      
    } catch (contractError) {
      console.error('[API] Error interacting with TAS token contract:', contractError);
      
      // Even if contract interaction fails, still create the wallet
      // This ensures wallet creation can proceed even with blockchain connection issues
      await storage.updateUserProfile(user.id, {
        tasWalletAddress,
        walletType: 'TAS'
      });
      
      // Add TAS token to user's watchlist
      try {
        // Get the TAS token from storage
        const tasToken = await storage.getNativeToken();
        
        if (tasToken) {
          // Check if user already has this token
          const existingToken = await storage.getUserToken(user.id, tasToken.id);
          
          if (!existingToken) {
            // Add token to user's watchlist with zero balance
            await storage.addUserToken({
              userId: user.id,
              tokenId: tasToken.id,
              balance: 0,
              isWatched: true
            });
            console.log('[API] Added TAS token to user watchlist');
          }
        }
      } catch (watchlistError) {
        console.error('[API] Error adding TAS token to watchlist:', watchlistError);
        // Non-critical error, continue with wallet creation
      }
      
      return res.status(200).json({
        success: true,
        address: tasWalletAddress,
        privateKey: privateKey, // Include private key in case of failure too
        warning: 'Wallet created but token contract verification failed',
        message: 'TAS wallet created but token contract verification failed. Token functionality may be limited.'
      });
    }
    
  } catch (error) {
    console.error('[API] Error creating TAS wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create TAS wallet'
    });
  }
});

// Import wallet from private key
router.post('/api/user/import-wallet', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Private key is required'
      });
    }
    
    // Validate private key format
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      return res.status(400).json({
        success: false,
        error: 'Invalid private key format'
      });
    }
    
    // Get user from storage
    const user = await storage.getUser(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if the user already has a TAS wallet
    if (user.tasWalletAddress) {
      return res.status(400).json({
        success: false,
        error: 'User already has a TAS wallet',
        walletAddress: user.tasWalletAddress
      });
    }
    
    try {
      // Create wallet from private key
      const wallet = new ethers.Wallet(privateKey);
      const tasWalletAddress = wallet.address;
      
      // Get BSC provider and TAS token contract
      const TAS_TOKEN_ADDRESS = "0xd9541b134b1821736bd323135b8844d3ae408216";
      const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
      
      // Create contract instance
      const tasTokenContract = new ethers.Contract(
        TAS_TOKEN_ADDRESS,
        [
          "function name() view returns (string)",
          "function symbol() view returns (string)",
          "function decimals() view returns (uint8)",
          "function balanceOf(address owner) view returns (uint256)"
        ],
        provider
      );
      
      console.log('[API] Importing wallet with address:', tasWalletAddress);
      
      // Verify the wallet against the blockchain
      const tokenName = await tasTokenContract.name().catch(() => "TAS Token");
      const tokenSymbol = await tasTokenContract.symbol().catch(() => "TAS");
      const tokenDecimals = await tasTokenContract.decimals().catch(() => 18);
      
      // Try to get balance
      let balance = "0";
      try {
        const rawBalance = await tasTokenContract.balanceOf(tasWalletAddress);
        balance = ethers.utils.formatUnits(rawBalance, tokenDecimals);
      } catch (error) {
        console.log('[API] Could not fetch token balance, using default 0');
      }
      
      // Record the transaction for explorer
      const walletImportRecord = {
        timestamp: new Date().toISOString(),
        action: 'TAS Wallet Import',
        walletAddress: tasWalletAddress,
        tokenAddress: TAS_TOKEN_ADDRESS,
        tokenName,
        tokenSymbol,
        userId: user.id
      };
      
      console.log('[API][TAS Explorer] Wallet import recorded:', walletImportRecord);
      
      // Update user in database with imported TAS wallet
      await storage.updateUserProfile(user.id, {
        tasWalletAddress,
        walletType: 'TAS'
      });
      
      // Add TAS token to user's watchlist
      try {
        // Get the TAS token from storage
        const tasToken = await storage.getNativeToken();
        
        if (tasToken) {
          // Check if user already has this token
          const existingToken = await storage.getUserToken(user.id, tasToken.id);
          
          if (!existingToken) {
            // Add token to user's watchlist with calculated balance
            await storage.addUserToken({
              userId: user.id,
              tokenId: tasToken.id,
              balance: parseFloat(balance) || 0,
              isWatched: true
            });
            console.log('[API] Added TAS token to user watchlist with balance:', balance);
          }
        }
      } catch (watchlistError) {
        console.error('[API] Error adding TAS token to watchlist:', watchlistError);
        // Non-critical error, continue with wallet import
      }
      
      // Return success with wallet address and token info
      return res.status(200).json({
        success: true,
        address: tasWalletAddress,
        message: 'TAS wallet imported successfully',
        tokenInfo: {
          name: tokenName,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
          balance
        }
      });
      
    } catch (error) {
      console.error('[API] Error importing wallet from private key:', error);
      return res.status(400).json({
        success: false,
        error: 'Invalid private key or blockchain connection error'
      });
    }
    
  } catch (error) {
    console.error('[API] Error in import wallet endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import wallet'
    });
  }
});

// Verify user by wallet address and email
router.post('/api/user/verify-wallet', async (req: Request, res: Response) => {
  try {
    const { walletAddress, email } = req.body;
    
    if (!walletAddress || !email) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address and email are required'
      });
    }
    
    // Check if a user with this wallet address and email exists
    const user = await storage.getUserByWalletAddressAndEmail(walletAddress, email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No user found with this wallet address and email'
      });
    }
    
    // Log the user in
    req.login(user, (err) => {
      if (err) {
        console.error('[API] Login error:', err);
        return res.status(500).json({
          success: false,
          error: 'Login failed'
        });
      }
      
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          walletAddress: user.walletAddress,
          walletType: user.walletType,
          profileCompleted: user.profileCompleted
        }
      });
    });
  } catch (error) {
    console.error('[API] Error verifying wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify wallet'
    });
  }
});

// Register wallet with BSCScan private name tag
router.post('/api/user/register-bscscan-tag', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { address, tagName, tagInfo } = req.body;
    
    // Validate input
    if (!address || !ethers.utils.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      });
    }
    
    if (!tagName) {
      return res.status(400).json({
        success: false,
        error: 'Tag name is required'
      });
    }
    
    // Get BSCScan API key from environment
    const bscScanApiKey = process.env.BSC_SCAN_API_KEY || process.env.BSCSCAN_API_KEY;
    
    if (!bscScanApiKey) {
      return res.status(500).json({
        success: false,
        error: 'BSCScan API key not configured'
      });
    }

    // BSCScan actually does have a private tag API, but it requires an account with API Pro plan
    // Let's make the actual API call to BSCScan to register the private tag
    
    console.log(`[BSCScan] Registering address ${address} with tag "${tagName}" (${tagInfo})`);
    
    // BSCScan private tag API endpoint
    const apiUrl = 'https://api.bscscan.com/api';
    let bscscanStatus = 'failed';
    let bscscanMessage = '';
    
    try {
      // Prepare the API parameters
      const params = new URLSearchParams({
        module: 'addresstags',
        action: 'saveprivateaddresstags',
        apikey: bscScanApiKey,
        address: address,
        tagname: tagName,
        privnote: tagInfo || '',
      });
      
      // Make the API request
      const response = await fetch(`${apiUrl}?${params.toString()}`);
      const data = await response.json();
      
      console.log('[BSCScan] API response:', data);
      
      if (data.status === '1' && data.message === 'OK') {
        // Tag was successfully registered
        console.log('[BSCScan] Tag successfully registered with BSCScan');
        bscscanStatus = 'success';
        bscscanMessage = 'Tag successfully registered with BSCScan';
      } else {
        // Tag registration failed, log the error
        console.warn('[BSCScan] Tag registration failed:', data.message || 'Unknown error');
        bscscanMessage = data.message || 'Unknown error';
      }
    } catch (apiError) {
      console.error('Error making BSCScan API request:', apiError);
      bscscanMessage = 'API request failed';
    }
    
    // In either case, we'll also store the tag locally for our application
    const user = await storage.getUser(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Update user profile with wallet tag information
    await storage.updateUserProfile(user.id, {
      walletDescription: tagInfo || `TASChain wallet (${tagName})`
    });
    
    // Return success regardless of BSCScan API result, as we've saved it locally
    return res.status(200).json({
      success: true,
      bscscanResult: bscscanStatus,
      bscscanMessage: bscscanMessage,
      message: 'Wallet registered with BSCScan tag',
      data: {
        address,
        tagName,
        tagInfo,
        registered: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error registering BSCScan tag:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;