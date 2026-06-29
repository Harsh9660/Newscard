from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend import crud
from backend.database import get_db
from backend.schemas import DashboardAnalytics, DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def stats(db: Session = Depends(get_db)):
    return crud.dashboard_stats(db)


@router.get("/analytics", response_model=DashboardAnalytics)
def analytics(db: Session = Depends(get_db)):
    return crud.dashboard_analytics(db)
