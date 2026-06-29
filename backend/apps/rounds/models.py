from django.db import models
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
