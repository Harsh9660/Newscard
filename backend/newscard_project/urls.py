from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.views.static import serve
from django.http import JsonResponse, HttpResponse
from rest_framework.routers import DefaultRouter
from .api import CustomerViewSet, RoundViewSet, PublicationViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r'customers', CustomerViewSet, basename='customers')
router.register(r'delivery-rounds', RoundViewSet, basename='rounds')
router.register(r'products', PublicationViewSet, basename='products')

def health_check(request):
    return JsonResponse({"status": "ok"})

from django.views.decorators.csrf import csrf_exempt
import json
MOCK_HOLDS = []

@csrf_exempt
def fallback_api(request, path):
    if path == "billing/holds" and request.method == "POST":
        try:
            data = json.loads(request.body)
            MOCK_HOLDS.append({
                "start": data.get("start_date"),
                "end": data.get("end_date")
            })
            return JsonResponse({"ok": True})
        except:
            pass
    elif path == "billing/mark-paid" and request.method == "POST":
        try:
            data = json.loads(request.body)
            customer_id = data.get("customer_id")
            week_end = data.get("week_end_date")
            amount = data.get("paid_amount")
            
            from apps.billing.models import WeeklyCharge, Payment
            from datetime import date
            
            charge, _ = WeeklyCharge.objects.get_or_create(
                customer_id=customer_id,
                week_end_date=week_end,
                defaults={'amount': amount, 'created_by_id': 1}
            )
            charge.paid = True
            charge.paid_date = date.today()
            charge.paid_amount = amount
            charge.save()
            
            Payment.objects.create(
                customer_id=customer_id,
                amount=amount,
                week_end_date=week_end,
                method=data.get('method', 'cash'),
                notes=data.get('notes', ''),
                created_by_id=1
            )
            return JsonResponse({"success": True})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
            
    return JsonResponse([], safe=False)

from apps.customers.models import Customer

from apps.billing.models import WeeklyCharge
from datetime import date, timedelta

def mock_calendar_api(request, customer_id):
    year = int(request.GET.get('year', date.today().year))
    
    try:
        c = Customer.objects.get(id=customer_id)
        cust_dict = {"name": c.name, "ac_number": c.ac_number, "address1": c.address1, "address2": c.address2, "phone": c.phone}
    except Customer.DoesNotExist:
        cust_dict = {"name": "Unknown Customer", "ac_number": customer_id, "address1": "Unknown", "phone": ""}

    charges = WeeklyCharge.objects.filter(customer_id=customer_id, week_end_date__year=year)
    charge_map = {wc.week_end_date: wc for wc in charges}

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    months_data = {m: [] for m in months}
    
    d = date(year, 1, 1)
    
    today = date.today()
    
    while d.year == year:
        month_name = months[d.month - 1]
        
        # Check weekly charge for the week ending on the upcoming Saturday
        days_to_sat = (5 - d.weekday()) % 7
        upcoming_sat = d + timedelta(days=days_to_sat)
        wc = charge_map.get(upcoming_sat)
        
        is_holiday = False
        stat = "pending"
        daily_amount = 2.50
        
        if wc:
            if wc.paid:
                stat = "paid"
            elif d < today:
                stat = "overdue"
            else:
                stat = "pending"
        else:
            if d < today:
                stat = "overdue"
        
        months_data[month_name].append({
            "date_num": d.day,
            "date_iso": d.isoformat(),
            "amount": daily_amount,
            "status": stat,
            "paid": wc.paid if wc else False,
            "is_holiday": is_holiday,
            "is_current_week": False 
        })
        d += timedelta(days=1)

    return JsonResponse({
        "total_due": float(c.balance) if 'c' in locals() else 0.0,
        "customer": cust_dict,
        "months": months_data
    })

