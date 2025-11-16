import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';

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

async function main() {
  try {
    console.log('🔑 Getting GitHub access token...');
    const token = await getAccessToken();
    const octokit = new Octokit({ auth: token });
    
    // Get user info
    console.log('👤 Getting GitHub user info...');
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✅ Connected as: ${user.login}`);
    
    // Check if repo exists
    const repoName = 'talkastranger';
    let repoExists = false;
    
    try {
      await octokit.repos.get({
        owner: user.login,
        repo: repoName
      });
      repoExists = true;
      console.log(`✅ Repository exists: ${user.login}/${repoName}`);
    } catch (error: any) {
      if (error.status === 404) {
        console.log('📦 Repository does not exist, creating new one...');
        
        // Create new repository
        const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
          name: repoName,
          description: 'TalkAStranger - Free Random Video Chat Platform',
          private: false,
          auto_init: false
        });
        
        console.log(`✅ Created repository: ${newRepo.html_url}`);
        console.log(`🔗 Repository URL: ${newRepo.html_url}`);
      } else {
        throw error;
      }
    }
    
    // Configure git with the remote
    const repoUrl = `https://${token}@github.com/${user.login}/${repoName}.git`;
    
    try {
      execSync('git remote remove origin 2>/dev/null || true', { stdio: 'ignore' });
    } catch (e) {
      // Ignore error if remote doesn't exist
    }
    
    console.log('🔧 Adding GitHub remote...');
    execSync(`git remote add origin ${repoUrl}`);
    
    console.log('📝 Staging all changes...');
    execSync('git add .');
    
    console.log('💾 Creating commit...');
    try {
      execSync('git commit -m "UI improvements: removed header images, fixed scrolling, fixed drawer menu icons"');
    } catch (e) {
      console.log('ℹ️  No changes to commit or already committed');
    }
    
    console.log('🚀 Pushing to GitHub...');
    execSync('git push -u origin main --force', { stdio: 'inherit' });
    
    console.log('\n✅ SUCCESS! Code pushed to GitHub!');
    console.log(`🔗 Repository: https://github.com/${user.login}/${repoName}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

main();
