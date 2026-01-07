import { NextRequest } from "next/server";
import { expect } from "vitest";

/**
 * Create a mock NextRequest for API route testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = "GET", body, headers = {}, searchParams = {} } = options;

  const urlObj = new URL(url, "http://localhost:3000");
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  const requestInit: RequestInit = {
    method,
    headers: new Headers({
      "Content-Type": "application/json",
      ...headers,
    }),
  };

  if (body && method !== "GET") {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(urlObj, requestInit);
}

/**
 * Create mock route context with params
 */
export function createMockContext(params: Record<string, string>) {
  return { params: Promise.resolve(params) };
}

/**
 * Parse JSON response from API route
 */
export async function parseResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

/**
 * Parse JSON response body
 * @deprecated Use parseResponse instead
 */
export async function parseResponseBody<T>(response: Response): Promise<T> {
  return parseResponse<T>(response);
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
