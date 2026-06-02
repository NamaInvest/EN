import * as fs from 'fs';
import * as path from 'path';
import { REQUIRED_AI_BRAIN_FILES, writeTextFileSafe, readTextIfExists } from './shared';

function runConsistencyCheck() {
  console.log('Running Brain Consistency Check...');
  
  const missingFiles: string[] = [];
  const missingSkills: string[] = [];
  const requiredDecisions = ['ADR-SKILL-001', 'ADR-MCP-001'];
  const missingDecisions: string[] = [];
  const riskyClaims: string[] = [];
  
  // 1. Check required AI Brain files
  for (const f of REQUIRED_AI_BRAIN_FILES) {
    if (!fs.existsSync(f)) {
      missingFiles.push(`MISSING_AI_BRAIN_FILE: ${f}`);
    }
  }

  // 2. Check required AI Skill files
  const requiredSkills = [
    '.skills/nama-brain-governance/SKILL.md',
    '.skills/nama-qa-stabilization/SKILL.md',
    '.skills/nama-api-tenant-isolation/SKILL.md',
    '.skills/nama-prisma-governance/SKILL.md',
    '.skills/nama-security-compliance/SKILL.md'
  ];

  for (const sk of requiredSkills) {
    if (!fs.existsSync(sk)) {
      missingSkills.push(`MISSING_AI_SKILL_FILE: ${sk}`);
    }
  }

  // 3. Check decisions in decision log
  const decisionLogContent = readTextIfExists('.ai-brain/18-decision-log.md');
  for (const dec of requiredDecisions) {
    if (!decisionLogContent.includes(dec)) {
      missingDecisions.push(`MISSING_DECISION: ${dec}`);
    }
  }

  // 4. Check for risky claims in files
  const riskyKeywords = [
    'Production Stable',
    'World-Class Verified',
    'Security Complete',
    'Fully Tested'
  ];

  // 4. Check for risky claims in all discovered brain files
  const allDiscoveredFiles = fs.readdirSync('.ai-brain').map(f => path.join('.ai-brain', f));
  for (const f of allDiscoveredFiles) {
    if (fs.existsSync(f) && fs.statSync(f).isFile()) {
      const content = fs.readFileSync(f, 'utf-8');
      for (const kw of riskyKeywords) {
        if (content.includes(kw)) {
          // Check if it's in the allowed baseline or status exception
          if (!content.includes(`PRODUCTION_NOT_VERIFIED`) && !content.includes(`NOT_READY`)) {
            riskyClaims.push(`RISKY_UNVERIFIED_CLAIM in ${f}: "${kw}"`);
          }
        }
      }
    }
  }

  // Determine overall status
  let resultStatus = 'BRAIN_CONSISTENCY_PASS';
  if (missingFiles.length > 0 || missingSkills.length > 0 || missingDecisions.length > 0) {
    resultStatus = 'BRAIN_CONSISTENCY_FAIL';
  } else if (riskyClaims.length > 0) {
    resultStatus = 'BRAIN_CONSISTENCY_WARNINGS';
  }

  // Generate Report
  const reportPath = 'BRAIN_CONSISTENCY_REPORT.md';
  const mdReport = `# BRAIN CONSISTENCY REPORT

## Summary
- **Checked At**: ${new Date().toISOString()}
- **Overall Result**: \`${resultStatus}\`

## Missing Files
${missingFiles.length === 0 ? '- None' : missingFiles.map(m => `- ${m}`).join('\n')}

## Missing Skills
${missingSkills.length === 0 ? '- None' : missingSkills.map(m => `- ${m}`).join('\n')}

## Required Decisions
${missingDecisions.length === 0 ? '- None' : missingDecisions.map(m => `- ${m}`).join('\n')}

## Risky Claims
${riskyClaims.length === 0 ? '- None' : riskyClaims.map(m => `- ${m}`).join('\n')}

## Result
Status set to \`${resultStatus}\`.
`;

  writeTextFileSafe(reportPath, mdReport);
  console.log(`Consistency check completed. Result: ${resultStatus}. Report saved to ${reportPath}`);
}

runConsistencyCheck();
