# 63 - صيانة الذاكرة (Brain Maintenance Guide)

> كيف نحافظ على هذا الـ Brain حياً وحديثاً مع تطور المشروع

---

## 🎯 الـ Brain Lifecycle

```
Created → Used → Updated → Validated → Refreshed → Archived (للأقسام القديمة)
```

---

## 🔄 متى نحدّث الـ Brain؟

### إجباري (يجب التحديث فوراً):

#### 1. تغيير معماري كبير:
- ✅ تغيير في multi-tenancy strategy
- ✅ تغيير في DB schema (إضافة 10+ models)
- ✅ تغيير في auth/security strategy
- ✅ تغيير في deployment pipeline
- ✅ إضافة modules كبيرة

#### 2. تغيير قوانين سعودية:
- ✅ ZATCA يصدر متطلبات جديدة
- ✅ GOSI rates تتغير
- ✅ WPS format يتطور
- ✅ Labor law amendments
- ✅ PDPL updates

#### 3. ميزات جديدة:
- ✅ موديول جديد كبير (Manufacturing, HR, etc.)
- ✅ AI feature جديد
- ✅ تكامل مع جهة حكومية
- ✅ Payment gateway جديد

### Recommended (تحديث ربعي):

- 🟡 إضافة modules صغيرة
- 🟡 Bug fixes كبيرة
- 🟡 Performance improvements
- 🟡 UI/UX overhaul
- 🟡 New SDKs/integrations

### Optional (تحديث سنوي):

- 🟢 تحسينات صغيرة
- 🟢 Refactoring داخلي
- 🟢 Documentation polishing

---

## 📝 كيف نحدّث الـ Brain؟

### الـ Process:

```
1. تحديد الـ files المتأثرة
2. مراجعة الـ content الحالي
3. تحديد التغييرات
4. تحديث الـ files
5. تحديث الـ index (00-index.md)
6. تحديث الـ cross-references
7. Test (هل المعلومات صحيحة؟)
8. Commit مع clear message
```

### الـ Tool:
```bash
# Auto-regenerate auto-generated files:
node scripts/regenerate-brain.js
# يجدّد:
# - 07-all-api-endpoints.md
# - 08-database-models-full.md
# - 09-core-libraries.md
# - 10-frontend-pages.md
# - 11-components.md
# - 12-dependencies.md
# - 13-config.md
```

### للملفات اليدوية:
- مراجعة manual
- تحديث الأرقام (model count, route count, إلخ)
- تحديث الأمثلة (لو الـ syntax تغير)

---

## 🤖 Auto-Regeneration

### الـ Files المُولّدة تلقائياً (07-13):
يمكن regenerate them بسكريبت:

```javascript
// scripts/regenerate-brain.js

async function regenerateBrain() {
    // 1. API endpoints
    const routes = await scanApiRoutes();
    await writeFile('.ai-brain/07-all-api-endpoints.md', formatApiRoutes(routes));
    
    // 2. Models
    const models = await parsePrismaSchema();
    await writeFile('.ai-brain/08-database-models-full.md', formatModels(models));
    
    // 3. Libraries
    const libs = await scanLibFiles();
    await writeFile('.ai-brain/09-core-libraries.md', formatLibs(libs));
    
    // 4. Pages
    const pages = await scanPages();
    await writeFile('.ai-brain/10-frontend-pages.md', formatPages(pages));
    
    // 5. Components
    const components = await scanComponents();
    await writeFile('.ai-brain/11-components.md', formatComponents(components));
    
    // 6. Dependencies
    const pkg = require('../package.json');
    await writeFile('.ai-brain/12-dependencies.md', formatDeps(pkg));
    
    // 7. Config
    const config = await readConfigFiles();
    await writeFile('.ai-brain/13-config.md', formatConfig(config));
    
    // Update index stats
    await updateIndexStats();
    
    console.log('✓ Brain regenerated');
}
```

