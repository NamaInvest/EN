import fs from 'fs';
import path from 'path';

const STORIES_DIR = path.join(process.cwd(), 'docs/user-stories');
const TESTS_DIR = path.join(process.cwd(), 'tests');
const OUTPUT_CSV = path.join(process.cwd(), 'docs/MASTER_PACK/13-test-cases/COVERAGE_MATRIX.csv');

function walkDir(dir: string, ext: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(filePath, ext));
        } else if (filePath.endsWith(ext)) {
            results.push(filePath);
        }
    }
    return results;
}

function run() {
    console.log('Mapping stories to tests...');
    
    // Find all story IDs from user stories
    const storyFiles = walkDir(STORIES_DIR, '.md');
    const stories: { id: string, title: string, tests: string[] }[] = [];

    for (const sf of storyFiles) {
        const content = fs.readFileSync(sf, 'utf8');
        // Match headers like "## US-sales-01: Create Invoice"
        const regex = /##\s+(US-[a-z]+-\d+):\s+(.*)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            stories.push({ id: match[1], title: match[2].trim(), tests: [] });
        }
    }

    if (stories.length === 0) {
        console.warn('⚠️ No stories found. Make sure docs/user-stories/ has markdown files with ## US-xxx-NN headers.');
    }

    // Find all test files
    const testFiles = walkDir(TESTS_DIR, '.test.ts').concat(walkDir(TESTS_DIR, '.spec.ts'));
    
    // Map them
    for (const tf of testFiles) {
        const content = fs.readFileSync(tf, 'utf8');
        for (const story of stories) {
            if (content.includes(story.id)) {
                story.tests.push(tf.replace(process.cwd(), ''));
            }
        }
    }

    // Write CSV
    let csv = 'StoryID,StoryTitle,TestFiles,TestCount,Coverage\n';
    for (const story of stories) {
        const hasTests = story.tests.length > 0;
        csv += `${story.id},"${story.title}","${story.tests.join('; ')}",${story.tests.length},${hasTests ? '✅' : '❌'}\n`;
    }

    const outDir = path.dirname(OUTPUT_CSV);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_CSV, csv);
    console.log(`✅ Coverage matrix written to ${OUTPUT_CSV}`);
}

run();
