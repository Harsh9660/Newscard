from PyQt6.QtWidgets import (
    QWidget, QDialog, QApplication,
    QMessageBox, QMenu
)
from PyQt6.QtCore import Qt, QEvent, QTimer
from PyQt6.QtGui import QCursor, QKeySequence, QShortcut
from decimal import Decimal
from desktop.ui.record_vouchers import RecordVouchersDialog
from desktop.ui.amount_received import AmountReceivedDialog

class PreviewDialog(QDialog):
    def __init__(self, html, title, parent=None):
        super().__init__(parent)
        self.setWindowTitle(title)

class PaymentHistoryDialog(QDialog):
    def __init__(self, data, customer, api, parent=None):
        super().__init__(parent)

class PaymentCalendar(QDialog):
    def __init__(self, customer_id, api, parent=None, year=2026):
        super().__init__(parent)
        self.api = api
        self.customer_id = customer_id
        self.year = year
        self.selected_cell = None
        self.toggled_weeks = set()
        self.calendar_data = {}
        self.MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        self.cal_grid = None
        
        self.setWindowTitle("Payment Calendar")
        self.setFixedSize(1100, 680)
        self.setStyleSheet("background:#1a1a1a;")
        self.setup_ui()
        self.load_data()
        self.start_clock()
        # MUST be called AFTER setup_ui
        self.install_shortcuts_filter()
        self.register_shortcuts()

    def start_clock(self):
        pass

    def setup_ui(self):
        # Dummy method to avoid crashing
        from PyQt6.QtWidgets import QLabel, QTableWidget
        self.cal_grid = QTableWidget()
        
        self.total_label = QLabel("Selected Total: £0.00")
        self.total_label.setStyleSheet("color:#20b2aa; font-weight:bold;")

    def load_data(self):
        pass

    def install_shortcuts_filter(self):
        self.installEventFilter(self)
        for widget in self.findChildren(QWidget):
            widget.installEventFilter(self)

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

        sc("F1",           self.open_help)
        sc("F2",           self.open_help)
        sc("F3",           self.on_f7_pressed)
        sc("F7",           self.on_f7_pressed)
        sc("F9",           self.show_options)
        sc("Escape",       self.close)
        sc("PgUp",         lambda: self.change_year(-1))
        sc("PgDown",       lambda: self.change_year(1))
        sc("Space",        self.toggle_week_selection)
        sc("Return",       self.on_f7_pressed)
        sc("Enter",        self.on_f7_pressed)
        sc("Ctrl+Shift+X", self.export_pdf)
        sc("Ctrl+Shift+P", self.print_calendar)

    def handle_key_press(self, event):
        key  = event.key()
        mods = event.modifiers()
        Ctrl  = Qt.KeyboardModifier.ControlModifier
        Shift = Qt.KeyboardModifier.ShiftModifier

        if key in (Qt.Key.Key_F1, Qt.Key.Key_F2):
            self.open_help()
            return True
        elif key in (Qt.Key.Key_F3, Qt.Key.Key_F7):
            self.on_f7_pressed()
            return True
        elif key == Qt.Key.Key_F9:
            self.show_options()
            return True
        elif key == Qt.Key.Key_Escape:
            self.close()
            return True
        elif key == Qt.Key.Key_PageUp:
            self.change_year(-1)
            return True
        elif key == Qt.Key.Key_PageDown:
            self.change_year(1)
            return True
        elif key == Qt.Key.Key_Space:
            self.toggle_week_selection()
            return True
        elif key in (Qt.Key.Key_Return, Qt.Key.Key_Enter):
            self.on_f7_pressed()
            return True
        elif key == Qt.Key.Key_Up:
            self.move_selection(-1, 0)
            return True
        elif key == Qt.Key.Key_Down:
            self.move_selection(1, 0)
            return True
        elif key == Qt.Key.Key_Left:
            self.move_selection(0, -1)
            return True
        elif key == Qt.Key.Key_Right:
            self.move_selection(0, 1)
            return True
        elif (mods == (Ctrl | Shift) and key == Qt.Key.Key_X):
            self.export_pdf()
            return True
        elif (mods == (Ctrl | Shift) and key == Qt.Key.Key_P):
            self.print_calendar()
            return True
        return False

    def move_selection(self, dr, dc):
        if not self.selected_cell:
            self.on_cal_cell_click(0, 0)
            return
        r, c = self.selected_cell
        nr = max(0, min(5, r + dr))
        nc = max(0, min(11, c + dc))
        self.on_cal_cell_click(nr, nc)
        self.cal_grid.setFocus()

    def toggle_week_selection(self):
        if not self.selected_cell: return
        r, c = self.selected_cell
        if (r, c) in self.toggled_weeks:
            self.toggled_weeks.remove((r, c))
        else:
            self.toggled_weeks.add((r, c))
        self.highlight_selected(r, c)
        self.update_total_label()

    def update_total_label(self):
        total = Decimal('0.00')
        cells = self.toggled_weeks if self.toggled_weeks else {self.selected_cell}
        for (r, c) in cells:
            if not self.cal_grid: continue
            w = self.cal_grid.cellWidget(r, c)
            if not w: continue
            wd = w.property('week_data')
            if wd:
                try:
                    total += Decimal(str(wd.get('amount', 0)))
                except:
                    pass
        if hasattr(self, 'total_label'):
            self.total_label.setText(f"Selected Total: £{total:.2f}")

    def on_f7_pressed(self):
        if not self.selected_cell and not self.toggled_weeks:
            QMessageBox.information(self, "Info", "No payment weeks selected.")
            return

        cells_to_process = self.toggled_weeks if self.toggled_weeks else {self.selected_cell}
        
        total_amount = Decimal('0.00')
        latest_date = ""
        combined_week_data = {}
        is_holiday = False
        already_paid = False
        
        for (row, col) in cells_to_process:
            cell_widget = self.cal_grid.cellWidget(row, col)
            if not cell_widget: continue
            week_data = cell_widget.property('week_data')
            if not week_data: continue
            
            if week_data.get('is_holiday', False):
                is_holiday = True
            if week_data.get('paid', False):
                already_paid = True
                
            try:
                amt = Decimal(str(week_data.get('amount', 0)))
                total_amount += amt
            except:
                pass
                
            combined_week_data = week_data # Keep reference to the last week for other metadata
            date_iso = week_data.get('date_iso', '')
            if date_iso > latest_date:
                latest_date = date_iso
                
        if not combined_week_data:
            QMessageBox.information(self, "Empty Cell", "No data in selected cells.")
            return
            
        if is_holiday:
            QMessageBox.information(self, "On Holiday", "Customer is on holiday for one or more selected weeks.\nNo payment required.")
            return

        if total_amount <= 0:
            QMessageBox.warning(self, "No Charge", "No charge found for selected weeks.\nCheck Weekly Account setup.")
            return

        if already_paid:
            reply = QMessageBox.question(self, "Already Paid", "One or more weeks are already paid.\n\nRecord additional payment?", QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
            if reply != QMessageBox.StandardButton.Yes:
                return

        customer = self.calendar_data.get('customer', {})
        combined_week_data['ac_number'] = customer.get('ac_number', '')
        combined_week_data['customer_name'] = customer.get('name', '')
        combined_week_data['amount'] = float(total_amount)
        if latest_date:
            combined_week_data['date_iso'] = latest_date

        from desktop.ui.amount_received import AmountReceivedDialog
        dlg = AmountReceivedDialog(self.customer_id, combined_week_data, self.api, self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            self.toggled_weeks.clear()
            self.load_data()

    def on_cal_cell_click(self, row, col):
        self.highlight_selected(row, col)
        self.selected_cell = (row, col)
        self.cal_grid.setFocus()

    def on_cal_cell_double_click(self, row, col):
        self.on_cal_cell_click(row, col)
        self.on_f7_pressed()

    def highlight_selected(self, row, col):
        if self.cal_grid:
            # Clear all current outlines first, then repaint toggled ones
            for r in range(self.cal_grid.rowCount()):
                for c in range(self.cal_grid.columnCount()):
                    w = self.cal_grid.cellWidget(r, c)
                    if w:
                        w.setStyleSheet(w.styleSheet().replace("border:2px solid #ffffff;", "").replace("background:#2a4a2a;", ""))
                        if (r, c) in self.toggled_weeks:
                            w.setStyleSheet(w.styleSheet() + "background:#2a4a2a;")

            # Apply white border to currently navigated cell
            nw = self.cal_grid.cellWidget(row, col)
            if nw:
                nw.setStyleSheet(nw.styleSheet() + "border:2px solid #ffffff;")

    def open_help(self):
        pass

    def show_options(self):
        menu = QMenu(self)
        menu.setStyleSheet("""
          QMenu {
            background: #222222;
            color: #ffffff;
            border: 1px solid #20b2aa;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            padding: 4px 0;
          }
          QMenu::item { padding: 7px 24px; }
          QMenu::item:selected { background: #20b2aa; }
          QMenu::separator { height: 1px; background: #20b2aa; margin: 3px 8px; }
        """)
        menu.addAction("  1.  Record vouchers", self.open_record_vouchers)
        menu.addSeparator()
        menu.addAction("  2.  Preview statement", self.preview_statement)
        menu.addAction("  3.  Print statement", self.print_statement)
        menu.addSeparator()
        menu.addAction("  4.  Preview bill", self.preview_bill)
        menu.addAction("  5.  Print bill", self.print_bill)
        menu.addSeparator()
        menu.addAction("  6.  Mark month as paid", self.mark_month_paid)
        menu.addAction("  7.  Export calendar PDF", self.export_pdf)
        menu.addAction("  8.  Print calendar", self.print_calendar)
        menu.addSeparator()
        menu.addAction("  9.  View payment history", self.view_history)
        menu.addAction("  10. Apply holiday hold", self.apply_holiday)
        menu.exec(QCursor.pos())

    def open_record_vouchers(self):
        from desktop.ui.record_vouchers import RecordVouchersDialog
        dlg = RecordVouchersDialog(self.customer_id, self.calendar_data, self.api, self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            self.load_data()

    def change_year(self, delta):
        self.year += delta
        if hasattr(self, 'year_label'):
            self.year_label.setText(str(self.year))
        self.load_data()

    def export_pdf(self):
        result = self.api.post("/reports/weekly-calendar/", data={'customer_id': self.customer_id, 'year': self.year})
        if result.get('success'):
            from desktop.modules.helpers import save_pdf_to_desktop, open_pdf
            cust = self.calendar_data.get('customer', {})
            path = save_pdf_to_desktop(result['data']['pdf_bytes'], f"calendar_{cust.get('name','cust')}_{self.year}")
            QMessageBox.information(self, "Exported", f"Saved to:\n{path}")
        else:
            QMessageBox.warning(self, "Error", result.get('error', 'Export failed.'))

    def print_calendar(self):
        self.export_pdf()

    def build_report_data(self, is_statement=True):
        # Fallback dummy data mapped to our new template variables.
        # In production, this would be mapped from self.api.post(...)
        import datetime
        now = datetime.datetime.now().strftime("%d/%m/%Y")
        cust = self.calendar_data.get('customer', {})
        
        data = {
            'business_name': "NEWSCARD DELIVERY",
            'business_address': "123 High Street, Townsville",
            'business_phone': "01234 567 890",
            'customer_name': cust.get('name', 'Unknown Customer'),
            'customer_address': "Customer Address Here",
            'account_number': cust.get('ac_number', self.customer_id),
            'due_date': "On Receipt"
        }
        
        if is_statement:
            data.update({
                'statement_date': now,
                'previous_balance': "0.00",
                'payments_received': "0.00",
                'voucher_credits': "0.00",
                'adjustments': "0.00",
                'current_balance': "15.00",
                'transactions_html': "<tr><td>20/06/2026</td><td>INV-1</td><td>Delivery</td><td>£15.00</td><td>£0.00</td><td>£15.00</td></tr>"
            })
        else:
            data.update({
                'bill_date': now,
                'subtotal': "15.00",
                'credits_applied': "0.00",
                'payments_received': "0.00",
                'amount_due': "15.00",
                'bill_items_html': "<tr><td>20/06/2026</td><td>Weekly Deliveries</td><td>£15.00</td></tr>"
            })
            
        return data

    def preview_statement(self):
        from desktop.ui.report_preview import PreviewDialog, render_template
        import os
        template_path = os.path.join(os.path.dirname(__file__), '..', 'templates', 'statement.html')
        data = self.build_report_data(is_statement=True)
        html = render_template(template_path, data)
        filename = f"Statement_{data['account_number']}_{data['statement_date'].replace('/', '')}.pdf"
        
        dlg = PreviewDialog(html, "Statement Preview", default_filename=filename, parent=self)
        dlg.exec()

    def print_statement(self):
        # Open preview anyway so user can verify and print from the dialog
        self.preview_statement()

    def preview_bill(self):
        from desktop.ui.report_preview import PreviewDialog, render_template
        import os
        template_path = os.path.join(os.path.dirname(__file__), '..', 'templates', 'bill.html')
        data = self.build_report_data(is_statement=False)
        html = render_template(template_path, data)
        filename = f"Bill_{data['account_number']}_{data['bill_date'].replace('/', '')}.pdf"
        
        dlg = PreviewDialog(html, "Bill Preview", default_filename=filename, parent=self)
        dlg.exec()

    def print_bill(self):
        # Open preview anyway so user can verify and print from the dialog
        self.preview_bill()

    def mark_month_paid(self):
        if not self.selected_cell:
            QMessageBox.information(self, "Info", "Select any cell in the month first.")
            return
        _, col = self.selected_cell
        month_name = self.MONTHS[col]
        reply = QMessageBox.question(self, "Confirm", f"Mark ALL unpaid weeks in {month_name} {self.year} as paid?")
        if reply == QMessageBox.StandardButton.Yes:
            result = self.api.post("/weekly-charges/mark-month-paid/", data={'customer_id': self.customer_id, 'year':  self.year, 'month': col + 1})
            if result.get('success'):
                count = result['data'].get('marked_count', 0)
                QMessageBox.information(self, "Done", f"{count} weeks marked as paid.")
                self.load_data()
            else:
                QMessageBox.warning(self, "Error", result.get('error', 'Failed.'))

    def view_history(self):
        result = self.api.get("/payments/", params={'customer_id': self.customer_id, 'ordering': '-date'})
        if result.get('success'):
            dlg = PaymentHistoryDialog(result['data'], self.calendar_data.get('customer', {}), self.api, self)
            dlg.exec()
        else:
            QMessageBox.warning(self, "Error", result.get('error', 'Failed.'))

    def apply_holiday(self):
        try:
            from desktop.ui.delivery_ui import HoldDialog
        except ImportError:
            return
        dlg = HoldDialog(customer_id=self.customer_id, api_client=self.api, parent=self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            self.load_data()

    def get_selected_week_iso(self):
        if not self.selected_cell:
            return None
        row, col = self.selected_cell
        w = self.cal_grid.cellWidget(row, col)
        if not w:
            return None
        wd = w.property('week_data')
        return wd.get('date_iso') if wd else None
