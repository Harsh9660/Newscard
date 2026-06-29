from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from backend.database import SessionLocal
from backend.export_service import run_daily_export

_scheduler: BackgroundScheduler | None = None


def _nightly_job():
    db = SessionLocal()
    try:
        run_daily_export(db)
    finally:
        db.close()


def start_scheduler():
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        _nightly_job,
        CronTrigger(hour=22, minute=0),
        id="daily_export",
        replace_existing=True,
    )
    _scheduler.start()


def shutdown_scheduler():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
