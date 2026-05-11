import { logger } from '@/lib/logger';

const log = logger.child({ service: 'account-hierarchy-engine' });

/**
 * C-03: Account Hierarchy + Sales Teams
 * Customer has no parentCustomerId / salesTeamId → in-memory hierarchy map
 */

const parentMap   = new Map<number, number>();          // childId → parentId
const teamMap     = new Map<number, number>();          // customerId → teamId
const teams       = new Map<number, { id: number; tenantId: string; name: string; leaderId: number; memberIds: number[] }>();
let teamSeq = 1;

export class AccountHierarchyEngine {
  static setParent(childId: number, parentId: number) {
    parentMap.set(childId, parentId);
    log.info(`Account hierarchy: ${childId} → parent ${parentId}`);
    return { childId, parentId };
  }

  static getParent(childId: number): number | undefined {
    return parentMap.get(childId);
  }

  static getChildren(parentId: number): number[] {
    return Array.from(parentMap.entries()).filter(([, p]) => p === parentId).map(([c]) => c);
  }

  static buildHierarchy(rootId: number, depth = 0, maxDepth = 4): object {
    if (depth >= maxDepth) return { id: rootId, children: [] };
    const children = this.getChildren(rootId).map(c => this.buildHierarchy(c, depth + 1, maxDepth));
    return { id: rootId, depth, children };
  }

  static assignToTeam(customerId: number, teamId: number) {
    teamMap.set(customerId, teamId);
    return { customerId, teamId };
  }

  static createTeam(tenantId: string, name: string, leaderId: number, memberIds: number[]) {
    const id = teamSeq++;
    const team = { id, tenantId, name, leaderId, memberIds };
    teams.set(id, team);
    log.info(`Sales team created: ${name} (id=${id})`);
    return team;
  }

  static getTeamAccounts(teamId: number): number[] {
    return Array.from(teamMap.entries()).filter(([, t]) => t === teamId).map(([c]) => c);
  }

  static getTeam(teamId: number) {
    return teams.get(teamId);
  }

  static listTeams(tenantId: string) {
    return Array.from(teams.values()).filter(t => t.tenantId === tenantId);
  }
}
