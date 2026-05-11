import { NextRequest, NextResponse } from 'next/server';
import { FormBuilderEngine } from '@/lib/form-builder-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'form') {
    const form = await FormBuilderEngine.createForm(body.tenantId, body.name, body.entityBinding, body.fields, body.submitAction);
    return NextResponse.json({ form }, { status: 201 });
  }
  if (body.type === 'page') {
    const page = await FormBuilderEngine.createPage(body.tenantId, body.slug, body.title, body.layout, body.permissions);
    return NextResponse.json({ page }, { status: 201 });
  }
  if (body.type === 'publish') {
    const page = await FormBuilderEngine.publishPage(body.id);
    return NextResponse.json({ page });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
