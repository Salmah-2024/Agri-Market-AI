"""Weekly price forecasting served from the real-data model (backend/ml).

Loads the single pipeline saved by backend/ml/train.py (a log-ratio model with a
damping beta) and rolls it forward week by week to build a short forecast, with a
likely range from the spread across the forest's trees.

The public API (get_forecaster, Forecaster.available/series/forecast, and the
CROPS / ALL_REGIONS / NATIONAL names) is kept the same as before so the routes,
services and frontend response shape do not change.
"""
from __future__ import annotations

import os
from datetime import date, datetime, timedelta
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

ML_DIR = Path(__file__).resolve().parents[1] / "ml"
MODEL_PATH = ML_DIR / "models" / "price_model.joblib"
DATA_PATH = ML_DIR / "data" / "tanzania-agri-prices-data" / "data" / "processed" / "prices.csv"

NATIONAL = "National"
# data crop slug  ->  display name used across the app (the 7 crops in the
# Ministry of Agriculture weekly market bulletin)
CROP_DISPLAY = {
    "maize": "Maize", "rice": "Rice", "beans": "Beans", "sorghum": "Sorghum",
    "bulrush_millet": "Bulrush Millet", "finger_millet": "Finger Millet",
    "round_potato": "Round Potato",
}
DISPLAY_SLUG = {v: k for k, v in CROP_DISPLAY.items()}
ALL_CROPS = list(CROP_DISPLAY.values())

# Crops the app serves. Default: all 7. Override in .env, e.g. ACTIVE_CROPS=Maize,Rice
_default = ",".join(ALL_CROPS)
_ACTIVE = [c.strip().lower() for c in os.getenv("ACTIVE_CROPS", _default).split(",") if c.strip()]
CROPS = [c for c in ALL_CROPS if c.lower() in _ACTIVE] or list(ALL_CROPS)

MAX_WEEKS = 8   # cap on the forecast horizon


