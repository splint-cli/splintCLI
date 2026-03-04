#!/usr/bin/env node
/**
 * backdate-push.js — Push files to GitHub with custom commit dates
 * 
 * Usage:
 *   node backdate-push.js --repo owner/repo --token ghp_xxx --message "commit msg" --date "2026-01-15T10:00:00Z" --files file1.js,file2.js
 * 
 * Options:
 *   --repo      GitHub repo (owner/repo)
 *   --token     GitHub personal access token
 *   --message   Commit message
 *   --date      ISO 8601 date for the commit (e.g. "2026-01-15T10:00:00Z")
 *   --files     Comma-separated list of local file paths to push
 *   --branch    Branch name (default: main)
 *   --name      Author name (default: github username)
 *   --email     Author email (default: username@users.noreply.github.com)
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

// ── Parse args ──
const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i].replace(/^--/, '');
  args[key] = process.argv[i + 1];
}

if (!args.repo || !args.token || !args.message || !args.date || !args.files) {
  console.error('Usage: node backdate-push.js --repo owner/repo --token ghp_xxx --message "msg" --date "2026-01-15T10:00:00Z" --files file1.js,file2.js');
  console.error('\nOptional: --branch main --name "Your Name" --email "you@example.com"');
  process.exit(1);
}

const REPO = args.repo;
const TOKEN = args.token;
const MESSAGE = args.message;
const DATE = args.date;
const FILES = args.files.split(',').map(f => f.trim());
const BRANCH = args.branch || 'main';
const AUTHOR_NAME = args.name || REPO.split('/')[0];
const AUTHOR_EMAIL = args.email || `${REPO.split('/')[0]}@users.noreply.github.com`;

// ── GitHub API helper ──
function api(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `token ${TOKEN}`,
        'User-Agent': 'backdate-push',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`${res.statusCode}: ${parsed.message || data}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log(`\n📦 Pushing ${FILES.length} file(s) to ${REPO} (${BRANCH})`);
  console.log(`📅 Date: ${DATE}`);
  console.log(`💬 Message: ${MESSAGE}\n`);

  // Step 1: Get current branch ref
  let currentSha, treeSha;
  try {
    const ref = await api('GET', `/repos/${REPO}/git/ref/heads/${BRANCH}`);
    currentSha = ref.object.sha;
    const commit = await api('GET', `/repos/${REPO}/git/commits/${currentSha}`);
    treeSha = commit.tree.sha;
    console.log(`✓ Current HEAD: ${currentSha.slice(0, 7)}`);
  } catch (e) {
    // Branch might not exist yet — create initial commit
    console.log('ℹ Branch not found, creating initial commit...');
    currentSha = null;
    treeSha = null;
  }

  // Step 2: Create blobs for each file
  const treeItems = [];
  for (const filePath of FILES) {
    const content = fs.readFileSync(filePath);
    const base64 = content.toString('base64');
    
    const blob = await api('POST', `/repos/${REPO}/git/blobs`, {
      content: base64,
      encoding: 'base64',
    });

    // Use the filename relative to cwd, or just the basename
    const repoPath = filePath.replace(/\\/g, '/');
    
    treeItems.push({
      path: repoPath,
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    });

    console.log(`✓ Blob: ${repoPath} (${content.length} bytes)`);
  }

  // Step 3: Create tree
  const treePayload = { tree: treeItems };
  if (treeSha) treePayload.base_tree = treeSha;

  const newTree = await api('POST', `/repos/${REPO}/git/trees`, treePayload);
  console.log(`✓ Tree: ${newTree.sha.slice(0, 7)}`);

  // Step 4: Create commit with custom date
  const commitPayload = {
    message: MESSAGE,
    tree: newTree.sha,
    author: {
      name: AUTHOR_NAME,
      email: AUTHOR_EMAIL,
      date: DATE,
    },
    committer: {
      name: AUTHOR_NAME,
      email: AUTHOR_EMAIL,
      date: DATE,
    },
  };
  if (currentSha) commitPayload.parents = [currentSha];
  else commitPayload.parents = [];

  const newCommit = await api('POST', `/repos/${REPO}/git/commits`, commitPayload);
  console.log(`✓ Commit: ${newCommit.sha.slice(0, 7)} — "${MESSAGE}"`);

  // Step 5: Update branch ref
  try {
    await api('PATCH', `/repos/${REPO}/git/refs/heads/${BRANCH}`, {
      sha: newCommit.sha,
      force: true,
    });
  } catch (e) {
    // Ref might not exist, create it
    await api('POST', `/repos/${REPO}/git/refs`, {
      ref: `refs/heads/${BRANCH}`,
      sha: newCommit.sha,
    });
  }

  console.log(`\n✅ Done! Pushed to ${REPO}@${BRANCH} with date ${DATE}\n`);
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
