from PyQt6.QtWidgets import QDialog, QVBoxLayout, QLabel, QTabWidget, QTextEdit, QScrollArea, QTableWidget, QLineEdit, QWidget, QTableWidgetItem
from PyQt6.QtCore import Qt
from desktop.modules.help_content import HELP_CONTENT, MASTER_SHORTCUTS

class HelpDialog(QDialog):
  def __init__(self, screen_name, parent=None):
    super().__init__(parent, Qt.WindowType.Window | Qt.WindowType.WindowStaysOnTopHint)
    content = HELP_CONTENT.get(screen_name, {})
    self.screen_name = screen_name
    self.setWindowTitle(f"❓ Help — {content.get('title', 'General')}")
    self.setMinimumSize(620, 560)
    self.setAttribute(Qt.WidgetAttribute.WA_DeleteOnClose)
    self.shortcut_sections = []
    self.setup_ui(content)

  def setup_ui(self, content):
    layout = QVBoxLayout(self)

    header = QLabel(f"❓  {content.get('title','Help')}")
    header.setStyleSheet("""
      color: #20b2aa;
      font-family: 'Segoe UI', sans-serif;
      font-size: 18px; font-weight: bold;
      padding: 8px 12px;
      border-bottom: 1px solid #3a3a5c;
    """)
    layout.addWidget(header)

    tabs = QTabWidget()
    tabs.setStyleSheet("""
      QTabWidget::pane {
        border: 1px solid #3a3a5c;
        background: #1e1e2e;
      }
      QTabBar::tab {
        background: #2a2a3e;
        color: #a0a0b0;
        padding: 8px 14px;
        border: 1px solid #3a3a5c;
      }
      QTabBar::tab:selected {
        background: #0f3460;
        color: #ffffff;
      }
    """)
    
    # Tab 1 Overview
    overview_tab = QTextEdit()
    overview_tab.setReadOnly(True)
    overview_tab.setText(content.get('overview', ''))
    tabs.addTab(overview_tab, "Overview")
    
    # Tab 2 How To
    howto_tab = QScrollArea()
    tabs.addTab(howto_tab, "How To")
    
    # Tab 3 Shortcuts (This Screen)
    shortcuts_tab = QTableWidget()
    tabs.addTab(shortcuts_tab, "Shortcuts")
    
    # Tab 4 All Shortcuts
    all_shortcuts_tab = QWidget()
    all_layout = QVBoxLayout(all_shortcuts_tab)
    
    search_box = QLineEdit()
    search_box.setPlaceholderText("Search shortcuts...")
    search_box.textChanged.connect(self.filter_shortcuts)
    all_layout.addWidget(search_box)
    
    scroll = QScrollArea()
    scroll_content = QWidget()
    scroll_layout = QVBoxLayout(scroll_content)
    
    for section_name, shortcuts in MASTER_SHORTCUTS.items():
        lbl = QLabel(section_name)
        lbl.setStyleSheet("color: #20b2aa; font-weight: bold; padding-top: 10px;")
        scroll_layout.addWidget(lbl)
        
        table = QTableWidget()
        table.setColumnCount(2)
        table.setHorizontalHeaderLabels(["Shortcut", "Action"])
        table.setRowCount(len(shortcuts))
        
        rows = []
        for i, (key, action) in enumerate(shortcuts.items()):
            table.setItem(i, 0, QTableWidgetItem(key))
            table.setItem(i, 1, QTableWidgetItem(action))
            rows.append({'key': key, 'action': action, 'row_idx': i, 'widget': table})
            
        scroll_layout.addWidget(table)
        self.shortcut_sections.append({'table': table, 'rows': rows, 'label': lbl})
        
    scroll.setWidget(scroll_content)
    scroll.setWidgetResizable(True)
    all_layout.addWidget(scroll)
    
    tabs.addTab(all_shortcuts_tab, "All Shortcuts")
    
    # Tab 5 FAQ
    faq_tab = QScrollArea()
    tabs.addTab(faq_tab, "FAQ")
    
    layout.addWidget(tabs)

  def filter_shortcuts(self, text):
    text = text.lower()
    for section in self.shortcut_sections:
      table = section['table']
      visible_count = 0
      for row in section['rows']:
        key_text = row['key'].lower()
        action_text = row['action'].lower()
        visible = (text in key_text or text in action_text)
        table.setRowHidden(row['row_idx'], not visible)
        if visible:
            visible_count += 1
      section['label'].setVisible(visible_count > 0)
      table.setVisible(visible_count > 0)
