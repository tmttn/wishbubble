import Typesense from "typesense";
import type { Client } from "typesense";
import { env } from "@/lib/env";

// Singleton client instance
let typesenseClient: Client | null = null;

/**
 * Check if Typesense is configured and enabled
 */
export function isTypesenseEnabled(): boolean {
  return (
    env.TYPESENSE_ENABLED === "true" &&
    !!env.TYPESENSE_HOST &&
    !!env.TYPESENSE_API_KEY
  );
}

/**
 * Get the Typesense client instance (singleton)
 * Throws if Typesense is not configured
 */
export function getTypesenseClient(): Client {
  if (!isTypesenseEnabled()) {
    throw new Error(
      "Typesense is not configured. Set TYPESENSE_HOST, TYPESENSE_API_KEY, and TYPESENSE_ENABLED=true"
    );
  }

  if (!typesenseClient) {
    // Parse the host - could be "xxx.typesense.net" or "https://xxx.typesense.net"
    const hostUrl = env.TYPESENSE_HOST!;
    let host: string;
    let port: number;
    let protocol: "http" | "https";

    if (hostUrl.startsWith("http://") || hostUrl.startsWith("https://")) {
      const url = new URL(hostUrl);
      host = url.hostname;
      port = url.port ? parseInt(url.port, 10) : url.protocol === "https:" ? 443 : 80;
      protocol = url.protocol === "https:" ? "https" : "http";
    } else {
      // Assume it's just a hostname, default to https:443 for cloud
      host = hostUrl;
      port = 443;
      protocol = "https";
    }

    typesenseClient = new Typesense.Client({
      nodes: [{ host, port, protocol }],
      apiKey: env.TYPESENSE_API_KEY!,
      connectionTimeoutSeconds: 10,
      numRetries: 3,
      retryIntervalSeconds: 0.5,
    });
  }

  return typesenseClient;
}

/**
 * Reset the client (useful for testing)
 */
export function resetTypesenseClient(): void {
  typesenseClient = null;
}
