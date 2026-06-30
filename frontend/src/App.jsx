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
  { id: "dashboard",  label: "Dashboard",    key: "1", icon: "📊" },
  { id: "customers",  label: "Customers",    key: "2", icon: "👥" },
  { id: "products",   label: "Publications", key: "3", icon: "📰" },
  { id: "rounds",     label: "Rounds",       key: "4", icon: "🚲" },
  { id: "settings",   label: "Settings",     key: "0", icon: "⚙️" },
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
  const [screen, setScreenState]   = useState(() => sessionStorage.getItem("nc_screen") || "dashboard");
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast]     = useState({ message: "", type: "success" });
  const [rounds, setRounds]   = useState([]);
  const [customers, setCustomers] = useState([]);
  const [online, setOnline]   = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Terminal sub-screens
  const [weeklyCustomerId, setWeeklyCustomerIdState] = useState(() => {
    const v = sessionStorage.getItem("nc_weekly");
    return v ? parseInt(v, 10) : null;
  });
  const [calendarCustomerId, setCalendarCustomerIdState] = useState(() => {
    const v = sessionStorage.getItem("nc_calendar");
    return v ? parseInt(v, 10) : null;
  });

  const setScreen = (s) => { setScreenState(s); sessionStorage.setItem("nc_screen", s); setMobileMenuOpen(false); };
  const setWeeklyCustomerId = (id) => { 
    setWeeklyCustomerIdState(id); 
    if (id !== null) sessionStorage.setItem("nc_weekly", id);
    else sessionStorage.removeItem("nc_weekly");
  };
  const setCalendarCustomerId = (id) => { 
    setCalendarCustomerIdState(id); 
    if (id !== null) sessionStorage.setItem("nc_calendar", id);
    else sessionStorage.removeItem("nc_calendar");
  };

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type }), 3500);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([
        api.rounds.list(),
        api.customers.list()
      ]);
      setRounds(r.map((x) => ({ value: x.id, label: x.name })));
      setCustomers(c.map((x) => ({ value: x.id, label: x.name })));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    api.health().then(() => setOnline(true)).catch(() => setOnline(false));
    loadData();
  }, [loadData]);

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
      <div className="flex flex-col h-screen bg-nc-bg">
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
      <div className="flex flex-col h-screen bg-nc-bg">
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
                label: "Weekly",
                style: { background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)",
                  borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600,
                  transition: "all 0.2s" },
                onClick: (row) => setWeeklyCustomerId(row.id),
              },
              {
                label: "Calendar",
                style: { background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600,
                  marginLeft: 8, transition: "all 0.2s" },
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
              { key: "sku",          label: "SKU" },
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
              { key: "customer_name",    label: "Customer" },
            ]}
            fields={[
              { key: "name",             label: "Round Name",      required: true },
              { key: "customer_id",      label: "Customer",        type: "select", options: customers },
              { key: "paperboy",         label: "Paperboy" },
              { key: "delivery_charge",  label: "Delivery Charge", type: "number", step: "0.01" },
              { key: "notes",            label: "Notes",           type: "textarea" },
            ]}
            emptyRow={{ name: "", customer_id: null, paperboy: "", delivery_charge: 1.80, notes: "" }}
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
    <div className="flex h-[100dvh] w-full overflow-hidden bg-nc-bg text-nc-text font-sans">
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform flex-col border-r border-nc-border glass-panel transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex`}>
        <div className="flex h-16 items-center justify-between border-b border-nc-border px-6">
          <div className="font-display text-xl font-bold tracking-tight text-white">
            NEWS<span className="text-nc-accent">CARD</span>
          </div>
          <button className="lg:hidden text-nc-muted hover:text-white" onClick={() => setMobileMenuOpen(false)}>
            ✕
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => { setScreen(n.id); setWeeklyCustomerId(null); setCalendarCustomerId(null); }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition-all ${
                screen === n.id 
                  ? "bg-nc-accent/15 text-nc-accent shadow-[inset_2px_0_0_0_#6366f1]" 
                  : "text-nc-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-lg">{n.icon}</span>
              <span>{n.label}</span>
              <span className="ml-auto text-[10px] uppercase tracking-wider opacity-50 hidden lg:block">^ {n.key}</span>
            </button>
          ))}
        </nav>
        <div className="border-t border-nc-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-black/20 p-3 text-sm">
            <div className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} />
            <span className="text-nc-muted font-medium">{online ? 'System Online' : 'Offline Mode'}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex min-w-0 flex-1 flex-col h-[100dvh] overflow-hidden">
        {/* Mobile Header */}
        <div className="flex h-16 shrink-0 items-center border-b border-nc-border bg-nc-panel/50 px-4 backdrop-blur-md lg:hidden">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-2 text-nc-muted hover:bg-white/10 hover:text-white"
          >
            ☰ Menu
          </button>
          <div className="ml-4 font-display text-lg font-bold text-white">
            NEWS<span className="text-nc-accent">CARD</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          {content()}
        </div>
      </main>

      {helpOpen && <HelpModal screen={screen} onClose={() => setHelpOpen(false)} />}
      
      {/* Premium Toast Notification */}
      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}
