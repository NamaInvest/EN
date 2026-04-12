'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, Box, Calculator, Users, Shield, Globe, 
  Activity, ShoppingCart, Zap, CreditCard, LayoutDashboard, Database, HardDrive, Smartphone,
  X, BarChart3, TrendingUp, Cpu, Network, Briefcase, LineChart, Wallet, FileCheck, Ticket, History, Home, FileText, Store, Utensils, Clock, Archive, FileQuestion, ClipboardList, Truck, RefreshCcw, CalendarDays, Map, Target, Settings, FileEdit, Inbox, Receipt, Percent, Download, ShoppingBag, Undo, FilePlus, Package, Building, BellRing, Barcode, Hourglass, Hash, BarChart2, Sliders, Repeat, CheckSquare, Camera, Layers, UserCheck, Award, Megaphone, Gift, Link, MessageCircle, CheckCircle, Sun, DollarSign, Star, BookOpen, Book, Calendar, Monitor, Eye, GitMerge
} from 'lucide-react';

const MODULES_DATA = [
  // ------------------ المالية والمحاسبة ------------------
  { cat: 'finance', path: '/accounting', icon: 'Calculator', title: 'المحاسبة المالية والتوجيه العام', desc: 'دورة محاسبية شاملة، قيود يومية تلقائية أو يدوية، وتقارير أستاذ عام متطورة.', detailedDesc: 'يوفر نظام المحاسبة المالية الأساس التناظري لأرصدة المنظمة. من خلال أتمتة دقيقة تستقبل القيود الآلية من جميع الأطراف المعنية كالمبيعات والمشتريات لتحويلها لمدخلات دفترية معتمدة.', features: ['إنشاء قيود يومية متعددة العملات تلقائياً', 'ترحيل وإقفال الفترات المالية', 'دعم شجرة الحسابات حتى 7 مستويات', 'الامتثال الكامل لمعايير IFRS المحاسبية الدولية'] },
  { cat: 'finance', path: '/accounting/banks', icon: 'Building2', title: 'إدارة الحسابات البنكية', desc: 'نظام متكامل لمعالجة الحسابات البنكية، تتبع الأرصدة، والتسويات.', detailedDesc: 'يعزل هذا القسهم أرصدتك البنكية عن التشغيل الدفتري العام لبناء سجل مالي حقيقي للحركة البنكية لكل حساب بالشركة ومطابقته فورياً.', features: ['تعريف بنوك وأرقام آيبان متعددة لكل شركة', 'مطابقة التحويلات الواردة والصادرة', 'عرض كشوفات حساب بنكية دورية', 'شاشات لإدارة وتتبع التسهيلات البنكية'] },
  { cat: 'finance', path: '/accounting/trial-balance', icon: 'BarChart2', title: 'ميزان المراجعة الحي (Trial Balance)', desc: 'لوحة استعراض حية لموازين المراجعة (بالمجاميع، بالأرصدة) مع الغوص العميق في التفاصيل.', detailedDesc: 'نافذة المدير المالي الرئيسية لاستكشاف أي خلل. يتميز بعرض هرمي ذكي يتيح تتبع أي مبلغ هبوطاً من المستوى الأول للشجرة وحتى القيد الأصلي.', features: ['تصميم شجري لموازين المراجعة يفتح ويغلق المستويات', 'زر للغوص (Drill-Down) وصولاً لدفتر الأستاذ وقيد اليومية', 'تصدير ديناميكي إلى إكسل وPDF', 'تصفية بالتاريخ، مركز التكلفة، أو المشروع لتقييم الأداء المعزول'] },
  { cat: 'finance', path: '/accounting/lc', icon: 'Globe', title: 'الاعتمادات المستندية والاستيراد (LC)', desc: 'إدارة الخطابات المستندية دولية التغطية وأتمتة مصروفات الشحن والجمارك لمعرفة التكلفة.', detailedDesc: 'يعمل كضابط إيقاع لواردات الشركة، يوزع تكاليف النقل والجمارك والأرضيات على المورد، مع تقارير شاملة عن كلفة الحاوية بالـ CBM والـ Weight.', features: ['فتح وإغلاق وإدارة ملفات الاعتمادات المستندية البنكية', 'ربط الاعتماد بأوامر الشراء من المورد الخارجي', 'إضافة مصاريف الشحن والتخليص على الحاوية', 'توليد فاتورة التكلفة النهائية (Landed Cost) وعكسها على الأصناف'] },
  { cat: 'finance', path: '/fixed-assets', icon: 'Briefcase', title: 'نظام الأصول الثابتة و الممتلكات', desc: 'سجل إلكتروني لحياة الأصل، من لحظة الشراء، الاهلاكات وحتى التكهين المالي.', detailedDesc: 'يتتبع كل مكتب ومعدة لتدوين انخفاض القيمة الحقيقي وتأثيرها على الأرباح المحتسبة لضمان الإقرار الضريبي الأمثل للمنظمة.', features: ['احتساب الاهتلاك آلياً (مباشر أو تناقصي)', 'جدولة إهلاك شهرية أو سنوية', 'تشغيل سندات استبعاد، تخريد، أو إعادة تقييم للأصول القديمة', 'ربط الأصل بمركز تكلفة فرعي أو مشروع إنشائي لتحميله بتكلفته'] },
  { cat: 'finance', path: '/fng/budgets', icon: 'LineChart', title: 'الموازنات التقديرية وضبط النفقات', desc: 'أداة حاسمة للرقابة المالية ومقارنة الفعلية بالمتوقعة لمنع الانحرافات والإهدار.', detailedDesc: 'الملاذ الآمن لضمان عدم خروج نفقات الأقسام عن المخطط له بداية العام، مع آليات إيقاف حاسمة لمستند الصرف.', features: ['تعريف موازنة سنوية مجزأة شهرياً لكل مركز تكلفة', 'نظام تحذير أو منع نهائي عند تجاوز الائتمان أو الاعتماد المالي', 'لوحة التحكم والتحويل بين البنود المعتمدة للأقسام', 'تقارير الانحرافات (Variance Analysis) لتوضيح القصور بالصرف أو الوفرة'] },
  { cat: 'finance', path: '/fng/petty-cash-funds', icon: 'Wallet', title: 'نظام العهد والنثريات التشغيلية', desc: 'صرف وتسوية ومراقبة نثريات الموظفين والفروع بدقة وشفافية محاسبية.', detailedDesc: 'يرفع العبء الورقي عن المحاسب بحيث يقدم الموظف طلب استعاضة أو فاتورة عهدة ليقوم النظام بالتأكد وتوليد قيد حسم آلي من حساب العهدة المؤقتة.', features: ['تحديد أسقف نقدية لعهد الفروع والمناطق', 'دورة متكاملة: تسليم العهدة ⬅️ تسجيل المصاريف ⬅️ الإقرار والتسوية', 'الربط بالصور وإيصالات العمليات ودعم ذكاء OCR', 'التوجيه المحاسبي الآلي عند الموافقة لسحبها من رصيد الموظف'] },
  { cat: 'finance', path: '/expenses', icon: 'CreditCard', title: 'نظام المصروفات العمومية والعمليات', desc: 'تسجيل وتبويب المصروفات اليومية للشركة ومطابقتها ومسيرتها للميزانية.', detailedDesc: 'واجهة مخصصة ومرنة تتيح للإداريين غير المختصين بالمحاسبة إثبات التكاليف بطريقة آمنة قبل قيام المدقق المالي باحتسابها وإقفالها.', features: ['واجهة سريعة لموظفي الإدارة لتسجيل المصاريف بشكل بديهي', 'دعم الفواتير الضريبية المبسطة كمستند دفع معترف به', 'تصنيف المصروفات (إدارية، بيعية، ومصاريف عمومية متغيرة)', 'دورة استعاضة واعتماد المصروفات قبل التوجيه المالي لمنع الاحتيال'] },
  { cat: 'finance', path: '/treasury', icon: 'Shield', title: 'سجل الخزينة وإدارة الصناديق', desc: 'عرض بانورامي وإدارة دقيقة للنقد المتوفر في كافة صناديق فروع المنظمة.', detailedDesc: 'يمثل المركز الرئيسي لمراجعة جميع المتحصلات والمدفوعات اللحظية (الكاش)، مع ضمان الربط المطابق بين الواقع الفعلي وشاشة الكمبيوتر.', features: ['سندات قبض وصرف فورية مع طباعة حرارية أو A4', 'مطابقة الرصيد الدفتري بالفعلي للإغلاق اليومي للفرع أو المعرض', 'ميزة آمنة لنقل عهد النقد بين الفروع أو تجميعها لرحلة إيداع بنكي', 'محاضر العجز والزيادة عند الاستلام والتسليم بين الموظفين'] },
  { cat: 'finance', path: '/treasury/bank-reconciliation', icon: 'FileCheck', title: 'المطابقة البنكية (Bank Matches)', desc: 'مقارنة حركات البنك مع كشف حساب النظام بنقرات بسيطة لإنهاء كابوس الفروقات.', detailedDesc: 'تحويل ساعات طويلة ومعقدة من مطابقة الورق لاستكشاف المتطابق عبر خوارزميات توافق المبالغ وتواريخ العمليات بصورة رقمية.', features: ['استيراد وتفريغ كشوف البنك (MT940/CSV/Excel) للنظام بثواني', 'دعم المطابقة الآلية (Auto Match) للعمليات وتأكيدها للمحاسب بنقرة', 'اكتشاف العمولات وتسويتها بقيد آلي عند الاعتماد لضبط الميزانية', 'عزل وتحديد وتسجيل الشيكات المعلقة والتي لم تقدم لصرفها بعد'] },
  { cat: 'finance', path: '/installments', icon: 'History', title: 'أقساط المبيعات وتمويل العملاء', desc: 'إدارة تمويل العملاء للمبالغ الضخمة، جدولة أقساطهم، ومراقبة جداول التحصيلات.', detailedDesc: 'يتيح للشركات تمويل مشاريع عملائها وجدولة فاتورة ضخمة على 12 أو 24 مرحلة وتتبع السداد بشكل دوري لتجنب الديون المعدومة.', features: ['توزيع فاتورة البيع على دفعات مجدولة تلقائياً بخيارات متساوية أو متغيرة', 'تطبيق غرامات التأخير الزمنية، وتفعيل آلية الخصم عند السداد المبكر للديون', 'محصلات الأقساط ورسائل SMS التلقائية لتنبيه المديونين باقتراب ميعاد الدفعة', 'لوحة مؤشرات القروض للعملاء المتاخرين والمتعثرين (NPL)'] },
  { cat: 'finance', path: '/receipt-vouchers', icon: 'FileText', title: 'سندات القبض والدفع المقدمة', desc: 'إدارة متطورة لسندات وتتبع المديونيات، ودفعات مقدمة لتخصيص الإيراد عبر فواتير.', detailedDesc: 'سندات تتمتع بالذكاء يمكنها تسديد 10 سحوبات أو فواتير للعميل من مبالغ السند في نفس شاشة التحصيل بدون أعباء توجيه إضافية.', features: ['سند مالية واحد يسدد مجموعة غير محدودة من المبيعات لعميل جملة لتوفير الوقت', 'اقتطاع وحساب الضريبة المقتطعة خصم واضافة من المورد مقدماً لسلامة الإقرار', 'دعم وسائل وقنوات دفع متنوعة (مدى شبكات، Apple Pay، حوالة) داخل السند الفردي', 'نظام موافقات ممتد للسندات ذات المبالغ المصيرية قبل استنزاف واقتطاع البنك'] },

  // ------------------ المبيعات ونقاط البيع ------------------
  { cat: 'sales', path: '/sales', icon: 'ShoppingCart', title: 'المبيعات الضريبية الكبرى (B2B Sales)', desc: 'نظام مبيعات وفوترة إلكترونية قوي للشركات، متوافق كلياً مع المرحلة (ZATCA Phase 2).', detailedDesc: 'نظام فوترة يضمن الاعتماد الفوري لعملية البيع وتسليم الإيصال للزكاة بالتشفير الرقمي دون التعطيل لمسار أعمال التصدير والجملة.', features: ['إصدار فواتير ضريبية مفصلة بشروط المرحلة الثانية ZATCA والرموز المشفرة', 'تخصيص مركز تكلفة فرعي، وربط مبيعات المندوب وحساب نسبته', 'طباعة الفاتورة A4/A5، وإرسال رابط الفاتورة مع QR Code المدمج (XML Base64)', 'توليد القيد المالي اليومي وتحديث دفتر أستاذ العميل فور اعتماد إصدار الفاتورة'] },
  { cat: 'sales', path: '/dashboard', icon: 'Store', title: 'منظومة نقاط البيع الجماهيرية (POS)', desc: 'شاشة كاشير سريعة واستجابة زجاجية مصممة لاحتواء المتاجر وعدد زوارها الهائل بمرونة وسرعة.', detailedDesc: 'مصممة للضربات السريعة عبر الباركود، قادرة على استيعاب 10,000 منتج لحظياً على شاشة تتفاعل باللمس الكامل ودعم المعلقات.', features: ['القدرة على العمل في البيئات المقطوعة وضع الأوفلاين (Offline DB sync) مع المزامنة الآلية', 'تتعامل مع الخصومات وسداد جزئي نقداً وشبكة في نفس فاتورة نقطة البيع لراحة العميل', 'طباعة الإيصالات الضريبية المبسطة ذات العرض الصغير 80mm ودرج النقود الأوتوماتيكي', 'المواءمة الواسعة المباشرة مع أجهزة قراءة الباركود الليزرية، وموازين السوبر الماركت'] },
  { cat: 'sales', path: '/dashboard', icon: 'Utensils', title: 'الحل الشامل للمطاعم والكافيهات', desc: 'نظام إدارة صالات الطعام والوجبات، توجيه الطاولات للمقاهي ودعم شاشات المطبخ الرقمية.', detailedDesc: 'يتجاوز الفواتير إلى تنظيم استراتيجي للمطعم عبر توزيع خريطة الصالة وتوجيه إعداد المأكولات للمطابخ الخلفية وتجنب أخطاء تجهيز الطلبيات.', features: ['تخطيط وحفظ مساحات المطعم والطاولات بخريطة تفاعلية باللمس، تميز الطاولة المشغولة', 'توزيع إيصال الوجبات لشاشات المطبخ KDS مع تنبيه المأكولات المعدلة والمحذوفة لسلامة الوجبة', 'نظام مزدوج يدعم السفرة والطاولات الداخلية والتوصيل المباشر لمنزلك واستلام السفري (Takeaway)', 'مرونة إرجاع وإرساء الطلبات المجمعة وتغيير وحذف الإضافات للحفاظ على هوية الخدمة'] },
  { cat: 'sales', path: '/shifts', icon: 'Clock', title: 'أمن ورديات النقد (Shifts Close)', desc: 'دورة إغلاق نقدية آمنة للمبيعات لمنع أي اختلاس ومطابقة نقد الـ POS بأمان تام.', detailedDesc: 'يهدف لقطع الطريق حول التلاعب المالي من الموظفين عبر إيداعات عهد وتسويات كاش وإغلاق صندوق الوردية معتمد من المشرف بنهاية الدوام.', features: ['استلام وتسليم درجات العهدة الأولية مع الفئات النقدية (Open Drop & Close Drawer)', 'الطرح والمراجعة لعمليات الدفع الإلكتروني عن النقد الملموس في تقرير إغلاق الدوام', 'حساب ومطابقة العجز المالي للكاشير ليقوم بالتوقيع والاعتراف عليه بالنقص لتوجيهه على ذمته', 'تصدير رسائل Telegram للمالك عن ملخص المبيعات فور أداء المشرف زر تسليم وإقفال الكاشير'] },
  { cat: 'sales', path: '/sales/history', icon: 'Archive', title: 'الأرشيف والسجل الضريبي المباع', desc: 'مكتبة سحابية حية وفلاتر سريعة للبحث لاسترداد أو إثبات العمليات العتيقة.', detailedDesc: 'كعنصر تفتيش وإثبات، يوفر الأرشيف إظهار كافة المستندات المحاسبية للفواتير الصادرة على مدى عقود لتلبية طلبات المراجعة الحكومية.', features: ['بحث واسع يلم التقصي عن الفاتورة برقم الهاتف العميل، مسمى الشخص، ومسح جهاز الباركود القديم', 'إجراء الاستدراك والاسترجاع وإصدار إشعارات دائنة وتنزيلات بنقرة واحدة من القائمة للسرعة', 'أيقونة التصدير كـ XML File لهيئة الزكاة والضريبة والجمارك لمطابقات المصلحة وتدقيقها الضريبي', 'الربط المتوازي للبحث الشامل عن مبيعات فروع الشبكة المركزية وعرضها للرقابة الإدارية في المقر الرئيسي'] },
  { cat: 'sales', path: '/price-quotes', icon: 'FileQuestion', title: 'منظم عروض وتفاوض الأسعار', desc: 'نظام احترافي وشامل لإعداد تسعيرات معمارية وتسويقية بعروض جذابة وعلامة تجارية بارزة وتتبع إمضاء العمل.', detailedDesc: 'بوابة الصفقة (المدخل الأولي)، يقدم تصاميم عرض سعر احترافية ومتباينة ومزامن لمسيرها، هل تمت الموافقة أم يماطل العميل في الاعتماد.', features: ['إنشاء العرض ورفد هوية وتصميم وألوان وعناوين المنظمة بصفات رسمية احترافية تدهش العميل الجاد', 'اعتماد العرض لتحويله بكبسة زر "إلى فاتورة مبيعات حقيقية" دون الاحتياج للكتابة المكررة وبذل مجهود موازٍ', 'تتبع حالة المماطلة وتأخر القبول وتصنيفه كالعرض بانتظار العميل، أو تمت الموافقة عليه أو استبعاده لقلة الموارد', 'أتمتة وإدراج للتنبيه والتذكير المستقبلي لإدارة وإرسال المتابعات الميدانية لإغلاق عمليات الشراء في التوقيت المناسب!'] },
  { cat: 'sales', path: '/sales/orders', icon: 'ClipboardList', title: 'طلبيات وأوامر التجهيز (SO)', desc: 'تثبيت وتحجيز بضائع المبيعات المطلوبة للعملاء الاستراتيجيين قبل الشحن أو الفوترة.', detailedDesc: 'يفرق الأمر البيعي عن الفاتورة كونه يتيح تعاقداً أولياً لاستنزاف المتاح وطلب النواقص وفتح المستودع دون إصدار الإثبات المحاسبي.', features: ['توصيل كميات البضاعة للمستودع لعدم التأثير على الأرصدة المباعة وعدم أخذ استحقاق ضريبي ومحاسبي', 'حجز (Reserve) الكيانات الضخمة وتحجير القطع بالمستودع لصالح مشروع عميل، بحيث يمنع على مناوبة آخرين بيعها للجمهور', 'تمكين تحويل أوامر المبيعات لأوامر تصنيع وإحالتها للمصنع بحالة غياب توفر المخزون للمادة', 'إسناد واعتمادات الموافقة الإدارية قبل تكملة بيع الكميات المطلوبة في الساحة لضبط سير العمل والمخزونات المخصصة'] },
  { cat: 'sales', path: '/sales/delivery-notes', icon: 'Truck', title: 'مذكرات التسليم للبضائع اللوجستية', desc: 'إشعار تسليم ملموس للخدمات اللوجستية والشحن الميداني لا يؤثر بالقوائم المالية المباشرة، فقط مستند موقع.', detailedDesc: 'مخصص للمسارات الطويلة، حيث يُرافق المندوب الشاحنة بمستند خالٍ من تسعيرات المنتج، مجرد كميات للتأكد من تسليم البضاعة للمشروع.', features: ['إصدار ورقة استلام وإرسال بضاعة للتوقيع عليها كعهدة توصيل عبر المقاولين وأمناء المستودعات', 'اعتماد توقيع التسليم من قبل العميل يولد القيد المالي آلياً لخصم ومحو الكمية من دفتر المخزون بشكل دائم', 'تتبع تسليم مجزأ ودعم تسليم عبر مراحل مختلفة وأيام مجزأة وتوحيدها بفاتورة بيع نهائية تعقب إكمال التسليم', 'ترتيب النقل والأفضلية عبر أساطيل التوصيل وتسليم وتسوية السائق والتنبيه لحالات ومواسم التسليم الخالدة!'] },

  // ------------------ المشتريات والموردين ------------------
  { cat: 'purchases', path: '/purchases/requisitions', icon: 'FileEdit', title: 'نظام طلبات الشراء الوظيفية (PR)', desc: 'تمكين الإدارات التابعة للشركة من رفع احتياجاتها والمعدات المطلوبة لدراسة جدواها شرائياً.', detailedDesc: 'يحكم هذا القسم نفقات الإدارة عبر تحويل طلب شراء قرطاسية أو سيارة جديدة لموافقات منظمة لا تؤثر على دفاتر الأستاذ بل تشكل تنبيهاً ذكياً للمشتريات.', features: ['انخراط المدراء والموظفين في تقديم أوامر إلكترونية لتأمين حاجة وموارد الإدارة والمهام وتصفيتها إداريا', 'تنقيب واتصال وفحص تلقائي في مستودع الشركة للتأكد من توفر المواد لرفض طلب الشراء المكرر لمنع التكديس غير المجدي', 'صياغة وسرعة تحويل (طلبات الأقسام المعتمدة والمصدق عليها) لمخاطبات وسند عروض موردين وأوامر استيراد خارجية', 'جمع كل تنويعات وطلبات الأصول، المواد الاستهلاكية اليومية، والمواد الأولية في حزمة معالجة واحدة موحدة ومتوافقة!'] },
  { cat: 'purchases', path: '/purchases/rfq', icon: 'Inbox', title: 'أداة مقارنة وعروض الموردين (RFQ)', desc: 'طرح وتسعير المناقصات والبحث عن أرخص وأفضل البضائع للحفاظ على السيولة قبل التعميد.', detailedDesc: 'يولِّد هذا النموذج طلبات أسعار ويدع الموردين يتنافسون، ثم يقدم لوحة استراتيجية مقارنة دقيقة تحدد بشفافية أقل السعر وأفضل العطاءات المعنية.', features: ['عمل دمج وجمع عروض التكاليف والمبالغ المخصصة من شركات وسحبها من الردود واستخراجها عبر أرقام تنافسية للتحليل', 'تقارير وقوائم (المقارنة العمياء) التي تفلتر العطاءات وتحدد الأجود فنياً ومالياً وسدادياً لتوفير المال بطريقة لا تنحاز للاختلاس!', 'تنظيم وإنشاء نافذة بوابة للمورد الآمنة (Supplier B2B Portal) للتنقل ووضع الاقتراحات وإرسال فواتير العروض وإشعارهم دون الورق!', 'تفويض وانتقال الطلب العقلاني من حالة عطاء مبدئي لإحداث وإنشاء أمر شراء نظامي متكامل'] },
  { cat: 'purchases', path: '/purchase-orders', icon: 'Receipt', title: 'أرشيف أوامر الشراء العظمى (PO)', desc: 'إمضاء العقود وتأكيد استيراد الكميات الضخمة من المورد الدولي والمحلي لحمايتك قبل الإيفاء.', detailedDesc: 'مستند إثبات وتعميد لمورد بعدم الخروج عنه وتأكيده بالأسعار المعتمدة مسبقاً لديه وضمان التزام كلا الطرفين بشروط الجودة والمقاسات والفترة الزمنية المتفق عليها لتسديد الدفعات.', features: ['إنشاء أمر شراء وطباعة نسخة PDF رسمية ترسل عبر الإيميل تحوي الشروط الحازمة والتفاصيل الجزئية للدفع والاعتماد وتواريخ الانتهاء', 'اعتماد وإيضاح وتسوية الاستلام والإقفال المبكر والتسليم الجزئي لكميات أمر الشراء بسبب الأعطال الجمركية أو إخلال المُصدّر!', 'الوقاية القسرية وربط فواتير البضاعة النهائية للمورد لمطابقتها للـ PO منعاً لأي تجاوز أو زيادة مبالغة بسعر التكلفة المتفق عليه مسبقاً', 'مراقبة وتقييم سجل كفاءة المورد بالمدة والانطباع العام وأمانة التحميل وتسجيل تقارير الإسناد والإدارة عبر الواجهة المعتمدة'] },

  // ------------------ المستودعات والمخزون ------------------
  { cat: 'stock', path: '/products', icon: 'Package', title: 'شجرة البطاقات والمنتجات المعقدة', desc: 'تكويد وتنظيم الآلاف من موادك الخام والمصنعة ضمن فئات متباينة الأوزان والتصنيفات.', detailedDesc: 'قلب البنية التحتية الصلب للمخزن. كل بضاعة يتم وضع لها وحدة وعنوان ووصف، لكي يُبنى عليها عمليات الحساب، وتكلفة الأصل، وسرعة دوران البيع بالمنظمة.', features: ['المرونة بدعم المقاسات، الألوان والمزايا المتعددة المعقدة (Matrix Variables) للمنتجات النسيجية كمحلات وتطبيقات الملبوسات التجارية!', 'تكوين واجهات الوحدات التحويلية وربط شراء "بكت كبير" ببيع الحبة أو الدرزن كأنواع لا متناهية والقطع الصغرى والوسطى في المنتجات', 'مرفقات الصور وصيغ عرض ألبوم شاملة للقطعة وصلاحية الباركود المُصدّر للأنظمة الطرفية وAPI لتطبيقات المواقع ومنصات التسوق (سلة وغيرهم)', 'تصنيف بطاقات العناصر إدارياً (مادة خام أساسية - منتجات تامة جاهزة - مصروف خدمي متناهي) للتنسيق المحاسبي والضبط المالي في دفتر الأستاذ!'] },
  { cat: 'stock', path: '/warehouses', icon: 'Building', title: 'خريطة وصلاحيات فروع التخزين', desc: 'هيكلة وإدارة توزيع مقرات تخزين وعرض بضائع المؤسسة لمستويات وفروع متعددة التنوع والجغرافيا.', detailedDesc: 'لصناعة الأذرع الخاصة بالشركات القابضة الكبيرة. يُمكّن القسم من بناء هيكليات لتفريغ وإرجاع المستودعات وربطها بالمدن ووضع ضوابط صارمة للتحول ونقل العهد.', features: ['استراتيجية بناء شجري، وتوزيع الأسطول (مستودع مدينة جدة الرئيسي ⬅️ فرع المستودع الجنوبي ⬅️ مخزن الجرد المركزي ⬅️ المعرض 1)', 'السُلطة والخصوصية لفرض وصول وتصفح محدود لعمال التخزين والمدراء، لضمان السرية وعزل بيانات وإيرادات مناطق وفروع العرض ومنع الخلط المالي!', 'تنصيب وترسية مستودعات الفُتات (الخردة) والبضائع البطيئة وتخزين المواد المؤقتة وعروض المعارض والصالات كحسابات متباينة وعزل تكلفتها!', 'معرفة وتقارير استيفاء قيمة البضاعة وتقييم الجهد لهامش ومقدرة استيعاب كل مستودع والوصول لتحليل خسارة وازدهار الأصول المكدسة فيها وتوجيه البيع'] },
  { cat: 'stock', path: '/warehouses/alerts', icon: 'BellRing', title: 'رادار إنذارات النقص للمخازن', desc: 'عين رقابية تحذرك قبل نفاذ الأرفف من بضائعها لتجنب الخسارة والتأخير بالتشغيل المتواصل.', detailedDesc: 'إدارة سلاسل الإمداد الفاعلة والمنظمة لمنع النكبات. لا حاجة للبحث المستمر عن المخزون المنتهي، سيقوم الرادار بجدولة وارسال المطالبات من قسم المشتريات بشكل فوري حال الوصول للحد.', features: ['وضع مؤشرات وضوابط الـ (حد أقصى مسموح به - حدود أدنى - مستويات ونقاط إعادة الاستيراد) والربط الزمني لزيادة الإمداد بشكل مؤكد', 'أتمتة طلب شراء وإصدار وثيقة PR ورفعها بشكل مستقل وتلقائي حين يتمكن قسم التقارير من رصد مستويات العجز ومطابقتها بالتوقعات', 'تنبيه آلي واعتراض بالإيميل والشات وإضافته بلوحة المدير والمورد لاستصدار القرار السريع واستباق الخلو والأزمات المستودعية الخطرة!', 'معرفة وتصفية وإظهار تقرير المنتجات والأرفف (الراكدة التي لم تبع من شهور) لتوليد خطة وعروض تسويق تخلص المستودع من التكلفة الرأسمالية والمادية لها'] },

  // ------------------ الموارد البشرية والرواتب ------------------
  { cat: 'hr', path: '/employees', icon: 'Users', title: 'إدارة العقول والمواهب الوظيفية', desc: 'قاعدة شاملة تسطر كل حدث إداري وبشري للموظف منذ دخوله أبواب الشركة حتى استقالته أو تقاعده.', detailedDesc: 'ليس مجرد اسم بل هو لوحة استراتيجية تتألف من رواتب الموظف، تأمينه الصحي، ومكافأة نهاية الخدامة، وإيراد العقود لتصنيف قوة العمل بشكل مثالي للمسيرات والأموال.', features: ['حوافظ البيانات والمرفقات (صورة الجواز، الإثبات السكني، الشهادة العلمية) وتوثيق تاريخ عقود التوظيف وجدول التجديد والانقضاء ورسائل التنبيه الآلية', 'دالات الرواتب وارتباط البدلات المادية والهيكل الوظيفي وتخصيص المنافع ومواقع وحرمات العمل المتاحة لكل وظيفة والضوابط والشجرة العنقودية لها', 'منصات مراقبة الحضور والانصراف، وربط بصمات الموظفين الحيوية والتأكيد على الكاميرات وأرشفة بصمات الغياب ومواقع التدوين المستمرة!'] },
  { cat: 'hr', path: '/salaries', icon: 'DollarSign', title: 'معمل مسيرات الدفع (Payroll Engine)', desc: 'باطن الإدارة لمعالجة الرواتب الآلية واعتماد وصرف استحقاقات للمنشآت الضخمة بنقرة معتمدة.', detailedDesc: 'عمليات معقدة للرواتب تُجمع في ضغطة الزر الواحدة لترجمة المجهودات الزمنية (حضور/سلف/تأخير) وتقليصها للمسير البنكي المرموق لدعم قرارات WPS الحكومية.', features: ['الجمع والانسجام للدوام والتأديب والرواتب الإضافية وعمولة المبيعات وأوامر الشغل لتأسيس راتب خام خال من الأخطاء وشفاف للمجهود المبذول!', 'إضفاء القبول والتأكيد البنكي لتصدير المسير متوافق كلياً مع مسار حماية الأجور السعودي (WPS) ومسارات وزارة العمل وإيداع البيانات وتصفية النقد', 'دورة التقييم ومراجعات المدقق المالي لإعتماد الإيداعات للبنك ومنع الردود المرتجعة، ووجهة توليد لقيد محاسبي أوتوماتيكي ومصروف أجور متبلور!'] },

  // ------------------ إدارة علاقات العملاء والتسويق ------------------
  { cat: 'logistics', path: '/customers', icon: 'UserCheck', title: 'دفاتر المستهلكين وكبار العملاء', desc: 'قلعة وحصن لمعلومات ولاء المستفيدين ومطالبة ديون المستهلكين ومهام التحصيل اليومية والجذرية.', detailedDesc: 'مرجعية ضخمة تقص أثر ومجهودات التجار، لتصنيف وتحجيم المخاطرة والائتمانية وسلامة الوضع المالي عبر استنباط سجل ومقارنة ديون ومبيعات الأفراد.', features: ['ملف بطاقي معمق يتألف من (بيانات العنوان للوصول، مستندات العقود للضمانات، ملخص السجل المدفوع والأرصدة المستحقة للتحصيل للضرائب ومستويات التصنيف)', 'منع التبديد ووقف البيع وحرمان الحسابات المتعثرة وتوقيف المعاملات وإجبارهم والتضييق عليهم لتصفيى المديونيات المتراكمة والمصادرة المتوقعة عبر حظر العملاء!', 'إدماج العمليات والتواؤم مع المبيعات وسجل الشكاوى، والنظر لقوائم طلب التوصيل والتتبع اللوجستي كصفحة استقراء لعميل الجملة بصفة واحدة وقرار سريع ومكتمل'] },

  // ------------------ الإدارة العليا والإعدادات ------------------
  { cat: 'admin', path: '/settings', icon: 'Settings', title: 'مركز القيادة وتخصيص السياسات', desc: 'قمرة التحكم للرئيس والإجراءات المتبعة وتأسيس سياسة، وضبط تعاملات وعملة البرنامج للبيئة والمشروع.', detailedDesc: 'القلب الإجرائي للخدمات وضبط المسارات؛ هنا تبني السياسات القومية وأساس الأمان وضوابط الأرقام ووقت البرنامج وتشكيل المظهر وإدخال المالك للسجلات والأصول الأساسية.', features: ['تحوير المظهر والشعارات وأنماط الفواتير الملونة وعبر التخصيص والأختام لإنشاء التميز والصيغة البصرية الفخمة لهويتك واستمارات الطباعة للورق والفاتورة الإلكترونية', 'توريد واستيراد البيانات وشفط ومعالجة السجلات القديمة للمنتج وإطلاق المشروع وحفظ أرصدة الميزانيات المبدئية والقيود السابقة والانتعاش وإدخال الـ XML للقوالب والمقاسات', 'بث وتفعيل القرارات وإلزام المحاسب وعدد الخانات العشرية وتفاصيل استرداد القيمة وتوضيح مستويات الائتمان وسجل القيود وتسوير النظام وأعمدته كلياً على أوامر المدير'] }
];

