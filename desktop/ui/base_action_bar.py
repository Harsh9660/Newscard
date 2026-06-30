from PyQt6.QtWidgets import QWidget, QHBoxLayout, QLabel
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QCursor

COLORS = {
    "bg": "#0E1117",
    "panel_bg": "#161B22",
    "sidebar_bg": "#10141C",
    "accent": "#7C5CFF",
    "accent_hover": "#9277FF",
    "accent_dim": "#5B3FD6",
    "success": "#2DD4BF",
    "warning": "#F5A524",
    "danger": "#F43F5E",
    "info": "#38BDF8",
    "text_primary": "#E6E8EB",
    "text_secondary": "#8B919A",
    "border": "#2A2F3A",
    "input_bg": "#1C2128",
    "row_alt": "#141821",
    "cell_active": "#7C5CFF",
    "holiday_bg": "#1F2937",
    "holiday_text": "#38BDF8",
}

class ActionLabel(QLabel):
    clicked = pyqtSignal()
    
    def __init__(self, key_text: str, label_text: str, is_primary: bool = False, parent=None):
        super().__init__(parent)
        self.is_primary = is_primary
        self.key_text = key_text
        self.label_text = label_text
        self.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))
        self.update_style()
        self.setText(f"{self.key_text}  {self.label_text}")
        
    def update_style(self, hover=False):
        color = COLORS["accent_hover"] if hover else COLORS["accent"]
        text_color = COLORS["text_primary"] if hover else COLORS["text_secondary"]
        
        if self.is_primary:
            color = COLORS["success"]
            
        self.setStyleSheet(f"""
            QLabel {{
                color: {text_color};
                font-family: 'JetBrains Mono', Consolas, monospace;
                font-size: 13px;
                padding: 4px 8px;
                border-radius: 4px;
                background: {'rgba(255,255,255,0.05)' if hover else 'transparent'};
            }}
        """)
        
        # We can use rich text to color the key differently if we wanted, 
        # but for simplicity we keep it uniform or handle it via HTML
        self.setText(f"<span style='color:{color}; font-weight:bold;'>{self.key_text}</span>&nbsp;&nbsp;<span>{self.label_text}</span>")

    def enterEvent(self, event):
        self.update_style(hover=True)
        super().enterEvent(event)
        
    def leaveEvent(self, event):
        self.update_style(hover=False)
        super().leaveEvent(event)
        
    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.clicked.emit()
        super().mousePressEvent(event)


class BaseActionBar(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setFixedHeight(48)
        self.setStyleSheet(f"""
            QWidget {{
                background: {COLORS['panel_bg']};
                border-top: 1px solid {COLORS['border']};
            }}
        """)
        self.layout = QHBoxLayout(self)
        self.layout.setContentsMargins(16, 0, 16, 0)
        self.layout.setSpacing(16)
        
    def add_action(self, key_text: str, label_text: str, callback, align_right: bool = False, is_primary: bool = False):
        action = ActionLabel(key_text, label_text, is_primary=is_primary)
        action.clicked.connect(callback)
        
        if align_right:
            # If this is the first right-aligned item, push it to the right
            if self.layout.itemAt(self.layout.count() - 1) is None or self.layout.itemAt(self.layout.count() - 1).widget() is not None:
                self.layout.addStretch()
            self.layout.addWidget(action)
        else:
            self.layout.addWidget(action)
            
    def add_stretch(self):
        self.layout.addStretch()
