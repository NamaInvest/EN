const DENIED_VERBS = [
  'create', 'update', 'delete', 'insert', 'approve', 'reject',
  'retry', 'restart', 'deploy', 'migrate', 'push', 'commit',
  'write', 'edit', 'upload', 'remove', 'truncate', 'drop',
  'alter', 'grant'
];

export function assertReadOnlyMcpOperation(toolName: string, args: Record<string, unknown>): void {
  const normalized = toolName.toLowerCase();
  
  // 1. Check if toolName contains any denied verbs
  for (const verb of DENIED_VERBS) {
    if (normalized.includes(verb)) {
      throw new Error(`Access Denied: Tool name '${toolName}' contains prohibited mutation verb '${verb}'`);
    }
  }
  
  // 2. Check if arguments contain anything suspicious or mutation verbs
  const argsString = JSON.stringify(args || {}).toLowerCase();
  for (const verb of DENIED_VERBS) {
    if (argsString.includes(`"${verb}"`) || argsString.includes(`:${verb}`) || argsString.includes(`"${verb} `)) {
       throw new Error(`Access Denied: Prohibited mutation verb '${verb}' found inside tool arguments.`);
    }
  }
}

export function denyWriteOperation(reason = 'File modification is disabled'): never {
  throw new Error(`Access Denied: ${reason}`);
}

export function denyShellMutation(reason = 'Shell command mutation is disabled'): never {
  throw new Error(`Access Denied: ${reason}`);
}

export function denyEnvAccess(reason = 'Environment variables modification/unmasked access is disabled'): never {
  throw new Error(`Access Denied: ${reason}`);
}

export function denyDbMutation(reason = 'Database modifications are disabled'): never {
  throw new Error(`Access Denied: ${reason}`);
}
export function denyOnboardingActions(reason = 'Approve, reject or retry onboarding is disabled'): never {
  throw new Error(`Access Denied: ${reason}`);
}
