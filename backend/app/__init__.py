from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from . import db as dbmod  # noqa: E402
from .forecast import get_forecaster  # noqa: E402
from .services import refresh_all_daily, seed_gov_prices  # noqa: E402

FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"


def create_app(start_scheduler: bool = True) -> Flask:
    app = Flask(__name__, static_folder=None)
    CORS(app, resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS", "*").split(",")}})

    from .routes.admin_routes import bp as admin_bp
    from .routes.auth_routes import bp as auth_bp
    from .routes.insight_routes import bp as insight_bp
    from .routes.market_routes import bp as market_bp
    from .routes.public_routes import bp as public_bp
    from .routes.transport_routes import bp as transport_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(market_bp)
    app.register_blueprint(insight_bp)
    app.register_blueprint(public_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(transport_bp)

    db = dbmod.get_db()
    get_forecaster()  # load models at startup
    seed_gov_prices()
    from .seed import seed_admin, seed_transport

    seed_admin()      # ensure the admin account exists (always)
    seed_transport()  # ensure the transport agencies exist (always)
    if dbmod.USING_MEMORY_DB or os.getenv("SEED_DEMO") == "1":
        from .seed import seed_demo

        seed_demo()

    @app.get("/api/health")
    def health():
        fc = get_forecaster()
        return jsonify(
            ok=True,
            database="in-memory (set MONGO_URL to persist)" if dbmod.USING_MEMORY_DB else "mongodb",
            models=fc.available(),
            training_data_end=fc.metrics.get("data_end"),
            users=db.users.count_documents({}),
            time=datetime.utcnow().isoformat() + "Z",
        )

    @app.errorhandler(404)
    def not_found(_):
        return jsonify(error="Haikupatikana."), 404

    # Serve the built React app (frontend/dist) so one server hosts everything.
    @app.get("/", defaults={"path": ""})
    @app.get("/<path:path>")
    def spa(path: str):
        if path.startswith("api/"):
            return jsonify(error="Haikupatikana."), 404
        if not FRONTEND_DIST.exists():
            return jsonify(message="API running. Build the frontend (cd frontend && npm run build) "
                                   "or run it with npm run dev."), 200
        target = FRONTEND_DIST / path
        if path and target.is_file():
            return send_from_directory(FRONTEND_DIST, path)
        return send_from_directory(FRONTEND_DIST, "index.html")

    if start_scheduler and os.getenv("DISABLE_SCHEDULER") != "1":
        from apscheduler.schedulers.background import BackgroundScheduler

        sched = BackgroundScheduler(timezone="Africa/Dar_es_Salaam")
        # every day at 00:05 East Africa Time: import official prices + forecast
        sched.add_job(refresh_all_daily, "cron", hour=0, minute=5, id="daily_forecasts")
        sched.add_job(refresh_all_daily, id="startup_forecasts")  # once at startup
        sched.start()

    return app
