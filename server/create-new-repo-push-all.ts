import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

let connectionSettings: any;

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('Token not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
  return accessToken;
}

async function uploadFile(octokit: Octokit, owner: string, repo: string, filePath: string, content: string) {
  try {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `Add ${filePath}`,
      content: Buffer.from(content).toString('base64'),
    });
    return true;
  } catch (error: any) {
    console.error(`❌ Failed: ${filePath} - ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    console.log('🔑 Getting GitHub access token...');
    const token = await getAccessToken();
    const octokit = new Octokit({ auth: token });
    
    console.log('👤 Getting GitHub user info...');
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✅ Connected as: ${user.login}`);
    
    const repoName = 'talkastranger-latest';
    
    console.log(`\n📦 Creating new repository: ${repoName}...`);
    
    let repoUrl;
    try {
      const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: 'Talk A Stranger - 100% FREE Random Video Chat Platform (Latest Version)',
        private: false,
        auto_init: true
      });
      repoUrl = newRepo.html_url;
      console.log(`✅ Created: ${repoUrl}`);
    } catch (error: any) {
      if (error.status === 422) {
        console.log('ℹ️  Repository already exists, using existing one');
        repoUrl = `https://github.com/${user.login}/${repoName}`;
      } else {
        throw error;
      }
    }

    // Wait for repo to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n📂 Uploading ALL project files...\n');

    // Get all files to upload
    const baseDir = '/home/runner/workspace';
    const filesToUpload: string[] = [];
    
    // Important files and directories
    const patterns = [
      'client/src/**/*.{ts,tsx,css,html}',
      'server/**/*.ts',
      'shared/**/*.ts',
      'attached_assets/stock_images/*.jpg',
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'tailwind.config.ts',
      'drizzle.config.ts',
      'replit.md',
      'README.md',
      '.replit',
      'replit.nix'
    ];

    for (const pattern of patterns) {
      const files = await glob(pattern, { cwd: baseDir, nodir: true });
      filesToUpload.push(...files);
    }

    console.log(`📊 Found ${filesToUpload.length} files to upload\n`);

    let uploaded = 0;
    let failed = 0;
    
    for (const filePath of filesToUpload) {
      const fullPath = path.join(baseDir, filePath);
      
      // Skip if file doesn't exist or is too large
      const stats = fs.statSync(fullPath);
      if (stats.size > 1000000) { // Skip files > 1MB
        console.log(`⏭️  Skipping (too large): ${filePath}`);
        continue;
      }

      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const success = await uploadFile(octokit, user.login, repoName, filePath, content);
        
        if (success) {
          uploaded++;
          console.log(`✅ ${uploaded}/${filesToUpload.length}: ${filePath}`);
        } else {
          failed++;
        }
        
        // Rate limit protection
        if (uploaded % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.log(`⏭️  Skipping: ${filePath}`);
        failed++;
      }
    }

    console.log(`\n✅ COMPLETED!`);
    console.log(`📊 Uploaded: ${uploaded} files`);
    console.log(`❌ Failed/Skipped: ${failed} files`);
    console.log(`\n🔗 NEW REPOSITORY: ${repoUrl}`);
    console.log(`\n🎉 All your latest code is now on GitHub!`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

main();
