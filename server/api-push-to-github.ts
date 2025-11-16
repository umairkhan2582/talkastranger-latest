import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

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

async function uploadFile(octokit: Octokit, owner: string, repo: string, filePath: string, content: string, message: string) {
  try {
    // Try to get existing file to get its SHA
    let sha: string | undefined;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
      });
      if ('sha' in data) {
        sha = data.sha;
      }
    } catch (error: any) {
      // File doesn't exist, that's ok
      if (error.status !== 404) {
        throw error;
      }
    }

    // Create or update file
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
    });

    console.log(`✅ Uploaded: ${filePath}`);
  } catch (error: any) {
    console.error(`❌ Failed to upload ${filePath}:`, error.message);
    throw error;
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
    
    const owner = user.login;
    const repo = 'talkastranger';

    console.log('\n📂 Reading and uploading files...\n');

    // List of files to upload with their paths
    const filesToUpload = [
      'client/src/pages/TradeNTalk.tsx',
      'client/src/pages/LocationPage.tsx',
      'client/src/components/Header.tsx',
      'client/src/index.css',
      'replit.md',
    ];

    let uploadedCount = 0;
    for (const filePath of filesToUpload) {
      const fullPath = path.join('/home/runner/workspace', filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        await uploadFile(
          octokit,
          owner,
          repo,
          filePath,
          content,
          `Update ${filePath}: UI improvements - removed header images, fixed scrolling, fixed drawer icons`
        );
        uploadedCount++;
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`⚠️  File not found: ${filePath}`);
      }
    }

    console.log(`\n✅ SUCCESS! Uploaded ${uploadedCount} files to GitHub!`);
    console.log(`🔗 Repository: https://github.com/${owner}/${repo}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

main();
