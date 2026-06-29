"""Load sample data for demos. Run: py -V:3.13 seed_demo.py"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from backend.database import Base, SessionLocal, engine
from backend import crud
from backend.schemas import CustomerCreate, DeliveryRoundCreate, ProductCreate

Base.metadata.create_all(bind=engine)
db = SessionLocal()

r1 = crud.create_round(db, DeliveryRoundCreate(name="Morning Round A", round_type="morning", paperboy="Tom"))
r2 = crud.create_round(db, DeliveryRoundCreate(name="Evening Round B", round_type="evening", paperboy="Sarah"))

crud.create_product(
    db, ProductCreate(name="The Daily Herald", product_type="newspaper", price=1.2, supplier="NewsUK")
)
crud.create_product(
    db, ProductCreate(name="Sunday Times", product_type="newspaper", price=3.5, supplier="NewsUK")
)

crud.create_customer(
    db,
    CustomerCreate(
        name="Jane Smith",
        address="12 Oak Avenue",
        phone="07700900123",
        street="Oak Avenue",
        round_id=r1["id"],
        balance=15.5,
    ),
)
crud.create_customer(
    db,
    CustomerCreate(
        name="Bob Jones",
        address="5 Elm Street",
        phone="07700900456",
        street="Elm Street",
        round_id=r2["id"],
        balance=0,
    ),
)

db.close()
print("Demo data loaded.")
