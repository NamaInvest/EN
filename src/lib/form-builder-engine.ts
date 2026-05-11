import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'form-builder-engine' });

export class FormBuilderEngine {
  static async createForm(tenantId: string, name: string, entityBinding: string, fields: object[], submitAction: object) {
    return prisma.customForm.create({
      data: { tenantId, name, entityBinding, fields: fields as Prisma.InputJsonValue, submitAction: submitAction as Prisma.InputJsonValue },
    });
  }

  static async createPage(tenantId: string, slug: string, title: string, layout: object, permissions: object) {
    return prisma.customPage.create({
      data: { tenantId, slug, title, layout: layout as Prisma.InputJsonValue, permissions: permissions as Prisma.InputJsonValue },
    });
  }

  static async publishPage(id: number) {
    return prisma.customPage.update({ where: { id }, data: { publishedAt: new Date() } });
  }

  /** Build a Zod schema from a form's field definitions at runtime */
  static buildZodShape(fields: Array<{ name: string; type: string; required?: boolean }>) {
    const shape: Record<string, string> = {};
    for (const f of fields) {
      shape[f.name] = f.required ? `z.${f.type}()` : `z.${f.type}().optional()`;
    }
    return shape;
  }
}
