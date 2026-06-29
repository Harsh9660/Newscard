"""Pydantic schemas for NEWSCARD v2.3."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ─── Delivery Round ─────────────────────────────────────
class DeliveryRoundBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    paperboy: Optional[str] = None
    delivery_charge: float = 1.80
    notes: Optional[str] = None


class DeliveryRoundCreate(DeliveryRoundBase):
    pass


class DeliveryRoundUpdate(BaseModel):
    name: Optional[str] = None
    paperboy: Optional[str] = None
    delivery_charge: Optional[float] = None
    notes: Optional[str] = None


class DeliveryRoundOut(DeliveryRoundBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customer_count: int = 0
    created_at: datetime
    updated_at: datetime


# ─── Customer ────────────────────────────────────────────
class CustomerBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    address: Optional[str] = None
    address2: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    street: Optional[str] = None
    round_id: Optional[int] = None
    billing_cycle: str = "weekly"
    balance: float = 0.0
    instructions: Optional[str] = None
    notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    address2: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    street: Optional[str] = None
    round_id: Optional[int] = None
    billing_cycle: Optional[str] = None
    balance: Optional[float] = None
    instructions: Optional[str] = None
    notes: Optional[str] = None


class CustomerOut(CustomerBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ac_number: int
    since: date
    round_name: Optional[str] = None
    round_delivery_charge: Optional[float] = None
    created_at: datetime
    updated_at: datetime


# ─── Product (Publication) ───────────────────────────────
class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    product_type: str = "newspaper"
    price: float = 0.0
    supplier: Optional[str] = None
    sku: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    product_type: Optional[str] = None
    price: Optional[float] = None
    supplier: Optional[str] = None
    sku: Optional[str] = None


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


# ─── Customer Order ──────────────────────────────────────
class DayQuantities(BaseModel):
    sun: int = 0
    mon: int = 1
    tue: int = 1
    wed: int = 1
    thu: int = 1
    fri: int = 1
    sat: int = 1


class CustomerOrderCreate(BaseModel):
    product_id: int
    days: DayQuantities = DayQuantities()


class CustomerOrderUpdate(BaseModel):
    order_id: int
    days: DayQuantities


class CustomerOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customer_id: int
    product_id: int
    pub_name: str
    pub_price: float
    days: DayQuantities
    weekly_price: float


# ─── Weekly Account ──────────────────────────────────────
class WeeklyAccountPaper(BaseModel):
    order_id: int
    publication_id: int
    pub_name: str
    pub_price: float
    days: DayQuantities
    weekly_price: float


class WeeklyAccountOut(BaseModel):
    customer: dict
    week_end_date: str
    week_end_iso: str
    papers: list[WeeklyAccountPaper]
    delivery_charge: float
    total: float
    received: float
    refunded: float
    outstanding: float
    on_holiday: bool
    holiday_info: Optional[str]


class WeeklyAccountUpdateItem(BaseModel):
    order_id: int
    days: DayQuantities


class WeeklyAccountUpdate(BaseModel):
    papers: list[WeeklyAccountUpdateItem]


# ─── Payment Calendar ────────────────────────────────────
class CalendarWeek(BaseModel):
    charge_id: Optional[int]
    date_num: int
    date_iso: str
    amount: float
    paid: bool
    paid_date: Optional[str]
    is_holiday: bool
    is_current_week: bool
    status: str  # paid | overdue | holiday | pending


class PaymentCalendarOut(BaseModel):
    customer: dict
    year: int
    total_due: float
    months: dict[str, list[CalendarWeek]]


# ─── Payment ─────────────────────────────────────────────
class PaymentCreate(BaseModel):
    customer_id: int
    amount: float
    period_from: Optional[date] = None
    period_to: Optional[date] = None
    method: str = "cash"
    notes: Optional[str] = None
    week_end_date: Optional[date] = None


class MarkPaidRequest(BaseModel):
    customer_id: int
    week_end_date: date
    paid_amount: float
    period_from: Optional[date] = None
    period_to: Optional[date] = None
    method: str = "cash"
    notes: Optional[str] = None


class MarkPaidOut(BaseModel):
    charge_id: int
    payment_id: int
    new_balance: float
    paid_amount: float


# ─── Delivery Hold ───────────────────────────────────────
class DeliveryHoldCreate(BaseModel):
    customer_id: int
    start_date: date
    end_date: date
    reason: Optional[str] = None


class DeliveryHoldOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customer_id: int
    start_date: date
    end_date: date
    reason: Optional[str]
    cancelled: bool
    status: str
    created_at: datetime


# ─── Dashboard ───────────────────────────────────────────
class DashboardStats(BaseModel):
    customer_count: int
    product_count: int
    round_count: int
    total_outstanding: float
    customers_with_balance: int


class AnalyticsSlice(BaseModel):
    label: str
    value: float


class TopBalanceCustomer(BaseModel):
    name: str
    balance: float


class BalanceStatus(BaseModel):
    paid_up: int
    owing: int
    credit: int


class DashboardAnalytics(BaseModel):
    customers_by_round: list[AnalyticsSlice]
    balance_by_round: list[AnalyticsSlice]
    products_by_type: list[AnalyticsSlice]
    balance_status: BalanceStatus
    top_balances: list[TopBalanceCustomer]
    avg_product_price: float
    unassigned_customers: int
    catalog_value: float


class ExtractResponse(BaseModel):
    success: bool
    path: str
    message: str
