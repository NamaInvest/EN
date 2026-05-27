# SIEM SMOKE TEST RESULT (نتائج اختبار الدخان لـ SIEM)

This document is to be filled out by the security operator during staging or production verification.
يتم تعبئة هذا المستند من قبل مشغل الأمان عند إجراء أول اختبار دخان ميداني على السيرفر.

---

### **Environment (بيئة الاختبار)**
*   [ ] Staging (البيئة التجريبية)
*   [ ] Production (البيئة الإنتاجية الفعلية)

### **Date of Test (تاريخ الاختبار)**
`YYYY-MM-DD`

---

### **Checks Checklist (جدول فحوصات التحقق)**

| Check Item (البند) | Status (الحالة) | Operator Notes & Evidence (ملاحظات وقرائن المشغل) |
| :--- | :--- | :--- |
| **1. Dashboard opens:**<br>*(فتح واجهة الـ SIEM بنجاح بدون أخطاء 401/403 للأدوار المسموحة)* | `[ ] PASS` <br> `[ ] FAIL` | |
| **2. AUTH_FAIL appears:**<br>*(ظهور تلميتري فشل المصادقة الآمن عند كتابة بيانات خطأ)* | `[ ] PASS` <br> `[ ] FAIL` | |
| **3. RBAC_DENIED appears:**<br>*(ظهور تلميتري رفض الصلاحية عند محاولة الدخول لمسار مقيد)* | `[ ] PASS` <br> `[ ] FAIL` | |
| **4. RBAC_CRAWL detected:**<br>*(كشف نمط زحف الصلاحيات عند تكرار الرفض 3+ مرات)* | `[ ] PASS` <br> `[ ] FAIL` <br> `[ ] N/A` | |
| **5. API_BRUTE_FORCE detected:**<br>*(كشف نمط القوة الغاشمة للواجهات عند تكرار الفشل 5+ مرات)* | `[ ] PASS` <br> `[ ] FAIL` <br> `[ ] N/A` | |
| **6. OFF_HOURS_BYPASS detected:**<br>*(كشف نمط التخطي الأمني للمسؤولين خارج ساعات الدوام)* | `[ ] PASS` <br> `[ ] FAIL` <br> `[ ] N/A` | |
| **7. CSV export works:**<br>*(نجاح تصدير البيانات بصيغة CSV وسلامة الأحرف العربية)* | `[ ] PASS` <br> `[ ] FAIL` | |
| **8. API response acceptable:**<br>*(سرعة استجابة ال API ضمن الحدود المقبولة 50ms - 150ms)* | `[ ] PASS` <br> `[ ] FAIL` | |
| **9. No unexpected errors:**<br>*(عدم وجود أي أخطاء أو تحذيرات غير متوقعة في لوحة المتصفح)* | `[ ] PASS` <br> `[ ] FAIL` | |

---

### **Operator Notes (ملاحظات المشغل الإضافية)**
*(اكتب أي ملاحظات تقنية أو سلوك غير معتاد تم رصده أثناء الاختبار هنا)*

---

### **Final Result (النتيجة النهائية للاختبار)**
`PASS` / `PARTIAL` / `FAIL`

---

*   **Operator Signature (توقيع مشغل الأمان):** _____________________
*   **Sign-off Date (تاريخ إغلاق التقرير):** _____________________
