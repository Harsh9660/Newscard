import React, { useCallback, useEffect, useState, useMemo } from "react";
import { api } from "../api/client";
// Assuming ActionBar is available here for exports/actions
// import ActionBar from "../components/ActionBar"; 

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

function Clock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB", { 
      hour: '2-digit', minute:'2-digit', second:'2-digit' 
    }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-nc-muted text-sm tracking-wider font-semibold">{time}</span>;
}

// Help Modal
const HelpModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[500] animate-fade-in p-4">
    <div className="glass-panel p-8 w-full max-w-lg rounded-3xl border border-nc-border shadow-2xl bg-nc-bg relative animate-slide-up">
      <button onClick={onClose} className="absolute top-4 right-4 text-nc-muted hover:text-white transition-colors">
        ✕
      </button>
      <h2 className="font-display text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span>ℹ️</span> Calendar Help & Shortcuts
      </h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-nc-accent font-semibold mb-3 uppercase tracking-widest text-xs">Keyboard Navigation</h3>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="text-nc-muted">Move cursor</div>
            <div className="text-white font-mono"><kbd className="bg-white/10 px-1.5 py-0.5 rounded">↑</kbd> <kbd className="bg-white/10 px-1.5 py-0.5 rounded">↓</kbd> <kbd className="bg-white/10 px-1.5 py-0.5 rounded">←</kbd> <kbd className="bg-white/10 px-1.5 py-0.5 rounded">→</kbd></div>
            
            <div className="text-nc-muted">Select Range</div>
            <div className="text-white font-mono">Hold <kbd className="bg-white/10 px-1.5 py-0.5 rounded">Shift</kbd> + Arrows</div>
          </div>
        </div>
        
        <div>
          <h3 className="text-nc-accent font-semibold mb-3 uppercase tracking-widest text-xs">Actions</h3>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="text-nc-muted">Show Total / Pay</div>
            <div className="text-white font-mono"><kbd className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">F7</kbd></div>
            
            <div className="text-nc-muted">Confirm Payment</div>
            <div className="text-white font-mono"><kbd className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">F9</kbd></div>
            
            <div className="text-nc-muted">Cancel / Close</div>
            <div className="text-white font-mono"><kbd className="bg-white/10 px-1.5 py-0.5 rounded">Esc</kbd></div>
            
            <div className="text-nc-muted">Process Single Day</div>
            <div className="text-white font-mono"><kbd className="bg-white/10 px-1.5 py-0.5 rounded">Enter</kbd></div>
          </div>
        </div>
        
        <div>
          <h3 className="text-nc-accent font-semibold mb-3 uppercase tracking-widest text-xs">Mouse Interaction</h3>
          <p className="text-sm text-nc-muted leading-relaxed">
            Click and drag across multiple days to select a date range. Releasing the mouse will automatically show the payment summary popup if there are outstanding balances.
          </p>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button onClick={onClose} className="btn-primary from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border border-slate-600">
          Close Help
        </button>
      </div>
    </div>
  </div>
);

