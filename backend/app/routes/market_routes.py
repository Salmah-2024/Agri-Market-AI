"""Listings (farmer crops), buyers, cart, checkout and orders."""
from __future__ import annotations

from datetime import datetime

from flask import Blueprint, g, jsonify, request

from ..auth import login_required
from ..db import clean, get_db, oid
from ..forecast import CROPS
from ..services import latest_gov_price

bp = Blueprint("market", __name__, url_prefix="/api")

LISTING_FIELDS = ["crop", "variety", "quantity_kg", "price_per_kg", "region", "district",
                  "harvest_date", "quality_grade", "description", "min_order_kg"]


def listing_out(doc: dict, with_farmer: bool = False) -> dict:
    out = clean(doc)
    gov = latest_gov_price(doc["crop"], doc.get("region", "National"))
    out["gov_price"] = gov
    if gov:
        out["vs_gov_pct"] = round((doc["price_per_kg"] - gov["price"]) / gov["price"] * 100, 1)
    if with_farmer:
        f = get_db().users.find_one({"_id": doc["farmer_id"]})
        out["farmer"] = {k: f.get(k) for k in ("full_name", "phone", "region", "district")} if f else None
    return out


def _validate_listing(data: dict, partial: bool = False) -> tuple[dict, dict]:
    errors, doc = {}, {}
    for f in LISTING_FIELDS:
        if f in data and data[f] not in (None, ""):
            doc[f] = data[f]
    if not partial or "crop" in doc:
        if doc.get("crop") not in CROPS:
            errors["crop"] = "Chagua zao."
    for f in ("quantity_kg", "price_per_kg"):
        if not partial or f in doc:
            try:
                doc[f] = float(doc[f])
                if doc[f] <= 0:
                    raise ValueError
            except (KeyError, ValueError, TypeError):
                errors[f] = "Weka namba kubwa kuliko 0."
    if "min_order_kg" in doc:
        try:
            doc["min_order_kg"] = float(doc["min_order_kg"])
        except (ValueError, TypeError):
            errors["min_order_kg"] = "Weka namba."
    if not partial and not doc.get("region"):
        errors["region"] = "Chagua mkoa ambako zao lipo."
    return doc, errors


# ---------------- Farmer: my crops ----------------
@bp.post("/listings")
@login_required("farmer")
def create_listing():
    doc, errors = _validate_listing(request.get_json(silent=True) or {})
    if errors:
        return jsonify(error="Tafadhali rekebisha sehemu zilizoangaziwa.", fields=errors), 400
    doc.update({
        "farmer_id": g.user["_id"],
        "farmer_name": g.user.get("full_name"),
        "quantity_available_kg": doc["quantity_kg"],
        "status": "available",
        "created_at": datetime.utcnow(),
    })
    doc["_id"] = get_db().listings.insert_one(doc).inserted_id
    return jsonify(listing=listing_out(doc)), 201


@bp.get("/listings/mine")
@login_required("farmer")
def my_listings():
    db = get_db()
    out = []
    for d in db.listings.find({"farmer_id": g.user["_id"]}).sort("created_at", -1):
        item = listing_out(d)
        item["orders"] = [clean(o) for o in db.orders.find({"listing_id": d["_id"]}).sort("created_at", -1)]
        item["in_carts"] = db.cart_items.count_documents({"listing_id": d["_id"]})
        out.append(item)
    return jsonify(listings=out)


@bp.put("/listings/<lid>")
@login_required("farmer")
def update_listing(lid):
    db = get_db()
    doc = db.listings.find_one({"_id": oid(lid), "farmer_id": g.user["_id"]})
    if not doc:
        return jsonify(error="Tangazo halikupatikana."), 404
    data = request.get_json(silent=True) or {}
    updates, errors = _validate_listing(data, partial=True)
    if errors:
        return jsonify(error="Tafadhali rekebisha sehemu zilizoangaziwa.", fields=errors), 400
    if "quantity_kg" in updates:
        sold = doc["quantity_kg"] - doc["quantity_available_kg"]
        if updates["quantity_kg"] < sold:
            return jsonify(error=f"Tayari umeuza kg {sold:g}."), 400
        updates["quantity_available_kg"] = updates["quantity_kg"] - sold
    status = data.get("status")
    if status in ("available", "sold", "withdrawn"):
        updates["status"] = status
        if status == "sold":
            updates["sold_at"] = datetime.utcnow()
    elif "quantity_available_kg" in updates and doc["status"] != "withdrawn":
        updates["status"] = _status_for(updates["quantity_available_kg"], updates.get("quantity_kg", doc["quantity_kg"]))
    updates["updated_at"] = datetime.utcnow()
    db.listings.update_one({"_id": doc["_id"]}, {"$set": updates})
    return jsonify(listing=listing_out(db.listings.find_one({"_id": doc["_id"]})))


