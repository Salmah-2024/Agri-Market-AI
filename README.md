# Agri-Market AI (Tanzania)

A marketplace for **farmers** and **buyers** in Tanzania. It includes daily AI crop price forecasts and the government's indicative prices (*bei elekezi*).

- **Frontend:** React + TypeScript + Tailwind CSS v4 + shadcn/ui (Vite)
- **Backend:** Flask REST API + MongoDB (with an automatic in-memory fallback if MongoDB is not running)
- **ML:** one scikit-learn RandomForest trained on **real Tanzania weekly prices**. It predicts the weekly price change (a log-ratio) and is rolled forward to give a short forecast with a likely range.
- **Crops:** all 7 in the Ministry of Agriculture weekly market bulletin — Maize, Rice, Beans, Sorghum, Bulrush Millet, Finger Millet, Round Potato.

---

## Features

**Registration**: users pick Farmer (Mkulima) or Buyer (Mnunuzi), then fill in a form. After registering, they go to their own dashboard.

**Farmer dashboard**
| Page | What it does |
|---|---|
| Overview | Shows kg in stock, kg sold, sales value, orders waiting, today's AI forecast for your crops next to the government price, and recent orders |
| My crops | Register the crops you have available (crop, variety, kg, price, region, quality, harvest date, minimum order). Each listing's status shows *Available / Partly bought / Bought / Withdrawn*. You can confirm, deliver or cancel orders |
| Buyers | Every registered buyer, filterable by region and crop, with phone and email. It flags buyers who ordered from you or have your crop in their cart |
| Sales predictions | The weekly AI forecast. It shows the **value of your stock today vs. on the best week to sell**, and you can run and save new predictions |
| Prediction history | Every prediction you ran. Once the real prices come in, it shows how accurate each one was |
| Government prices | The official indicative price per crop, next to today's market estimate and next week's AI price |
| Profile / Settings | Edit your details. Settings cover default market region, price per kg or per 100 kg bag, SMS/email alerts, dark mode, password change and account deletion |

**Buyer dashboard**
| Page | What it does |
|---|---|
| Available crops | Every listing with its status, farmer's price, **government price (with % difference)** and **AI 7-day outlook**. Has filters and a **cart** |
| Cart | Change quantities, choose a payment method (cash, mobile money, bank) and add a delivery note, then place the order |
| My orders | Shows each order's status: pending, confirmed, delivered or cancelled |
| AI predictions / history / government prices / profile / settings | Same as the farmer pages, except predictions highlight the *best week to buy* |

---

## Photos for the landing / register / login pages

The photos live in `frontend/public/images/` and are referenced from the site root (`/images/...`):

| File | Used on |
|---|---|
| `image7.png` | Landing hero |
| `Farm.jpeg` | Farmer registration panel, landing "For farmers" card |
| `image4.png` | Buyer registration panel, landing "For buyers" card |
| `login page.png` | Login panel, landing call-to-action |
| `farmer.png` / `buyer.png` | Tractor and money-plant badges |
| `logo.png` | Logo on every page and in the dashboard sidebar |

The marketing site pages also use a set of free stock photos (Unsplash License). They live in `frontend/public/images/stock/` and are referenced locally, so the app makes **no external image calls**. To (re)download them, run once with internet:

```bash
cd frontend
bash download-images.sh      # fills public/images/stock/
```

If any image file is missing, a green gradient shows in its place.

## Transport (shipping)

After buying, a buyer can arrange delivery from the **Transport** page:
1. Pick a **route / mode** — road, air or water.
2. Pick a **trusted agency** that serves the pickup region (verified badge, rating, phone).
3. **Request** the shipment, then track its status and contact the agency directly.

The seller (farmer) sees requested shipments on their **Shipments** page and marks them **sent** (dispatched) then **delivered**. Trusted agencies per region are seeded on startup (`seed_transport`).

## Run it locally

You need **Python 3.11–3.13** (scikit-learn has no 3.14 wheels yet), **Node 20+**, and **MongoDB** running locally.

### 1. Backend (http://localhost:5000)
```bash
# make sure MongoDB is running, e.g.:  sudo systemctl start mongod
cd backend
python3 -m venv venv           # use python3.13 if your default is 3.14
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
A ready-to-use `backend/.env` is already included (MongoDB at `mongodb://localhost:27017`, all 7 crops, demo seeding on). If MongoDB is **not** reachable, the app prints a warning and falls back to a temporary in-memory DB so it still runs (data not saved).

Accounts (type them on the login page — none are shown there). Each one lands on its own dashboard automatically by role:

- Farmer: `farmer@demo.tz` / `Kilimo@Tz2026!`
- Buyer: `buyer@demo.tz` / `Kilimo@Tz2026!`
- **Admin**: `admin@agrimarket.tz` / `Admin@Tz2026!` — the admin dashboard (`/admin`) to add government indicative prices and view registered farmers & buyers. Admins can't be created through public registration; change this password after first login.

### 2. Frontend (http://localhost:5173)
```bash
cd frontend
npm install
npm run dev
```
Vite forwards `/api` calls to the backend on port 5000.

