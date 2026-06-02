import { writeTextFileSafe, readTextIfExists } from './shared';

function updateCurrentState() {
  const stateFile = '.ai-brain/01-current-state.md';
  let content = readTextIfExists(stateFile);

  const heading = '## 8. AI Skills Bootstrap Status';
  const isoDate = new Date().toISOString().split('T')[0];
  const newSection = `
---

## ${isoDate} — Brain Governance Scripts Status

Status: \`BRAIN_GOVERNANCE_SCRIPTS_CREATED_OR_VERIFIED\`

Runtime code: \`UNTOUCHED\`
DB: \`UNTOUCHED\`
Production: \`UNTOUCHED\`
MCP external config: \`NOT_CONFIGURED\`

Next gate: \`GO_FOR_SAFE_READ_ONLY_MCP_FOUNDATION_ONLY\`
`;

  // Avoid duplicate daily script status sections
  if (content.includes('Brain Governance Scripts Status')) {
    console.log('Brain Governance Scripts Status section already exists. Skipping.');
    return;
  }

  // Insert the section before the "8. AI Skills Bootstrap Status" if exists, or append it
  if (content.includes(heading)) {
    content = content.replace(heading, newSection.trim() + '\n\n' + heading);
  } else {
    content = content.trim() + '\n\n' + newSection.trim() + '\n';
  }

  writeTextFileSafe(stateFile, content);
  console.log(`Successfully updated current state in ${stateFile}`);
}

updateCurrentState();
