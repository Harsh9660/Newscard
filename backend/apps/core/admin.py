from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'action', 'app_label', 'model_name', 'record_id')
    list_filter = ('action', 'app_label', 'model_name', 'timestamp')
    search_fields = ('details', 'user__username', 'record_id')
    readonly_fields = ('user', 'action', 'app_label', 'model_name', 'record_id', 'old_values', 'new_values', 'details', 'timestamp')
