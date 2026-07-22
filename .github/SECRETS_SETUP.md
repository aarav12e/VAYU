# 🔐 GitHub Actions — Secrets Setup Guide

This file documents every secret needed to make the CI/CD pipeline work.
**Never commit real values here.** Add secrets in: 
> `GitHub Repo → Settings → Secrets and variables → Actions → New repository secret`

---

## Required Secrets

### 🌐 Vercel (Frontend Deployment)

| Secret Name | How to Get |
|---|---|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create token |
| `VERCEL_ORG_ID` | Run `vercel env ls` in the `client/` folder (shown as "Org ID") |
| `VERCEL_PROJECT_ID` | Run `vercel env ls` in the `client/` folder (shown as "Project ID") |
| `REACT_APP_MAPBOX_TOKEN` | [account.mapbox.com](https://account.mapbox.com) → Tokens |

### ⚡ Render (Backend + AI Service Deployment)

| Secret Name | How to Get |
|---|---|
| `RENDER_DEPLOY_HOOK_SERVER` | Render Dashboard → vayu-server → Settings → Deploy Hook → Copy URL |
| `RENDER_DEPLOY_HOOK_AI` | Render Dashboard → vayu-ai-service → Settings → Deploy Hook → Copy URL |

### 🌤️ Optional (for live data in CI)

| Secret Name | Description |
|---|---|
| `WAQI_API_KEY` | WAQI.info free key — enables live AQI data |
| `OPENWEATHER_API_KEY` | OpenWeatherMap free key |
| `ANTHROPIC_API_KEY` | Anthropic key — enables Claude advisory |

---

## How to Get Render Deploy Hooks

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click on **vayu-server** service
3. Go to **Settings** tab
4. Scroll down to **Deploy Hook**
5. Click **Generate** if not already created
6. Copy the URL → paste as `RENDER_DEPLOY_HOOK_SERVER` secret

Repeat for **vayu-ai-service** → `RENDER_DEPLOY_HOOK_AI`

---

## Environment Setup (Vercel)

Make sure these environment variables are set in your Vercel project dashboard:

```
REACT_APP_API_URL   = https://vayu-server.onrender.com
REACT_APP_MAPBOX_TOKEN = <your mapbox token>
```

Set via: Vercel Dashboard → Project → Settings → Environment Variables

---

## Environments (for deployment protection)

The deploy workflow uses GitHub Environments for deployment gates. 
Create these in: `Settings → Environments`

| Environment | Purpose |
|---|---|
| `production-frontend` | Vercel frontend deploy |
| `production-backend` | Render backend deploy |
| `production-ai` | Render AI service deploy |

You can optionally add **required reviewers** to these environments 
for manual approval before production deploys.
