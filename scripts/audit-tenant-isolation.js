#!/usr/bin/env node
/*
 * Tenant Isolation Audit Scanner
 *
 * This scanner is intentionally conservative: by default it reports findings
 * without failing CI, because the repository contains known legacy debt.
 * Set TENANT_AUDIT_FAIL_ON_FINDINGS=true to turn high-risk findings into a
 * blocking gate after the allowlist is burned down.
 */

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const ignoredDirs = new Set([
  '.git',
  '.next',
  '.next-electron',
  'coverage',
  'dist',
  'dist-electron',
  'graphify-out',
  'node_modules',
  'out',
]);

const allowedDirectPrisma = [
  /scripts[\\/]/,
  /prisma[\\/]seed\.ts$/,
  /src[\\/]lib[\\/]prisma\.ts$/,
];

const allowedRouteWithoutWithRoute = [
  /src[\\/]app[\\/]api[\\/]tenant[\\/]provision[\\/]route\.ts$/,
  /src[\\/]app[\\/]api[\\/]tenant[\\/]status[\\/]route\.ts$/,
  /src[\\/]app[\\/]api[\\/]tenant[\\/]check-status[\\/]route\.ts$/,
  /src[\\/]app[\\/]api[\\/]sys[\\/]/,
  /src[\\/]app[\\/]api[\\/]health[\\/]/,
  /src[\\/]app[\\/]api[\\/]ice[\\/]/,
  /src[\\/]app[\\/]api[\\/]master-panel[\\/]/,
  /src[\\/]app[\\/]api[\\/]master-panel-data[\\/]/,
];

const legacyTenantGuardImports = [
  /@\/lib\/tenant\/tenant-guard/,
  /@\/lib\/security\/tenant-guard/,
  /src[\\/]lib[\\/]tenant[\\/]tenant-guard/,
  /src[\\/]lib[\\/]security[\\/]tenant-guard/,
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function lineOf(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function isAllowed(file, patterns) {
  return patterns.some((pattern) => pattern.test(file));
}

function findDirectPrisma(files) {
  const findings = [];
  for (const file of files) {
    const relative = rel(file);
    const content = fs.readFileSync(file, 'utf8');
    const regex = /new\s+PrismaClient\s*\(/g;
    let match;
    while ((match = regex.exec(content))) {
      findings.push({
        file: relative,
        line: lineOf(content, match.index),
        allowed: isAllowed(relative, allowedDirectPrisma),
        reason: 'Direct PrismaClient bypasses tenant-aware client factory.',
      });
    }
  }
  return findings;
}

function findRoutesWithoutWithRoute(files) {
  return files
    .filter((file) => /src[\\/]app[\\/]api[\\/].*[\\/]route\.ts$/.test(file))
    .map((file) => ({ file: rel(file), content: fs.readFileSync(file, 'utf8') }))
    .filter(({ file, content }) => !content.includes('withRoute(') && !content.includes('withGuard(') && !isAllowed(file, allowedRouteWithoutWithRoute))
    .map(({ file }) => ({
      file,
      allowed: false,
      reason: 'API route does not use withRoute/withGuard boundary.',
    }));
}

function findLegacyImports(files) {
  const findings = [];
  for (const file of files) {
    const relative = rel(file);
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of legacyTenantGuardImports) {
      const match = pattern.exec(content);
      if (match) {
        findings.push({
          file: relative,
          line: lineOf(content, match.index),
          allowed: false,
          reason: 'Legacy tenant guard import should move to @/lib/governance/tenant-guard.',
        });
      }
    }
  }
  return findings;
}

function findUnscopedPrismaOps(files) {
  const routeFiles = files.filter((file) => /src[\\/]app[\\/]api[\\/].*[\\/]route\.ts$/.test(file));
  const findings = [];
  const opRegex = /\.(findMany|findFirst|count|aggregate|groupBy|updateMany|deleteMany)\s*\(\s*\{([\s\S]*?)\}\s*\)/g;
  for (const file of routeFiles) {
    const relative = rel(file);
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = opRegex.exec(content))) {
      if (!/tenantId\s*:/.test(match[2])) {
        findings.push({
          file: relative,
          line: lineOf(content, match.index),
          allowed: true,
          reason: 'Sensitive Prisma op has no local tenantId; central Prisma guard must inject it.',
        });
      }
    }
  }
  return findings;
}

const files = walk(root);
const report = {
  generatedAt: new Date().toISOString(),
  root,
  directPrismaClient: findDirectPrisma(files),
  routesWithoutWithRoute: findRoutesWithoutWithRoute(files),
  legacyTenantGuardImports: findLegacyImports(files),
  unscopedPrismaOps: findUnscopedPrismaOps(files),
};

const highRisk = [
  ...report.directPrismaClient.filter((finding) => !finding.allowed),
  ...report.routesWithoutWithRoute.filter((finding) => !finding.allowed),
  ...report.legacyTenantGuardImports.filter((finding) => !finding.allowed),
];

console.log(JSON.stringify({
  summary: {
    filesScanned: files.length,
    directPrismaClient: report.directPrismaClient.length,
    directPrismaClientUnallowed: report.directPrismaClient.filter((finding) => !finding.allowed).length,
    routesWithoutWithRoute: report.routesWithoutWithRoute.length,
    legacyTenantGuardImports: report.legacyTenantGuardImports.length,
    unscopedPrismaOps: report.unscopedPrismaOps.length,
    failMode: process.env.TENANT_AUDIT_FAIL_ON_FINDINGS === 'true',
  },
  findings: report,
}, null, 2));

if (process.env.TENANT_AUDIT_FAIL_ON_FINDINGS === 'true' && highRisk.length > 0) {
  process.exitCode = 1;
}