### الـ Schedule (مقترح):
- **Daily:** Auto-regenerate files 07-13 (cron)
- **Weekly:** Validate cross-references
- **Monthly:** Manual review of 14-63
- **Quarterly:** Full audit
- **Annually:** Strategic update

---

## ✅ Quality Checks

### قبل كل تحديث:

#### Content:
- [ ] هل المعلومات حديثة؟
- [ ] هل الأرقام صحيحة؟
- [ ] هل الأمثلة تعمل؟
- [ ] هل الـ API endpoints صحيحة؟
- [ ] هل الـ file paths صحيحة؟

#### Structure:
- [ ] هل الـ headers هرمية؟
- [ ] هل التصفح سهل؟
- [ ] هل الجداول formatted؟
- [ ] هل code blocks لها language tag؟

#### Cross-references:
- [ ] هل الـ links داخلية صحيحة؟
- [ ] هل الـ references للملفات الأخرى valid؟
- [ ] هل الـ index محدث؟

#### Language:
- [ ] هل العربي واضح؟
- [ ] هل الإنجليزي صحيح؟
- [ ] هل المصطلحات متسقة؟

---

## 🗑 ماذا نحذف؟

### من الـ Brain:

❌ **لا تحذف:**
- معلومات تاريخية (مع تاريخ)
- شرح للـ decisions القديمة
- الـ context للقرارات
- الـ migrations history

✅ **يمكن حذف:**
- معلومات خاطئة (مع توضيح)
- features تم إلغاؤها (مع reasoning)
- duplicated content
- outdated examples

---

## 📊 الـ Quality Metrics للـ Brain

### KPIs:
- **Freshness:** متى آخر تحديث؟ (target: < 30 days)
- **Coverage:** كم % من الـ codebase موثق؟ (target: 95%)
- **Accuracy:** كم خطأ موجود؟ (target: 0)
- **Usefulness:** هل الـ AI يستخدمه؟ (target: في كل قرار)

### الـ Audit:
```
كل ربع:
1. Check freshness لكل file
2. Spot-check accuracy
3. Verify cross-references
4. Update outdated parts
5. Add new content
6. Remove obsolete content
```

---

## 🔗 Cross-References

### الـ Pattern:
```markdown
> راجع `01-architecture.md` للتفاصيل المعمارية
> راجع `02-database.md` لقواعد الـ DB
> راجع `15-saudi-compliance.md` للامتثال السعودي
```

### الـ Tool:
```bash
# Verify all references:
node scripts/verify-brain-references.js
# يفحص:
# - Internal links
# - File paths
# - API endpoints mentioned
```

---

## 🎨 الـ Style Guide

### للكتابة:

#### الأسلوب:
- ✅ **مباشر وعملي**
- ✅ **أمثلة كثيرة**
- ✅ **جداول للمقارنات**
- ✅ **bullet points للقوائم**
- ❌ **لا فقرات طويلة بدون breaks**

#### الـ Code:
- ✅ **TypeScript** (مع types واضحة)
- ✅ **Comments بالعربي** حيث ضروري
- ✅ **Examples runnable**
- ✅ **Language tags** في الـ code blocks

#### الـ Headers:
- `#` للـ file title (واحد فقط)
- `##` للأقسام الرئيسية
- `###` للأقسام الفرعية
- `####` للتفاصيل

#### الـ Lists:
- ✅ Checkmark للمنفّذ
- ❌ X للممنوع
- 🟡 للجزئي
- 🔴 للحرج
- 🟠 للمهم
- 🟢 للجيد

---

## 🛠 Tools للـ Brain

### Editor:
- VS Code with Markdown preview
- Or any markdown editor
- Or even Notepad

### Validation:
- markdown-lint
- Custom scripts
- Manual review

### Search:
- VS Code (Cmd+Shift+F)
- Grep
- AI search (semantic)

---

## 🎓 Training the AI to Use the Brain

