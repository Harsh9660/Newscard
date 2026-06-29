import { useCallback, useEffect, useState } from "react";
import { api } from "./api/client";
import HelpModal from "./components/HelpModal";
import Toast from "./components/Toast";
import Dashboard from "./pages/Dashboard";
import EntityPage from "./pages/EntityPage";
import PaymentCalendar from "./pages/PaymentCalendar";
import Settings from "./pages/Settings";
import WeeklyAccount from "./pages/WeeklyAccount";

const NAV = [
  { id: "dashboard",  label: "Dashboard",    key: "1" },
  { id: "customers",  label: "Customers",    key: "2" },
  { id: "products",   label: "Publications", key: "3" },
  { id: "rounds",     label: "Rounds",       key: "4" },
  { id: "settings",   label: "Settings",     key: "0" },
];

const CUSTOMER_FIELDS = [
  { key: "name",          label: "Customer Name",  required: true },
  { key: "address",       label: "Address",        type: "textarea" },
  { key: "address2",      label: "Address 2" },
  { key: "phone",         label: "Phone" },
  { key: "email",         label: "Email" },
  { key: "street",        label: "Street" },
  { key: "round_id",      label: "Delivery Round" },
  { key: "billing_cycle", label: "Billing Cycle" },
  { key: "balance",       label: "Balance",        type: "number", step: "0.01" },
  { key: "notes",         label: "Notes",          type: "textarea" },
];

const PRODUCT_FIELDS = [
  { key: "name",         label: "Publication Name", required: true },
  { key: "product_type", label: "Type" },
  { key: "price",        label: "Price",            type: "number", step: "0.01" },
  { key: "supplier",     label: "Supplier" },
  { key: "sku",          label: "SKU" },
];

const ROUND_FIELDS = [
  { key: "name",             label: "Round Name",      required: true },
  { key: "paperboy",         label: "Paperboy" },
  { key: "delivery_charge",  label: "Delivery Charge", type: "number", step: "0.01" },
  { key: "notes",            label: "Notes",           type: "textarea" },
];

