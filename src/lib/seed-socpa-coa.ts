/**
 * seedSocpaCoA — زرع شجرة حسابات SOCPA لـ tenant جديد
 *
 * ينشئ 88 حساب محاسبي وفق معايير SOCPA السعودية + يُحدّث الإعدادات
 * بخريطة الحسابات الرقابية.
 *
 * الاستخدام:
 *   import { seedSocpaCoA } from '@/lib/seed-socpa-coa';
 *   await seedSocpaCoA(tenantId, prisma);
 */

import coaData from '../../prisma/seeds/socpa-coa.json';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'seed-socpa-coa' });

const CONTROL_ACCOUNTS_MAP = {
  AR_CONTROL:           '1210',
  AP_CONTROL:           '2110',
  GRIR:                 '2150',
  INVENTORY:            '1310',
  VAT_OUTPUT:           '2310',
  VAT_INPUT:            '1330',
  GOSI_PAYABLE:         '2340',
  WHT_PAYABLE:          '2350',
  EOS_PROVISION:        '2410',
  LEAVE_PROVISION:      '2420',
  RETAINED_EARNINGS:    '3210',
  CURRENT_YEAR_EARNINGS:'3220',
  SALARY_PAYABLE:       '2330',
  DEFERRED_REVENUE:     '2510',
  FX_GAIN:              '4920',
  FX_LOSS:              '5420',
  BAD_DEBT_EXPENSE:     '5200',
  ALLOWANCE_FOR_BAD_DEBT:'1211',
  DEP_EXPENSE:          '5220',
};

export async function seedSocpaCoA(
  tenantId: string,
  prisma: any,
): Promise<{ accountsCreated: number }> {
  // استخدام SERIALIZABLE لضمان عدم التكرار
  return prisma.$transaction(
    async (tx: any) => {
      // التحقق من عدم الزرع مسبقاً
      const existingCount = await tx.account.count({ where: { tenantId } });
      if (existingCount >= 50) {
        return { accountsCreated: 0 }; // مُزرعة بالفعل
      }

      // فهرسة الحسابات المُنشأة للحصول على IDs
      const createdMap = new Map<string, number>();
      let accountsCreated = 0;

      // ترتيب طوبولوجي — الحسابات الأب أولاً
      const sorted = [...coaData].sort((a, b) => {
        if (!a.parentCode && b.parentCode) return -1;
        if (a.parentCode && !b.parentCode) return 1;
        return a.code.localeCompare(b.code);
      });

      for (const row of sorted) {
        const parentId = row.parentCode ? createdMap.get(row.parentCode) ?? 0 : 0;

        const account = await tx.account.create({
          data: {
            tenantId,
            code:        row.code,
            name:        row.nameAr,
            nameEn:      row.nameEn,
            type:        row.type,
            parentId,
            isActive:    true,
          },
        });

        createdMap.set(row.code, account.id);
        accountsCreated++;
      }

      // تحديث أو إنشاء إعداد خريطة الحسابات الرقابية
      const settingKey = `control_accounts_map_${tenantId}`;
      await tx.setting.upsert({
        where:  { key: settingKey },
        update: { value: JSON.stringify(CONTROL_ACCOUNTS_MAP) },
        create: { key: settingKey, value: JSON.stringify(CONTROL_ACCOUNTS_MAP), tenantId },
      });

      // سجل تدقيق
      await tx.auditLog.create({
        data: {
          tenantId,
          action:     'COA_SEEDED',
          entityType: 'Account',
          entityId:   String(accountsCreated),
          newValues:  JSON.stringify({ accountsCreated, template: 'SOCPA' }),
          userId:     'system',
          timestamp:  new Date(),
        },
      }).catch(() => null); // AuditLog اختياري

      return { accountsCreated };
    },
    { isolationLevel: 'Serializable' },
  );
}

export { CONTROL_ACCOUNTS_MAP };
