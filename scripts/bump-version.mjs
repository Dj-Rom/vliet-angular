#!/usr/bin/env node
/**
 * scripts/bump-version.mjs
 * Runs BEFORE build (predeploy hook).
 * Auto-increments patch: 2.1.2 -> 2.1.3 ... 2.1.10 -> 2.2.0
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// 1. Read current version
const pkgPath = join(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const current = pkg.version;
const [major, minor, patch] = current.split('.').map(Number);

// 2. Bump patch (max 10 -> minor+1, patch=0)
let [newMaj, newMin, newPat] = [major, minor, patch];
if (patch >= 10) { newMin++; newPat = 0; } else { newPat++; }
const newVersion = `${newMaj}.${newMin}.${newPat}`;

console.log(`\n==================================================`);
console.log(`  Version bump:  ${current}  ->  ${newVersion}`);
console.log(`==================================================\n`);

// 3. Update package.json
pkg.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\r\n');
console.log('OK  package.json');

// 4. Update environment.ts
const envPath = join(ROOT, 'src/environments/environment.ts');
const env = readFileSync(envPath, 'utf8');
const envUpdated = env.replace(/appVersion:\s*['"][^'"]*['"]/, `appVersion: '${newVersion}'`);
writeFileSync(envPath, envUpdated);
console.log('OK  environment.ts');
console.log('\nBuilding and deploying...\n');
