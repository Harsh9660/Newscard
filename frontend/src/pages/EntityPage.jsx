import { useCallback, useEffect, useRef, useState } from "react";
import ActionBar from "../components/ActionBar";
import FormModal from "../components/FormModal";

export default function EntityPage({
  screen,
  title,
  entity,
  columns,
  fields,
  emptyRow,
  apiModule,
  roundOptions,
  onHelp,
  onToast,
  exportEntity,
  extraRowActions = [],
}) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [copyFlash, setCopyFlash] = useState(null);
  const searchRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await apiModule.list(search || undefined);
      setRows(data);
    } catch (e) {
      onToast(e.message, "error");
    }
  }, [search, apiModule, onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedRow = rows.find((r) => r.id === selected);

  const openAdd = () => {
    const init = { ...emptyRow };
    if (roundOptions) init.round_id = null;
    setModal({ mode: "add", initial: init });
  };

  const openEdit = () => {
    if (!selectedRow) return;
    setModal({ mode: "edit", initial: { ...selectedRow } });
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm("Delete selected record?")) return;
    try {
      await apiModule.delete(selected);
      onToast("Deleted");
      setSelected(null);
      load();
    } catch (e) {
      onToast(e.message, "error");
    }
  };

  const handleSave = async (values, andNew) => {
    const payload = { ...values };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.round_name;
    delete payload.customer_count;
    if (modal.mode === "add") {
      await apiModule.create(payload);
      onToast("✅ Record saved");
    } else {
      await apiModule.update(selected, payload);
      onToast("✅ Record updated");
    }
    load();
    if (!andNew) setModal(null);
    return andNew;
  };

  const onCopy = () => {
    const header = `═══ NEWSCARDS — ${title} ═══`;
    const body = rows
      .map((r) => columns.map((c) => `${c.label}: ${formatCell(r, c)}`).join(" | "))
      .join("\n");
    navigator.clipboard.writeText(
      `${header}\n${body}\nCopied: ${new Date().toLocaleString()}`
    );
    setCopyFlash("✅ Copied!");
    setTimeout(() => setCopyFlash(null), 2000);
  };

  const exportHandlers = {
    export_pdf: async () => {
      const r = await fetch(`/api/export/pdf?entity=${exportEntity}`);
      const d = await r.json();
      onToast(d.message || "PDF saved");
    },
    export_csv: async () => {
      const r = await fetch(`/api/export/csv?entity=${exportEntity}`);
      const d = await r.json();
      onToast(d.message || "CSV saved");
    },
    export_excel: async () => {
      const r = await fetch(`/api/export/excel?entity=${exportEntity}`);
      const d = await r.json();
      onToast(d.message || "Excel saved");
    },
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (modal) return; // let FormModal handle it
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') {
        if (e.ctrlKey && e.key.toLowerCase() === 'f') {
          e.preventDefault();
          searchRef.current?.focus();
        }
        return;
      }
      
      if (e.ctrlKey && e.key.toLowerCase() === 'f') { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === 'F1') { e.preventDefault(); onHelp(); }
      else if (e.ctrlKey && e.key.toLowerCase() === 'n') { e.preventDefault(); openAdd(); }
      else if (e.ctrlKey && e.key.toLowerCase() === 'o') { e.preventDefault(); openEdit(); }
      else if (e.key === 'Delete') { e.preventDefault(); handleDelete(); }
      else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') { e.preventDefault(); onCopy(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal, onHelp, openAdd, openEdit, handleDelete, onCopy]);

  const formFields = fields.map((f) =>
    f.key === "round_id" && roundOptions
      ? { ...f, type: "select", options: roundOptions }
      : f
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-nc-border px-4 py-3">
        <h1 className="text-lg font-bold text-nc-accent">&gt; {title.toUpperCase()}</h1>
        <input
          ref={searchRef}
          type="search"
          placeholder="Search... (Ctrl+F)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto max-w-xs flex-1 rounded border border-nc-border bg-nc-bg px-3 py-1.5 text-sm"
        />
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-nc-panel text-xs uppercase text-nc-muted">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="border-b border-nc-border px-4 py-2">
                  {c.label}
                </th>
              ))}
              {extraRowActions.length > 0 && (
                <th className="border-b border-nc-border px-4 py-2">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => setSelected(row.id)}
                onDoubleClick={openEdit}
                className={`cursor-pointer border-b border-nc-border/30 hover:bg-[#16213e] ${
                  selected === row.id ? "bg-[#0f3460]" : ""
                }`}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-2 ${c.key === "balance" && row.balance > 0 ? "text-red-400 font-semibold" : ""}`}
                  >
                    {formatCell(row, c)}
                  </td>
                ))}
                {extraRowActions.length > 0 && (
                  <td className="px-2 py-1" style={{ whiteSpace: "nowrap" }}>
                    {extraRowActions.map((action) => (
                      <button
                        key={action.label}
                        style={action.style}
                        onClick={(e) => { e.stopPropagation(); action.onClick(row); }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </td>
                )}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-nc-muted">
                  No records. Press Ctrl+N to add.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ActionBar
        left={["help"]}
        center={["new", "edit", "delete", "copy", "export", "print"]}
        right={[]}
        copyFlash={copyFlash}
        disabled={{ edit: !selected, delete: !selected }}
        handlers={{
          help: onHelp,
          new: openAdd,
          edit: openEdit,
          delete: handleDelete,
          copy: onCopy,
          print: exportHandlers.export_pdf,
          ...exportHandlers,
        }}
      />
      {modal && (
        <FormModal
          title={modal.mode === "add" ? `Add ${title}` : `Edit ${title}`}
          mode={modal.mode}
          fields={formFields}
          initial={modal.initial}
          onSave={handleSave}
          onClose={() => setModal(null)}
          onHelp={onHelp}
        />
      )}
    </div>
  );
}

function formatCell(row, col) {
  const v = row[col.key];
  if (col.format === "money") return `£${Number(v || 0).toFixed(2)}`;
  return v ?? "—";
}
