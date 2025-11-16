import { getUncachableGitHubClient } from './github';

async function addCollaborator() {
  const octokit = await getUncachableGitHubClient();
  const owner = 'umairkhan2582';
  const repo = 'talkastranger';
  const email = 'Saad.2582@gmail.com';
  
  try {
    const { data: users } = await octokit.search.users({
      q: `${email} in:email`
    });
    
    if (users.items.length === 0) {
      console.log('❌ No GitHub user found with that email');
      console.log('Please provide their GitHub username instead');
      return;
    }
    
    const username = users.items[0].login;
    console.log(`Found GitHub user: ${username}`);
    
    await octokit.repos.addCollaborator({
      owner,
      repo,
      username,
      permission: 'push'
    });
    
    console.log(`✅ Invited ${username} (${email}) as collaborator with write access`);
    
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

addCollaborator();
