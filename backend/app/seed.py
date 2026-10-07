"""Demo accounts and listings (only loaded for the in-memory DB, or when SEED_DEMO=1).

Farmer:  farmer@demo.tz / Kilimo@Tz2026!
Buyer:   buyer@demo.tz  / Kilimo@Tz2026!
(Credentials are not shown on the login page; type them in.)
"""
from __future__ import annotations

from datetime import datetime, timedelta

from werkzeug.security import generate_password_hash

from .db import get_db
from .forecast import CROPS
from .routes.auth_routes import DEFAULT_SETTINGS


ADMIN_EMAIL = "admin@agrimarket.tz"
ADMIN_PASSWORD = "Admin@Tz2026!"

# Trusted transport agencies, by mode and the regions they serve.
TRANSPORT_AGENCIES = [
    {"name": "Tanzania Road Freight", "modes": ["road"],
     "regions": ["Dar es Salaam", "Pwani", "Morogoro", "Dodoma", "Tanga", "Iringa", "Mbeya"],
     "phone": "0712100200", "email": "ops@tzroadfreight.co.tz", "verified": True, "rating": 4.7},
    {"name": "Nyanda za Juu Logistics", "modes": ["road"],
     "regions": ["Mbeya", "Iringa", "Njombe", "Songwe", "Rukwa", "Katavi"],
     "phone": "0754330440", "email": "info@nyandalogistics.co.tz", "verified": True, "rating": 4.5},
    {"name": "Lake Zone Transporters", "modes": ["road", "water"],
     "regions": ["Mwanza", "Mara", "Kagera", "Geita", "Shinyanga", "Simiyu"],
     "phone": "0768220330", "email": "bookings@lakezone.co.tz", "verified": True, "rating": 4.4},
    {"name": "Ziwa Victoria Ferries", "modes": ["water"],
     "regions": ["Mwanza", "Kagera", "Mara", "Geita"],
     "phone": "0783550660", "email": "cargo@ziwaferries.co.tz", "verified": True, "rating": 4.2},
    {"name": "Coastal Cargo", "modes": ["road", "water"],
     "regions": ["Dar es Salaam", "Tanga", "Pwani", "Lindi", "Mtwara"],
     "phone": "0715770880", "email": "hello@coastalcargo.co.tz", "verified": True, "rating": 4.6},
    {"name": "Precision Air Cargo", "modes": ["air"],
     "regions": ["Dar es Salaam", "Arusha", "Mwanza", "Mbeya", "Kilimanjaro", "Dodoma"],
     "phone": "0786010020", "email": "cargo@precisionair.co.tz", "verified": True, "rating": 4.8},
    {"name": "Central Corridor Movers", "modes": ["road"],
     "regions": ["Dodoma", "Singida", "Tabora", "Morogoro", "Manyara"],
     "phone": "0742900100", "email": "dispatch@centralcorridor.co.tz", "verified": True, "rating": 4.3},
    {"name": "Kilimanjaro Express", "modes": ["road"],
     "regions": ["Arusha", "Kilimanjaro", "Manyara", "Tanga"],
     "phone": "0769440550", "email": "support@kiliexpress.co.tz", "verified": True, "rating": 4.5},
]


def seed_transport() -> None:
    """Load the trusted transport agencies if none exist. Runs on every start."""
    db = get_db()
    if db.transport_agencies.count_documents({}):
        return
    now = datetime.utcnow()
    db.transport_agencies.insert_many([{**a, "created_at": now} for a in TRANSPORT_AGENCIES])


def seed_admin() -> None:
    """Create the single admin account if it doesn't exist. Runs on every start
    (not tied to SEED_DEMO) so the admin can always log in. Admins cannot be
    created through public registration."""
    db = get_db()
    if db.users.find_one({"email": ADMIN_EMAIL}):
        return
    db.users.insert_one({
        "full_name": "System Administrator",
        "email": ADMIN_EMAIL,
        "phone": "0700000000",
        "role": "admin",
        "password_hash": generate_password_hash(ADMIN_PASSWORD),
        "created_at": datetime.utcnow(),
        "settings": {**DEFAULT_SETTINGS},
    })