interface ModuleData {
  cat: string;
  path: string;
  icon: string;
  title: string;
  desc: string;
  detailedDesc: string;
  features: string[];
}

export default function Epic73ModulesDashboard() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedMod, setSelectedMod] = useState<ModuleData | null>(null);

  const filters = [
    { id: 'all', name: 'الكل (جميع الوحدات)' },
    { id: 'finance', name: '💸 المالية والمحاسبة' },
    { id: 'sales', name: '🛒 المبيعات والتجزئة' },
    { id: 'purchases', name: '📦 المشتريات والموردين' },
    { id: 'stock', name: '🏭 المستودعات والبارکود' },
    { id: 'hr', name: '👥 الموارد والرواتب' },
    { id: 'logistics', name: '🎁 علاقات العملاء (CRM)' },
    { id: 'enterprise', name: '🏢 القطاعات المتخصصة' },
    { id: 'ai', name: '🧠 الذكاء والتحليل' },
    { id: 'admin', name: '⚙️ الإدارة والأمن' },
  ];

  const filteredModules = activeFilter === 'all' 
       ? MODULES_DATA 
       : MODULES_DATA.filter(m => m.cat === activeFilter);

  // Helper for dynamic icons
  const renderIcon = (iconName: string) => {
    const Icons: Record<string, any> = {
       Calculator, Briefcase, LineChart, Wallet, CreditCard, Shield, FileCheck, Ticket, History, Home, FileText,
       ShoppingCart, Store, Utensils, Clock, Archive, FileQuestion, ClipboardList, Truck, RefreshCcw, CalendarDays, Map, Target, Settings,
       FileEdit, Inbox, Receipt, Percent, Download, ShoppingBag, Undo, Globe, FilePlus, Package, Building, BellRing, Barcode, Hourglass, Hash, BarChart2, Sliders, Repeat, CheckSquare, Camera, Layers,
       Users, CheckCircle, Sun, DollarSign, Star, BookOpen, Zap,
       UserCheck, Award, Megaphone, Gift, Link, MessageCircle, Book, Calendar, Monitor, Activity, Cpu, Eye, LayoutDashboard, GitMerge, Building2
    };
    const SelectedIcon = Icons[iconName] || Globe;
    return <SelectedIcon />;
  };

  return (
    <div className="page fade-in p-2 sm:p-6 max-w-[1400px] mx-auto" dir="rtl" style={{ fontFamily: 'system-ui' }}>
      
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-indigo-900 via-slate-900 to-blue-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl mb-8 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
         <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
         <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="inline-block bg-blue-500/30 px-4 py-1.5 rounded-full text-blue-200 text-sm font-bold border border-blue-400/30 mb-5 whitespace-nowrap shadow-sm backdrop-blur-sm">🔍 الدليل المعرفي الشامل لأنظمة نما إنفست</div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-5 tracking-tight leading-tight">موسوعة أقسام ومنظومات <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">نظام نما إنفست</span></h1>
              <p className="text-slate-300 text-base sm:text-lg lg:text-xl font-medium max-w-3xl leading-relaxed">اكتشف الإمكانيات العملاقة، الأدوات المتقدمة، وتفاصيل الأجزاء المتكونة لبرنامج نما إنفست ERP. يتضمن الهيكل الكامل للعمليات من قلب الاستيراد، المحاسبة الدقيقة، ذراع المبيعات الفولاذي، وجدولة الموارد البشرية.</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 text-center flex-shrink-0 shadow-xl relative overflow-hidden group hover:bg-white/20 transition-all cursor-default">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <div className="relative z-10">
                 <div className="text-xs sm:text-sm text-blue-200 mb-1 font-bold uppercase tracking-wider">إجمالي المنظومات والوحدات</div>
                 <div className="text-6xl font-black text-white drop-shadow-md">73+</div>
                 <div className="text-sm font-bold text-blue-300 mt-2 bg-blue-900/40 py-1 px-3 rounded-lg border border-blue-800">وحدة متطورة لتسريع عملك</div>
               </div>
            </div>
         </div>
      </div>

      {/* Filter Toggles */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-10 bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-sm hidden-scrollbar overflow-x-auto">
         {filters.map(f => (
            <button 
              key={f.id} 
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base whitespace-nowrap transition-all duration-300 ${activeFilter === f.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105 border-indigo-500' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-indigo-600 hover:scale-105'}`}
            >
              {f.name}
            </button>
         ))}
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
         {filteredModules.map((mod, idx) => (
             <div 
                key={idx} 
                onClick={() => setSelectedMod(mod)}
                className="bg-white cursor-pointer rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] hover:border-indigo-200 hover:-translate-y-2 transition-all duration-300 group flex flex-col relative overflow-hidden"
                style={{ animationDelay: `${idx * 0.03}s`, animationFillMode: 'both' }}
             >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-16 translate-x-16 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10 flex justify-between items-start mb-5">
                   <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-500/40 group-hover:rotate-6 transition-all duration-500">
                      {renderIcon(mod.icon)}
                   </div>
                   <div className="text-xs font-black text-slate-300 group-hover:text-indigo-300 bg-slate-50 group-hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors">
                     MOD-{(idx+1).toString().padStart(2, '0')}
                   </div>
                </div>
                
                <h3 className="relative z-10 font-black text-lg sm:text-xl text-slate-800 mb-3 leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2">{mod.title}</h3>
                <p className="relative z-10 text-sm text-slate-500 font-medium leading-relaxed mb-5 flex-1 line-clamp-3">{mod.desc}</p>
                
                <div className="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400">
                  <div className="flex items-center gap-2 text-indigo-500">
                     <span className="group-hover:mr-2 transition-all">استكشف النظام والخصائص</span>
                     <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  </div>
                  <div className="bg-slate-100 px-2 py-1 rounded text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">{mod.cat.toUpperCase()}</div>
                </div>
             </div>
         ))}
      </div>
      
      {/* Detailed Modal Report */}
      {selectedMod && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 p-6 sm:p-10 flex items-start justify-between text-white relative overflow-hidden shrink-0">
               <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
               <div className="absolute left-0 bottom-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
               <div className="relative z-10 pr-2">
                 <div className="flex items-center gap-3 mb-3 text-blue-200">
                    <span className="p-2 bg-blue-800/50 rounded-xl backdrop-blur-md border border-white/10">{renderIcon(selectedMod.icon)}</span>
                    <span className="font-bold text-xs sm:text-sm tracking-wide bg-blue-800/40 px-3 py-1 rounded-full border border-blue-700/50">{selectedMod.cat.toUpperCase()} MODULE</span>
                 </div>
                 <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">{selectedMod.title}</h2>
                 <p className="mt-2 text-blue-100 leading-relaxed max-w-3xl text-sm sm:text-base lg:text-lg opacity-90 font-medium">{selectedMod.detailedDesc || selectedMod.desc}</p>
               </div>
               <button 
                 onClick={() => setSelectedMod(null)} 
                 className="bg-white/10 hover:bg-white/30 hover:rotate-90 p-2 sm:p-3 rounded-full transition-all duration-300 relative z-10 shrink-0 border border-white/20"
               >
                 <X className="w-5 h-5 sm:w-6 sm:h-6" />
               </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-10 overflow-y-auto bg-slate-50/50" dir="rtl">
               <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  
                  {/* Features List */}
                  <div className="md:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-xl sm:text-2xl font-black flex items-center gap-3 mb-6 text-slate-800 border-b border-slate-100 pb-4">
                       <Zap className="w-7 h-7 text-indigo-500" />
                       الخصائص التشغيلية والتقنية الحصرية
                    </h3>
                    <ul className="space-y-4">
                       {selectedMod.features && selectedMod.features.map((feature: string, i: number) => (
                           <li key={i} className="flex items-start gap-4 text-slate-600 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group">
                              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                 <CheckSquare className="w-4 h-4" />
                              </div>
                              <span className="font-semibold text-sm sm:text-base leading-relaxed pt-1 text-slate-700 group-hover:text-indigo-900">{feature}</span>
                           </li>
                       ))}
                    </ul>
                  </div>

                  {/* Meta Specs & CTA */}
                  <div className="md:col-span-4 space-y-6">
                     <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
                        <h4 className="font-black text-slate-800 mb-5 flex items-center gap-2 text-lg"><Activity className="w-5 h-5 text-emerald-500"/> حالة الموثوقية والأداء</h4>
                        <div className="space-y-4">
                           <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                              <span className="font-semibold text-slate-500 text-sm">سرعة الاستجابة (API)</span>
                              <span className="bg-emerald-50 text-emerald-700 font-black px-2 py-1 rounded border border-emerald-100 text-xs">P99 &lt; 120ms</span>
                           </div>
                           <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                              <span className="font-semibold text-slate-500 text-sm">حالة المزامنة والربط</span>
                              <span className="flex items-center gap-1 text-slate-700 font-bold text-xs"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> مباشر ومتصل</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="font-semibold text-slate-500 text-sm">الحفظ السحابي</span>
                           <span className="bg-blue-50 text-blue-700 font-black px-2 py-1 rounded border border-blue-100 text-xs">تشفير AES-256</span>
                           </div>
                        </div>
                     </div>
                     
                     <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-6 sm:p-8 text-center shadow-inner">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md text-indigo-600">
                           <LayoutDashboard className="w-8 h-8" />
                        </div>
                        <h4 className="font-black text-indigo-900 mb-2">هل أنت جاهز لتجربة النظام؟</h4>
                        <p className="text-indigo-700/80 text-sm font-medium leading-relaxed mb-6">
                           انتقل مباشرة لبيئة العمل وتفقد هذه الخصائص والأدوات على أرض الواقع.
                        </p>
                        <button 
                           onClick={() => {
                              router.push(selectedMod.path);
                           }}
                           className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-1 flex items-center justify-center gap-3"
                        >
                           انتقال إلى شاشة القسم <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
