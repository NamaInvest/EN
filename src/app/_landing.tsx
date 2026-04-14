// Server Component — NO 'use client' — renders to HTML on server instantly
// v2.0 — April 2026 — Full SSR, no Clerk dependency
import ModuleFilter from './_module-filter';

// ── CATEGORIES ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',        label: 'جميع الوحدات',    icon: '🧩' },
  { id: 'sales',      label: 'المبيعات',         icon: '🛒' },
  { id: 'purchases',  label: 'المشتريات',        icon: '📦' },
  { id: 'finance',    label: 'المالية',          icon: '💰' },
  { id: 'inventory',  label: 'المخزون',          icon: '🏭' },
  { id: 'hr',         label: 'الموارد البشرية',  icon: '👥' },
  { id: 'crm',        label: 'العملاء CRM',      icon: '💬' },
  { id: 'operations', label: 'التشغيل',          icon: '⚙️' },
  { id: 'ai',         label: 'الذكاء الاصطناعي',icon: '🤖' },
  { id: 'system',     label: 'النظام',           icon: '🛡️' },
];

// ── MODULES DATA ─────────────────────────────────────────────────────────────
const MODULES_DATA = [
  // SALES
  { cat: 'sales', path: '/sales', icon: 'ShoppingCart', title: 'نقاط البيع (POS)', desc: 'كاشير متكامل يعمل أونلاين وأوفلاين لجميع أنواع المتاجر.' },
  { cat: 'sales', path: '/invoices', icon: 'Receipt', title: 'فواتير المبيعات', desc: 'إنشاء فواتير ZATCA B2C/B2B بزر واحد مع QR code.' },
  { cat: 'sales', path: '/sales-returns', icon: 'Undo', title: 'مرتجعات المبيعات', desc: 'معالجة المرتجعات مع إشعار دائن مرتبط بالفاتورة الأصلية.' },
  { cat: 'sales', path: '/customers', icon: 'Users', title: 'إدارة العملاء', desc: 'بطاقة عميل شاملة مع تاريخ المعاملات والمديونيات.' },
  { cat: 'sales', path: '/quotations', icon: 'FileText', title: 'عروض الأسعار', desc: 'إنشاء عروض أسعار احترافية وتحويلها لفواتير بضغطة.' },
  { cat: 'sales', path: '/sales-orders', icon: 'ShoppingBag', title: 'أوامر البيع', desc: 'إدارة طلبات البيع مع تتبع حالة التسليم.' },
  { cat: 'sales', path: '/delivery-notes', icon: 'Truck', title: 'سندات التسليم', desc: 'إدارة عمليات التسليم ومتابعة حالة الشحنات.' },
  { cat: 'sales', path: '/price-lists', icon: 'DollarSign', title: 'قوائم الأسعار', desc: 'قوائم أسعار متعددة لعملاء مختلفين وفئات تجارية.' },
  { cat: 'sales', path: '/commissions', icon: 'TrendingUp', title: 'عمولات المبيعات', desc: 'احتساب عمولات المندوبين بمعادلات مخصصة.' },
  { cat: 'sales', path: '/restaurant-pos', icon: 'Coffee', title: 'كاشير المطاعم', desc: 'POS متخصص للمطاعم مع KDS وإدارة الطاولات.' },
  { cat: 'sales', path: '/wholesale', icon: 'Package', title: 'مبيعات الجملة', desc: 'إدارة عمليات البيع بالجملة مع خصومات الكميات.' },

  // PURCHASES
  { cat: 'purchases', path: '/purchases', icon: 'ShoppingCart', title: 'فواتير الشراء', desc: 'تسجيل فواتير الموردين مع استلام البضاعة تلقائياً.' },
  { cat: 'purchases', path: '/purchase-orders', icon: 'FileText', title: 'أوامر الشراء', desc: 'إنشاء طلبات شراء مع موافقة متعددة المستويات.' },
  { cat: 'purchases', path: '/purchase-returns', icon: 'RefreshCcw', title: 'مرتجعات المشتريات', desc: 'إرجاع البضاعة للمورد مع تعديل رصيده تلقائياً.' },
  { cat: 'purchases', path: '/suppliers', icon: 'Briefcase', title: 'إدارة الموردين', desc: 'بطاقة مورد شاملة مع تقييم الأداء والشروط التجارية.' },
  { cat: 'purchases', path: '/grn', icon: 'Archive', title: 'استلام البضاعة (GRN)', desc: 'تسجيل استلام البضاعة مع فحص الكميات والجودة.' },
  { cat: 'purchases', path: '/landed-costs', icon: 'Globe', title: 'Landed Costs', desc: 'توزيع تكاليف الشحن والجمارك على قيمة المستوردات.' },
  { cat: 'purchases', path: '/vendor-evaluation', icon: 'Star', title: 'تقييم الموردين', desc: 'تقييم مستوى الموردين بمعايير الجودة والالتزام.' },

  // FINANCE
  { cat: 'finance', path: '/accounting', icon: 'Calculator', title: 'المحاسبة المالية', desc: 'قيود يومية مزدوجة وميزان مراجعة وقوائم مالية.' },
  { cat: 'finance', path: '/journal', icon: 'Book', title: 'دفتر اليومية', desc: 'تسجيل القيود المحاسبية مع مراجعة وإقفال دوري.' },
  { cat: 'finance', path: '/ledger', icon: 'FileText', title: 'الأستاذ العام', desc: 'تتبع حركات كل حساب مع أرصدة فورية.' },
  { cat: 'finance', path: '/bank', icon: 'Building2', title: 'إدارة البنوك', desc: 'تسوية بنكية أوتوماتيكية ومتابعة الحسابات الجارية.' },
  { cat: 'finance', path: '/cash', icon: 'DollarSign', title: 'الصناديق النقدية', desc: 'متابعة الصناديق اليومية مع إقفال وتسوية فورية.' },
  { cat: 'finance', path: '/zatca', icon: 'Shield', title: 'فاتورة الزكاة (ZATCA)', desc: 'تكامل مجاني مع هيئة الزكاة — المرحلة الثانية B2C & B2B.' },
  { cat: 'finance', path: '/checks', icon: 'CreditCard', title: 'الشيكات والكمبيالات', desc: 'إدارة الشيكات الآجلة والكمبيالات مع تنبيهات الاستحقاق.' },
  { cat: 'finance', path: '/expenses', icon: 'Receipt', title: 'المصاريف', desc: 'تسجيل ومتابعة المصاريف التشغيلية مع التوزيع الإداري.' },
  { cat: 'finance', path: '/budget', icon: 'PieChart', title: 'الميزانية التقديرية', desc: 'تخطيط الميزانية السنوية ومقارنتها بالفعلي.' },
  { cat: 'finance', path: '/tax', icon: 'FileText', title: 'إدارة الضرائب', desc: 'احتساب ضريبة القيمة المضافة وتقارير الإقرار الضريبي.' },
  { cat: 'finance', path: '/cost-centers', icon: 'Target', title: 'مراكز التكلفة', desc: 'توزيع التكاليف على مراكز الربحية والإدارات.' },
  { cat: 'finance', path: '/assets', icon: 'Building2', title: 'الأصول الثابتة', desc: 'إدارة الأصول مع الإهلاك الأوتوماتيكي والتصرف.' },
  { cat: 'finance', path: '/financial-reports', icon: 'BarChart3', title: 'التقارير المالية', desc: 'قائمة الدخل، الميزانية العمومية، التدفقات النقدية.' },

  // INVENTORY
  { cat: 'inventory', path: '/inventory', icon: 'Warehouse', title: 'المخزون الرئيسي', desc: 'إدارة المنتجات مع تتبع الكميات والقيمة فور الحركة.' },
  { cat: 'inventory', path: '/warehouses', icon: 'Building2', title: 'المستودعات', desc: 'إدارة مستودعات متعددة مع نقل بضاعة فوري.' },
  { cat: 'inventory', path: '/stock-transfer', icon: 'RefreshCcw', title: 'تحويل المخزون', desc: 'نقل البضاعة بين الفروع والمستودعات مع توثيق فوري.' },
  { cat: 'inventory', path: '/batches', icon: 'Layers', title: 'الدفعات والصلاحية', desc: 'تتبع الدفعات بـ FEFO مع تنبيه تواريخ الانتهاء.' },
  { cat: 'inventory', path: '/serials', icon: 'Key', title: 'الأرقام التسلسلية', desc: 'تتبع كل منتج بالرقم التسلسلي (للأجهزة والإلكترونيات).' },
  { cat: 'inventory', path: '/stocktaking', icon: 'CheckSquare', title: 'الجرد الدوري', desc: 'إجراء الجرد الفعلي مع تعديل الفروقات أوتوماتيكياً.' },
  { cat: 'inventory', path: '/matrix-items', icon: 'Layers', title: 'أصناف المقاسات والألوان', desc: 'إدارة الأصناف المتعددة الأبعاد (لون، حجم، نمط).' },
  { cat: 'inventory', path: '/bom', icon: 'GitBranch', title: 'قائمة المواد (BOM)', desc: 'تعريف وصفات الإنتاج وحساب التكلفة الفعلية.' },
  { cat: 'inventory', path: '/production', icon: 'Factory', title: 'أوامر التصنيع', desc: 'تتبع أوامر الإنتاج مع استهلاك المواد الخام.' },

  // HR
  { cat: 'hr', path: '/employees', icon: 'Users', title: 'إدارة الموظفين', desc: 'ملف شامل لكل موظف مع المستندات والبيانات الوظيفية.' },
  { cat: 'hr', path: '/payroll', icon: 'DollarSign', title: 'الرواتب والمسير', desc: 'احتساب الرواتب مع خصومات GOSI والضرائب تلقائياً.' },
  { cat: 'hr', path: '/attendance', icon: 'Clock', title: 'الحضور والانصراف', desc: 'تتبع الحضور ببصمة الإصبع أو الوجه مع تقارير التأخير.' },
  { cat: 'hr', path: '/shifts', icon: 'RefreshCcw', title: 'جداول المناوبات', desc: 'تخطيط المناوبات وتوزيع الموظفين على الورديات.' },
  { cat: 'hr', path: '/leaves', icon: 'Calendar', title: 'الإجازات والغياب', desc: 'إدارة طلبات الإجازة مع تقارير الأرصدة المتبقية.' },
  { cat: 'hr', path: '/loans', icon: 'CreditCard', title: 'السلف والقروض', desc: 'إدارة قروض الموظفين مع خصم أقساط من الراتب تلقائياً.' },
  { cat: 'hr', path: '/gosi', icon: 'Shield', title: 'التأمينات الاجتماعية (GOSI)', desc: 'ربط مباشر مع التأمينات واحتساب الاشتراكات الشهرية.' },
  { cat: 'hr', path: '/end-of-service', icon: 'Award', title: 'نهاية الخدمة', desc: 'احتساب مكافأة نهاية الخدمة وفق نظام العمل السعودي.' },
  { cat: 'hr', path: '/departments', icon: 'Building2', title: 'الإدارات والهيكل', desc: 'رسم الهيكل التنظيمي وتوزيع الصلاحيات الإدارية.' },

  // CRM
  { cat: 'crm', path: '/whatsapp', icon: 'MessageSquare', title: 'واتساب CRM', desc: 'حملات تسويقية وتذكيرات فواتير عبر WhatsApp Business API.' },
  { cat: 'crm', path: '/telegram', icon: 'Bot', title: 'بوت تيليجرام', desc: 'إشعارات فورية للمبيعات وموافقات المشتريات عبر Telegram.' },
  { cat: 'crm', path: '/loyalty', icon: 'Heart', title: 'نظام الولاء', desc: 'نقاط مكافأة وكوبونات للعملاء مع تتبع التفاعل.' },
  { cat: 'crm', path: '/crm-leads', icon: 'Target', title: 'إدارة العملاء المحتملين', desc: 'تتبع فرص البيع من الاتصال الأول حتى الإغلاق.' },
  { cat: 'crm', path: '/support', icon: 'HelpCircle', title: 'دعم العملاء', desc: 'نظام تذاكر لمتابعة شكاوى العملاء وطلبات الدعم.' },
  { cat: 'crm', path: '/affiliate', icon: 'Star', title: 'نظام الإحالة', desc: 'برنامج مسرّع نمو SaaS مع تتبع عمولات المحيلين.' },

  // OPERATIONS
  { cat: 'operations', path: '/fleet', icon: 'Car', title: 'إدارة الأسطول', desc: 'تتبع الرحلات واستهلاك الوقود وصيانة المركبات.' },
  { cat: 'operations', path: '/maintenance', icon: 'Wrench', title: 'مراكز الصيانة', desc: 'أوامر إصلاح مع تتبع قطع الغيار وتكاليف الصيانة.' },
  { cat: 'operations', path: '/real-estate', icon: 'Home', title: 'إدارة العقارات', desc: 'عقود إيجار مع إصدار إيصالات إيجار أوتوماتيكية.' },
  { cat: 'operations', path: '/projects', icon: 'Flag', title: 'إدارة المشاريع', desc: 'تخطيط المشاريع وتتبع التكاليف ومراحل التنفيذ.' },
  { cat: 'operations', path: '/branches', icon: 'Map', title: 'إدارة الفروع', desc: 'تشغيل فروع متعددة بمستودعات وصلاحيات مستقلة.' },
  { cat: 'operations', path: '/kiosk', icon: 'Monitor', title: 'كشك الخدمة الذاتية', desc: 'واجهة كشك للعملاء لتسجيل الطلبات ذاتياً.' },
  { cat: 'operations', path: '/delivery-management', icon: 'Truck', title: 'إدارة التوصيل', desc: 'تتبع طلبات التوصيل وتوزيعها على السائقين.' },
  { cat: 'operations', path: '/b2b-portal', icon: 'Globe', title: 'بوابة B2B', desc: 'بوابة إلكترونية للعملاء التجاريين لتقديم الطلبات.' },

  // AI
  { cat: 'ai', path: '/ocr', icon: 'Camera', title: 'قارئ الفواتير (OCR)', desc: 'قراءة فواتير الموردين بالذكاء الاصطناعي Gemini AI تلقائياً.' },
  { cat: 'ai', path: '/ai-reports', icon: 'Bot', title: 'التقارير الذكية', desc: 'تحليل أداء المبيعات وتوقع الطلب بالذكاء الاصطناعي.' },
  { cat: 'ai', path: '/chatbot', icon: 'MessageSquare', title: 'مساعد ذكي', desc: 'مساعد AI للإجابة على استفسارات الموظفين والعمليات.' },

  // SYSTEM
  { cat: 'system', path: '/users', icon: 'Users', title: 'إدارة المستخدمين', desc: 'صلاحيات دقيقة لكل مستخدم على مستوى كل شاشة.' },
  { cat: 'system', path: '/roles', icon: 'Shield', title: 'الأدوار والصلاحيات', desc: 'أدوار مخصصة مع قواعد كشف التعديلات والحذف.' },
  { cat: 'system', path: '/settings', icon: 'Settings', title: 'إعدادات النظام', desc: 'تخصيص شامل للشركة والضرائب والعملات وطرق الدفع.' },
  { cat: 'system', path: '/backup', icon: 'Database', title: 'النسخ الاحتياطي', desc: 'نسخ احتياطي تلقائي للبيانات مع استعادة فورية.' },
  { cat: 'system', path: '/audit-log', icon: 'Activity', title: 'سجل العمليات', desc: 'تتبع جميع تعديلات المستخدمين مع الطابع الزمني.' },
  { cat: 'system', path: '/notifications', icon: 'Bell', title: 'إشعارات النظام', desc: 'تنبيهات فورية للمخزون المنخفض وتواريخ الاستحقاق.' },
  { cat: 'system', path: '/multi-currency', icon: 'Globe', title: 'العملات المتعددة', desc: 'دعم جميع العملات مع أسعار صرف تلقائية.' },
  { cat: 'system', path: '/api-integration', icon: 'Zap', title: 'تكامل API', desc: 'ربط مع منصات خارجية عبر واجهة برمجية آمنة.' },

  // Additional modules to reach 97
  { cat: 'finance', path: '/installments', icon: 'CreditCard', title: 'نظام الأقساط', desc: 'إدارة مبيعات بالأقساط مع جداول السداد التلقائية.' },
  { cat: 'inventory', path: '/purchase-request', icon: 'FileText', title: 'طلبات الشراء الداخلية', desc: 'طلبات شراء من الإدارات مع مسار موافقة.' },
  { cat: 'hr', path: '/incentives', icon: 'Award', title: 'الحوافز والمكافآت', desc: 'نظام مكافآت مرتبط بمؤشرات الأداء.' },
  { cat: 'sales', path: '/subscriptions', icon: 'RefreshCcw', title: 'الاشتراكات الدورية', desc: 'إدارة اشتراكات العملاء مع تجديد تلقائي وفواتير.' },
  { cat: 'operations', path: '/appointments', icon: 'Clock', title: 'إدارة المواعيد', desc: 'جدولة مواعيد العملاء مع تذكيرات تلقائية.' },
  { cat: 'finance', path: '/credit-notes', icon: 'FileText', title: 'الإشعارات الدائنة والمدينة', desc: 'إصدار ومتابعة إشعارات الخصم والإضافة.' },
  { cat: 'crm', path: '/email-marketing', icon: 'Mail', title: 'حملات البريد الإلكتروني', desc: 'إرسال حملات تسويقية عبر إيميل مع تقارير الفتح.' },
  { cat: 'inventory', path: '/min-max', icon: 'AlertTriangle', title: 'نقطة إعادة الطلب', desc: 'تنبيه تلقائي لإعادة الطلب عند مستوى الحد الأدنى.' },
  { cat: 'hr', path: '/training', icon: 'Book', title: 'التدريب والتطوير', desc: 'تتبع برامج التدريب وشهادات الموظفين.' },
  { cat: 'operations', path: '/quality', icon: 'Check', title: 'ضبط الجودة', desc: 'معايير جودة للمنتجات مع بروتوكول الفحص والرفض.' },
  { cat: 'system', path: '/reports-builder', icon: 'BarChart3', title: 'منشئ التقارير', desc: 'بناء تقارير مخصصة بسحب وإفلات الحقول.' },
  { cat: 'ai', path: '/demand-forecasting', icon: 'TrendingUp', title: 'توقع الطلب', desc: 'تحليل نمط المبيعات لتوقع الطلب المستقبلي بالذكاء الاصطناعي.' },
  { cat: 'finance', path: '/lease-contracts', icon: 'FileText', title: 'عقود الإيجار التشغيلي', desc: 'إدارة عقود إيجار الأصول مع استهلاك أوتوماتيكي.' },
  { cat: 'crm', path: '/surveys', icon: 'Star', title: 'استطلاعات الرضا', desc: 'إرسال استبيانات العملاء وتحليل النتائج.' },
  { cat: 'operations', path: '/contracts', icon: 'FileText', title: 'إدارة العقود', desc: 'تتبع عقود الموردين والعملاء مع تنبيهات التجديد.' },
  { cat: 'sales', path: '/tabby-tamara', icon: 'CreditCard', title: 'تابي وتمارا', desc: 'بوابات الدفع بالتقسيط مدمجة في الكاشير مباشرة.' },
  { cat: 'inventory', path: '/consignment', icon: 'Package', title: 'بضاعة الأمانة', desc: 'إدارة بضاعة الأمانة مع الموردين والعملاء.' },
  { cat: 'system', path: '/cloud-sync', icon: 'Cloud', title: 'المزامنة السحابية', desc: 'مزامنة فورية بين الفروع والمستودعات والسحابة.' },
  { cat: 'hr', path: '/biometric', icon: 'Shield', title: 'البصمة البيومترية', desc: 'تكامل مع أجهزة البصمة وكاميرات الوجه للحضور.' },
  { cat: 'finance', path: '/petty-cash', icon: 'DollarSign', title: 'العهد والسلف', desc: 'إدارة العهد المالية وتسوية المصاريف النثرية.' },
  { cat: 'crm', path: '/referral-program', icon: 'Users', title: 'برنامج الإحالة', desc: 'نظام مكافآت للعملاء الذين يحيلون عملاء جدد.' },
  { cat: 'operations', path: '/pharmacy', icon: 'Heart', title: 'الصيدليات والطب', desc: 'وحدة متخصصة للصيدليات مع رقابة الانتهاء الصارمة.' },
  { cat: 'operations', path: '/jewelry', icon: 'Star', title: 'المجوهرات والذهب', desc: 'نظام متخصص لمحلات الذهب مع إدارة الوزن والعيار.' },
  { cat: 'operations', path: '/food-manufacturing', icon: 'Factory', title: 'تصنيع الغذاء', desc: 'وحدات إنتاج متخصصة للمصانع الغذائية مع وصفات.' },
  { cat: 'inventory', path: '/container-tracking', icon: 'Truck', title: 'تتبع الحاويات', desc: 'متابعة حاويات الاستيراد من الميناء حتى المستودع.' },
  { cat: 'system', path: '/multi-company', icon: 'Building2', title: 'الشركات المتعددة', desc: 'إدارة مجموعة شركات من لوحة تحكم موحدة.' },
  { cat: 'finance', path: '/intercompany', icon: 'RefreshCcw', title: 'المعاملات البينية', desc: 'قيود تلقائية للمعاملات بين شركات المجموعة.' },
];

