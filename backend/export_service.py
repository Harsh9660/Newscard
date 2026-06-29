import csv
import json
from datetime import date, datetime
from io import BytesIO
from pathlib import Path

from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from backend import crud
from backend.config import EXPORTS_DIR


def _export_path_for_today() -> Path:
    today = date.today()
    folder = EXPORTS_DIR / str(today.year) / f"{today.month:02d}" / f"{today.day:02d}"
    folder.mkdir(parents=True, exist_ok=True)
    return folder / "daily_summary.json"


def run_daily_export(db: Session) -> Path:
    summary = {
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "date": date.today().isoformat(),
        "dashboard": crud.dashboard_stats(db),
        "customers": crud.list_customers(db),
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "product_type": p.product_type,
                "price": p.price,
                "supplier": p.supplier,
            }
            for p in crud.list_products(db)
        ],
        "delivery_rounds": crud.list_rounds(db),
    }
    path = _export_path_for_today()
    path.write_text(json.dumps(summary, indent=2, default=str), encoding="utf-8")
    return path


def extract_now(db: Session) -> Path:
    return run_daily_export(db)


def export_csv(db: Session, entity: str) -> str:
    desktop = Path.home() / "Desktop"
    desktop.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = desktop / f"newscard_{entity}_{ts}.csv"

    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if entity == "customers":
            writer.writerow(
                ["ID", "Name", "Address", "Phone", "Email", "Balance", "Street", "Round"]
            )
            for c in crud.list_customers(db):
                writer.writerow(
                    [
                        c["id"],
                        c["name"],
                        c["address"],
                        c["phone"],
                        c["email"],
                        c["balance"],
                        c["street"],
                        c.get("round_name"),
                    ]
                )
        elif entity == "products":
            writer.writerow(["ID", "Name", "Type", "Price", "Supplier", "SKU"])
            for p in crud.list_products(db):
                writer.writerow(
                    [p.id, p.name, p.product_type, p.price, p.supplier, p.sku]
                )
        else:
            writer.writerow(["ID", "Name", "Type", "Paperboy", "Customers"])
            for r in crud.list_rounds(db):
                writer.writerow(
                    [r["id"], r["name"], r["round_type"], r["paperboy"], r["customer_count"]]
                )
    return str(path)


def export_excel(db: Session, entity: str) -> str:
    desktop = Path.home() / "Desktop"
    desktop.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = desktop / f"newscard_{entity}_{ts}.xlsx"

    wb = Workbook()
    ws = wb.active
    ws.title = entity.capitalize()

    if entity == "customers":
        ws.append(["ID", "Name", "Address", "Phone", "Balance", "Round"])
        for c in crud.list_customers(db):
            ws.append(
                [
                    c["id"],
                    c["name"],
                    c["address"],
                    c["phone"],
                    c["balance"],
                    c.get("round_name"),
                ]
            )
    elif entity == "products":
        ws.append(["ID", "Name", "Type", "Price", "Supplier"])
        for p in crud.list_products(db):
            ws.append([p.id, p.name, p.product_type, p.price, p.supplier])
    else:
        ws.append(["ID", "Name", "Type", "Paperboy", "Customers"])
        for r in crud.list_rounds(db):
            ws.append(
                [r["id"], r["name"], r["round_type"], r["paperboy"], r["customer_count"]]
            )

    wb.save(path)
    return str(path)


def export_pdf(db: Session, entity: str, title: str) -> str:
    desktop = Path.home() / "Desktop"
    desktop.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = desktop / f"newscard_{entity}_{ts}.pdf"

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 50
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, f"NEWSCARD — {title}")
    y -= 30
    c.setFont("Helvetica", 10)

    lines: list[str] = []
    if entity == "customers":
        for row in crud.list_customers(db):
            lines.append(
                f"{row['id']}: {row['name']} | Balance: {row['balance']:.2f} | {row.get('round_name') or 'No round'}"
            )
    elif entity == "products":
        for p in crud.list_products(db):
            lines.append(f"{p.id}: {p.name} — £{p.price:.2f} ({p.product_type})")
    else:
        for r in crud.list_rounds(db):
            lines.append(
                f"{r['id']}: {r['name']} ({r['round_type']}) — {r['customer_count']} customers"
            )

    for line in lines[:80]:
        if y < 50:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 10)
        c.drawString(50, y, line[:100])
        y -= 14

    c.save()
    buffer.seek(0)
    path.write_bytes(buffer.read())
    return str(path)
