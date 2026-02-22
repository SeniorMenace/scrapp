# 🔍 PriceSpy — Multi Market Price Scraper

Compare prices in real-time across **OLX**, **Uzum Market**, **Wildberries**, and **Yandex Market** from a single search.

## 🏗️ Architecture

```
scrapper-pr/
├── backend/          # NestJS API + scrapers
│   ├── src/
│   │   ├── common/
│   │   │   ├── interfaces/product.interface.ts
│   │   │   └── utils/
│   │   │       ├── http.util.ts       # Axios factory, timeout, price parser
│   │   │       └── user-agents.ts     # Random UA rotation
│   │   ├── search/
│   │   │   ├── scrapers/
│   │   │   │   ├── olx.scraper.ts        # Axios + Cheerio
│   │   │   │   ├── uzum.scraper.ts       # Public JSON API
│   │   │   │   ├── wildberries.scraper.ts # Public JSON API
│   │   │   │   └── yandex.scraper.ts     # API + HTML fallback
│   │   │   ├── search.controller.ts
│   │   │   ├── search.module.ts
│   │   │   └── search.service.ts
│   │   ├── app.module.ts             # Root with Cache + Throttler modules
│   │   └── main.ts
│   └── Dockerfile
├── frontend/          # Next.js 14 + premium dark UI
│   ├── pages/
│   │   ├── _app.tsx
│   │   └── index.tsx
│   ├── styles/globals.css
│   ├── next.config.js
│   └── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── ecosystem.config.js   # PM2 config
```

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone & setup

```bash
git clone <repo-url>
cd scrapper-pr
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
# → Running on http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
# → Running on http://localhost:3000
```

### 4. Test the API

```bash
curl "http://localhost:4000/api/search?query=iphone+13"
```

Expected response:
```json
{
  "success": true,
  "count": 18,
  "markets": ["OLX", "Uzum", "Wildberries"],
  "data": [
    {
      "market": "Uzum",
      "title": "iPhone 13 128GB Midnight",
      "price": "6 490 000 UZS",
      "priceRaw": 6490000,
      "link": "https://uzum.uz/product/...",
      "image": "https://...",
      "shop": "AppleUz"
    }
  ],
  "executionTime": 4321
}
```

## ⚙️ Backend Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Backend port |
| `NODE_ENV` | `development` | Environment |
| `CACHE_TTL` | `300` | Cache TTL in seconds |
| `RATE_LIMIT` | `10` | Max requests per minute per IP |
| `REQUEST_TIMEOUT` | `8000` | Per-scraper timeout (ms) |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |
| `PROXY_URL` | _(empty)_ | Optional HTTP proxy |

## 🐳 Docker Deployment

```bash
# Build and run everything
docker compose up -d --build

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

## 🖥️ Ubuntu VPS Deployment (PM2 + Nginx)

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx

# Install PM2
npm install -g pm2

# Build backend
cd backend && npm install && npm run build && cd ..

# Build frontend
cd frontend && npm install && npm run build && cd ..

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Configure Nginx
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo nginx -t && sudo systemctl reload nginx
```

## 🛡️ Security

- **Rate limiting**: 10 requests/min per IP (NestJS ThrottlerGuard + Nginx)
- **Input sanitization**: max 100 chars, min 2 chars, trimmed
- **CORS**: configurable via `CORS_ORIGIN` env var
- **Secrets**: all in `.env`, never committed

## 🔮 V2 Roadmap (Designed, Not Implemented)

The architecture is ready to extend with:

- **Price History**: PostgreSQL schema included below
- **Telegram Bot**: Add a bot module that calls `SearchService.search()`
- **Email Alerts**: Cron job comparing cached prices, trigger on drop
- **Proxy Rotation**: Swap `PROXY_URL` with a proxy pool service
- **Puppeteer Mode**: Already a dep, uncomment in scrapers for JS-heavy sites

### PostgreSQL Schema (V2)

```sql
CREATE TABLE products (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE price_history (
  id         SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  market     VARCHAR(100) NOT NULL,
  price      NUMERIC(15, 2),
  link       TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ph_product_scraped ON price_history(product_id, scraped_at DESC);
```

## ⚠️ Scraping Limitations

| Market | Method | Notes |
|---|---|---|
| **OLX.uz** | Axios + Cheerio | May require selector update if OLX redesigns |
| **Uzum Market** | Public JSON API | Most reliable, official-ish API |
| **Wildberries** | Public JSON API | Very reliable, WB keeps this API stable |
| **Yandex Market** | API + HTML fallback | Most likely to block — returns empty gracefully |

> **Tip**: If Yandex consistently blocks, add a `PROXY_URL` pointing to a residential proxy.

## 📄 License

MIT
