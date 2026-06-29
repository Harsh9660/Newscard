from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend import crud
from backend.database import get_db
from backend.schemas import CustomerCreate, CustomerOut, CustomerUpdate

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("", response_model=list[CustomerOut])
def list_customers(search: str | None = Query(None), db: Session = Depends(get_db)):
    return crud.list_customers(db, search)


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    row = crud.get_customer(db, customer_id)
    if not row:
        raise HTTPException(404, "Customer not found")
    return row


@router.post("", response_model=CustomerOut, status_code=201)
def create_customer(data: CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db, data)


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int, data: CustomerUpdate, db: Session = Depends(get_db)
):
    row = crud.update_customer(db, customer_id, data)
    if not row:
        raise HTTPException(404, "Customer not found")
    return row


@router.delete("/{customer_id}", status_code=204)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    if not crud.delete_customer(db, customer_id):
        raise HTTPException(404, "Customer not found")