// Batch Payment Confirmation Modal (F7 or onSelection) - EXACT CENTER POPUP
const TotalPopup = ({ 
  selectedDates, 
  financials,
  onClose, 
  onConfirm, 
  saving, 
  error 
}: any) => {
  const datesList = Array.from(selectedDates).sort();
  const displayDates = datesList.length > 4 
    ? [...datesList.slice(0, 3), \`... and \${datesList.length - 3} more\`]
    : datesList;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[500] animate-fade-in p-4">
      <div className="glass-panel p-8 sm:p-10 w-full max-w-md rounded-3xl border border-nc-border shadow-[0_0_60px_rgba(245,158,11,0.2)] bg-[#0A0D15] relative animate-slide-up flex flex-col items-center">
        
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.3)] border border-amber-500/30">
          <span className="text-3xl">💰</span>
        </div>
        
        <h2 className="font-display text-3xl font-bold text-white mb-2 text-center">
          Payment Summary
        </h2>
        <div className="text-amber-400/90 text-sm uppercase tracking-widest font-semibold mb-8 text-center bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20 shadow-inner">
          Selected {selectedDates.size} day{selectedDates.size > 1 ? 's' : ''}
        </div>
        
        {/* Financial Breakdown */}
        <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 mb-8 flex flex-col gap-4 shadow-inner">
          <div className="flex justify-between items-center text-lg">
            <span className="text-nc-muted font-medium">Total Due</span>
            <span className="font-bold text-white font-mono">£{financials.totalDue.toFixed(2)}</span>
          </div>
          
          {financials.received > 0 && (
            <div className="flex justify-between items-center text-lg">
              <span className="text-nc-muted font-medium">Amount Received</span>
              <span className="font-bold text-emerald-400 font-mono">- £{financials.received.toFixed(2)}</span>
            </div>
          )}
          
          <div className="h-px w-full bg-white/10 my-1" />
          
          <div className="flex justify-between items-center">
            <span className="text-nc-muted font-bold uppercase tracking-wider text-sm mt-2">Remaining / Outstanding</span>
          </div>
          <div className="font-display text-5xl font-bold text-amber-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.5)] text-right mt-1">
            £{financials.outstanding.toFixed(2)}
          </div>
        </div>
        
        {/* Dates included */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full mb-8 text-sm text-center shadow-inner">
          <div className="text-nc-muted mb-3 font-medium text-xs uppercase tracking-widest">Dates Included</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {displayDates.map((d: any, i) => (
              <span key={i} className="bg-black/30 text-white/90 px-2 py-1 rounded font-mono text-xs border border-white/10 shadow-sm">
                {d}
              </span>
            ))}
          </div>
        </div>
        
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl mb-6 text-sm w-full text-center font-medium">
            {error}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 w-full mt-2">
          <button 
            onClick={onClose} 
            className="flex-1 py-4 rounded-xl border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all font-semibold shadow-sm bg-black/20"
          >
            Cancel (Esc)
          </button>
          <button 
            onClick={onConfirm} 
            disabled={saving || financials.outstanding <= 0}
            className="flex-1 btn-primary from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)] py-4 text-lg font-bold border border-emerald-400/30"
          >
            {saving ? "Processing..." : "Confirm (F9)"}
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default function PaymentCalendar({ customerId, onClose, onOpenWeekly }: any) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [data, setData] = useState<any>(null);
  
  // Selection state
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  
  // Modals & UI state
  const [showTotalPopup, setShowTotalPopup] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toastMsg, setToastMsg] = useState('');
  
  const [keyboardCursor, setKeyboardCursor] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { 
      const res = await api.calendar.get(customerId, year);
      setData(res); 
    } catch { 
      setData(null); 
    }
  }, [customerId, year]);

  useEffect(() => { load(); }, [load]);

  const weekMap = useMemo(() => {
    const map: any = {};
    if (data && data.months) {
      Object.values(data.months).flat().forEach((w: any) => {
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
    
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      const dateStr = \`\${y}-\${String(m).padStart(2, '0')}-\${String(d).padStart(2, '0')}\`;
      days.push({ day: d, dateStr, isCurrentMonth: false });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = \`\${year}-\${String(month + 1).padStart(2, '0')}-\${String(i).padStart(2, '0')}\`;
      days.push({ day: i, dateStr, isCurrentMonth: true });
    }
    
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const m = month === 11 ? 1 : month + 2;
      const y = month === 11 ? year + 1 : year;
      const dateStr = \`\${y}-\${String(m).padStart(2, '0')}-\${String(i).padStart(2, '0')}\`;
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
    setShowTotalPopup(false);
  };

  const computeRange = (start: string, end: string) => {
    if (!start || !end) return new Set<string>();
    const startIdx = daysGrid.findIndex(d => d.dateStr === start);
    const endIdx = daysGrid.findIndex(d => d.dateStr === end);
    if (startIdx === -1 || endIdx === -1) return new Set<string>();
    
    const min = Math.min(startIdx, endIdx);
    const max = Math.max(startIdx, endIdx);
    
    const range = new Set<string>();
    for (let i = min; i <= max; i++) {
      if (daysGrid[i].isCurrentMonth) {
        range.add(daysGrid[i].dateStr);
      }
    }
    return range;
  };

  const onMouseDown = (dateStr: string) => {
    if (showTotalPopup) return;
    setIsDragging(true);
    setSelectionStart(dateStr);
    setSelectionEnd(dateStr);
    setSelectedDates(new Set([dateStr]));
    setKeyboardCursor(dateStr);
  };

  const onMouseEnter = (dateStr: string) => {
    if (isDragging && selectionStart) {
      setSelectionEnd(dateStr);
      setSelectedDates(computeRange(selectionStart, dateStr));
      setKeyboardCursor(dateStr);
    }
  };

  const selectedFinancials = useMemo(() => {
    let totalDue = 0;
    let received = 0;
    
    selectedDates.forEach(dateStr => {
      const w = weekMap[dateStr];
      if (w && !w.paid && !w.is_holiday) {
        const dueForWeek = w.total || w.amount || 0;
        const receivedForWeek = w.received || 0;
        totalDue += dueForWeek;
        received += receivedForWeek;
      }
    });
    
    const outstanding = Math.max(0, totalDue - received);
    return { totalDue, received, outstanding };
  }, [selectedDates, weekMap]);

  const onMouseUp = () => { 
    if (isDragging) {
      setIsDragging(false); 
      if (selectedDates.size > 0 && selectedFinancials.outstanding > 0) {
        setShowTotalPopup(true);
      } else if (selectedDates.size > 0) {
        setToastMsg("Selected dates have no outstanding balance to pay.");
        setTimeout(() => setToastMsg(''), 2000);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, [isDragging, selectedDates, selectedFinancials]);

  // Keyboard 'keyup' listener specifically for releasing the Shift key after range selection
  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        if (!showTotalPopup && selectedDates.size > 0 && selectedFinancials.outstanding > 0) {
          setShowTotalPopup(true);
        }
      }
    };
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [showTotalPopup, selectedDates, selectedFinancials]);

  const handleEsc = useCallback(() => {
    if (showHelp) { setShowHelp(false); return; }
    if (showTotalPopup) { setShowTotalPopup(false); return; }
    if (selectedDates.size > 0) { resetSelection(); return; }
    onClose && onClose();
  }, [showHelp, showTotalPopup, selectedDates, onClose]);

  const handleF7 = useCallback(() => {
    if (selectedDates.size > 0 && selectedFinancials.outstanding > 0) {
      setShowTotalPopup(true);
    } else if (selectedDates.size > 0) {
      setToastMsg("Selected dates have no outstanding balance to pay.");
      setTimeout(() => setToastMsg(''), 3000);
    }
  }, [selectedDates, selectedFinancials]);

  const handleF9 = useCallback(async () => {
    if (!showTotalPopup || selectedDates.size === 0) return;
    
    setSaving(true);
    setError("");
    
    const datesToPay = Array.from(selectedDates).filter(ds => {
      const w = weekMap[ds];
      return w && !w.paid && !w.is_holiday;
    });
    
    if (datesToPay.length === 0) {
      setError("No valid unpaid bills to process.");
      setSaving(false);
      return;
    }
    
    let successCount = 0;
    for (const ds of datesToPay) {
      const w = weekMap[ds];
      const dueForWeek = w.total || w.amount || 0;
      const receivedForWeek = w.received || 0;
      const outstandingForWeek = Math.max(0, dueForWeek - receivedForWeek);
      
      if (outstandingForWeek > 0) {
        try {
          await api.markPaid({
            customer_id: customerId,
            week_end_date: w.date_iso,
            paid_amount: outstandingForWeek,
            method: "cash",
            notes: "Batch payment via Calendar"
          });
          successCount++;
        } catch (e) {
          console.error("Failed to pay", ds, e);
        }
      }
    }
    
    setSaving(false);
    setShowTotalPopup(false);
    
    setToastMsg(\`✅ Processed \${successCount} payments successfully. (£\${selectedFinancials.outstanding.toFixed(2)})\`);
    setTimeout(() => setToastMsg(''), 4000);
    
    await load();
    resetSelection();
  }, [showTotalPopup, selectedDates, weekMap, customerId, load, selectedFinancials]);

  const handleEnter = useCallback(() => {
    if (selectedDates.size > 0 && selectedFinancials.outstanding > 0) {
      setShowTotalPopup(true);
    }
  }, [selectedDates, selectedFinancials]);

  const handleKeyboardNav = useCallback((key: string, shiftKey: boolean) => {
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
        if (!shiftKey) {
           setSelectedDates(new Set([target.dateStr]));
           setSelectionStart(target.dateStr);
        } else {
           setSelectionEnd(target.dateStr);
           setSelectedDates(computeRange(selectionStart || keyboardCursor, target.dateStr));
        }
      } else {
        if (key === 'ArrowLeft' || key === 'ArrowUp') handlePrevMonth();
        else handleNextMonth();
      }
    }
  }, [keyboardCursor, daysGrid, selectionStart, handlePrevMonth, handleNextMonth]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); setShowHelp(true); return; }
      if (showHelp) { if (e.key === 'Escape') setShowHelp(false); return; }
      if (saving) return;
      
      if (e.key === 'Escape') { e.preventDefault(); handleEsc(); }
      else if (e.key === 'F7') { e.preventDefault(); handleF7(); }
      else if (e.key === 'F9') { e.preventDefault(); handleF9(); }
      else if (e.key === 'Enter') { e.preventDefault(); handleEnter(); }
      else if (e.key.startsWith('Arrow')) { e.preventDefault(); handleKeyboardNav(e.key, e.shiftKey); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEsc, handleF7, handleF9, handleEnter, handleKeyboardNav, showHelp, saving]);

  // Export handlers
  const handleExportPDF = () => {
    setToastMsg("Exporting to PDF...");
    setTimeout(() => setToastMsg(''), 2000);
    // api.exportCalendar(customerId, year, month, 'pdf');
  };
  const handleExportCSV = () => {
    setToastMsg("Exporting to CSV...");
    setTimeout(() => setToastMsg(''), 2000);
  };
  const handleExportExcel = () => {
    setToastMsg("Exporting to Excel...");
    setTimeout(() => setToastMsg(''), 2000);
  };

  const cust = data?.customer || {};
  const totalDue = data?.total_due || 0;

  return (
    <div 
      className="flex flex-col h-full w-full bg-nc-bg outline-none select-none overflow-hidden relative animate-fade-in"
      tabIndex={0}
      onFocus={() => {
        if (!keyboardCursor) {
          const first = daysGrid.find(d => d.isCurrentMonth);
          if (first) setKeyboardCursor(first.dateStr);
        }
      }}
    >
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      
      {showTotalPopup && (
        <TotalPopup 
          selectedDates={selectedDates}
          financials={selectedFinancials}
          onClose={() => setShowTotalPopup(false)}
          onConfirm={handleF9}
          saving={saving}
          error={error}
        />
      )}

      {/* Header Area with Export Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-nc-border px-6 py-5 gap-4 bg-nc-panel/70 backdrop-blur-md z-10 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/5 mr-2">
              ← Back
            </button>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <span className="bg-white/10 px-2 py-1 rounded-md text-sm border border-white/5 shadow-sm">#{cust.ac_number || "..."}</span>
              {cust.name || "Loading..."}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={handleExportPDF} className="px-3 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-white transition-colors">PDF</button>
            <button onClick={handleExportCSV} className="px-3 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-white transition-colors">CSV</button>
            <button onClick={handleExportExcel} className="px-3 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-white transition-colors">Excel</button>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 shadow-inner">
            <span className="text-nc-muted text-sm font-medium uppercase tracking-wider">Total Outstanding</span>
            <span className="text-amber-400 font-display font-bold text-xl drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">£{totalDue.toFixed(2)}</span>
          </div>
          <div className="hidden lg:block">
            <Clock />
          </div>
        </div>
      </div>

      {/* Main Calendar View */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 flex justify-center overflow-auto custom-scrollbar mb-4">
        <div className="w-full max-w-5xl flex flex-col h-full min-h-[600px]">
          
          <div className="glass-card flex-1 flex flex-col overflow-hidden border border-nc-border shadow-2xl rounded-2xl">
            
            {/* Calendar Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-nc-border/50 bg-black/20">
              <div className="flex items-center gap-4">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/10">
                  <span className="sr-only">Previous Month</span>
                  ←
                </button>
                <h2 className="font-display text-2xl font-bold w-48 text-center tracking-wide">
                  {MONTHS[month]} <span className="text-emerald-400 opacity-90">{year}</span>
                </h2>
                <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/10">
                  <span className="sr-only">Next Month</span>
                  →
                </button>
              </div>
              
              <div className="hidden sm:flex items-center gap-6 text-sm font-medium uppercase tracking-widest text-xs">
                <div className="flex items-center gap-2 text-nc-muted">
                  <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" /> Unpaid
                </div>
                <div className="flex items-center gap-2 text-nc-muted">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> Paid
                </div>
                <div className="flex items-center gap-2 text-nc-muted">
                  <div className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50" /> Selected
                </div>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-nc-border/50 bg-black/40">
              {WEEKDAYS.map(d => (
                <div key={d} className="py-3 text-center text-xs font-semibold tracking-widest text-nc-muted uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid Body */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-black/20" onMouseLeave={onMouseUp}>
              {daysGrid.map((dayObj, i) => {
                const isSelected = selectedDates.has(dayObj.dateStr);
                const isCursor = keyboardCursor === dayObj.dateStr;
                const w = weekMap[dayObj.dateStr];
                
                let cellClasses = "relative flex flex-col justify-between p-2 sm:p-3 border-r border-b border-nc-border/30 transition-all duration-200 ";
                let amtColor = "text-nc-muted";
                let displayAmt = "";

                if (!dayObj.isCurrentMonth) {
                  cellClasses += "opacity-40 bg-black/30 cursor-not-allowed";
                } else {
                  cellClasses += "cursor-pointer hover:bg-white/5 ";
                  
                  if (isSelected) {
                    cellClasses += "bg-amber-500/10 border-amber-500/30 ";
                    amtColor = "text-amber-400";
                  } else if (w) {
                    if (w.is_holiday) {
                      cellClasses += "opacity-60 bg-white/5 ";
                      displayAmt = "HOLD";
                    } else if (w.paid) {
                      cellClasses += "bg-emerald-500/10 ";
                      amtColor = "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]";
                    } else if (w.status === "overdue" || w.amount > 0) {
                      amtColor = "text-amber-400 font-bold drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]";
                    } else if (w.is_current_week) {
                      cellClasses += "bg-nc-accent/10 ";
                      amtColor = "text-nc-accent";
                    }
                  }
                }

                if (w && !displayAmt) {
                  const outAmt = Math.max(0, (w.total || w.amount || 0) - (w.received || 0));
                  if (outAmt > 0) displayAmt = \`£\${outAmt.toFixed(2)}\`;
                  else if (w.amount > 0) displayAmt = \`£\${w.amount.toFixed(2)}\`;
                }
                
                if (isCursor && dayObj.isCurrentMonth) {
                  cellClasses += "ring-2 ring-inset ring-amber-400 z-10 bg-white/10 shadow-lg scale-[1.02] rounded-md border-transparent ";
                }

                return (
                  <div 
                    key={i} 
                    className={cellClasses}
                    onMouseDown={() => dayObj.isCurrentMonth && onMouseDown(dayObj.dateStr)}
                    onMouseEnter={() => dayObj.isCurrentMonth && onMouseEnter(dayObj.dateStr)}
                  >
                    <div className={\`font-display text-lg sm:text-xl font-semibold \${dayObj.isCurrentMonth ? (isSelected ? 'text-amber-400' : 'text-white') : 'text-nc-muted'}\`}>
                      {dayObj.day}
                    </div>
                    
                    <div className={\`font-mono text-xs sm:text-sm text-right mt-auto \${amtColor} \${w?.paid ? 'font-bold tracking-wide' : 'font-medium'}\`}>
                      {displayAmt}
                    </div>
                    
                    {/* Selected Highlight Overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 border-2 border-amber-500/50 rounded pointer-events-none shadow-[inset_0_0_15px_rgba(245,158,11,0.15)] z-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      <div className={\`fixed top-6 right-6 bg-emerald-500/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl font-semibold shadow-[0_10px_30px_rgba(16,185,129,0.3)] z-[1000] transition-all duration-300 transform border border-emerald-400/50 \${toastMsg ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}\`}>
        {toastMsg}
      </div>

    </div>
  );
}