class Forecaster:
    def __init__(self) -> None:
        pkg = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else {}
        self.pipeline = pkg.get("pipeline")
        self.features = pkg.get("features", [])
        self.beta = float(pkg.get("beta", 0.5))
        self.data_end = pkg.get("data_end")
        self.data_source = pkg.get("data_source")
        model_metrics = pkg.get("metrics", {})
        # health reads data_end; the /predictions response reads crops[<crop>]
        self.metrics = {"data_end": self.data_end, "data_source": self.data_source,
                        "crops": {c: model_metrics for c in ALL_CROPS}}

        # weekly history per (display crop, region), plus a National mean series
        self.history: dict[tuple[str, str], pd.Series] = {}
        self.regions: list[str] = []
        if DATA_PATH.exists():
            df = pd.read_csv(DATA_PATH)
            df["week_start"] = pd.to_datetime(df["week_start"])
            df = df.dropna(subset=["price"])
            df = df[df["region"] != "National Average"].copy()
            df["crop"] = df["crop"].map(CROP_DISPLAY)
            df = df.dropna(subset=["crop"])
            self.regions = sorted(df["region"].unique())
            for (crop, region), g in df.groupby(["crop", "region"]):
                self.history[(crop, region)] = g.set_index("week_start")["price"].sort_index()
            # National average = mean across regions per crop per week
            nat = df.groupby(["week_start", "crop"], as_index=False)["price"].mean()
            for crop, g in nat.groupby("crop"):
                self.history[(crop, NATIONAL)] = g.set_index("week_start")["price"].sort_index()

    def available(self) -> dict:
        ok = self.pipeline is not None
        return {c: ok and any(k[0] == c for k in self.history) for c in CROPS}

    # ---- price history as a daily series (for charts + accuracy checks) ----
    def series(self, crop: str, region: str, observations: list[dict] | None = None,
               as_of: date | None = None) -> pd.Series:
        region = region if (crop, region) in self.history else NATIONAL
        s = self.history[(crop, region)].copy()
        for ob in observations or []:
            s.loc[pd.Timestamp(ob["date"])] = float(ob["price"])
        s = s.sort_index()
        s = s[~s.index.duplicated(keep="last")]
        end = pd.Timestamp(as_of or date.today())
        idx = pd.date_range(s.index.min(), max(end, s.index.max()), freq="D")
        s = s.reindex(idx).interpolate("time", limit_area="inside").ffill()
        return s[s.index <= end]

    # ---- feature row from the last 5 weekly prices ending at `prices[-1]` ----
    def _features(self, prices: list[float], crop: str, region: str, week: pd.Timestamp) -> pd.DataFrame:
        p = np.array(prices[-5:], dtype=float)          # [t-4 ... t]
        logp = np.log(p)
        now = logp[-1]
        ma4 = np.mean(p[-4:])
        diffs = np.diff(logp[-5:])                       # 4 weekly log returns
        m, w = week.month, int(week.isocalendar().week)
        row = {
            "crop": DISPLAY_SLUG[crop], "region": region,
            "lr1": now - logp[-2], "lr2": now - logp[-3], "lr4": now - logp[-5],
            "r_ma4": now - np.log(ma4), "vol4": float(np.std(diffs, ddof=1)),
            "month_sin": np.sin(2 * np.pi * m / 12), "month_cos": np.cos(2 * np.pi * m / 12),
            "week_sin": np.sin(2 * np.pi * w / 52), "week_cos": np.cos(2 * np.pi * w / 52),
        }
        return pd.DataFrame([row])[self.features]

    def _tree_ratios(self, X: pd.DataFrame) -> np.ndarray:
        """Predicted log-ratio from every tree, for the uncertainty band."""
        Xt = self.pipeline[:-1].transform(X)
        rf = self.pipeline[-1]
        return np.array([t.predict(Xt)[0] for t in rf.estimators_])

    def forecast(self, crop: str, region: str, days: int = 7,
                 observations: list[dict] | None = None, as_of: date | None = None) -> dict:
        if self.pipeline is None or not any(k[0] == crop for k in self.history):
            raise ValueError(f"No model/data for {crop}")
        used_region = region if (crop, region) in self.history else NATIONAL
        s = self.series(crop, used_region, observations, as_of)
        weeks = max(4, min(int(np.ceil(int(days) / 7)), MAX_WEEKS))

        # weekly anchor prices sampled at 7-day steps back from today
        last = s.index[-1]
        today_price = float(s.iloc[-1])
        window = [float(s.asof(last - timedelta(days=7 * k))) for k in range(4, -1, -1)]
        window = [today_price if (v is None or np.isnan(v)) else v for v in window]  # short history

        fc, cum_lo, cum_hi, week = [], 0.0, 0.0, pd.Timestamp(last)
        for _ in range(weeks):
            week = week + pd.Timedelta(days=7)
            X = self._features(window, crop, used_region, week)
            ratios = self._tree_ratios(X)
            mean, lo, hi = ratios.mean(), np.percentile(ratios, 10), np.percentile(ratios, 90)
            anchor = window[-1]
            price = anchor * np.exp(self.beta * mean)
            cum_lo += self.beta * (lo - mean)
            cum_hi += self.beta * (hi - mean)
            fc.append({
                "date": week.date().isoformat(),
                "price": round(price, 0),
                "low": round(price * np.exp(cum_lo), 0),
                "high": round(price * np.exp(cum_hi), 0),
            })
            window = window[1:] + [price]

        change = (fc[-1]["price"] - today_price) / today_price * 100
        today_point = {"date": last.date().isoformat(), "price": round(today_price, 0),
                       "low": round(today_price, 0), "high": round(today_price, 0)}
        best = max([today_point] + fc, key=lambda x: x["price"])
        cheapest = min([today_point] + fc, key=lambda x: x["price"])
        return {
            "crop": crop,
            "region": used_region,
            "requested_region": region,
            "as_of": last.date().isoformat(),
            "current_price": round(today_price, 0),
            "unit": "TZS/kg",
            "forecast": fc,
            "change_pct": round(change, 2),
            "trend": "up" if change > 1 else "down" if change < -1 else "stable",
            "best_day_to_sell": best,
            "best_day_to_buy": cheapest,
            "recent": [{"date": d.date().isoformat(), "price": round(float(v), 0)}
                       for d, v in s.iloc[-30:].items()],
            "model": f"RandomForest weekly log-ratio (damped x{self.beta:g})",
            "model_metrics": self.metrics.get("crops", {}).get(crop),
            "data_source": self.data_source,
            "generated_at": datetime.utcnow().isoformat() + "Z",
        }


ALL_REGIONS = [NATIONAL]   # filled from the data once the forecaster loads

_forecaster: Forecaster | None = None


def get_forecaster() -> Forecaster:
    global _forecaster, ALL_REGIONS
    if _forecaster is None:
        _forecaster = Forecaster()
        ALL_REGIONS = [NATIONAL] + _forecaster.regions
    return _forecaster


# load at import so ALL_REGIONS / CROPS are populated for the routes
get_forecaster()

__all__ = ["get_forecaster", "CROPS", "ALL_REGIONS", "NATIONAL"]
