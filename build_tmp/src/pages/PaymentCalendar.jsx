import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

const C = {
  bg: "#1a1a1a", teal: "#20b2aa", white: "#ffffff",
  grey: "#888888", headerBg: "#0d0d0d", bottomBg: "#111111",
  infoBg: "#222222", cellCurrent: "#20b2aa",
  amtPaid: "#20b2aa", amtUnpaid: "#ff9800", amtHoliday: "#666666",
  dateFuture: "#666666", totalGreen: "#1a4a1a", totalRed: "#4a1a1a",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function Clock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("en-GB"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={{ color: C.teal, fontFamily: "Courier New", fontSize: 14 }}>{t}</span>;
}

function QuickPayDialog({ customerId, week, onClose, onSaved }) {
  const [amount, setAmount] = useState((week.amount || 0).toFixed(2));
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setSaving(true); setErr("");
    try {
      await api.markPaid({
        customer_id: customerId,
        week_end_date: week.date_iso,
        paid_amount: parseFloat(amount),
        paid_date: payDate,
        method,
        notes,
      });
      onSaved();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const inp = {
    background: "#2a2a2a", color: C.white, border: `1px solid ${C.teal}`,
    padding: "4px 8px", fontFamily: "Courier New", fontSize: 13,
    borderRadius: 2, width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
      <div style={{ background: C.bg, border: `2px solid ${C.teal}`, borderRadius: 4,
        padding: 20, width: 360, fontFamily: "Courier New" }}>
        <div style={{ color: C.teal, fontSize: 16, fontWeight: "bold", textAlign: "center",
          borderBottom: `1px solid ${C.teal}`, paddingBottom: 8, marginBottom: 12 }}>
          Record Payment
        </div>
        <div style={{ color: C.grey, fontSize: 11, marginBottom: 12 }}>
          Week ending: {week.date_iso}
        </div>
        {err && <div style={{ color: "#e94560", fontSize: 12, marginBottom: 8 }}>{err}</div>}
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ color: C.teal, fontSize: 12 }}>£ Amount
            <input type="number" step="0.01" value={amount}
              onChange={e => setAmount(e.target.value)} style={{ ...inp, marginTop: 2 }} />
          </label>
          <label style={{ color: C.teal, fontSize: 12 }}>Date
            <input type="date" value={payDate}
              onChange={e => setPayDate(e.target.value)} style={{ ...inp, marginTop: 2 }} />
          </label>
          <label style={{ color: C.teal, fontSize: 12 }}>Method
            <select value={method} onChange={e => setMethod(e.target.value)}
              style={{ ...inp, marginTop: 2 }}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank transfer">Bank Transfer</option>
              <option value="direct debit">Direct Debit</option>
            </select>
          </label>
          <label style={{ color: C.teal, fontSize: 12 }}>Notes (optional)
            <input value={notes} onChange={e => setNotes(e.target.value)}
              style={{ ...inp, marginTop: 2 }} />
          </label>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between",
          borderTop: `1px solid ${C.teal}`, marginTop: 14, paddingTop: 10 }}>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: C.grey,
            fontFamily: "Courier New", fontSize: 12, cursor: "pointer" }}>Esc  Cancel</button>
          <button onClick={save} disabled={saving} style={{
            background: "none", border: "none", color: C.teal,
            fontFamily: "Courier New", fontSize: 12, fontWeight: "bold", cursor: "pointer" }}>
            {saving ? "Saving…" : "F9  Save"}</button>
        </div>
      </div>
    </div>
  );
}

