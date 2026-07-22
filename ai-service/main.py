from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

from agents.forecasting_agent import ForecastingAgent
from agents.attribution_agent import AttributionAgent
from agents.enforcement_agent import EnforcementAgent
from agents.citizen_agent import CitizenAdvisoryAgent

app = FastAPI(
    title="Vayu Intelligence AI Service",
    description="AI/ML backend for Urban Air Quality Intelligence Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agents
forecasting_agent = ForecastingAgent()
attribution_agent = AttributionAgent()
enforcement_agent = EnforcementAgent()
citizen_agent = CitizenAdvisoryAgent()


# --- Request/Response Models ---

class AQIReading(BaseModel):
    aqi: float
    timestamp: str
    ward: Optional[str] = None

class ForecastRequest(BaseModel):
    city: str
    history: List[AQIReading]
    hours: int = 24

class EnforcementRequest(BaseModel):
    city: str
    readings: List[Dict[str, Any]]

class CitizenQueryRequest(BaseModel):
    message: str
    context: Dict[str, Any]
    language: str = "en"


# --- Root & Health Check ---

@app.get("/")
async def root():
    return {
        "message": "Welcome to Vayu AI Service API",
        "docs_url": "/docs",
        "health_check": "/health"
    }

@app.get("/health")
async def health():
    return {"status": "Vayu AI Service is live 🤖", "agents": ["forecasting", "attribution", "enforcement", "citizen"]}


# --- Forecasting Endpoint ---

@app.post("/forecast/predict")
async def predict_forecast(request: ForecastRequest):
    try:
        result = forecasting_agent.predict(
            city=request.city,
            history=[r.dict() for r in request.history],
            hours=request.hours,
        )
        return {"success": True, "forecasts": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Source Attribution Endpoint ---

@app.get("/attribution/{city}")
async def get_attribution(city: str):
    try:
        result = attribution_agent.attribute(city=city)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Enforcement Intelligence Endpoint ---

@app.post("/enforcement/analyze")
async def analyze_enforcement(request: EnforcementRequest):
    try:
        result = enforcement_agent.analyze(
            city=request.city,
            readings=request.readings,
        )
        return {"success": True, "recommendations": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Citizen Advisory Endpoint ---

@app.post("/citizen/advisory")
async def citizen_advisory(request: CitizenQueryRequest):
    try:
        result = citizen_agent.generate_advisory(
            message=request.message,
            context=request.context,
            language=request.language,
        )
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
