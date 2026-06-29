from decimal import Decimal
import random
from apps.customers.models import Customer
from apps.rounds.models import Round
from apps.publications.models import Publication
from apps.billing.models import WeeklyCharge, Payment
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

print("Clearing database...")
Payment.objects.all().delete()
WeeklyCharge.objects.all().delete()
Customer.objects.all().delete()
Round.objects.all().delete()
Publication.objects.all().delete()

# Get or create a superuser for created_by
user, _ = User.objects.get_or_create(username="admin", defaults={"email": "admin@example.com", "is_superuser": True})

print("Creating Morning round...")
round = Round.objects.create(name="Morning", delivery_charge=Decimal('1.50'), paperboy="Tom", created_by=user)

print("Creating publications...")
pubs = [
    ("The Times", "newspaper", Decimal('2.50')),
    ("Daily Telegraph", "newspaper", Decimal('3.00')),
    ("Financial Times", "newspaper", Decimal('3.50')),
    ("Vogue", "magazine", Decimal('4.99')),
]
for name, ptype, price in pubs:
    Publication.objects.create(name=name, type=ptype, price=price, sku=name[:3].upper(), created_by=user)

print("Creating customers...")
names = ["Alice Smith", "Bob Jones", "Charlie Brown", "David Wilson", "Eva Green", 
         "Frank Wright", "Grace Hall", "Henry King", "Ivy Lewis", "Jack Scott"]
for i, name in enumerate(names):
    Customer.objects.create(
        name=name,
        ac_number=i+100,
        address1=f"{i*10+5} Main St",
        round=round,
        balance=Decimal(random.choice(['0.00', '15.50', '25.00', '42.00', '-5.00'])),
        phone="555-1234",
        billing_cycle="weekly",
        created_by=user
    )

print("Database seeded successfully with only one 'Morning' round, multiple publications, and 10 customers!")
