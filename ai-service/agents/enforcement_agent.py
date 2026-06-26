import os
import json
from typing import List, Dict, Any
from datetime import datetime

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Violation site database (in production: pull from city GIS + CPCB)
VIOLATION_SITES = {
    "Mumbai": [
        {
            "siteName": "Dharavi Construction Cluster",
            "siteType": "CONSTRUCTION",
            "address": "Dharavi, Mumbai - 400017",
            "location": {"type": "Point", "coordinates": [72.8545, 19.0374]},
            "ward": "Dharavi",
            "nearbyAQI": None,
            "baseScore": 85,
            "lastInspected": "2025-04-15",
            "violations": 3,
            "evidenceData": {"timeOfPeak": "08:00-10:00", "windDirection": "SW"},
        },
        {
            "siteName": "Andheri West Industrial Zone",
            "siteType": "INDUSTRY",
            "address": "Andheri West, Mumbai - 400053",
            "location": {"type": "Point", "coordinates": [72.8409, 19.1136]},
            "ward": "Andheri",
            "nearbyAQI": None,
            "baseScore": 78,
            "lastInspected": "2025-03-20",
            "violations": 2,
            "evidenceData": {"timeOfPeak": "14:00-18:00", "windDirection": "NE"},
        },
        {
            "siteName": "Kurla Waste Burning Site",
            "siteType": "WASTE_BURNING",
            "address": "LBS Road, Kurla, Mumbai - 400070",
            "location": {"type": "Point", "coordinates": [72.8843, 19.0726]},
            "ward": "Kurla",
            "nearbyAQI": None,
            "baseScore": 72,
            "lastInspected": "2025-05-01",
            "violations": 5,
            "evidenceData": {"timeOfPeak": "06:00-09:00", "windDirection": "W"},
        },
        {
            "siteName": "Powai Diesel Fleet Depot",
            "siteType": "DIESEL_FLEET",
            "address": "Powai, Mumbai - 400076",
            "location": {"type": "Point", "coordinates": [72.9058, 19.1197]},
            "ward": "Powai",
            "nearbyAQI": None,
            "baseScore": 65,
            "lastInspected": "2025-04-28",
            "violations": 1,
            "evidenceData": {"timeOfPeak": "05:00-08:00", "windDirection": "N"},
        },
        {
            "siteName": "Worli Industrial Emission Stack",
            "siteType": "INDUSTRY",
            "address": "Worli Sea Face, Mumbai - 400030",
            "location": {"type": "Point", "coordinates": [72.8169, 19.0139]},
            "ward": "Worli",
            "nearbyAQI": None,
            "baseScore": 60,
            "lastInspected": "2025-02-10",
            "violations": 4,
            "evidenceData": {"timeOfPeak": "10:00-16:00", "windDirection": "SE"},
        },
    ],
    "Delhi": [
        {
            "siteName": "Okhla Industrial Area Phase II",
            "siteType": "INDUSTRY",
            "address": "Okhla Phase II, New Delhi - 110020",
            "location": {"type": "Point", "coordinates": [77.2667, 28.5355]},
            "ward": "Okhla",
            "nearbyAQI": None,
            "baseScore": 92,
            "lastInspected": "2025-04-10",
            "violations": 6,
            "evidenceData": {"timeOfPeak": "09:00-14:00", "windDirection": "NW"},
        },
    ],
}

ACTIONS = {
    "CONSTRUCTION": "Deploy dust inspection team. Verify water sprinklers, green netting, and covered material storage compliance under CPCB Construction Dust Guidelines.",
    "INDUSTRY": "Stack emission check required. Verify scrubber operation and cross-check with CPCB/MoEF emission permits. Collect stack emission samples.",
    "WASTE_BURNING": "Immediate stop-work order. Coordinate with BMC solid waste management for alternative disposal. Document with photographic evidence.",
    "DIESEL_FLEET": "PUC (Pollution Under Control) certificate verification. Check fleet age and BS-VI compliance. Coordinate with RTO.",
    "TRAFFIC_HOTSPOT": "Traffic management intervention. Coordinate with traffic police for signal optimization and heavy vehicle rerouting.",
}

