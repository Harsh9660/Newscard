import { useEffect, useState } from "react";
import ActionBar from "./ActionBar";

export default function FormModal({
  title,
  fields,
  initial,
  onSave,
  onClose,
  onHelp,
  mode = "add",
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copyFlash, setCopyFlash] = useState(null);

  useEffect(() => {
    setValues(initial);
    setDirty(false);
    setErrors({});
  }, [initial]);

  const set = (key, val) => {
    setValues((v) => ({ ...v, [key]: val }));
    setDirty(true);
    setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const e = {};
    fields.forEach((f) => {
      if (f.required && !String(values[f.key] ?? "").trim()) {
        e[f.key] = `${f.label} is required`;
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const doSave = async (andNew = false) => {
    if (!validate()) return;
    setSaving(true);
    try {
      const keepOpen = await onSave(values, andNew);
      if (andNew || keepOpen) {
        const cleared = {};
        fields.forEach((f) => {
          cleared[f.key] = f.type === "number" ? 0 : f.default ?? "";
        });
        setValues(cleared);
        setDirty(false);
      } else if (!andNew) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    if (dirty && !window.confirm("Reset all changes?")) return;
    setValues(initial);
    setDirty(false);
    setErrors({});
  };

  const onCloseAttempt = () => {
    if (dirty && !window.confirm("You have unsaved changes. Close without saving?")) return;
    onClose();
  };

  useEffect(() => {
    setValues(initial);
    setDirty(false);
    setErrors({});
  }, [initial]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseAttempt();
      } else if (e.key === 'F1') {
        e.preventDefault();
        onHelp();
      } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        doSave(false);
      } else if (e.key === 'F10') {
        e.preventDefault();
        doSave(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCloseAttempt, onHelp, doSave]);

  const onCopy = () => {
    const text = fields.map((f) => `${f.label}: ${values[f.key] ?? ""}`).join("\n");
    navigator.clipboard.writeText(
      `═══ NEWSCARD — ${title} ═══\n${text}\nCopied: ${new Date().toLocaleString()}`
    );
    setCopyFlash("✅ Copied!");
    setTimeout(() => setCopyFlash(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border border-nc-border bg-nc-card shadow-2xl">
        <div className="border-b border-nc-border px-4 py-3 font-bold">{title}</div>
        <div className="flex-1 overflow-auto space-y-3 p-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs text-nc-muted">
                {f.label}
                {f.required && <span className="text-nc-accent"> *</span>}
              </label>
              {f.type === "select" ? (
                <select
                  className={`w-full rounded border bg-nc-bg px-3 py-2 text-sm ${errors[f.key] ? "border-red-500" : "border-nc-border"
                    }`}
                  value={values[f.key] ?? ""}
                  onChange={(e) =>
                    set(f.key, e.target.value === "" ? null : Number(e.target.value))
                  }
                >
                  <option value="">— None —</option>
                  {(f.options || []).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  className={`w-full rounded border bg-nc-bg px-3 py-2 text-sm ${errors[f.key] ? "border-red-500" : "border-nc-border"
                    }`}
                  rows={3}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              ) : (
                <input
                  type={f.type || "text"}
                  step={f.step}
                  className={`w-full rounded border bg-nc-bg px-3 py-2 text-sm ${errors[f.key] ? "border-red-500" : "border-nc-border"
                    }`}
                  value={values[f.key] ?? ""}
                  onChange={(e) =>
                    set(
                      f.key,
                      f.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value
                    )
                  }
                />
              )}
              {errors[f.key] && <p className="mt-1 text-xs text-red-400">{errors[f.key]}</p>}
            </div>
          ))}
        </div>
        <ActionBar
          left={["help"]}
          center={["reset", "copy"]}
          right={mode === "add" ? ["save_new", "save_close", "cancel"] : ["save", "close"]}
          copyFlash={copyFlash}
          disabled={{ save: saving, save_new: saving, save_close: saving }}
          handlers={{
            help: onHelp,
            reset: onReset,
            copy: onCopy,
            save: () => doSave(false),
            saveNew: () => doSave(true),
            saveClose: () => doSave(false),
            close: onCloseAttempt,
            cancel: onCloseAttempt,
          }}
        />
      </div>
    </div>
  );
}
