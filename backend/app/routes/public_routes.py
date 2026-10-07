"""Public pages (no login): the market (Soko) and prices & forecasts (Bei na utabiri)."""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..db import clean, get_db
from ..forecast import ALL_REGIONS, CROPS, NATIONAL, get_forecaster
from ..services import daily_forecast, latest_gov_price

bp = Blueprint("public", __name__, url_prefix="/api/public")

# Fields a visitor may see. Phone numbers and emails stay private until a buyer logs in.
PUBLIC_FIELDS = ["id", "crop", "variety", "quantity_kg", "quantity_available_kg", "price_per_kg", "region",
                 "district", "quality_grade", "min_order_kg", "harvest_date", "description", "status", "created_at"]


def _region(arg: str | None) -> str:
    return arg if arg in ALL_REGIONS else NATIONAL


@bp.get("/meta")
def meta():
    return jsonify(crops=CROPS, regions=ALL_REGIONS[1:], market_regions=ALL_REGIONS)


@bp.get("/listings")
def listings():
    """Available crops for sale. Filters: crop, region, q (text search)."""
    q: dict = {"status": {"$in": ["available", "partially_sold"]}}
    q["crop"] = request.args["crop"] if request.args.get("crop") in CROPS else {"$in": CROPS}
    if request.args.get("region") in ALL_REGIONS:
        q["region"] = request.args["region"]
    text = (request.args.get("q") or "").strip().lower()
    out = []
    for d in get_db().listings.find(q).sort("created_at", -1).limit(200):
        item = {k: v for k, v in clean(d).items() if k in PUBLIC_FIELDS}
        item["farmer_name"] = (d.get("farmer_name") or "").split(" ")[0]  # first name only
        gov = latest_gov_price(d["crop"], d.get("region", NATIONAL))
        item["gov_price"] = gov
        item["vs_gov_pct"] = round((d["price_per_kg"] - gov["price"]) / gov["price"] * 100, 1) if gov else None
        if text and text not in " ".join(str(item.get(k, "")) for k in ("crop", "variety", "region", "district")).lower():
            continue
        out.append(item)
    return jsonify(listings=out)


@bp.get("/prices")
def prices():
    """Official price (with source + date) and the multi-week AI forecast for every active crop."""
    region = _region(request.args.get("region"))
    ready = get_forecaster().available()
    rows = []
    for c in CROPS:
        rows.append({
            "crop": c,
            "official": latest_gov_price(c, region),
            "forecast": daily_forecast(c, region) if ready.get(c) else None,
        })
    return jsonify(region=region, crops=rows)
