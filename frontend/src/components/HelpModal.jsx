import { useState } from "react";
import { HELP_CONTENT } from "../data/helpContent";

export default function HelpModal({ screen, onClose }) {
  const [tab, setTab] = useState("overview");
  const content = HELP_CONTENT[screen] || { title: screen, overview: "", how_to: [], shortcuts: [], faq: [] };

  const tabs = [
    ["overview", "Overview"],
    ["howto", "How To"],
    ["shortcuts", "Shortcuts"],
    ["faq", "FAQ"],
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-lg border border-nc-border bg-nc-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-nc-border px-4 py-3">
          <h2 className="text-lg font-bold text-white">❓ Help — {content.title}</h2>
          <button type="button" onClick={onClose} className="text-nc-muted hover:text-white">
            ✖
          </button>
        </div>
        <div className="flex gap-1 border-b border-nc-border px-2 pt-2">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 text-xs rounded-t ${
                tab === id ? "bg-[#0f3460] text-white" : "text-nc-muted hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4 text-sm text-nc-text leading-relaxed">
          {tab === "overview" && <p className="whitespace-pre-wrap">{content.overview}</p>}
          {tab === "howto" &&
            content.how_to.map(([title, steps], i) => (
              <div key={i} className="mb-4 pb-3 border-b border-nc-border/50">
                <div className="font-bold text-nc-accent mb-1">{title}</div>
                <div className="text-nc-muted whitespace-pre-wrap">{steps}</div>
              </div>
            ))}
          {tab === "shortcuts" && (
            <table className="w-full text-sm">
              <tbody>
                {content.shortcuts.map(([key, action], i) => (
                  <tr key={i} className={i % 2 ? "bg-[#16213e]/50" : ""}>
                    <td className="py-2 pr-4">
                      <span className="inline-block rounded border border-nc-border bg-[#2a2a3e] px-2 py-0.5 text-xs">
                        {key}
                      </span>
                    </td>
                    <td className="py-2 text-nc-muted">{action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "faq" &&
            (content.faq.length ? (
              content.faq.map(([q, a], i) => (
                <div key={i} className="mb-4">
                  <div className="font-bold text-nc-accent">Q: {q}</div>
                  <div className="text-nc-muted mt-1">{a}</div>
                </div>
              ))
            ) : (
              <p className="text-nc-muted">No FAQ for this screen yet.</p>
            ))}
        </div>
        <div className="border-t border-nc-border p-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-md bg-nc-border py-2 text-sm font-semibold hover:brightness-110"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
