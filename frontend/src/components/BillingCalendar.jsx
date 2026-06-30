import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

const styles = `
  .bc-container {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    width: 100%;
    height: 100%;
    margin: 0 auto;
    border: 1px solid #1F2937;
    border-radius: 12px;
    overflow: hidden;
    background: #0B0F1A;
    color: #F3F4F6;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.5);
    position: relative;
  }

  .bc-header {
    background: #0B0F1A;
    color: #F3F4F6;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #1F2937;
    flex-wrap: wrap;
    gap: 12px;
  }

  .bc-header-title {
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: -0.025em;
  }

  .bc-nav-btn {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.25);
    color: #fff;
    border-radius: 6px;
    padding: 6px 14px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .bc-nav-btn:hover {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.4);
  }
  .bc-nav-btn:focus-visible {
    outline: 2px solid #D97706;
    outline-offset: 2px;
  }

  .bc-legend {
    display: flex;
    gap: 20px;
    font-size: 0.875rem;
  }

  .bc-legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .bc-dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
  }

  .bc-dot.amber { background: #D97706; }
  .bc-dot.jade { background: #047857; }

  .bc-hints {
    background: #0D1117;
    padding: 10px 20px;
    font-size: 0.8rem;
    color: #9CA3AF;
    border-bottom: 1px solid #1F2937;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }

  .bc-hints span {
    font-weight: 600;
    color: #E5E7EB;
  }

  .bc-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }

  .bc-day-header {
    padding: 14px 8px;
    text-align: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: #9CA3AF;
    background: #0B0F1A;
    border-bottom: 1px solid #1F2937;
  }

  .bc-cell {
    border-right: 1px solid #1F2937;
    border-bottom: 1px solid #1F2937;
    background: #0D1117;
    padding: 10px 8px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 92px;
    cursor: pointer;
    user-select: none;
    transition: background 0.1s ease, transform 0.1s ease;
    position: relative;
  }

  .bc-cell:nth-child(7n) { border-right: none; }
  .bc-cell:hover { background: #1F2937; }
  
  .bc-cell.cursor-active {
    outline: 2px solid #FCD34D;
    outline-offset: -2px;
    z-index: 10;
  }

  .bc-cell.greyed {
    background: #0B0F1A;
    color: #374151;
    cursor: default;
  }

  .bc-cell.selected {
    background: #D97706;
    color: white;
  }
  .bc-cell.selected:hover {
    background: #B45309;
  }

  .bc-cell.accepted {
    background: #047857;
    color: white;
  }
  .bc-cell.accepted:hover {
    background: #065F46;
  }

  .bc-date-num {
    font-family: ui-monospace, 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
    font-weight: 700;
    font-size: 1.1rem;
  }

  .bc-amount {
    font-family: ui-monospace, 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
    font-size: 0.875rem;
    text-align: right;
    font-weight: 500;
    margin-top: auto;
  }

  .bc-cell.greyed .bc-amount {
    color: #374151;
  }

  /* Modal System */
  .bc-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(11, 15, 26, 0.85); /* Dark theme matching #0B0F1A */
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    animation: fadeIn 200ms ease-out forwards;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .bc-modal {
    background: #111827;
    border: 1px solid #1F2937;
    border-radius: 16px;
    padding: 32px;
    width: 520px;
    max-width: 95%;
    max-height: 90vh;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    animation: scaleUp 200ms ease-out forwards;
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 768px) {
    .bc-modal { width: 90%; padding: 24px; }
  }

  @media (max-width: 480px) {
    .bc-modal { width: 95%; padding: 20px; }
  }
  
  @keyframes scaleUp {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .bc-modal-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 24px;
    color: #F3F4F6;
    text-align: center;
    border-bottom: 1px solid #1F2937;
    padding-bottom: 16px;
  }

  .bc-summary-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    font-size: 1rem;
    color: #9CA3AF;
  }

  .bc-summary-row .val {
    color: #F3F4F6;
    font-weight: 600;
  }

  .bc-summary-divider {
    height: 1px;
    background: #1F2937;
    margin: 16px 0;
  }

  .bc-summary-total {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 16px 0 24px 0;
  }

  .bc-summary-total .lbl {
    font-size: 0.9rem;
    font-weight: 700;
    color: #9CA3AF;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }

  .bc-summary-total .val {
    font-family: ui-monospace, 'JetBrains Mono', monospace;
    font-size: 3.5rem;
    font-weight: 800;
    color: #D97706;
    line-height: 1;
    text-shadow: 0 4px 20px rgba(217, 119, 6, 0.4);
  }

  .bc-dates-list {
    background: #0B0F1A;
    border: 1px solid #1F2937;
    border-radius: 8px;
    padding: 12px;
    max-height: 160px;
    overflow-y: auto;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .bc-dates-list::-webkit-scrollbar { width: 6px; }
  .bc-dates-list::-webkit-scrollbar-track { background: #0B0F1A; }
  .bc-dates-list::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }

  .bc-date-item {
    font-family: ui-monospace, 'JetBrains Mono', monospace;
    font-size: 0.95rem;
    color: #E5E7EB;
    padding: 8px 16px;
    background: #1F2937;
    border-radius: 6px;
    text-align: center;
    font-weight: 500;
  }

  .bc-modal-actions {
    display: flex;
    gap: 16px;
    margin-top: auto;
  }

  .bc-btn {
    flex: 1;
    padding: 14px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    outline: none;
  }

  .bc-btn:focus-visible {
    box-shadow: 0 0 0 3px rgba(255,255,255,0.2);
  }

  .bc-btn.cancel {
    background: #1F2937;
    color: #E5E7EB;
  }

  .bc-btn.cancel:hover {
    background: #374151;
  }

  .bc-btn.confirm {
    background: #047857;
    color: #FFF;
    box-shadow: 0 4px 12px rgba(4, 120, 87, 0.3);
  }

  .bc-btn.confirm:hover {
    background: #065F46;
  }

  /* Toast System */
  .bc-toast {
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #047857;
    color: white;
    padding: 14px 28px;
    border-radius: 10px;
    font-weight: 600;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.5);
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s ease;
    z-index: 100;
  }

  .bc-toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(-8px);
  }

  @media (max-width: 640px) {
    .bc-cell { min-height: 78px; padding: 8px 6px; }
    .bc-amount { font-size: 0.8rem; }
  }
`;

