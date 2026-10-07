"""AI predictions, prediction history, government reference prices."""
from __future__ import annotations

from datetime import datetime

from flask import Blueprint, g, jsonify, request

from ..auth import login_required
from ..db import clean, get_db, oid
from ..forecast import ALL_REGIONS, CROPS, NATIONAL, get_forecaster
from ..services import daily_forecast, latest_gov_price, observations

bp = Blueprint("insights", __name__, url_prefix="/api")


def _region(arg: str | None) -> str:
    if arg in ALL_REGIONS:
        return arg
    pref = (g.user.get("settings") or {}).get("market_region") if hasattr(g, "user") else None
    return pref if pref in ALL_REGIONS else NATIONAL


@bp.get("/predictions/daily")
@login_required()
def predictions_daily():
    """Today's automatic multi-week forecast for one crop (or all crops)."""
    region = _region(request.args.get("region"))
    crops = [request.args["crop"]] if request.args.get("crop") in CROPS else CROPS
    ready = get_forecaster().available()
    results = [daily_forecast(c, region) for c in crops if ready.get(c)]
    return jsonify(region=region, forecasts=results)


@bp.post("/predictions")
@login_required()
def run_prediction():
    """Run a prediction on demand and save it to the user's history."""
    data = request.get_json(silent=True) or {}
    crop = data.get("crop")
    if crop not in CROPS:
        return jsonify(error="Select a crop."), 400
    if not get_forecaster().available().get(crop):
        return jsonify(error=f"No trained model for {crop} yet."), 400
    region = _region(data.get("region"))
    days = int(data.get("days") or 7)
    result = get_forecaster().forecast(crop, region, days=days, observations=observations(crop, region))
    quantity = data.get("quantity_kg")
    if quantity:
        q = float(quantity)
        result["quantity_kg"] = q
        result["expected_revenue_today"] = round(q * result["current_price"], 0)
        result["expected_revenue_best_day"] = round(q * result["best_day_to_sell"]["price"], 0)
    doc = {
        "user_id": g.user["_id"],
        "role": g.user["role"],
        "crop": crop,
        "region": result["region"],
        "days": days,
        "result": result,
        "created_at": datetime.utcnow(),
    }
    doc["_id"] = get_db().predictions.insert_one(doc).inserted_id
    return jsonify(prediction=clean(doc)), 201


@bp.get("/predictions/history")
@login_required()
def prediction_history():
    db = get_db()
    q = {"user_id": g.user["_id"]}
    if request.args.get("crop") in CROPS:
        q["crop"] = request.args["crop"]
    rows = list(db.predictions.find(q).sort("created_at", -1).limit(100))
    fc = get_forecaster()
    out = []
    for r in rows:
        item = clean(r)
        # compare past predictions with what actually happened (where known)
        s = fc.series(r["crop"], r["region"], observations(r["crop"], r["region"]))
        checked = []
        for p in r["result"]["forecast"]:
            ts = datetime.fromisoformat(p["date"])
            if ts <= s.index[-1] and ts >= s.index[0]:
                actual = float(s.loc[ts.strftime("%Y-%m-%d")])
                checked.append(abs(p["price"] - actual) / actual * 100)
        item["accuracy_checked_days"] = len(checked)
        item["mean_error_pct"] = round(sum(checked) / len(checked), 2) if checked else None
        out.append(item)
    return jsonify(history=out)


@bp.delete("/predictions/<pid>")
@login_required()
def delete_prediction(pid):
    get_db().predictions.delete_one({"_id": oid(pid), "user_id": g.user["_id"]})
    return jsonify(ok=True)


@bp.get("/gov-prices")
@login_required()
def gov_prices():
    region = _region(request.args.get("region"))
    crops = [request.args["crop"]] if request.args.get("crop") in CROPS else CROPS
    rows = []
    ready = get_forecaster().available()
    for c in crops:
        p = latest_gov_price(c, region)
        fc = daily_forecast(c, region) if ready.get(c) else None
        rows.append({"crop": c, "official": p,
                     "market_today": fc["current_price"] if fc else None,
                     "ai_tomorrow": fc["forecast"][0]["price"] if fc else None,
                     "trend": fc["trend"] if fc else "stable"})
    return jsonify(region=region, prices=rows)


@bp.get("/gov-prices/history")
@login_required()
def gov_price_history():
    crop = request.args.get("crop")
    if crop not in CROPS:
        return jsonify(error="Select a crop."), 400
    rows = get_db().gov_prices.find({"crop": crop}).sort("date", -1).limit(200)
    return jsonify(history=[clean(r) for r in rows])
