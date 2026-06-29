"""CRUD operations for NEWSCARD v2.3 — all models."""
from datetime import date, timedelta
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import extract

from backend import encryption
from backend.models import (
    Customer, CustomerOrder, DeliveryHold,
    DeliveryRound, Payment, Product, WeeklyCharge,
)
from backend.schemas import (
    CustomerCreate, CustomerOrderCreate, CustomerOrderUpdate,
    CustomerUpdate, DeliveryHoldCreate, DeliveryRoundCreate,
    DeliveryRoundUpdate, MarkPaidRequest, ProductCreate,
    ProductUpdate, WeeklyAccountUpdate,
)


# ═══════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════
def _next_saturday(from_date: date | None = None) -> date:
    d = from_date or date.today()
    days_ahead = 5 - d.weekday()  # Saturday = 5
    if days_ahead <= 0:
        days_ahead += 7
    return d + timedelta(days=days_ahead)


def _coming_saturday() -> date:
    """Return the coming Saturday (or today if it is Saturday)."""
    today = date.today()
    days_ahead = (5 - today.weekday()) % 7
    return today + timedelta(days=days_ahead)


def _order_to_days(order: CustomerOrder) -> dict:
    return {
        "sun": order.qty_sun,
        "mon": order.qty_mon,
        "tue": order.qty_tue,
        "wed": order.qty_wed,
        "thu": order.qty_thu,
        "fri": order.qty_fri,
        "sat": order.qty_sat,
    }


def _customer_to_dict(c: Customer) -> dict:
    return {
        "id": c.id,
        "ac_number": c.ac_number,
        "name": c.name,
        "address": encryption.decrypt_value(c.address),
        "address2": c.address2,
        "phone": encryption.decrypt_value(c.phone),
        "email": c.email,
        "street": c.street,
        "round_id": c.round_id,
        "billing_cycle": c.billing_cycle,
        "balance": c.balance,
        "instructions": c.instructions,
        "notes": c.notes,
        "since": c.since.isoformat() if c.since else None,
        "created_at": c.created_at,
        "updated_at": c.updated_at,
        "round_name": c.delivery_round.name if c.delivery_round else None,
        "round_delivery_charge": c.delivery_round.delivery_charge if c.delivery_round else None,
    }


# ═══════════════════════════════════════════════════════
# Delivery Rounds
# ═══════════════════════════════════════════════════════
def list_rounds(db: Session):
    rounds = db.query(DeliveryRound).order_by(DeliveryRound.name).all()
    result = []
    for r in rounds:
        count = db.query(func.count(Customer.id)).filter(Customer.round_id == r.id).scalar()
        result.append({
            "id": r.id, "name": r.name, "paperboy": r.paperboy,
            "delivery_charge": r.delivery_charge, "notes": r.notes,
            "customer_count": count or 0,
            "created_at": r.created_at, "updated_at": r.updated_at,
        })
    return result


def get_round(db: Session, round_id: int):
    r = db.query(DeliveryRound).filter(DeliveryRound.id == round_id).first()
    if not r:
        return None
    count = db.query(func.count(Customer.id)).filter(Customer.round_id == r.id).scalar()
    return {
        "id": r.id, "name": r.name, "paperboy": r.paperboy,
        "delivery_charge": r.delivery_charge, "notes": r.notes,
        "customer_count": count or 0,
        "created_at": r.created_at, "updated_at": r.updated_at,
    }


