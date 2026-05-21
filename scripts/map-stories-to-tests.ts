import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function findStoryIdsInFile(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/US-[a-zA-Z]+-\d+/g) || [];
    return [...new Set(matches)];
}

function runMapping() {
    console.log('🔍 Mapping User Stories to Tests...');
    const userStoriesDir = path.resolve(process.cwd(), 'docs/user-stories');
    const testsDir = path.resolve(process.cwd(), 'tests');
    
    if (!fs.existsSync(userStoriesDir)) {
        console.log('⚠️ Docs user-stories directory not found.');
        return;
    }

    // 1. Gather all Story IDs from markdown files
    const allStories = new Set<string>();
    const storyFiles = fs.readdirSync(userStoriesDir).filter(f => f.endsWith('.md'));
    for (const f of storyFiles) {
        const ids = findStoryIdsInFile(path.join(userStoriesDir, f));
        ids.forEach(id => allStories.add(id));
    }

    // 2. Search for these IDs in tests
    let outputCsv = 'StoryID,StoryTitle,TestFile,TestCount,Coverage\n';
    
    // Naive search implementation
    for (const storyId of allStories) {
        let testCount = 0;
        let testFile = '(none)';
        
        try {
            // using grep for fast scanning
            const result = execSync(`grep -rl "${storyId}" ${testsDir}`, { encoding: 'utf8' });
            const files = result.trim().split('\n').filter(Boolean);
            if (files.length > 0) {
                testFile = files[0];
                testCount = files.length;
            }
        } catch (e) {
            // grep throws error if no matches found
        }
        
        const coverage = testCount > 0 ? '✅' : '❌';
        outputCsv += `${storyId},Placeholder Title,${testFile},${testCount},${coverage}\n`;
    }

    const outDir = path.resolve(process.cwd(), 'docs/MASTER_PACK/13-test-cases');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    
    fs.writeFileSync(path.join(outDir, 'COVERAGE_MATRIX.csv'), outputCsv);
    console.log(`✅ Mapping complete. Coverage matrix generated at docs/MASTER_PACK/13-test-cases/COVERAGE_MATRIX.csv`);
}

// execute
if (require.main === module) {
    runMapping();
}
