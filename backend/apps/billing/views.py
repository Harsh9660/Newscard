from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import F
from datetime import datetime, date, timedelta
from .models import Voucher, PaperAdjustment, WeeklyCharge, Payment, Customer
from apps.core.models import AuditLog

class VoucherAPIView(viewsets.ViewSet):
    def list(self, request):
        customer_id = request.query_params.get('customer_id')
        applied = request.query_params.get('applied')
        queryset = Voucher.objects.all()
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if applied is not None:
            queryset = queryset.filter(applied=applied.lower() == 'true')
            
        data = [{
            'id': v.id,
            'customer_name': v.customer.name,
            'total_credit': v.total_credit,
            'first_week_end': v.first_week_end,
            'applied': v.applied
        } for v in queryset]
        return Response({'success': True, 'data': data})

    def create(self, request):
        data = request.data
        customer_id = data.get('customer_id')
        first_week_end = data.get('first_week_end')
        number_of_weeks = int(data.get('number_of_weeks', 1))
        credit_per_week = float(data.get('credit_per_week', 0))
        description = data.get('description', '')

        if not customer_id or not first_week_end:
            return Response({'success': False, 'error': 'Missing required fields'})
            
        first_dt = datetime.strptime(first_week_end, '%Y-%m-%d').date()
        if first_dt.weekday() != 5:
            return Response({'success': False, 'error': 'first_week_end must be a Saturday'})
            
        if number_of_weeks < 1 or credit_per_week <= 0:
            return Response({'success': False, 'error': 'Invalid voucher amount or duration'})

        voucher = Voucher.objects.create(
            customer_id=customer_id,
            first_week_end=first_dt,
            description=description,
            number_of_weeks=number_of_weeks,
            credit_per_week=credit_per_week,
            total_credit=credit_per_week * number_of_weeks
        )

        for i in range(number_of_weeks):
            week_date = first_dt + timedelta(days=7*i)
            Payment.objects.create(
                customer_id=customer_id,
                amount=credit_per_week,
                date=week_date,
                method='voucher',
                week_end_date=week_date,
                notes=f"Voucher: {description}"
            )
            
        customer = Customer.objects.get(id=customer_id)

        AuditLog.objects.create(
            action='create',
            app_label='billing',
            model_name='Voucher',
            record_id=voucher.id,
            details=f"Created voucher for {number_of_weeks} weeks"
        )

        return Response({
            'success': True, 
            'data': {
                'voucher_id': voucher.id,
                'new_balance': float(customer.balance)
            }
        })


class PaperAdjustmentAPIView(viewsets.ViewSet):
    def create(self, request):
        data = request.data
        customer_id = data.get('customer_id')
        week_end_date = data.get('week_end_date')
        qty = int(data.get('quantity', 1))
        unit_price = float(data.get('unit_price', 0))
        adj_type = data.get('adjustment_type')
        
        if not customer_id or not week_end_date:
            return Response({'success': False, 'error': 'Missing required fields'})
            
        total_amount = unit_price * qty
        
        adj = PaperAdjustment.objects.create(
            customer_id=customer_id,
            publication_id=data.get('publication_id'),
            week_end_date=week_end_date,
            day=data.get('day', 'all'),
            adjustment_type=adj_type,
            quantity=qty,
            unit_price=unit_price,
            total_amount=total_amount,
            description=data.get('description', '')
        )
        
        customer = Customer.objects.get(id=customer_id)
        if adj_type in ['credit', 'refund', 'missed']:
            customer.balance -= total_amount
        elif adj_type in ['extra', 'charge']:
            customer.balance += total_amount
        customer.save()
        
        # In a real app we'd update WeeklyCharge here too
        
        return Response({'success': True, 'data': {'adjustment_id': adj.id, 'new_balance': float(customer.balance)}})


class WeeklyChargeAPIView(viewsets.ViewSet):
    @action(detail=False, methods=['patch'], url_path='by-week')
    def mark_paid_by_week(self, request):
        data = request.data
        customer_id = data.get('customer_id')
        week_end = data.get('week_end_date')
        paid_amount = data.get('paid_amount')
        
        if not customer_id or not week_end:
            return Response({'success': False, 'error': 'Missing customer_id or week_end_date'})
            
        charge, _ = WeeklyCharge.objects.get_or_create(
            customer_id=customer_id,
            week_end_date=week_end,
            defaults={'amount': paid_amount}
        )
        
        charge.paid = True
        charge.paid_date = data.get('paid_date', date.today())
        charge.paid_amount = paid_amount
        charge.save()
        
        Payment.objects.create(
            customer_id=customer_id,
            amount=paid_amount,
            date=charge.paid_date,
            method=data.get('method', 'cash'),
            notes=data.get('notes', ''),
            week_end_date=week_end
        )
        
        customer = Customer.objects.get(id=customer_id)
        return Response({'success': True, 'data': {'new_balance': float(customer.balance)}})
        
    @action(detail=False, methods=['post'], url_path='mark-month-paid')
    def mark_month_paid(self, request):
        customer_id = request.data.get('customer_id')
        year = request.data.get('year')
        month = request.data.get('month')
        
        # Dummy response for F9 menu
        return Response({'success': True, 'data': {'marked_count': 4}})
