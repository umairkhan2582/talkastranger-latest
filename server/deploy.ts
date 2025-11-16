import { Express } from 'express';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Safely execute a shell command and return a promise with stdout
const execPromise = (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
};

// Handle deployment requests
export default function registerDeployRoutes(app: Express) {
  // Common environment setup for deployment
  const setupDeploymentEnv = async (privateKey: string, bscScanApiKey: string) => {
    // Temporary .env file for deployment
    const envPath = path.join(process.cwd(), '.env.deploy');
    
    // Create a temporary .env file with deployment credentials
    const envContent = `PRIVATE_KEY=${privateKey}\nBSCSCAN_API_KEY=${bscScanApiKey}\n`;
    
    fs.writeFileSync(envPath, envContent, { encoding: 'utf8' });
    
    return envPath;
  };

  // Clean up after deployment
  const cleanupDeploymentEnv = (envPath: string) => {
    // Remove the temporary .env file
    if (fs.existsSync(envPath)) {
      fs.unlinkSync(envPath);
    }
  };

  // Deploy TAS Token
  app.post('/api/deploy/tas-token', async (req, res) => {
    const { privateKey, bscScanApiKey } = req.body;
    
    if (!privateKey || !bscScanApiKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Private key and BSC Scan API key are required' 
      });
    }

    let envPath = '';
    
    try {
      envPath = await setupDeploymentEnv(privateKey, bscScanApiKey);
      
      // Run deployment command
      const deployCommand = `npx hardhat run --network bsc contracts/scripts/deploy-tas-token.ts`;
      const result = await execPromise(deployCommand);
      
      // Extract contract address from deployment output
      const addressMatch = result.match(/TAS Token deployed to: (0x[a-fA-F0-9]{40})/);
      
      if (!addressMatch || !addressMatch[1]) {
        throw new Error('Failed to extract contract address from deployment output');
      }
      
      const contractAddress = addressMatch[1];
      
      // Return success with the contract address
      res.status(200).json({
        success: true,
        contractAddress,
        message: 'TAS Token contract deployed successfully'
      });
    } catch (error) {
      console.error('TAS Token deployment error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error'
      });
    } finally {
      cleanupDeploymentEnv(envPath);
    }
  });

  // Deploy Token Factory
  app.post('/api/deploy/token-factory', async (req, res) => {
    const { privateKey, bscScanApiKey, tasTokenAddress } = req.body;
    
    if (!privateKey || !bscScanApiKey || !tasTokenAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Private key, BSC Scan API key, and TAS Token address are required' 
      });
    }

    let envPath = '';
    
    try {
      envPath = await setupDeploymentEnv(privateKey, bscScanApiKey);
      
      // Create a temporary env variable for the TAS token address
      process.env.TAS_TOKEN_ADDRESS = tasTokenAddress;
      
      // Run deployment command
      const deployCommand = `npx hardhat run --network bsc contracts/scripts/deploy-token-factory.ts`;
      const result = await execPromise(deployCommand);
      
      // Extract contract address from deployment output
      const addressMatch = result.match(/Token Factory deployed to: (0x[a-fA-F0-9]{40})/);
      
      if (!addressMatch || !addressMatch[1]) {
        throw new Error('Failed to extract contract address from deployment output');
      }
      
      const contractAddress = addressMatch[1];
      
      // Return success with the contract address
      res.status(200).json({
        success: true,
        contractAddress,
        message: 'Token Factory contract deployed successfully'
      });
    } catch (error) {
      console.error('Token Factory deployment error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error'
      });
    } finally {
      cleanupDeploymentEnv(envPath);
      delete process.env.TAS_TOKEN_ADDRESS;
    }
  });

  // Deploy Swap Market
  app.post('/api/deploy/swap-market', async (req, res) => {
    const { privateKey, bscScanApiKey, tasTokenAddress } = req.body;
    
    if (!privateKey || !bscScanApiKey || !tasTokenAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Private key, BSC Scan API key, and TAS Token address are required' 
      });
    }

    let envPath = '';
    
    try {
      envPath = await setupDeploymentEnv(privateKey, bscScanApiKey);
      
      // Create a temporary env variable for the TAS token address
      process.env.TAS_TOKEN_ADDRESS = tasTokenAddress;
      
      // Run deployment command
      const deployCommand = `npx hardhat run --network bsc contracts/scripts/deploy-swap-market.ts`;
      const result = await execPromise(deployCommand);
      
      // Extract contract address from deployment output
      const addressMatch = result.match(/Swap Market deployed to: (0x[a-fA-F0-9]{40})/);
      
      if (!addressMatch || !addressMatch[1]) {
        throw new Error('Failed to extract contract address from deployment output');
      }
      
      const contractAddress = addressMatch[1];
      
      // Return success with the contract address
      res.status(200).json({
        success: true,
        contractAddress,
        message: 'Swap Market contract deployed successfully'
      });
    } catch (error) {
      console.error('Swap Market deployment error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error'
      });
    } finally {
      cleanupDeploymentEnv(envPath);
      delete process.env.TAS_TOKEN_ADDRESS;
    }
  });
}