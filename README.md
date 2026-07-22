<div align="center">

<img src="https://img.shields.io/badge/ET%20AI%20Hackathon%202.0-2026-orange?style=for-the-badge&logo=lightning&logoColor=white" alt="ET AI Hackathon 2.0"/>
<img src="https://img.shields.io/badge/Team-BugByte-blueviolet?style=for-the-badge" alt="Team BugByte"/>
<img src="https://img.shields.io/badge/Theme-Smart%20Cities%20%7C%20Environmental%20Intelligence-green?style=for-the-badge" alt="Smart Cities"/>

<br/><br/>

# 🌬️ VAYU Intelligence
### *AI-Powered Urban Air Quality Intelligence Platform*

> **"The data exists. The intelligence layer to act on it does not."**

<br/>

[![Live App](https://img.shields.io/badge/🌐%20Live%20App-vayu--weld.vercel.app-blue?style=for-the-badge)](https://vayu-weld.vercel.app/app)
[![Backend API](https://img.shields.io/badge/⚡%20Backend%20API-vayu--server.onrender.com-green?style=for-the-badge)](https://vayu-server.onrender.com/)
[![AI Service](https://img.shields.io/badge/🤖%20AI%20Service-vayu--ai--service.onrender.com-purple?style=for-the-badge)](https://vayu-ai-service.onrender.com/)
[![GitHub](https://img.shields.io/badge/📦%20Source%20Code-aarav12e%2FVAYU-black?style=for-the-badge&logo=github)](https://github.com/aarav12e/VAYU)

</div>

---

## 📖 Table of Contents

- [🔗 Live Application Links](#-live-application-links)
- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [System Architecture](#-system-architecture)
- [Core AI Modules](#-core-ai-modules)
- [Tech Stack & Data Sources](#-tech-stack--data-sources)
- [Pages & Features](#-pages--features)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Quick Start (Local)](#-quick-start-local)
- [Docker Deployment](#-docker-easiest)
- [Impact & Scalability](#-impact--scalability)
- [Judging Criteria Alignment](#-alignment-with-judging-criteria)
- [Team](#-team)
- [Research & References](#-research--data-references)

---

## 🔗 Live Application Links

<div align="center">

| Service | URL | Status |
|---|---|---|
| 🌐 **Frontend (Web App)** | [vayu-weld.vercel.app/app](https://vayu-weld.vercel.app/app) | [![Live](https://img.shields.io/badge/status-live-brightgreen?style=flat-square)](https://vayu-weld.vercel.app/app) |
| ⚡ **Backend API** | [vayu-server.onrender.com](https://vayu-server.onrender.com/) | [![Live](https://img.shields.io/badge/status-live-brightgreen?style=flat-square)](https://vayu-server.onrender.com/) |
| 🤖 **AI Prediction Service** | [vayu-ai-service.onrender.com](https://vayu-ai-service.onrender.com/) | [![Live](https://img.shields.io/badge/status-live-brightgreen?style=flat-square)](https://vayu-ai-service.onrender.com/) |
| 📦 **Source Code** | [github.com/aarav12e/VAYU](https://github.com/aarav12e/VAYU) | [![GitHub](https://img.shields.io/badge/GitHub-public-black?style=flat-square&logo=github)](https://github.com/aarav12e/VAYU) |

</div>

> 💡 **Tip for Judges:** The frontend is hosted on Vercel (instant load). The backend and AI service are on Render's free tier — if they appear slow on first load, please wait ~30 seconds for the service to spin up.

---

## 🔴 The Problem

India's air quality crisis extends **well beyond Delhi**.

| City | AQI Status (2024–25) |
|---|---|
| **Delhi** | Avg AQI of 218 — classified *'Poor'* or worse for **200+ days** |
| **Mumbai** | Dangerous AQI levels on **60+ days** in 2024 |
| **Kolkata** | Avg AQI above **150** through large parts of winter |
| **Bengaluru / Chennai** | Measurable deterioration as vehicle density & construction rise |

> 🏥 **The Lancet Planetary Health** estimates **1.67 million premature deaths annually** in India from air pollution — a burden that falls disproportionately on urban populations.

India has deployed over **900 Continuous Ambient Air Quality Monitoring Stations (CAAQMS)** under the National Clean Air Programme. Yet a **2024 CAG audit** found that only **31% of cities** with monitoring data had any actionable multi-agency response protocol linked to those readings.

### The Core Gap

City administrations need:
1. **Geospatial attribution** of pollution sources
2. **Hyperlocal predictive forecasting**
3. **Enforcement intelligence**

...combined into **one system**. That combination **does not exist today**.

---

## 💡 Our Solution

**VAYU** is a unified AI-powered command center that fuses monitoring station data, satellite imagery, mobility feeds, meteorological forecasts, and geospatial land-use layers to move city administrators from **reactive monitoring** to **proactive, evidence-based intervention**.

Rather than building a single-purpose tool, VAYU integrates **all five intervention areas** into one connected platform:

| Module | What It Does |
|---|---|
| 🗺️ **Geospatial Source Attribution Engine** | Attributes pollution by category (traffic, construction, industry, waste burning) at ward/zone level with statistical confidence scores |
| 📈 **Hyperlocal Predictive Forecasting Agent** | 24–72 hour AQI forecasts at 1 km grid resolution using meteorological, traffic, and seasonal emission data |
| 🚨 **Enforcement Intelligence & Prioritisation Agent** | Correlates hotspots with registered emission sources — generates ranked, evidence-backed enforcement recommendations |
| 🏙️ **Multi-City Comparative Intelligence Dashboard** | Benchmarks intervention effectiveness and compliance across cities so administrators can learn from what has worked elsewhere |
| 🏥 **Citizen Health Risk Advisory System** | Ward-level health risk alerts mapped against vulnerable populations, delivered via app, public display, and IVR in regional languages |

> The unifying idea is **actionability**: every insight in VAYU is paired with a concrete next step — a dispatch order, an advisory, a comparison — rather than a static number on a dashboard.

---

## 🏗️ System Architecture

VAYU follows a **four-layer architecture**: data ingestion → AI/ML intelligence → shared geospatial services → presentation layer.

This separation allows each intelligence agent (attribution, forecasting, enforcement, advisory) to be developed, trained, and scaled **independently** while sharing a common data backbone.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                                  │
│                                                                              │
│   ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐     │
│   │  React Command   │  │ Dispatch Console │  │  Citizen App / IVR     │     │
│   │     Center       │  │  (Enforcement)   │  │  (Regional Languages)  │     │
│   └──────────────────┘  └──────────────────┘  └────────────────────────┘     │
└────────────────────────────────┬─────────────────────────────────────────────┘
                                 │  HTTP REST + WebSocket (Socket.io)
┌────────────────────────────────▼─────────────────────────────────────────────┐
│                       API GATEWAY — Node.js / Express                        │
│                                                                              │
│        /api/aqi  │  /api/forecast  │  /api/enforcement  │  /api/citizen      │
│                         ┌──────────────────────┐                             │
│                         │   MongoDB 7.0        │   ← Geospatial Storage      │
│                         │   Redis 7 (Cache)    │   ← 15-min AQI caching      │
│                         └──────────────────────┘                             │
│                         Cron Data Ingestion Worker (every 15 min)            │
└────────────────────────────────┬─────────────────────────────────────────────┘
                                 │  Internal HTTP
┌────────────────────────────────▼─────────────────────────────────────────────┐
│               AI / ML INTELLIGENCE LAYER — Python FastAPI                    │
│                                                                              │
│  ┌───────────────────────┐  ┌───────────────────────┐                        │
│  │   ForecastingAgent    │  │   AttributionAgent    │                        │
│  │ GradientBoostingReg.  │  │  Physics Heuristics   │                        │
│  │  24/48/72hr AQI       │  │  Source % breakdown   │                        │
│  └───────────────────────┘  └───────────────────────┘                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────────┐    │
│  │   EnforcementAgent    │  │       CitizenAdvisoryAgent                │    │
│  │ Priority Scoring +    │  │  Claude claude-sonnet-4-6 + RAG Pipeline  │    │
│  │  LLM Reasoning        │  │  Hindi · English · Marathi · Tamil        │    │
│  └───────────────────────┘  └───────────────────────────────────────────┘    │
└────────────────────────────────┬─────────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼─────────────────────────────────────────────┐
│                         DATA INGESTION LAYER                                 │
│                                                                              │
│   WAQI CAAQMS   │   OpenWeatherMap   │   Sentinel-5P   │  MODIS  │   OSM     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Service Ports:**

| Service | Port | Technology |
|---|---|---|
| React Frontend | `3000` | React.js + Mapbox GL JS |
| Node.js Backend | `5000` | Express + Socket.io |
| Python AI Service | `8000` | FastAPI + Uvicorn |
| MongoDB | `27017` | MongoDB 7.0 |
| Redis | `6379` | Redis 7 Alpine |

---

## 🤖 Core AI Modules

### Module 1 — Geospatial Pollution Source Attribution Engine

Ingests spatial-temporal AQI readings and cross-references them against:
- Land-use maps & traffic density
- Active construction permits
- Industrial stack locations
- Satellite-detected **thermal anomalies** (Sentinel-5P / NASA MODIS)

A multimodal model attributes the likely pollution source category at ward/zone level and outputs a **statistical confidence score** — giving administrators a defensible basis for action rather than a guess.

---

### Module 2 — Hyperlocal Predictive AQI Forecasting Agent

Combines:
- **IMD meteorological forecasts**
- Predicted traffic patterns
- Seasonal emission calendars (stubble burning, festival fireworks)
- Atmospheric dispersion modelling

Projects AQI **24–72 hours ahead at 1 km grid resolution**, shifting city response from reactive advisories issued *after* AQI spikes to **scheduled interventions** — e.g., pre-emptively restricting construction activity ahead of a forecast pollution spike.

**ML Model:** `GradientBoostingRegressor` (scikit-learn) with diurnal time-of-day feature engineering.
**Evaluation:** RMSE vs. persistence baseline.

---

### Module 3 — Enforcement Intelligence & Prioritisation Agent

Correlates live pollution hotspots with a registry of known emission sources:
- Industries & factories
- Active construction sites
- Waste-burning locations
- Diesel fleet movement data

Produces a **ranked list of enforcement actions**, each carrying:
- 🛰️ Satellite thermal signature
- 📊 Sensor trend analysis
- 📋 Source registry match
- 🎯 Estimated AQI contribution (%)

Field inspectors are directed to the **highest-impact locations first** — not reactive patrols.

---

### Module 4 — Multi-City Comparative Intelligence Dashboard

Tracks AQI trends, intervention effectiveness, and compliance metrics across multiple urban centres **side by side** — so a city piloting an intervention can see whether a similar measure succeeded elsewhere before committing resources.

---

### Module 5 — Citizen Health Risk Advisory System

Overlays forecast AQI against population vulnerability data:
- 🏥 Hospitals
- 🏫 Schools
- 👴 Elderly populations
- 👷 Outdoor worker zones

Generates **ward-level health risk alerts** pushed through:
- 📱 Mobile app notifications
- 🖥️ Public display boards
- 📞 IVR in regional languages

**Language coverage:** Hindi · English · Marathi · Tamil · Kannada

---

## 🛠️ Tech Stack & Data Sources

### Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js, Mapbox GL JS, Socket.io Client, Tailwind CSS, Chart.js |
| **Backend** | Node.js 20, Express.js 4, Socket.io 4, node-cron |
| **AI/ML Service** | Python 3.11, FastAPI 0.115, Uvicorn, scikit-learn 1.6, pandas, NumPy |
| **LLM** | Anthropic Claude API (`claude-sonnet-4-6`) via LangChain |
| **Database** | MongoDB 7.0 (primary), Redis 7 (cache layer) |
| **DevOps** | Docker, Docker Compose |
| **Hosting** | Vercel (Frontend) · Render (Backend + AI Service) |

### Data Sources

| Source | Data | Refresh |
|---|---|---|
| **WAQI (waqi.info)** | Live AQI from CAAQMS stations nationwide | Every 15 min |
| **OpenWeatherMap** | Meteorological forecasts | Every 1 hour |
| **IMD** | Official Indian weather & atmospheric data | Daily |
| **Sentinel-5P (ESA)** | Satellite air quality & NO₂ imagery | Daily |
| **NASA MODIS** | Thermal anomaly & land surface data | Daily |
| **OpenStreetMap** | Land use, road network, construction sites | Static |
| **CPCB CAAQMS** | Historical data for ML model training | Static |

> ⚡ **All API keys are optional.** The platform runs with intelligent mock data when keys are absent — making it fully demonstrable without any setup.

---

## 🗺️ Pages & Features

### 1. 🖥️ Command Center
The primary dashboard for city administrators:

- Live city AQI hero card with color-coded severity (Good → Hazardous)
- **Mapbox heatmap** with ward-level pollution hotspot overlay
- 24-hour AQI trend chart
- **Source attribution pie chart** (traffic · construction · industry · waste burning)
- Forecast time-slider: Now → +24h → +48h → +72h
- Real-time alerts ticker with Hindi translations
- Vulnerable location overlay (hospitals, schools, elderly homes)
- **Live WebSocket updates** every 15 minutes via Socket.io

### 2. 🚨 Enforcement Intelligence
AI-ranked action console for enforcement officers:

- Priority score (0–100) per violation site — AI-ranked by impact evidence
- **AI reasoning per site**: why this site, why now
- Dispatch workflow with status tracking: `Pending → Dispatched → Resolved`
- Evidence panel: peak emission time, wind direction, estimated AQI contribution
- GeoJSON map layer for spatial dispatch planning

### 3. 💬 Citizen Advisory
Accessible, multilingual health guidance:

- Conversational chatbot powered by Claude AI
- **Languages:** English + Hindi + regional Indian languages
- Quick-access suggested questions
- **Vulnerable location risk map** (hospitals, schools, elderly homes)
- Personalized health advice based on ward AQI + user health profile
- Multilingual support badge

### 4. 🏠 Landing Page
- Platform overview with live demo entry point

---

## 📁 Project Structure

```
VAYU/
│
├── client/                         # React.js Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx     # Entry page
│   │   │   ├── CommandCenter.jsx   # Admin dashboard (primary)
│   │   │   ├── Enforcement.jsx     # AI enforcement console
│   │   │   └── CitizenChat.jsx     # Citizen advisory chatbot
│   │   ├── components/             # Reusable UI components
│   │   ├── services/               # API client services
│   │   ├── config/                 # App configuration
│   │   └── utils/                  # AQI helpers & formatters
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── server/                         # Node.js + Express Backend
│   ├── routes/
│   │   ├── aqi.js                  # AQI data endpoints
│   │   ├── forecast.js             # Forecast endpoints
│   │   ├── enforcement.js          # Enforcement endpoints
│   │   └── citizen.js              # Citizen advisory endpoints
│   ├── models/                     # MongoDB schemas
│   ├── jobs/                       # Cron data ingestion workers
│   ├── services/                   # External API integrations
│   ├── middleware/                  # Error handling
│   ├── config/                     # DB connection
│   ├── index.js                    # Server entry point
│   └── Dockerfile
│
├── ai-service/                     # Python FastAPI AI Service
│   ├── agents/
│   │   ├── forecasting_agent.py    # GradientBoosting AQI forecaster
│   │   ├── attribution_agent.py    # Pollution source attribution
│   │   ├── enforcement_agent.py    # Enforcement prioritisation
│   │   └── citizen_agent.py        # Claude-powered multilingual advisory
│   ├── models/                     # Trained ML model artifacts
│   ├── rag/                        # RAG pipeline for citizen agent
│   ├── main.py                     # FastAPI app entry point
│   ├── train_models.py             # Model training script
│   ├── requirements.txt            # Python dependencies
│   └── Dockerfile
│
└── docker-compose.yml              # One-command full-stack deployment
```

---

## 📡 API Reference

### AQI Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/aqi/live` | Live AQI for all cities |
| `GET` | `/api/aqi/city/:city` | Ward-level AQI breakdown |
| `GET` | `/api/aqi/heatmap/:city` | GeoJSON for Mapbox heatmap |
| `GET` | `/api/aqi/history/:city` | Last 24hr trend data |
| `GET` | `/api/aqi/stats/:city` | Summary statistics |

### Forecast Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/forecast/:city?hours=24` | 24 / 48 / 72hr AQI predictions |
| `GET` | `/api/forecast/attribution/:city` | Source attribution breakdown |

### Enforcement Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/enforcement/recommendations/:city` | AI-ranked violation sites |
| `GET` | `/api/enforcement/geojson/:city` | GeoJSON for map display |
| `PATCH` | `/api/enforcement/:id/status` | Update site status |

### Citizen Advisory

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/citizen/query` | Conversational AQI advisory |
| `GET` | `/api/citizen/ward-advisory/:city/:ward` | Ward-level health advisory |
| `GET` | `/api/citizen/vulnerable/:city` | Vulnerable location risk map |

### AI Service Direct Endpoints (Port 8000)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | AI service health check |
| `POST` | `/forecast/predict` | ML-based AQI forecast |
| `GET` | `/attribution/:city` | Source attribution data |
| `POST` | `/enforcement/analyze` | Enforcement recommendations |
| `POST` | `/citizen/advisory` | Multilingual citizen advisory |

---

## 🚀 Quick Start (Local)

### Prerequisites

- Node.js 20+
- Python 3.11+
- MongoDB (local or Atlas)
- Docker & Docker Compose (optional)

### Step 1 — Clone & Install

```bash
git clone https://github.com/aarav12e/VAYU.git
cd VAYU

# Install Node.js server dependencies
cd server && npm install && cd ..

# Install React client dependencies
cd client && npm install && cd ..

# Install Python AI service dependencies
cd ai-service && pip install -r requirements.txt && cd ..
```

### Step 2 — Configure Environment Variables

Copy the example files and fill in your keys:

**`server/.env`**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vayu_intelligence
WAQI_API_KEY=your_key_from_waqi.info/api/
OPENWEATHER_API_KEY=your_key_from_openweathermap.org
AI_SERVICE_URL=http://localhost:8000
```

**`client/.env`**
```env
REACT_APP_MAPBOX_TOKEN=your_key_from_mapbox.com
REACT_APP_API_URL=http://localhost:5000
```

**`ai-service/.env`**
```env
ANTHROPIC_API_KEY=your_anthropic_key   # Optional — enables Claude advisory
WAQI_API_KEY=your_waqi_key             # Optional — enables live sensor data
```

> 💡 **All API keys are optional.** The platform gracefully falls back to intelligent mock data for demos.

### Step 3 — Start All Services

```bash
# Terminal 1 — MongoDB
mongod

# Terminal 2 — Node.js Backend (Port 5000)
cd server && npm run dev

# Terminal 3 — Python AI Service (Port 8000)
cd ai-service && uvicorn main:app --reload --port 8000

# Terminal 4 — React Frontend (Port 3000)
cd client && npm start
```

Open **[http://localhost:3000](http://localhost:3000)** 🎉

---

## 🐳 Docker (Easiest)

```bash
# Copy and configure environment variables
cp server/.env.example .env

# Build and launch all 5 services in one command
docker-compose up --build
```

This starts: **MongoDB · Redis · Node.js Backend · Python AI Service · React Frontend**

Services: `localhost:3000` (UI) · `localhost:5000` (API) · `localhost:8000` (AI)

---

## 📊 Impact & Scalability

| Dimension | Impact |
|---|---|
| **Response Time** | Reduces signal-to-intervention gap from manual review to **automated, ranked enforcement recommendations** generated as hotspots emerge |
| **Forecast Accuracy** | 24–72 hour hyperlocal forecasts (1 km grid) evaluated against persistence baseline using **RMSE** — enabling *scheduled* rather than reactive intervention |
| **Multi-City Scalability** | Ingestion & modelling layers are **city-agnostic** — onboarding a new city requires only new CAAQMS station IDs + a land-use/zone boundary file |
| **Language Coverage** | Citizen advisories generated by LLM in the locally dominant language per city — extending reach **beyond English/Hindi dashboards** |
| **Public Health Stakes** | Targeting India's **1.67 million annual premature deaths** from air pollution — even marginal improvement in enforcement speed has outsized impact |

---

## 🏆 Alignment with Judging Criteria

| Criteria | Weight | Our Approach |
|---|---|---|
| 🚀 **Innovation** | 25% | Multi-agent AI architecture, compound risk detection correlating AQI with construction permits + satellite thermal data, LLM advisory in Indian regional languages |
| 💼 **Business Impact** | 25% | Direct path to city administrator adoption; addresses 1.67M lives/year crisis; evidence-backed enforcement reduces guesswork for field teams |
| ⚙️ **Technical Excellence** | 20% | MERN + FastAPI + ML/LLM stack; WebSocket real-time updates; GeoJSON + Mapbox geospatial; RAG pipeline for citizen agent |
| 📈 **Scalability** | 15% | Docker Compose; Redis caching; MongoDB; city-agnostic ingestion pipeline; modular independent agent architecture |
| 🎨 **User Experience** | 15% | Dark command-center UI; mobile-responsive; multilingual advisory (Hindi + regional); real-time alerts ticker |

---

## 👥 Team

<div align="center">

| Role | Name |
|---|---|
| 👑 **Team Leader** | Aarav Kumar |
| 👩‍💻 **Team Member** | Suvi Kumari |
| 👩‍💻 **Team Member** | Archana Kumari |

**Team:** BugByte &nbsp;|&nbsp; **Hackathon:** ET AI Hackathon 2.0

</div>

---

## 🔗 Research & Data References

The solution has been designed using publicly available environmental datasets, geospatial resources, and AI research:

- **Central Pollution Control Board (CPCB)** — National Air Quality Monitoring Programme & CAAQMS data
- **India Meteorological Department (IMD)** — Official weather and atmospheric forecast data
- **Sentinel-5P Satellite (European Space Agency)** — Air quality imagery and NO₂ column data
- **NASA MODIS Satellite** — Thermal anomaly and land surface temperature data
- **OpenStreetMap** — Geospatial land use, road network, and building data
- **Anthropic Claude API** — LLM backbone for citizen advisory system
- **The Lancet Planetary Health (2024)** — 1.67 million premature death statistic
- **CAG Audit Report (2024)** — 31% actionable response protocol finding
- **FastAPI, MongoDB, React Documentation** — Core framework documentation

---

<div align="center">

**Built with ❤️ and a lot of ☕ for ET AI Hackathon 2.0**

*VAYU Intelligence Because clean air is not a luxury, it's a right.*

<br/>

[![Live App](https://img.shields.io/badge/🌐%20Try%20VAYU%20Live-vayu--weld.vercel.app%2Fapp-blue?style=for-the-badge)](https://vayu-weld.vercel.app/app)

</div>
