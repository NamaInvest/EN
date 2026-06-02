import * as fs from 'fs';
import * as path from 'path';
import { REQUIRED_AI_BRAIN_FILES, ALLOWED_EVIDENCE_TAGS, writeTextFileSafe } from './shared';

function runEvidenceValidation() {
  console.log('Running Evidence Tag Validation...');

  const invalidTags: string[] = [];
  const checkedFiles: string[] = [];

  // Match tags within uppercase backticks or standard text e.g. `VERIFIED_BY_CODE` or VERIFIED_BY_CODE
  const tagRegex = /\b[A-Z_]{4,35}\b/g;

  const allDiscoveredFiles = fs.readdirSync('.ai-brain').map(f => path.join('.ai-brain', f));
  for (const f of allDiscoveredFiles) {
    if (fs.existsSync(f) && fs.statSync(f).isFile()) {
      checkedFiles.push(f);
      const content = fs.readFileSync(f, 'utf-8');
      
      let match;
      while ((match = tagRegex.exec(content)) !== null) {
        const foundWord = match[0];
        // Skip gate phase strings, roles, and status constants
        if (foundWord.startsWith('GO_FOR_') || foundWord.includes('READ_ONLY') || foundWord === 'ADMIN_ONLY' || foundWord === 'PORTAL_ONLY' || foundWord === 'PENDING_APPROVAL') {
          continue;
        }
        // Check if the found word is an evidence tag like VERIFIED_BY_CODE or similar pattern
        if (foundWord.startsWith('VERIFIED_') || foundWord.endsWith('_ONLY') || foundWord === 'NEEDS_EVIDENCE' || foundWord === 'NOT_VERIFIED' || foundWord === 'PRODUCTION_NOT_VERIFIED' || foundWord.includes('_APPROVAL')) {
          if (!ALLOWED_EVIDENCE_TAGS.includes(foundWord as any)) {
            invalidTags.push(`INVALID_EVIDENCE_TAG in ${f}: "${foundWord}"`);
          }
        }
      }
    }
  }

  const overallResult = invalidTags.length === 0 ? 'EVIDENCE_TAGS_VALID' : 'EVIDENCE_TAGS_INVALID';

  const reportPath = 'BRAIN_EVIDENCE_VALIDATION_REPORT.md';
  const mdReport = `# BRAIN EVIDENCE VALIDATION REPORT

## Summary
- **Checked At**: ${new Date().toISOString()}
- **Overall Result**: \`${overallResult}\`

## Allowed Evidence Tags
${ALLOWED_EVIDENCE_TAGS.map(t => `- \`${t}\``).join('\n')}

## Invalid Evidence Tags
${invalidTags.length === 0 ? '- None' : invalidTags.map(t => `- ${t}`).join('\n')}

## Files Checked
${checkedFiles.map(f => `- ${f}`).join('\n')}

## Result
Result set to \`${overallResult}\`.
`;

  writeTextFileSafe(reportPath, mdReport);
  console.log(`Evidence validation completed. Result: ${overallResult}. Report saved to ${reportPath}`);
}

runEvidenceValidation();
