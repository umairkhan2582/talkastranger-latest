import express, { Request, Response, Router } from 'express';
import { storage } from './storage';

const router = Router();

// Admin credentials (in a real app, these would be stored securely)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Nawaumair@123';

// Admin login endpoint
router.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  // Check if credentials match
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Create or get admin session
    if (req.session) {
      req.session.isAdmin = true;
      req.session.adminUsername = username;
    }
    
    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      username: username
    });
  }
  
  return res.status(401).json({
    success: false,
    error: 'Invalid admin credentials'
  });
});

// Middleware to check admin status
const isAdmin = (req: Request, res: Response, next: express.NextFunction) => {
  // Method 1: Check session for admin status
  if (req.session && req.session.isAdmin) {
    return next();
  }
  
  // Method 2: Check authenticated user with admin username
  if (req.isAuthenticated && req.isAuthenticated() && req.user && 
      (req.user.username === ADMIN_USERNAME || req.user.nickname === ADMIN_USERNAME)) {
    return next();
  }
  
  // Method 3: Check basic auth header for direct API access
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [authUsername, authPassword] = credentials.split(':');
    
    if (authUsername === ADMIN_USERNAME && authPassword === ADMIN_PASSWORD) {
      return next();
    }
  }
  
  return res.status(403).json({
    success: false,
    error: 'Unauthorized: Admin access required'
  });
};

// Check if user is an admin
router.get('/api/admin/check-status', (req: Request, res: Response) => {
  // Check session for admin status (from direct login)
  if (req.session && req.session.isAdmin) {
    return res.json({
      isAdmin: true,
      username: req.session.adminUsername || 'admin'
    });
  }
  
  // Check authenticated user with admin username (from regular auth)
  const isAdminUser = req.isAuthenticated && req.isAuthenticated() && 
    req.user && 
    (req.user.username === 'admin' || req.user.nickname === 'admin');
  
  if (isAdminUser) {
    return res.json({
      isAdmin: true,
      username: req.user.username || req.user.nickname
    });
  }
  
  // Check basic auth header for API access
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [authUsername, authPassword] = credentials.split(':');
    
    if (authUsername === ADMIN_USERNAME && authPassword === ADMIN_PASSWORD) {
      return res.json({
        isAdmin: true,
        username: authUsername
      });
    }
  }
  
  // No admin access
  res.json({
    isAdmin: false
  });
});

// Get admin stats
router.get('/api/admin/stats', isAdmin, async (req: Request, res: Response) => {
  try {
    // Get user data from storage
    const users = await storage.getAllUsers();
    
    // Count wallets, profiles, etc.
    const totalWallets = users.filter(u => u.walletAddress || u.tasWalletAddress).length;
    const totalProfiles = users.length;
    const verifiedProfiles = users.filter(u => u.emailVerified).length;
    const unverifiedProfiles = totalProfiles - verifiedProfiles;
    
    // Get tokens created by users
    const tokens = await storage.getAllTokens();
    const totalTokensCreated = tokens.length;
    
    // Calculate total trades (mock data for now)
    const totalTrades = 120;
    
    res.json({
      totalWallets,
      totalProfiles,
      verifiedProfiles,
      unverifiedProfiles,
      totalTokensCreated,
      totalTrades
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve admin statistics'
    });
  }
});

// Get verified profiles
router.get('/api/admin/verified-profiles', isAdmin, async (req: Request, res: Response) => {
  try {
    // Get all users and filter verified ones
    const users = await storage.getAllUsers();
    const verifiedProfiles = users
      .filter(user => user.emailVerified)
      .map(user => ({
        id: user.id,
        username: user.username,
        walletAddress: user.tasWalletAddress || user.walletAddress || 'No wallet',
        emailVerified: !!user.emailVerified,
        publicProfile: !!user.isPublicProfile,
        joinedDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown',
        points: user.points || 0,
        publicProfileUrl: user.isPublicProfile ? `https://talkastranger.com/profile/${user.username}` : undefined
      }));
    
    res.json(verifiedProfiles);
  } catch (error) {
    console.error('Error getting verified profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve verified profiles'
    });
  }
});

export default router;