export default function App() {
  const [screen, setScreen]   = useState("dashboard");
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast]     = useState({ message: "", type: "success" });
  const [rounds, setRounds]   = useState([]);
  const [online, setOnline]   = useState(true);

  // Terminal sub-screens
  const [weeklyCustomerId,   setWeeklyCustomerId]   = useState(null);
  const [calendarCustomerId, setCalendarCustomerId] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type }), 3500);
  }, []);

  const loadRounds = useCallback(async () => {
    try {
      const r = await api.rounds.list();
      setRounds(r.map((x) => ({ value: x.id, label: x.name })));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    api.health().then(() => setOnline(true)).catch(() => setOnline(false));
    loadRounds();
  }, [loadRounds]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "F1") { e.preventDefault(); setHelpOpen(true); }
      if (e.key === "F5") { e.preventDefault(); window.dispatchEvent(new CustomEvent("newscard-refresh")); }
      if (e.ctrlKey && e.key >= "1" && e.key <= "4") {
        e.preventDefault();
        const map = { 1: "dashboard", 2: "customers", 3: "products", 4: "rounds" };
        setScreen(map[e.key]);
        setWeeklyCustomerId(null); setCalendarCustomerId(null);
      }
      if (e.ctrlKey && e.key === "0") {
        e.preventDefault(); setScreen("settings");
        setWeeklyCustomerId(null); setCalendarCustomerId(null);
      }
      if (e.key === "Escape" && helpOpen) setHelpOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [helpOpen]);

  // ── Terminal sub-screen overlays ────────────────────
  if (weeklyCustomerId !== null) {
    return (
      <div style={{ height: "100vh", background: "#1a1a1a", display: "flex", flexDirection: "column" }}>
        <WeeklyAccount
          customerId={weeklyCustomerId}
          onClose={() => setWeeklyCustomerId(null)}
          onOpenCalendar={() => {
            setCalendarCustomerId(weeklyCustomerId);
            setWeeklyCustomerId(null);
          }}
        />
      </div>
    );
  }

  if (calendarCustomerId !== null) {
    return (
      <div style={{ height: "100vh", background: "#1a1a1a", display: "flex", flexDirection: "column" }}>
        <PaymentCalendar
          customerId={calendarCustomerId}
          onClose={() => setCalendarCustomerId(null)}
          onOpenWeekly={() => {
            setWeeklyCustomerId(calendarCustomerId);
            setCalendarCustomerId(null);
          }}
        />
      </div>
    );
  }

  const content = () => {
    switch (screen) {
      case "dashboard":
        return <Dashboard onNavigate={setScreen} onHelp={() => setHelpOpen(true)} onToast={showToast} />;
      case "customers":
        return (
          <EntityPage
            screen="customers"
            title="Customers"
            entity="customers"
            exportEntity="customers"
            apiModule={api.customers}
            columns={[
              { key: "ac_number",  label: "A/c" },
              { key: "name",       label: "Name" },
              { key: "street",     label: "Street" },
              { key: "round_name", label: "Round" },
              { key: "phone",      label: "Phone" },
              { key: "balance",    label: "Balance", format: "money" },
            ]}
            fields={CUSTOMER_FIELDS}
            emptyRow={{
              name: "", address: "", address2: "", phone: "", email: "",
              street: "", round_id: null, billing_cycle: "weekly", balance: 0, notes: "",
            }}
            roundOptions={rounds}
            onHelp={() => setHelpOpen(true)}
            onToast={showToast}
            extraRowActions={[
              {
                label: "Weekly A/c",
                style: { background: "#1a3a3a", color: "#20b2aa", border: "1px solid #20b2aa",
                  borderRadius: 3, padding: "2px 8px", fontSize: 11, cursor: "pointer",
                  fontFamily: "Courier New" },
                onClick: (row) => setWeeklyCustomerId(row.id),
              },
              {
                label: "Calendar",
                style: { background: "#1a2a3a", color: "#20b2aa", border: "1px solid #20b2aa",
                  borderRadius: 3, padding: "2px 8px", fontSize: 11, cursor: "pointer",
                  fontFamily: "Courier New" },
                onClick: (row) => setCalendarCustomerId(row.id),
              },
            ]}
          />
        );
      case "products":
        return (
          <EntityPage
            screen="products"
            title="Publications"
            entity="products"
            exportEntity="products"
            apiModule={api.products}
            columns={[
              { key: "name",         label: "Name" },
              { key: "product_type", label: "Type" },
              { key: "price",        label: "Price", format: "money" },
              { key: "supplier",     label: "Supplier" },
            ]}
            fields={PRODUCT_FIELDS}
            emptyRow={{ name: "", product_type: "newspaper", price: 0, supplier: "", sku: "" }}
            onHelp={() => setHelpOpen(true)}
            onToast={showToast}
          />
        );
      case "rounds":
        return (
          <EntityPage
            screen="rounds"
            title="Delivery Rounds"
            entity="rounds"
            exportEntity="rounds"
            apiModule={api.rounds}
            columns={[
              { key: "name",             label: "Name" },
              { key: "paperboy",         label: "Paperboy" },
              { key: "delivery_charge",  label: "Delivery £", format: "money" },
              { key: "customer_count",   label: "Customers" },
            ]}
            fields={ROUND_FIELDS}
            emptyRow={{ name: "", paperboy: "", delivery_charge: 1.80, notes: "" }}
            onHelp={() => setHelpOpen(true)}
            onToast={showToast}
          />
        );
      case "settings":
        return <Settings onHelp={() => setHelpOpen(true)} onToast={showToast} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-nc-bg">
      <aside className="flex w-52 flex-col border-r border-nc-border bg-nc-panel">
        <div className="border-b border-nc-border px-3 py-4">
          <div className="text-sm font-bold text-nc-accent">NEWSCARD</div>
          <div className="text-[10px] text-nc-muted">v2.3 • SQLite</div>
          <div className={`mt-2 text-[10px] ${online ? "text-green-400" : "text-red-400"}`}>
            {online ? "● API online" : "● API offline"}
          </div>
        </div>
        <nav className="flex-1 p-2">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => { setScreen(n.id); setWeeklyCustomerId(null); setCalendarCustomerId(null); }}
              className={`mb-1 w-full rounded px-3 py-2 text-left text-xs transition ${
                screen === n.id ? "bg-[#0f3460] text-white" : "text-nc-muted hover:bg-nc-card hover:text-white"
              }`}
            >
              Ctrl+{n.key} {n.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">{content()}</main>
      {helpOpen && <HelpModal screen={screen} onClose={() => setHelpOpen(false)} />}
      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}
