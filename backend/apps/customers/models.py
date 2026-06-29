from django.db import models
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
