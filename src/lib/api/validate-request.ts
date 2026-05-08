import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export async function validateRequest<T extends z.ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<{ data: z.infer<T>; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            issues: error.issues.map(i => ({
              path: i.path.join('.'),
              message: i.message,
            })),
          },
          { status: 400 }
        ),
      };
    }
    return {
      data: null,
      error: NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }),
    };
  }
}
