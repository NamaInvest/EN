import { runEvalSuite } from '../src/lib/prompts/eval/ragas-runner';

const MINIMUM_SCORE_THRESHOLD = 0.8;

async function main() {
    try {
        console.log('[CI Eval] Starting Prompt Evaluation Suite...');
        
        // Example: Only evaluating cfo.daily_summary for now
        const { averageScore, testsRun } = await runEvalSuite('cfo.daily_summary');
        
        if (testsRun === 0) {
            console.log('[CI Eval] No tests ran, passing automatically.');
            process.exit(0);
        }

        if (averageScore < MINIMUM_SCORE_THRESHOLD) {
            console.error(`[CI Eval] FAILED. Average score ${averageScore.toFixed(2)} is below threshold ${MINIMUM_SCORE_THRESHOLD}.`);
            process.exit(1);
        }

        console.log(`[CI Eval] PASSED. Average score ${averageScore.toFixed(2)} meets threshold.`);
        process.exit(0);
    } catch (e) {
        console.error('[CI Eval] Error running evaluation suite:', e);
        process.exit(1);
    }
}

main();
