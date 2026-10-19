function buildWhereClause(conditions, initialIndex = 1) {
  const clauses = [];
  const params = [];
  let currentIndex = initialIndex;

  for (const { clause, param } of conditions) {
    if (param !== undefined && param !== null && param !== '') {
      clauses.push(clause.replace(/\$\?/, `$${currentIndex}`));
      params.push(param);
      currentIndex++;
    }
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
    nextIndex: currentIndex,
  };
}

/**
 * Normalizes offset and limit for paginated database responses
 */
function sanitizePagination(page = 1, limit = 20, maxLimit = 100) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(maxLimit, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (safePage - 1) * safeLimit;

  return { page: safePage, limit: safeLimit, offset };
}

/**
 * Creates date range filter parameters for telemetry queries
 */
function getDateRangeBounds(timeframe = '30d') {
  const now = new Date();
  let startDate = new Date();

  switch (timeframe) {
    case '24h':
      startDate.setHours(now.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    case '30d':
    default:
      startDate.setDate(now.getDate() - 30);
      break;
  }

  return {
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
  };
}

module.exports = {
  buildWhereClause,
  sanitizePagination,
  getDateRangeBounds,
};
