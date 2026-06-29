from PyQt6.QtWidgets import (
    QWidget, QDialog, QApplication, QVBoxLayout, QHBoxLayout, QLabel, 
    QDoubleSpinBox, QLineEdit, QMessageBox, QSpinBox, QFormLayout
)
from PyQt6.QtCore import Qt, QEvent, QTimer
from PyQt6.QtGui import QCursor, QKeySequence, QShortcut
from decimal import Decimal

class RecordVouchersDialog(QDialog):
    def __init__(self, customer_id, calendar_data, api_client, parent=None):
        super().__init__(parent)
        self.api = api_client
        self.customer_id = customer_id
        self.calendar_data = calendar_data

        self.setWindowTitle("Record Vouchers")
        self.setFixedSize(480, 360)
        self.setModal(True)
        self.setStyleSheet(
            "background:#1a1a1a;"
            "color:#ffffff;"
            "font-family:'Courier New',monospace;"
        )
        self.setup_ui()
        self.install_shortcuts_filter()
        self.register_shortcuts()
        QTimer.singleShot(50, lambda: self.first_week_field.setFocus())

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

        sc("F4",     self.save_voucher)
        sc("Return", self.save_voucher)
        sc("Enter",  self.save_voucher)
        sc("Escape", self.reject)
        sc("Tab",    self.focus_next_field)

    def handle_key_press(self, event):
        key = event.key()

        if key == Qt.Key.Key_F4:
            self.save_voucher()
            return True

        elif key in (Qt.Key.Key_Return, Qt.Key.Key_Enter):
            focused = QApplication.focusWidget()
            if focused == self.description_field:
                return False
            self.save_voucher()
            return True

        elif key == Qt.Key.Key_Escape:
            self.reject()
            return True

        elif key == Qt.Key.Key_Tab:
            self.focus_next_field()
            return True

        return False

    def get_next_saturday(self):
        from datetime import date, timedelta
        today = date.today()
        days = (5 - today.weekday()) % 7
        if days == 0:
            days = 7
        sat = today + timedelta(days=days)
        return (sat.strftime('%d/%m/%Y'), sat.strftime('%Y-%m-%d'))

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(10)
        layout.setContentsMargins(20,14,20,8)

        inp = (
            "background:#2a2a2a; color:#ffffff;"
            "border:1px solid #20b2aa;"
            "font-family:'Courier New',monospace;"
            "font-size:13px; padding:4px 8px;"
        )

        title = QLabel("Record Vouchers")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title.setStyleSheet(
            "color:#20b2aa; font-size:17px;"
            "font-weight:bold;"
            "border-bottom:1px solid #20b2aa;"
            "padding-bottom:8px;"
        )
        layout.addWidget(title)

        cust = self.calendar_data.get('customer', {})
        info = QLabel(
            f"Account: {cust.get('ac_number','')}  "
            f"{cust.get('name','')}"
        )
        info.setStyleSheet("color:#888888; font-size:12px;")
        layout.addWidget(info)

        form = QFormLayout()
        form.setSpacing(12)

        next_display, _ = self.get_next_saturday()

        self.first_week_field = QLineEdit()
        self.first_week_field.setText(next_display)
        self.first_week_field.setPlaceholderText("DD/MM/YYYY — must be a Saturday")
        self.first_week_field.setStyleSheet(inp)
        self.first_week_field.setFixedWidth(180)

        self.description_field = QLineEdit()
        self.description_field.setPlaceholderText("e.g. Holiday vouchers")
        self.description_field.setStyleSheet(inp)

        self.weeks_field = QSpinBox()
        self.weeks_field.setMinimum(1)
        self.weeks_field.setMaximum(52)
        self.weeks_field.setValue(1)
        self.weeks_field.setFixedWidth(100)
        self.weeks_field.setStyleSheet(inp)
        self.weeks_field.setButtonSymbols(QSpinBox.ButtonSymbols.NoButtons)
        self.weeks_field.valueChanged.connect(self.recalculate)

        self.credit_field = QDoubleSpinBox()
        self.credit_field.setDecimals(2)
        self.credit_field.setMinimum(0.01)
        self.credit_field.setMaximum(999.99)
        self.credit_field.setValue(0.00)
        self.credit_field.setPrefix("£ ")
        self.credit_field.setFixedWidth(140)
        self.credit_field.setStyleSheet(inp)
        self.credit_field.setButtonSymbols(QDoubleSpinBox.ButtonSymbols.NoButtons)
        self.credit_field.valueChanged.connect(self.recalculate)

        self.total_label = QLabel("Total credit:   £  0.00")
        self.total_label.setStyleSheet(
            "color:#20b2aa; font-size:14px;"
            "font-weight:bold; padding:4px 0;"
        )

        lbl_style = (
            "color:#888888;"
            "font-family:'Courier New',monospace;"
            "font-size:13px;"
        )
        
        def _lbl(text, style):
            l = QLabel(text)
            l.setStyleSheet(style)
            return l

        form.addRow(_lbl("First week:", lbl_style), self.first_week_field)
        form.addRow(_lbl("Description:", lbl_style), self.description_field)
        form.addRow(_lbl("Number of weeks:", lbl_style), self.weeks_field)
        form.addRow(_lbl("Credit per week:", lbl_style), self.credit_field)
        form.addRow(QLabel(""), self.total_label)

        layout.addLayout(form)
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
        esc.mousePressEvent = lambda e: self.reject()

        f4 = QLabel("F4  Save Voucher")
        f4.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        f4.setStyleSheet(
            "color:#20b2aa; font-weight:bold;"
            "font-family:'Courier New',monospace;"
            "font-size:12px; cursor:pointer;"
        )
        f4.mousePressEvent = lambda e: self.save_voucher()

        bar_layout.addWidget(esc)
        bar_layout.addStretch()
        bar_layout.addWidget(f4)
        layout.addWidget(bar)

        self.tab_order = [
            self.first_week_field,
            self.description_field,
            self.weeks_field,
            self.credit_field,
        ]

    def focus_next_field(self):
        focused = QApplication.focusWidget()
        try:
            idx = self.tab_order.index(focused)
            nxt = (idx+1) % len(self.tab_order)
        except ValueError:
            nxt = 0
        self.tab_order[nxt].setFocus()

    def recalculate(self):
        weeks  = self.weeks_field.value()
        credit = Decimal(str(self.credit_field.value()))
        total  = credit * weeks
        self.total_label.setText(f"Total credit:   £  {total:.2f}")

    def validate(self):
        from datetime import datetime
        week_text = self.first_week_field.text()
        try:
            dt = datetime.strptime(week_text.strip(), '%d/%m/%Y')
        except ValueError:
            QMessageBox.warning(self,
                "Invalid Date",
                "Enter date as DD/MM/YYYY\n"
                "e.g. 20/06/2026"
            )
            self.first_week_field.setFocus()
            self.first_week_field.selectAll()
            return False, None

        if dt.weekday() != 5:
            day_name = dt.strftime('%A')
            QMessageBox.warning(self,
                "Must Be a Saturday",
                f"{week_text} is a {day_name}.\n"
                f"First week must be a Saturday\n"
                f"(the week-ending collection date)."
            )
            self.first_week_field.setFocus()
            self.first_week_field.selectAll()
            return False, None

        if self.credit_field.value() <= 0:
            QMessageBox.warning(self,
                "Invalid Amount",
                "Credit per week must be > £0.00"
            )
            self.credit_field.setFocus()
            return False, None

        return True, dt.strftime('%Y-%m-%d')

    def save_voucher(self):
        valid, iso = self.validate()
        if not valid:
            return

        weeks  = self.weeks_field.value()
        credit = Decimal(str(self.credit_field.value()))
        desc   = self.description_field.text()
        total  = credit * weeks

        result = self.api.post(
            "/vouchers/",
            data={
                'customer_id':     self.customer_id,
                'first_week_end':  iso,
                'description':     desc,
                'number_of_weeks': weeks,
                'credit_per_week': float(credit),
            }
        )

        if result.get('success'):
            QMessageBox.information(self,
                "Voucher Saved",
                f"Voucher recorded.\n"
                f"Total credit: £{total:.2f}\n"
                f"Over {weeks} week(s) from {self.first_week_field.text()}"
            )
            self.accept()
        else:
            QMessageBox.warning(self,
                "Save Failed",
                result.get('error', 'Could not save voucher.')
            )
