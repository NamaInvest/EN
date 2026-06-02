import { writeTextFileSafe, readTextIfExists } from './shared';

function updateQualityStatus() {
  const qualityFile = '.ai-brain/03-quality-and-testing.md';
  let content = readTextIfExists(qualityFile);

  const isoDate = new Date().toISOString().split('T')[0];
  const qualityBlock = `
## ${isoDate} — Baseline Quality Status

\`\`\`text
TypeScript: PASS
ESLint: FAIL
Jest: FAIL
Vitest: FAIL
Coverage: COVERAGE_NOT_GENERATED
E2E: NOT_RUN_REQUIRES_ENV_SAFETY_REVIEW
\`\`\`

- **Source**: \`FULL_TEST_SUITE_AND_COVERAGE_BASELINE_REPORT.md\`
- **Classification**: \`VERIFIED_BY_REPORT\`
`;

  if (content.includes('Baseline Quality Status')) {
    console.log('Baseline Quality Status section already exists. Skipping.');
    return;
  }

  content = content.trim() + '\n\n' + qualityBlock.trim() + '\n';
  writeTextFileSafe(qualityFile, content);
  console.log(`Successfully updated quality status in ${qualityFile}`);
}

updateQualityStatus();
