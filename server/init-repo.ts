import { getUncachableGitHubClient } from './github';

async function initializeRepo() {
  const octokit = await getUncachableGitHubClient();
  const owner = 'umairkhan2582';
  const repo = 'talkastranger';

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'README.md',
      message: 'Initialize repository',
      content: Buffer.from('# Talkastranger.com\n\nTASChain - A decentralized platform combining peer-to-peer token trading with real-time video chat on Binance Smart Chain').toString('base64'),
    });

    console.log('✅ Repository initialized with README');
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

initializeRepo();
