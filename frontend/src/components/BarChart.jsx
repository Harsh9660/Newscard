/** Simple horizontal bar chart — no external chart library. */
export default function BarChart({
  title,
  data = [],
  valuePrefix = "",
  valueSuffix = "",
  formatValue,
  emptyMessage = "No data yet",
  accent = "#e94560",
}) {
  const items = data;
  const max = Math.max(...items.map((d) => d.value), 1);

  const fmt = (v) =>
    formatValue ? formatValue(v) : `${valuePrefix}${Number(v).toLocaleString()}${valueSuffix}`;

  return (
    <div className="rounded-lg border border-nc-border bg-nc-card p-4">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-nc-muted">{title}</h3>
      {!items.length ? (
        <p className="text-xs text-nc-muted">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((d) => (
            <li key={d.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="truncate pr-2 text-nc-text">{d.label}</span>
                <span className="shrink-0 font-semibold text-nc-text">{fmt(d.value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#16213e]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0)}%`,
                    backgroundColor: accent,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DonutStat({ title, segments, emptyMessage = "No data" }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (!total) {
    return (
      <div className="rounded-lg border border-nc-border bg-nc-card p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-nc-muted">{title}</h3>
        <p className="text-xs text-nc-muted">{emptyMessage}</p>
      </div>
    );
  }

  let offset = 0;
  const stops = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const pct = (s.value / total) * 100;
      const start = offset;
      offset += pct;
      return `${s.color} ${start}% ${offset}%`;
    })
    .join(", ");

  return (
    <div className="rounded-lg border border-nc-border bg-nc-card p-4">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-nc-muted">{title}</h3>
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="h-24 w-24 shrink-0 rounded-full"
          style={{ background: `conic-gradient(${stops})` }}
          title={`Total: ${total}`}
        />
        <ul className="flex-1 space-y-1.5 text-xs">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-nc-muted">{s.label}</span>
              <span className="ml-auto font-semibold">
                {s.value}{" "}
                <span className="font-normal text-nc-muted">
                  ({((s.value / total) * 100).toFixed(0)}%)
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