@bp.delete("/listings/<lid>")
@login_required("farmer")
def delete_listing(lid):
    db = get_db()
    doc = db.listings.find_one({"_id": oid(lid), "farmer_id": g.user["_id"]})
    if not doc:
        return jsonify(error="Tangazo halikupatikana."), 404
    if db.orders.count_documents({"listing_id": doc["_id"]}):
        db.listings.update_one({"_id": doc["_id"]}, {"$set": {"status": "withdrawn"}})
    else:
        db.listings.delete_one({"_id": doc["_id"]})
    db.cart_items.delete_many({"listing_id": doc["_id"]})
    return jsonify(ok=True)


@bp.get("/buyers")
@login_required("farmer")
def buyers():
    db = get_db()
    q = {"role": "buyer"}
    if request.args.get("region"):
        q["region"] = request.args["region"]
    my_ids = [d["_id"] for d in db.listings.find({"farmer_id": g.user["_id"]}, {"_id": 1})]
    out = []
    for b in db.users.find(q).sort("created_at", -1):
        item = {k: b.get(k) for k in ("full_name", "business_name", "business_type", "region",
                                      "district", "phone", "email", "interested_crops")}
        item["id"] = str(b["_id"])
        item["orders_with_you"] = db.orders.count_documents({"buyer_id": b["_id"], "farmer_id": g.user["_id"]})
        item["in_cart_with_you"] = db.cart_items.count_documents({"buyer_id": b["_id"], "listing_id": {"$in": my_ids}})
        out.append(item)
    return jsonify(buyers=out)


@bp.get("/orders/farmer")
@login_required("farmer")
def farmer_orders():
    rows = get_db().orders.find({"farmer_id": g.user["_id"]}).sort("created_at", -1)
    return jsonify(orders=[clean(o) for o in rows])


@bp.put("/orders/<order_id>/status")
@login_required("farmer")
def set_order_status(order_id):
    status = (request.get_json(silent=True) or {}).get("status")
    if status not in ("confirmed", "delivered", "cancelled"):
        return jsonify(error="Hali si sahihi."), 400
    db = get_db()
    order = db.orders.find_one({"_id": oid(order_id), "farmer_id": g.user["_id"]})
    if not order:
        return jsonify(error="Agizo halikupatikana."), 404
    if order["status"] == "cancelled":
        return jsonify(error="Agizo tayari limeghairiwa."), 400
    if status == "cancelled":  # return quantity to listing
        listing = db.listings.find_one({"_id": order["listing_id"]})
        if listing:
            avail = listing["quantity_available_kg"] + order["quantity_kg"]
            db.listings.update_one({"_id": listing["_id"]}, {"$set": {
                "quantity_available_kg": avail, "status": _status_for(avail, listing["quantity_kg"])}})
    db.orders.update_one({"_id": order["_id"]}, {"$set": {"status": status, "updated_at": datetime.utcnow()}})
    return jsonify(order=clean(db.orders.find_one({"_id": order["_id"]})))


def _status_for(available: float, total: float) -> str:
    if available <= 0:
        return "sold"
    if available < total:
        return "partially_sold"
    return "available"


# ---------------- Buyer: marketplace ----------------
@bp.get("/listings")
@login_required()
def browse():
    q: dict = {"status": {"$in": ["available", "partially_sold"]}}
    if request.args.get("include_sold") == "1":
        q["status"] = {"$in": ["available", "partially_sold", "sold"]}
    q["crop"] = request.args["crop"] if request.args.get("crop") in CROPS else {"$in": CROPS}
    if request.args.get("region"):
        q["region"] = request.args["region"]
    rows = get_db().listings.find(q).sort("created_at", -1).limit(200)
    return jsonify(listings=[listing_out(d, with_farmer=True) for d in rows])


@bp.get("/cart")
@login_required("buyer")
def get_cart():
    db = get_db()
    items = []
    for c in db.cart_items.find({"buyer_id": g.user["_id"]}).sort("added_at", -1):
        listing = db.listings.find_one({"_id": c["listing_id"]})
        if not listing:
            continue
        item = clean(c)
        item["listing"] = listing_out(listing, with_farmer=True)
        item["subtotal"] = round(c["quantity_kg"] * listing["price_per_kg"], 0)
        item["problem"] = None
        if listing["status"] not in ("available", "partially_sold"):
            item["problem"] = "Haipatikani tena"
        elif c["quantity_kg"] > listing["quantity_available_kg"]:
            item["problem"] = f"Zimebaki kg {listing['quantity_available_kg']:g} tu"
        items.append(item)
    total = sum(i["subtotal"] for i in items if not i["problem"])
    return jsonify(items=items, total=total, count=len(items))


