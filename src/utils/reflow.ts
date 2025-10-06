export function reflow(current: number[], freed: number, mins: number[], maxs: number[]): number[] {
  const base = current.map((value, index) => Math.max(value - (mins[index] ?? 0), 0));
  const totalBase = base.reduce((sum, value) => sum + value, 0) || 1;
  const room = current.map((value, index) => Math.max(0, (maxs[index] ?? 100) - value));
  let remain = freed;
  const next = [...current];
  const weights = next.map((_, index) => (room[index] ? base[index] / totalBase : 0));

  for (let index = 0; index < next.length && remain > 0; index += 1) {
    const share = remain * (weights[index] || 0);
    const add = Math.min(share, room[index] || 0);
    next[index] += add;
    remain -= add;
  }

  let index = 0;
  while (remain > 0 && index < next.length) {
    const add = Math.min(remain, room[index] || 0);
    next[index] += add;
    remain -= add;
    index += 1;
  }

  const sum = next.reduce((accumulator, value) => accumulator + value, 0) || 1;
  return next.map((value) => (value / sum) * 100);
}