def create_round(db: Session, data: DeliveryRoundCreate):
    r = DeliveryRound(**data.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return get_round(db, r.id)


def update_round(db: Session, round_id: int, data: DeliveryRoundUpdate):
    r = db.query(DeliveryRound).filter(DeliveryRound.id == round_id).first()
    if not r:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(r, k, v)
    db.commit()
    db.refresh(r)
    return get_round(db, r.id)


def delete_round(db: Session, round_id: int) -> bool:
    r = db.query(DeliveryRound).filter(DeliveryRound.id == round_id).first()
    if not r:
        return False
    if db.query(Customer).filter(Customer.round_id == round_id).first():
        raise ValueError("Cannot delete round with assigned customers")
    db.delete(r)
    db.commit()
    return True


# ═══════════════════════════════════════════════════════
# Customers
# ═══════════════════════════════════════════════════════
def list_customers(db: Session, search: Optional[str] = None):
    q = db.query(Customer).options(joinedload(Customer.delivery_round))
    if search:
        q = q.filter(Customer.name.ilike(f"%{search}%"))
    return [_customer_to_dict(c) for c in q.order_by(Customer.name).all()]


def get_customer(db: Session, customer_id: int):
    c = (db.query(Customer)
         .options(joinedload(Customer.delivery_round))
         .filter(Customer.id == customer_id).first())
    return _customer_to_dict(c) if c else None


def create_customer(db: Session, data: CustomerCreate):
    # Auto assign ac_number
    last = db.query(func.max(Customer.ac_number)).scalar() or 0
    c = Customer(
        ac_number=last + 1,
        name=data.name,
        address=encryption.encrypt_value(data.address),
        address2=data.address2,
        phone=encryption.encrypt_value(data.phone),
        email=data.email,
        street=data.street,
        round_id=data.round_id,
        billing_cycle=data.billing_cycle,
        balance=data.balance,
        instructions=data.instructions,
        notes=data.notes,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return get_customer(db, c.id)


def update_customer(db: Session, customer_id: int, data: CustomerUpdate):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        return None
    payload = data.model_dump(exclude_unset=True)
    if "address" in payload:
        payload["address"] = encryption.encrypt_value(payload["address"])
    if "phone" in payload:
        payload["phone"] = encryption.encrypt_value(payload["phone"])
    for k, v in payload.items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return get_customer(db, c.id)


def delete_customer(db: Session, customer_id: int) -> bool:
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        return False
    if c.balance > 0:
        raise ValueError("Cannot delete customer with outstanding balance")
    db.delete(c)
    db.commit()
    return True


# ═══════════════════════════════════════════════════════
# Products
# ═══════════════════════════════════════════════════════
def list_products(db: Session, search: Optional[str] = None):
    q = db.query(Product)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%"))
    return q.order_by(Product.name).all()


def get_product(db: Session, product_id: int):
    return db.query(Product).filter(Product.id == product_id).first()


def create_product(db: Session, data: ProductCreate):
    p = Product(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def update_product(db: Session, product_id: int, data: ProductUpdate):
    p = get_product(db, product_id)
    if not p:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


def delete_product(db: Session, product_id: int) -> bool:
    p = get_product(db, product_id)
    if not p:
        return False
    db.delete(p)
    db.commit()
    return True


# ═══════════════════════════════════════════════════════
# Customer Orders
# ═══════════════════════════════════════════════════════
def list_orders(db: Session, customer_id: int) -> list:
    orders = (db.query(CustomerOrder)
              .options(joinedload(CustomerOrder.product))
              .filter(CustomerOrder.customer_id == customer_id).all())
    result = []
    for o in orders:
        days = _order_to_days(o)
        weekly_price = sum(days.values()) * o.product.price
        result.append({
            "id": o.id, "customer_id": o.customer_id,
            "product_id": o.product_id,
            "pub_name": o.product.name,
            "pub_price": o.product.price,
            "days": days,
            "weekly_price": weekly_price,
        })
    return result


def create_order(db: Session, customer_id: int, data: CustomerOrderCreate):
    existing = (db.query(CustomerOrder)
                .filter(CustomerOrder.customer_id == customer_id,
                        CustomerOrder.product_id == data.product_id).first())
    if existing:
        raise ValueError("Customer already has this publication")
    o = CustomerOrder(
        customer_id=customer_id,
        product_id=data.product_id,
        qty_sun=data.days.sun, qty_mon=data.days.mon,
        qty_tue=data.days.tue, qty_wed=data.days.wed,
        qty_thu=data.days.thu, qty_fri=data.days.fri,
        qty_sat=data.days.sat,
    )
    db.add(o)
    db.commit()
    db.refresh(o)
    return list_orders(db, customer_id)


def update_order_days(db: Session, order_id: int, days: dict) -> bool:
    o = db.query(CustomerOrder).filter(CustomerOrder.id == order_id).first()
    if not o:
        return False
    o.qty_sun = days.get("sun", o.qty_sun)
    o.qty_mon = days.get("mon", o.qty_mon)
    o.qty_tue = days.get("tue", o.qty_tue)
    o.qty_wed = days.get("wed", o.qty_wed)
    o.qty_thu = days.get("thu", o.qty_thu)
    o.qty_fri = days.get("fri", o.qty_fri)
    o.qty_sat = days.get("sat", o.qty_sat)
    db.commit()
    return True


def delete_order(db: Session, order_id: int) -> bool:
    o = db.query(CustomerOrder).filter(CustomerOrder.id == order_id).first()
    if not o:
        return False
    db.delete(o)
    db.commit()
    return True


# ═══════════════════════════════════════════════════════
# Weekly Account
# ═══════════════════════════════════════════════════════
def _is_holiday(db: Session, customer_id: int, check_date: date) -> bool:
    hold = (db.query(DeliveryHold)
            .filter(DeliveryHold.customer_id == customer_id,
                    DeliveryHold.cancelled == False,
                    DeliveryHold.start_date <= check_date,
                    DeliveryHold.end_date >= check_date).first())
    return hold is not None


def get_weekly_account(db: Session, customer_id: int) -> dict | None:
    c = (db.query(Customer)
         .options(joinedload(Customer.delivery_round))
         .filter(Customer.id == customer_id).first())
    if not c:
        return None

    week_end = _coming_saturday()
    delivery_charge = c.delivery_round.delivery_charge if c.delivery_round else 1.80

    orders = (db.query(CustomerOrder)
              .options(joinedload(CustomerOrder.product))
              .filter(CustomerOrder.customer_id == customer_id).all())

    on_holiday = _is_holiday(db, customer_id, week_end)

    papers = []
    total = 0.0
    for o in orders:
        days = _order_to_days(o)
        # If on holiday, show days but zero price contribution
        weekly_price = sum(days.values()) * o.product.price if not on_holiday else 0.0
        total += weekly_price
        papers.append({
            "order_id": o.id,
            "publication_id": o.product_id,
            "pub_name": o.product.name,
            "pub_price": o.product.price,
            "days": days,
            "weekly_price": weekly_price,
        })

    if not on_holiday:
        total += delivery_charge

    # Get received amount from weekly charge for this week
    wc = (db.query(WeeklyCharge)
          .filter(WeeklyCharge.customer_id == customer_id,
                  WeeklyCharge.week_end_date == week_end).first())

    received = wc.paid_amount if (wc and wc.paid) else 0.0
    refunded = 0.0
    outstanding = total - received + refunded

    return {
        "customer": {
            "id": c.id,
            "ac_number": c.ac_number,
            "name": c.name,
            "address1": encryption.decrypt_value(c.address) or "",
            "address2": c.address2 or "",
            "phone": encryption.decrypt_value(c.phone) or "",
            "round_name": c.delivery_round.name if c.delivery_round else "",
            "delivery_charge": delivery_charge,
        },
        "week_end_date": week_end.strftime("Sat %d/%m/%Y"),
        "week_end_iso": week_end.isoformat(),
        "papers": papers,
        "delivery_charge": delivery_charge,
        "total": round(total, 2),
        "received": round(received, 2),
        "refunded": round(refunded, 2),
        "outstanding": round(outstanding, 2),
        "on_holiday": on_holiday,
        "holiday_info": "Customer is on holiday hold this week" if on_holiday else None,
    }


def update_weekly_account(db: Session, customer_id: int, data: WeeklyAccountUpdate) -> dict | None:
    for item in data.papers:
        update_order_days(db, item.order_id, item.days.model_dump())

    # Recalculate and upsert WeeklyCharge
    week_end = _coming_saturday()
    c = (db.query(Customer)
         .options(joinedload(Customer.delivery_round))
         .filter(Customer.id == customer_id).first())
    if not c:
        return None

    delivery_charge = c.delivery_round.delivery_charge if c.delivery_round else 1.80
    orders = (db.query(CustomerOrder)
              .options(joinedload(CustomerOrder.product))
              .filter(CustomerOrder.customer_id == customer_id).all())

    on_holiday = _is_holiday(db, customer_id, week_end)
    total = delivery_charge if not on_holiday else 0.0
    for o in orders:
        if not on_holiday:
            days = _order_to_days(o)
            total += sum(days.values()) * o.product.price

    wc = (db.query(WeeklyCharge)
          .filter(WeeklyCharge.customer_id == customer_id,
                  WeeklyCharge.week_end_date == week_end).first())

    if wc:
        wc.amount = round(total, 2)
        wc.is_holiday = on_holiday
    else:
        wc = WeeklyCharge(
            customer_id=customer_id,
            week_end_date=week_end,
            amount=round(total, 2),
            is_holiday=on_holiday,
        )
        db.add(wc)

    # Update customer balance: remove old amount, add new
    db.commit()
    return get_weekly_account(db, customer_id)


# ═══════════════════════════════════════════════════════
# Payment Calendar
# ═══════════════════════════════════════════════════════
def get_payment_calendar(db: Session, customer_id: int, year: int) -> dict | None:
    c = (db.query(Customer)
         .options(joinedload(Customer.delivery_round))
         .filter(Customer.id == customer_id).first())
    if not c:
        return None

    charges = (db.query(WeeklyCharge)
               .filter(WeeklyCharge.customer_id == customer_id,
                       extract('year', WeeklyCharge.week_end_date) == year)
               .order_by(WeeklyCharge.week_end_date).all())

    today = date.today()
    current_saturday = _coming_saturday()

    # Build charge lookup
    charge_map: dict[date, WeeklyCharge] = {wc.week_end_date: wc for wc in charges}

    # Build all Saturdays for the year
    months: dict[str, list] = {
        m: [] for m in ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                         "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    }
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    # Generate every Saturday of the year
    d = date(year, 1, 1)
    while d.weekday() != 5:  # 5 = Saturday
        d += timedelta(days=1)

    total_due = 0.0
    while d.year == year:
        month_name = month_names[d.month - 1]
        wc = charge_map.get(d)
        is_current = (d == current_saturday)
        
        # Check if the week ending 'd' is a holiday
        is_holiday = _is_holiday(db, customer_id, d)

        if is_holiday:
            status = "holiday"
        elif wc:
            if wc.paid:
                status = "paid"
            elif d < today:
                status = "overdue"
                total_due += wc.amount
            elif is_current:
                status = "pending"
                if not wc.paid:
                    total_due += wc.amount
            else:
                status = "pending"
        else:
            # No charge record yet
            if d > today:
                status = "pending"
            else:
                status = "overdue"
                # No charge created — skip total

        cell = {
            "charge_id": wc.id if wc else None,
            "date_num": d.day,
            "date_iso": d.isoformat(),
            "amount": wc.amount if wc else 0.0,
            "paid": wc.paid if wc else False,
            "paid_date": wc.paid_date.isoformat() if (wc and wc.paid_date) else None,
            "is_holiday": is_holiday,
            "is_current_week": is_current,
            "status": status,
        }
        months[month_name].append(cell)
        d += timedelta(days=7)

    return {
        "customer": {
            "id": c.id,
            "ac_number": c.ac_number,
            "name": c.name,
            "address1": encryption.decrypt_value(c.address) or "",
            "phone": encryption.decrypt_value(c.phone) or "",
        },
        "year": year,
        "total_due": round(total_due, 2),
        "months": months,
    }


# ═══════════════════════════════════════════════════════
# Mark Week as Paid
# ═══════════════════════════════════════════════════════
def mark_week_paid(db: Session, data: MarkPaidRequest) -> dict:
    # Find or create weekly charge
    wc = (db.query(WeeklyCharge)
          .filter(WeeklyCharge.customer_id == data.customer_id,
                  WeeklyCharge.week_end_date == data.week_end_date).first())

    if wc and wc.paid:
        raise ValueError("This week is already marked as paid")

    if not wc:
        # Create the charge
        wc = WeeklyCharge(
            customer_id=data.customer_id,
            week_end_date=data.week_end_date,
            amount=data.paid_amount,
        )
        db.add(wc)

    wc.paid = True
    wc.paid_date = data.period_to or data.week_end_date  # Fallback to week_end_date
    wc.paid_amount = data.paid_amount

    # Create payment record
    payment = Payment(
        customer_id=data.customer_id,
        amount=data.paid_amount,
        period_from=data.period_from,
        period_to=data.period_to,
        method=data.method,
        notes=data.notes or "",
        week_end_date=data.week_end_date,
    )
    db.add(payment)

    # Update customer balance (reduce it)
    c = db.query(Customer).filter(Customer.id == data.customer_id).first()
    if c:
        c.balance = round(c.balance - data.paid_amount, 2)

    db.commit()
    db.refresh(wc)
    db.refresh(payment)

    return {
        "charge_id": wc.id,
        "payment_id": payment.id,
        "new_balance": c.balance if c else 0.0,
        "paid_amount": data.paid_amount,
    }


# ═══════════════════════════════════════════════════════
# Payments
# ═══════════════════════════════════════════════════════
def list_payments(db: Session, customer_id: int):
    return (db.query(Payment)
            .filter(Payment.customer_id == customer_id)
            .order_by(Payment.id.desc()).all())


def create_payment(db: Session, data: PaymentCreate):
    payment = Payment(**data.model_dump())
    db.add(payment)
    # Update balance
    c = db.query(Customer).filter(Customer.id == data.customer_id).first()
    if c:
        c.balance = round(c.balance - data.amount, 2)
    db.commit()
    db.refresh(payment)
    return payment


def delete_payment(db: Session, payment_id: int) -> bool:
    p = db.query(Payment).filter(Payment.id == payment_id).first()
    if not p:
        return False
    # Restore balance
    c = db.query(Customer).filter(Customer.id == p.customer_id).first()
    if c:
        c.balance = round(c.balance + p.amount, 2)
    db.delete(p)
    db.commit()
    return True


# ═══════════════════════════════════════════════════════
# Delivery Holds
# ═══════════════════════════════════════════════════════
def _hold_status(h: DeliveryHold) -> str:
    if h.cancelled:
        return "Cancelled"
    today = date.today()
    if h.start_date > today:
        return "Upcoming"
    if h.start_date <= today <= h.end_date:
        return "Active"
    return "Expired"


def list_holds(db: Session, customer_id: int):
    holds = (db.query(DeliveryHold)
             .filter(DeliveryHold.customer_id == customer_id)
             .order_by(DeliveryHold.start_date.desc()).all())
    return [{"id": h.id, "customer_id": h.customer_id,
             "start_date": h.start_date, "end_date": h.end_date,
             "reason": h.reason, "cancelled": h.cancelled,
             "status": _hold_status(h), "created_at": h.created_at}
            for h in holds]


def create_hold(db: Session, data: DeliveryHoldCreate):
    if data.end_date < data.start_date:
        raise ValueError("End date must be after start date")
    h = DeliveryHold(**data.model_dump())
    db.add(h)
    db.commit()
    db.refresh(h)
    return {"id": h.id, "customer_id": h.customer_id,
            "start_date": h.start_date, "end_date": h.end_date,
            "reason": h.reason, "cancelled": h.cancelled,
            "status": _hold_status(h), "created_at": h.created_at}


def cancel_hold(db: Session, hold_id: int) -> bool:
    h = db.query(DeliveryHold).filter(DeliveryHold.id == hold_id).first()
    if not h:
        return False
    h.cancelled = True
    db.commit()
    return True


# ═══════════════════════════════════════════════════════
# Dashboard
# ═══════════════════════════════════════════════════════
def dashboard_stats(db: Session):
    customer_count = db.query(func.count(Customer.id)).scalar() or 0
    product_count = db.query(func.count(Product.id)).scalar() or 0
    round_count = db.query(func.count(DeliveryRound.id)).scalar() or 0
    total_outstanding = db.query(func.coalesce(func.sum(Customer.balance), 0)).scalar() or 0
    customers_with_balance = (db.query(func.count(Customer.id)).filter(Customer.balance > 0).scalar() or 0)
    return {
        "customer_count": customer_count,
        "product_count": product_count,
        "round_count": round_count,
        "total_outstanding": float(total_outstanding),
        "customers_with_balance": customers_with_balance,
    }


def dashboard_analytics(db: Session):
    rounds = db.query(DeliveryRound).order_by(DeliveryRound.name).all()
    customers_by_round, balance_by_round = [], []
    for r in rounds:
        count = db.query(func.count(Customer.id)).filter(Customer.round_id == r.id).scalar() or 0
        bal = db.query(func.coalesce(func.sum(Customer.balance), 0)).filter(Customer.round_id == r.id).scalar() or 0
        customers_by_round.append({"label": r.name, "value": float(count)})
        balance_by_round.append({"label": r.name, "value": float(bal)})

    unassigned = db.query(func.count(Customer.id)).filter(Customer.round_id.is_(None)).scalar() or 0
    if unassigned:
        unassigned_bal = db.query(func.coalesce(func.sum(Customer.balance), 0)).filter(Customer.round_id.is_(None)).scalar() or 0
        customers_by_round.append({"label": "Unassigned", "value": float(unassigned)})
        balance_by_round.append({"label": "Unassigned", "value": float(unassigned_bal)})

    type_rows = db.query(Product.product_type, func.count(Product.id)).group_by(Product.product_type).all()
    products_by_type = [{"label": (t or "other").capitalize(), "value": float(c)} for t, c in type_rows]

    paid_up = db.query(func.count(Customer.id)).filter(Customer.balance == 0).scalar() or 0
    owing = db.query(func.count(Customer.id)).filter(Customer.balance > 0).scalar() or 0
    credit = db.query(func.count(Customer.id)).filter(Customer.balance < 0).scalar() or 0
    top_rows = db.query(Customer.name, Customer.balance).filter(Customer.balance > 0).order_by(Customer.balance.desc()).limit(5).all()
    top_balances = [{"name": n, "balance": float(b)} for n, b in top_rows]
    avg_price = db.query(func.avg(Product.price)).scalar()
    catalog_value = db.query(func.coalesce(func.sum(Product.price), 0)).scalar() or 0

    return {
        "customers_by_round": customers_by_round,
        "balance_by_round": balance_by_round,
        "products_by_type": products_by_type,
        "balance_status": {"paid_up": int(paid_up), "owing": int(owing), "credit": int(credit)},
        "top_balances": top_balances,
        "avg_product_price": float(avg_price or 0),
        "unassigned_customers": int(unassigned),
        "catalog_value": float(catalog_value),
    }
