from __future__ import annotations

import re
from datetime import datetime

from flask import Blueprint, g, jsonify, request
from pymongo.errors import DuplicateKeyError
from werkzeug.security import check_password_hash, generate_password_hash

from ..auth import login_required, make_token
from ..db import clean, get_db
from ..forecast import ALL_REGIONS, CROPS

bp = Blueprint("auth", __name__, url_prefix="/api")

DEFAULT_SETTINGS = {
    "market_region": "National",
    "price_unit": "kg",  # kg | bag (100 kg)
    "notify_sms": True,
    "notify_email": False,
    "language": "en",
}
PROFILE_FIELDS = {
    "farmer": ["full_name", "phone", "region", "district", "ward", "farm_size_acres", "main_crops", "bio"],
    "buyer": ["full_name", "phone", "region", "district", "business_name", "business_type", "interested_crops", "bio"],
    "admin": ["full_name", "phone"],
}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def public_user(u: dict) -> dict:
    return clean(u)


@bp.post("/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    role = data.get("role")
    if role not in ("farmer", "buyer"):
        return jsonify(error="Chagua kama wewe ni mkulima au mnunuzi."), 400
    errors = {}
    email = str(data.get("email", "")).strip().lower()
    if not data.get("full_name", "").strip():
        errors["full_name"] = "Jina kamili linahitajika."
    if not EMAIL_RE.match(email):
        errors["email"] = "Weka barua pepe sahihi."
    phone = re.sub(r"\s+", "", str(data.get("phone", "")))
    if not re.match(r"^(\+?255|0)[67]\d{8}$", phone):
        errors["phone"] = "Weka namba sahihi ya simu ya Tanzania, mf. 0712345678."
    if len(str(data.get("password", ""))) < 6:
        errors["password"] = "Nenosiri lazima liwe na herufi 6 au zaidi."
    if data.get("region") not in ALL_REGIONS[1:] and data.get("region") != "Other":
        errors["region"] = "Chagua mkoa wako."
    if errors:
        return jsonify(error="Tafadhali rekebisha sehemu zilizoangaziwa.", fields=errors), 400
    user = {"role": role, "email": email, "password_hash": generate_password_hash(data["password"])}
    for f in PROFILE_FIELDS[role]:
        if f in data:
            user[f] = data[f]
    user["phone"] = phone
    user["settings"] = {**DEFAULT_SETTINGS, "market_region": data.get("region", "National")}
    user["created_at"] = datetime.utcnow()
    try:
        user["_id"] = get_db().users.insert_one(user).inserted_id
    except DuplicateKeyError:
        return jsonify(error="Tayari kuna akaunti yenye barua pepe hii.", fields={"email": "Tayari imesajiliwa."}), 409
    return jsonify(token=make_token(user), user=public_user(user)), 201


@bp.post("/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    user = get_db().users.find_one({"email": str(data.get("email", "")).strip().lower()})
    if not user or not check_password_hash(user["password_hash"], str(data.get("password", ""))):
        return jsonify(error="Barua pepe au nenosiri si sahihi."), 401
    return jsonify(token=make_token(user), user=public_user(user))


@bp.get("/auth/me")
@login_required()
def me():
    return jsonify(user=public_user(g.user))


@bp.put("/profile")
@login_required()
def update_profile():
    data = request.get_json(silent=True) or {}
    updates = {f: data[f] for f in PROFILE_FIELDS[g.user["role"]] if f in data}
    if not updates:
        return jsonify(error="Hakuna cha kusasisha."), 400
    get_db().users.update_one({"_id": g.user["_id"]}, {"$set": updates})
    return jsonify(user=public_user(get_db().users.find_one({"_id": g.user["_id"]})))


@bp.put("/settings")
@login_required()
def update_settings():
    data = request.get_json(silent=True) or {}
    settings = {**DEFAULT_SETTINGS, **g.user.get("settings", {})}
    for k in DEFAULT_SETTINGS:
        if k in data:
            settings[k] = data[k]
    if settings["market_region"] not in ALL_REGIONS:
        return jsonify(error="Mkoa haujulikani."), 400
    if settings["price_unit"] not in ("kg", "bag"):
        return jsonify(error="Kipimo lazima kiwe kg au bag."), 400
    get_db().users.update_one({"_id": g.user["_id"]}, {"$set": {"settings": settings}})
    return jsonify(user=public_user(get_db().users.find_one({"_id": g.user["_id"]})))


@bp.put("/settings/password")
@login_required()
def change_password():
    data = request.get_json(silent=True) or {}
    if not check_password_hash(g.user["password_hash"], str(data.get("current_password", ""))):
        return jsonify(error="Nenosiri la sasa si sahihi."), 400
    if len(str(data.get("new_password", ""))) < 6:
        return jsonify(error="Nenosiri jipya lazima liwe na herufi 6 au zaidi."), 400
    get_db().users.update_one(
        {"_id": g.user["_id"]}, {"$set": {"password_hash": generate_password_hash(data["new_password"])}}
    )
    return jsonify(ok=True)


@bp.delete("/settings/account")
@login_required()
def delete_account():
    db = get_db()
    uid = g.user["_id"]
    if g.user["role"] == "farmer":
        db.listings.update_many({"farmer_id": uid, "status": {"$ne": "sold"}}, {"$set": {"status": "withdrawn"}})
    db.cart_items.delete_many({"buyer_id": uid})
    db.users.delete_one({"_id": uid})
    return jsonify(ok=True)


@bp.get("/meta")
def meta():
    return jsonify(crops=CROPS, regions=ALL_REGIONS[1:], market_regions=ALL_REGIONS)
