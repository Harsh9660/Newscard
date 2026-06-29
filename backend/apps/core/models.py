from django.db import models
from django.contrib.auth.models import User
from django.db.models import PROTECT, SET_NULL, CharField, DateTimeField, BooleanField, ForeignKey, IntegerField, JSONField, TextField

class BaseModel(models.Model):
  created_by = ForeignKey(User,
    on_delete=PROTECT, related_name='+')
  created_at = DateTimeField(auto_now_add=True)
  updated_at = DateTimeField(auto_now=True)
  is_active  = BooleanField(default=True)
  class Meta:
    abstract = True

class AuditLog(models.Model):
  user       = ForeignKey(User,
    on_delete=SET_NULL, null=True)
  action     = CharField(max_length=20)
  app_label  = CharField(max_length=50)
  model_name = CharField(max_length=100)
  record_id  = IntegerField()
  old_values = JSONField(null=True)
  new_values = JSONField(null=True)
  details    = TextField(blank=True)
  timestamp  = DateTimeField(auto_now_add=True)
  class Meta:
    ordering = ['-timestamp']
