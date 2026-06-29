import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML =
    '<pre style="color:#f44336;padding:2rem">NEWSCARD: #root element missing from page.</pre>';
} else {
  try {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    rootEl.innerHTML = `<pre style="color:#f44336;padding:1rem">Failed to start: ${err.message}</pre>`;
    console.error(err);
  }
}
