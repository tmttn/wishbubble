import { NextRequest } from "next/server";
import { expect } from "vitest";

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(
  method: string,
  url: string,
  options: {
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const { body, headers = {}, searchParams = {} } = options;

  const urlObj = new URL(url, "http://localhost:3000");
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  const headersObj = new Headers({
    "Content-Type": "application/json",
    ...headers,
  });

  if (body && method !== "GET") {
    return new NextRequest(urlObj.toString(), {
      method,
      headers: headersObj,
      body: JSON.stringify(body),
    });
  }

  return new NextRequest(urlObj.toString(), {
    method,
    headers: headersObj,
  });
}

/**
 * Parse JSON response body
 */
export async function parseResponseBody<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

/**
 * Assert response status and optionally body
 */
export async function assertResponse(
  response: Response,
  expectedStatus: number,
  expectedBody?: Record<string, unknown>
) {
  expect(response.status).toBe(expectedStatus);

  if (expectedBody) {
    const body = await response.json();
    expect(body).toMatchObject(expectedBody);
  }
}
