export function sanitizeId(value) {
  return String(value).replace(/[^a-zA-Z0-9-].*$/, '');
}

export function sanitizeText(value) {
  return String(value).replace(/[^\w\s-]/g, '');
}

export function sanitizeNumber(value, min = -Infinity, max = Infinity) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, min), max);
}

