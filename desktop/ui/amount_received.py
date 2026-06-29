from PyQt6.QtWidgets import (
    QWidget, QDialog, QApplication, QVBoxLayout, QHBoxLayout, QLabel, 
    QDoubleSpinBox, QDateEdit, QComboBox, QLineEdit, QFrame, QMessageBox, QMenu
)
from PyQt6.QtCore import Qt, QEvent, QTimer, QDate
from PyQt6.QtGui import QCursor, QKeySequence, QShortcut
from decimal import Decimal

class AmountReceivedDialog(QDialog):
    def __init__(self, customer_id, week_data, api_client, parent=None):
        super().__init__(parent)
        self.api = api_client
        self.customer_id = customer_id
        self.week_data = week_data
        try:
            self.amount_due = Decimal(str(week_data.get('amount', 0)))
        except Exception:
            self.amount_due = Decimal('0.00')
        self.week_end_iso = week_data.get('date_iso', '')

        self.setWindowTitle("Amount Received")
        self.setFixedSize(420, 320)
        self.setModal(True)
        self.setStyleSheet(
            "background:#1a1a1a;"
            "color:#ffffff;"
            "font-family:'Courier New',monospace;"
        )
        self.setup_ui()
        # Install AFTER setup_ui
        self.install_shortcuts_filter()
        self.register_shortcuts()
        # Set focus to amount field
        QTimer.singleShot(50, lambda: self.amount_field.setFocus())
        QTimer.singleShot(50, lambda: self.amount_field.selectAll())

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

        sc("F4",     self.confirm_payment)
        sc("Return", self.confirm_payment)
        sc("Enter",  self.confirm_payment)
        sc("Escape", self.cancel_action)
        sc("Tab",    self.focus_next_field)

    def handle_key_press(self, event):
        key = event.key()

        if key == Qt.Key.Key_F4:
            self.confirm_payment()
            return True

        if key in (Qt.Key.Key_Return, Qt.Key.Key_Enter):
            focused = QApplication.focusWidget()
            if focused == self.notes_field:
                return False  # let Enter work in field
            self.confirm_payment()
            return True

        elif key == Qt.Key.Key_Escape:
            self.cancel_action()
            return True

        elif key == Qt.Key.Key_Tab:
            self.focus_next_field()
            return True

        return False

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(8)
        layout.setContentsMargins(16,12,16,8)

        inp_style = (
            "background:#2a2a2a;"
            "color:#ffffff;"
            "border:1px solid #20b2aa;"
            "font-family:'Courier New',monospace;"
            "font-size:13px;"
            "padding:4px 8px;"
        )

        title = QLabel("Amount Received")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title.setStyleSheet(
            "color:#20b2aa; font-size:17px;"
            "font-weight:bold;"
            "border-bottom:1px solid #20b2aa;"
            "padding-bottom:8px;"
        )
        layout.addWidget(title)

        try:
            from datetime import datetime
            dt = datetime.strptime(self.week_end_iso, '%Y-%m-%d')
            week_str = dt.strftime('Sat %d/%m/%Y')
        except Exception:
            week_str = self.week_end_iso

        ac = self.week_data.get('ac_number','')
        name = self.week_data.get('customer_name','')

        info_lbl = QLabel(
            f"Week ending:   {week_str}\n"
            f"Account:       {ac}  {name}"
        )
        info_lbl.setStyleSheet(
            "color:#888888; font-size:12px;"
            "padding:4px 0;"
        )
        layout.addWidget(info_lbl)

        sep = QFrame()
        sep.setFrameShape(QFrame.Shape.HLine)
        sep.setStyleSheet("color:#20b2aa;")
        layout.addWidget(sep)

        amt_row = QHBoxLayout()
        amt_lbl = QLabel("Amount received:   £  +")
        amt_lbl.setStyleSheet(
            "color:#ffffff; font-size:15px;"
            "font-weight:bold;"
        )
        self.amount_field = QDoubleSpinBox()
        self.amount_field.setDecimals(2)
        self.amount_field.setMinimum(0.01)
        self.amount_field.setMaximum(9999.99)
        self.amount_field.setValue(float(self.amount_due))
        self.amount_field.setFixedWidth(120)
        self.amount_field.setButtonSymbols(QDoubleSpinBox.ButtonSymbols.NoButtons)
        self.amount_field.setStyleSheet(
            "background:#2a2a2a; color:#20b2aa;"
            "border:1px solid #20b2aa;"
            "font-family:'Courier New',monospace;"
            "font-size:15px; font-weight:bold;"
            "padding:4px 8px;"
        )
        self.amount_field.setAlignment(Qt.AlignmentFlag.AlignRight)
        amt_row.addWidget(amt_lbl)
        amt_row.addWidget(self.amount_field)
        amt_row.addStretch()
        layout.addLayout(amt_row)

        ref_lbl = QLabel(f"Weekly charge:   £  {self.amount_due:.2f}")
        ref_lbl.setStyleSheet("color:#888888; font-size:12px;")
        layout.addWidget(ref_lbl)

        date_row = QHBoxLayout()
        date_lbl = QLabel("Date:              ")
        date_lbl.setStyleSheet("color:#ffffff; font-size:13px;")
        self.date_field = QDateEdit()
        self.date_field.setDate(QDate.currentDate())
        self.date_field.setDisplayFormat("dd/MM/yyyy")
        self.date_field.setFixedWidth(160)
        self.date_field.setStyleSheet(inp_style)
        self.date_field.setButtonSymbols(QDateEdit.ButtonSymbols.NoButtons)
        date_row.addWidget(date_lbl)
        date_row.addWidget(self.date_field)
        date_row.addStretch()
        layout.addLayout(date_row)

        meth_row = QHBoxLayout()
        meth_lbl = QLabel("Method:            ")
        meth_lbl.setStyleSheet("color:#ffffff; font-size:13px;")
        self.method_combo = QComboBox()
        self.method_combo.addItems([
            'Cash','Card',
            'Bank Transfer','Direct Debit',
            'Voucher'
        ])
        self.method_combo.setFixedWidth(200)
        self.method_combo.setStyleSheet(inp_style)
        meth_row.addWidget(meth_lbl)
        meth_row.addWidget(self.method_combo)
        meth_row.addStretch()
        layout.addLayout(meth_row)

        notes_row = QHBoxLayout()
        notes_lbl = QLabel("Notes:             ")
        notes_lbl.setStyleSheet("color:#ffffff; font-size:13px;")
        self.notes_field = QLineEdit()
        self.notes_field.setPlaceholderText("Optional")
        self.notes_field.setStyleSheet(inp_style)
        notes_row.addWidget(notes_lbl)
        notes_row.addWidget(self.notes_field)
        layout.addLayout(notes_row)

        layout.addStretch()

        bar = QWidget()
        bar.setFixedHeight(30)
        bar.setStyleSheet(
            "background:#111111;"
            "border-top:1px solid #20b2aa;"
        )
        bar_layout = QHBoxLayout(bar)
        bar_layout.setContentsMargins(8,4,8,4)

        esc = QLabel("Esc  Cancel")
        esc.setStyleSheet(
            "color:#888888;"
            "font-family:'Courier New',monospace;"
            "font-size:12px; cursor:pointer;"
        )
        esc.mousePressEvent = lambda e: self.cancel_action()

        ent = QLabel("ENTER  Confirm")
        ent.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        ent.setStyleSheet(
            "color:#20b2aa; font-weight:bold;"
            "font-family:'Courier New',monospace;"
            "font-size:12px; cursor:pointer;"
        )
        ent.mousePressEvent = lambda e: self.confirm_payment()

        bar_layout.addWidget(esc)
        bar_layout.addStretch()
        bar_layout.addWidget(ent)
        layout.addWidget(bar)

        self.tab_order = [
            self.amount_field,
            self.date_field,
            self.method_combo,
            self.notes_field,
        ]

    def focus_next_field(self):
        focused = QApplication.focusWidget()
        try:
            idx = self.tab_order.index(focused)
            nxt = (idx + 1) % len(self.tab_order)
        except ValueError:
            nxt = 0
        self.tab_order[nxt].setFocus()

    def cancel_action(self):
        self.reject()

    def confirm_payment(self):
        amount = Decimal(str(self.amount_field.value()))

        if amount <= 0:
            self.amount_field.setStyleSheet(
                self.amount_field.styleSheet() +
                "border:2px solid #f44336;"
            )
            QMessageBox.warning(self,
                "Invalid Amount",
                "Amount must be greater than £0.00"
            )
            self.amount_field.setFocus()
            return

        date_str = self.date_field.date().toString("yyyy-MM-dd")
        method_map = {
            'Cash':          'cash',
            'Card':          'card',
            'Bank Transfer': 'bank transfer',
            'Direct Debit':  'direct debit',
            'Voucher':       'voucher',
        }
        method = method_map.get(self.method_combo.currentText(), 'cash')
        notes = self.notes_field.text()

        result = self.api.patch(
            "/weekly-charges/by-week/",
            data={
                'customer_id':    self.customer_id,
                'week_end_date':  self.week_end_iso,
                'paid_amount':    float(amount),
                'paid_date':      date_str,
                'method':         method,
                'notes':          notes,
            }
        )

        if result.get('success'):
            new_bal = result['data'].get('new_balance', 0)
            QMessageBox.information(self,
                "Payment Recorded",
                f"£{amount:.2f} recorded.\n"
                f"New balance: £{float(new_bal):.2f}"
            )
            self.accept()
        else:
            QMessageBox.warning(self,
                "Failed",
                result.get('error', 'Could not save payment.')
            )
