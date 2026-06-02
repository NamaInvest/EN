import { writeTextFileSafe, readTextIfExists } from './shared';

function updateGapRegister() {
  const args = process.argv.slice(2);
  
  let id = '';
  let gap = '';
  let priority = '';
  let status = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id' && args[i + 1]) id = args[i + 1];
    if (args[i] === '--gap' && args[i + 1]) gap = args[i + 1];
    if (args[i] === '--priority' && args[i + 1]) priority = args[i + 1];
    if (args[i] === '--status' && args[i + 1]) status = args[i + 1];
  }

  if (!id || !gap || !priority || !status) {
    console.log('Usage: npx tsx scripts/brain/update-gap-register.ts --id "<ID>" --gap "<Gap>" --priority "<Priority>" --status "<Status>"');
    return;
  }

  const gapFile = '.ai-brain/17-gap-register.md';
  let content = readTextIfExists(gapFile);

  if (content.includes(id)) {
    console.log(`Gap entry already exists for: ${id}. Skipping.`);
    return;
  }

  const newRow = `| **${id}** | ${gap} | \`${priority}\` | \`PLAN_ONLY\` | Recommended mitigation plan. | \`${status}\` |`;
  
  const lines = content.split('\n');
  let insertIndex = -1;
  
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith('|') && lines[i].includes('GP-')) {
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

  writeTextFileSafe(gapFile, content);
  console.log(`Successfully added gap ${id} to ${gapFile}`);
}

updateGapRegister();
