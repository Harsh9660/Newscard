import os

files = {
    'backend/apps/rounds/models.py': '''from django.db import models
from decimal import Decimal
from apps.core.models import BaseModel
from django.db.models import PROTECT, CharField, DecimalField, TextField, ForeignKey

class Round(BaseModel):
  name            = CharField(max_length=100)
  paperboy        = CharField(max_length=100,
                     blank=True)
  delivery_charge = DecimalField(
                     max_digits=4,
                     decimal_places=2,
                     default=Decimal('1.80'))
  notes           = TextField(blank=True)
  # NO type field — morning rounds only

  class Meta:
    unique_together = ['name', 'created_by']

class Street(BaseModel):
  round = ForeignKey(Round,
    on_delete=PROTECT, related_name='streets')
  name  = CharField(max_length=200)
  class Meta:
    unique_together = ['name','round',
                       'created_by']
''',
    'backend/apps/customers/models.py': '''from django.db import models
from apps.core.models import BaseModel
from apps.rounds.models import Street, Round
from decimal import Decimal
from datetime import date
from django.db.models import CharField, DateField, DecimalField, EmailField, ForeignKey, IntegerField, TextField, PROTECT, CASCADE

class Customer(BaseModel):
  ac_number    = IntegerField()
  name         = CharField(max_length=200)
  address1     = CharField(max_length=200)
  address2     = CharField(max_length=200,
                  blank=True)
  phone        = CharField(max_length=20,
                  blank=True)
  email        = EmailField(blank=True)
  street       = ForeignKey(Street,
                  on_delete=PROTECT,
                  null=True, blank=True)
  round        = ForeignKey(Round,
                  on_delete=PROTECT,
                  null=True, blank=True)
  billing_cycle= CharField(max_length=20,
                  choices=[('weekly','Weekly'),
                  ('monthly','Monthly'),
                  ('quarterly','Quarterly')],
                  default='weekly')
  balance      = DecimalField(max_digits=8,
                  decimal_places=2,
                  default=Decimal('0.00'))
  instructions = TextField(blank=True)
  notes        = TextField(blank=True)
  since        = DateField(auto_now_add=True)

  def save(self, *args, **kwargs):
    if not self.ac_number:
      last = Customer.objects.filter(
        created_by=self.created_by
      ).order_by('-ac_number').first()
      self.ac_number = (
        last.ac_number + 1 if last else 1)
    super().save(*args, **kwargs)

  class Meta:
    unique_together = ['name','address1',
                       'created_by']

class CustomerOrder(BaseModel):
  customer    = ForeignKey(Customer,
                 on_delete=CASCADE,
                 related_name='orders')
  publication = ForeignKey(
                 'publications.Publication',
                 on_delete=PROTECT)
  qty_sun     = IntegerField(default=0)
  qty_mon     = IntegerField(default=1)
  qty_tue     = IntegerField(default=1)
  qty_wed     = IntegerField(default=1)
  qty_thu     = IntegerField(default=1)
  qty_fri     = IntegerField(default=1)
  qty_sat     = IntegerField(default=1)
  start_date  = DateField(auto_now_add=True)

  @property
  def weekly_price(self):
    qtys = [self.qty_sun, self.qty_mon,
            self.qty_tue, self.qty_wed,
            self.qty_thu, self.qty_fri,
            self.qty_sat]
    return sum(qtys) * self.publication.price

  class Meta:
    unique_together = ['customer',
                       'publication',
                       'created_by']
''',
    'backend/apps/billing/models.py': '''from django.db import models
from apps.core.models import BaseModel
from apps.customers.models import Customer
from decimal import Decimal
from datetime import date
from django.db.models import CharField, DateField, DecimalField, TextField, ForeignKey, PROTECT, F, BooleanField, PositiveIntegerField

class Payment(BaseModel):
  customer       = ForeignKey(Customer,
                    on_delete=PROTECT,
                    related_name='payments')
  amount         = DecimalField(max_digits=8,
                    decimal_places=2)
  date           = DateField()
  method         = CharField(max_length=20,
                    choices=[
                      ('cash','Cash'),
                      ('card','Card'),
                      ('bank transfer',
                       'Bank Transfer'),
                      ('direct debit',
                       'Direct Debit'),
                      ('voucher','Voucher'),
                    ])
  notes          = TextField(blank=True)
  invoice_number = CharField(max_length=50,
                    blank=True)
  week_end_date  = DateField(null=True,
                    blank=True)

  def save(self, *args, **kwargs):
    is_new = self.pk is None
    super().save(*args, **kwargs)
    if is_new:
      Customer.objects.filter(
        id=self.customer_id).update(
        balance=F('balance') - self.amount)

  def delete(self, *args, **kwargs):
    Customer.objects.filter(
      id=self.customer_id).update(
      balance=F('balance') + self.amount)
    super().delete(*args, **kwargs)

class WeeklyCharge(BaseModel):
  customer      = ForeignKey(Customer,
                   on_delete=PROTECT,
                   related_name='weekly_charges')
  week_end_date = DateField()
  amount        = DecimalField(max_digits=8,
                   decimal_places=2)
  paid          = BooleanField(default=False)
  paid_date     = DateField(null=True,
                   blank=True)
  paid_amount   = DecimalField(max_digits=8,
                   decimal_places=2,
                   default=Decimal('0.00'))
  is_holiday    = BooleanField(default=False)
  notes         = TextField(blank=True)

  @property
  def status(self):
    if self.is_holiday: return 'holiday'
    if self.paid:       return 'paid'
    today = date.today()
    if self.week_end_date < today:
      return 'overdue'
    return 'pending'

  class Meta:
    unique_together = ['customer',
                       'week_end_date',
                       'created_by']
    ordering = ['week_end_date']

class Voucher(BaseModel):
  customer        = ForeignKey(Customer,
                     on_delete=PROTECT,
                     related_name='vouchers')
  first_week_end  = DateField()
  description     = CharField(max_length=200,
                     blank=True)
  number_of_weeks = PositiveIntegerField(
                     default=1)
  credit_per_week = DecimalField(
                     max_digits=6,
                     decimal_places=2)
  total_credit    = DecimalField(
                     max_digits=8,
                     decimal_places=2)
  applied         = BooleanField(default=False)
  applied_date    = DateField(null=True,
                     blank=True)
  notes           = TextField(blank=True)

  def save(self, *args, **kwargs):
    self.total_credit = (
      self.credit_per_week *
      self.number_of_weeks)
    super().save(*args, **kwargs)

  class Meta:
    ordering = ['-first_week_end']

class PaperAdjustment(BaseModel):
  customer      = ForeignKey(Customer,
                   on_delete=PROTECT,
                   related_name='adjustments')
  publication   = ForeignKey(
                   'publications.Publication',
                   on_delete=PROTECT,
                   null=True, blank=True)
  week_end_date = DateField()
  day           = CharField(max_length=3,
                   choices=[
                     ('sun','Sun'),('mon','Mon'),
                     ('tue','Tue'),('wed','Wed'),
                     ('thu','Thu'),('fri','Fri'),
                     ('sat','Sat'),('all','All'),
                   ])
  adjustment_type = CharField(max_length=20,
                    choices=[
                      ('extra','Extra copy'),
                      ('missed','Missed delivery'),
                      ('credit','Credit'),
                      ('charge','Extra charge'),
                      ('refund','Refund'),
                    ])
  quantity      = IntegerField(default=1)
  unit_price    = DecimalField(max_digits=6,
                   decimal_places=2,
                   default=Decimal('0.00'))
  total_amount  = DecimalField(max_digits=8,
                   decimal_places=2,
                   default=Decimal('0.00'))
  description   = TextField(blank=True)
  applied       = BooleanField(default=False)

  def save(self, *args, **kwargs):
    self.total_amount = (
      self.unit_price * self.quantity)
    super().save(*args, **kwargs)

class Invoice(BaseModel):
  STATUS = [('draft','Draft'),('sent','Sent'),
            ('paid','Paid'),('overdue','Overdue')]
  customer       = ForeignKey(Customer,
                    on_delete=PROTECT,
                    related_name='invoices')
  invoice_number = CharField(max_length=50,
                    unique=True)
  date           = DateField(auto_now_add=True)
  period_from    = DateField()
  period_to      = DateField()
  amount         = DecimalField(max_digits=8,
                    decimal_places=2)
  status         = CharField(max_length=20,
                    choices=STATUS,
                    default='draft')
''',
    'desktop/ui/record_vouchers.py': '''from PyQt6.QtWidgets import QDialog, QVBoxLayout, QHBoxLayout, QLabel, QDoubleSpinBox, QLineEdit, QWidget, QMessageBox, QSpinBox, QFormLayout
from PyQt6.QtCore import Qt
from datetime import datetime, date, timedelta
from decimal import Decimal

class RecordVouchersDialog(QDialog):
  COLORS = {
    'bg':     '#1a1a1a',
    'teal':   '#20b2aa',
    'white':  '#ffffff',
    'grey':   '#888888',
    'input':  '#2a2a2a',
    'border': '#20b2aa',
  }

  def __init__(self, customer_id, calendar_data, api_client, parent=None):
    super().__init__(parent)
    self.api = api_client
    self.customer_id = customer_id
    self.calendar_data = calendar_data

    self.setWindowTitle("Record Vouchers")
    self.setFixedSize(480, 380)
    self.setModal(True)
    self.setStyleSheet(
      f"background:{self.COLORS['bg']};"
      f"color:{self.COLORS['white']};"
      f"font-family:'Courier New',monospace;")
    self.setup_ui()

  def get_next_saturday(self):
    today = date.today()
    days_until_sat = (5 - today.weekday()) % 7
    if days_until_sat == 0:
      days_until_sat = 7
    next_sat = today + timedelta(days=days_until_sat)
    return next_sat.strftime('%d/%m/%Y'), next_sat.strftime('%Y-%m-%d')

  def setup_ui(self):
    layout = QVBoxLayout(self)
    layout.setSpacing(10)
    layout.setContentsMargins(20,14,20,8)

    title = QLabel("Record Vouchers")
    title.setAlignment(Qt.AlignmentFlag.AlignCenter)
    title.setStyleSheet(f"""
      color: {self.COLORS['teal']};
      font-size: 17px; font-weight: bold;
      border-bottom: 1px solid {self.COLORS['teal']};
      padding-bottom: 8px;
    """)
    layout.addWidget(title)

    cust = self.calendar_data.get('customer', {})
    info = QLabel(f"Account: {cust.get('ac_number','')}  {cust.get('name','')}")
    info.setStyleSheet(f"color:{self.COLORS['grey']};font-size:12px;")
    layout.addWidget(info)

    form = QFormLayout()
    form.setSpacing(12)
    form.setLabelAlignment(Qt.AlignmentFlag.AlignRight)

    inp = (f"background:{self.COLORS['input']};"
           f"color:{self.COLORS['white']};"
           f"border:1px solid {self.COLORS['border']};"
           f"font-family:'Courier New',monospace; font-size:13px;padding:4px 8px;")

    next_sat_display, next_sat_iso = self.get_next_saturday()

    self.first_week_field = QLineEdit()
    self.first_week_field.setText(next_sat_display)
    self.first_week_field.setPlaceholderText("DD/MM/YYYY")
    self.first_week_field.setStyleSheet(inp)
    self.first_week_field.setFixedWidth(160)

    self.description_field = QLineEdit()
    self.description_field.setPlaceholderText("e.g. Holiday vouchers, Promotion")
    self.description_field.setStyleSheet(inp)
    self.description_field.setMinimumWidth(280)

    self.weeks_field = QSpinBox()
    self.weeks_field.setMinimum(1)
    self.weeks_field.setMaximum(52)
    self.weeks_field.setValue(1)
    self.weeks_field.setFixedWidth(100)
    self.weeks_field.setStyleSheet(inp)
    self.weeks_field.valueChanged.connect(self.recalculate_total)

    self.credit_field = QDoubleSpinBox()
    self.credit_field.setDecimals(2)
    self.credit_field.setMinimum(0.01)
    self.credit_field.setMaximum(999.99)
    self.credit_field.setValue(0.00)
    self.credit_field.setPrefix("£ ")
    self.credit_field.setFixedWidth(130)
    self.credit_field.setStyleSheet(inp)
    self.credit_field.valueChanged.connect(self.recalculate_total)

    self.total_label = QLabel("Total credit:  £ 0.00")
    self.total_label.setStyleSheet(f"""
      color: {self.COLORS['teal']};
      font-size: 14px; font-weight: bold;
      padding: 6px 0;
    """)

    form.addRow("First week:", self.first_week_field)
    form.addRow("Description:", self.description_field)
    form.addRow("Number of weeks:", self.weeks_field)
    form.addRow("Credit per week:", self.credit_field)
    form.addRow("", self.total_label)

    for i in range(form.rowCount()):
      label = form.itemAt(i, QFormLayout.ItemRole.LabelRole)
      if label and label.widget():
        label.widget().setStyleSheet(
          f"color:{self.COLORS['grey']};font-family:'Courier New',monospace; font-size:13px;")

    layout.addLayout(form)
    layout.addStretch()

    term_bar = QWidget()
    term_bar.setFixedHeight(30)
    term_bar.setStyleSheet(f"background:{self.COLORS['bg']};border-top:1px solid {self.COLORS['teal']};")
    btn = QHBoxLayout(term_bar)
    btn.setContentsMargins(0, 4, 0, 0)

    esc = QLabel("Esc  Cancel")
    esc.setStyleSheet(f"color:{self.COLORS['grey']};font-family:'Courier New',monospace;font-size:12px; cursor:pointer;")
    esc.mousePressEvent = lambda e: self.reject()

    f9 = QLabel("F9  Save Voucher")
    f9.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
    f9.setStyleSheet(f"color:{self.COLORS['teal']};font-family:'Courier New',monospace;font-size:12px; font-weight:bold;cursor:pointer;")
    f9.mousePressEvent = lambda e: self.save_voucher()

    btn.addWidget(esc)
    btn.addStretch()
    btn.addWidget(f9)
    layout.addWidget(term_bar)

    self.first_week_field.setFocus()

  def recalculate_total(self):
    weeks  = self.weeks_field.value()
    credit = Decimal(str(self.credit_field.value()))
    total  = credit * weeks
    self.total_label.setText(f"Total credit:  £ {total:.2f}")

  def keyPressEvent(self, event):
    if event.key() in (Qt.Key.Key_F9, Qt.Key.Key_Return, Qt.Key.Key_Enter):
      self.save_voucher()
    elif event.key() == Qt.Key.Key_Escape:
      self.reject()
    elif event.key() == Qt.Key.Key_Tab:
      pass

  def validate(self):
    week_text = self.first_week_field.text()
    try:
      dt = datetime.strptime(week_text, '%d/%m/%Y')
      if dt.weekday() != 5:
        QMessageBox.warning(self, "Invalid Date", f"First week must be a Saturday.\\n{week_text} is not a Saturday.")
        self.first_week_field.setFocus()
        return False, None
      first_week_iso = dt.strftime('%Y-%m-%d')
    except ValueError:
      QMessageBox.warning(self, "Invalid Date", "Please enter date as DD/MM/YYYY\\ne.g. 20/06/2026")
      self.first_week_field.setFocus()
      return False, None

    if self.credit_field.value() <= 0:
      QMessageBox.warning(self, "Invalid Amount", "Credit per week must be greater than 0.")
      self.credit_field.setFocus()
      return False, None

    return True, first_week_iso

  def save_voucher(self):
    valid, first_week_iso = self.validate()
    if not valid: return

    weeks  = self.weeks_field.value()
    credit = Decimal(str(self.credit_field.value()))
    desc   = self.description_field.text()

    result = self.api.post("/vouchers/", data={
      'customer_id': self.customer_id,
      'first_week_end': first_week_iso,
      'description': desc,
      'number_of_weeks': weeks,
      'credit_per_week': float(credit),
    })

    if result.get('success'):
      total = credit * weeks
      QMessageBox.information(self, "Vouchers Recorded", f"Voucher recorded successfully.\\nTotal credit: £{total:.2f}\\nApplied over {weeks} week(s) from {self.first_week_field.text()}")
      self.accept()
    else:
      QMessageBox.warning(self, "Save Failed", result.get('error', 'Could not save voucher.'))
''',
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)