function CalCell({ week, isSel, onClick }) {
  if (!week) {
    return (
      <div style={{ height: "100%", background: C.bg,
        border: `1px solid ${C.teal}` }} />
    );
  }

  const { status, date_num, amount, is_current_week } = week;
  let bg = C.bg;
  let dateColor = C.white;
  let amtColor = "";
  let amtText = "";

  if (is_current_week) {
    bg = C.cellCurrent; dateColor = C.white;
    amtColor = C.white; amtText = amount > 0 ? amount.toFixed(2) : "";
  } else if (status === "paid") {
    amtColor = C.amtPaid; amtText = amount.toFixed(2);
  } else if (status === "overdue") {
    amtColor = C.amtUnpaid; amtText = amount.toFixed(2);
  } else if (status === "holiday") {
    dateColor = C.grey; amtColor = C.amtHoliday; amtText = "HOLD";
  } else {
    dateColor = C.dateFuture; amtText = "";
  }

  return (
    <div
      onClick={onClick}
      style={{
        height: "100%", background: bg, cursor: "pointer",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        border: isSel ? `2px solid ${C.white}` : `1px solid ${C.teal}`,
        boxSizing: "border-box",
      }}
    >
      <div style={{ color: dateColor, fontFamily: "Courier New",
        fontSize: 14, fontWeight: "bold" }}>{date_num}</div>
      <div style={{ color: amtColor, fontFamily: "Courier New", fontSize: 11 }}>
        {amtText}
      </div>
    </div>
  );
}

