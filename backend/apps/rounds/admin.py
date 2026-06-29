from django.contrib import admin
from .models import Round, Street

class StreetInline(admin.TabularInline):
    model = Street
    extra = 1

@admin.register(Round)
class RoundAdmin(admin.ModelAdmin):
    list_display = ('name', 'paperboy', 'delivery_charge', 'created_by')
    search_fields = ('name', 'paperboy')
    list_filter = ('created_by',)
    inlines = [StreetInline]

@admin.register(Street)
class StreetAdmin(admin.ModelAdmin):
    list_display = ('name', 'round', 'created_by')
    search_fields = ('name', 'round__name')
    list_filter = ('round', 'created_by')
