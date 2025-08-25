#!/usr/bin/env node

/**
 * Simple script to help update the CHANGELOG.md
 * Usage: node scripts/update-changelog.js "Added new feature description"
 */

const fs = require('fs');
const path = require('path');

const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');

function updateChangelog(change, type = 'Added') {
  if (!change) {
    console.log('Usage: node scripts/update-changelog.js "Your change description" [type]');
    console.log('Types: Added, Changed, Fixed, Removed, Security, Deprecated');
    process.exit(1);
  }

  try {
    const changelog = fs.readFileSync(changelogPath, 'utf8');
    
    // Find the [Unreleased] section
    const unreleasedRegex = /## \[Unreleased\]([\s\S]*?)(?=## \[|$)/;
    const match = changelog.match(unreleasedRegex);
    
    if (!match) {
      console.error('Could not find [Unreleased] section in CHANGELOG.md');
      process.exit(1);
    }

    const unreleasedSection = match[1];
    const typeRegex = new RegExp(`### ${type}([\\s\\S]*?)(?=### |$)`);
    const typeMatch = unreleasedSection.match(typeRegex);

    let newUnreleased;
    if (typeMatch) {
      // Type section exists, add to it
      const typeSection = typeMatch[1];
      const newTypeSection = typeSection.trimEnd() + `\n- ${change}\n`;
      newUnreleased = unreleasedSection.replace(typeMatch[1], newTypeSection);
    } else {
      // Type section doesn't exist, create it
      const newTypeSection = `\n### ${type}\n- ${change}\n`;
      // Insert after the [Unreleased] header
      newUnreleased = unreleasedSection.trim() + newTypeSection;
    }

    const newChangelog = changelog.replace(match[1], newUnreleased);
    
    fs.writeFileSync(changelogPath, newChangelog);
    console.log(`✅ Added to CHANGELOG.md under "${type}": ${change}`);
    
  } catch (error) {
    console.error('Error updating changelog:', error.message);
    process.exit(1);
  }
}

// Get command line arguments
const change = process.argv[2];
const type = process.argv[3] || 'Added';

updateChangelog(change, type);