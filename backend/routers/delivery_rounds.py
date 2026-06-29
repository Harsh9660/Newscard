from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend import crud
from backend.database import get_db
from backend.schemas import DeliveryRoundCreate, DeliveryRoundOut, DeliveryRoundUpdate

router = APIRouter(prefix="/api/delivery-rounds", tags=["delivery-rounds"])


@router.get("", response_model=list[DeliveryRoundOut])
def list_rounds(db: Session = Depends(get_db)):
    return crud.list_rounds(db)


@router.get("/{round_id}", response_model=DeliveryRoundOut)
def get_round(round_id: int, db: Session = Depends(get_db)):
    row = crud.get_round(db, round_id)
    if not row:
        raise HTTPException(404, "Delivery round not found")
    return row


@router.post("", response_model=DeliveryRoundOut, status_code=201)
def create_round(data: DeliveryRoundCreate, db: Session = Depends(get_db)):
    return crud.create_round(db, data)


@router.put("/{round_id}", response_model=DeliveryRoundOut)
def update_round(
    round_id: int, data: DeliveryRoundUpdate, db: Session = Depends(get_db)
):
    row = crud.update_round(db, round_id, data)
    if not row:
        raise HTTPException(404, "Delivery round not found")
    return row


@router.delete("/{round_id}", status_code=204)
def delete_round(round_id: int, db: Session = Depends(get_db)):
    try:
        if not crud.delete_round(db, round_id):
            raise HTTPException(404, "Delivery round not found")
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