def seed_demo() -> None:
    db = get_db()
    if db.users.find_one({"email": "farmer@demo.tz"}):
        return
    now = datetime.utcnow()
    pw = generate_password_hash("Kilimo@Tz2026!")
    farmers = [
        {"full_name": "Juma Mwakalinga", "email": "farmer@demo.tz", "phone": "0712345678",
         "region": "Mbeya", "district": "Mbarali", "farm_size_acres": 12, "main_crops": ["Rice", "Maize"]},
        {"full_name": "Neema Kisanga", "email": "neema@demo.tz", "phone": "0755123456",
         "region": "Iringa", "district": "Kilolo", "farm_size_acres": 6, "main_crops": ["Maize"]},
        {"full_name": "Hassani Mbwana", "email": "hassani@demo.tz", "phone": "0688123456",
         "region": "Dodoma", "district": "Kondoa", "farm_size_acres": 8, "main_crops": ["Maize", "Rice"]},
    ]
    buyers = [
        {"full_name": "Amina Salum", "email": "buyer@demo.tz", "phone": "0766123456",
         "region": "Dar es Salaam", "district": "Kinondoni", "business_name": "Salum Grain Traders",
         "business_type": "Wholesaler", "interested_crops": ["Rice", "Maize"]},
        {"full_name": "Peter Mushi", "email": "peter@demo.tz", "phone": "0744123456",
         "region": "Arusha", "district": "Arusha City", "business_name": "Mushi Food Processors",
         "business_type": "Processor", "interested_crops": ["Maize"]},
    ]
    ids = {}
    for u in farmers:
        doc = {**u, "role": "farmer", "password_hash": pw, "created_at": now,
               "settings": {**DEFAULT_SETTINGS, "market_region": u["region"]}}
        ids[u["email"]] = db.users.insert_one(doc).inserted_id
    for u in buyers:
        doc = {**u, "role": "buyer", "password_hash": pw, "created_at": now,
               "settings": {**DEFAULT_SETTINGS, "market_region": u["region"]}}
        ids[u["email"]] = db.users.insert_one(doc).inserted_id

    listings = [
        ("farmer@demo.tz", "Juma Mwakalinga", "Rice", "Kyela aromatic", 2000, 2250, "Mbeya", "Grade A"),
        ("farmer@demo.tz", "Juma Mwakalinga", "Maize", "White, dried", 5000, 780, "Mbeya", "Grade 1"),
        ("neema@demo.tz", "Neema Kisanga", "Maize", "Yellow, dried", 3000, 820, "Iringa", "Grade 1"),
        ("hassani@demo.tz", "Hassani Mbwana", "Maize", "White, shelled", 1500, 760, "Dodoma", "Grade 2"),
        ("hassani@demo.tz", "Hassani Mbwana", "Rice", "Supa, broken 10%", 1200, 2100, "Dodoma", "Grade 2"),
        ("neema@demo.tz", "Neema Kisanga", "Rice", "Supa", 900, 2350, "Iringa", "Grade A"),
    ]
    listings = [row for row in listings if row[2] in CROPS]
    for i, (email, name, crop, variety, qty, price, region, grade) in enumerate(listings):
        db.listings.insert_one({
            "farmer_id": ids[email], "farmer_name": name, "crop": crop, "variety": variety,
            "quantity_kg": qty, "quantity_available_kg": qty, "price_per_kg": price,
            "region": region, "quality_grade": grade, "min_order_kg": 50,
            "harvest_date": (now - timedelta(days=20 + i * 5)).date().isoformat(),
            "description": f"Clean {crop.lower()}, well dried and packed in 100 kg bags.",
            "status": "available", "created_at": now - timedelta(days=i),
        })
    # one completed sale so the farmer sees a "sold / partially sold" status
    maize = db.listings.find_one({"crop": "Maize", "farmer_id": ids["farmer@demo.tz"]})
    if not maize:
        return
    db.listings.update_one({"_id": maize["_id"]}, {"$set": {"quantity_available_kg": 3000, "status": "partially_sold"}})
    db.orders.insert_one({
        "buyer_id": ids["peter@demo.tz"], "buyer_name": "Peter Mushi", "buyer_phone": "0744123456",
        "farmer_id": ids["farmer@demo.tz"], "farmer_name": "Juma Mwakalinga", "listing_id": maize["_id"],
        "crop": "Maize", "region": "Mbeya", "quantity_kg": 2000, "price_per_kg": 780, "total": 1560000,
        "payment_method": "cash_on_delivery", "delivery_note": "", "status": "confirmed",
        "created_at": now - timedelta(hours=5),
    })
