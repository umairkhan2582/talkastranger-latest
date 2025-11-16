import { Router } from 'express';
import { deployToGitHub } from './github-deploy';
import fs from 'fs';
import path from 'path';

export const deployRouter = Router();

deployRouter.post('/api/deploy/github', async (req, res) => {
  try {
    console.log('Starting GitHub deployment...');
    const result = await deployToGitHub();
    
    // Update deploy.sh with the correct GitHub repo URL
    const deployScriptPath = path.resolve(__dirname, '../deploy.sh');
    let deployScript = fs.readFileSync(deployScriptPath, 'utf-8');
    deployScript = deployScript.replace('GITHUB_REPO="WILL_BE_REPLACED"', `GITHUB_REPO="${result.url}"`);
    fs.writeFileSync(deployScriptPath, deployScript);
    
    console.log('Updated deploy.sh with repository URL');
    
    res.json({
      success: true,
      message: 'Code pushed to GitHub successfully',
      repository: `https://github.com/${result.owner}/${result.repo}`,
      cloneUrl: result.url,
      nextSteps: {
        step1: `SSH to your droplet: ssh root@209.97.153.135`,
        step2: `Run deployment: curl -fsSL https://raw.githubusercontent.com/${result.owner}/${result.repo}/main/deploy.sh | bash`,
        alternative: `Or manually: git clone ${result.url} /var/www/talkastranger && cd /var/www/talkastranger && create .env file && npm install && npm run build && pm2 start npm --name talkastranger -- run start`
      }
    });
  } catch (error: any) {
    console.error('Deployment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

deployRouter.get('/api/deploy/status', (req, res) => {
  res.json({
    dropletIp: '209.97.153.135',
    dropletId: '530452293',
    targetUrl: 'http://209.97.153.135',
    status: 'ready_for_deployment'
  });
});
