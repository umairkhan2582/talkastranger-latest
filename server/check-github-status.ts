import { Octokit } from '@octokit/rest';

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
    const token = await getAccessToken();
    const octokit = new Octokit({ auth: token });
    
    const { data: user } = await octokit.users.getAuthenticated();
    const owner = user.login;
    const repo = 'talkastranger';

    console.log(`\n📊 Checking GitHub Repository: ${owner}/${repo}\n`);

    // Check recent commits
    const { data: commits } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 5
    });

    console.log('🕐 Recent Commits:');
    commits.forEach((commit, i) => {
      const date = new Date(commit.commit.author?.date || '');
      console.log(`${i + 1}. ${commit.commit.message}`);
      console.log(`   Author: ${commit.commit.author?.name}`);
      console.log(`   Date: ${date.toLocaleString()}`);
      console.log(`   SHA: ${commit.sha.substring(0, 7)}`);
      console.log('');
    });

    // Check specific files
    console.log('\n📂 Checking Key Files:\n');
    const filesToCheck = [
      'client/src/pages/TradeNTalk.tsx',
      'client/src/pages/LocationPage.tsx',
      'client/src/components/Header.tsx',
      'client/src/index.css',
      'replit.md',
    ];

    for (const filePath of filesToCheck) {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: filePath,
        });
        
        if ('sha' in data) {
          console.log(`✅ ${filePath}`);
          console.log(`   Last modified: ${new Date().toLocaleString()} (checking...)`);
        }
      } catch (error: any) {
        if (error.status === 404) {
          console.log(`❌ ${filePath} - NOT FOUND`);
        } else {
          console.log(`⚠️  ${filePath} - Error: ${error.message}`);
        }
      }
    }

    console.log(`\n🔗 Repository URL: https://github.com/${owner}/${repo}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

main();