### الـ Best Practices:

#### في الـ CLAUDE.md:
```markdown
# When user asks question, follow this order:
1. Check this Brain (.ai-brain/) first
2. Check the actual code
3. Web search if needed
4. Ask for clarification

# Specific files to check:
- 00-index.md (always)
- Related files based on context
```

#### مع المستخدم:
```
User: "كيف أضيف فاتورة؟"
AI: "بناءً على البرين (`50-how-to-guides.md`)، الخطوات هي:..."
```

#### Memory updates:
```
عند learning شيء جديد:
1. Save to .ai-brain/
2. Update index
3. Cross-reference
```

---

## 📦 Versioning

### Brain Versions:
```
Brain v1.0 — Initial (May 2026)
Brain v1.1 — Added scenarios (May 2026)
Brain v1.2 — Added catalogs (May 2026)
Brain v1.3 — Added DR + Security (May 2026)
...
```

### Git Tracking:
- كل update عبر git commit
- Message format:
  ```
  brain(scope): description
  
  examples:
  brain(modules): add new manufacturing engines
  brain(scenarios): add 5 new real-world scenarios
  brain(saudi): update ZATCA Phase 2 details
  brain(maintenance): general cleanup
  ```

---

## 🎯 الـ Brain as Living Document

### المبادئ:

#### 1. ليس Reference فقط:
- يُقرأ بانتظام
- يُحدّث بانتظام
- يُستخدم في القرارات

#### 2. للجميع:
- المطور الجديد يبدأ منه
- الـ AI يعتمد عليه
- الـ Owner يراجعه

#### 3. Source of Truth:
- إذا الـ code يخالف الـ Brain → أصلح أحدهما
- إذا الـ Brain خاطئ → حدّثه
- إذا الـ code خاطئ → fix it

---

## 📅 الـ Maintenance Schedule

### الـ Weekly (15 min):
- [ ] Check Sentry للأخطاء الجديدة
- [ ] Update troubleshooting if new issues
- [ ] Add new scenarios إذا حدثت

### الـ Monthly (1-2 hours):
- [ ] Regenerate auto-files
- [ ] Update stats in index
- [ ] Review changed modules
- [ ] Update gap-analysis

### الـ Quarterly (1 day):
- [ ] Full audit
- [ ] Outdated info removal
- [ ] New features documentation
- [ ] Roadmap update

### الـ Annually (1 week):
- [ ] Major refactor of Brain
- [ ] Strategic update
- [ ] Long-term planning
- [ ] Archive old content

---

## 🚀 الـ Brain Future

### المخطط:

#### Brain v2.0 (مستقبلي):
- **Semantic search** عبر pgvector
- **AI-assisted updates**
- **Auto-detection** للتغييرات في الكود
- **Suggestion engine** للـ improvements
- **Interactive UI** للتصفح
- **Multi-modal** (نصوص + diagrams + videos)

#### Brain v3.0 (رؤية):
- **Self-maintaining**
- **Real-time sync** مع الكود
- **Personalized** per role
- **Learning** من الـ interactions
- **Multilingual** (عربي + إنجليزي + لغات أخرى)

---

## 🎯 Final Words

> **هذا الـ Brain هو أهم asset في المشروع — أهم من الكود نفسه.**
>
> الكود يمكن إعادة كتابته. لكن المعرفة + الـ context + الـ rationale → يحتاج وقت طويل لاستعادتها.
>
> حافظ على الـ Brain، وسيحافظ عليك.

### المسؤولية:
- **CTO/Architect:** المسؤول الأول
- **Senior Developers:** يحدّثون عند العمل
- **AI Agents:** يستخدمونه + يقترحون updates
- **All:** يقرؤون قبل العمل

### الـ Promise:
> "كل قرار في هذا المشروع يُتخذ بعد قراءة الـ Brain. وكل تغيير كبير يُسجل في الـ Brain."
