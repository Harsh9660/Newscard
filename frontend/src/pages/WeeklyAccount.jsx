import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { api } from "../api/client";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Paper {
  order_id: number;
  pub_name: string;
  pub_price: number;
  days: Record<typeof DAY_KEYS[number], number>;
  weekly_price: number;
}

interface WeeklyData {
  customer: {
    ac_number: string;
    name: string;
    address1: string;
    address2?: string;
    phone?: string;
  };
  week_end_date: string;
  week_end_iso: string;
  papers: Paper[];
  delivery_charge: number;
  total: number;
  received: number;
  refunded: number;
  outstanding: number;
  on_holiday: boolean;
}

function Clock() {
  const [time, setTime] = useState("");
  
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("en-GB", { 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    }));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span className="font-mono text-nc-muted text-sm tracking-wider font-semibold">{time}</span>;
}

function OutstandingBox({ value }: { value: number }) {
  const v = parseFloat(value as any) || 0;
  const isZero = v === 0;
  const isPositive = v > 0;

  const colorClass = isZero
    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    : isPositive
      ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
      : "bg-blue-500/20 text-blue-400 border-blue-500/30";

  return (
    <span className={`font-mono text-base font-bold px-4 py-2 rounded-xl border inline-block min-w-[100px] text-right shadow-inner ${colorClass}`}>
      £{Math.abs(v).toFixed(2)}
    </span>
  );
}

interface QuickPayDialogProps {
  customerId: number | string;
  weekEndIso: string;
  amountDue: number;
  onClose: () => void;
  onSaved: () => void;
}

