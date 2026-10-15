import { money } from "@/lib/dates";

type Slice = { name: string; color: string; value: number };

const SIZE = 160;
const STROKE = 26;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const GAP = 2; // px gap between slices

export default function DonutChart({ slices, total }: { slices: Slice[]; total: number }) {
  let offset = 0;

  return (
    <figure className="donut" aria-hidden="true">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--track)" strokeWidth={STROKE} />
        {slices.map((s) => {
          const len = (s.value / total) * C;
          const dash = Math.max(len - (slices.length > 1 ? GAP : 0), 0.5);
          const el = (
            <circle
              key={s.name}
              className="donut-slice"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={STROKE}
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <figcaption className="donut-center">
        <span className="donut-total">{money.format(total)}</span>
        <span className="donut-label">spent</span>
      </figcaption>
    </figure>
  );
}
