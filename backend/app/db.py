"""Database connection.

- If MONGO_URL is set (e.g. MongoDB Atlas), the real database is used.
- Otherwise an in-memory MongoDB (mongomock) is used so the app runs with zero
  setup. In-memory data is lost when the server restarts, so set MONGO_URL for
  anything real.
"""
from __future__ import annotations

import os

from bson import ObjectId

_db = None
USING_MEMORY_DB = False


def get_db():
    global _db, USING_MEMORY_DB
    if _db is not None:
        return _db
    url = os.getenv("MONGO_URL") or os.getenv("MONGO_URI")
    name = os.getenv("MONGO_DB_NAME", "agri_market_ai")
    if url:
        try:
            from pymongo import MongoClient

            client = MongoClient(url, serverSelectionTimeoutMS=8000)
            client.admin.command("ping")   # fail fast if MongoDB is not reachable
            _db = client[name]
            print(f"Connected to MongoDB ({name}).")
        except Exception as exc:
            # MongoDB was requested but is not reachable: don't crash, fall back
            # to the in-memory DB so the app still runs (data is not persisted).
            print(f"WARNING: could not connect to MongoDB ({exc}). "
                  "Falling back to in-memory DB. Start MongoDB and restart to persist data.")
            import mongomock

            USING_MEMORY_DB = True
            _db = mongomock.MongoClient()[name]
    else:
        import mongomock

        USING_MEMORY_DB = True
        _db = mongomock.MongoClient()[name]
    _ensure_indexes(_db)
    return _db


def _ensure_indexes(db) -> None:
    db.users.create_index("email", unique=True)
    db.listings.create_index([("farmer_id", 1), ("created_at", -1)])
    db.listings.create_index([("status", 1), ("crop", 1)])
    db.cart_items.create_index([("buyer_id", 1), ("listing_id", 1)], unique=True)
    db.orders.create_index("buyer_id")
    db.orders.create_index("farmer_id")
    db.predictions.create_index([("user_id", 1), ("created_at", -1)])
    db.daily_forecasts.create_index([("date", 1), ("crop", 1), ("region", 1)], unique=True)
    db.gov_prices.create_index([("crop", 1), ("region", 1), ("date", -1)])


def oid(value) -> ObjectId | None:
    try:
        return ObjectId(str(value))
    except Exception:
        return None


def clean(doc: dict | None) -> dict | None:
    """Convert a Mongo document to JSON-friendly dict (ObjectId -> str)."""
    if doc is None:
        return None
    out = {}
    for k, v in doc.items():
        if k == "password_hash":
            continue
        if isinstance(v, ObjectId):
            v = str(v)
        elif hasattr(v, "isoformat"):
            v = v.isoformat()
        elif isinstance(v, dict):
            v = clean(v)
        elif isinstance(v, list):
            v = [clean(x) if isinstance(x, dict) else (str(x) if isinstance(x, ObjectId) else x) for x in v]
        out["id" if k == "_id" else k] = v
    return out
