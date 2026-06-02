import { writeTextFileSafe, readTextIfExists } from './shared';

function updateDecisionLog() {
  const args = process.argv.slice(2);
  
  let id = '';
  let title = '';
  let status = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id' && args[i + 1]) id = args[i + 1];
    if (args[i] === '--title' && args[i + 1]) title = args[i + 1];
    if (args[i] === '--status' && args[i + 1]) status = args[i + 1];
  }

  if (!id || !title || !status) {
    console.log('Usage: npx tsx scripts/brain/update-decision-log.ts --id "<ID>" --title "<Title>" --status "<Status>"');
    return;
  }

  const logFile = '.ai-brain/18-decision-log.md';
  let content = readTextIfExists(logFile);

  if (content.includes(id)) {
    console.log(`Decision entry already exists for: ${id}. Skipping.`);
    return;
  }

  const isoDate = new Date().toISOString().split('T')[0];
  const newSection = `
---

## ${id} — ${title}

### Date
${isoDate}

### Decision
Details of the decision proposed during bootstrap.

### Reason
Reasoning behind this decision.

### Consequence
Consequences of this decision.

### Status
${status}
`;

  content = content.trim() + '\n' + newSection.trim() + '\n';
  writeTextFileSafe(logFile, content);
  console.log(`Successfully added decision ${id} to ${logFile}`);
}

updateDecisionLog();
