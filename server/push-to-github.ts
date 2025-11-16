import { getUncachableGitHubClient } from './github';
import * as fs from 'fs';
import * as path from 'path';

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '.env',
  '.env.local',
  '*.log',
  '.DS_Store',
  '.vscode',
  '.idea',
  '*.swp',
  '.cache',
  'coverage',
  '.next',
  'out',
  'build',
  '.replit',
  'replit.nix',
  '.config',
  'tmp',
  'server/push-to-github.ts',
  'server/create-github-repo.ts',
  'server/init-repo.ts',
  'client/src/pages/locations'
];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  try {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
      try {
        const filePath = path.join(dirPath, file);
        const relativePath = path.relative(process.cwd(), filePath);

        if (shouldIgnore(relativePath)) {
          return;
        }

        const stats = fs.lstatSync(filePath);
        
        if (stats.isSymbolicLink()) {
          return;
        }

        if (stats.isDirectory()) {
          arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
        } else if (stats.isFile()) {
          arrayOfFiles.push(relativePath);
        }
      } catch (err) {
        // Skip files that cause errors
        return;
      }
    });
  } catch (err) {
    // Skip directories that cause errors
    return arrayOfFiles;
  }

  return arrayOfFiles;
}

async function pushToGitHub() {
  try {
    const octokit = await getUncachableGitHubClient();
    const owner = 'umairkhan2582';
    const repo = 'talkastranger';

    console.log('[GitHub] Getting all project files...');
    const files = getAllFiles(process.cwd());
    console.log(`[GitHub] Found ${files.length} files to push`);

    console.log('[GitHub] Creating blobs for all files...');
    const blobs = await Promise.all(
      files.map(async (file) => {
        const content = fs.readFileSync(file);
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content: content.toString('base64'),
          encoding: 'base64'
        });
        return { path: file, sha: blob.sha, mode: '100644' as const };
      })
    );

    console.log('[GitHub] Creating tree...');
    const { data: tree } = await octokit.git.createTree({
      owner,
      repo,
      tree: blobs
    });

    console.log('[GitHub] Creating commit...');
    const { data: commit } = await octokit.git.createCommit({
      owner,
      repo,
      message: 'Initial commit: TASChain - Talkastranger.com platform',
      tree: tree.sha,
      parents: []
    });

    console.log('[GitHub] Creating main branch...');
    await octokit.git.createRef({
      owner,
      repo,
      ref: 'refs/heads/main',
      sha: commit.sha
    });

    console.log('\n✅ Successfully pushed all files to GitHub!');
    console.log(`🔗 https://github.com/${owner}/${repo}`);
    console.log(`📁 ${files.length} files uploaded`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function createInitialCommit(octokit: any, owner: string, repo: string) {
  const { data: blob } = await octokit.git.createBlob({
    owner,
    repo,
    content: Buffer.from('# Talkastranger.com').toString('base64'),
    encoding: 'base64'
  });

  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    tree: [{ path: 'README.md', mode: '100644', type: 'blob', sha: blob.sha }]
  });

  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message: 'Initial commit',
    tree: tree.sha,
    parents: []
  });

  await octokit.git.createRef({
    owner,
    repo,
    ref: 'refs/heads/main',
    sha: commit.sha
  });

  return commit.sha;
}

pushToGitHub();