### One server for deployment
```bash
cd frontend && npm run build      # creates frontend/dist
cd ../backend && gunicorn -w 1 -b 0.0.0.0:$PORT run:app
```
Flask then serves the React app and the API from the same URL. This works on Render or Railway: set build command `pip install -r backend/requirements.txt && cd frontend && npm ci && npm run build`, and start command `cd backend && gunicorn -w 1 -b 0.0.0.0:$PORT run:app`. Use one worker (`-w 1`) so the daily scheduler only runs once.

### `.env` settings
| Variable | Meaning |
|---|---|
| `MONGO_URL` | MongoDB connection string (empty = in-memory) |
| `JWT_SECRET` | Long random string for login tokens. **Set this in production** |
| `ADMIN_KEY` | Key for adding official prices (below) |
| `GOV_PRICES_CSV_URL` | Optional CSV feed of official prices, imported every day at 00:05 EAT |
| `SEED_DEMO` | `1` = load the demo accounts into MongoDB |
| `ACTIVE_CROPS` | Comma-separated crops to serve (default: all 7) |

---

## How the AI works

Trained on **real Tanzania weekly market prices** in `backend/ml/data/tanzania-agri-prices-data/` (2024–2026, every region and all 7 crops).

- `backend/ml/train.py` builds features from each (crop, region) weekly series — price momentum (log-ratios vs 1/2/4 weeks ago), a 4-week moving-average ratio, recent volatility, and seasonality (month & week-of-year) — one-hot encoded by crop and region.
- It trains **one RandomForest** that predicts the weekly **change** as a log-ratio `log(price_next / price_now)`. Predicting the change (not the level) keeps it anchored on the latest known price and works at any price level. A damping factor `beta` (chosen on a validation slice) trims noise on the many weeks prices don't move.
- `backend/app/forecast.py` loads the saved model and rolls it forward week by week; the *likely range* comes from the spread across the forest's trees.
- The backend recomputes forecasts **once a day** (00:05 EAT and at startup) and caches them, merging the newest official prices into the history first.

Honest back-test (held-out weeks) vs the naive "next week = this week" baseline: the model wins on **RMSE and R²** (the big, decision-relevant moves) and roughly ties on MAE/MAPE — weekly prices are sticky, so persistence is hard to beat short-term. Full metrics are saved inside `price_model.joblib`.

### Retrain on newer data

Drop newer weekly bulletins into `backend/ml/data/tanzania-agri-prices-data/data/processed/prices.csv` (columns `week_start,week_end,region,crop,price`), then:

```bash
cd backend/ml
python train.py                # retrains and overwrites models/price_model.joblib
```

---

## Government indicative prices (bei elekezi)

The e-Kilimo portal (portal.kilimo.go.tz) has **no public API**, so the app does not scrape it. Instead:
1. It starts with the real figures from the May 2026 bulletin: national averages, plus the regional highs and lows the bulletin reports.
2. When the Ministry publishes a new bulletin, an admin adds the prices:
   ```bash
   curl -X POST http://localhost:5000/api/admin/gov-prices \
     -H "X-Admin-Key: YOUR_ADMIN_KEY" -H "Content-Type: application/json" \
     -d '{"source":"Weekly Market Bulletin 18-22 May 2026","prices":[
           {"crop":"Maize","region":"National","price":820,"date":"2026-05-22"},
           {"crop":"Rice","region":"Dar es Salaam","price":3100,"date":"2026-05-22"}]}'
   ```
   You can also POST a CSV with the columns `crop,region,price,date`.
3. You can instead set `GOV_PRICES_CSV_URL`, and the app imports that CSV every day. If the Ministry gives you data access later (for example through e-GA / GovESB), point this setting at that feed.

New official prices also feed into the AI forecasts.

---

## API summary
```
POST /api/auth/register  {role: farmer|buyer, full_name, email, phone, password, region, ...}
POST /api/auth/login     GET /api/auth/me     PUT /api/profile     PUT /api/settings
POST /api/listings (farmer)  GET /api/listings/mine  PUT|DELETE /api/listings/:id
GET  /api/listings?crop=&region=&include_sold=1       GET /api/buyers (farmer)
GET|POST /api/cart   PATCH|DELETE /api/cart/:id   POST /api/cart/checkout
GET  /api/orders/buyer   GET /api/orders/farmer   PUT /api/orders/:id/status
GET  /api/predictions/daily?crop=&region=   POST /api/predictions   GET /api/predictions/history
GET  /api/gov-prices?region=   GET /api/gov-prices/history?crop=   POST /api/admin/gov-prices
GET  /api/health
```

## Project structure
```
backend/      Flask API (app/routes, forecast.py, services.py, seed.py)
backend/ml/   real Tanzania price data, train.py, trained model (price_model.joblib)
frontend/     React app (src/components/ui = shadcn/ui, src/pages, src/components/shared)
```
To add more shadcn components: `cd frontend && npx shadcn@latest add <component>` (the project has a `components.json`).