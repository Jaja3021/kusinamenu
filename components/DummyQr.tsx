// Placeholder QR code — inline SVG, not an image file. A real QR must
// render pixel-perfect and next/image's optimizer (quality/format
// rewriting) is exactly the kind of thing that must never touch one, so
// this sidesteps the optimizer entirely and doubles as an obvious "this is
// a placeholder" visual until a real code is dropped in as a plain <img>.
// The module grid is a fixed, deterministic pattern (no randomness) so the
// component renders identically on server and client.

const MODULE_ON: readonly number[] = [
  0, 1, 2, 3, 4, 8, 10, 12, 14, 15, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56,
  58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110,
  112, 114, 116, 118, 120, 122, 124,
];

const GRID = 21; // module count per side, matching a real QR's smallest version
const CELL = 8;
const SIZE = GRID * CELL;
const QUIET = CELL * 2;

function FinderPattern({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width={7 * CELL} height={7 * CELL} fill="currentColor" />
      <rect x={CELL} y={CELL} width={5 * CELL} height={5 * CELL} fill="white" />
      <rect x={2 * CELL} y={2 * CELL} width={3 * CELL} height={3 * CELL} fill="currentColor" />
    </g>
  );
}

export function DummyQr({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${SIZE + QUIET * 2} ${SIZE + QUIET * 2}`}
      className={className}
      role="img"
      aria-label="Placeholder QR code — replace with a real scannable code before going live"
    >
      <rect width="100%" height="100%" fill="white" />
      <g transform={`translate(${QUIET}, ${QUIET})`} className="text-forest-dark">
        <FinderPattern x={0} y={0} />
        <FinderPattern x={(GRID - 7) * CELL} y={0} />
        <FinderPattern x={0} y={(GRID - 7) * CELL} />
        {MODULE_ON.map((i) => {
          const col = 8 + (i % (GRID - 8));
          const row = 8 + Math.floor(i / (GRID - 8));
          if (col >= GRID || row >= GRID) return null;
          return <rect key={i} x={col * CELL} y={row * CELL} width={CELL} height={CELL} fill="currentColor" />;
        })}
      </g>
      <text
        x="50%"
        y={SIZE + QUIET * 2 - 6}
        textAnchor="middle"
        fontSize="9"
        fill="currentColor"
        className="text-gray-400"
      >
        Sample QR — for demo only
      </text>
    </svg>
  );
}
