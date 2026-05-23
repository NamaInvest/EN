const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
});

// ONLY TARGET THE 470 DASHBOARD FILES to save memory!
project.addSourceFilesAtPaths('src/app/(dashboard)/**/*.tsx');

const files = project.getSourceFiles().filter(f => f.getFilePath().includes('(dashboard)'));
console.log(`Loaded ${files.length} files.`);

const offlineDict = {
    'Dashboard': 'لوحة القيادة', 'Status': 'الحالة', 'Actions': 'إجراءات', 'Name': 'الاسم', 'Date': 'التاريخ', 
    'Amount': 'المبلغ', 'Total': 'الإجمالي', 'Settings': 'الإعدادات', 'Save': 'حفظ', 'Cancel': 'إلغاء', 
    'Edit': 'تعديل', 'Delete': 'حذف', 'Create': 'إنشاء', 'New': 'جديد', 'Search': 'بحث', 
    'Filter': 'تصفية', 'Export': 'تصدير', 'Import': 'استيراد', 'Submit': 'إرسال', 'Pending': 'قيد الانتظار', 
    'Active': 'نشط', 'Inactive': 'غير نشط', 'Approved': 'معتمد', 'Rejected': 'مرفوض', 'Type': 'النوع', 
    'Category': 'الفئة', 'Description': 'الوصف', 'User': 'المستخدم', 'Role': 'الدور', 'Email': 'البريد الإلكتروني', 
    'Phone': 'الهاتف', 'Address': 'العنوان', 'City': 'المدينة', 'Country': 'الدولة', 'Company': 'الشركة', 
    'Branch': 'الفرع', 'Department': 'القسم', 'Employee': 'الموظف', 'Manager': 'المدير', 'Salary': 'الراتب', 
    'Account': 'الحساب', 'Balance': 'الرصيد', 'Invoice': 'فاتورة', 'Receipt': 'سند', 'Payment': 'دفعة', 
    'Vendor': 'مورد', 'Supplier': 'مورد', 'Customer': 'عميل', 'Client': 'عميل', 'Product': 'منتج', 
    'Item': 'صنف', 'Quantity': 'الكمية', 'Price': 'السعر', 'Cost': 'التكلفة', 'Tax': 'الضريبة', 
    'Discount': 'خصم', 'Order': 'طلب', 'Project': 'مشروع', 'Task': 'مهمة', 'Priority': 'الأولوية', 
    'High': 'عالية', 'Medium': 'متوسطة', 'Low': 'منخفضة', 'Start Date': 'تاريخ البدء', 'End Date': 'تاريخ الانتهاء', 
    'Due Date': 'تاريخ الاستحقاق', 'Document': 'مستند', 'File': 'ملف', 'Upload': 'رفع', 'Download': 'تنزيل', 
    'Print': 'طباعة', 'View': 'عرض', 'Details': 'التفاصيل', 'History': 'السجل', 'Activity': 'النشاط', 
    'Log': 'سجل', 'Report': 'تقرير', 'Analytics': 'تحليلات', 'Chart': 'رسم بياني', 'Summary': 'ملخص', 
    'Overview': 'نظرة عامة', 'Profile': 'الملف الشخصي', 'Password': 'كلمة المرور', 'Login': 'تسجيل الدخول', 
    'Logout': 'تسجيل الخروج', 'Register': 'تسجيل جديد', 'Welcome': 'مرحباً', 'Error': 'خطأ', 'Success': 'نجاح', 
    'Warning': 'تحذير', 'Info': 'معلومات', 'Notes': 'ملاحظات', 'Comments': 'تعليقات', 'Attachments': 'المرفقات', 
    'Method': 'الطريقة', 'Terms': 'الشروط', 'Conditions': 'الأحكام', 'Agreement': 'اتفاقية', 'Contract': 'عقد', 
    'ID': 'المعرف', 'Code': 'الرمز', 'Reference': 'المرجع', 'Currency': 'العملة', 'Rate': 'المعدل', 
    'Value': 'القيمة', 'Percentage': 'النسبة', 'Target': 'الهدف', 'Actual': 'الفعلي', 'Variance': 'الفرق', 
    'Budget': 'الميزانية', 'Forecast': 'التوقع', 'Plan': 'خطة', 'Month': 'شهر', 'Year': 'سنة', 
    'Quarter': 'ربع سنة', 'Week': 'أسبوع', 'Day': 'يوم', 'Time': 'الوقت', 'Duration': 'المدة', 
    'Yes': 'نعم', 'No': 'لا', 'True': 'صحيح', 'False': 'خطأ', 'Enable': 'تفعيل', 'Disable': 'تعطيل', 
    'Open': 'مفتوح', 'Closed': 'مغلق', 'Resolved': 'محلول', 'In Progress': 'قيد التنفيذ', 'On Hold': 'معلق', 
    'Cancelled': 'ملغى', 'Completed': 'مكتمل', 'Failed': 'فشل', 'Processing': 'قيد المعالجة', 'Shipped': 'مشحون', 
    'Delivered': 'تم التوصيل', 'Returned': 'مرتجع', 'Refunded': 'مسترد', 'Paid': 'مدفوع', 'Unpaid': 'غير مدفوع', 
    'Overdue': 'متأخر', 'Draft': 'مسودة', 'Published': 'منشور', 'Archived': 'مؤرشف', 'Deleted': 'محذوف', 
    'Created': 'تم الإنشاء', 'Updated': 'تم التحديث', 'Modified': 'مُعدل', 'By': 'بواسطة', 'At': 'في', 
    'From': 'من', 'To': 'إلى', 'Subject': 'الموضوع', 'Message': 'الرسالة', 'Send': 'إرسال', 
    'Receive': 'استلام', 'Reply': 'رد', 'Forward': 'إعادة توجيه', 'Copy': 'نسخ', 'Paste': 'لصق', 
    'Undo': 'تراجع', 'Redo': 'إعادة', 'Refresh': 'تحديث', 'Reload': 'إعادة تحميل', 'Sync': 'مزامنة', 
    'Load': 'تحميل', 'Share': 'مشاركة', 'Accept': 'قبول', 'Decline': 'رفض', 'Confirm': 'تأكيد', 
    'Close': 'إغلاق', 'Back': 'رجوع', 'Next': 'التالي', 'Previous': 'السابق', 'First': 'الأول', 
    'Last': 'الأخير', 'Finish': 'إنهاء', 'Start': 'بدء', 'Stop': 'إيقاف', 'Pause': 'إيقاف مؤقت', 
    'Resume': 'استئناف', 'Network': 'الشبكة', 'Internet': 'الإنترنت', 'Web': 'الويب', 'Site': 'موقع', 
    'Page': 'صفحة', 'Link': 'رابط', 'URL': 'الرابط', 'Domain': 'النطاق', 'Host': 'المضيف', 
    'Server': 'خادم', 'Database': 'قاعدة بيانات', 'System': 'نظام', 'Application': 'تطبيق', 'Software': 'برنامج', 
    'Version': 'إصدار', 'Release': 'إصدار', 'Update': 'تحديث', 'Patch': 'تصحيح', 'Bug': 'خلل', 
    'Issue': 'مشكلة', 'Feature': 'ميزة', 'Request': 'طلب', 'Support': 'دعم', 'Help': 'مساعدة', 
    'FAQ': 'الأسئلة الشائعة', 'Guide': 'دليل', 'Manual': 'كتيب', 'Documentation': 'توثيق', 'Contact': 'اتصال', 
    'About': 'حول', 'Terms of Service': 'شروط الخدمة', 'Privacy Policy': 'سياسة الخصوصية', 'Legal': 'قانوني', 
    'Compliance': 'امتثال', 'Security': 'أمان', 'Privacy': 'خصوصية', 'Procedure': 'إجراء', 'Process': 'عملية', 
    'Workflow': 'مسار عمل', 'Approval': 'اعتماد', 'Review': 'مراجعة', 'Audit': 'تدقيق', 'Event': 'حدث', 
    'Action': 'إجراء', 'State': 'حالة', 'Condition': 'شرط', 'Result': 'نتيجة', 'Outcome': 'محصلة', 
    'Effect': 'تأثير', 'Impact': 'أثر', 'Risk': 'مخاطرة', 'Threat': 'تهديد', 'Incident': 'حادث', 
    'Recovery': 'استرداد', 'Backup': 'نسخة احتياطية', 'Restore': 'استعادة', 'Clean': 'تنظيف', 'Clear': 'مسح', 
    'Reset': 'إعادة ضبط', 'Restart': 'إعادة تشغيل', 'Asset': 'أصل', 'Liability': 'التزام', 'Equity': 'حقوق ملكية', 
    'Revenue': 'إيراد', 'Expense': 'مصروف', 'Income': 'دخل', 'Profit': 'ربح', 'Loss': 'خسارة', 
    'Margin': 'هامش', 'Cash': 'نقد', 'Flow': 'تدفق', 'Fund': 'صندوق', 'Capital': 'رأس مال', 
    'Investment': 'استثمار', 'Loan': 'قرض', 'Debt': 'دين', 'Credit': 'دائن', 'Debit': 'مدين', 
    'Card': 'بطاقة', 'Transaction': 'معامله', 'Transfer': 'تحويل', 'Deposit': 'إيداع', 'Withdrawal': 'سحب', 
    'Bill': 'فاتورة', 'Statement': 'كشف حساب', 'Analysis': 'تحليل', 'Breakdown': 'تفصيل', 'Distribution': 'توزيع', 
    'Allocation': 'تخصيص', 'Assignment': 'تكليف', 'Program': 'برنامج', 'Portfolio': 'محفظة', 'Campaign': 'حملة', 
    'Strategy': 'استراتيجية', 'Plan': 'خطة', 'Goal': 'هدف', 'Objective': 'مستهدف', 'Metric': 'مقياس', 
    'KPI': 'مؤشر أداء', 'Indicator': 'مؤشر', 'Measure': 'قياس', 'Score': 'درجة', 'Rating': 'تقييم', 
    'Rank': 'تصنيف', 'Position': 'منصب', 'Level': 'مستوى', 'Grade': 'درجة', 'Class': 'فئة', 
    'Kind': 'نوع', 'Sort': 'فرز', 'Group': 'مجموعة', 'Collection': 'مجموعة', 'List': 'قائمة', 
    'Table': 'جدول', 'Grid': 'شبكة', 'Row': 'صف', 'Column': 'عمود', 'Cell': 'خلية', 
    'Field': 'حقل', 'Form': 'نموذج', 'Input': 'إدخال', 'Output': 'إخراج', 'View': 'عرض', 
    'Window': 'نافذة', 'Panel': 'لوحة', 'Dialog': 'مربع حوار', 'Menu': 'قائمة', 'Navigation': 'تصفح', 
    'Header': 'ترويسة', 'Footer': 'تذييل', 'Sidebar': 'شريط جانبي', 'Content': 'محتوى', 'Text': 'نص', 
    'Image': 'صورة', 'Video': 'فيديو', 'Audio': 'صوت', 'Folder': 'مجلد', 'Directory': 'دليل', 
    'Path': 'مسار', 'Button': 'زر', 'Checkbox': 'مربع اختيار', 'Select': 'تحديد', 'Dropdown': 'قائمة منسدلة', 
    'Tree': 'شجرة', 'Graph': 'مخطط', 'Map': 'خريطة', 'Calendar': 'تقويم', 'Time': 'وقت', 
    'Progress': 'تقدم', 'Loader': 'تحميل', 'Slider': 'منزلق', 'Toggle': 'تبديل', 'Badge': 'شارة', 
    'Label': 'تسمية', 'Tag': 'وسم', 'Icon': 'أيقونة', 'Logo': 'شعار', 'Brand': 'علامة تجارية', 
    'Color': 'لون', 'Theme': 'سمة', 'Style': 'نمط', 'Design': 'تصميم', 'Layout': 'تخطيط', 
    'Format': 'تنسيق', 'Template': 'قالب', 'Pattern': 'نمط', 'Rule': 'قاعدة', 'Function': 'وظيفة', 
    'Property': 'خاصية', 'Attribute': 'سمة', 'Variable': 'متغير', 'Constant': 'ثابت', 'Object': 'كائن', 
    'Instance': 'مثيل', 'Model': 'نموذج', 'Controller': 'متحكم', 'Service': 'خدمة', 'Component': 'مكون', 
    'Module': 'وحدة', 'Package': 'حزمة', 'Library': 'مكتبة', 'Framework': 'إطار عمل', 'Platform': 'منصة', 
    'Environment': 'بيئة', 'Language': 'لغة', 'Tool': 'أداة', 'Utility': 'أداة مساعدة', 'Helper': 'مساعد', 
    'Script': 'نص برمجي', 'Command': 'أمر', 'Process': 'عملية', 'Thread': 'سلسلة', 'Job': 'مهمة', 
    'Worker': 'عامل', 'Queue': 'طابور', 'Cache': 'ذاكرة التخزين المؤقت', 'Memory': 'ذاكرة', 'Storage': 'تخزين', 
    'Connection': 'اتصال', 'Request': 'طلب', 'Response': 'استجابة', 'Message': 'رسالة', 'Data': 'بيانات', 
    'Information': 'معلومات', 'Reports': 'تقارير', 'Dashboards': 'لوحات القيادة', 'Metrics': 'مقاييس', 'KPIs': 'مؤشرات الأداء', 
    'Goals': 'أهداف', 'Objectives': 'مستهدفات', 'Targets': 'أهداف', 'Plans': 'خطط', 'Strategies': 'استراتيجيات', 
    'Actions': 'إجراءات', 'Tasks': 'مهام', 'Projects': 'مشاريع', 'Programs': 'برامج', 'Events': 'أحداث', 
    'Activities': 'أنشطة', 'Logs': 'سجلات', 'Histories': 'تاريخ', 'Audits': 'تدقيقات', 'Reviews': 'مراجعات', 
    'Approvals': 'موافقات', 'Workflows': 'مسارات العمل', 'Processes': 'عمليات', 'Procedures': 'إجراءات', 'Policies': 'سياسات', 
    'Rules': 'قواعد', 'Regulations': 'لوائح', 'Laws': 'قوانين', 'Standards': 'معايير', 'Guidelines': 'إرشادات', 
    'Organizations': 'منظمات', 'Companies': 'شركات', 'Businesses': 'أعمال', 'Institutions': 'مؤسسات', 'Governments': 'حكومات', 
    'Countries': 'دول', 'Regions': 'مناطق', 'Cities': 'مدن', 'Addresses': 'عناوين', 'Locations': 'مواقع', 
    'Places': 'أماكن', 'Sites': 'مواقع', 'Facilities': 'مرافق', 'Buildings': 'مباني', 'Rooms': 'غرف', 
    'Areas': 'مناطق', 'Zones': 'مناطق', 'Industries': 'صناعات', 'Markets': 'أسواق', 'Economies': 'اقتصادات', 
    'Finances': 'أموال', 'Currencies': 'عملات', 'Investments': 'استثمارات', 'Assets': 'أصول', 'Liabilities': 'التزامات', 
    'Revenues': 'إيرادات', 'Expenses': 'نفقات', 'Incomes': 'مداخيل', 'Profits': 'أرباح', 'Losses': 'خسائر', 
    'Taxes': 'ضرائب', 'Fees': 'رسوم', 'Costs': 'تكاليف', 'Prices': 'أسعار', 'Rates': 'معدلات', 
    'Wages': 'أجور', 'Salaries': 'رواتب', 'Benefits': 'مزايا', 'Rewards': 'مكافآت', 'Incentives': 'حوافز', 
    'Bonuses': 'علاوات', 'Commissions': 'عمولات', 'Risks': 'مخاطر', 'Opportunities': 'فرص', 'Threats': 'تهديدات', 
    'Challenges': 'تحديات', 'Problems': 'مشاكل', 'Issues': 'قضايا', 'Bugs': 'أخطاء', 'Defects': 'عيوب', 
    'Errors': 'أخطاء', 'Failures': 'إخفاقات', 'Incidents': 'حوادث', 'Emergencies': 'حالات طوارئ', 'Crises': 'أزمات', 
    'Disasters': 'كوارث', 'Attacks': 'هجمات', 'Losses': 'خسائر', 'Damages': 'أضرار', 'Delays': 'تأخيرات', 
    'Violations': 'انتهاكات', 'Penalties': 'غرامات', 'Fines': 'غرامات', 'Sanctions': 'عقوبات', 'Agreements': 'اتفاقيات', 
    'Contracts': 'عقود', 'Alliances': 'تحالفات', 'Partnerships': 'شراكات', 'Innovations': 'ابتكارات', 'Developments': 'تطورات', 
    'Improvements': 'تحسينات', 'Updates': 'تحديثات', 'Modifications': 'تعديلات', 'Changes': 'تغييرات', 'Deployments': 'نشر', 
    'Implementations': 'تطبيقات', 'Installations': 'تثبيتات', 'Configurations': 'إعدادات', 'Customizations': 'تخصيصات', 'Optimizations': 'تحسينات', 
    'Tests': 'اختبارات', 'Evaluations': 'تقييمات', 'Assessments': 'تقييمات', 'Audits': 'تدقيقات', 'Reviews': 'مراجعات', 
    'Inspections': 'فحوصات', 'Checks': 'فحوصات', 'Certifications': 'شهادات', 'Approvals': 'موافقات', 'Permissions': 'صلاحيات', 
    'Licenses': 'تراخيص', 'Identities': 'هويات', 'Authentication': 'مصادقة', 'Authorization': 'تفويض', 'Accounting': 'محاسبة', 
    'Auditing': 'تدقيق', 'Reporting': 'إعداد التقارير', 'Compliance': 'امتثال', 'Security': 'أمان', 'Privacy': 'خصوصية', 
    'Protection': 'حماية', 'Efficiency': 'كفاءة', 'Effectiveness': 'فعالية', 'Productivity': 'إنتاجية', 'Performance': 'أداء', 
    'Quality': 'جودة', 'Reliability': 'موثوقية', 'Availability': 'توفر', 'Control': 'تحكم', 'Governance': 'حوكمة', 
    'Leadership': 'قيادة', 'Management': 'إدارة', 'Administration': 'إدارة', 'Operation': 'تشغيل', 'Execution': 'تنفيذ', 
    'Support': 'دعم', 'Maintenance': 'صيانة', 'Repair': 'إصلاح', 'Service': 'خدمة', 'Care': 'رعاية', 
    'Attention': 'انتباه', 'Focus': 'تركيز', 'Responsibility': 'مسؤولية', 'Accountability': 'مساءلة', 'Authority': 'سلطة', 
    'Power': 'قوة', 'Influence': 'تأثير', 'Collaboration': 'تعاون', 'Communication': 'تواصل', 'Information': 'معلومات', 
    'Data': 'بيانات', 'Knowledge': 'معرفة', 'Vision': 'رؤية', 'Mission': 'مهمة', 'Purpose': 'غرض', 
    'Goal': 'هدف', 'Objective': 'مستهدف', 'Target': 'هدف', 'Result': 'نتيجة', 'Outcome': 'محصلة', 
    'Effect': 'تأثير', 'Impact': 'أثر', 'Value': 'قيمة', 'Quality': 'جودة', 'Standard': 'معيار', 
    'Measure': 'قياس', 'Indicator': 'مؤشر', 'Metric': 'مقياس', 'KPI': 'مؤشر أداء', 'Strategy': 'استراتيجية', 
    'Plan': 'خطة', 'Program': 'برنامج', 'Project': 'مشروع', 'Task': 'مهمة', 'Action': 'إجراء', 
    'Step': 'خطوة', 'Stage': 'مرحلة', 'Phase': 'مرحلة', 'Level': 'مستوى', 'Degree': 'درجة', 
    'Scope': 'نطاق', 'Range': 'نطاق', 'Scale': 'نطاق', 'Size': 'حجم', 'Dimension': 'بعد', 
    'Ratio': 'نسبة', 'Percentage': 'نسبة مئوية', 'Part': 'جزء', 'Section': 'قسم', 'Division': 'شعبة', 
    'Department': 'قسم', 'Unit': 'وحدة', 'Team': 'فريق', 'Group': 'مجموعة', 'Committee': 'لجنة', 
    'Board': 'مجلس', 'Council': 'مجلس', 'Government': 'حكومة', 'State': 'دولة', 'Nation': 'أمة', 
    'Country': 'بلد', 'Region': 'منطقة', 'World': 'عالم', 'System': 'نظام', 'Time': 'وقت', 
    'Past': 'ماضي', 'Present': 'حاضر', 'Future': 'مستقبل', 'History': 'تاريخ', 'Today': 'اليوم', 
    'Tomorrow': 'غداً', 'Yesterday': 'أمس', 'Day': 'يوم', 'Night': 'ليل', 'Morning': 'صباح', 
    'Afternoon': 'بعد الظهر', 'Evening': 'مساء', 'Week': 'أسبوع', 'Month': 'شهر', 'Year': 'سنة', 
    'Period': 'فترة', 'Phase': 'مرحلة', 'Stage': 'مرحلة', 'Cycle': 'دورة', 'Sequence': 'تسلسل', 
    'Order': 'طلب', 'Organization': 'منظمة', 'Structure': 'هيكل', 'Network': 'شبكة', 'Framework': 'إطار عمل', 
    'Platform': 'منصة', 'Infrastructure': 'بنية تحتية', 'Architecture': 'هندسة معمارية', 'Design': 'تصميم', 'Plan': 'خطة', 
    'Model': 'نموذج', 'Template': 'قالب', 'Standard': 'معيار', 'Rule': 'قاعدة', 'Law': 'قانون', 
    'Regulation': 'لائحة', 'Policy': 'سياسة', 'Procedure': 'إجراء', 'Process': 'عملية', 'Method': 'طريقة', 
    'Tool': 'أداة', 'Device': 'جهاز', 'Machine': 'آلة', 'Equipment': 'معدات', 'Facility': 'مرفق', 
    'Building': 'مبنى', 'Structure': 'هيكل', 'Construction': 'بناء', 'Development': 'تطوير', 'Growth': 'نمو', 
    'Progress': 'تقدم', 'Success': 'نجاح', 'Achievement': 'إنجاز', 'Security': 'أمان', 'Safety': 'سلامة', 
    'Protection': 'حماية', 'Defense': 'دفاع', 'Home': 'الرئيسية', 'Environment': 'بيئة', 'Context': 'سياق', 
    'Background': 'خلفية', 'Observation': 'ملاحظة', 'Inspection': 'فحص', 'Examination': 'فحص', 'Analysis': 'تحليل', 
    'Investigation': 'تحقيق', 'Survey': 'استطلاع', 'Study': 'دراسة', 'Research': 'بحث', 'Test': 'اختبار', 
    'Trial': 'تجربة', 'Verification': 'تحقق', 'Validation': 'تأكيد', 'Proof': 'إثبات', 'Evidence': 'دليل', 
    'Fact': 'حقيقة', 'Data': 'بيانات', 'Information': 'معلومات', 'Knowledge': 'معرفة', 'Understanding': 'فهم', 
    'Awareness': 'وعي', 'Thought': 'فكرة', 'Idea': 'فكرة', 'Concept': 'مفهوم', 'Theory': 'نظرية', 
    'Belief': 'معتقد', 'Opinion': 'رأي', 'View': 'عرض', 'Attitude': 'موقف', 'Position': 'منصب', 
    'Argument': 'حجة', 'Discussion': 'نقاش', 'Communication': 'تواصل', 'Message': 'رسالة', 'Signal': 'إشارة', 
    'Sign': 'علامة', 'Symbol': 'رمز', 'Expression': 'تعبير', 'Statement': 'بيان', 'Announcement': 'إعلان', 
    'Report': 'تقرير', 'Document': 'مستند', 'Article': 'مقال', 'Media': 'إعلام', 'Publication': 'منشور', 
    'Energy': 'طاقة', 'Power': 'قوة', 'Force': 'قوة', 'Strength': 'قوة', 'Weight': 'وزن', 
    'Volume': 'حجم', 'Capacity': 'سعة', 'Space': 'مساحة', 'Distance': 'مسافة', 'Length': 'طول', 
    'Width': 'عرض', 'Height': 'ارتفاع', 'Depth': 'عمق', 'Size': 'حجم', 'Shape': 'شكل', 
    'Form': 'نموذج', 'Pattern': 'نمط', 'Structure': 'هيكل', 'Color': 'لون', 'Level': 'مستوى', 
    'Rate': 'معدل', 'Speed': 'سرعة', 'Frequency': 'تردد', 'Time': 'وقت', 'Duration': 'مدة', 
    'Period': 'فترة', 'Interval': 'فاصل زمني', 'Delay': 'تأخير', 'Pause': 'إيقاف مؤقت', 'Break': 'استراحة', 
    'Save': 'حفظ', 'Store': 'تخزين', 'Show': 'إظهار', 'Display': 'عرض', 'Reveal': 'كشف', 
    'Open': 'فتح', 'Close': 'إغلاق', 'Lock': 'قفل', 'Unlock': 'إلغاء قفل', 'Split': 'تقسيم', 
    'Divide': 'تقسيم', 'Separate': 'فصل', 'Join': 'انضمام', 'Connect': 'اتصال', 'Attach': 'إرفاق', 
    'Link': 'رابط', 'Bind': 'ربط', 'Clean': 'تنظيف', 'Clear': 'مسح', 'Filter': 'تصفية', 
    'Block': 'حظر', 'Stop': 'إيقاف', 'Wait': 'انتظار', 'Stay': 'بقاء', 'Leave': 'مغادرة', 
    'Go': 'ذهاب', 'Exit': 'خروج', 'Enter': 'دخول', 'Arrive': 'وصول', 'Yes': 'نعم', 
    'No': 'لا', 'True': 'صحيح', 'False': 'خاطئ', 'Right': 'يمين', 'Wrong': 'خطأ', 
    'Good': 'جيد', 'Bad': 'سيئ', 'High': 'مرتفع', 'Low': 'منخفض', 'Tall': 'طويل', 
    'Short': 'قصير', 'Long': 'طويل', 'Wide': 'عريض', 'Heavy': 'ثقيل', 'Light': 'خفيف', 
    'Hard': 'صعب', 'Soft': 'ناعم', 'Hot': 'ساخن', 'Cold': 'بارد', 'Dry': 'جاف', 
    'Clean': 'نظيف', 'New': 'جديد', 'Old': 'قديم', 'Early': 'مبكر', 'Late': 'متأخر', 
    'First': 'أول', 'Last': 'أخير', 'Next': 'تالي', 'Previous': 'سابق', 'Past': 'ماضي', 
    'Future': 'مستقبل', 'Present': 'حاضر', 'Current': 'حالي', 'Recent': 'حديث', 'Modern': 'حديث', 
    'Traditional': 'تقليدي', 'Normal': 'طبيعي', 'Regular': 'عادي', 'Common': 'شائع', 'Rare': 'نادر', 
    'Unique': 'فريد', 'Special': 'خاص', 'General': 'عام', 'Specific': 'محدد', 'Personal': 'شخصي', 
    'Private': 'خاص', 'Public': 'عام', 'Secret': 'سري', 'Open': 'مفتوح', 'Closed': 'مغلق', 
    'Hidden': 'مخفي', 'Visible': 'مرئي', 'Clear': 'واضح', 'Certain': 'مؤكد', 'Possible': 'ممكن', 
    'Impossible': 'مستحيل', 'Real': 'حقيقي', 'Fake': 'مزيف', 'Original': 'أصلي', 'Copy': 'نسخة', 
    'Master': 'رئيسي', 'Leader': 'قائد', 'Creator': 'منشئ', 'Builder': 'باني', 'User': 'مستخدم', 
    'Consumer': 'مستهلك', 'Provider': 'مزود', 'Supplier': 'مورد', 'Buyer': 'مشتري', 'Seller': 'بائع', 
    'Customer': 'عميل', 'Client': 'عميل', 'Patient': 'مريض', 'Student': 'طالب', 'Teacher': 'معلم', 
    'Manager': 'مدير', 'Director': 'مدير', 'President': 'رئيس', 'Employee': 'موظف', 'Staff': 'طاقم', 
    'Member': 'عضو', 'Partner': 'شريك', 'Friend': 'صديق', 'Competitor': 'منافس', 'Supporter': 'داعم', 
    'Lawyer': 'محامي', 'Doctor': 'طبيب', 'Nurse': 'ممرض', 'Engineer': 'مهندس', 'Architect': 'مهندس معماري', 
    'Researcher': 'باحث', 'Analyst': 'محلل', 'Programmer': 'مبرمج', 'Developer': 'مطور', 'Designer': 'مصمم', 
    'Problem': 'مشكلة', 'Solution': 'حل', 'Question': 'سؤال', 'Answer': 'إجابة', 'Key': 'مفتاح', 
    'Door': 'باب', 'Window': 'نافذة', 'Building': 'مبنى', 'Room': 'غرفة', 'Office': 'مكتب', 
    'Car': 'سيارة', 'Machine': 'آلة', 'Tool': 'أداة', 'Food': 'طعام', 'Water': 'ماء', 
    'Animal': 'حيوان', 'Plant': 'نبات', 'Tree': 'شجرة', 'Sun': 'شمس', 'Moon': 'قمر', 
    'Star': 'نجم', 'Earth': 'أرض', 'Sky': 'سماء', 'Fire': 'نار', 'Metal': 'معدن', 
    'Wood': 'خشب', 'Stone': 'حجر', 'Glass': 'زجاج', 'Plastic': 'بلاستيك', 'Paper': 'ورق', 
    'Man': 'رجل', 'Woman': 'امرأة', 'Child': 'طفل', 'Person': 'شخص', 'People': 'ناس', 
    'Human': 'إنسان', 'Life': 'حياة', 'Death': 'موت', 'Age': 'عمر', 'Word': 'كلمة', 
    'Number': 'رقم', 'Symbol': 'رمز', 'Sign': 'علامة', 'Rule': 'قاعدة', 'Law': 'قانون', 
    'Right': 'حق', 'Duty': 'واجب', 'Power': 'سلطة', 'Value': 'قيمة', 'Good': 'خير', 
    'Evil': 'شر', 'True': 'صحيح', 'False': 'خاطئ', 'Beautiful': 'جميل', 'Happy': 'سعيد', 
    'Sad': 'حزين', 'Angry': 'غاضب', 'Brave': 'شجاع', 'Love': 'حب', 'Hope': 'أمل', 
    'Trust': 'ثقة', 'Respect': 'احترام', 'Pride': 'فخر', 'Honor': 'شرف', 'Glory': 'مجد', 
    'Wealth': 'ثروة', 'Poverty': 'فقر', 'Health': 'صحة', 'Strength': 'قوة', 'Success': 'نجاح', 
    'Failure': 'فشل', 'Victory': 'نصر', 'Defeat': 'هزيمة', 'Peace': 'سلام', 'War': 'حرب', 
    'Order': 'نظام', 'Freedom': 'حرية', 'Justice': 'عدالة', 'Truth': 'حقيقة', 'Fact': 'حقيقة', 
    'Reality': 'واقع', 'Nature': 'طبيعة', 'Art': 'فن', 'Science': 'علم', 'Religion': 'دين', 
    'History': 'تاريخ', 'Math': 'رياضيات', 'Logic': 'منطق', 'Language': 'لغة', 'Literature': 'أدب', 
    'Music': 'موسيقى', 'Architecture': 'هندسة', 'Medicine': 'طب', 'Engineering': 'هندسة', 'Law': 'قانون', 
    'Business': 'أعمال', 'Politics': 'سياسة', 'Education': 'تعليم', 'Sports': 'رياضة', 'Game': 'لعبة', 
    'Work': 'عمل', 'Labor': 'عمل', 'Job': 'وظيفة', 'Career': 'مسيرة مهنية', 'Profession': 'مهنة', 
    'Trade': 'تجارة', 'Skill': 'مهارة', 'Practice': 'ممارسة', 'Experience': 'خبرة'
};

