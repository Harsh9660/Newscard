from PyQt6.QtWidgets import QDialog, QMessageBox, QWidget
from PyQt6.QtCore import Qt, QEvent
from PyQt6.QtGui import QShortcut, QKeySequence
from decimal import Decimal
from desktop.ui.paper_adjustment import PaperAdjustmentScreen
from desktop.ui.amount_received import AmountReceivedDialog

class WeeklyAccount(QDialog):
    # Dummy base for WeeklyAccount to implement the F6 and F7 logic
    def __init__(self, customer_id, api, parent=None):
        super().__init__(parent)
        self.api = api
        self.customer_id = customer_id
        self.weekly_data = None
        self.selected_row = 0
        self.selected_col = 0
        self.install_shortcuts_filter()
        self.register_shortcuts()
    
    def open_paper_adjustment(self):
      """F6 — opens Paper & Adjustment screen
      for the currently selected paper row"""
      if not self.weekly_data:
        return
      papers = self.weekly_data.get('papers', [])
      if self.selected_row >= len(papers):
        QMessageBox.information(self, "Info",
          "Select a paper row first.\\n"
          "Click a paper name, then press F6.")
        return
    
      paper = papers[self.selected_row]
      dlg = PaperAdjustmentScreen(
        self.customer_id,
        self.weekly_data['week_end_iso'],
        paper['order_id'],
        self.api, self)
      if dlg.exec() == QDialog.DialogCode.Accepted:
        self.load_data()
    
    def on_f7_pressed(self):
      """F7 — opens Amount Received dialog"""
      if not self.weekly_data:
        return
      amount = self.weekly_data.get('total', 0)
      outstanding = self.weekly_data.get('outstanding', 0)
    
      if Decimal(str(outstanding)) <= 0:
        QMessageBox.information(self, "Info",
          f"No outstanding amount for this week.\\n"
          f"Balance: £{outstanding:.2f}")
        return
    
      week_data = {
        'amount':         float(amount),
        'date_iso':       self.weekly_data['week_end_iso'],
        'ac_number':      self.weekly_data['customer']['ac_number'],
        'customer_name':  self.weekly_data['customer']['name'],
        'is_holiday':     self.weekly_data.get('on_holiday', False),
        'paid':           False,
      }
    
      dlg = AmountReceivedDialog(
        self.customer_id,
        week_data,
        self.api, self)
      if dlg.exec() == QDialog.DialogCode.Accepted:
        self.load_data()
        
    def load_data(self):
        pass

    def install_shortcuts_filter(self):
        self.installEventFilter(self)
        for w in self.findChildren(QWidget):
            w.installEventFilter(self)

    def eventFilter(self, obj, event):
        if event.type() == QEvent.Type.KeyPress:
            if self.handle_key_press(event):
                return True
        return super().eventFilter(obj, event)

    def keyPressEvent(self, event):
        if not self.handle_key_press(event):
            super().keyPressEvent(event)

    def register_shortcuts(self):
        def sc(key_str, fn):
            s = QShortcut(QKeySequence(key_str), self)
            s.setContext(Qt.ShortcutContext.WindowShortcut)
            s.activated.connect(fn)

        sc("F1",     self.open_help)
        sc("F2",     self.open_help)
        sc("F3",     self.open_payment_dialog)
        sc("F4",     self.save_data)
        sc("F6",     self.open_paper_adjustment)
        sc("F7",     self.on_f7_pressed)
        sc("F8",     self.remove_paper)
        sc("Ctrl+S", self.save_data)
        sc("Escape", self.on_close)

    def handle_key_press(self, event):
        key  = event.key()
        mods = event.modifiers()
        Ctrl = Qt.KeyboardModifier.ControlModifier

        if key in (Qt.Key.Key_F1, Qt.Key.Key_F2):
            self.open_help()
            return True
        elif key == Qt.Key.Key_F3:
            self.open_payment_dialog()
            return True
        elif key == Qt.Key.Key_F6:
            self.open_paper_adjustment()
            return True
        elif key == Qt.Key.Key_F7:
            self.on_f7_pressed()
            return True
        elif key == Qt.Key.Key_F8:
            self.remove_paper()
            return True
        elif key == Qt.Key.Key_F4:
            self.save_data()
            return True
        elif key == Qt.Key.Key_Escape:
            self.on_close()
            return True
        elif (mods == Ctrl and key == Qt.Key.Key_S):
            self.save_data()
            return True
        elif key in (Qt.Key.Key_0, Qt.Key.Key_1, Qt.Key.Key_2, Qt.Key.Key_3, Qt.Key.Key_4, Qt.Key.Key_5):
            qty = key - Qt.Key.Key_0
            self.set_cell_quantity(self.selected_row, self.selected_col, qty)
            return True
        elif key == Qt.Key.Key_Tab:
            self.move_to_next_cell()
            return True
        elif key == Qt.Key.Key_Up:
            self.selected_row = max(0, self.selected_row - 1)
            self.repaint_cells()
            return True
        elif key == Qt.Key.Key_Down:
            max_r = len(self.weekly_data.get('papers',[])) - 1 if self.weekly_data else 0
            self.selected_row = min(max_r, self.selected_row + 1)
            self.repaint_cells()
            return True
        elif key == Qt.Key.Key_Left:
            self.selected_col = max(1, self.selected_col - 1)
            self.repaint_cells()
            return True
        elif key == Qt.Key.Key_Right:
            self.selected_col = min(7, self.selected_col + 1)
            self.repaint_cells()
            return True
        return False

    def open_help(self): pass
    def open_payment_dialog(self): pass
    def remove_paper(self): pass
    def save_data(self): pass
    def on_close(self):
        # Dummy check for unsaved changes since full logic isn't here
        has_unsaved = True if hasattr(self, 'unsaved_changes') and self.unsaved_changes else False
        if has_unsaved:
            reply = QMessageBox.question(
                self, "Save Changes?", 
                "You have unsaved changes.\nSave them before closing?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No | QMessageBox.StandardButton.Cancel
            )
            if reply == QMessageBox.StandardButton.Yes:
                self.save_data()
                self.accept()
            elif reply == QMessageBox.StandardButton.No:
                self.reject()
            else:
                return # Cancel, remain on screen
        else:
            self.reject()
    def set_cell_quantity(self, r, c, q): pass
    def move_to_next_cell(self): pass
    def repaint_cells(self): pass
