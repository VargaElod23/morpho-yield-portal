#!/usr/bin/env node

/**
 * Script to create a new release version in CHANGELOG.md
 * Usage: node scripts/release-version.js "1.2.0"
 */

const fs = require('fs');
const path = require('path');

const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
const packagePath = path.join(__dirname, '..', 'package.json');

function createRelease(version) {
  if (!version) {
    console.log('Usage: node scripts/release-version.js "1.2.0"');
    process.exit(1);
  }

  try {
    // Update package.json version
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    const packageData = JSON.parse(packageContent);
    packageData.version = version;
    fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n');

    // Update changelog
    const changelog = fs.readFileSync(changelogPath, 'utf8');
    const today = new Date().toISOString().split('T')[0];
    
    // Replace [Unreleased] with version and date
    const unreleasedRegex = /## \[Unreleased\]/;
    const newChangelog = changelog.replace(
      unreleasedRegex,
      `## [Unreleased]\n\n## [${version}] - ${today}`
    );
    
    fs.writeFileSync(changelogPath, newChangelog);
    
    console.log(`✅ Released version ${version}`);
    console.log(`📦 Updated package.json to version ${version}`);
    console.log(`📝 Updated CHANGELOG.md with release date ${today}`);
    console.log(`\n🎯 Next steps:`);
    console.log(`   git add .`);
    console.log(`   git commit -m "chore: release v${version}"`);
    console.log(`   git tag v${version}`);
    console.log(`   git push origin main --tags`);
    
  } catch (error) {
    console.error('Error creating release:', error.message);
    process.exit(1);
  }
}

const version = process.argv[2];
createRelease(version);