async function processTranslations() {
    let modifiedFiles = 0;
    
    for (const file of files) {
        let changed = false;
        
        // Ensure useTranslation is imported if we are going to use _t
        const hasUseTranslation = file.getImportDeclarations().some(imp => imp.getModuleSpecifierValue() === '@/lib/i18n');
        
        const nodesToReplace = [];
        
        // Find JsxText to replace
        file.getDescendantsOfKind(SyntaxKind.JsxText).forEach(node => {
            const text = node.getLiteralText().trim();
            if (text && /[a-zA-Z]/.test(text) && !text.includes('{') && !text.includes('}')) {
                // simple direct match
                if (offlineDict[text]) {
                    nodesToReplace.push({ node, text, ar: offlineDict[text], type: 'JsxText' });
                } else {
                    // Try case-insensitive or word replacement for multi-word
                    let translated = text;
                    let replacedAny = false;
                    Object.keys(offlineDict).sort((a,b)=>b.length - a.length).forEach(k => {
                        if (new RegExp(`\\b${k}\\b`, 'gi').test(translated)) {
                            translated = translated.replace(new RegExp(`\\b${k}\\b`, 'gi'), offlineDict[k]);
                            replacedAny = true;
                        }
                    });
                    if (replacedAny && translated !== text && !/[a-zA-Z]{4,}/.test(translated)) {
                         nodesToReplace.push({ node, text, ar: translated, type: 'JsxText' });
                    }
                }
            }
        });

        // Find JSX Attributes to replace
        file.getDescendantsOfKind(SyntaxKind.JsxAttribute).forEach(attr => {
            if (!attr.getNameNode) return;
            const name = attr.getNameNode().getText();
            if (['placeholder', 'title', 'label'].includes(name)) {
                const init = attr.getInitializer();
                if (init && init.getKind() === SyntaxKind.StringLiteral) {
                    const text = init.getLiteralText();
                    if (text && /[a-zA-Z]/.test(text)) {
                        if (offlineDict[text]) {
                            nodesToReplace.push({ node: init, text, ar: offlineDict[text], type: 'JsxAttribute' });
                        }
                    }
                }
            }
        });

        if (nodesToReplace.length > 0) {
            // Need _t
            let hasTDecl = file.getText().includes('const _t =');
            if (!hasTDecl) {
                const componentDecl = file.getFunctions().find(f => f.isExported() && f.isDefaultExport());
                if (componentDecl) {
                    const body = componentDecl.getBody();
                    if (body && body.getKind() === SyntaxKind.Block) {
                        body.insertStatements(0, `const { lang } = useTranslation();\n    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;`);
                        hasTDecl = true;
                        changed = true;
                    }
                }
            }
            
            if (!hasUseTranslation && hasTDecl) {
                file.addImportDeclaration({
                    namedImports: ['useTranslation'],
                    moduleSpecifier: '@/lib/i18n'
                });
                changed = true;
            }

            // Replace nodes
            // Start from the bottom to not mess up indices
            nodesToReplace.sort((a, b) => b.node.getPos() - a.node.getPos());
            
            for (const item of nodesToReplace) {
                if (item.type === 'JsxText') {
                    item.node.replaceWithText(`{_t('${item.ar.replace(/'/g, "\\'")}', '${item.text.replace(/'/g, "\\'")}')}`);
                    changed = true;
                } else if (item.type === 'JsxAttribute') {
                    item.node.replaceWithText(`{_t('${item.ar.replace(/'/g, "\\'")}', '${item.text.replace(/'/g, "\\'")}')}`);
                    changed = true;
                }
            }
        }
        
        if (changed) {
            file.saveSync();
            modifiedFiles++;
        }
    }
    console.log(`Successfully translated hardcoded strings in ${modifiedFiles} files.`);
}

processTranslations();