@bp.post("/cart")
@login_required("buyer")
def add_to_cart():
    data = request.get_json(silent=True) or {}
    db = get_db()
    listing = db.listings.find_one({"_id": oid(data.get("listing_id"))})
    if not listing or listing["status"] not in ("available", "partially_sold"):
        return jsonify(error="Zao hili halipatikani tena."), 404
    try:
        qty = float(data.get("quantity_kg"))
    except (TypeError, ValueError):
        return jsonify(error="Weka kiasi kwa kg."), 400
    if qty <= 0 or qty > listing["quantity_available_kg"]:
        return jsonify(error=f"Kiasi lazima kiwe kati ya 1 na kg {listing['quantity_available_kg']:g}."), 400
    if listing.get("min_order_kg") and qty < listing["min_order_kg"]:
        return jsonify(error=f"Agizo la chini ni kg {listing['min_order_kg']:g}."), 400
    db.cart_items.update_one(
        {"buyer_id": g.user["_id"], "listing_id": listing["_id"]},
        {"$set": {"quantity_kg": qty, "added_at": datetime.utcnow()}},
        upsert=True,
    )
    return get_cart()


@bp.patch("/cart/<item_id>")
@login_required("buyer")
def update_cart_item(item_id):
    data = request.get_json(silent=True) or {}
    db = get_db()
    item = db.cart_items.find_one({"_id": oid(item_id), "buyer_id": g.user["_id"]})
    if not item:
        return jsonify(error="Bidhaa haipo kikapuni."), 404
    listing = db.listings.find_one({"_id": item["listing_id"]})
    try:
        qty = float(data.get("quantity_kg"))
    except (TypeError, ValueError):
        return jsonify(error="Weka kiasi kwa kg."), 400
    if qty <= 0 or (listing and qty > listing["quantity_available_kg"]):
        return jsonify(error="Kiasi hakipatikani."), 400
    db.cart_items.update_one({"_id": item["_id"]}, {"$set": {"quantity_kg": qty}})
    return get_cart()


@bp.delete("/cart/<item_id>")
@login_required("buyer")
def remove_cart_item(item_id):
    get_db().cart_items.delete_one({"_id": oid(item_id), "buyer_id": g.user["_id"]})
    return get_cart()


@bp.post("/cart/checkout")
@login_required("buyer")
def checkout():
    db = get_db()
    data = request.get_json(silent=True) or {}
    items = list(db.cart_items.find({"buyer_id": g.user["_id"]}))
    if not items:
        return jsonify(error="Kikapu chako hakina kitu."), 400
    orders, skipped = [], []
    for c in items:
        listing = db.listings.find_one({"_id": c["listing_id"]})
        if (not listing or listing["status"] not in ("available", "partially_sold")
                or c["quantity_kg"] > listing["quantity_available_kg"]):
            skipped.append(str(c["_id"]))
            continue
        avail = listing["quantity_available_kg"] - c["quantity_kg"]
        # conditional update guards against two buyers taking the same stock
        res = db.listings.update_one(
            {"_id": listing["_id"], "quantity_available_kg": listing["quantity_available_kg"]},
            {"$set": {"quantity_available_kg": avail, "status": _status_for(avail, listing["quantity_kg"]),
                      **({"sold_at": datetime.utcnow()} if avail <= 0 else {})}},
        )
        if res.modified_count == 0:
            skipped.append(str(c["_id"]))
            continue
        order = {
            "buyer_id": g.user["_id"],
            "buyer_name": g.user.get("full_name"),
            "buyer_phone": g.user.get("phone"),
            "farmer_id": listing["farmer_id"],
            "farmer_name": listing.get("farmer_name"),
            "listing_id": listing["_id"],
            "crop": listing["crop"],
            "region": listing.get("region"),
            "quantity_kg": c["quantity_kg"],
            "price_per_kg": listing["price_per_kg"],
            "total": round(c["quantity_kg"] * listing["price_per_kg"], 0),
            "delivery_note": data.get("delivery_note", ""),
            "payment_method": data.get("payment_method", "cash_on_delivery"),
            "status": "pending",
            "created_at": datetime.utcnow(),
        }
        order["_id"] = db.orders.insert_one(order).inserted_id
        db.cart_items.delete_one({"_id": c["_id"]})
        orders.append(clean(order))
    if not orders:
        return jsonify(error="Hakuna bidhaa iliyoweza kuagizwa - angalia upatikanaji.", skipped=skipped), 409
    return jsonify(orders=orders, skipped=skipped), 201


@bp.get("/orders/buyer")
@login_required("buyer")
def buyer_orders():
    rows = get_db().orders.find({"buyer_id": g.user["_id"]}).sort("created_at", -1)
    return jsonify(orders=[clean(o) for o in rows])
