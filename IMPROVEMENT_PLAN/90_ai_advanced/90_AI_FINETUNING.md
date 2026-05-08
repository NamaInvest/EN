# 90 — AI Fine-tuning | تخصيص النماذج

## 🟡 الأولوية: متوسط (للأداء العالي)

## 🎯 الفلسفة
الـ Off-the-shelf models جيدة، لكن للمصطلحات السعودية المحاسبية والتعقيدات اللهجية، الـ fine-tuning يعطي:
- دقة أعلى
- تكلفة أقل (نموذج أصغر)
- أمان أفضل (privacy)

## 🎯 الخطة

### 90.1 — Use Cases (3 أيام)
**أين الـ fine-tuning مفيد؟**
- ✅ OCR العربي للفواتير السعودية (high volume + repetitive)
- ✅ Saudi accounting NLU (الأسئلة بالعربية → SQL)
- ✅ Saudi compliance Q&A
- ❌ General CFO chat (RAG كافٍ)
- ❌ Code generation (RAG + prompt engineering كافٍ)

### 90.2 — Data Collection (10 أيام)
- 1,000+ Saudi invoices labeled
- 500+ NLU examples (Arabic Q + SQL)
- 300+ compliance Q&A
- Anonymized (no PII)
- Tenant-level consent

### 90.3 — Model Selection (3 أيام)
- **For OCR:** Custom CNN + transformer
- **For NLU:** Llama 3 / Qwen 2.5 (open weights)
- **For compliance:** Gemini Flash fine-tune (when available) أو Llama
- **Hosting:** Ollama / vLLM / HuggingFace endpoints

### 90.4 — Training Pipeline (8 أيام)
```python
# Using HuggingFace + LoRA
from transformers import AutoModelForCausalLM
from peft import LoraConfig, get_peft_model

model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.1-8B")
lora_config = LoraConfig(r=8, lora_alpha=16, target_modules=["q_proj", "v_proj"])
model = get_peft_model(model, lora_config)

# Train on Saudi accounting dataset
trainer.train()
```

### 90.5 — Evaluation (5 أيام)
- Held-out test set
- Compare vs base model
- Per-task metrics
- A/B test in production

### 90.6 — Deployment (5 أيام)
- vLLM server
- Auto-scaling
- Latency < 500ms
- Fallback to API on overload

### 90.7 — Continuous Learning (5 أيام)
- User feedback loop (👍 / 👎)
- Re-training quarterly
- Active learning (label uncertain cases)

### 90.8 — Cost Analysis (3 أيام)
| الخيار | شهرياً |
|--------|-------|
| Gemini Flash API | $X (per token) |
| Self-hosted Llama 8B | $Y (GPU) |
| Self-hosted Qwen 7B | $Z |
| Hybrid (frequent local, complex API) | $W |

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| OCR accuracy (Saudi invoices) | ~85% | > 95% |
| NLU accuracy | غير مقاس | > 90% |
| Cost per query | $X | $X * 0.2 |
| Privacy (no API) | لا | option available |

## ⏱️ المدة: 42 يوم عمل
