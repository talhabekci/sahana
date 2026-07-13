/** BACKLOG #64 — tek eksende ikinci derece Bezier interpolasyonu (UI thread'de çalışır). */
export function quadraticBezier(T: number, P0: number, P1: number, P2: number): number {
  'worklet';
  const OneMinusT = 1 - T;

  return OneMinusT * OneMinusT * P0 + 2 * OneMinusT * T * P1 + T * T * P2;
}
