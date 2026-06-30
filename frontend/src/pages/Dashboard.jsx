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
      "═══ NEWSCARDS — Dashboard ═══",
      stats
        ? \`Customers: \${stats.customer_count} | Publications: \${stats.product_count} | Rounds: \${stats.round_count}\`
        : "",
      stats ? \`Outstanding: £\${stats.total_outstanding.toFixed(2)}\` : "",
      analytics
        ? \`Avg price: £\${analytics.avg_product_price.toFixed(2)} | Catalog: £\${analytics.catalog_value.toFixed(2)}\`
        : "",
      \`Copied: \${new Date().toLocaleString()}\`,
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join("\\n"));
    onToast("Copied to clipboard");
  };

  const cards = stats
    ? [
        { label: "Customers", value: stats.customer_count, color: "text-blue-400", nav: "customers" },
        { label: "Publications", value: stats.product_count, color: "text-emerald-400", nav: "products" },
        { label: "Delivery Rounds", value: stats.round_count, color: "text-indigo-400", nav: "rounds" },
        {
          label: "Outstanding Balance",
          value: \`£\${stats.total_outstanding.toFixed(2)}\`,
          color: "text-rose-400",
          nav: "customers",
        },
        {
          label: "Customers Owing",
          value: stats.customers_with_balance,
          color: "text-amber-400",
          nav: "customers",
        },
        {
          label: "Avg Publication Price",
          value: analytics ? \`£\${analytics.avg_product_price.toFixed(2)}\` : "—",
          color: "text-purple-400",
          nav: "products",
        },
      ]
    : [];

  const balanceSegments = analytics
    ? [
        { label: "Paid up", value: analytics.balance_status.paid_up, color: "#10b981" },
        { label: "Owing money", value: analytics.balance_status.owing, color: "#f43f5e" },
        { label: "In credit", value: analytics.balance_status.credit, color: "#3b82f6" },
      ]
    : [];

  return (
    <div className="flex h-full flex-col w-full relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-nc-border px-6 py-5 gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            Overview Dashboard
          </h1>
          <p className="text-sm text-nc-muted mt-1">Real-time metrics and financial overview</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <span>↻</span> Refresh Data (F5)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
        {loading && !stats && <p className="text-nc-muted animate-pulse">Loading dashboard data...</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {cards.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => onNavigate(c.nav)}
              className="glass-card p-6 text-left group"
            >
              <div className="text-sm font-medium text-nc-muted uppercase tracking-wider mb-2 group-hover:text-white transition-colors">{c.label}</div>
              <div className={\`font-display text-3xl font-bold \${c.color}\`}>{c.value}</div>
            </button>
          ))}
        </div>

        {analytics && (
          <div className="mt-8 sm:mt-12">
            <h2 className="font-display text-xl font-bold text-white mb-6">
              Analytics & Insights
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="glass-card p-6 overflow-hidden">
                <BarChart
                  title="Customers per round"
                  data={analytics.customers_by_round}
                  accent="#3b82f6"
                />
              </div>
              <div className="glass-card p-6 overflow-hidden">
                <BarChart
                  title="Outstanding balance by round"
                  data={analytics.balance_by_round}
                  valuePrefix="£"
                  formatValue={(v) => \`£\${Number(v).toFixed(2)}\`}
                  accent="#f43f5e"
                />
              </div>
              <div className="glass-card p-6 overflow-hidden">
                <BarChart
                  title="Publications by type"
                  data={analytics.products_by_type}
                  accent="#10b981"
                />
              </div>
              <div className="glass-card p-6 overflow-hidden">
                <DonutStat title="Customer payment status" segments={balanceSegments} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-24">
              <div className="glass-card p-6">
                <h3 className="font-display font-semibold text-lg text-white mb-4">
                  Top Outstanding Balances
                </h3>
                {analytics.top_balances.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-nc-muted border-b border-nc-border">
                          <th className="pb-3 font-medium">Customer</th>
                          <th className="pb-3 font-medium text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-nc-border/50">
                        {analytics.top_balances.map((row) => (
                          <tr key={row.name} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 font-medium">{row.name}</td>
                            <td className="py-3 text-right font-bold text-rose-400">
                              £{row.balance.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 bg-white/5 rounded-lg border border-nc-border/50 border-dashed">
                    <p className="text-sm text-nc-muted">All customers are paid up 🎉</p>
                  </div>
                )}
              </div>

              <div className="glass-card p-6">
                <h3 className="font-display font-semibold text-lg text-white mb-4">
                  Quick Insights
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-nc-muted">Catalog Value <span className="text-xs ml-1 opacity-70">(Sum of prices)</span></span>
                    <span className="font-bold text-emerald-400">£{analytics.catalog_value.toFixed(2)}</span>
                  </li>
                  <li className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-nc-muted">Unassigned Customers</span>
                    <span className={\`font-bold \${analytics.unassigned_customers > 0 ? 'text-amber-400' : 'text-emerald-400'}\`}>
                      {analytics.unassigned_customers}
                    </span>
                  </li>
                  <li className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-nc-muted">Collection Rate</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-nc-panel rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{width: \`\${stats?.customer_count ? (((stats.customer_count - stats.customers_with_balance) / stats.customer_count) * 100) : 0}%\`}} 
                        />
                      </div>
                      <span className="font-bold text-white">
                        {stats?.customer_count
                          ? (((stats.customer_count - stats.customers_with_balance) / stats.customer_count) * 100).toFixed(0)
                          : 0}%
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 right-0 left-0 lg:left-64 bg-nc-bg/80 backdrop-blur-xl border-t border-nc-border p-2 sm:p-4 z-10 flex justify-end">
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
    </div>
  );
}
