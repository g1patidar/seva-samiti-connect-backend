// ID generation utilities
export function nextSequentialId(prefix, existingIds = [], minDigits = 3) {
  const regex = new RegExp(`^${prefix}(\\d+)$`);
  let maxNum = 0;
  let pad = minDigits;

  for (const id of existingIds) {
    const m = String(id).match(regex);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n)) {
        maxNum = Math.max(maxNum, n);
        pad = Math.max(pad, m[1].length);
      }
    }
  }

  const next = maxNum + 1;
  return `${prefix}${String(next).padStart(pad, "0")}`;
}