# create remaining empty files
all_files = [
    ".env.example", "docker-compose.yml", "requirements.txt", "requirements-desktop.txt",
    "backend/newscard_project/settings/base.py", "backend/newscard_project/settings/dev.py",
    "backend/newscard_project/celery.py", "backend/newscard_project/urls.py",
    "backend/apps/core/permissions.py", "backend/apps/core/signals.py", "backend/apps/core/tasks.py",
    "backend/apps/core/pdf_generator.py", "backend/apps/accounts/models.py",
    "backend/apps/suppliers/models.py", "backend/apps/publications/models.py",
    "backend/apps/delivery/models.py", "backend/apps/billing/services.py",
    "backend/apps/delivery/services.py", "backend/apps/analytics/services.py",
    "desktop/modules/helpers.py", "desktop/modules/charts.py", "desktop/api/client.py",
    "desktop/api/endpoints.py", "desktop/ui/base_action_bar.py", "desktop/ui/base_dialog.py",
    "desktop/ui/base_panel.py", "desktop/main.py", "desktop/ui/login.py", "desktop/ui/main_window.py",
    "desktop/ui/dashboard.py", "desktop/ui/customer_ui.py", "desktop/ui/round_ui.py",
    "desktop/ui/publication_ui.py", "desktop/ui/billing_ui.py", "desktop/ui/supplier_ui.py",
    "desktop/ui/delivery_ui.py", "desktop/ui/order_sheet_ui.py", "desktop/ui/analytics_ui.py",
    "desktop/ui/reports_ui.py", "desktop/ui/settings_ui.py", "desktop/ui/audit_ui.py",
    "desktop/ui/quick_payment.py", "tests/fixtures/seed_data.json", "tests/e2e/conftest.py",
    "tests/e2e/test_auth.py", "tests/e2e/test_customers.py", "tests/e2e/test_billing.py",
    "tests/e2e/test_weekly.py", "tests/e2e/test_delivery.py", "desktop/modules/help_content.py",
    "desktop/ui/help_dialog.py", "desktop/ui/paper_adjustment.py", "desktop/ui/payment_calendar.py",
    "desktop/ui/weekly_account.py"
]

for p in all_files:
    if not os.path.exists(p):
        os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, 'a').close()