export default function PaymentCalendar({ customerId, onClose, onOpenWeekly }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selCell, setSelCell] = useState(null); // {row, col}
  const [payWeek, setPayWeek] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.calendar.get(customerId, year)); }
    catch { setData(null); }
    finally { setLoading(false); }
  }, [customerId, year]);

  useEffect(() => { load(); }, [load]);

  const getWeek = (row, col) => {
    if (!data) return null;
    const monthName = MONTHS[col];
    const weeks = data.months[monthName] || [];
    return weeks[row] || null;
  };

  const handleKey = (e) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "PageUp") { setYear(y => y - 1); return; }
    if (e.key === "PageDown") { setYear(y => y + 1); return; }
    if (e.key === "F3" || e.key === "Enter") {
      if (selCell) {
        const w = getWeek(selCell.row, selCell.col);
        if (w && !w.paid && !w.is_holiday) setPayWeek(w);
      }
      return;
    }
    if (!selCell) return;
    const { row, col } = selCell;
    if (e.key === "ArrowUp" && row > 0) setSelCell({ row: row - 1, col });
    if (e.key === "ArrowDown" && row < 5) setSelCell({ row: row + 1, col });
    if (e.key === "ArrowLeft" && col > 0) setSelCell({ row, col: col - 1 });
    if (e.key === "ArrowRight" && col < 11) setSelCell({ row, col: col + 1 });
  };

  const totalDue = data?.total_due || 0;
  const totalBg = totalDue === 0 ? C.totalGreen : C.totalRed;
  const cust = data?.customer || {};

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKey}
      style={{ background: C.bg, display: "flex", flexDirection: "column",
        height: "100%", outline: "none", fontFamily: "Courier New" }}
    >
      {payWeek && (
        <QuickPayDialog
          customerId={customerId}
          week={payWeek}
          onClose={() => setPayWeek(null)}
          onSaved={() => { setPayWeek(null); load(); }}
        />
      )}

      {/* Title bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "4px 10px 2px" }}>
        <span style={{ color: C.teal, fontSize: 15, fontWeight: "bold", minWidth: 180 }}>
          A/c No: {cust.ac_number || "—"}
        </span>
        <span onClick={() => setYear(y => y - 1)} style={{
          color: C.teal, fontSize: 18, cursor: "pointer", padding: "0 8px" }}>◀</span>
        <span style={{ color: C.teal, fontSize: 22, fontWeight: "bold",
          flex: 1, textAlign: "center", letterSpacing: 6 }}>{year}</span>
        <span onClick={() => setYear(y => y + 1)} style={{
          color: C.teal, fontSize: 18, cursor: "pointer", padding: "0 8px" }}>▶</span>
        <div style={{ minWidth: 130, textAlign: "right" }}><Clock /></div>
      </div>

      {/* Customer info + Total Due */}
      <div style={{ display: "flex", gap: 4, padding: "2px 10px 4px" }}>
        <div style={{ flex: 1, background: C.infoBg, border: `1px solid ${C.teal}`,
          padding: "4px 10px" }}>
          <div style={{ color: C.white, fontSize: 12 }}>
            <span style={{ color: C.teal }}>Name: </span>{cust.name || ""}
          </div>
          <div style={{ color: C.white, fontSize: 12 }}>
            <span style={{ color: C.teal }}>Address: </span>{cust.address1 || ""}
          </div>
          <div style={{ color: C.white, fontSize: 12 }}>
            <span style={{ color: C.teal }}>Phone: </span>{cust.phone || ""}
          </div>
        </div>
        <div style={{ width: 240, background: C.infoBg, border: `1px solid ${C.teal}`,
          padding: "4px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: C.white, fontSize: 14, fontWeight: "bold" }}>Total Due:  £</span>
          <span style={{
            background: totalBg, color: "#fff", fontFamily: "Courier New",
            fontSize: 14, fontWeight: "bold", padding: "2px 10px",
            borderRadius: 3, minWidth: 70, textAlign: "right"
          }}>{totalDue.toFixed(2)}</span>
        </div>
      </div>

      {/* Month headers */}
      <div style={{ display: "flex", padding: "0 10px" }}>
        {MONTHS.map(m => (
          <div key={m} style={{
            flex: 1, textAlign: "center", color: C.white,
            fontWeight: "bold", fontSize: 13,
            borderBottom: `1px solid ${C.teal}`,
            borderRight: `1px solid ${C.teal}`, padding: "2px 0"
          }}>{m}</div>
        ))}
        <div style={{ width: 16, color: C.teal, fontSize: 14, textAlign: "center" }}>▲</div>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center",
          justifyContent: "center", color: C.teal, fontSize: 14 }}>
          Loading…
        </div>
      ) : (
        <div style={{ flex: 1, display: "grid", gridTemplateRows: "repeat(6, 1fr)",
          padding: "0 10px", border: `2px solid ${C.teal}`, margin: "0 10px" }}>
          {Array.from({ length: 6 }).map((_, row) => (
            <div key={row} style={{ display: "flex" }}>
              {MONTHS.map((_, col) => {
                const week = getWeek(row, col);
                const isSel = selCell?.row === row && selCell?.col === col;
                return (
                  <div key={col} style={{ flex: 1, minHeight: 68 }}>
                    <CalCell
                      week={week}
                      isSel={isSel}
                      onClick={() => {
                        setSelCell({ row, col });
                        if (week && !week.paid && !week.is_holiday) setPayWeek(week);
                      }}
                    />
                  </div>
                );
              })}
              <div style={{ width: 16 }} />
            </div>
          ))}
        </div>
      )}

      {/* Terminal bottom bar */}
      <div style={{ height: 30, background: C.bottomBg, borderTop: `1px solid ${C.teal}`,
        display: "flex", alignItems: "center", padding: "0 10px",
        fontFamily: "Courier New", fontSize: 12, marginTop: 4 }}>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: C.grey,
          fontFamily: "Courier New", fontSize: 12, cursor: "pointer", padding: 0 }}>close</button>
        <span style={{ color: C.grey, margin: "0 6px" }}>|</span>
        <span style={{ color: C.grey }}>F1 F2 help</span>
        <span style={{ color: C.grey, margin: "0 6px" }}>|</span>
        <span style={{ color: C.teal }}>F3 paid</span>
        <span style={{ color: C.grey, margin: "0 6px" }}>|</span>
        <button onClick={onOpenWeekly} style={{
          background: "none", border: "none", color: C.grey,
          fontFamily: "Courier New", fontSize: 12, cursor: "pointer", padding: 0 }}>
          F6 papers</button>
        <span style={{ flex: 1 }} />
        <span style={{ color: C.grey }}>PgUp/PgDn  year</span>
      </div>
    </div>
  );
}
