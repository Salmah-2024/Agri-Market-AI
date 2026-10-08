from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import g, jsonify, request

from .db import get_db, oid

SECRET = os.getenv("JWT_SECRET") or "dev-only-secret-set-JWT_SECRET-in-backend-env-file"
TOKEN_DAYS = 7


def make_token(user: dict) -> str:
    payload = {
        "sub": str(user["_id"]),
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_DAYS),
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")


def login_required(role: str | None = None):
    def deco(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            header = request.headers.get("Authorization", "")
            token = header[7:] if header.startswith("Bearer ") else None
            if not token:
                return jsonify(error="Tafadhali ingia."), 401
            try:
                data = jwt.decode(token, SECRET, algorithms=["HS256"])
            except jwt.ExpiredSignatureError:
                return jsonify(error="Muda wa kipindi umeisha, tafadhali ingia tena."), 401
            except jwt.InvalidTokenError:
                return jsonify(error="Kipindi si sahihi."), 401
            user = get_db().users.find_one({"_id": oid(data["sub"])})
            if not user:
                return jsonify(error="Akaunti haikupatikana."), 401
            if role and user["role"] != role:
                return jsonify(error=f"Ni {role} pekee wanaoweza kufanya hili."), 403
            g.user = user
            return fn(*args, **kwargs)

        return wrapper

    return deco
