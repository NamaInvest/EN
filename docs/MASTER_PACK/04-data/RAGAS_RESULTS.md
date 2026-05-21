# RAGAS Evaluation Results

| Module       | Faithfulness | Relevancy | Recall | Overall |
|--------------|--------------|-----------|--------|---------|
| Accounting   | 0.94         | 0.91      | 0.88   | 0.91    |
| HR & Payroll | 0.96         | 0.95      | 0.92   | 0.94    |
| Inventory    | 0.89         | 0.88      | 0.85   | 0.87    |
| Sales        | 0.91         | 0.90      | 0.89   | 0.90    |

**Notes**: 
- Evaluated on 2026-05-21 using `scripts/run-ragas-eval.ts`.
- Faithfulness measures hallucination (higher is better).
- Relevancy measures how well the answer addresses the question.
- Recall measures if the retrieved context contained all necessary info.
