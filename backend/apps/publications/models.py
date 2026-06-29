from django.db import models
from apps.core.models import BaseModel
from decimal import Decimal

class Publication(BaseModel):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('0.00'))
    type = models.CharField(max_length=50, default='newspaper')
    supplier = models.CharField(max_length=200, blank=True, null=True)
    sku = models.CharField(max_length=100, blank=True, null=True)