function generateDemoData(year, month) {
  const data = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = \`\${year}-\${String(month + 1).padStart(2, '0')}-\${String(i).padStart(2, '0')}\`;
    const seed = (year * 100 + month * 10 + i) % 100;
    data[dateStr] = Math.round((150 + seed * 10.8) * 100) / 100;
  }
  return data;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helpers
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const date = new Date(y, parseInt(m) - 1, d);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Sub-components
const Toast = ({ message }) => {
  return (
    <div className={\`bc-toast \${message ? 'show' : ''}\`} role="alert" aria-live="assertive">
      {message}
    </div>
  );
};

const SinglePaymentModal = ({ dateStr, amount, onConfirm, onCancel }) => {
  if (!dateStr) return null;
  
  // Focus trap ref
  const modalRef = useRef(null);

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, []);
  
  return createPortal(
    <div 
      className="bc-modal-overlay"
      onClick={(e) => { if (e.target.className === 'bc-modal-overlay') onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="single-modal-title"
    >
      <div className="bc-modal" style={{ width: '380px', margin: 'auto' }} tabIndex={-1} ref={modalRef}>
        <h2 id="single-modal-title" className="bc-modal-title">Confirm Single Payment</h2>
        
        <div className="bc-summary-row" style={{ marginBottom: '16px' }}>
          <span>Date :</span>
          <span className="val">{formatDate(dateStr)}</span>
        </div>

        <div className="bc-summary-total">
          <span className="lbl">Total</span>
          <span className="val" style={{ fontSize: '2.5rem' }}>£{amount?.toFixed(2)}</span>
        </div>

        <div className="bc-modal-actions">
          <button className="bc-btn cancel" onClick={onCancel}>Cancel</button>
          <button className="bc-btn confirm" onClick={onConfirm} autoFocus>Accept Payment</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const PaymentSummaryModal = ({
  unpaidDates,
  totalAmount,
  averagePerDay,
  onConfirm,
  onCancel
}) => {
  if (!unpaidDates || unpaidDates.length === 0) return null;

  const modalRef = useRef(null);

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, []);

  return createPortal(
    <div 
      className="bc-modal-overlay" 
      onClick={(e) => { if (e.target.className === 'bc-modal-overlay') onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div className="bc-modal" tabIndex={-1} ref={modalRef}>
        <h2 id="payment-modal-title" className="bc-modal-title">Payment Summary</h2>
        
        <div className="bc-summary-row">
          <span>Selected Days</span>
          <span className="val">{unpaidDates.length}</span>
        </div>
        
        <div className="bc-summary-row">
          <span>Amount Per Day</span>
          <span className="val">£{averagePerDay.toFixed(2)}</span>
        </div>

        <div className="bc-summary-row">
          <span>Subtotal</span>
          <span className="val">£{totalAmount.toFixed(2)}</span>
        </div>
        
        <div className="bc-summary-divider"></div>
        
        <div className="bc-summary-total">
          <span className="lbl">Total</span>
          <span className="val">£{totalAmount.toFixed(2)}</span>
        </div>
        
        <div className="bc-summary-divider"></div>
        
        <div className="bc-dates-list" tabIndex={0} aria-label="Selected Dates List">
          {unpaidDates.map(d => (
            <div key={d} className="bc-date-item">
              {formatDate(d)}
            </div>
          ))}
        </div>
        
        <div className="bc-modal-actions">
          <button className="bc-btn cancel" onClick={onCancel}>Cancel</button>
          <button className="bc-btn confirm" onClick={onConfirm} autoFocus>Accept Payment</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function BillingCalendar({
  billsByDate = null,
  initialMonth = new Date(),
  onAcceptPayment,
}) {
  const [currentDate, setCurrentDate] = useState(() => 
    new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1)
  );

  const [selectionStart, setSelectionStart] = useState(null);
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [keyboardCursor, setKeyboardCursor] = useState(null);
  
  const [paidDates, setPaidDates] = useState(new Set());
  const [showTotalPopup, setShowTotalPopup] = useState(false);
  const [singlePaymentModal, setSinglePaymentModal] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  
  const containerRef = useRef(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const currentMonthData = useMemo(() => {
    return billsByDate || generateDemoData(year, month);
  }, [billsByDate, year, month]);

  const daysGrid = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const dateStr = \`\${month === 0 ? year - 1 : year}-\${String(month === 0 ? 12 : month).padStart(2, '0')}-\${String(day).padStart(2, '0')}\`;
      days.push({ day, dateStr, isCurrentMonth: false });
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = \`\${year}-\${String(month + 1).padStart(2, '0')}-\${String(day).padStart(2, '0')}\`;
      days.push({ day, dateStr, isCurrentMonth: true });
    }

    // Next month
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      const dateStr = \`\${month === 11 ? year + 1 : year}-\${String(month === 11 ? 1 : month + 2).padStart(2, '0')}-\${String(day).padStart(2, '0')}\`;
      days.push({ day, dateStr, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  const unpaidSelectedDates = useMemo(() => {
    const sorted = Array.from(selectedDates).sort();
    return sorted.filter(date => !paidDates.has(date) && currentMonthData[date]);
  }, [selectedDates, paidDates, currentMonthData]);

  const totalSelectedAmount = useMemo(() => {
    let total = 0;
    unpaidSelectedDates.forEach(date => {
      total += currentMonthData[date] || 0;
    });
    return Math.round(total * 100) / 100;
  }, [unpaidSelectedDates, currentMonthData]);

  const averagePerDay = useMemo(() => {
    if (unpaidSelectedDates.length === 0) return 0;
    return Math.round((totalSelectedAmount / unpaidSelectedDates.length) * 100) / 100;
  }, [totalSelectedAmount, unpaidSelectedDates]);

  // Make sure popup closes if selection empties
  useEffect(() => {
    if (showTotalPopup && selectedDates.size === 0) {
      setShowTotalPopup(false);
    }
  }, [selectedDates, showTotalPopup]);

  const resetSelection = useCallback(() => {
    setSelectedDates(new Set());
    setSelectionStart(null);
    setShowTotalPopup(false);
    if (containerRef.current) containerRef.current.focus();
  }, []);

  const computeRange = useCallback((start, end) => {
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
  }, [daysGrid]);

  // Mouse handlers
  const onMouseDown = useCallback((dateStr) => {
    setIsDragging(true);
    setSelectionStart(dateStr);
    setSelectedDates(new Set([dateStr]));
    setKeyboardCursor(dateStr);
  }, []);

  const onMouseEnter = useCallback((dateStr) => {
    if (isDragging && selectionStart) {
      setSelectedDates(computeRange(selectionStart, dateStr));
      setKeyboardCursor(dateStr);
    }
  }, [isDragging, selectionStart, computeRange]);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard navigation logic
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
        if (isDragging || (window.event && window.event.shiftKey)) {
          // Keep selection expanding if shift is held
          if (!selectionStart) setSelectionStart(keyboardCursor);
          setSelectedDates(computeRange(selectionStart || keyboardCursor, target.dateStr));
        } else {
          // Standard single selection move
          setSelectedDates(new Set([target.dateStr]));
          setSelectionStart(target.dateStr);
        }
      } else {
        // Navigating out of month bounds
        if (key === 'ArrowLeft' || key === 'ArrowUp') {
          setCurrentDate(new Date(year, month - 1, 1));
        } else {
          setCurrentDate(new Date(year, month + 1, 1));
        }
        resetSelection();
      }
    }
  }, [keyboardCursor, daysGrid, isDragging, selectionStart, computeRange, year, month, resetSelection]);

  const handleEsc = useCallback(() => {
    if (singlePaymentModal) {
      setSinglePaymentModal(null);
      if (containerRef.current) containerRef.current.focus();
    } else if (showTotalPopup) {
      setShowTotalPopup(false);
      if (containerRef.current) containerRef.current.focus();
    } else {
      resetSelection();
    }
  }, [singlePaymentModal, showTotalPopup, resetSelection]);

  const handleF7 = useCallback(() => {
    if (selectedDates.size > 0 && totalSelectedAmount > 0) {
      setShowTotalPopup(true);
    }
  }, [selectedDates, totalSelectedAmount]);

  const handleF9 = useCallback(() => {
    if ((!showTotalPopup && !singlePaymentModal) || selectedDates.size === 0) return;
    
    if (unpaidSelectedDates.length === 0) return;
    
    const newPaid = new Set(paidDates);
    unpaidSelectedDates.forEach(d => newPaid.add(d));
    setPaidDates(newPaid);
    
    onAcceptPayment?.({
      dates: unpaidSelectedDates,
      total: totalSelectedAmount,
    });

    setToastMsg(\`Payment of £\${totalSelectedAmount.toFixed(2)} recorded successfully\`);
    setTimeout(() => setToastMsg(''), 2800);
    
    resetSelection();
    setSinglePaymentModal(null);
  }, [showTotalPopup, singlePaymentModal, selectedDates, paidDates, unpaidSelectedDates, totalSelectedAmount, onAcceptPayment, resetSelection]);

  const handleEnter = useCallback(() => {
    if (showTotalPopup || singlePaymentModal) {
      handleF9();
      return;
    }
    
    if (selectedDates.size === 1) {
      const dateStr = Array.from(selectedDates)[0];
      if (!paidDates.has(dateStr) && currentMonthData[dateStr]) {
        setSinglePaymentModal(dateStr);
      }
    } else if (selectedDates.size > 1 && totalSelectedAmount > 0) {
      setShowTotalPopup(true);
    }
  }, [selectedDates, paidDates, currentMonthData, totalSelectedAmount, showTotalPopup, singlePaymentModal, handleF9]);

  useEffect(() => {
    const handler = (e) => {
      if (singlePaymentModal || showTotalPopup) {
        if (e.key === 'Escape') handleEsc();
        if (e.key === 'F9' || e.key === 'Enter') { e.preventDefault(); handleF9(); }
        return;
      }
      if (e.key === 'Escape') { e.preventDefault(); handleEsc(); }
      else if (e.key === 'F7') { e.preventDefault(); handleF7(); }
      else if (e.key === 'F9') { e.preventDefault(); handleF9(); }
      else if (e.key === 'Enter') { e.preventDefault(); handleEnter(); }
      else if (e.key.startsWith('Arrow')) { e.preventDefault(); handleKeyboardNav(e.key); }
    };

    window.addEventListener('keydown', handler);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleEsc, handleF7, handleF9, handleEnter, handleKeyboardNav, onMouseUp, singlePaymentModal, showTotalPopup]);

  const monthLabel = currentDate.toLocaleString('default', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <>
      <style>{styles}</style>
      <div 
        className="bc-container" 
        tabIndex={0} 
        ref={containerRef}
        onFocus={() => {
          if (!keyboardCursor) {
            const first = daysGrid.find(d => d.isCurrentMonth);
            if (first) setKeyboardCursor(first.dateStr);
          }
        }}
      >
        {/* Header */}
        <div className="bc-header">
          <div className="bc-header-title">{monthLabel}</div>

          <div className="bc-legend">
            <div className="bc-legend-item">
              <div className="bc-dot amber" /> Selected range
            </div>
            <div className="bc-legend-item">
              <div className="bc-dot jade" /> Payment accepted
            </div>
          </div>

          <div>
            <button className="bc-nav-btn" onClick={() => {
              setCurrentDate(new Date(year, month - 1, 1));
              resetSelection();
            }}>&larr;</button>
            <button className="bc-nav-btn" style={{ marginLeft: '8px' }} onClick={() => {
              setCurrentDate(new Date(year, month + 1, 1));
              resetSelection();
            }}>&rarr;</button>
          </div>
        </div>

        {/* Hints */}
        <div className="bc-hints">
          <div><span>Drag/Arrows</span> = select dates</div>
          <div><span>F7</span> = show total</div>
          <div><span>F9</span> = accept batch payment</div>
          <div><span>Enter</span> = single detail payment</div>
          <div><span>Esc</span> = cancel</div>
        </div>

        {/* Weekday Headers */}
        <div className="bc-grid">
          {WEEKDAYS.map(day => (
            <div className="bc-day-header" key={day}>{day}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div 
          className="bc-grid" 
          style={{ flex: 1, gridTemplateRows: 'repeat(6, 1fr)' }}
          onMouseLeave={onMouseUp}
        >
          {daysGrid.map((dayObj, idx) => {
            const isSelected = selectedDates.has(dayObj.dateStr);
            const isPaid = paidDates.has(dayObj.dateStr);
            const isCursor = keyboardCursor === dayObj.dateStr;
            const amount = dayObj.isCurrentMonth ? currentMonthData[dayObj.dateStr] || 0 : 0;
            const displayAmount = amount > 0 ? \`£\${amount.toFixed(2)}\` : '';

            let cellClass = "bc-cell";
            if (!dayObj.isCurrentMonth) {
              cellClass += " greyed";
            } else {
              if (isPaid) cellClass += " accepted";
              else if (isSelected) cellClass += " selected";
              if (isCursor) cellClass += " cursor-active";
            }

            return (
              <div
                key={idx}
                className={cellClass}
                onMouseDown={() => dayObj.isCurrentMonth && onMouseDown(dayObj.dateStr)}
                onMouseEnter={() => dayObj.isCurrentMonth && onMouseEnter(dayObj.dateStr)}
                role="button"
                aria-pressed={isSelected}
                aria-label={\`\${dayObj.day} \${monthLabel} - £\${amount}\`}
              >
                <div className="bc-date-num">{dayObj.day}</div>
                {amount > 0 && (
                  <div className="bc-amount">{displayAmount}</div>
                )}
              </div>
            );
          })}
        </div>

        {showTotalPopup && (
          <PaymentSummaryModal 
            unpaidDates={unpaidSelectedDates}
            totalAmount={totalSelectedAmount}
            averagePerDay={averagePerDay}
            onConfirm={handleF9}
            onCancel={handleEsc}
          />
        )}

        {singlePaymentModal && (
          <SinglePaymentModal 
            dateStr={singlePaymentModal}
            amount={currentMonthData[singlePaymentModal]}
            onConfirm={handleF9}
            onCancel={handleEsc}
          />
        )}

        <Toast message={toastMsg} />
      </div>
    </>
  );
}