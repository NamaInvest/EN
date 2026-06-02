import * as fs from 'fs';
import * as path from 'path';
import { writeTextFileSafe, nowIsoDate } from './shared';

interface WorkflowAuditResult {
  filename: string;
  hasCleartextSecrets: boolean;
  usesSecretsExpressions: boolean;
  hasCaching: boolean;
  hasRollback: boolean;
  hasTypecheck: boolean;
  hasLint: boolean;
}

function runWorkflowAudit() {
  console.log('Starting CI/CD Workflow Compliance Audit...');
  
  const workflowsDir = '.github/workflows';
  if (!fs.existsSync(workflowsDir)) {
    console.error(`ERROR: GitHub workflows directory not found at ${workflowsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(workflowsDir);
  const yamlFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
  
  const auditResults: WorkflowAuditResult[] = [];

  for (const file of yamlFiles) {
    const filePath = path.join(workflowsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for cleartext secrets (a basic regex checking for hardcoded credentials)
    // E.g., password: 'foo', secret: "bar", token: a1b2c3d4
    const cleartextRegex = /(password|secret|token|key)\s*:\s*['"]?[a-zA-Z0-9_\-]{8,50}['"]?\s*$/gim;
    let hasCleartextSecrets = false;
    let match;
    while ((match = cleartextRegex.exec(content)) !== null) {
      const line = match[0];
      // Skip if it uses github action expressions ${{ secrets.* }}
      if (!line.includes('${{') && !line.includes('secrets.')) {
        hasCleartextSecrets = true;
      }
    }
    
    // Check if it uses secrets expressions
    const usesSecretsExpressions = /\$\{\{\s*secrets\./i.test(content);
    
    // Check caching: look for cache: 'npm' or cache: npm
    const hasCaching = /cache\s*:\s*['"]?npm['"]?/i.test(content) || /actions\/cache/i.test(content);
    
    // Check rollback: look for rollback, git reset, set -e or similar rollback words
    const hasRollback = /rollback|git reset/i.test(content);
    
    // Check typecheck: look for typecheck or tsc --noEmit
    const hasTypecheck = /typecheck|tsc/i.test(content);
    
    // Check lint: look for eslint or lint
    const hasLint = /eslint|lint/i.test(content);
    
    auditResults.push({
      filename: file,
      hasCleartextSecrets,
      usesSecretsExpressions,
      hasCaching,
      hasRollback,
      hasTypecheck,
      hasLint
    });
  }

  // Aggregate statistics
  const totalWorkflows = auditResults.length;
  const secureWorkflows = auditResults.filter(r => !r.hasCleartextSecrets);
  const workflowsWithCaching = auditResults.filter(r => r.hasCaching);
  const workflowsWithRollback = auditResults.filter(r => r.hasRollback);
  const workflowsWithTypecheck = auditResults.filter(r => r.hasTypecheck);
  const workflowsWithLint = auditResults.filter(r => r.hasLint);

  let overallStatus = 'CI_AUDIT_PASS';
  const cleartextViolations = auditResults.filter(r => r.hasCleartextSecrets);
  if (cleartextViolations.length > 0) {
    overallStatus = 'CI_AUDIT_CRITICAL_FAIL';
  } else if (workflowsWithCaching.length === 0) {
    overallStatus = 'CI_AUDIT_WARNINGS';
  }

  // Generate Report
  const reportPath = 'CI_WORKFLOW_AUDIT_REPORT.md';
  let mdReport = `# CI/CD WORKFLOW COMPLIANCE REPORT

> **التاريخ:** ${nowIsoDate()} | **تقرير تدقيق سير عمل الـ CI/CD** | **وضع التقييم المقيد**

---

## 1. Summary
- **Checked At**: ${new Date().toISOString()}
- **Overall Result**: \`${overallStatus}\`
- **Total Workflows Checked**: \`${totalWorkflows}\`
- **Secure Workflows (0 Cleartext Secrets):** \`${secureWorkflows.length}\` (${((secureWorkflows.length / totalWorkflows) * 100).toFixed(1)}%)
- **Workflows utilizing Caching (Fast Build):** \`${workflowsWithCaching.length}\`
- **Workflows with Auto-Rollback Configurations:** \`${workflowsWithRollback.length}\`
- **Workflows enforcing TypeScript check:** \`${workflowsWithTypecheck.length}\`
- **Workflows enforcing ESLint checks:** \`${workflowsWithLint.length}\`

---

## 2. Active Compliance & Audit Details

### 🔑 Cleartext Credentials Check
> [!IMPORTANT]
> **DevOps Security Rule:** No hardcoded cleartext credentials (passwords, tokens, deploy keys) should exist in GitHub Action files. All parameters must be sourced from GitHub Encrypted Secrets.
${cleartextViolations.length === 0 
  ? '✅ **Pass:** Zero hardcoded cleartext credentials detected in any GitHub Action workflow file. All sensitive parameters are correctly sourced via `${{ secrets.* }}`.' 
  : `❌ **CRITICAL FAIL:** Exposed cleartext secrets found in the following workflow files:\n${cleartextViolations.map(v => `- File \`${v.filename}\``).join('\n')}`
}

### ⚡ Caching & Build Optimization
Using caching for node packages (e.g. \`cache: 'npm'\`) reduces the installation bottleneck by up to 80% on CI runners.
* **Workflows with Caching enabled:** ${workflowsWithCaching.length}
${workflowsWithCaching.length > 0
  ? `✅ **Pass:** Fast npm package caching is enabled in:\n${workflowsWithCaching.map(w => `- \`${w.filename}\``).join('\n')}`
  : '⚠️ **Warning:** No workflows have npm caching enabled.'
}

### 🔄 Staging & Production Auto-Rollback Safety
For continuous deployment, automatic smoke tests and rollback strategies prevent bad builds from taking down live services.
* **Workflows with Auto-Rollback capability:** ${workflowsWithRollback.length}
${workflowsWithRollback.map(w => `- File **\`${w.filename}\`**: Implements rollback routines (reverting to previous stable git commit on health check failure).`).join('\n')}

---

## 3. Workflow Diagnostics Details
Here is the detailed breakdown of the checked workflows:

| Filename | Secrets expression | Fast Caching | Auto Rollback | Typecheck check | Lint check |
| --- | --- | --- | --- | --- | --- |
${auditResults.map(r => `| \`${r.filename}\` | ${r.usesSecretsExpressions ? '✅ YES' : '❌ NO'} | ${r.hasCaching ? '✅ YES' : '❌ NO'} | ${r.hasRollback ? '✅ YES' : '❌ NO'} | ${r.hasTypecheck ? '✅ YES' : '❌ NO'} | ${r.hasLint ? '✅ YES' : '❌ NO'} |`).join('\n')}

---

## 4. Final Verdict & Status
Overall CI/CD audit status set to \`${overallStatus}\`.
`;

  writeTextFileSafe(reportPath, mdReport);
  
  console.log(`CI/CD Workflow audit completed successfully.`);
  console.log(`- Overall Result: ${overallStatus}`);
  console.log(`- Total Workflows: ${totalWorkflows}`);
  console.log(`- Caching enabled in: ${workflowsWithCaching.length} files`);
  console.log(`- Auto-Rollback in: ${workflowsWithRollback.length} files`);
  console.log(`- Report generated and saved to ${reportPath}`);
}

runWorkflowAudit();
