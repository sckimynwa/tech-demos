export function formatPct(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export function formatMs(ms: number): string {
  if (ms < 0.1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 10) return `${ms.toFixed(2)}ms`;
  return `${ms.toFixed(1)}ms`;
}

export function formatFlops(flops: number): string {
  if (flops >= 1_000_000) return `${(flops / 1_000_000).toFixed(2)}M`;
  if (flops >= 1000) return `${(flops / 1000).toFixed(1)}k`;
  return String(Math.round(flops));
}

export function formatParams(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function formatInt(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}
