import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Suppress the url.parse() deprecation warning (DEP0169) from dependencies
    // This warning comes from next-auth and/or pg packages which we can't control
    const originalEmitWarning = process.emitWarning.bind(process);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process as any).emitWarning = (warning: string | Error, ...args: any[]) => {
      if (
        typeof warning === "string" &&
        warning.includes("url.parse()") &&
        warning.includes("DEP0169")
      ) {
        return;
      }
      return originalEmitWarning(warning, ...args);
    };

    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
