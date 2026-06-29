"""Weekly account + payment calendar + payments + orders + holds API."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend import crud
from backend.database import get_db
from backend.schemas import (
    CustomerOrderCreate, DeliveryHoldCreate,
    MarkPaidRequest, PaymentCreate, WeeklyAccountUpdate,
)

router = APIRouter(prefix="/api/billing", tags=["billing"])


# ── Weekly Account ──────────────────────────────────────
@router.get("/customers/{customer_id}/weekly")
def get_weekly(customer_id: int, db: Session = Depends(get_db)):
    data = crud.get_weekly_account(db, customer_id)
    if not data:
        raise HTTPException(404, "Customer not found")
    return data


@router.put("/customers/{customer_id}/weekly")
def update_weekly(customer_id: int, body: WeeklyAccountUpdate, db: Session = Depends(get_db)):
    data = crud.update_weekly_account(db, customer_id, body)
    if not data:
        raise HTTPException(404, "Customer not found")
    return data


# ── Payment Calendar ────────────────────────────────────
@router.get("/customers/{customer_id}/calendar")
def get_calendar(customer_id: int, year: int = 0, db: Session = Depends(get_db)):
    if not year:
        year = date.today().year
    data = crud.get_payment_calendar(db, customer_id, year)
    if not data:
        raise HTTPException(404, "Customer not found")
    return data


# ── Mark Week as Paid ───────────────────────────────────
@router.post("/mark-paid")
def mark_paid(body: MarkPaidRequest, db: Session = Depends(get_db)):
    try:
        result = crud.mark_week_paid(db, body)
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))


# ── Customer Orders ─────────────────────────────────────
@router.get("/customers/{customer_id}/orders")
def list_orders(customer_id: int, db: Session = Depends(get_db)):
    return crud.list_orders(db, customer_id)


@router.post("/customers/{customer_id}/orders")
def create_order(customer_id: int, body: CustomerOrderCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_order(db, customer_id, body)
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.delete("/customers/{customer_id}/orders/{order_id}")
def delete_order(customer_id: int, order_id: int, db: Session = Depends(get_db)):
    if not crud.delete_order(db, order_id):
        raise HTTPException(404, "Order not found")
    return {"ok": True}


# ── Payments ────────────────────────────────────────────
@router.get("/customers/{customer_id}/payments")
def list_payments(customer_id: int, db: Session = Depends(get_db)):
    pays = crud.list_payments(db, customer_id)
    return [
        {"id": p.id, "amount": p.amount, "period_from": p.period_from, "period_to": p.period_to,
         "method": p.method, "notes": p.notes,
         "week_end_date": p.week_end_date}
        for p in pays
    ]


@router.post("/payments")
def create_payment(body: PaymentCreate, db: Session = Depends(get_db)):
    p = crud.create_payment(db, body)
    return {"id": p.id, "amount": p.amount, "period_from": p.period_from, "period_to": p.period_to}


@router.delete("/payments/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    if not crud.delete_payment(db, payment_id):
        raise HTTPException(404, "Payment not found")
    return {"ok": True}


# ── Delivery Holds ──────────────────────────────────────
@router.get("/customers/{customer_id}/holds")
def list_holds(customer_id: int, db: Session = Depends(get_db)):
    return crud.list_holds(db, customer_id)


@router.post("/holds")
def create_hold(body: DeliveryHoldCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_hold(db, body)
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.patch("/holds/{hold_id}/cancel")
def cancel_hold(hold_id: int, db: Session = Depends(get_db)):
    if not crud.cancel_hold(db, hold_id):
        raise HTTPException(404, "Hold not found")
    return {"ok": True}
