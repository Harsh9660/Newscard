import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import ActionBar from "../components/ActionBar";
import BarChart, { DonutStat } from "../components/BarChart";

export default function Dashboard({ onNavigate, onHelp, onToast }) {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([api.dashboard(), api.dashboardAnalytics()]);
      setStats(s);
      setAnalytics(a);
    } catch (e) {
      onToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    const onRefresh = () => load();
    window.addEventListener("newscard-refresh", onRefresh);
    return () => {
      clearInterval(t);
      window.removeEventListener("newscard-refresh", onRefresh);
    };
  }, [load]);

  const onCopy = () => {
    if (!stats && !analytics) return;
    const lines = [
      "═══ NEWSCARD — Dashboard ═══",
      stats
        ? `Customers: ${stats.customer_count} | Publications: ${stats.product_count} | Rounds: ${stats.round_count}`
        : "",
      stats ? `Outstanding: £${stats.total_outstanding.toFixed(2)}` : "",
      analytics
        ? `Avg price: £${analytics.avg_product_price.toFixed(2)} | Catalog: £${analytics.catalog_value.toFixed(2)}`
        : "",
      `Copied: ${new Date().toLocaleString()}`,
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join("\n"));
    onToast("Copied to clipboard");
  };

  const cards = stats
    ? [
      { label: "Customers", value: stats.customer_count, color: "text-cyan-400", nav: "customers" },
      { label: "Publications", value: stats.product_count, color: "text-green-400", nav: "products" },
      { label: "Delivery Rounds", value: stats.round_count, color: "text-blue-400", nav: "rounds" },
      {
        label: "Outstanding Balance",
        value: `£${stats.total_outstanding.toFixed(2)}`,
        color: "text-red-400",
        nav: "customers",
      },
      {
        label: "Customers Owing",
        value: stats.customers_with_balance,
        color: "text-orange-400",
        nav: "customers",
      },
      {
        label: "Avg Publication Price",
        value: analytics ? `£${analytics.avg_product_price.toFixed(2)}` : "—",
        color: "text-purple-400",
        nav: "products",
      },
    ]
    : [];

  const balanceSegments = analytics
    ? [
      { label: "Paid up", value: analytics.balance_status.paid_up, color: "#2e7d32" },
      { label: "Owing money", value: analytics.balance_status.owing, color: "#e94560" },
      { label: "In credit", value: analytics.balance_status.credit, color: "#1565c0" },
    ]
    : [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-nc-border px-4 py-3">
        <h1 className="text-lg font-bold tracking-wide text-nc-accent">
          &gt; NEWSCARD_DASHBOARD
        </h1>
        <button
          type="button"
          onClick={load}
          className="rounded border border-nc-border px-3 py-1 text-xs hover:bg-nc-panel"
        >
          ↻ Refresh (F5)
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading && !stats && <p className="text-nc-muted">Loading...</p>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => onNavigate(c.nav)}
              className="rounded-lg border border-nc-border bg-nc-card p-4 text-left transition hover:border-nc-accent"
            >
              <div className="text-xs uppercase text-nc-muted">{c.label}</div>
              <div className={`mt-2 text-2xl font-bold ${c.color}`}>{c.value}</div>
            </button>
          ))}
        </div>

        {analytics && (
          <>
            <h2 className="mb-3 mt-8 text-sm font-bold text-nc-accent">
              &gt; ANALYTICS
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart
                title="Customers per round"
                data={analytics.customers_by_round}
                accent="#22d3ee"
              />
              <BarChart
                title="Outstanding balance by round"
                data={analytics.balance_by_round}
                valuePrefix="£"
                formatValue={(v) => `£${Number(v).toFixed(2)}`}
                accent="#e94560"
              />
              <BarChart
                title="Publications by type"
                data={analytics.products_by_type}
                accent="#4ade80"
              />
              <DonutStat title="Customer payment status" segments={balanceSegments} />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-nc-border bg-nc-card p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-nc-muted">
                  Top outstanding balances
                </h3>
                {analytics.top_balances.length ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-nc-muted">
                        <th className="pb-2">Customer</th>
                        <th className="pb-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.top_balances.map((row) => (
                        <tr key={row.name} className="border-t border-nc-border/40">
                          <td className="py-2">{row.name}</td>
                          <td className="py-2 text-right font-semibold text-red-400">
                            £{row.balance.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-nc-muted">All customers are paid up.</p>
                )}
              </div>

              <div className="rounded-lg border border-nc-border bg-nc-card p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-nc-muted">
                  Quick insights
                </h3>
                <ul className="space-y-2 text-sm text-nc-muted">
                  <li>
                    <span className="text-nc-text font-semibold">Catalog value</span> (sum of
                    publication prices):{" "}
                    <span className="text-green-400">
                      £{analytics.catalog_value.toFixed(2)}
                    </span>
                  </li>
                  <li>
                    <span className="text-nc-text font-semibold">Unassigned customers</span>{" "}
                    (no delivery round):{" "}
                    <span
                      className={
                        analytics.unassigned_customers > 0
                          ? "text-orange-400"
                          : "text-green-400"
                      }
                    >
                      {analytics.unassigned_customers}
                    </span>
                  </li>
                  <li>
                    <span className="text-nc-text font-semibold">Collection rate</span>:{" "}
                    {stats?.customer_count
                      ? (
                        ((stats.customer_count - stats.customers_with_balance) /
                          stats.customer_count) *
                        100
                      ).toFixed(0)
                      : 0}
                    % of customers paid up
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      <ActionBar
        left={["help"]}
        center={["copy", "export"]}
        right={[]}
        handlers={{
          help: onHelp,
          copy: onCopy,
          export_pdf: async () => {
            try {
              const r = await fetch("/api/export/pdf?entity=customers");
              const d = await r.json();
              onToast(d.message || "PDF saved to Desktop");
            } catch (e) {
              onToast(e.message, "error");
            }
          },
          export_csv: async () => {
            try {
              const r = await fetch("/api/export/csv?entity=customers");
              const d = await r.json();
              onToast(d.message || "CSV saved to Desktop");
            } catch (e) {
              onToast(e.message, "error");
            }
          },
          export_excel: async () => {
            try {
              const r = await fetch("/api/export/excel?entity=customers");
              const d = await r.json();
              onToast(d.message || "Excel saved to Desktop");
            } catch (e) {
              onToast(e.message, "error");
            }
          },
        }}
      />
    </div>
  );
}
