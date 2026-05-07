/**
 * AI-13 — Structured Logger (Pino-compatible JSON logger)
 * Replaces console.* with structured, searchable JSON logs.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
    tenantId?: string;
    userId?: string;
    route?: string;
    requestId?: string;
    [key: string]: any;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    fatal: 50,
};

const MIN_LEVEL = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || 'info'];

function formatLog(level: LogLevel, context: LogContext, message: string, data?: any): string {
    return JSON.stringify({
        level,
        time: new Date().toISOString(),
        msg: message,
        ...context,
        ...(data ? { data } : {}),
    });
}

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= MIN_LEVEL;
}

export const logger = {
    debug(context: LogContext, message: string, data?: any) {
        if (shouldLog('debug')) console.debug(formatLog('debug', context, message, data));
    },

    info(context: LogContext, message: string, data?: any) {
        if (shouldLog('info')) console.log(formatLog('info', context, message, data));
    },

    warn(context: LogContext, message: string, data?: any) {
        if (shouldLog('warn')) console.warn(formatLog('warn', context, message, data));
    },

    error(context: LogContext, message: string, data?: any) {
        if (shouldLog('error')) console.error(formatLog('error', context, message, data));
    },

    fatal(context: LogContext, message: string, data?: any) {
        if (shouldLog('fatal')) console.error(formatLog('fatal', context, message, data));
    },

    /**
     * Create a child logger with preset context (tenantId, userId, route).
     */
    child(baseContext: LogContext) {
        return {
            debug: (msg: string, data?: any) => logger.debug(baseContext, msg, data),
            info: (msg: string, data?: any) => logger.info(baseContext, msg, data),
            warn: (msg: string, data?: any) => logger.warn(baseContext, msg, data),
            error: (msg: string, data?: any) => logger.error(baseContext, msg, data),
            fatal: (msg: string, data?: any) => logger.fatal(baseContext, msg, data),
        };
    },
};
