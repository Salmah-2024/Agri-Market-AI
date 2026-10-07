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
                return jsonify(error="Please log in."), 401
            try:
                data = jwt.decode(token, SECRET, algorithms=["HS256"])
            except jwt.ExpiredSignatureError:
                return jsonify(error="Session expired, please log in again."), 401
            except jwt.InvalidTokenError:
                return jsonify(error="Invalid session."), 401
            user = get_db().users.find_one({"_id": oid(data["sub"])})
            if not user:
                return jsonify(error="Account not found."), 401
            if role and user["role"] != role:
                return jsonify(error=f"Only {role}s can do this."), 403
            g.user = user
            return fn(*args, **kwargs)

        return wrapper

    return deco
