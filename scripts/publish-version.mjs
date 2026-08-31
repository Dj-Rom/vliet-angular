#!/usr/bin/env node
/**
 * scripts/publish-version.mjs
 * Runs AFTER deploy (postdeploy hook).
 * Publishes new version to Firestore so all users get update notification.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// 1. Read new version from package.json
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const version = pkg.version;

// 2. Read Firebase config from environment.ts
const env = readFileSync(join(ROOT, 'src/environments/environment.ts'), 'utf8');
const apiKey = env.match(/apiKey:\s*["']([^"']+)["']/)?.[1];
const projectId = env.match(/projectId:\s*["']([^"']+)["']/)?.[1];

if (!apiKey || !projectId) {
  console.error('ERROR: Firebase config not found in environment.ts');
  process.exit(1);
}

// 3. Publish to Firestore via REST API (PATCH = create or update)
const body = JSON.stringify({
  fields: {
    version:     { stringValue: version },
    message:     { stringValue: `Dostepna nowa wersja aplikacji ${version}` },
    forceUpdate: { booleanValue: false },
    updatedAt:   { stringValue: new Date().toISOString() },
  }
});

const path = `/v1/projects/${projectId}/databases/(default)/documents/system/version?key=${apiKey}`;

const req = https.request(
  {
    hostname: 'firestore.googleapis.com',
    path,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`\n==================================================`);
        console.log(`  DEPLOYED:  v${version}`);
        console.log(`  Firestore: system/version = ${version}`);
        console.log(`  All users will receive the update notification!`);
        console.log(`==================================================\n`);
      } else {
        console.error(`\nFirestore error ${res.statusCode}:`, data);
        console.log('(Deploy succeeded, but Firestore update failed - publish manually)\n');
      }
    });
  }
);

req.on('error', (e) => {
  console.error('Network error publishing to Firestore:', e.message);
  console.log('(Deploy succeeded, but Firestore update failed)\n');
});

req.write(body);
req.end();
