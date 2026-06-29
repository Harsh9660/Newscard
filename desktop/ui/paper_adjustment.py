from PyQt6.QtWidgets import (
    QWidget, QDialog, QApplication, QVBoxLayout, QHBoxLayout, QLabel, 
    QDoubleSpinBox, QLineEdit, QMessageBox, QSpinBox, QTableWidget, 
    QFrame, QGridLayout
)
from PyQt6.QtCore import Qt, QEvent, QTimer
from PyQt6.QtGui import QCursor, QKeySequence, QShortcut
from datetime import datetime
from decimal import Decimal

class PaperAdjustmentScreen(QDialog):
    COLORS = {
        'bg':        '#1a1a1a',
        'teal':      '#20b2aa',
        'border':    '#20b2aa',
        'white':     '#ffffff',
        'grey':      '#888888',
        'input':     '#2a2a2a',
        'active':    '#20b2aa',
        'header_bg': '#0d0d0d',
        'bottom_bg': '#111111',
        'info_bg':   '#222222',
        'green':     '#1a4a1a',
        'red':       '#4a1a1a',
    }

    def __init__(self, customer_id, week_end_iso, order_id, api_client, parent=None):
        super().__init__(parent)
        self.api = api_client
        self.customer_id = customer_id
        self.week_end_iso = week_end_iso
        self.order_id = order_id
        self.weekly_data = {}
        self.order_data = {}
        self.input_blocks = []
        self.tab_order = []

        self.setWindowTitle("Paper & Adjustment")
        self.setFixedSize(920, 620)
        self.setStyleSheet(f"background:{self.COLORS['bg']};")
        self.setup_ui()
        self.load_data()
        
        self.install_shortcuts_filter()
        self.register_shortcuts()
        QTimer.singleShot(50, lambda: self.tab_order[0].setFocus() if self.tab_order else None)

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

        sc("F4",     self.save_adjustments)
        sc("Escape", self.on_close)
        sc("Tab",    lambda: self.focus_next_field(False))
        sc("Shift+Tab", lambda: self.focus_next_field(True))

    def handle_key_press(self, event):
        key = event.key()
        mods = event.modifiers()
        Shift = Qt.KeyboardModifier.ShiftModifier

        if key == Qt.Key.Key_F4:
            self.save_adjustments()
            return True

        elif key == Qt.Key.Key_Escape:
            self.on_close()
            return True

        elif key == Qt.Key.Key_Backtab or (key == Qt.Key.Key_Tab and (mods & Shift)):
            self.focus_next_field(True)
            return True

        elif key == Qt.Key.Key_Tab:
            self.focus_next_field(False)
            return True

        return False

    def focus_next_field(self, reverse=False):
        if not self.tab_order: return
        focused = QApplication.focusWidget()
        try:
            idx = self.tab_order.index(focused)
            if reverse:
                nxt = (idx - 1) % len(self.tab_order)
            else:
                nxt = (idx + 1) % len(self.tab_order)
        except ValueError:
            nxt = len(self.tab_order)-1 if reverse else 0
        self.tab_order[nxt].setFocus()

    def setup_ui(self):
        main = QVBoxLayout(self)
        main.setSpacing(0)
        main.setContentsMargins(8, 4, 8, 0)

        # TITLE BAR
        title_bar = QHBoxLayout()
        spacer = QWidget()
        spacer.setFixedWidth(150)

        title = QLabel("Paper & Adjustment")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title.setStyleSheet(f"""
          color: {self.COLORS['teal']};
          font-family: 'Courier New', monospace;
          font-size: 18px; font-weight: bold;
          padding: 6px 0;
        """)

        self.clock_label = QLabel("00:00:00")
        self.clock_label.setFixedWidth(150)
        self.clock_label.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        self.clock_label.setStyleSheet(f"color:{self.COLORS['teal']};font-family:'Courier New',monospace;font-size:14px;")

        title_bar.addWidget(spacer)
        title_bar.addWidget(title, 1)
        title_bar.addWidget(self.clock_label)
        main.addLayout(title_bar)

        # MAIN CONTENT AREA
        content = QHBoxLayout()
        content.setSpacing(4)

        # LEFT PANEL
        self.paper_grid = QTableWidget()
        self.paper_grid.setColumnCount(9)
        self.paper_grid.setRowCount(8)
        self.paper_grid.setHorizontalHeaderLabels([
          'Paper & Adjustment', 'Sun','Mon','Tue','Wed', 'Thu','Fri','Sat','Price'
        ])
        self.paper_grid.setStyleSheet(f"background:{self.COLORS['bg']}; color:{self.COLORS['white']};")

        # RIGHT PANEL
        right_panel = QFrame()
        right_panel.setFixedWidth(280)
        right_panel.setStyleSheet(f"background:{self.COLORS['info_bg']}; border:1px solid {self.COLORS['teal']};")
        right_layout = QVBoxLayout(right_panel)
        right_layout.setSpacing(6)
        right_layout.setContentsMargins(10,8,10,8)

        adj_title = QLabel("Adjustments")
        adj_title.setStyleSheet(f"color:{self.COLORS['teal']};font-family:'Courier New',monospace;font-size:14px; font-weight:bold;border-bottom:1px solid {self.COLORS['teal']};padding-bottom:4px;")
        right_layout.addWidget(adj_title)

        try:
          dt = datetime.strptime(self.week_end_iso, '%Y-%m-%d')
          wk = dt.strftime('Week ending: %d/%m/%Y')
        except:
          wk = f"Week: {self.week_end_iso}"
        
        week_lbl = QLabel(wk)
        week_lbl.setStyleSheet(f"color:{self.COLORS['grey']};font-family:'Courier New',monospace;font-size:11px;")
        right_layout.addWidget(week_lbl)

        # SLOTS
        def add_slot(title, type_val, has_qty=False, has_price=False, has_amount=False, has_desc=False):
            lbl = QLabel(title)
            lbl.setStyleSheet(f"color:{self.COLORS['teal']};font-family:'Courier New',monospace;font-size:12px;")
            right_layout.addWidget(lbl)
            block = {'label': title, 'type': type_val}
            
            row = QHBoxLayout()
            if has_qty:
                qty = QSpinBox()
                qty.setMinimum(0)
                qty.setStyleSheet(f"background:{self.COLORS['input']}; color:{self.COLORS['white']};")
                qty.valueChanged.connect(self.on_adjustment_changed)
                qty.setButtonSymbols(QSpinBox.ButtonSymbols.NoButtons)
                block['qty'] = qty
                row.addWidget(qty)
                self.tab_order.append(qty)
            if has_price:
                price = QDoubleSpinBox()
                price.setMinimum(0.0)
                price.setStyleSheet(f"background:{self.COLORS['input']}; color:{self.COLORS['white']};")
                price.valueChanged.connect(self.on_adjustment_changed)
                price.setButtonSymbols(QDoubleSpinBox.ButtonSymbols.NoButtons)
                block['price'] = price
                row.addWidget(price)
                self.tab_order.append(price)
            if has_amount:
                amt = QDoubleSpinBox()
                amt.setMinimum(0.0)
                amt.setStyleSheet(f"background:{self.COLORS['input']}; color:{self.COLORS['white']};")
                amt.valueChanged.connect(self.on_adjustment_changed)
                amt.setButtonSymbols(QDoubleSpinBox.ButtonSymbols.NoButtons)
                block['amount'] = amt
                row.addWidget(amt)
                self.tab_order.append(amt)
            right_layout.addLayout(row)
            
            if has_desc:
                desc = QLineEdit()
                desc.setPlaceholderText("Description")
                desc.setStyleSheet(f"background:{self.COLORS['input']}; color:{self.COLORS['white']};")
                block['desc'] = desc
                right_layout.addWidget(desc)
                self.tab_order.append(desc)
                
            self.input_blocks.append(block)

        add_slot("Extra copies", "extra", has_qty=True, has_price=True)
        add_slot("Missed delivery credit", "missed", has_qty=True, has_price=True)
        add_slot("Manual charge", "charge", has_amount=True, has_desc=True)
        add_slot("Manual credit", "credit", has_amount=True, has_desc=True)
        
        right_layout.addStretch()
        
        net_label = QLabel("Net adjustment:")
        net_label.setStyleSheet(f"color:{self.COLORS['white']};font-family:'Courier New',monospace;font-size:12px; font-weight:bold;")
        self.net_value = QLabel("£ 0.00")
        self.net_value.setAlignment(Qt.AlignmentFlag.AlignRight)
        self.net_value.setStyleSheet(f"color:{self.COLORS['teal']};font-family:'Courier New',monospace;font-size:14px; font-weight:bold;")
        right_layout.addWidget(net_label)
        right_layout.addWidget(self.net_value)

        content.addWidget(self.paper_grid, 1)
        content.addWidget(right_panel)
        main.addLayout(content, 1)

        # BOTTOM TOTALS
        bottom = QHBoxLayout()
        left_info = QFrame()
        right_fin = QFrame()
        right_fin.setFixedWidth(280)
        right_fin.setStyleSheet(f"background:{self.COLORS['info_bg']}; border:1px solid {self.COLORS['teal']};")
        fin_layout = QGridLayout(right_fin)

        self.total_display = QLabel("0.00")
        self.received_display = QLabel("0.00")
        self.refunded_display = QLabel("0.00")
        self.outstanding_box = QLabel("0.00")
        
        fin_layout.addWidget(QLabel("Total:"), 0, 0)
        fin_layout.addWidget(self.total_display, 0, 1)
        fin_layout.addWidget(QLabel("Received: -"), 1, 0)
        fin_layout.addWidget(self.received_display, 1, 1)
        fin_layout.addWidget(QLabel("Refunded: +"), 2, 0)
        fin_layout.addWidget(self.refunded_display, 2, 1)
        fin_layout.addWidget(QLabel("Outstanding: £"), 4, 0)
        fin_layout.addWidget(self.outstanding_box, 4, 1)

        for i in range(5):
            item = fin_layout.itemAtPosition(i, 0)
            if item and item.widget():
                item.widget().setStyleSheet(f"color:{self.COLORS['white']};")
            item = fin_layout.itemAtPosition(i, 1)
            if item and item.widget():
                item.widget().setStyleSheet(f"color:{self.COLORS['white']};")

        bottom.addWidget(left_info, 1)
        bottom.addWidget(right_fin)
        main.addLayout(bottom)

        # TERMINAL BOTTOM BAR
        term_bar = QWidget()
        term_bar.setFixedHeight(30)
        term_bar.setStyleSheet(f"background:{self.COLORS['bottom_bg']};border-top:1px solid {self.COLORS['teal']};")
        bar = QHBoxLayout(term_bar)
        bar.setContentsMargins(8, 0, 8, 0)

        esc = QLabel("Esc  Close")
        esc.setStyleSheet(f"color:{self.COLORS['grey']};font-family:'Courier New',monospace;font-size:12px; cursor:pointer;")
        esc.mousePressEvent = lambda e: self.on_close()

        f4 = QLabel("F4  Save")
        f4.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        f4.setStyleSheet(f"color:{self.COLORS['teal']};font-weight:bold;font-family:'Courier New',monospace;font-size:12px; cursor:pointer;")
        f4.mousePressEvent = lambda e: self.save_adjustments()

        bar.addWidget(esc)
        bar.addStretch()
        bar.addWidget(f4)
        main.addWidget(term_bar)

    def load_data(self):
        pass

    def on_adjustment_changed(self):
        charges = Decimal('0.00')
        credits = Decimal('0.00')

        for block in self.input_blocks:
            block_type = block.get('type')
            qty   = block.get('qty')
            price = block.get('price')
            amount = block.get('amount')

            if block_type in ['extra', 'charge']:
                if qty and price:
                    val = Decimal(str(qty.value())) * Decimal(str(price.value()))
                    charges += val
                elif amount:
                    charges += Decimal(str(amount.value()))
            elif block_type in ['credit', 'missed', 'refund']:
                if qty and price:
                    val = Decimal(str(qty.value())) * Decimal(str(price.value()))
                    credits += val
                elif amount:
                    credits += Decimal(str(amount.value()))

        net = charges - credits
        base_total = self.weekly_data.get('total', Decimal('0.00'))
        received   = self.weekly_data.get('received', Decimal('0.00'))
        refunded   = self.weekly_data.get('refunded', Decimal('0.00'))

        new_total       = base_total + net
        new_outstanding = (new_total - received + refunded)

        self.total_display.setText(f"{new_total:.2f}")
        self.net_value.setText(f"£ {net:+.2f}")
        self.outstanding_display(new_outstanding)

    def outstanding_display(self, value):
        text = f"{abs(value):.2f}"
        if value == 0:
            bg = self.COLORS['green']
        elif value > 0:
            bg = self.COLORS['red']
        else:
            bg = '#1a1a4a'
        self.outstanding_box.setText(text)
        self.outstanding_box.setStyleSheet(
            f"background:{bg}; color:#fff; font-family:'Courier New',monospace; font-size:14px; font-weight:bold; padding:2px 8px; border-radius:3px;")

    def save_adjustments(self):
        adjustments = []
        for block in self.input_blocks:
            qty    = block.get('qty')
            price  = block.get('price')
            amount = block.get('amount')
            desc   = block.get('desc')

            value = 0
            if qty and price:
                value = qty.value() * price.value()
            elif amount:
                value = amount.value()

            if value > 0:
                adjustments.append({
                    'customer_id':    self.customer_id,
                    'publication_id': self.order_data.get('publication_id'),
                    'week_end_date':  self.week_end_iso,
                    'day':            'all',
                    'adjustment_type':block['type'],
                    'quantity':       qty.value() if qty else 1,
                    'unit_price':     price.value() if price else value,
                    'description':    desc.text() if desc else block['label'],
                })

        if not adjustments:
            QMessageBox.information(self, "No Changes", "No adjustment amounts entered.")
            return

        for adj in adjustments:
            result = self.api.post("/adjustments/", data=adj)
            if not result.get('success'):
                QMessageBox.warning(self, "Save Failed", f"Could not save adjustment:\n{result.get('error','Unknown')}")
                return

        QMessageBox.information(self, "Adjustments Saved", f"{len(adjustments)} adjustment(s) saved successfully.")
        self.accept()

    def on_close(self):
        has_values = any(
            (b.get('qty') and b['qty'].value() > 0) or
            (b.get('amount') and b['amount'].value() > 0)
            for b in self.input_blocks
        )
        if has_values:
            reply = QMessageBox.question(self, "Unsaved Adjustments", "You have unsaved adjustments.\nClose without saving?", QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
            if reply != QMessageBox.StandardButton.Yes:
                return
        self.reject()
