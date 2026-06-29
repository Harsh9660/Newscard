import customtkinter as ctk
import datetime

class AppWindowManager:
    def __init__(self, root):
        self.root = root
        self.history = []  # Stack of dicts: {"view_class": cls, "payload": {}, "focus": None}
        self.current_view = None
        self.header_frame = None
        self.content_frame = None
        
        self.setup_ui_shell()
        self.bind_global_keys()

    def setup_ui_shell(self):
        # Header (Platform Header)
        self.header_frame = ctk.CTkFrame(self.root, height=40, corner_radius=0)
        self.header_frame.pack(side="top", fill="x")
        
        self.breadcrumb_label = ctk.CTkLabel(self.header_frame, text="Main Menu", font=("Arial", 14, "bold"))
        self.breadcrumb_label.pack(side="left", padx=10)
        
        self.date_label = ctk.CTkLabel(self.header_frame, text="")
        self.date_label.pack(side="right", padx=10)
        self.update_system_date()
        
        # Main Content Area
        self.content_frame = ctk.CTkFrame(self.root, corner_radius=0)
        self.content_frame.pack(side="top", fill="both", expand=True)

    def update_system_date(self):
        now = datetime.datetime.now()
        date_str = now.strftime("System Date: %A, %m/%d/%Y")
        self.date_label.configure(text=date_str)
        self.root.after(60000, self.update_system_date)

    def bind_global_keys(self):
        self.root.bind("<Escape>", self.handle_escape)

    def handle_escape(self, event):
        # Check if there's an active overlay
        if hasattr(self.root, 'active_overlay') and self.root.active_overlay:
            self.root.active_overlay.destroy()
            self.root.active_overlay = None
            return

        # Otherwise, step backward in history
        self.navigate_back()

    def navigate_to(self, view_class, payload=None, breadcrumb="Main Menu"):
        # Save current view state to history
        if self.current_view:
            self.history.append({
                "view_class": self.current_view.__class__,
                "payload": getattr(self.current_view, 'payload', None),
                "breadcrumb": self.breadcrumb_label.cget("text")
            })
            self.current_view.destroy()
        
        self.breadcrumb_label.configure(text=breadcrumb)
        self.current_view = view_class(self.content_frame, self, payload)
        self.current_view.pack(fill="both", expand=True)

    def navigate_back(self):
        if not self.history:
            return  # Already at root
        
        previous_state = self.history.pop()
        if self.current_view:
            self.current_view.destroy()
            
        self.breadcrumb_label.configure(text=previous_state["breadcrumb"])
        self.current_view = previous_state["view_class"](self.content_frame, self, previous_state["payload"])
        self.current_view.pack(fill="both", expand=True)
