/**
 * Shared API Response Types
 *
 * Standardized types for API responses to ensure consistency
 * across all endpoints and provide type safety for clients.
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  details?: unknown;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

/**
 * Error response helper
 */
export function errorResponse(
  error: string,
  details?: unknown
): ApiResponse<never> {
  return { error, details };
}

/**
 * Paginated response helper
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  totalCount: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

// ============================================================================
// Common Entity Summary Types
// ============================================================================

/**
 * User summary for API responses (minimal user info)
 */
export interface UserSummary {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

/**
 * Bubble summary for API responses
 */
export interface BubbleSummary {
  id: string;
  name: string;
  slug: string;
  occasionType: string;
  eventDate: string | null;
  memberCount: number;
  isSecretSanta: boolean;
}

/**
 * Wishlist summary for API responses
 */
export interface WishlistSummary {
  id: string;
  name: string;
  itemCount: number;
  owner: UserSummary;
}

/**
 * Wishlist item summary for API responses
 */
export interface WishlistItemSummary {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  priority: "MUST_HAVE" | "NICE_TO_HAVE" | "DREAM";
  isClaimed: boolean;
}
