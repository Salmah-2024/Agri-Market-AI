"""Admin-only endpoints: add government indicative prices, view users, stats.

Auth: the admin logs in normally and gets a JWT with role "admin" (login_required
checks it). The gov-prices endpoint also still accepts the legacy X-Admin-Key
header so scripts / CSV imports keep working.
"""
from __future__ import annotations

import os

import jwt
from flask import Blueprint, g, jsonify, request

from ..auth import SECRET, login_required
from ..db import clean, get_db
from ..services import add_gov_prices, parse_csv

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _admin_via_key_or_jwt() -> bool:
    key = os.getenv("ADMIN_KEY")
    if key and request.headers.get("X-Admin-Key") == key:
        return True
    header = request.headers.get("Authorization", "")
    token = header[7:] if header.startswith("Bearer ") else None
    if token:
        try:
            return jwt.decode(token, SECRET, algorithms=["HS256"]).get("role") == "admin"
        except jwt.InvalidTokenError:
            return False
    return False


@bp.post("/gov-prices")
def add_prices():
    """Add official indicative prices (bei elekezi).
    JSON {"source": "...", "prices": [{crop, region, price, date}]} or CSV text
    with columns crop,region,price,date[,min_price,max_price]."""
    if not _admin_via_key_or_jwt():
        return jsonify(error="Unahitaji ruhusa ya msimamizi."), 403
    if request.is_json:
        body = request.get_json()
        rows, source = body.get("prices", []), body.get("source", "Ministry market bulletin")
    else:
        rows, source = parse_csv(request.get_data(as_text=True)), "CSV upload"
    return jsonify(added=add_gov_prices(rows, source)), 201


@bp.get("/users")
@login_required("admin")
def list_users():
    """All registered farmers and buyers."""
    db = get_db()
    users = []
    for u in db.users.find({"role": {"$in": ["farmer", "buyer"]}}).sort("created_at", -1):
        item = clean(u)
        item.pop("settings", None)
        users.append(item)
    farmers = [u for u in users if u["role"] == "farmer"]
    buyers = [u for u in users if u["role"] == "buyer"]
    return jsonify(users=users, farmers=farmers, buyers=buyers,
                   counts={"farmers": len(farmers), "buyers": len(buyers)})


@bp.get("/stats")
@login_required("admin")
def stats():
    db = get_db()
    return jsonify(
        farmers=db.users.count_documents({"role": "farmer"}),
        buyers=db.users.count_documents({"role": "buyer"}),
        listings=db.listings.count_documents({}),
        orders=db.orders.count_documents({}),
        gov_prices=db.gov_prices.count_documents({}),
    )
