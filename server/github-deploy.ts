import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
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

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    
    // Skip these directories and files
    const skipList = ['node_modules', 'dist', '.git', '.cache', '.config', '.upm', 'tmp', '.replit', 'replit.nix'];
    if (skipList.some(skip => fullPath.includes(skip))) {
      return;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function createOrUpdateRepo(octokit: Octokit, owner: string, repoName: string) {
  try {
    // Try to get existing repo
    await octokit.repos.get({ owner, repo: repoName });
    console.log(`Repository ${repoName} already exists`);
    return `https://github.com/${owner}/${repoName}`;
  } catch (error: any) {
    if (error.status === 404) {
      // Create new repo
      const { data } = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: 'TalkAStranger - Free Random Video Chat Platform',
        private: false,
        auto_init: true
      });
      console.log(`✓ Created repository: ${data.html_url}`);
      return data.html_url;
    }
    throw error;
  }
}

async function pushFiles(octokit: Octokit, owner: string, repoName: string) {
  console.log('Collecting files to push...');
  
  const rootDir = path.resolve(__dirname, '..');
  const allFiles = getAllFiles(rootDir);
  
  console.log(`Found ${allFiles.length} files to push`);
  
  // Get the current commit SHA
  let treeSha: string;
  try {
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo: repoName,
      ref: 'heads/main'
    });
    const { data: commit } = await octokit.git.getCommit({
      owner,
      repo: repoName,
      commit_sha: ref.object.sha
    });
    treeSha = commit.tree.sha;
  } catch {
    treeSha = '';
  }
  
  // Create blobs for all files
  const tree = [];
  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(rootDir, filePath);
    
    const { data: blob } = await octokit.git.createBlob({
      owner,
      repo: repoName,
      content,
      encoding: 'utf-8'
    });
    
    tree.push({
      path: relativePath.replace(/\\/g, '/'),
      mode: '100644' as const,
      type: 'blob' as const,
      sha: blob.sha
    });
  }
  
  // Create tree
  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo: repoName,
    tree,
    base_tree: treeSha || undefined
  });
  
  // Create commit
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo: repoName,
    message: `Deploy TalkAStranger - ${new Date().toISOString()}`,
    tree: newTree.sha,
    parents: treeSha ? [treeSha] : []
  });
  
  // Update reference
  await octokit.git.updateRef({
    owner,
    repo: repoName,
    ref: 'heads/main',
    sha: newCommit.sha
  });
  
  console.log('✓ Code pushed to GitHub successfully');
}

export async function deployToGitHub() {
  try {
    console.log('=== GitHub Deployment Started ===\n');
    
    const octokit = await getGitHubClient();
    const { data: user } = await octokit.users.getAuthenticated();
    
    console.log(`Authenticated as: ${user.login}`);
    
    const repoName = 'talkastranger';
    const repoUrl = await createOrUpdateRepo(octokit, user.login, repoName);
    await pushFiles(octokit, user.login, repoName);
    
    console.log('\n=== Deployment Complete ===');
    console.log(`Repository: https://github.com/${user.login}/${repoName}`);
    console.log(`Clone URL: https://github.com/${user.login}/${repoName}.git`);
    
    return {
      owner: user.login,
      repo: repoName,
      url: `https://github.com/${user.login}/${repoName}.git`
    };
  } catch (error: any) {
    console.error('GitHub deployment failed:', error.message);
    throw error;
  }
}
