import { blochVector, type StateVector } from "@/lib/quantum/simulator";

/** Lightweight SVG Bloch sphere — no 3D dependency. */
export function BlochSphere({
  state,
  qubit,
  size = 132,
}: {
  state: StateVector;
  qubit: number;
  size?: number;
}) {
  const { x, y, z, purity } = blochVector(state, qubit);
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;

  // Isometric-ish projection: x to the right-down, y to the right-up, z up.
  const px = cx + r * (x * 0.86 + y * 0.5);
  const py = cy - r * (z - x * 0.28 + y * 0.28);

  const mixed = purity < 0.995;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Bloch sphere for qubit ${qubit}`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="var(--color-surface-raised)"
          stroke="var(--color-border)"
        />
        <ellipse
          cx={cx}
          cy={cy}
          rx={r}
          ry={r * 0.32}
          fill="none"
          stroke="var(--color-grid)"
        />
        <ellipse
          cx={cx}
          cy={cy}
          rx={r * 0.32}
          ry={r}
          fill="none"
          stroke="var(--color-grid)"
        />
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="var(--color-grid)" />
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="var(--color-grid)" />
        <text x={cx + 3} y={cy - r + 2} className="fill-muted-foreground" fontSize="9">
          |0⟩
        </text>
        <text x={cx + 3} y={cy + r - 1} className="fill-muted-foreground" fontSize="9">
          |1⟩
        </text>
        <line
          x1={cx}
          y1={cy}
          x2={px}
          y2={py}
          stroke="var(--color-signal)"
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={mixed ? 0.6 : 1}
        />
        <circle cx={px} cy={py} r={4.5} fill="var(--color-signal)" opacity={mixed ? 0.6 : 1} />
      </svg>
      <div className="text-center">
        <p className="font-mono text-xs text-foreground">q[{qubit}]</p>
        <p className="font-mono text-[0.6rem] text-muted-foreground">
          x {x.toFixed(2)} · y {y.toFixed(2)} · z {z.toFixed(2)}
        </p>
        {mixed && (
          <p className="font-mono text-[0.6rem]" style={{ color: "var(--color-entangle)" }}>
            entangled (r={purity.toFixed(2)})
          </p>
        )}
      </div>
    </div>
  );
}
