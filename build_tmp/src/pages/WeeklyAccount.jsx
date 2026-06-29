import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";

const C = {
  bg: "#1a1a1a", teal: "#20b2aa", white: "#ffffff",
  grey: "#a0a0a0", cellNormal: "#2a2a2a", headerBg: "#0d0d0d",
  bottomBg: "#111111", infoBg: "#222222",
  green: "#1a4a1a", red: "#4a1a1a", blue: "#1a1a4a",
  holidayBg: "#3a2000", holidayText: "#ff9800",
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function OutstandingBox({ value }) {
  const v = parseFloat(value) || 0;
  const bg = v === 0 ? C.green : v > 0 ? C.red : C.blue;
  return (
    <span style={{
      background: bg, color: "#fff", fontFamily: "Courier New",
      fontSize: 14, fontWeight: "bold", padding: "2px 10px",
      borderRadius: 3, minWidth: 70, display: "inline-block", textAlign: "right"
    }}>
      {Math.abs(v).toFixed(2)}
    </span>
  );
}

function QuickPayDialog({ customerId, weekEndIso, amountDue, onClose, onSaved }) {
  const [amount, setAmount] = useState(amountDue.toFixed(2));
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
        week_end_date: weekEndIso,
        paid_amount: parseFloat(amount),
        paid_date: payDate,
        method,
        notes,
      });
      onSaved();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const inputStyle = {
    background: "#2a2a2a", color: C.white, border: `1px solid ${C.teal}`,
    padding: "4px 8px", fontFamily: "Courier New", fontSize: 13,
    borderRadius: 2, width: "100%", boxSizing: "border-box"
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200
    }}>
      <div style={{
        background: C.bg, border: `2px solid ${C.teal}`, borderRadius: 4,
        padding: 20, width: 360, fontFamily: "Courier New"
      }}>
        <div style={{ color: C.teal, fontSize: 16, fontWeight: "bold", textAlign: "center",
          borderBottom: `1px solid ${C.teal}`, paddingBottom: 8, marginBottom: 12 }}>
          Record Payment
        </div>
        <div style={{ color: C.grey, fontSize: 11, marginBottom: 12 }}>
          Week ending: {weekEndIso}
        </div>
        {err && <div style={{ color: "#e94560", marginBottom: 8, fontSize: 12 }}>{err}</div>}
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ color: C.teal, fontSize: 12 }}>£ Amount
            <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
              style={{ ...inputStyle, marginTop: 2 }} />
          </label>
          <label style={{ color: C.teal, fontSize: 12 }}>Date
            <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
              style={{ ...inputStyle, marginTop: 2 }} />
          </label>
          <label style={{ color: C.teal, fontSize: 12 }}>Method
            <select value={method} onChange={e => setMethod(e.target.value)}
              style={{ ...inputStyle, marginTop: 2 }}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank transfer">Bank Transfer</option>
              <option value="direct debit">Direct Debit</option>
            </select>
          </label>
          <label style={{ color: C.teal, fontSize: 12 }}>Notes (optional)
            <input value={notes} onChange={e => setNotes(e.target.value)}
              style={{ ...inputStyle, marginTop: 2 }} />
          </label>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16,
          borderTop: `1px solid ${C.teal}`, paddingTop: 10 }}>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: C.grey,
            fontFamily: "Courier New", fontSize: 12, cursor: "pointer"
          }}>Esc  Cancel</button>
          <button onClick={save} disabled={saving} style={{
            background: "none", border: "none", color: C.teal,
            fontFamily: "Courier New", fontSize: 12, fontWeight: "bold", cursor: "pointer"
          }}>{saving ? "Saving…" : "F9  Save"}</button>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyAccount({ customerId, onClose, onOpenCalendar }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selRow, setSelRow] = useState(0);
  const [selCol, setSelCol] = useState(1); // 1=Sun … 7=Sat
  const [dirty, setDirty] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try { setData(await api.weekly.get(customerId)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.focus();
  }, [data]);

  const papers = data?.papers || [];
  const numPapers = papers.length;

  const setQty = (row, col, qty) => {
    if (row >= numPapers) return;
    const day = DAY_KEYS[col - 1];
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.papers[row].days[day] = qty;
      // Recalc price
      const p = next.papers[row];
      p.weekly_price = Object.values(p.days).reduce((a, b) => a + b, 0) * p.pub_price;
      // Recalc total
      const tot = next.papers.reduce((a, p) => a + p.weekly_price, 0) + next.delivery_charge;
      next.total = Math.round(tot * 100) / 100;
      next.outstanding = Math.round((next.total - next.received + next.refunded) * 100) / 100;
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const updated = await api.weekly.update(customerId,
        data.papers.map(p => ({ order_id: p.order_id, days: p.days }))
      );
      setData(updated);
      setDirty(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (e) { alert("Save failed: " + e.message); }
    finally { setSaving(false); }
  };

  const handleKey = (e) => {
    const key = e.key;
    if (key === "Escape") { handleClose(); return; }
    if (key === "F9") { e.preventDefault(); save(); return; }
    if (key === "F3") { e.preventDefault(); setShowPay(true); return; }
    if (key === "F6") { e.preventDefault(); if (onOpenCalendar) onOpenCalendar(); return; }
    if (key === "s" && e.ctrlKey) { e.preventDefault(); save(); return; }
    if (key === "ArrowUp") { setSelRow(r => Math.max(0, r - 1)); return; }
    if (key === "ArrowDown") { setSelRow(r => Math.min(numPapers - 1, r + 1)); return; }
    if (key === "ArrowLeft") { setSelCol(c => Math.max(1, c - 1)); return; }
    if (key === "ArrowRight") { setSelCol(c => Math.min(7, c + 1)); return; }
    if (key === "Tab") { e.preventDefault(); setSelCol(c => c < 7 ? c + 1 : 1); return; }
    if (["0","1","2","3","4","5","6","7","8","9"].includes(key)) {
      setQty(selRow, selCol, parseInt(key));
    }
  };

  const handleClose = () => {
    if (dirty && !window.confirm("You have unsaved changes. Save before closing?")) {
      onClose(); return;
    }
    if (dirty) save().then(onClose);
    else onClose();
  };

  const td = (content, style = {}) => ({
    ...style,
    fontFamily: "Courier New", fontSize: 13, color: C.white,
    border: `1px solid ${C.teal}`, textAlign: "center",
    padding: "0 4px", height: 40, verticalAlign: "middle",
    background: C.cellNormal,
  });

  if (loading) return (
    <div style={{ background: C.bg, color: C.teal, fontFamily: "Courier New",
      display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      Loading weekly account…
    </div>
  );

  if (err) return (
    <div style={{ background: C.bg, color: "#e94560", fontFamily: "Courier New",
      display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      {err}
    </div>
  );

  const cust = data.customer;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKey}
      style={{ background: C.bg, display: "flex", flexDirection: "column",
        height: "100%", outline: "none", userSelect: "none" }}
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

      {/* Title bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "4px 8px 2px" }}>
        <div style={{ flex: 1 }} />
        <div style={{ color: C.teal, fontFamily: "Courier New", fontSize: 20,
          fontWeight: "bold", textAlign: "center", flex: 2 }}>
          {savedFlash ? "Weekly Account  ✓ Saved" : "Weekly Account"}
        </div>
        <div style={{ flex: 1, textAlign: "right" }}><Clock /></div>
      </div>

      {/* Holiday banner */}
      {data.on_holiday && (
        <div style={{ background: C.holidayBg, color: C.holidayText,
          fontFamily: "Courier New", fontSize: 13, fontWeight: "bold",
          textAlign: "center", padding: 4, border: `1px solid ${C.holidayText}`,
          margin: "0 8px" }}>
          ⚠ CUSTOMER IS ON HOLIDAY HOLD THIS WEEK
        </div>
      )}

      {/* Main grid */}
      <div style={{ padding: "4px 8px 0", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse",
          border: `2px solid ${C.teal}`, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "28%" }} />
            {DAY_KEYS.map((_, i) => <col key={i} style={{ width: "8%" }} />)}
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr style={{ background: C.headerBg }}>
              {["Paper & Adjustment", ...DAY_LABELS, "Price"].map((h) => (
                <th key={h} style={{
                  color: C.white, fontFamily: "Courier New", fontWeight: "bold",
                  fontSize: 13, border: `1px solid ${C.teal}`, padding: "6px 4px",
                  textAlign: h === "Price" || h === "Paper & Adjustment" ? "left" : "center",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, row) => {
              const paper = papers[row];
              const isSelected = row === selRow && row < numPapers;
              return (
                <tr key={row}>
                  {/* Paper name col */}
                  <td style={{ ...td(), textAlign: "left", paddingLeft: 6,
                    color: paper ? C.grey : "#333" }}>
                    {paper ? `${isSelected ? "→ " : "   "}${paper.pub_name}` : ""}
                  </td>
                  {/* Day cols */}
                  {DAY_KEYS.map((day, di) => {
                    const col = di + 1;
                    const isSel = isSelected && col === selCol;
                    const qty = paper ? paper.days[day] : null;
                    const isHol = data.on_holiday && paper;
                    let text = "";
                    let bg = C.cellNormal;
                    let color = C.grey;
                    if (paper) {
                      if (isHol) {
                        text = "H"; bg = C.holidayBg; color = C.holidayText;
                      } else if (isSel) {
                        text = qty > 0 ? `◆${qty}◆` : "◆..◆";
                        bg = C.teal; color = C.white;
                      } else {
                        text = qty > 0 ? String(qty) : "..";
                        bg = C.cellNormal; color = qty > 0 ? C.white : C.grey;
                      }
                    }
                    return (
                      <td key={day}
                        onClick={() => { if (paper) { setSelRow(row); setSelCol(col); } }}
                        style={{ ...td(), background: bg, color, cursor: paper ? "pointer" : "default" }}>
                        {text}
                      </td>
                    );
                  })}
                  {/* Price col */}
                  <td style={{ ...td(), textAlign: "right", paddingRight: 4, color: C.grey }}>
                    {row === numPapers
                      ? data.delivery_charge.toFixed(2)
                      : paper
                        ? (paper.weekly_price > 0 ? paper.weekly_price.toFixed(2) : ".")
                        : "."}
                  </td>
                </tr>
              );
            })}
            {/* Delivery row */}
            {numPapers < 8 && (
              <tr>
                <td style={{ ...td(), textAlign: "left", paddingLeft: 6, color: C.grey }}>
                  {numPapers === 0 ? "" : "Delivery"}
                </td>
                {DAY_KEYS.map((_, i) => <td key={i} style={{ ...td() }} />)}
                <td style={{ ...td(), textAlign: "right", paddingRight: 4, color: C.grey }}>
                  {numPapers > 0 ? data.delivery_charge.toFixed(2) : "."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom info panels */}
      <div style={{ display: "flex", gap: 4, padding: "4px 8px 0", marginTop: 4 }}>
        {/* Left info */}
        <div style={{ flex: 1, border: `1px solid ${C.teal}`, background: C.infoBg,
          padding: "6px 10px", fontFamily: "Courier New" }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 4 }}>
            <span>
              <span style={{ color: C.teal, fontSize: 12 }}>A/c: </span>
              <span style={{ color: C.teal, fontSize: 14, fontWeight: "bold",
                border: `1px solid ${C.teal}`, padding: "1px 8px", borderRadius: 3 }}>
                {cust.ac_number}
              </span>
            </span>
            <span>
              <span style={{ color: C.teal, fontSize: 12 }}> Week end: </span>
              <span style={{ color: C.teal, fontSize: 13,
                border: `1px solid ${C.teal}`, padding: "1px 8px", borderRadius: 3 }}>
                {data.week_end_date}
              </span>
            </span>
          </div>
          <div style={{ color: C.white, fontSize: 12 }}>
            <span style={{ color: C.teal }}>Name: </span>{cust.name}
          </div>
          <div style={{ color: C.white, fontSize: 12 }}>
            <span style={{ color: C.teal }}>Addr: </span>
            {cust.address1}{cust.address2 ? `, ${cust.address2}` : ""}
          </div>
          <div style={{ color: C.white, fontSize: 12 }}>
            <span style={{ color: C.teal }}>Phone: </span>{cust.phone || ""}
          </div>
        </div>

        {/* Right financial */}
        <div style={{ width: 280, border: `1px solid ${C.teal}`, background: C.infoBg,
          padding: "6px 10px", fontFamily: "Courier New" }}>
          {[
            ["Total:", data.total.toFixed(2)],
            ["Received: -", data.received.toFixed(2)],
            ["Refunded: +", data.refunded > 0 ? data.refunded.toFixed(2) : "."],
          ].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between",
              color: C.white, fontSize: 13, marginBottom: 2 }}>
              <span>{label}</span>
              <span style={{ textAlign: "right", minWidth: 60 }}>{val}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${C.teal}`, marginTop: 4, paddingTop: 4,
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: C.white, fontSize: 13 }}>Outstanding: £</span>
            <OutstandingBox value={data.outstanding} />
          </div>
        </div>
      </div>

      {/* Terminal bottom bar */}
      <div style={{ height: 30, background: C.bottomBg, borderTop: `1px solid ${C.teal}`,
        display: "flex", alignItems: "center", padding: "0 8px",
        fontFamily: "Courier New", fontSize: 12, marginTop: 4 }}>
        <button onClick={handleClose} style={{
          background: "none", border: "none", color: C.grey, fontFamily: "Courier New",
          fontSize: 12, cursor: "pointer", padding: 0 }}>close window</button>
        <span style={{ flex: 1, textAlign: "center", color: C.grey }}>
          F1 F2 help &nbsp;|&nbsp; F3 payment &nbsp;|&nbsp; F6 calendar
        </span>
        <button onClick={save} disabled={saving} style={{
          background: "none", border: "none", color: C.teal, fontFamily: "Courier New",
          fontSize: 12, fontWeight: "bold", cursor: "pointer", padding: 0 }}>
          {saving ? "saving…" : "F9 save"}
        </button>
      </div>
    </div>
  );
}