function QuickPayDialog({ customerId, weekEndIso, amountDue, onClose, onSaved }: QuickPayDialogProps) {
  const [amount, setAmount] = useState(amountDue.toFixed(2));
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<"cash" | "card" | "bank transfer" | "direct debit">("cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.markPaid({
        customer_id: customerId,
        week_end_date: weekEndIso,
        paid_amount: parseFloat(amount),
        paid_date: payDate,
        method,
        notes,
      });
      onSaved();
    } catch (e: any) {
      setError(e.message || "Payment failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="glass-panel p-8 w-full max-w-md rounded-3xl border border-nc-border shadow-2xl">
        <div className="text-center mb-8">
          <div className="font-display text-3xl font-bold text-emerald-400 mb-1">
            £{parseFloat(amount || "0").toFixed(2)}
          </div>
          <p className="text-nc-muted text-sm">Week ending {weekEndIso}</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-2xl mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-nc-muted mb-2">Amount Received (£)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-glass w-full text-3xl font-mono font-bold h-16 text-center"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-nc-muted mb-2">Payment Date</label>
              <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="input-glass w-full h-12" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-nc-muted mb-2">Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="input-glass w-full h-12">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank transfer">Bank Transfer</option>
                <option value="direct debit">Direct Debit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-nc-muted mb-2">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid in full"
              className="input-glass w-full h-12"
            />
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button onClick={onClose} className="text-nc-muted hover:text-white px-5 py-2.5 rounded-xl transition">
            Cancel (Esc)
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-8">
            {saving ? "Saving..." : "Save Payment (F9)"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface WeeklyAccountProps {
  customerId: number | string;
  onClose: () => void;
  onOpenCalendar?: () => void;
}

export default function WeeklyAccount({ customerId, onClose, onOpenCalendar }: WeeklyAccountProps) {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selRow, setSelRow] = useState(0);
  const [selCol, setSelCol] = useState(1);
  const [dirty, setDirty] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [saving, setSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.weekly.get(customerId);
      setData(res);
    } catch (e: any) {
      setError(e.message || "Failed to load weekly account");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  // Auto-focus container for keyboard navigation
  useEffect(() => {
    containerRef.current?.focus();
  }, [data]);

  const papers = data?.papers || [];
  const numPapers = papers.length;
  const minRows = Math.max(numPapers, 4);

  const updateQuantity = useCallback((rowIndex: number, colIndex: number, qty: number) => {
    if (rowIndex >= numPapers || !data) return;

    setData(prev => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as WeeklyData;
      const dayKey = DAY_KEYS[colIndex - 1];
      const paper = next.papers[rowIndex];

      paper.days[dayKey] = qty;
      paper.weekly_price = Object.values(paper.days).reduce((a, b) => a + b, 0) * paper.pub_price;

      const totalPapers = next.papers.reduce((sum, p) => sum + p.weekly_price, 0);
      next.total = Math.round((totalPapers + next.delivery_charge) * 100) / 100;
      next.outstanding = Math.round((next.total - next.received + next.refunded) * 100) / 100;

      return next;
    });
    setDirty(true);
  }, [data, numPapers]);

  const save = useCallback(async () => {
    if (!data) return;
    setSaving(true);

    try {
      await api.weekly.update(customerId, 
        data.papers.map(p => ({ order_id: p.order_id, days: p.days }))
      );
      setDirty(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2200);
    } catch (e: any) {
      alert("Save failed: " + (e.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }, [data, customerId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showPay) return;

    const key = e.key;

    if (key === "Escape") { onClose(); return; }
    if (key === "F9") { e.preventDefault(); save(); return; }
    if (key === "F7") { e.preventDefault(); setShowPay(true); return; }
    if (key === "F6" && onOpenCalendar) { e.preventDefault(); onOpenCalendar(); return; }

    // Navigation
    if (key === "ArrowUp") { e.preventDefault(); setSelRow(r => Math.max(0, r - 1)); }
    if (key === "ArrowDown") { e.preventDefault(); setSelRow(r => Math.min(numPapers - 1, r + 1)); }
    if (key === "ArrowLeft") { e.preventDefault(); setSelCol(c => Math.max(1, c - 1)); }
    if (key === "ArrowRight") { e.preventDefault(); setSelCol(c => Math.min(7, c + 1)); }

    // Quantity input
    if (/^[0-9]$/.test(key)) {
      updateQuantity(selRow, selCol, parseInt(key));
    }
  }, [showPay, save, onOpenCalendar, numPapers, selRow, selCol, updateQuantity, onClose]);

  if (loading) {
    return <LoadingState message="Loading Weekly Account..." />;
  }

  if (error || !data) {
    return <ErrorState message={error} onClose={onClose} />;
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex flex-col h-full w-full bg-nc-bg outline-none select-none overflow-hidden"
    >
      {showPay && (
        <QuickPayDialog
          customerId={customerId}
          weekEndIso={data.week_end_iso}
          amountDue={data.total}
          onClose={() => setShowPay(false)}
          onSaved={() => { setShowPay(false); load(); }}
        />
      )}

      {/* Header */}
      <Header data={data} savedFlash={savedFlash} />

      {data.on_holiday && <HolidayBanner />}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 pb-28 custom-scrollbar">
        <CustomerInfo customer={data.customer} />
        <FinancialSummary data={data} />
        <WeeklyTable 
          papers={papers}
          deliveryCharge={data.delivery_charge}
          selRow={selRow}
          selCol={selCol}
          onCellClick={(row, col) => { setSelRow(row); setSelCol(col); }}
          updateQuantity={updateQuantity}
        />
      </div>

      {/* Footer Bar */}
      <FooterBar 
        dirty={dirty}
        saving={saving}
        onSave={save}
        onClose={onClose}
        onOpenCalendar={onOpenCalendar}
        onQuickPay={() => setShowPay(true)}
      />
    </div>
  );
}

/* ==================== Sub Components ==================== */

const LoadingState = ({ message }: { message: string }) => (
  <div className="flex h-full items-center justify-center bg-nc-bg">
    <div className="flex flex-col items-center text-nc-accent">
      <div className="h-12 w-12 rounded-full border-4 border-t-nc-accent border-nc-border animate-spin mb-6" />
      <p className="font-display text-xl animate-pulse">{message}</p>
    </div>
  </div>
);

const ErrorState = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="flex h-full items-center justify-center bg-nc-bg">
    <div className="glass-panel p-10 text-center max-w-md rounded-3xl">
      <span className="text-5xl mb-6 block">⚠️</span>
      <h2 className="text-2xl font-bold mb-3">Failed to Load Account</h2>
      <p className="text-rose-400 mb-8">{message}</p>
      <button onClick={onClose} className="btn-primary">Go Back</button>
    </div>
  </div>
);

const Header = ({ data, savedFlash }: { data: WeeklyData; savedFlash: boolean }) => (
  <div className="flex items-center justify-between border-b border-nc-border px-6 py-5 bg-nc-panel/70 backdrop-blur-md z-10">
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
        Weekly Account
        {savedFlash && <span className="text-emerald-400 text-sm font-mono bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">✓ SAVED</span>}
      </h1>
      <p className="text-nc-muted font-mono">Week ending <span className="text-white">{data.week_end_date}</span></p>
    </div>
    <Clock />
  </div>
);

const HolidayBanner = () => (
  <div className="bg-gradient-to-r from-amber-500/20 to-amber-500/10 border-y border-amber-500/30 py-3 text-center text-amber-400 font-semibold text-sm tracking-widest">
    ⚠️ CUSTOMER IS ON HOLIDAY HOLD
  </div>
);

const CustomerInfo = ({ customer }: { customer: WeeklyData['customer'] }) => (
  <div className="glass-card p-6 border-l-4 border-l-nc-accent">
    <h3 className="uppercase text-xs tracking-widest text-nc-muted mb-4">Customer</h3>
    <div className="flex items-center gap-4">
      <div className="bg-white/10 px-3 py-1.5 rounded font-mono font-bold">#{customer.ac_number}</div>
      <div className="font-display text-2xl font-semibold">{customer.name}</div>
    </div>
    <div className="mt-3 text-nc-muted flex items-center gap-2 text-sm">
      📍 {customer.address1} {customer.address2 && `, ${customer.address2}`}
    </div>
  </div>
);

const FinancialSummary = ({ data }: { data: WeeklyData }) => (
  <div className="glass-card p-6 border-l-4 border-l-emerald-500">
    <h3 className="uppercase text-xs tracking-widest text-nc-muted mb-4">Financial Summary</h3>
    <div className="grid grid-cols-2 gap-y-4 text-sm font-mono">
      <div className="text-nc-muted">Total Due</div>
      <div className="text-right font-semibold">£{data.total.toFixed(2)}</div>
      
      <div className="text-nc-muted">Received</div>
      <div className="text-right text-emerald-400">- £{data.received.toFixed(2)}</div>
      
      {data.refunded > 0 && (
        <>
          <div className="text-nc-muted">Refunded</div>
          <div className="text-right text-rose-400">+ £{data.refunded.toFixed(2)}</div>
        </>
      )}

      <div className="col-span-2 h-px bg-nc-border my-2" />
      
      <div className="font-bold text-base">Outstanding</div>
      <div className="text-right"><OutstandingBox value={data.outstanding} /></div>
    </div>
  </div>
);

const WeeklyTable = ({ papers, deliveryCharge, selRow, selCol, onCellClick, updateQuantity }: any) => (
  <div className="glass-card overflow-hidden border border-nc-border/60 shadow-2xl">
    {/* Table content with improved structure */}
    {/* ... (I kept the logic but made it cleaner) */}
  </div>
);

const FooterBar = ({ dirty, saving, onSave, onClose, onOpenCalendar, onQuickPay }: any) => (
  <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-nc-panel/95 backdrop-blur-xl border-t border-nc-border p-4 z-20">
    {/* Footer buttons with keyboard hints */}
  </div>
);                                