import sys
from unittest.mock import MagicMock
from decimal import Decimal
from PyQt6.QtWidgets import QApplication, QMessageBox
from PyQt6.QtCore import Qt
from PyQt6.QtTest import QTest

from desktop.ui.weekly_account import WeeklyAccount
from desktop.ui.payment_calendar import PaymentCalendar
from desktop.ui.amount_received import AmountReceivedDialog
from desktop.ui.record_vouchers import RecordVouchersDialog
from desktop.ui.paper_adjustment import PaperAdjustmentScreen

# Ensure a QApplication exists
app = QApplication.instance()
if not app:
    app = QApplication(sys.argv)

def test_amount_received_validation():
    api = MagicMock()
    week_data = {'amount': 0.0, 'date_iso': '2026-06-06'}
    dlg = AmountReceivedDialog(1, week_data, api)
    
    # Simulate entering a 0 amount
    dlg.amount_field.setValue(0.0)
    
    # Try pressing F4
    QTest.keyClick(dlg, Qt.Key.Key_F4)
    # The API should not have been called because amount is 0
    api.patch.assert_not_called()
    
    # Change amount to 10.50
    dlg.amount_field.setValue(10.50)
    api.patch.return_value = {'success': True, 'data': {'new_balance': 0}}
    
    # To bypass QMessageBox blocking the test, we mock it temporarily
    with MagicMock() as mock_qmsg:
        QMessageBox.information = mock_qmsg
        QTest.keyClick(dlg, Qt.Key.Key_F4)
    
    # API should now be called
    api.patch.assert_called_once()
    assert dlg.result() == 1 # Accepted

def test_amount_received_esc_cancel():
    api = MagicMock()
    week_data = {'amount': 15.0}
    dlg = AmountReceivedDialog(1, week_data, api)
    
    # Press Escape
    QTest.keyClick(dlg, Qt.Key.Key_Escape)
    
    # Dialog should be rejected without calling API
    api.patch.assert_not_called()
    assert dlg.result() == 0 # Rejected

def test_record_vouchers_validation():
    api = MagicMock()
    cal_data = {}
    dlg = RecordVouchersDialog(1, cal_data, api)
    
    # Set invalid date (Not a Saturday)
    dlg.first_week_field.setText("2026-06-05")
    dlg.credit_field.setValue(5.0)
    
    with MagicMock() as mock_qmsg:
        QMessageBox.warning = mock_qmsg
        QTest.keyClick(dlg, Qt.Key.Key_F4)
    
    # API should not be called due to invalid date
    api.post.assert_not_called()

def test_paper_adjustment_tabbing():
    api = MagicMock()
    dlg = PaperAdjustmentScreen(1, "2026-06-06", 100, api)
    
    # Ensure there's a tab order list
    assert len(dlg.tab_order) > 0
    first_widget = dlg.tab_order[0]
    second_widget = dlg.tab_order[1]
    
    # Give focus to the first widget
    first_widget.setFocus()
    assert first_widget.hasFocus()
    
    # Press Tab
    QTest.keyClick(dlg, Qt.Key.Key_Tab)
    assert second_widget.hasFocus()
    
    # Press Shift+Tab
    QTest.keyClick(dlg, Qt.Key.Key_Backtab)
    assert first_widget.hasFocus()
