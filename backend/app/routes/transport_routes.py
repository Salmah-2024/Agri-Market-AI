"""Transportation: the buyer picks a mode (road/air/water) and a trusted agency
serving the pickup region, requests a shipment for an order, tracks its status
and sees the agency's contact. The seller (farmer) marks it dispatched/delivered.
"""
from __future__ import annotations

from datetime import datetime

from flask import Blueprint, g, jsonify, request

from ..auth import login_required
from ..db import clean, get_db, oid

bp = Blueprint("transport", __name__, url_prefix="/api/transport")

MODES = ("road", "air", "water")
STATUSES = ("requested", "dispatched", "delivered", "cancelled")


def agency_out(a: dict) -> dict:
    return {k: a.get(k) for k in ("name", "phone", "email", "verified", "rating")} | {"id": str(a["_id"])}


@bp.get("/agencies")
@login_required()
def agencies():
    """Trusted agencies serving a region (and optionally a transport mode)."""
    q: dict = {}
    if request.args.get("region"):
        q["regions"] = request.args["region"]
    if request.args.get("mode") in MODES:
        q["modes"] = request.args["mode"]
    rows = get_db().transport_agencies.find(q).sort("rating", -1)
    out = []
    for a in rows:
        item = clean(a)
        item["id"] = str(a["_id"])
        out.append(item)
    return jsonify(agencies=out)


@bp.post("/request")
@login_required("buyer")
def request_transport():
    data = request.get_json(silent=True) or {}
    db = get_db()
    order = db.orders.find_one({"_id": oid(data.get("order_id")), "buyer_id": g.user["_id"]})
    if not order:
        return jsonify(error="Order not found."), 404
    if order.get("status") not in ("confirmed", "delivered"):
        return jsonify(error="The farmer must approve this order before you can request transport."), 409
    mode = data.get("mode")
    if mode not in MODES:
        return jsonify(error="Choose road, air or water."), 400
    agency = db.transport_agencies.find_one({"_id": oid(data.get("agency_id"))})
    if not agency:
        return jsonify(error="Select a transport agency."), 400
    pickup = order.get("region")
    if pickup not in agency.get("regions", []) or mode not in agency.get("modes", []):
        return jsonify(error="This agency does not serve that region or mode."), 400
    existing = db.shipments.find_one({"order_id": order["_id"], "status": {"$ne": "cancelled"}})
    if existing:
        return jsonify(error="A shipment already exists for this order."), 409
    shipment = {
        "buyer_id": g.user["_id"],
        "buyer_name": g.user.get("full_name"),
        "order_id": order["_id"],
        "farmer_id": order.get("farmer_id"),
        "farmer_name": order.get("farmer_name"),
        "crop": order.get("crop"),
        "quantity_kg": order.get("quantity_kg"),
        "pickup_region": pickup,
        "dest_region": g.user.get("region"),
        "mode": mode,
        "agency_id": agency["_id"],
        "agency": agency_out(agency),
        "status": "requested",
        "note": data.get("note", ""),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    shipment["_id"] = db.shipments.insert_one(shipment).inserted_id
    return jsonify(shipment=clean(shipment)), 201


@bp.get("/mine")
@login_required("buyer")
def my_shipments():
    rows = get_db().shipments.find({"buyer_id": g.user["_id"]}).sort("created_at", -1)
    return jsonify(shipments=[clean(s) for s in rows])


@bp.get("/farmer")
@login_required("farmer")
def farmer_shipments():
    rows = get_db().shipments.find({"farmer_id": g.user["_id"]}).sort("created_at", -1)
    return jsonify(shipments=[clean(s) for s in rows])


@bp.patch("/<sid>/status")
@login_required()
def set_status(sid):
    """Seller (farmer who owns the order) or an admin advances the shipment."""
    status = (request.get_json(silent=True) or {}).get("status")
    if status not in STATUSES:
        return jsonify(error="Invalid status."), 400
    db = get_db()
    shipment = db.shipments.find_one({"_id": oid(sid)})
    if not shipment:
        return jsonify(error="Shipment not found."), 404
    is_owner = g.user["role"] == "admin" or shipment.get("farmer_id") == g.user["_id"]
    if not is_owner:
        return jsonify(error="Only the seller or an admin can update a shipment."), 403
    db.shipments.update_one({"_id": shipment["_id"]},
                            {"$set": {"status": status, "updated_at": datetime.utcnow()}})
    return jsonify(shipment=clean(db.shipments.find_one({"_id": shipment["_id"]})))
