/**
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
module.exports = {
  packageManager: "npm",
  reporters: ["html", "clear-text", "progress"],
  testRunner: "jest",
  coverageAnalysis: "perTest",
  mutate: [
    "src/lib/auto-journal.ts",
    "src/lib/api/with-route.ts",
    "src/lib/prisma.ts",
    "src/lib/governance/tenant-guard.ts",
    "src/lib/financial-statements-engine.ts"
  ],
  thresholds: { high: 90, low: 80, break: 80 }
};
