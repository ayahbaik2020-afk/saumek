function getCol(row, column) {
  return row[column] ?? row[column.toLowerCase()] ?? row[column.toUpperCase()];
}

function matchesLike(value, pattern) {
  const regex = String(pattern)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/%/g, ".*")
    .replace(/_/g, ".");
  return new RegExp("^" + regex + "$", "i").test(String(value ?? ""));
}

export function applyFilter(row, filter) {
  const val = getCol(row, filter.column);
  switch (filter.op) {
    case "eq":
      return val === filter.value;
    case "ne":
      return val !== filter.value;
    case "in":
      return (filter.values ?? []).includes(val);
    case "notin":
      return !(filter.values ?? []).includes(val);
    case "like":
      return matchesLike(val, filter.value);
    case "gt":
      return val != null && val > filter.value;
    case "gte":
      return val != null && val >= filter.value;
    case "lt":
      return val != null && val < filter.value;
    case "lte":
      return val != null && val <= filter.value;
    default:
      return true;
  }
}

export function matchesFilters(row, filters = []) {
  return filters.every((f) => applyFilter(row, f));
}

export function filtersToSql(filters = []) {
  const q = (v) => `'${String(v).replace(/'/g, "''")}'`;
  return filters
    .map((f) => {
      const col = `[${f.column}]`;
      switch (f.op) {
        case "eq":
          return `${col} = ${q(f.value)}`;
        case "ne":
          return `${col} <> ${q(f.value)}`;
        case "in":
          return `${col} IN (${(f.values ?? []).map(q).join(", ")})`;
        case "notin":
          return `${col} NOT IN (${(f.values ?? []).map(q).join(", ")})`;
        case "like":
          return `${col} LIKE ${q(f.value)}`;
        case "gt":
          return `${col} > ${q(f.value)}`;
        case "gte":
          return `${col} >= ${q(f.value)}`;
        case "lt":
          return `${col} < ${q(f.value)}`;
        case "lte":
          return `${col} <= ${q(f.value)}`;
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join(" AND ");
}
