"""Shared business logic: government reference prices and daily forecasts."""
from __future__ import annotations

import csv
import io
import os
from datetime import date, datetime

from .db import get_db
from .forecast import CROPS, NATIONAL, get_forecaster

BULLETIN_SOURCE = "Ministry of Agriculture - Weekly Market Bulletin (04-08 May 2026)"

# Official figures from the bulletin above (TZS per kg, wholesale).
SEED_GOV_PRICES = [
    # national averages
    {"crop": "Maize", "region": NATIONAL, "price": 800},
    {"crop": "Rice", "region": NATIONAL, "price": 2300},
    {"crop": "Beans", "region": NATIONAL, "price": 2000},
    {"crop": "Sorghum", "region": NATIONAL, "price": 1700},
    {"crop": "Bulrush Millet", "region": NATIONAL, "price": 1600},
    {"crop": "Finger Millet", "region": NATIONAL, "price": 2200},
    {"crop": "Round Potato", "region": NATIONAL, "price": 900},
    # regional highs / lows reported in the bulletin
    {"crop": "Rice", "region": "Dar es Salaam", "price": 3200},
    {"crop": "Beans", "region": "Dar es Salaam", "price": 2900},
    {"crop": "Sorghum", "region": "Katavi", "price": 2500},
    {"crop": "Sorghum", "region": "Njombe", "price": 1200},
    {"crop": "Round Potato", "region": "Arusha", "price": 1400},
    {"crop": "Round Potato", "region": "Kigoma", "price": 1400},
    {"crop": "Round Potato", "region": "Iringa", "price": 600},
    {"crop": "Round Potato", "region": "Njombe", "price": 600},
    {"crop": "Maize", "region": "Rukwa", "price": 600},
]


def seed_gov_prices() -> None:
    db = get_db()
    if db.gov_prices.count_documents({}):
        return
    now = datetime.utcnow()
    db.gov_prices.insert_many([
        {**p, "date": "2026-05-08", "unit": "TZS/kg", "source": BULLETIN_SOURCE, "created_at": now}
        for p in SEED_GOV_PRICES
    ])


def add_gov_prices(rows: list[dict], source: str) -> int:
    """rows: [{crop, region, price, date?, min_price?, max_price?}]"""
    db = get_db()
    docs = []
    for r in rows:
        crop = str(r.get("crop", "")).strip().title().replace("Bulrush millet", "Bulrush Millet")
        crop = next((c for c in CROPS if c.lower() == crop.lower()), None)
        if not crop:
            continue
        try:
            price = float(r["price"])
        except (KeyError, ValueError, TypeError):
            continue
        doc = {
            "crop": crop,
            "region": (r.get("region") or NATIONAL).strip(),
            "price": price,
            "date": (r.get("date") or date.today().isoformat())[:10],
            "unit": "TZS/kg",
            "source": r.get("source") or source,
            "created_at": datetime.utcnow(),
        }
        for k in ("min_price", "max_price"):
            if r.get(k) not in (None, ""):
                doc[k] = float(r[k])
        docs.append(doc)
    if docs:
        db.gov_prices.insert_many(docs)
        # official prices changed -> recompute today's forecasts on next request
        db.daily_forecasts.delete_many({"date": date.today().isoformat()})
    return len(docs)


def parse_csv(text: str) -> list[dict]:
    return list(csv.DictReader(io.StringIO(text)))


def latest_gov_price(crop: str, region: str) -> dict | None:
    db = get_db()
    doc = db.gov_prices.find_one({"crop": crop, "region": region}, sort=[("date", -1), ("created_at", -1)])
    if not doc and region != NATIONAL:
        doc = db.gov_prices.find_one({"crop": crop, "region": NATIONAL}, sort=[("date", -1), ("created_at", -1)])
    if not doc:
        return None
    return {
        "crop": doc["crop"],
        "region": doc["region"],
        "price": doc["price"],
        "min_price": doc.get("min_price"),
        "max_price": doc.get("max_price"),
        "date": doc["date"],
        "unit": doc.get("unit", "TZS/kg"),
        "source": doc.get("source"),
        "days_old": (date.today() - date.fromisoformat(doc["date"])).days,
    }


def observations(crop: str, region: str) -> list[dict]:
    return [
        {"date": d["date"], "price": d["price"]}
        for d in get_db().gov_prices.find({"crop": crop, "region": region})
    ]


def daily_forecast(crop: str, region: str) -> dict:
    """Today's forecast for crop/region, computed once per day and cached."""
    db = get_db()
    today = date.today().isoformat()
    cached = db.daily_forecasts.find_one({"date": today, "crop": crop, "region": region})
    if cached:
        return cached["result"]
    result = get_forecaster().forecast(crop, region, days=14, observations=observations(crop, region))
    db.daily_forecasts.update_one(
        {"date": today, "crop": crop, "region": region},
        {"$set": {"result": result, "created_at": datetime.utcnow()}},
        upsert=True,
    )
    return result


def refresh_all_daily() -> int:
    """Called by the scheduler once a day: pull official prices (if configured) and forecast."""
    url = os.getenv("GOV_PRICES_CSV_URL")
    if url:
        try:
            import requests

            text = requests.get(url, timeout=60).text
            add_gov_prices(parse_csv(text), source=f"Imported from {url}")
        except Exception as exc:  # keep going with what we have
            print("Gov price import failed:", exc)
    n = 0
    ready = get_forecaster().available()
    for crop in [c for c in CROPS if ready.get(c)]:
        try:
            daily_forecast(crop, NATIONAL)
            n += 1
        except Exception as exc:
            print("Forecast failed for", crop, exc)
    return n
