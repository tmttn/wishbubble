import * as Sentry from "@sentry/nextjs";
import { getRequestId } from "./request-context";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
}

function formatLog(entry: LogEntry): string {
  const requestId = getRequestId();
  return JSON.stringify({
    ...entry,
    ...(requestId && { requestId }),
  });
}

function shouldLog(level: LogLevel): boolean {
  const logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  const currentLevel = (process.env.LOG_LEVEL as LogLevel) || "info";
  return logLevels[level] >= logLevels[currentLevel];
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (!shouldLog("debug")) return;

    const entry: LogEntry = {
      level: "debug",
      message,
      timestamp: new Date().toISOString(),
      context,
    };
    console.debug(formatLog(entry));
  },

  info(message: string, context?: LogContext): void {
    if (!shouldLog("info")) return;

    const entry: LogEntry = {
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      context,
    };
    console.info(formatLog(entry));
  },

  warn(message: string, context?: LogContext): void {
    if (!shouldLog("warn")) return;

    const entry: LogEntry = {
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      context,
    };
    console.warn(formatLog(entry));

    // Also send warnings to Sentry as breadcrumbs
    Sentry.addBreadcrumb({
      category: "warning",
      message,
      level: "warning",
      data: context,
    });
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const entry: LogEntry = {
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
      },
    };
    console.error(formatLog(entry));

    // Send to Sentry
    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: context,
        tags: { source: "logger" },
      });
    } else {
      Sentry.captureMessage(message, {
        level: "error",
        extra: { ...context, error },
      });
    }
  },

  /**
   * Log an API request with context
   */
  api(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path}`, { ...context, type: "api_request" });
  },

  /**
   * Log a critical error that needs immediate attention
   */
  critical(message: string, error?: Error | unknown, context?: LogContext): void {
    const entry: LogEntry = {
      level: "error",
      message: `[CRITICAL] ${message}`,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        critical: true,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
      },
    };
    console.error(formatLog(entry));

    // Send to Sentry with high priority
    if (error instanceof Error) {
      Sentry.captureException(error, {
        level: "fatal",
        extra: context,
        tags: { severity: "critical", source: "logger" },
      });
    } else {
      Sentry.captureMessage(message, {
        level: "fatal",
        extra: { ...context, error },
        tags: { severity: "critical" },
      });
    }
  },

  /**
   * Create a child logger with preset context
   */
  child(baseContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) =>
        logger.debug(message, { ...baseContext, ...context }),
      info: (message: string, context?: LogContext) =>
        logger.info(message, { ...baseContext, ...context }),
      warn: (message: string, context?: LogContext) =>
        logger.warn(message, { ...baseContext, ...context }),
      error: (message: string, error?: Error | unknown, context?: LogContext) =>
        logger.error(message, error, { ...baseContext, ...context }),
      critical: (message: string, error?: Error | unknown, context?: LogContext) =>
        logger.critical(message, error, { ...baseContext, ...context }),
    };
  },
};

export type Logger = typeof logger;
