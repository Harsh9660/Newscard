import { useEffect, useRef, useState } from "react";

const STYLES = {
  help: { bg: "#2d6a9f", label: "❓ Help" },
  new: { bg: "#2e7d32", label: "➕ New" },
  edit: { bg: "#1565c0", label: "✏️ Edit" },
  delete: { bg: "#b71c1c", label: "🗑️ Delete" },
  copy: { bg: "#3a3a5c", label: "📋 Copy" },
  export: { bg: "#6a1b9a", label: "📤 Export ▾" },
  print: { bg: "#004d40", label: "🖨️ Print" },
  save: { bg: "#e94560", label: "💾 Save" },
  save_new: { bg: "#c62828", label: "💾 Save & New" },
  save_close: { bg: "#e94560", label: "💾 Save & Close" },
  reset: { bg: "#555566", label: "↩️ Reset" },
  close: { bg: "#444455", label: "✖ Close" },
  cancel: { bg: "#444455", label: "✖ Cancel" },
};

function BarButton({ id, onClick, disabled, title, flash }) {
  const s = STYLES[id];
  if (!s) return null;
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className="h-9 min-w-[90px] rounded-md px-3 text-[11px] font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
      style={{ backgroundColor: s.bg }}
    >
      {flash || s.label}
    </button>
  );
}

function Sep() {
  return <div className="mx-1 h-7 w-px bg-nc-border" />;
}

export default function ActionBar({
  left = ["help"],
  center = [],
  right = [],
  handlers = {},
  disabled = {},
  copyFlash = null,
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setExportOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const renderBtn = (id) => {
    if (id === "export") {
      return (
        <div key="export" className="relative" ref={menuRef}>
          <BarButton
            id="export"
            title="Ctrl+Shift+X"
            onClick={() => setExportOpen((o) => !o)}
          />
          {exportOpen && (
            <div className="absolute bottom-full left-0 mb-1 min-w-[160px] rounded border border-nc-border bg-nc-card py-1 shadow-lg z-50">
              {[
                ["pdf", "📄 Export as PDF"],
                ["csv", "📊 Export as CSV"],
                ["excel", "📋 Export as Excel"],
              ].map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-xs hover:bg-[#0f3460]"
                  onClick={() => {
                    setExportOpen(false);
                    handlers[`export_${k}`]?.();
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }
    const handlerKey =
      id === "save_new"
        ? "saveNew"
        : id === "save_close"
          ? "saveClose"
          : id.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    return (
      <BarButton
        key={id}
        id={id}
        disabled={disabled[id]}
        title={
          {
            help: "F1",
            new: "Ctrl+N",
            edit: "Ctrl+O",
            delete: "Delete",
            copy: "Ctrl+Shift+C",
            print: "Ctrl+Shift+P",
            save: "Ctrl+S / F10",
            save_new: "Ctrl+Shift+S",
            reset: "Ctrl+Z",
            close: "Escape",
            cancel: "Escape",
          }[id]
        }
        flash={id === "copy" && copyFlash ? copyFlash : null}
        onClick={() => handlers[handlerKey]?.()}
      />
    );
  };

  return (
    <footer className="flex flex-wrap items-center gap-1.5 border-t border-nc-border bg-nc-panel px-3 py-2">
      <div className="flex items-center gap-1.5">{left.map(renderBtn)}</div>
      {center.length > 0 && (
        <>
          <Sep />
          <div className="flex items-center gap-1.5">{center.map(renderBtn)}</div>
        </>
      )}
      {right.length > 0 && (
        <>
          <div className="flex-1" />
          <Sep />
          <div className="flex items-center gap-1.5">{right.map(renderBtn)}</div>
        </>
      )}
    </footer>
  );
}
