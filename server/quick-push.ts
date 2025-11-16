import { getUncachableGitHubClient } from './github';
import * as fs from 'fs';
import * as path from 'path';

const ESSENTIAL_FILES = [
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'tailwind.config.ts',
  'drizzle.config.ts',
  'index.html'
];

const ESSENTIAL_DIRS = [
  'client/src',
  'server',
  'shared',
  'contracts',
  'hardhat.config.ts'
];

async function quickPush() {
  const octokit = await getUncachableGitHubClient();
  const owner = 'umairkhan2582';
  const repo = 'talkastranger';

  const files: Array<{ path: string; content: string }> = [];

  ESSENTIAL_FILES.forEach(file => {
    if (fs.existsSync(file)) {
      files.push({ path: file, content: fs.readFileSync(file, 'utf-8') });
    }
  });

  function addFilesFromDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'locations') return;
      
      const stat = fs.lstatSync(fullPath);
      if (stat.isDirectory()) {
        addFilesFromDir(fullPath);
      } else if (stat.isFile() && !item.endsWith('.log')) {
        files.push({ path: fullPath, content: fs.readFileSync(fullPath, 'utf-8') });
      }
    });
  }

  ESSENTIAL_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
      if (dir.endsWith('.ts')) {
        files.push({ path: dir, content: fs.readFileSync(dir, 'utf-8') });
      } else {
        addFilesFromDir(dir);
      }
    }
  });

  console.log(`Pushing ${files.length} essential files...`);

  const BATCH_SIZE = 50;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    console.log(`Batch ${Math.floor(i/BATCH_SIZE) + 1}: Uploading ${batch.length} files...`);

    for (const file of batch) {
      try {
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: file.path,
          message: `Add ${file.path}`,
          content: Buffer.from(file.content).toString('base64')
        });
      } catch (error: any) {
        if (error.status === 422) {
          await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: file.path,
            message: `Update ${file.path}`,
            content: Buffer.from(file.content).toString('base64'),
            sha: (await octokit.repos.getContent({ owner, repo, path: file.path })).data.sha
          });
        }
      }
    }
  }

  console.log(`\n✅ Pushed ${files.length} files to GitHub!`);
  console.log(`🔗 https://github.com/${owner}/${repo}`);
}

quickPush();