@csrf_exempt
def mock_weekly_api(request, customer_id):
    try:
        c = Customer.objects.get(id=customer_id)
        cust_dict = {"name": c.name, "ac_number": c.ac_number, "address1": c.address1, "address2": c.address2, "phone": c.phone}
    except Customer.DoesNotExist:
        cust_dict = {"name": "Unknown Customer", "ac_number": customer_id, "address1": "Unknown", "address2": "", "phone": ""}

    return JsonResponse({
        "week_end_date": "20/06/2026",
        "week_end_iso": "2026-06-20",
        "on_holiday": False,
        "customer": cust_dict,
        "delivery_charge": 1.50,
        "total": 12.50,
        "received": 0.00,
        "refunded": 0.00,
        "outstanding": 12.50,
        "papers": [
            {
                "order_id": 1,
                "pub_name": "Daily Express",
                "pub_price": 1.10,
                "days": {"sun": 1, "mon": 1, "tue": 1, "wed": 1, "thu": 1, "fri": 1, "sat": 1},
                "weekly_price": 7.70
            },
            {
                "order_id": 2,
                "pub_name": "The Sun",
                "pub_price": 0.80,
                "days": {"sun": 0, "mon": 1, "tue": 1, "wed": 1, "thu": 1, "fri": 1, "sat": 1},
                "weekly_price": 4.80
            }
        ]
    })

from apps.publications.models import Publication
from apps.rounds.models import Round
from django.db.models import Sum, Count, Avg

def mock_dashboard_stats(request):
    c_count = Customer.objects.count()
    p_count = Publication.objects.count()
    r_count = Round.objects.count()
    
    owing = Customer.objects.filter(balance__gt=0)
    owing_count = owing.count()
    total_out = owing.aggregate(Sum('balance'))['balance__sum'] or 0.0

    return JsonResponse({
        "customer_count": c_count,
        "product_count": p_count,
        "round_count": r_count,
        "total_outstanding": float(total_out),
        "customers_with_balance": owing_count
    })

def mock_dashboard_analytics(request):
    avg_price = Publication.objects.aggregate(Avg('price'))['price__avg'] or 0.0
    cat_val = Publication.objects.aggregate(Sum('price'))['price__sum'] or 0.0
    unassigned = Customer.objects.filter(round__isnull=True).count()
    
    paid_up = Customer.objects.filter(balance=0).count()
    owing = Customer.objects.filter(balance__gt=0).count()
    credit = Customer.objects.filter(balance__lt=0).count()
    
    rounds_data = Round.objects.annotate(c=Count('customer'))
    customers_by_round = [{"label": r.name, "value": r.c} for r in rounds_data]
    
    balance_by_round = []
    for r in rounds_data:
        b = Customer.objects.filter(round=r, balance__gt=0).aggregate(Sum('balance'))['balance__sum'] or 0
        balance_by_round.append({"label": r.name, "value": float(b)})
        
    pub_types = Publication.objects.values('type').annotate(c=Count('id'))
    products_by_type = [{"label": p['type'], "value": p['c']} for p in pub_types]
    
    top_custs = Customer.objects.filter(balance__gt=0).order_by('-balance')[:5]
    top_balances = [{"name": c.name, "balance": float(c.balance)} for c in top_custs]

    return JsonResponse({
        "avg_product_price": float(avg_price),
        "catalog_value": float(cat_val),
        "unassigned_customers": unassigned,
        "balance_status": {"paid_up": paid_up, "owing": owing, "credit": credit},
        "customers_by_round": customers_by_round if customers_by_round else [{"label": "None", "value": 0}],
        "balance_by_round": balance_by_round if balance_by_round else [{"label": "None", "value": 0}],
        "products_by_type": products_by_type if products_by_type else [{"label": "None", "value": 0}],
        "top_balances": top_balances
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health', health_check),
    path('api/dashboard/stats', mock_dashboard_stats),
    path('api/dashboard/analytics', mock_dashboard_analytics),
    path('api/billing/customers/<int:customer_id>/calendar', mock_calendar_api),
    path('api/billing/customers/<int:customer_id>/calendar<str:suffix>', mock_calendar_api),
    path('api/billing/customers/<int:customer_id>/weekly', mock_weekly_api),
    path('api/v1/billing/', include('apps.billing.urls')),
    path('api/', include(router.urls)),
    path('', TemplateView.as_view(template_name='index.html')),
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': settings.BASE_DIR.parent / 'frontend/dist/assets'}),
    path('favicon.ico', lambda request: HttpResponse(status=204)),
    re_path(r'^api/(?P<path>.*)$', fallback_api),
]
