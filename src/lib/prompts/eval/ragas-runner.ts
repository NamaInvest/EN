import { evaluatePromptOutput } from './llm-judge';
import { getPrompt, renderPrompt } from '../registry';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface GoldenTestCase {
    query: string;
    context: Record<string, any>;
    expectedKeyIdeas: string[];
}

// Minimal Golden Dataset for the "cfo.daily_summary" prompt
const CFO_GOLDEN_DATASET: GoldenTestCase[] = [
    {
        query: "أعطني ملخص اليوم",
        context: {
            todaySales: 15000,
            todayPurchases: 2000,
            todayExpenses: 500,
            todayProfit: 12500,
            treasuryBalance: 50000,
            lowStockCount: 2,
            topProductsList: "أيفون 15, سامسونج جالاكسي"
        },
        expectedKeyIdeas: ["مبيعات 15000", "صافي ربح 12500", "أيفون 15"]
    }
];

export async function runEvalSuite(promptKey: string) {
    console.log(`[EvalSuite] Starting eval for ${promptKey}...`);
    
    // 1. Fetch Prompt
    const promptDef = await getPrompt(promptKey, null);
    if (!promptDef) {
        throw new Error(`Prompt ${promptKey} not found.`);
    }

    const model = genAI.getGenerativeModel({
        model: promptDef.modelHint || 'gemini-2.5-flash',
        systemInstruction: promptDef.systemPrompt
    });

    let totalScore = 0;
    
    // 2. Run Tests
    const dataset = promptKey === 'cfo.daily_summary' ? CFO_GOLDEN_DATASET : [];
    
    if (dataset.length === 0) {
        console.log(`[EvalSuite] No golden dataset found for ${promptKey}`);
        return { averageScore: 0, testsRun: 0 };
    }

    for (const testCase of dataset) {
        const userPrompt = renderPrompt(promptDef.userTemplate, testCase.context);
        
        // Generate AI Output
        const result = await model.generateContent(userPrompt);
        const aiOutput = result.response.text();
        
        // Evaluate
        const evalResult = await evaluatePromptOutput(
            JSON.stringify(testCase.context),
            testCase.query,
            aiOutput
        );

        console.log(`Score: ${evalResult.score} | Reasoning: ${evalResult.reasoning}`);
        totalScore += evalResult.score;
    }

    const averageScore = totalScore / dataset.length;
    console.log(`[EvalSuite] Eval finished. Average Score: ${averageScore.toFixed(2)}`);
    
    return {
        averageScore,
        testsRun: dataset.length
    };
}
