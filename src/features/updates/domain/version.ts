export function compareVersions(a: string, b: string): number {
  const left = String(a ?? "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
  const right = String(b ?? "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) {
      return diff > 0 ? 1 : -1;
    }
  }

  return 0;
}
