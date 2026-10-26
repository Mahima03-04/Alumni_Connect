'use strict';

const MAX_LIMIT = 100;

/**
 * Reads `page`, `limit`, `sort` and `order` from the query string and returns
 * normalised values plus a ready-to-merge mongoose options object.
 */
function getPagination(query = {}, { defaultLimit = 12, maxLimit = MAX_LIMIT } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const order = String(query.order || 'desc').toLowerCase() === 'asc' ? 1 : -1;
  const allowedSort = query.sortBy ? String(query.sortBy) : 'createdAt';

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sort: { [allowedSort]: order },
    meta(total) {
      const pages = Math.max(1, Math.ceil(total / limit));
      return {
        total,
        page,
        limit,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      };
    },
  };
}

module.exports = { getPagination, MAX_LIMIT };
