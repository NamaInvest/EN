import { writeTextFileSafe, readTextIfExists } from './shared';

function updateRiskRegister() {
  const args = process.argv.slice(2);
  
  let id = '';
  let risk = '';
  let severity = '';
  let status = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id' && args[i + 1]) id = args[i + 1];
    if (args[i] === '--risk' && args[i + 1]) risk = args[i + 1];
    if (args[i] === '--severity' && args[i + 1]) severity = args[i + 1];
    if (args[i] === '--status' && args[i + 1]) status = args[i + 1];
  }

  if (!id || !risk || !severity || !status) {
    console.log('Usage: npx tsx scripts/brain/update-risk-register.ts --id "<ID>" --risk "<Risk>" --severity "<Severity>" --status "<Status>"');
    return;
  }

  const riskFile = '.ai-brain/16-risk-register.md';
  let content = readTextIfExists(riskFile);

  if (content.includes(id)) {
    console.log(`Risk entry already exists for: ${id}. Skipping.`);
    return;
  }

  const newRow = `| **${id}** | ${risk} | عملياتي تشغيلي | **${severity}** | \`PLAN_ONLY\` | Recommended risk mitigation plan. | \`${status}\` |`;
  
  const lines = content.split('\n');
  let insertIndex = -1;
  
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith('|') && lines[i].includes('RK-')) {
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

  writeTextFileSafe(riskFile, content);
  console.log(`Successfully added risk ${id} to ${riskFile}`);
}

updateRiskRegister();
