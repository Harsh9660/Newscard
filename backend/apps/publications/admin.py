from django.contrib import admin
from .models import Publication

@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'type', 'created_by')
    search_fields = ('name', 'type')
    list_filter = ('type', 'created_by')
