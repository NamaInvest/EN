import { writeTextFileSafe, readTextIfExists } from './shared';

function updateApprovalGates() {
  const args = process.argv.slice(2);
  
  let gate = '';
  let purpose = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--gate' && args[i + 1]) gate = args[i + 1];
    if (args[i] === '--purpose' && args[i + 1]) purpose = args[i + 1];
  }

  if (!gate || !purpose) {
    console.log('Usage: npx tsx scripts/brain/update-approval-gates.ts --gate "<Gate>" --purpose "<Purpose>"');
    return;
  }

  const gatesFile = '.ai-brain/15-approval-gates.md';
  let content = readTextIfExists(gatesFile);

  if (content.includes(gate)) {
    console.log(`Approval Gate entry already exists for: ${gate}. Skipping.`);
    return;
  }

  const newRow = `| **G-MCP-NEW** | \`${gate}\` | **CTO / Tech Lead** | ${purpose} |`;
  
  const lines = content.split('\n');
  let insertIndex = -1;
  
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith('|') && lines[i].includes('GO_FOR_')) {
      insertIndex = i + 1;
      break;
    }
  }

  if (insertIndex !== -1) {
    lines.splice(insertIndex, 0, newRow);
    content = lines.join('\n');
  } else {
    content = content.trim() + '\n' + newRow + '\n';
  }

  writeTextFileSafe(gatesFile, content);
  console.log(`Successfully added gate ${gate} to ${gatesFile}`);
}

updateApprovalGates();
