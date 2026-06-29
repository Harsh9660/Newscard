from django.contrib import admin
from .models import Payment, WeeklyCharge, Voucher, PaperAdjustment, Invoice

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('customer', 'amount', 'period_from', 'period_to', 'method', 'invoice_number', 'week_end_date')
    search_fields = ('customer__name', 'invoice_number', 'notes')
    list_filter = ('method', 'period_from', 'period_to', 'week_end_date')

@admin.register(WeeklyCharge)
class WeeklyChargeAdmin(admin.ModelAdmin):
    list_display = ('customer', 'week_end_date', 'amount', 'paid', 'paid_date', 'paid_amount', 'is_holiday')
    search_fields = ('customer__name', 'notes')
    list_filter = ('paid', 'is_holiday', 'week_end_date')

@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ('customer', 'first_week_end', 'description', 'number_of_weeks', 'credit_per_week', 'total_credit', 'applied', 'applied_date')
    search_fields = ('customer__name', 'description')
    list_filter = ('applied', 'first_week_end')

@admin.register(PaperAdjustment)
class PaperAdjustmentAdmin(admin.ModelAdmin):
    list_display = ('customer', 'publication', 'week_end_date', 'day', 'adjustment_type', 'quantity', 'unit_price', 'total_amount', 'applied')
    search_fields = ('customer__name', 'publication__name', 'description')
    list_filter = ('adjustment_type', 'day', 'applied', 'week_end_date')

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('customer', 'invoice_number', 'date', 'period_from', 'period_to', 'amount', 'status')
    search_fields = ('customer__name', 'invoice_number')
    list_filter = ('status', 'date')
