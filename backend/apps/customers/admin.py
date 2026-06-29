from .models import Customer, CustomerOrder
from django.contrib import admin

class CustomerOrderInline(admin.TabularInline):
    model = CustomerOrder
    extra = 1

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('ac_number', 'name', 'phone', 'round', 'street', 'billing_cycle', 'balance', 'since')
    search_fields = ('name', 'ac_number', 'phone', 'email')
    list_filter = ('billing_cycle', 'round', 'street', 'since')
    inlines = [CustomerOrderInline]

@admin.register(CustomerOrder)
class CustomerOrderAdmin(admin.ModelAdmin):
    list_display = ('customer', 'publication', 'qty_mon', 'qty_tue', 'qty_wed', 'qty_thu', 'qty_fri', 'qty_sat', 'qty_sun', 'weekly_price')
    search_fields = ('customer__name', 'publication__name')
    list_filter = ('publication', 'customer__round')