// ── STATS ───────────────────────────────────────────────────────────────────
const STATS = [
  { num: '104+', label: 'وحدة برمجية' },
  { num: '100%', label: 'متوافق ZATCA' },
  { num: '24/7', label: 'دعم فني' },
  { num: 'مجاني', label: 'للتجربة' },
];

// ── FEATURES ─────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '🧾', title: 'فاتورة الزكاة ZATCA', desc: 'ربط مجاني ومباشر مع هيئة الزكاة — المرحلة الثانية كاملة B2C & B2B' },
  { icon: '🤖', title: 'ذكاء اصطناعي OCR', desc: 'قراءة فواتير الموردين تلقائياً بدون إدخال يدوي عبر Gemini AI' },
  { icon: '📱', title: 'واتساب وتيليجرام', desc: 'إشعارات وموافقات وتقارير فورية عبر WhatsApp Business & Telegram Bot' },
  { icon: '🏪', title: 'POS عالمي', desc: 'كاشير يعمل أونلاين وأوفلاين لجميع أنواع المتاجر والمطاعم والخدمات' },
  { icon: '👥', title: 'HR كامل + GOSI', desc: 'رواتب مع خصم GOSI تلقائي، بصمة بيومترية، إجازات، نهاية خدمة' },
  { icon: '🌐', title: 'متعدد الفروع والعملات', desc: 'تشغيل مئات الفروع من لوحة واحدة مع دعم جميع العملات العالمية' },
];

