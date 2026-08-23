"use client";

export interface ChartDatum {
  label: string;
  value: number;
  color: string;
}

/** Simple horizontal bar chart, no charting library — consistent with the hand-built pavilion map. */
export function BarChart({ data, title }: { data: ChartDatum[]; title: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="font-display text-sm font-bold">{title}</h3>
      <div className="mt-4 space-y-3">
        {data.map((d) => (
          <div key={d.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted">{d.label}</span>
              <span className="font-semibold">{d.value}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }}
              />
            </div>
          </div>
        ))}
        {data.length === 0 && <p className="text-xs text-muted">No data yet.</p>}
      </div>
    </div>
  );
}

/** Simple SVG donut chart, no charting library. */
export function DonutChart({ data, title }: { data: ChartDatum[]; title: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="font-display text-sm font-bold">{title}</h3>
      <div className="mt-4 flex items-center gap-6">
        <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0 -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#EEF2EE" strokeWidth="16" />
          {total > 0 &&
            data.map((d) => {
              const fraction = d.value / total;
              const dash = fraction * circumference;
              const circle = (
                <circle
                  key={d.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={d.color}
                  strokeWidth="16"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return circle;
            })}
        </svg>
        <ul className="space-y-1.5 text-xs">
          {data.map((d) => (
            <li key={d.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
              <span className="text-muted">{d.label}</span>
              <span className="font-semibold">{d.value}</span>
            </li>
          ))}
          {total === 0 && <li className="text-muted">No data yet.</li>}
        </ul>
      </div>
    </div>
  );
}
