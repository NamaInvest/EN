import { NextRequest, NextResponse } from 'next/server';
import { AccountHierarchyEngine } from '@/lib/account-hierarchy-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const view     = searchParams.get('view') ?? 'hierarchy';
  if (view === 'hierarchy') {
    const rootId = Number(searchParams.get('rootId'));
    return NextResponse.json({ hierarchy: AccountHierarchyEngine.buildHierarchy(rootId) });
  }
  if (view === 'teams') return NextResponse.json({ teams: AccountHierarchyEngine.listTeams(tenantId) });
  if (view === 'team_accounts') {
    const teamId = Number(searchParams.get('teamId'));
    return NextResponse.json({ accountIds: AccountHierarchyEngine.getTeamAccounts(teamId) });
  }
  return NextResponse.json({ error: 'Invalid view' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'set_parent')   return NextResponse.json(AccountHierarchyEngine.setParent(body.childId, body.parentId));
  if (body.type === 'assign_team')  return NextResponse.json(AccountHierarchyEngine.assignToTeam(body.customerId, body.teamId));
  if (body.type === 'create_team')  return NextResponse.json(AccountHierarchyEngine.createTeam(body.tenantId, body.name, body.leaderId, body.memberIds), { status: 201 });
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
