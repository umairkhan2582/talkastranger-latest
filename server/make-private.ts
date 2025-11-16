import { getUncachableGitHubClient } from './github';

async function makePrivate() {
  const octokit = await getUncachableGitHubClient();
  
  await octokit.repos.update({
    owner: 'umairkhan2582',
    repo: 'talkastranger',
    private: true
  });
  
  console.log('✅ Repository is now PRIVATE');
}

makePrivate();
