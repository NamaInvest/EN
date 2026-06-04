import { maskSecrets } from '../security/secret-masker.ts';

export interface LogScanResult {
  totalLines: number;
  errorCounts: {
    typeError: number;
    prismaError: number;
    http500: number;
    unhandledRejection: number;
    uncaughtException: number;
    otherErrors: number;
  };
  hasSecrets: boolean;
  errorsDetected: string[];
}

export function scanLogContent(content: string): LogScanResult {
  const result: LogScanResult = {
    totalLines: 0,
    errorCounts: {
      typeError: 0,
      prismaError: 0,
      http500: 0,
      unhandledRejection: 0,
      uncaughtException: 0,
      otherErrors: 0,
    },
    hasSecrets: false,
    errorsDetected: [],
  };

  if (!content) return result;

  const lines = content.split('\n');
  result.totalLines = lines.length;

  // Simple patterns to check for secrets without printing them
  const secretPatterns = [
    /postgresql:\/\/[^:]+:[^@]+@/i,
    /postgres:\/\/[^:]+:[^@]+@/i,
    /-----BEGIN[^-]+-----/i,
    /ssh-rsa/i,
    /ssh-ed25519/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line contains any unmasked secrets
    for (const pat of secretPatterns) {
      if (pat.test(line)) {
        result.hasSecrets = true;
        break;
      }
    }

    const maskedLine = maskSecrets(line);
    const lowerLine = maskedLine.toLowerCase();

    let matched = false;

    if (lowerLine.includes('typeerror')) {
      result.errorCounts.typeError++;
      matched = true;
    }
    if (lowerLine.includes('prisma') && (lowerLine.includes('error') || lowerLine.includes('failed') || lowerLine.includes('runtime'))) {
      result.errorCounts.prismaError++;
      matched = true;
    }
    if (lowerLine.includes('status: 500') || lowerLine.includes(' 500 ') || lowerLine.includes('"status":500')) {
      result.errorCounts.http500++;
      matched = true;
    }
    if (lowerLine.includes('unhandledrejection')) {
      result.errorCounts.unhandledRejection++;
      matched = true;
    }
    if (lowerLine.includes('uncaughtexception')) {
      result.errorCounts.uncaughtException++;
      matched = true;
    }

    if (!matched && (lowerLine.includes('error') || lowerLine.includes('exception') || lowerLine.includes('failed'))) {
      result.errorCounts.otherErrors++;
      matched = true;
    }

    if (matched) {
      // Capture masked error snippet
      result.errorsDetected.push(`[Line ${i + 1}] ${maskedLine.trim().slice(0, 150)}`);
    }
  }

  return result;
}