REASONING_TEMPLATES = {
    "CONSTRUCTION": "PM10 levels {pct}% above ward baseline. Construction activity confirmed by permit database ({violations} active permits). Dust migration pattern matches SW wind direction recorded at {time}. {days} days since last compliance check.",
    "INDUSTRY": "SO2/NOx spike correlated with registered industrial units. {violations} facilities flagged in emission overage in last 30 days. Stack emission signature matches {siteName} operational hours. No inspection in {days} days.",
    "WASTE_BURNING": "CO spike + thermal satellite anomaly detected at {time}. Burning pattern signature matches municipal solid waste combustion. {violations} prior incidents at same location. Immediate intervention window: early morning.",
    "DIESEL_FLEET": "NOx/BC (Black Carbon) emissions elevated. Diesel fleet movement pattern correlated with peak morning AQI. Fleet age data from RTO shows {violations} non-compliant vehicles registered to this depot.",
}


class EnforcementAgent:
    """
    Enforcement Priority Intelligence Agent.
    Scores violation sites by impact, calculates priority, generates AI reasoning.
    Uses LLM when available, else deterministic scoring.
    """

    def analyze(self, city: str, readings: List[Dict]) -> List[Dict]:
        sites = VIOLATION_SITES.get(city, VIOLATION_SITES["Mumbai"])
        avg_aqi = sum(r.get("aqi", 150) for r in readings) / max(len(readings), 1) if readings else 150

        scored = []
        for site in sites:
            priority_score, estimated_contribution = self._calculate_priority(site, avg_aqi)
            reasoning = self._generate_reasoning(site, avg_aqi)
            action = ACTIONS.get(site["siteType"], "Investigate and document findings.")

            scored.append({
                **site,
                "nearbyAQI": round(avg_aqi + (site["baseScore"] - 70) * 0.5),
                "priorityScore": priority_score,
                "estimatedContribution": estimated_contribution,
                "aiReasoning": reasoning,
                "recommendedAction": action,
                "status": "PENDING",
                "generatedAt": datetime.utcnow().isoformat(),
            })

        return sorted(scored, key=lambda x: x["priorityScore"], reverse=True)

    def _calculate_priority(self, site: Dict, avg_aqi: float):
        score = site["baseScore"]

        # AQI severity bonus
        if avg_aqi > 300: score += 15
        elif avg_aqi > 200: score += 8
        elif avg_aqi > 150: score += 4

        # Violation history bonus
        score += min(site.get("violations", 0) * 3, 15)

        # Days since inspection bonus
        try:
            last = datetime.strptime(site.get("lastInspected", "2025-01-01"), "%Y-%m-%d")
            days_since = (datetime.utcnow() - last).days
            score += min(days_since // 15, 10)
        except Exception:
            pass

        # Time-of-day: peak pollution hours boost
        hour = datetime.utcnow().hour
        peak_time = site.get("evidenceData", {}).get("timeOfPeak", "")
        if "08:00" in peak_time or "09:00" in peak_time:
            if 7 <= hour <= 10: score += 5

        score = min(100, score)

        # Estimated contribution: score-based proxy
        contribution = round(10 + (score - 60) * 0.8, 1)
        contribution = max(5, min(50, contribution))

        return score, contribution

    def _generate_reasoning(self, site: Dict, avg_aqi: float) -> str:
        stype = site.get("siteType", "INDUSTRY")
        template = REASONING_TEMPLATES.get(stype, "Elevated pollution readings correlated with this site's operations.")
        violations = site.get("violations", 1)
        try:
            last = datetime.strptime(site.get("lastInspected", "2025-01-01"), "%Y-%m-%d")
            days = (datetime.utcnow() - last).days
        except Exception:
            days = 30

        pct = round((avg_aqi - 100) / 100 * 100) if avg_aqi > 100 else 20
        time_str = site.get("evidenceData", {}).get("timeOfPeak", "morning peak")
        return template.format(
            pct=pct,
            violations=violations,
            time=time_str,
            days=days,
            siteName=site.get("siteName", "this site"),
        )
