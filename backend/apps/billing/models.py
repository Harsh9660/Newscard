from django.db import models
from apps.core.models import BaseModel
from apps.customers.models import Customer
from decimal import Decimal
from datetime import date
from django.db.models import CharField, DateField, DecimalField, TextField, ForeignKey, PROTECT, F, BooleanField, PositiveIntegerField, IntegerField

class Payment(BaseModel):
  customer       = ForeignKey(Customer,
                    on_delete=PROTECT,
                    related_name='payments')
  amount         = DecimalField(max_digits=8,
                    decimal_places=2)
  period_from    = DateField(null=True, blank=True)
  period_to      = DateField(null=True, blank=True)
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
