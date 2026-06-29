from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VoucherAPIView, PaperAdjustmentAPIView, WeeklyChargeAPIView

router = DefaultRouter()
router.register(r'vouchers', VoucherAPIView, basename='voucher')
router.register(r'adjustments', PaperAdjustmentAPIView, basename='adjustment')
router.register(r'weekly-charges', WeeklyChargeAPIView, basename='weekly-charge')

urlpatterns = [
    path('', include(router.urls)),
]
