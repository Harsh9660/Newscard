"""SQLAlchemy models — all tables for NEWSCARD v2.3."""
from datetime import date, datetime

from sqlalchemy import (
    Boolean, Date, DateTime, Float, ForeignKey,
    Integer, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base


# ─────────────────────────────────────────────────────────
# Delivery Round
# ─────────────────────────────────────────────────────────
class DeliveryRound(Base):
    __tablename__ = "delivery_rounds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    paperboy: Mapped[str | None] = mapped_column(String(200))
    delivery_charge: Mapped[float] = mapped_column(Float, default=1.80)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    customers: Mapped[list["Customer"]] = relationship(back_populates="delivery_round")


# ─────────────────────────────────────────────────────────
# Customer
# ─────────────────────────────────────────────────────────
class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ac_number: Mapped[int] = mapped_column(Integer, default=0)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    address: Mapped[str | None] = mapped_column(Text)
    address2: Mapped[str | None] = mapped_column(String(200))
    phone: Mapped[str | None] = mapped_column(String(500))
    email: Mapped[str | None] = mapped_column(String(200))
    street: Mapped[str | None] = mapped_column(String(200))
    round_id: Mapped[int | None] = mapped_column(ForeignKey("delivery_rounds.id"))
    billing_cycle: Mapped[str] = mapped_column(String(20), default="weekly")
    balance: Mapped[float] = mapped_column(Float, default=0.0)
    instructions: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    since: Mapped[date] = mapped_column(Date, default=date.today)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    delivery_round: Mapped["DeliveryRound | None"] = relationship(back_populates="customers")
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    payments: Mapped[list["Payment"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    weekly_charges: Mapped[list["WeeklyCharge"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    holds: Mapped[list["DeliveryHold"]] = relationship(back_populates="customer", cascade="all, delete-orphan")


# ─────────────────────────────────────────────────────────
# Product (Publication)
# ─────────────────────────────────────────────────────────
class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    product_type: Mapped[str] = mapped_column(String(50), default="newspaper")
    price: Mapped[float] = mapped_column(Float, default=0.0)
    supplier: Mapped[str | None] = mapped_column(String(200))
    sku: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="product")


# ─────────────────────────────────────────────────────────
# Customer Order (per-day delivery quantities)
# ─────────────────────────────────────────────────────────
class CustomerOrder(Base):
    __tablename__ = "customer_orders"
    __table_args__ = (UniqueConstraint("customer_id", "product_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"))
    qty_sun: Mapped[int] = mapped_column(Integer, default=0)
    qty_mon: Mapped[int] = mapped_column(Integer, default=1)
    qty_tue: Mapped[int] = mapped_column(Integer, default=1)
    qty_wed: Mapped[int] = mapped_column(Integer, default=1)
    qty_thu: Mapped[int] = mapped_column(Integer, default=1)
    qty_fri: Mapped[int] = mapped_column(Integer, default=1)
    qty_sat: Mapped[int] = mapped_column(Integer, default=1)
    start_date: Mapped[date] = mapped_column(Date, default=date.today)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    customer: Mapped["Customer"] = relationship(back_populates="orders")
    product: Mapped["Product"] = relationship(back_populates="orders")


# ─────────────────────────────────────────────────────────
# Payment
# ─────────────────────────────────────────────────────────
class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="RESTRICT"))
    amount: Mapped[float] = mapped_column(Float)
    date: Mapped[date] = mapped_column(Date)
    method: Mapped[str] = mapped_column(String(20), default="cash")
    notes: Mapped[str | None] = mapped_column(Text)
    invoice_number: Mapped[str | None] = mapped_column(String(50))
    week_end_date: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    customer: Mapped["Customer"] = relationship(back_populates="payments")


# ─────────────────────────────────────────────────────────
# Weekly Charge (one per customer per Saturday)
# ─────────────────────────────────────────────────────────
class WeeklyCharge(Base):
    __tablename__ = "weekly_charges"
    __table_args__ = (UniqueConstraint("customer_id", "week_end_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"))
    week_end_date: Mapped[date] = mapped_column(Date, index=True)  # always Saturday
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    paid: Mapped[bool] = mapped_column(Boolean, default=False)
    paid_date: Mapped[date | None] = mapped_column(Date)
    paid_amount: Mapped[float] = mapped_column(Float, default=0.0)
    is_holiday: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    customer: Mapped["Customer"] = relationship(back_populates="weekly_charges")


# ─────────────────────────────────────────────────────────
# Delivery Hold (holiday)
# ─────────────────────────────────────────────────────────
class DeliveryHold(Base):
    __tablename__ = "delivery_holds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    reason: Mapped[str | None] = mapped_column(Text)
    cancelled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    customer: Mapped["Customer"] = relationship(back_populates="holds")
