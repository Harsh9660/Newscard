from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.export_service import export_csv, export_excel, export_pdf, extract_now
from backend.schemas import ExtractResponse

router = APIRouter(prefix="/api", tags=["export"])


@router.post("/extract", response_model=ExtractResponse)
def extract_data(db: Session = Depends(get_db)):
    path = extract_now(db)
    return ExtractResponse(
        success=True,
        path=str(path),
        message=f"Daily export saved to {path}",
    )


@router.post("/save")
def quick_save(db: Session = Depends(get_db)):
    path = extract_now(db)
    return {"success": True, "path": str(path), "message": "Data snapshot saved"}


@router.get("/export/csv")
def get_csv(entity: str = Query("customers"), db: Session = Depends(get_db)):
    if entity not in ("customers", "products", "rounds"):
        raise HTTPException(400, "Invalid entity")
    path = export_csv(db, entity)
    return {"path": path, "message": f"Saved to {path}"}


@router.get("/export/excel")
def get_excel(entity: str = Query("customers"), db: Session = Depends(get_db)):
    if entity not in ("customers", "products", "rounds"):
        raise HTTPException(400, "Invalid entity")
    path = export_excel(db, entity)
    return {"path": path, "message": f"Saved to {path}"}


@router.get("/export/pdf")
def get_pdf(entity: str = Query("customers"), db: Session = Depends(get_db)):
    if entity not in ("customers", "products", "rounds"):
        raise HTTPException(400, "Invalid entity")
    titles = {
        "customers": "Customer List",
        "products": "Publications",
        "rounds": "Delivery Rounds",
    }
    path = export_pdf(db, entity, titles[entity])
    return {"path": path, "message": f"Saved to {path}"}
