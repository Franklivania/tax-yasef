export function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[,\s]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return 0;
  return n;
}
