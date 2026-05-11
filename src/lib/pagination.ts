/**
 * Pagination Utility — Unified Standard (Partial Gap Fix)
 * ══════════════════════════════════════════════════════════════════════════════
 * Provides a single, consistent pagination standard across all 767 API endpoints.
 *
 * Usage:
 *   const { skip, take, page, limit } = parsePagination(req);
 *   const data = await prisma.model.findMany({ skip, take, where });
 *   return paginatedResponse(data, total, page, limit);
 *
 * Response shape:
 *   {
 *     data:       T[],
 *     pagination: {
 *       page:       number,    // current page (1-based)
 *       limit:      number,    // items per page
 *       total:      number,    // total matching records
 *       totalPages: number,
 *       hasNext:    boolean,
 *       hasPrev:    boolean,
 *       nextPage:   number | null,
 *       prevPage:   number | null,
 *     }
 *   }
 */

import type { NextRequest } from 'next/server';

// ─── Config ───────────────────────────────────────────────────────────────────

const DEFAULT_PAGE  = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT     = 200;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page:   number;
  limit:  number;
  skip:   number;
  take:   number;
  sortBy: string | null;
  sortDir: 'asc' | 'desc';
}

export interface PaginationMeta {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
  nextPage:   number | null;
  prevPage:   number | null;
  from:       number;   // first item index (1-based)
  to:         number;   // last item index (1-based)
}

export interface PaginatedResponse<T> {
  data:       T[];
  pagination: PaginationMeta;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract pagination params from a NextRequest's searchParams.
 * Supports: ?page=2&limit=50&sortBy=name&sortDir=asc
 */
export function parsePagination(req: NextRequest | URLSearchParams): PaginationParams {
  const sp = req instanceof URLSearchParams ? req : new URL(req.url).searchParams;

  const page  = Math.max(1, parseInt(sp.get('page')  ?? '1',  10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(sp.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
  const skip  = (page - 1) * limit;
  const sortBy  = sp.get('sortBy')  ?? null;
  const sortDir = sp.get('sortDir') === 'asc' ? 'asc' : 'desc';

  return { page, limit, skip, take: limit, sortBy, sortDir };
}

/**
 * Build the pagination meta object.
 */
export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasNext    = page < totalPages;
  const hasPrev    = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    nextPage:  hasNext ? page + 1 : null,
    prevPage:  hasPrev ? page - 1 : null,
    from:      Math.min(total, (page - 1) * limit + 1),
    to:        Math.min(total, page * limit),
  };
}

/**
 * Wrap data + total into standard paginated response.
 */
export function paginatedResponse<T>(
  data:  T[],
  total: number,
  page:  number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    pagination: buildPaginationMeta(page, limit, total),
  };
}

/**
 * Build Prisma orderBy from sortBy/sortDir params.
 * Safely whitelists only allowed sort fields.
 */
export function buildOrderBy(
  sortBy:        string | null,
  sortDir:       'asc' | 'desc',
  allowedFields: string[],
  defaultField:  string = 'createdAt',
): Record<string, 'asc' | 'desc'> {
  const field = sortBy && allowedFields.includes(sortBy) ? sortBy : defaultField;
  return { [field]: sortDir };
}

/**
 * Convenience: parse + apply pagination to a Prisma query and return wrapped response.
 *
 * Example:
 *   return withPagination(req, allowedSorts, async (skip, take, orderBy) => {
 *     const [data, total] = await prisma.$transaction([
 *       prisma.invoice.findMany({ skip, take, orderBy, where }),
 *       prisma.invoice.count({ where }),
 *     ]);
 *     return [data, total];
 *   });
 */
export async function withPagination<T>(
  req:           NextRequest,
  allowedSorts:  string[],
  queryFn:       (skip: number, take: number, orderBy: Record<string, 'asc' | 'desc'>) => Promise<[T[], number]>,
): Promise<PaginatedResponse<T>> {
  const { page, limit, skip, take, sortBy, sortDir } = parsePagination(req);
  const orderBy = buildOrderBy(sortBy, sortDir, allowedSorts);
  const [data, total] = await queryFn(skip, take, orderBy);
  return paginatedResponse(data, total, page, limit);
}
