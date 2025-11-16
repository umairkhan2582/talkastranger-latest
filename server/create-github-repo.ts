import { getUncachableGitHubClient } from './github';

async function createGitHubRepository() {
  try {
    const octokit = await getUncachableGitHubClient();
    
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`[GitHub] Authenticated as: ${user.login}`);
    
    const repoName = 'talkastranger';
    const description = 'TASChain - A decentralized platform combining peer-to-peer token trading with real-time video chat on Binance Smart Chain';
    
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description: description,
      private: false,
      auto_init: false,
    });
    
    console.log(`[GitHub] Repository created successfully!`);
    console.log(`[GitHub] URL: ${repo.html_url}`);
    console.log(`[GitHub] Clone URL: ${repo.clone_url}`);
    console.log(`[GitHub] SSH URL: ${repo.ssh_url}`);
    
    return {
      url: repo.html_url,
      cloneUrl: repo.clone_url,
      sshUrl: repo.ssh_url,
      fullName: repo.full_name
    };
  } catch (error: any) {
    if (error.status === 422) {
      console.error('[GitHub] Repository already exists or name is invalid');
    } else {
      console.error('[GitHub] Error creating repository:', error.message);
    }
    throw error;
  }
}

createGitHubRepository()
  .then((repo) => {
    console.log('\n✅ GitHub repository created successfully!');
    console.log(`📦 Repository: ${repo.fullName}`);
    console.log(`🔗 URL: ${repo.url}`);
    console.log('\nNext steps:');
    console.log('1. git init');
    console.log(`2. git remote add origin ${repo.cloneUrl}`);
    console.log('3. git add .');
    console.log('4. git commit -m "Initial commit: TASChain platform"');
    console.log('5. git push -u origin main');
  })
  .catch((error) => {
    console.error('❌ Failed to create repository');
    process.exit(1);
  });
