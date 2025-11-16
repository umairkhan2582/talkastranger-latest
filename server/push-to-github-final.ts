import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';
import fs from 'fs';

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
    
    const repoName = 'talkastranger';
    const gitUrl = `https://${user.login}:${token}@github.com/${user.login}/${repoName}.git`;
    
    // Set git config
    console.log('🔧 Configuring git...');
    try {
      execSync(`git config user.name "${user.login}"`, { stdio: 'ignore' });
      execSync(`git config user.email "${user.email || user.login + '@users.noreply.github.com'}"`, { stdio: 'ignore' });
    } catch (e) {
      console.log('Git config already set');
    }
    
    console.log('📝 Staging all changes...');
    execSync('git add .', { stdio: 'inherit' });
    
    console.log('💾 Creating commit...');
    try {
      execSync('git commit -m "UI improvements: removed header images, fixed scrolling, fixed drawer menu icons"', { stdio: 'inherit' });
    } catch (e) {
      console.log('ℹ️  No new changes to commit');
    }
    
    console.log('🚀 Pushing to GitHub...');
    execSync(`git push ${gitUrl} main --force`, { stdio: 'inherit' });
    
    console.log('\n✅ SUCCESS! All code pushed to GitHub!');
    console.log(`🔗 Repository: https://github.com/${user.login}/${repoName}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stderr) {
      console.error('Details:', error.stderr.toString());
    }
  }
}

main();
