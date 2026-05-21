import fs from 'fs';
import path from 'path';

function checkCompliance() {
  console.log('Initiating automated compliance review...');
  
  const matrixPath = path.join(process.cwd(), 'docs', 'MASTER_PACK', '15-security', 'CONTROLS_MATRIX.md');
  
  if (!fs.existsSync(matrixPath)) {
    console.error('CONTROLS_MATRIX.md not found!');
    return;
  }

  const content = fs.readFileSync(matrixPath, 'utf8');
  const lines = content.split('\n').filter(l => l.startsWith('|') && !l.includes('---') && !l.includes('ID |'));
  
  const now = new Date();
  let expiredCount = 0;

  lines.forEach(line => {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 8) {
      const id = parts[1];
      const nextReviewDateStr = parts[8];
      
      try {
        const nextReviewDate = new Date(nextReviewDateStr);
        if (nextReviewDate < now) {
          console.warn(`⚠️ Control ${id} is past its review date (${nextReviewDateStr})!`);
          expiredCount++;
        }
      } catch (e) {
        // ignore parsing errors for now
      }
    }
  });

  if (expiredCount > 0) {
    console.log(`\nAction Required: ${expiredCount} controls need immediate review by their owners.`);
    // In production, send email/slack to compliance officer
  } else {
    console.log('\n✅ All controls are up to date.');
  }
}

checkCompliance();
