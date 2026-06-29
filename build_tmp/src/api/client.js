const BASE = "";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => request("/api/health"),
  dashboard: () => request("/api/dashboard/stats"),
  dashboardAnalytics: () => request("/api/dashboard/analytics"),

  customers: {
    list: (search) =>
      request(`/api/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`),
    get: (id) => request(`/api/customers/${id}`),
    create: (data) => request("/api/customers", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`/api/customers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) => request(`/api/customers/${id}`, { method: "DELETE" }),
  },

  products: {
    list: (search) =>
      request(`/api/products${search ? `?search=${encodeURIComponent(search)}` : ""}`),
    create: (data) => request("/api/products", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) => request(`/api/products/${id}`, { method: "DELETE" }),
  },

  rounds: {
    list: () => request("/api/delivery-rounds"),
    create: (data) =>
      request("/api/delivery-rounds", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`/api/delivery-rounds/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) => request(`/api/delivery-rounds/${id}`, { method: "DELETE" }),
  },

  // ── Billing / Weekly ────────────────────────────────
  weekly: {
    get: (customerId) => request(`/api/billing/customers/${customerId}/weekly`),
    update: (customerId, papers) =>
      request(`/api/billing/customers/${customerId}/weekly`, {
        method: "PUT",
        body: JSON.stringify({ papers }),
      }),
  },

  calendar: {
    get: (customerId, year) =>
      request(`/api/billing/customers/${customerId}/calendar${year ? `?year=${year}` : ""}`),
  },

  markPaid: (data) =>
    request("/api/billing/mark-paid", { method: "POST", body: JSON.stringify(data) }),

  orders: {
    list: (customerId) => request(`/api/billing/customers/${customerId}/orders`),
    create: (customerId, data) =>
      request(`/api/billing/customers/${customerId}/orders`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (customerId, orderId) =>
      request(`/api/billing/customers/${customerId}/orders/${orderId}`, { method: "DELETE" }),
  },

  payments: {
    list: (customerId) => request(`/api/billing/customers/${customerId}/payments`),
    create: (data) =>
      request("/api/billing/payments", { method: "POST", body: JSON.stringify(data) }),
    delete: (id) => request(`/api/billing/payments/${id}`, { method: "DELETE" }),
  },

  holds: {
    list: (customerId) => request(`/api/billing/customers/${customerId}/holds`),
    create: (data) =>
      request("/api/billing/holds", { method: "POST", body: JSON.stringify(data) }),
    cancel: (holdId) =>
      request(`/api/billing/holds/${holdId}/cancel`, { method: "PATCH" }),
  },

  extract: () => request("/api/extract", { method: "POST" }),
  save: () => request("/api/save", { method: "POST" }),
  exportCsv: (entity) => request(`/api/export/csv?entity=${entity}`),
  exportExcel: (entity) => request(`/api/export/excel?entity=${entity}`),
  exportPdf: (entity) => request(`/api/export/pdf?entity=${entity}`),
};
