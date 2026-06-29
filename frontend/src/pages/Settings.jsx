import { api } from "../api/client";
import ActionBar from "../components/ActionBar";

export default function Settings({ onHelp, onToast }) {
  const extract = async () => {
    try {
      const r = await api.extract();
      onToast(r.message, "info");
    } catch (e) {
      onToast(e.message, "error");
    }
  };

  const quickSave = async () => {
    try {
      const r = await api.save();
      onToast(r.message);
    } catch (e) {
      onToast(e.message, "error");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-nc-border px-4 py-3">
        <h1 className="text-lg font-bold text-nc-accent">&gt; SETTINGS</h1>
      </div>
      <div className="flex-1 space-y-4 overflow-auto p-4 text-sm">
        <section className="rounded-lg border border-nc-border bg-nc-card p-4">
          <h2 className="mb-2 font-bold">Data &amp; Export</h2>
          <p className="mb-3 text-nc-muted">
            SQLite database stored locally. Nightly JSON export runs at 22:00 (APScheduler).
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={extract}
              className="rounded bg-[#6a1b9a] px-4 py-2 text-xs font-bold hover:brightness-110"
            >
              📤 Extract Now (Ctrl+Shift+X)
            </button>
            <button
              type="button"
              onClick={quickSave}
              className="rounded bg-nc-accent px-4 py-2 text-xs font-bold hover:brightness-110"
            >
              💾 Save Snapshot (F10)
            </button>
          </div>
        </section>
        <section className="rounded-lg border border-nc-border bg-nc-card p-4">
          <h2 className="mb-2 font-bold">Keyboard Shortcuts</h2>
          <ul className="space-y-1 text-nc-muted text-xs">
            <li>F1 — Help</li>
            <li>F5 — Refresh</li>
            <li>F10 — Quick save</li>
            <li>Ctrl+Shift+X — Extract JSON</li>
            <li>Ctrl+1..4 — Navigate sections</li>
            <li>Ctrl+N / Ctrl+O / Delete — CRUD on lists</li>
            <li>Ctrl+Shift+X — Export menu</li>
            <li>Ctrl+S — Save form</li>
          </ul>
        </section>
      </div>
      <ActionBar left={["help"]} center={["copy"]} right={["close"]} handlers={{ help: onHelp }} />
    </div>
  );
}
