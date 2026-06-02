import * as fs from 'fs';
import { writeTextFileSafe, readTextIfExists } from './shared';

function updateEvidenceIndex() {
  const args = process.argv.slice(2);
  
  let title = '';
  let pathArg = '';
  let purpose = '';
  let status = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) title = args[i + 1];
    if (args[i] === '--path' && args[i + 1]) pathArg = args[i + 1];
    if (args[i] === '--purpose' && args[i + 1]) purpose = args[i + 1];
    if (args[i] === '--status' && args[i + 1]) status = args[i + 1];
  }

  if (!title || !pathArg || !purpose || !status) {
    console.log('Usage: npx tsx scripts/brain/update-evidence-index.ts --title "<Title>" --path "<Path>" --purpose "<Purpose>" --status "<Status>"');
    return;
  }

  const indexFile = '.ai-brain/19-evidence-index.md';
  let content = readTextIfExists(indexFile);

  if (content.includes(title)) {
    console.log(`Report index already exists for: ${title}. Skipping.`);
    return;
  }

  const isoDate = new Date().toISOString().split('T')[0];
  const newRow = `| ${isoDate} | \`${title}\` | \`${pathArg}\` | ${purpose} | \`${status}\` |`;
  
  // Find where the table rows end
  const lines = content.split('\n');
  let insertIndex = -1;
  
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith('|') && lines[i].includes('`')) {
      insertIndex = i + 1;
      break;
    }
  }

  if (insertIndex !== -1) {
    lines.splice(insertIndex, 0, newRow);
    content = lines.join('\n');
  } else {
    // Just append
    content = content.trim() + '\n' + newRow + '\n';
  }

  writeTextFileSafe(indexFile, content);
  console.log(`Successfully added ${title} to ${indexFile}`);
}

updateEvidenceIndex();
