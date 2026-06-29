export const HELP_CONTENT = {
  dashboard: {
    title: "Dashboard",
    overview:
      "Live overview and analytics for your newsagent business. Stat cards show key numbers at the top. The Analytics section shows customers per round, balances by round, publication types, payment status, and top debtors. Auto-refreshes every 60 seconds.",
    how_to: [
      ["View analytics charts", "Scroll below the stat cards to see bar charts and payment status."],
      ["View outstanding balances", "Check the red Outstanding card or the Top Balances table."],
      ["Export from dashboard", "Use Export in the bottom bar for PDF, CSV, or Excel."],
      ["Refresh data", "Click Refresh top-right or press F5."],
    ],
    shortcuts: [
      ["F1", "Open help"],
      ["F5", "Refresh dashboard"],
      ["Ctrl+1", "Go to Dashboard"],
      ["Ctrl+2", "Go to Customers"],
    ],
    faq: [
      ["How often does data refresh?", "Press F5 or click Refresh for immediate update."],
    ],
  },
  customers: {
    title: "Customers",
    overview:
      "Manage customer accounts. Address and phone are encrypted in the database. Balance shown in red when owed.",
    how_to: [
      ["Add customer", "Click New or Ctrl+N, fill Name (required), Save & Close."],
      ["Edit customer", "Select a row, click Edit or Ctrl+E."],
      ["Delete customer", "Select row, Delete key or trash button."],
    ],
    shortcuts: [
      ["F1", "Help"],
      ["Ctrl+N", "New"],
      ["Ctrl+E", "Edit"],
      ["Ctrl+S", "Save form"],
      ["F10", "Quick save snapshot"],
      ["Ctrl+Shift+E", "Export menu"],
      ["Delete", "Delete selected"],
    ],
    faq: [
      ["Is my data secure?", "Address and phone are encrypted at rest with Fernet."],
    ],
  },
  products: {
    title: "Publications / Products",
    overview: "Manage your newspaper and magazine catalog with prices and suppliers.",
    how_to: [
      ["Add publication", "New → name, type, price → Save."],
      ["Update price", "Edit row and change price field."],
    ],
    shortcuts: [
      ["F1", "Help"],
      ["Ctrl+N", "New"],
      ["Ctrl+E", "Edit"],
    ],
    faq: [],
  },
  rounds: {
    title: "Delivery Rounds",
    overview: "Manage delivery routes. Customers can be assigned to a round.",
    how_to: [
      ["Create round", "New → name and type → Save."],
      ["Delete round", "Remove all customers from round first."],
    ],
    shortcuts: [
      ["F1", "Help"],
      ["Ctrl+N", "New"],
    ],
    faq: [
      ["Cannot delete round?", "Reassign or remove customers on that round first."],
    ],
  },
  settings: {
    title: "Settings",
    overview: "Export data, nightly backups at 10 PM, and keyboard shortcuts reference.",
    how_to: [
      ["Manual export", "Ctrl+E or Export button → JSON daily summary."],
      ["Nightly backup", "Runs automatically at 10:00 PM via APScheduler."],
    ],
    shortcuts: [
      ["F10", "Save snapshot"],
      ["Ctrl+E", "Extract / export JSON"],
    ],
    faq: [],
  },
};
