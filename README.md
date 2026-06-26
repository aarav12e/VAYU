# 🌬️ Vayu Intelligence
### AI-Powered Urban Air Quality Intelligence Platform

> *"The data exists. The intelligence layer to act on it does not."*

Vayu Intelligence is a full-stack AI platform that transforms raw air quality sensor data into **predictive, actionable interventions** — giving city administrators the tools to reduce pollution at source rather than just measure it.

---

## 🏆 Hackathon Highlights

| Feature | Innovation |
|---|---|
| **Compound Risk Detection** | Correlates AQI spikes with construction permits, wind direction, and traffic — not just raw sensor readings |
| **AI Enforcement Ranking** | Scores violation sites by impact score, days since inspection, and satellite thermal data |
| **Hyperlocal Forecasting** | Ward-level AQI predictions 24/48/72 hours ahead using Gradient Boosting + diurnal patterns |
| **Multilingual Advisory** | Citizens get health advice in Hindi, English, Marathi, Tamil via LLM (Claude API) |
| **Live WebSocket Updates** | Real-time AQI push via Socket.io — every 15 minutes |
| **Vulnerable Location Mapping** | Hospitals, schools, elderly homes mapped against forecast AQI risk levels |

---

## 🏗️ Architecture

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  React.js   │◄──►│  Node.js/Express │◄──►│  Python FastAPI     │
│  Frontend   │    │  + Socket.io     │    │  AI/ML Service      │
│  (Port 3000)│    │  (Port 5000)     │    │  (Port 8000)        │
└─────────────┘    └────────┬─────────┘    └─────────────────────┘
                            │                        │
                   ┌────────▼─────────┐    ┌────────▼────────────┐
                   │    MongoDB       │    │  XGBoost Forecasting │
                   │    (Port 27017)  │    │  LangChain Agents    │
                   └──────────────────┘    │  Claude API          │
                                           └─────────────────────┘
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 20+
- Python 3.11+
- MongoDB (local or Atlas)

### 1. Clone and install
```bash
git clone <repo>
cd vayu-intelligence

# Install server deps
cd server && npm install && cd ..

# Install client deps
cd client && npm install && cd ..

# Install Python deps
cd ai-service && pip install -r requirements.txt && cd ..
```

### 2. Configure environment variables

**server/.env** (copy from .env.example):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vayu_intelligence
WAQI_API_KEY=your_key_from_waqi.info/api/
OPENWEATHER_API_KEY=your_key_from_openweathermap.org
AI_SERVICE_URL=http://localhost:8000
```

**client/.env** (copy from .env.example):
```
REACT_APP_MAPBOX_TOKEN=your_key_from_mapbox.com
REACT_APP_API_URL=http://localhost:5000
```

**ai-service/.env** (copy from .env.example):
```
ANTHROPIC_API_KEY=your_anthropic_key  # Optional — enables Claude-powered citizen advisory
```

> ⚡ **All API keys are optional** — the platform runs with intelligent mock data when keys are not provided.

### 3. Start all services

**Terminal 1 — MongoDB:**
```bash
mongod
```

**Terminal 2 — Node.js Server:**
```bash
cd server
npm run dev
```

**Terminal 3 — Python AI Service:**
```bash
cd ai-service
uvicorn main:app --reload --port 8000
```

**Terminal 4 — React Client:**
```bash
cd client
npm start
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🐳 Docker (Easiest)

```bash
# Copy and fill .env
cp server/.env.example .env

# Start everything
docker-compose up --build
```

---

## 📡 API Reference

### AQI Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/aqi/live` | Live AQI for all cities |
| GET | `/api/aqi/city/:city` | Ward-level breakdown |
| GET | `/api/aqi/heatmap/:city` | GeoJSON for Mapbox heatmap |
| GET | `/api/aqi/history/:city` | Last 24hr trend |
| GET | `/api/aqi/stats/:city` | Summary statistics |

### Forecast Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/forecast/:city?hours=24` | 24/48/72hr predictions |
| GET | `/api/forecast/attribution/:city` | Source attribution breakdown |

### Enforcement Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/enforcement/recommendations/:city` | AI-ranked violation sites |
| GET | `/api/enforcement/geojson/:city` | GeoJSON for map display |
| PATCH | `/api/enforcement/:id/status` | Update site status |

### Citizen Advisory
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/citizen/query` | Conversational AQI advisory |
| GET | `/api/citizen/ward-advisory/:city/:ward` | Ward-level health advisory |
| GET | `/api/citizen/vulnerable/:city` | Vulnerable location risk map |

---

## 🤖 AI Agents

| Agent | Model | Capability |
|---|---|---|
| **ForecastingAgent** | GradientBoostingRegressor | 24/48/72hr AQI with diurnal patterns |
| **AttributionAgent** | Physics heuristics | Source attribution by type, time, season |
| **EnforcementAgent** | Scoring + LLM reasoning | Ranks violation sites by impact evidence |
| **CitizenAdvisoryAgent** | Claude API (claude-sonnet-4-6) | Multilingual personalized health guidance |

---

## 📊 Data Sources

| Source | Data | Refresh |
|---|---|---|
| WAQI API (waqi.info) | Live AQI from CAAQMS stations | 15 min |
| OpenWeatherMap | Meteorological forecasts | 1 hr |
| OpenStreetMap | Land use, construction sites | Static |
| CPCB Historical | Training data for ML models | Static |

> All sources are **free tier** — no paid subscriptions needed for demo.

---

## 🗺️ Pages

### 1. Command Center
- Live city AQI hero with color-coded severity
- Mapbox heatmap with ward-level hotspots
- 24hr trend chart
- Source attribution pie chart
- Forecast slider (Now / +24h / +48h / +72h)
- Real-time alerts ticker with Hindi translations

### 2. Enforcement Intelligence
- AI-ranked violation sites by priority score (0–100)
- AI reasoning per site (why this site, why now)
- Dispatch workflow with status tracking
- Evidence data: peak time, wind direction, estimated AQI contribution

### 3. Citizen Advisory
- Conversational chatbot in English + Hindi
- Suggested questions for quick access
- Vulnerable location map (hospitals, schools, elderly homes)
- Multilingual support badge

---

## 📁 Project Structure

```
vayu-intelligence/
├── client/                    # React Frontend (MERN)
│   └── src/
│       ├── pages/             # 3 main pages
│       ├── components/        # Reusable UI components
│       └── utils/             # AQI helpers
├── server/                    # Node.js + Express Backend
│   ├── routes/                # REST API routes
│   ├── models/                # MongoDB schemas
│   └── jobs/                  # Cron data ingestion
└── ai-service/                # Python FastAPI AI Service
    └── agents/                # 4 AI agents
```

---

## 🏆 Judging Criteria Coverage

| Criteria | Our Approach |
|---|---|
| **Innovation (25%)** | Multi-agent AI, compound risk detection, LLM advisory in Indian languages |
| **Business Impact (25%)** | Direct path to city administrator adoption, 1.67M lives/year impact |
| **Technical Excellence (20%)** | MERN + FastAPI + ML stack, WebSockets, GeoJSON, Mapbox |
| **Scalability (15%)** | Docker, Redis caching, MongoDB sharding-ready, city-agnostic |
| **User Experience (15%)** | Dark command-center UI, mobile-responsive, Hindi advisory |

---

Built with ❤️ for ET AI Hackathon 2026 — *Vayu Intelligence Team*
