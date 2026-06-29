import customtkinter as ctk

class MainMenu(ctk.CTkFrame):
    def __init__(self, parent, nav_manager, payload=None):
        super().__init__(parent)
        self.nav_manager = nav_manager
        
        lbl = ctk.CTkLabel(self, text="Newscard ERP Dashboard", font=("Arial", 24))
        lbl.pack(pady=40)
        
        btn_customers = ctk.CTkButton(self, text="1. Customers (Deep CRUD & Billing)", 
                                      command=lambda: self.nav_manager.navigate_to(CustomersView, breadcrumb="Main Menu > Customers"))
        btn_customers.pack(pady=10)
        
        btn_rounds = ctk.CTkButton(self, text="2. Rounds & Streets", 
                                   command=lambda: self.nav_manager.navigate_to(PlaceholderView, payload="Rounds", breadcrumb="Main Menu > Rounds"))
        btn_rounds.pack(pady=10)
        
        btn_papers = ctk.CTkButton(self, text="3. Papers (Inventory & Adjustments)", 
                                   command=lambda: self.nav_manager.navigate_to(PlaceholderView, payload="Papers", breadcrumb="Main Menu > Papers"))
        btn_papers.pack(pady=10)
        
        btn_wp = ctk.CTkButton(self, text="4. Word Processor", 
                               command=lambda: self.nav_manager.navigate_to(PlaceholderView, payload="Word Processor", breadcrumb="Main Menu > Word Processor"))
        btn_wp.pack(pady=10)

class CustomersView(ctk.CTkFrame):
    def __init__(self, parent, nav_manager, payload=None):
        super().__init__(parent)
        self.nav_manager = nav_manager
        
        lbl = ctk.CTkLabel(self, text="Customers Database", font=("Arial", 18))
        lbl.pack(pady=20)
        
        lbl_hint = ctk.CTkLabel(self, text="Press F7 to Process Payment (Billing Grid overlay)\nPress F9 for Options Context Menu")
        lbl_hint.pack(pady=10)
        
        self.bind("<F7>", self.process_payment)
        self.bind("<F9>", self.show_options)
        self.focus_set()

    def process_payment(self, event):
        # Create an overlay dialog
        self.nav_manager.root.active_overlay = ctk.CTkToplevel(self)
        self.nav_manager.root.active_overlay.title("Process Payment")
        self.nav_manager.root.active_overlay.geometry("300x150")
        
        lbl = ctk.CTkLabel(self.nav_manager.root.active_overlay, text="Amount received: £ +")
        lbl.pack(pady=20)
        
        entry = ctk.CTkEntry(self.nav_manager.root.active_overlay)
        entry.pack()
        entry.focus()
        
        def commit(e):
            print(f"Committed {entry.get()}")
            self.nav_manager.root.active_overlay.destroy()
            self.nav_manager.root.active_overlay = None
            
        entry.bind("<Return>", commit)

    def show_options(self, event):
        self.nav_manager.root.active_overlay = ctk.CTkToplevel(self)
        self.nav_manager.root.active_overlay.title("Options")
        self.nav_manager.root.active_overlay.geometry("300x200")
        
        ctk.CTkButton(self.nav_manager.root.active_overlay, text="Record vouchers").pack(pady=5)
        ctk.CTkButton(self.nav_manager.root.active_overlay, text="Preview statement").pack(pady=5)
        ctk.CTkButton(self.nav_manager.root.active_overlay, text="Print statement").pack(pady=5)

class PlaceholderView(ctk.CTkFrame):
    def __init__(self, parent, nav_manager, payload=None):
        super().__init__(parent)
        self.nav_manager = nav_manager
        lbl = ctk.CTkLabel(self, text=f"Under Construction: {payload}", font=("Arial", 20))
        lbl.pack(pady=50)
        
        lbl_esc = ctk.CTkLabel(self, text="Press ESC to return to previous menu.")
        lbl_esc.pack(pady=10)
