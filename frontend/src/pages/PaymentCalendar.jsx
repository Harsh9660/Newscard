import React, { useCallback, useEffect, useState, useMemo } from "react";
import { api } from "../api/client";

const C = {
  bg: "#0B0F1A", teal: "#20b2aa", white: "#ffffff",
  grey: "#888888", headerBg: "#0B0F1A", bottomBg: "#0B0F1A",
  amtPaid: "#047857", amtUnpaid: "#D97706",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function Clock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("en-GB"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={{ color: "#E5E7EB", fontFamily: "ui-monospace, monospace", fontSize: 14 }}>{t}</span>;
}

function QuickPayDialog({ customerId, week, onClose, onSaved }) {
  const [amount, setAmount] = useState((week.amount || 0).toFixed(2));
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
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
        period_from: fromDate,
        period_to: toDate,
        method,
        notes,
      });
      onSaved();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const inp = {
    background: "#1F2937", color: "#F3F4F6", border: `1px solid #374151`,
    padding: "6px 10px", fontFamily: "ui-monospace, monospace", fontSize: 13,
    borderRadius: 4, width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
      <div style={{ background: "#0D1117", border: `1px solid #1F2937`, borderRadius: 8,
        padding: 24, width: 360, fontFamily: "system-ui, sans-serif", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.8)" }}>
        <div style={{ color: "#E5E7EB", fontSize: 18, fontWeight: "600", textAlign: "center",
          borderBottom: `1px solid #1F2937`, paddingBottom: 12, marginBottom: 16 }}>
          {week.paid ? "Payment Details" : "Confirm Single Payment"}
        </div>
        <div style={{ color: "#9CA3AF", fontSize: 12, marginBottom: 16, fontFamily: "ui-monospace, monospace" }}>
          Date: {week.date_iso}
        </div>
        {err && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ color: "#9CA3AF", fontSize: 12 }}>£ Amount
            <input type="number" step="0.01" value={amount}
              onChange={e => setAmount(e.target.value)} style={{ ...inp, marginTop: 4, fontSize: 18, color: "#D97706", fontWeight: "bold" }} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ color: "#9CA3AF", fontSize: 12 }}>From Date
              <input type="date" value={fromDate}
                onChange={e => setFromDate(e.target.value)} style={{ ...inp, marginTop: 4 }} />
            </label>
            <label style={{ color: "#9CA3AF", fontSize: 12 }}>To Date
              <input type="date" value={toDate}
                onChange={e => setToDate(e.target.value)} style={{ ...inp, marginTop: 4 }} />
            </label>
          </div>
          <label style={{ color: "#9CA3AF", fontSize: 12 }}>Method
            <select value={method} onChange={e => setMethod(e.target.value)}
              style={{ ...inp, marginTop: 4 }}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank transfer">Bank Transfer</option>
              <option value="direct debit">Direct Debit</option>
            </select>
          </label>
          <label style={{ color: "#9CA3AF", fontSize: 12 }}>Notes (optional)
            <input value={notes} onChange={e => setNotes(e.target.value)}
              style={{ ...inp, marginTop: 4 }} />
          </label>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12,
          borderTop: `1px solid #1F2937`, marginTop: 20, paddingTop: 16 }}>
          <button onClick={onClose} style={{
            background: "#1F2937", border: "none", color: "#E5E7EB", borderRadius: 4,
            padding: "8px 16px", fontSize: 14, fontWeight: "600", cursor: "pointer" }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{
            background: "#047857", border: "none", color: "#FFF", borderRadius: 4,
            padding: "8px 16px", fontSize: 14, fontWeight: "600", cursor: "pointer" }}>
            {saving ? "Saving…" : "Mark as Paid"}</button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCalendar({ customerId, onClose, onOpenWeekly }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [data, setData] = useState(null);

  // Selection state
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [stage, setStage] = useState('idle'); // idle | tray_open | saving
  const [toastMsg, setToastMsg] = useState('');
  
  const [payWeek, setPayWeek] = useState(null);
  const [keyboardCursor, setKeyboardCursor] = useState(null); 

  const load = useCallback(async () => {
    try { setData(await api.calendar.get(customerId, year)); }
    catch { setData(null); }
  }, [customerId, year]);

  useEffect(() => { load(); }, [load]);

  const weekMap = useMemo(() => {
    const map = {};
    if (data && data.months) {
      Object.values(data.months).flat().forEach(w => {
        map[w.date_iso] = w;
      });
    }
    return map;
  }, [data]);

  const daysGrid = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Prev month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, dateStr, isCurrentMonth: true });
    }
    
    // Next month days
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const m = month === 11 ? 1 : month + 2;
      const y = month === 11 ? year + 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, dateStr, isCurrentMonth: false });
    }
    
    return days;
  }, [year, month]);

  const handlePrevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else { setMonth(m => m - 1); }
    resetSelection();
  }, [month]);
  
  const handleNextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else { setMonth(m => m + 1); }
    resetSelection();
  }, [month]);

  const resetSelection = () => {
    setSelectedDates(new Set());
    setSelectionStart(null);
    setSelectionEnd(null);
    setStage('idle');
  };

  const computeRange = (start, end) => {
    if (!start || !end) return new Set();
    const startIdx = daysGrid.findIndex(d => d.dateStr === start);
    const endIdx = daysGrid.findIndex(d => d.dateStr === end);
    if (startIdx === -1 || endIdx === -1) return new Set();
    
    const min = Math.min(startIdx, endIdx);
    const max = Math.max(startIdx, endIdx);
    
    const range = new Set();
    for (let i = min; i <= max; i++) {
      if (daysGrid[i].isCurrentMonth) {
        range.add(daysGrid[i].dateStr);
      }
    }
    return range;
  };

  const onMouseDown = (dateStr) => {
    if (stage === 'saving') return;
    setIsDragging(true);
    setSelectionStart(dateStr);
    setSelectionEnd(dateStr);
    setSelectedDates(new Set([dateStr]));
    setKeyboardCursor(dateStr);
    setStage('idle');
  };

  const onMouseEnter = (dateStr) => {
    if (isDragging) {
      setSelectionEnd(dateStr);
      setSelectedDates(computeRange(selectionStart, dateStr));
      setKeyboardCursor(dateStr);
    }
  };

  const onMouseUp = () => { setIsDragging(false); };

  useEffect(() => {
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, []);

  const totalSelectedAmount = useMemo(() => {
    let total = 0;
    selectedDates.forEach(dateStr => {
      const w = weekMap[dateStr];
      if (w && !w.paid && !w.is_holiday) total += w.amount;
    });
    return total;
  }, [selectedDates, weekMap]);

  const handleEsc = useCallback(() => {
    if (payWeek) { setPayWeek(null); return; }
    if (stage === 'tray_open') { setStage('idle'); return; }
    if (selectedDates.size > 0) { resetSelection(); return; }
    onClose();
  }, [payWeek, stage, selectedDates, onClose]);

  const handleF7 = useCallback(() => {
    if (selectedDates.size > 0) {
      setStage('tray_open');
    }
  }, [selectedDates]);

  const handleF9 = useCallback(async () => {
    if (stage === 'tray_open' && selectedDates.size > 0) {
      setStage('saving');
      
      const datesToPay = Array.from(selectedDates).filter(ds => {
        const w = weekMap[ds];
        return w && !w.paid && !w.is_holiday && w.amount > 0;
      });
      
      if (datesToPay.length === 0) {
        setToastMsg("No unpaid bills selected.");
        setTimeout(() => setToastMsg(''), 3000);
        setStage('idle');
        return;
      }
      
      let successCount = 0;
      for (const ds of datesToPay) {
        const w = weekMap[ds];
        try {
          await api.markPaid({
            customer_id: customerId,
            week_end_date: w.date_iso,
            paid_amount: w.amount,
            method: "cash",
            notes: "Batch payment"
          });
          successCount++;
        } catch (e) {
          console.error("Failed to pay", ds, e);
        }
      }
      
      setToastMsg(`Recorded ${successCount} payments. (£${totalSelectedAmount.toFixed(2)})`);
      setTimeout(() => setToastMsg(''), 3000);
      
      await load();
      resetSelection();
    }
  }, [stage, selectedDates, weekMap, customerId, load, totalSelectedAmount]);

  const handleEnter = useCallback(() => {
    if (selectedDates.size === 1) {
      const dateStr = Array.from(selectedDates)[0];
      const w = weekMap[dateStr];
      if (w && !w.paid && !w.is_holiday && w.amount > 0) {
        setPayWeek(w);
      } else {
        setToastMsg("No unpaid billing record for this date");
        setTimeout(() => setToastMsg(''), 2000);
      }
    } else if (keyboardCursor && selectedDates.size === 0) {
      const w = weekMap[keyboardCursor];
      if (w && !w.paid && !w.is_holiday && w.amount > 0) setPayWeek(w);
    }
  }, [selectedDates, keyboardCursor, weekMap]);

  const handleKeyboardNav = useCallback((key) => {
    if (!keyboardCursor) {
      const first = daysGrid.find(d => d.isCurrentMonth);
      if (first) {
        setKeyboardCursor(first.dateStr);
        setSelectedDates(new Set([first.dateStr]));
        setSelectionStart(first.dateStr);
      }
      return;
    }
    
    const idx = daysGrid.findIndex(d => d.dateStr === keyboardCursor);
    let newIdx = idx;
    if (key === 'ArrowRight') newIdx = idx + 1;
    if (key === 'ArrowLeft') newIdx = idx - 1;
    if (key === 'ArrowDown') newIdx = idx + 7;
    if (key === 'ArrowUp') newIdx = idx - 7;
    
    if (newIdx >= 0 && newIdx < daysGrid.length) {
      const target = daysGrid[newIdx];
      if (target.isCurrentMonth) {
        setKeyboardCursor(target.dateStr);
        if (!isDragging && !(window.event && window.event.shiftKey)) {
           setSelectedDates(new Set([target.dateStr]));
           setSelectionStart(target.dateStr);
        } else {
           setSelectionEnd(target.dateStr);
           setSelectedDates(computeRange(selectionStart || keyboardCursor, target.dateStr));
        }
      } else {
        if (key === 'ArrowLeft' || key === 'ArrowUp') {
           handlePrevMonth();
        } else {
           handleNextMonth();
        }
      }
    }
  }, [keyboardCursor, daysGrid, isDragging, selectionStart, handlePrevMonth, handleNextMonth]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (payWeek) return; 
      if (e.key === 'Escape') { e.preventDefault(); handleEsc(); }
      else if (e.key === 'F7') { e.preventDefault(); handleF7(); }
      else if (e.key === 'F9') { e.preventDefault(); handleF9(); }
      else if (e.key === 'Enter') { e.preventDefault(); handleEnter(); }
      else if (e.key.startsWith('Arrow')) { e.preventDefault(); handleKeyboardNav(e.key); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEsc, handleF7, handleF9, handleEnter, handleKeyboardNav, payWeek]);

  const cust = data?.customer || {};
  const totalDue = data?.total_due || 0;

  return (
    <div style={{ background: C.bg, display: "flex", flexDirection: "column", height: "100vh", userSelect: "none" }} tabIndex={0} onFocus={(e) => {
        if (!keyboardCursor) {
          const first = daysGrid.find(d => d.isCurrentMonth);
          if (first) setKeyboardCursor(first.dateStr);
        }
      }}>
      
      {payWeek && (
        <QuickPayDialog
          customerId={customerId}
          week={payWeek}
          onClose={() => setPayWeek(null)}
          onSaved={() => { setPayWeek(null); load(); }}
        />
      )}

      {/* Top Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #1F2937" }}>
        <div style={{ color: "#E5E7EB", fontSize: "1.25rem", fontWeight: "700", flex: 1, letterSpacing: "-0.025em" }}>
          A/c No: {cust.ac_number || "1"} — {cust.name || "Loading..."}
        </div>
        <div style={{ color: "#E5E7EB", fontSize: "1.25rem", fontWeight: "700", marginRight: 20 }}>
          Total Due: <span style={{ color: C.amtUnpaid }}>£{totalDue.toFixed(2)}</span>
        </div>
        <Clock />
      </div>

      {/* Main Calendar View */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "stretch", padding: "20px", height: "100%" }}>
        <div style={{
          width: "100%", height: "100%",
          background: "#0D1117", borderRadius: "12px",
          border: "1px solid #1F2937", overflow: "hidden",
          display: "flex", flexDirection: "column",
          fontFamily: "system-ui, -apple-system, sans-serif",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)"
        }}>
          
          {/* Calendar Header */}
          <div style={{ background: "#0B0F1A", color: "#F3F4F6", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1F2937" }}>
            <div style={{ fontSize: "1.35rem", fontWeight: "700", letterSpacing: "-0.025em" }}>{MONTHS[month]} {year}</div>
            <div style={{ display: "flex", gap: "20px", fontSize: "0.875rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#D97706" }} /> Selected range
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#047857" }} /> Payment accepted
              </div>
            </div>
            <div>
              <button onClick={handlePrevMonth} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", borderRadius: 6, padding: "6px 14px", cursor: "pointer", marginRight: 8, fontSize: "0.9rem" }}>&larr;</button>
              <button onClick={handleNextMonth} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: "0.9rem" }}>&rarr;</button>
            </div>
          </div>

          {/* Hints */}
          <div style={{ background: "#0D1117", padding: "10px 20px", fontSize: "0.8rem", color: "#9CA3AF", borderBottom: "1px solid #1F2937", display: "flex", gap: "20px" }}>
            <div><strong style={{color:"#E5E7EB"}}>Drag/Arrows</strong> = select dates</div>
            <div><strong style={{color:"#E5E7EB"}}>F7</strong> = show total</div>
            <div><strong style={{color:"#E5E7EB"}}>F9</strong> = batch accept</div>
            <div><strong style={{color:"#E5E7EB"}}>Enter</strong> = single detail payment</div>
            <div><strong style={{color:"#E5E7EB"}}>Esc</strong> = cancel</div>
          </div>

          {/* Grid Header */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #1F2937", background: "#0B0F1A" }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{ padding: "14px 8px", textAlign: "center", fontSize: "0.8rem", fontWeight: 600, color: "#9CA3AF", borderRight: "1px solid #1F2937" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridTemplateRows: "repeat(6, 1fr)" }} onMouseLeave={onMouseUp}>
            {daysGrid.map((dayObj, i) => {
              const isSelected = selectedDates.has(dayObj.dateStr);
              const isCursor = keyboardCursor === dayObj.dateStr;
              const w = weekMap[dayObj.dateStr];
              
              let bg = "#0D1117";
              let color = "#F3F4F6";
              let amtColor = "#4b5563";
              let displayAmt = "";

              if (!dayObj.isCurrentMonth) {
                bg = "#0B0F1A";
                color = "#374151";
              } else if (isSelected) {
                bg = "#D97706";
                color = "#ffffff";
                amtColor = "#ffffff";
              } else if (w) {
                if (w.is_holiday) {
                  bg = "#0B0F1A";
                  color = "#374151";
                  displayAmt = "HOLD";
                } else if (w.paid) {
                  bg = "#047857";
                  color = "#ffffff";
                  amtColor = "#ffffff";
                } else if (w.status === "overdue") {
                  color = "#E5E7EB";
                  amtColor = "#D97706";
                } else if (w.is_current_week) {
                  bg = "rgba(37, 99, 235, 0.1)"; 
                  color = "#60A5FA";
                  amtColor = "#60A5FA";
                }
              }

              if (w && !displayAmt && w.amount > 0) {
                displayAmt = `£${w.amount.toFixed(2)}`;
              }
              if (!w && dayObj.isCurrentMonth) {
                // Keep numbers clearly legible even if no amount
                color = "#E5E7EB";
              }

              return (
                <div 
                  key={i} 
                  onMouseDown={() => dayObj.isCurrentMonth && onMouseDown(dayObj.dateStr)}
                  onMouseEnter={() => dayObj.isCurrentMonth && onMouseEnter(dayObj.dateStr)}
                  style={{
                    borderRight: "1px solid #1F2937", borderBottom: "1px solid #1F2937",
                    padding: "10px 8px", display: "flex", flexDirection: "column", justifyContent: "space-between",
                    background: bg, color: color, cursor: dayObj.isCurrentMonth ? "pointer" : "default",
                    outline: isCursor ? "2px solid #FCD34D" : "none",
                    outlineOffset: -2,
                    position: "relative", zIndex: isCursor ? 10 : 1
                  }}
                >
                  <div style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, fontSize: "1.1rem" }}>
                    {dayObj.day}
                  </div>
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.875rem", textAlign: "right", color: amtColor, fontWeight: w && w.paid ? "bold" : "500", marginTop: "auto" }}>
                    {displayAmt}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Tray (F7) */}
          <div style={{
            background: "#0B0F1A", color: "#F3F4F6", overflow: "hidden",
            maxHeight: stage === 'tray_open' || stage === 'saving' ? "140px" : "0",
            transition: "max-height 0.4s", display: "flex", justifyContent: "space-between",
            alignItems: "center", padding: stage === 'tray_open' || stage === 'saving' ? "24px 20px" : "0 20px",
            borderTop: stage === 'tray_open' || stage === 'saving' ? "1px solid #1F2937" : "none"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: "0.875rem", color: "#9CA3AF" }}>
                Total Selected ({selectedDates.size} day{selectedDates.size !== 1 ? 's' : ''})
              </div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.04em" }}>
                £{totalSelectedAmount.toFixed(2)}
              </div>
            </div>
            
            {totalSelectedAmount > 0 && (
              <div onClick={handleF9} style={{
                padding: "10px 20px", borderRadius: 9999, fontSize: "0.9rem", fontWeight: 600,
                background: "rgba(217, 119, 6, 0.2)", color: "#FCD34D", border: "1px solid #D97706",
                cursor: "pointer", whiteSpace: "nowrap"
              }}>
                {stage === 'saving' ? 'Recording...' : 'F9 to Accept Payment'}
              </div>
            )}
          </div>
          
        </div>
      </div>
      
      {/* Toast Notification */}
      <div style={{
        position: "fixed", bottom: 160, left: "50%", transform: `translateX(-50%) translateY(${toastMsg ? '-8px' : '0'})`,
        background: "#047857", color: "#fff", padding: "14px 28px", borderRadius: 10,
        fontWeight: 600, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)", zIndex: 1000,
        opacity: toastMsg ? 1 : 0, transition: "all 0.3s ease", pointerEvents: "none"
      }}>
        {toastMsg}
      </div>

      {/* Terminal Bottom Bar */}
      <div style={{ height: 32, background: C.bottomBg, borderTop: `1px solid #1F2937`,
        display: "flex", alignItems: "center", padding: "0 16px",
        fontFamily: "ui-monospace, monospace", fontSize: 12, marginTop: "auto" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontWeight: "600" }}>Esc cancel/close</button>
      </div>

    </div>
  );
}
