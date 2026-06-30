import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import ActionBar from "../components/ActionBar";
import FormModal from "../components/FormModal";

interface Column {
  key: string;
  label: string;
  format?: "money" | "text";
}

interface Field {
  key: string;
  label: string;
  type?: string;
  options?: any[];
  // Add other field props as needed
}

interface EntityPageProps {
  screen: string;
  title: string;
  entity: string;
  columns: Column[];
  fields: Field[];
  emptyRow: Record<string, any>;
  apiModule: {
    list: (search?: string) => Promise<any[]>;
    create: (data: any) => Promise<any>;
    update: (id: number | string, data: any) => Promise<any>;
    delete: (id: number | string) => Promise<any>;
  };
  roundOptions?: { value: any; label: string }[];
  onHelp: () => void;
  onToast: (message: string, type?: "success" | "error") => void;
  exportEntity?: string;
  extraRowActions?: Array<{
    label: string;
    onClick: (row: any) => void;
    style?: React.CSSProperties;
  }>;
}

export default function EntityPage({
  title,
  columns,
  fields,
  emptyRow,
  apiModule,
  roundOptions,
  onHelp,
  onToast,
  exportEntity,
  extraRowActions = [],
}: EntityPageProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; initial: any } | null>(null);
  const [copyFlash, setCopyFlash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const searchRef = useRef<HTMLInputElement>(null);

  const selectedRow = useMemo(() => 
    rows.find((r) => r.id === selectedId), 
    [rows, selectedId]
  );

  // Load data
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiModule.list(search || undefined);
      setRows(data || []);
    } catch (error: any) {
      onToast(error?.message || "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [search, apiModule, onToast]);

  useEffect(() => {
    load();
  }, [load]);

  // Modal Handlers
  const openAdd = useCallback(() => {
    const initial = { ...emptyRow };
    if (roundOptions) initial.round_id = null;
    setModal({ mode: "add", initial });
  }, [emptyRow, roundOptions]);

  const openEdit = useCallback(() => {
    if (!selectedRow) return;
    setModal({ mode: "edit", initial: { ...selectedRow } });
  }, [selectedRow]);

  // CRUD Operations
  const handleDelete = useCallback(async () => {
    if (!selectedId) return;
    if (!window.confirm(`Delete this ${title.toLowerCase()} record?`)) return;

    try {
      await apiModule.delete(selectedId);
      onToast("Record deleted successfully", "success");
      setSelectedId(null);
      load();
    } catch (error: any) {
      onToast(error?.message || "Delete failed", "error");
    }
  }, [selectedId, title, apiModule, onToast, load]);

  const handleSave = useCallback(async (values: any, andNew = false) => {
    const payload = { ...values };
    // Clean payload
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.round_name;
    delete payload.customer_count;

    try {
      if (modal?.mode === "add") {
        await apiModule.create(payload);
        onToast("✅ Record created successfully", "success");
      } else if (selectedId) {
        await apiModule.update(selectedId, payload);
        onToast("✅ Record updated successfully", "success");
      }

      load();
      if (!andNew) setModal(null);
      return andNew;
    } catch (error: any) {
      onToast(error?.message || "Save failed", "error");
      return false;
    }
  }, [modal, selectedId, apiModule, onToast, load]);

  // Copy to Clipboard
  const onCopy = useCallback(() => {
    if (rows.length === 0) return;

    const header = `═══ NEWSCARDS — ${title.toUpperCase()} ═══`;
    const body = rows
      .map((row) =>
        columns.map((col) => `${col.label}: ${formatCell(row, col)}`).join(" | ")
      )
      .join("\n");

    const content = `${header}\n\n${body}\n\nCopied on: ${new Date().toLocaleString()}`;

    navigator.clipboard.writeText(content).then(() => {
      setCopyFlash("✅ Copied to clipboard!");
      setTimeout(() => setCopyFlash(null), 1800);
    });
  }, [rows, columns, title]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modal) return;

      const isInputFocused = ["INPUT", "TEXTAREA"].includes(
        (e.target as HTMLElement).tagName
      );

      if (isInputFocused && e.ctrlKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      switch (true) {
        case e.key === "F1":
          e.preventDefault();
          onHelp();
          break;
        case e.ctrlKey && e.key.toLowerCase() === "n":
          e.preventDefault();
          openAdd();
          break;
        case e.ctrlKey && e.key.toLowerCase() === "o":
          e.preventDefault();
          openEdit();
          break;
        case e.key === "Delete":
          e.preventDefault();
          handleDelete();
          break;
        case e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "c":
          e.preventDefault();
          onCopy();
          break;
        case e.ctrlKey && e.key.toLowerCase() === "f":
          e.preventDefault();
          searchRef.current?.focus();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modal, onHelp, openAdd, openEdit, handleDelete, onCopy]);

  const formFields = useMemo(() => 
    fields.map((f) =>
      f.key === "round_id" && roundOptions
        ? { ...f, type: "select", options: roundOptions }
        : f
    ), 
    [fields, roundOptions]
  );

  return (
    <div className="flex h-full flex-col relative w-full overflow-hidden bg-nc-bg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-nc-border px-6 py-5 gap-4 bg-nc-bg/80 backdrop-blur-md z-10 shrink-0">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white capitalize">
            {title}
          </h1>
          <p className="text-nc-muted mt-1">Manage your {title.toLowerCase()}</p>
        </div>

        <div className="relative w-full sm:w-80">
          <input
            ref={searchRef}
            type="search"
            placeholder="Search... (Ctrl+F)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass w-full pl-11 h-11 text-sm focus:ring-1 focus:ring-nc-accent"
          />
          <span className="absolute left-4 top-3.5 text-nc-muted">🔍</span>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 pb-32">
        <div className="glass-card overflow-hidden border border-nc-border/60 shadow-2xl rounded-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/40 text-xs uppercase tracking-widest text-nc-muted border-b border-nc-border sticky top-0 z-10">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className="px-6 py-4 font-semibold">
                      {col.label}
                    </th>
                  ))}
                  {extraRowActions.length > 0 && (
                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-nc-border/30">
                {loading && rows.length === 0 ? (
                  <LoadingRow colSpan={columns.length + (extraRowActions.length ? 1 : 0)} />
                ) : rows.length === 0 ? (
                  <EmptyStateRow 
                    colSpan={columns.length + (extraRowActions.length ? 1 : 0)} 
                    title={title} 
                    onAdd={openAdd} 
                  />
                ) : (
                  rows.map((row) => (
                    <DataRow
                      key={row.id}
                      row={row}
                      columns={columns}
                      isSelected={selectedId === row.id}
                      extraRowActions={extraRowActions}
                      onSelect={setSelectedId}
                      onDoubleClick={openEdit}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <ActionBar
        left={["help"]}
        center={["new", "edit", "delete", "copy", "export"]}
        right={[]}
        copyFlash={copyFlash}
        disabled={{ edit: !selectedId, delete: !selectedId }}
        handlers={{
          help: onHelp,
          new: openAdd,
          edit: openEdit,
          delete: handleDelete,
          copy: onCopy,
          print: () => {/* handle PDF */},
          export_pdf: () => {/* ... */},
          export_csv: () => {/* ... */},
          export_excel: () => {/* ... */},
        }}
      />

      {/* Modal */}
      {modal && (
        <FormModal
          title={`${modal.mode === "add" ? "New" : "Edit"} ${title.replace(/s$/, "")}`}
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

// Sub-components for clarity
const LoadingRow = ({ colSpan }: { colSpan: number }) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-20 text-center">
      <div className="flex flex-col items-center justify-center text-nc-muted animate-pulse">
        <div className="h-9 w-9 rounded-full border-4 border-t-nc-accent border-nc-border animate-spin mb-4" />
        <p>Loading records...</p>
      </div>
    </td>
  </tr>
);

const EmptyStateRow = ({ colSpan, title, onAdd }: { colSpan: number; title: string; onAdd: () => void }) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-20 text-center">
      <div className="flex flex-col items-center">
        <span className="text-6xl mb-6 opacity-40">📪</span>
        <p className="text-xl font-medium text-white">No records found</p>
        <p className="text-nc-muted mt-2">Create your first record to get started</p>
        <button onClick={onAdd} className="mt-8 btn-primary text-base px-8 py-3">
          + Add New {title.replace(/s$/, "")}
        </button>
      </div>
    </td>
  </tr>
);

const DataRow = ({ row, columns, isSelected, extraRowActions, onSelect, onDoubleClick }: any) => (
  <tr
    onClick={() => onSelect(row.id)}
    onDoubleClick={onDoubleClick}
    className={`cursor-pointer transition-all duration-200 border-l-4 ${
      isSelected 
        ? "bg-nc-accent/10 border-l-nc-accent" 
        : "hover:bg-white/5 border-l-transparent"
    }`}
  >
    {columns.map((col: Column) => (
      <td key={col.key} className="px-6 py-4">
        {formatCell(row, col)}
      </td>
    ))}
    {extraRowActions.length > 0 && (
      <td className="px-6 py-3 text-right">
        <div className="flex justify-end gap-2">
          {extraRowActions.map((action: any) => (
            <button
              key={action.label}
              onClick={(e) => { e.stopPropagation(); action.onClick(row); }}
              className="text-xs px-3 py-1 rounded hover:bg-white/10 transition"
              style={action.style}
            >
              {action.label}
            </button>
          ))}
        </div>
      </td>
    )}
  </tr>
);

function formatCell(row: any, col: Column) {
  const value = row[col.key];
  if (col.format === "money") {
    return `£${Number(value || 0).toFixed(2)}`;
  }
  return value ?? "—";
}