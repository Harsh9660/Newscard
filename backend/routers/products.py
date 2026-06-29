from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend import crud
from backend.database import get_db
from backend.schemas import ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=list[ProductOut])
def list_products(search: str | None = Query(None), db: Session = Depends(get_db)):
    return crud.list_products(db, search)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    row = crud.get_product(db, product_id)
    if not row:
        raise HTTPException(404, "Product not found")
    return row


@router.post("", response_model=ProductOut, status_code=201)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db, data)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int, data: ProductUpdate, db: Session = Depends(get_db)
):
    row = crud.update_product(db, product_id, data)
    if not row:
        raise HTTPException(404, "Product not found")
    return row


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    if not crud.delete_product(db, product_id):
        raise HTTPException(404, "Product not found")