// ── STYLES (SSR-safe inline styles) ─────────────────────────────────────────
const S = {
  // hero
  hero: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0c1a33 100%)',
    color: 'white',
    padding: '80px 20px 100px',
    textAlign: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  heroTitle: {
    fontSize: 'clamp(2.2rem, 6vw, 4rem)',
    fontWeight: 900,
    lineHeight: 1.2,
    marginBottom: '16px',
    letterSpacing: '-0.5px',
  },
  heroSub: {
    fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
    color: '#94a3b8',
    maxWidth: '600px',
    margin: '0 auto 40px',
    lineHeight: 1.7,
  },
  heroAccent: {
    background: 'linear-gradient(90deg, #818cf8, #34d399)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  // stat card
  statGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    gap: '16px',
    maxWidth: '700px',
    margin: '0 auto 48px',
  },
  statCard: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '16px',
    padding: '20px 28px',
    textAlign: 'center' as const,
    minWidth: '130px',
    backdropFilter: 'blur(8px)',
  },
  statNum: {
    fontSize: '2rem',
    fontWeight: 900,
    color: '#818cf8',
    display: 'block',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    marginTop: '4px',
  },
  // CTA buttons
  btnPrimary: {
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: 'white',
    padding: '16px 36px',
    borderRadius: '999px',
    border: 'none',
    fontSize: '1.1rem',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
    fontFamily: "'Cairo', sans-serif",
    transition: 'transform 0.2s',
  },
  btnSecondary: {
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    padding: '16px 36px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.2)',
    fontSize: '1.1rem',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backdropFilter: 'blur(8px)',
    fontFamily: "'Cairo', sans-serif",
  },
  // features
  featuresSection: {
    backgroundColor: '#ffffff',
    padding: '80px 20px',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  featureCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  // final CTA
  ctaSection: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #0f172a 100%)',
    color: 'white',
    padding: '80px 20px',
    textAlign: 'center' as const,
  },
};

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const moduleCount = MODULES_DATA.length;

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15,23,42,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 24px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          maxWidth: '1200px', margin: '0 auto', height: '64px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem',
            }}>🏢</div>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.15rem' }}>
              نما <span style={{ color: '#818cf8' }}>إنفست</span>
            </span>
          </div>

          {/* Nav links + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="https://wa.me/966531206628" target="_blank" rel="noopener noreferrer" style={{
              color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              💬 واتساب
            </a>
            <a href="https://n1.namainvist.com/sign-in" style={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: 'white', padding: '9px 22px', borderRadius: '999px',
              textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem',
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
            }}>
              دخول النظام ←
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={S.hero}>
        {/* Background blur orbs */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', left: '-100px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block', background: 'rgba(99,102,241,0.2)',
            border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: '999px', padding: '6px 18px',
            fontSize: '0.85rem', color: '#a5b4fc', marginBottom: '24px',
          }}>
            ✨ {moduleCount} وحدة برمجية متكاملة — النظام الأشمل في السعودية
          </div>

          <h1 style={S.heroTitle}>
            نظام{' '}
            <span style={S.heroAccent}>نما إنفست</span>
            <br />
            <span style={{ fontSize: '0.7em', color: '#e2e8f0' }}>
              لإدارة أعمالك بالكامل
            </span>
          </h1>

          <p style={S.heroSub}>
            منصة متكاملة تضم <strong style={{ color: 'white' }}>{moduleCount} وحدة برمجية</strong> تغطي كل ما تحتاجه
            — من المحاسبة والمبيعات والمخزون إلى الذكاء الاصطناعي والقطاعات المتخصصة
          </p>

          {/* Stats */}
          <div style={S.statGrid}>
            {STATS.map(s => (
              <div key={s.label} style={S.statCard}>
                <span style={S.statNum}>{s.num}</span>
                <span style={S.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
            <a href="https://wa.me/966531206628" target="_blank" rel="noopener noreferrer" style={S.btnPrimary}>
              🚀 جرب النظام مجاناً
            </a>
            <a href="#modules" style={S.btnSecondary}>
              استعرض الـ {moduleCount} وحدة ↓
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={S.featuresSection}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a' }}>
            لماذا <span style={{ color: '#6366f1' }}>نما إنفست</span>؟
          </h2>
          <p style={{ color: '#64748b' }}>ميزات حصرية لا تجدها في أي نظام آخر في السعودية</p>
        </div>
        <div style={S.featureGrid}>
          {FEATURES.map(f => (
            <div key={f.title} style={S.featureCard}>
              <div style={{ fontSize: '2rem' }}>{f.icon}</div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                {f.title}
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* MODULES (Client Component — only this part needs JS for filter) */}
      <ModuleFilter modules={MODULES_DATA} categories={CATEGORIES} />

      {/* FINAL CTA */}
      <section style={S.ctaSection}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '16px' }}>
          ابدأ الآن — تجربة مجانية
        </h2>
        <p style={{ color: '#c7d2fe', fontSize: '1.1rem', marginBottom: '36px' }}>
          لا بطاقة ائتمان. لا التزامات. ابدأ في 5 دقائق.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
          <a href="https://wa.me/966531206628" target="_blank" rel="noopener noreferrer" style={{
            background: '#25D366', color: 'white',
            padding: '16px 40px', borderRadius: '999px',
            textDecoration: 'none', fontWeight: 700, fontSize: '1.15rem',
            fontFamily: "'Cairo', sans-serif",
            boxShadow: '0 8px 24px rgba(37,211,102,0.35)',
            display: 'inline-flex', alignItems: 'center', gap: '10px',
          }}>
            💬 تواصل عبر واتساب
          </a>
          <a href="https://n1.namainvist.com/sign-in" style={{
            background: 'white', color: '#4f46e5',
            padding: '16px 40px', borderRadius: '999px',
            textDecoration: 'none', fontWeight: 700, fontSize: '1.15rem',
            fontFamily: "'Cairo', sans-serif",
          }}>
            دخول النظام ←
          </a>
        </div>

        {/* Contact info */}
        <div style={{ marginTop: '48px', color: '#8b9dc3', fontSize: '0.9rem' }}>
          <span>📞 +966 53 120 6628</span>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <span>🌐 namainvist.com</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: '#0a0f1e',
        color: '#475569',
        textAlign: 'center',
        padding: '24px 20px',
        fontSize: '0.85rem',
      }}>
        <p style={{ margin: 0 }}>
          © 2025 نما إنفست — جميع الحقوق محفوظة &nbsp;|&nbsp;
          <a href="https://n1.namainvist.com/sign-in" style={{ color: '#6366f1', textDecoration: 'none' }}>
            دخول النظام
          </a>
          &nbsp;|&nbsp;
          <a href="https://wa.me/966531206628" style={{ color: '#6366f1', textDecoration: 'none' }}>
            واتساب
          </a>
        </p>
      </footer>

    </div>
  );
}
