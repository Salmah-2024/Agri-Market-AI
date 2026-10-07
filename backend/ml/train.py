"""Train the weekly price model for Agri-Market AI (real Tanzania data).

What it predicts
----------------
Instead of the absolute price, the model predicts the weekly CHANGE as a
log-ratio  r = log(price_next / price_now).  Predicting the change (not the
level) makes the model level-invariant, so one model serves every crop, region
and price level, and it keeps the model anchored on the most recent known price.

The forecast price is then:  price_next = price_now * exp(beta * r_hat)
where `beta` (0..1) is a damping factor: Tanzanian weekly prices are "sticky"
(many weeks the price does not move), so damping the predicted move toward "no
change" trims noise on the flat weeks. `beta` is chosen on a validation slice.

Baseline
--------
The honest naive baseline is "next week = this week" (price_now). On the big,
decision-relevant moves the model wins on RMSE / R2; on the many flat weeks the
naive baseline is hard to beat, which is a property of the data. More data
(longer history, rainfall/fuel, national trend) is the real lever for beating it
on MAE too.

    python train.py
"""
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "tanzania-agri-prices-data" / "data" / "processed" / "prices.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "price_model.joblib"

CATEGORICAL = ["crop", "region"]
NUMERIC = ["lr1", "lr2", "lr4", "r_ma4", "vol4",
           "month_sin", "month_cos", "week_sin", "week_cos"]
FEATURES = CATEGORICAL + NUMERIC
BETAS = [1.0, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2]   # damping candidates


def load_data() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH)
    df["week_start"] = pd.to_datetime(df["week_start"])
    df = df.dropna(subset=["price"]).copy()
    df = df[df["region"] != "National Average"].copy()   # keep real regions only
    return df.sort_values(["crop", "region", "week_start"]).reset_index(drop=True)


def build_features(df: pd.DataFrame, horizon: int = 1) -> pd.DataFrame:
    """One row per (crop, region, week) with features known at that week and the
    log-ratio to `horizon` weeks ahead as the target."""
    df = df.copy()
    g = df.groupby(["crop", "region"])["price"]
    logp = np.log(df["price"])
    df["lr1"] = logp - np.log(g.shift(1))
    df["lr2"] = logp - np.log(g.shift(2))
    df["lr4"] = logp - np.log(g.shift(4))
    df["r_ma4"] = logp - np.log(g.transform(lambda s: s.rolling(4).mean()))
    df["vol4"] = g.transform(lambda s: np.log(s).diff().rolling(4).std())
    m = df["week_start"].dt.month
    w = df["week_start"].dt.isocalendar().week.astype(int)
    df["month_sin"], df["month_cos"] = np.sin(2 * np.pi * m / 12), np.cos(2 * np.pi * m / 12)
    df["week_sin"], df["week_cos"] = np.sin(2 * np.pi * w / 52), np.cos(2 * np.pi * w / 52)
    df["price_now"] = df["price"]
    df["target_lr"] = np.log(g.shift(-horizon)) - logp
    return df.dropna(subset=NUMERIC + ["target_lr"]).copy()


def new_model() -> Pipeline:
    pre = ColumnTransformer([
        ("categorical", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL),
        ("numeric", "passthrough", NUMERIC),
    ])
    rf = RandomForestRegressor(n_estimators=400, max_depth=12, min_samples_leaf=3,
                               max_features=0.6, random_state=42, n_jobs=-1)
    return Pipeline([("preprocessor", pre), ("model", rf)])


def price_stats(y_true, y_pred):
    y_true, y_pred = np.asarray(y_true), np.asarray(y_pred)
    return {
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "r2": float(r2_score(y_true, y_pred)),
        "mape": float(np.mean(np.abs((y_true - y_pred) / y_true)) * 100),
    }


def main() -> None:
    print("Loading real Tanzania weekly prices...")
    raw = load_data()
    data = build_features(raw, horizon=1)
    print(f"Rows for training: {len(data)}  |  weeks: {raw['week_start'].nunique()}")

    weeks = np.sort(data["week_start"].unique())
    test_split = weeks[int(len(weeks) * 0.80)]
    val_split = weeks[int(len(weeks) * 0.64)]     # last 20% of the train part = validation

    fit_df = data[data.week_start < val_split]
    val_df = data[(data.week_start >= val_split) & (data.week_start < test_split)]
    train_df = data[data.week_start < test_split]
    test_df = data[data.week_start >= test_split]

    # 1) choose the damping beta on the validation slice
    m = new_model().fit(fit_df[FEATURES], fit_df["target_lr"])
    v_now = val_df["price_now"].values
    v_true = v_now * np.exp(val_df["target_lr"].values)
    v_lr = m.predict(val_df[FEATURES])
    beta = min(BETAS, key=lambda b: mean_absolute_error(v_true, v_now * np.exp(b * v_lr)))
    print(f"Chosen damping beta (min val MAE): {beta}")

    # 2) report on the held-out test set with that beta
    m = new_model().fit(train_df[FEATURES], train_df["target_lr"])
    t_now = test_df["price_now"].values
    t_true = t_now * np.exp(test_df["target_lr"].values)
    t_pred = t_now * np.exp(beta * m.predict(test_df[FEATURES]))
    model_metrics = price_stats(t_true, t_pred)
    baseline_metrics = price_stats(t_true, t_now)   # naive: next = now

    print("\n            MAE      RMSE       R2     MAPE")
    print(f"model    {model_metrics['mae']:8.1f} {model_metrics['rmse']:8.1f} "
          f"{model_metrics['r2']:8.4f} {model_metrics['mape']:6.2f}%")
    print(f"baseline {baseline_metrics['mae']:8.1f} {baseline_metrics['rmse']:8.1f} "
          f"{baseline_metrics['r2']:8.4f} {baseline_metrics['mape']:6.2f}%")

    # 3) refit on ALL data for deployment and save one package
    final = new_model().fit(data[FEATURES], data["target_lr"])
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    package = {
        "pipeline": final,
        "features": FEATURES,
        "categorical_features": CATEGORICAL,
        "numeric_features": NUMERIC,
        "target": "log_ratio_next_week",
        "beta": float(beta),
        "data_end": str(raw["week_start"].max().date()),
        "data_source": "Ministry of Agriculture weekly market bulletins (Tanzania), 2024-2026",
        "metrics": model_metrics,
        "baseline_metrics": baseline_metrics,
    }
    joblib.dump(package, MODEL_PATH)
    print(f"\nSaved model to: {MODEL_PATH}")


if __name__ == "__main__":
    main()
