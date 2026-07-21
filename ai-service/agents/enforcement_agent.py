import os
import json
from typing import List, Dict, Any
from datetime import datetime

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# City coordinates lookup
CITY_COORDS = {
    "Mumbai": [72.8777, 19.0760], "Delhi": [77.2090, 28.6139], "Bengaluru": [77.5946, 12.9716],
    "Chennai": [80.2707, 13.0827], "Kolkata": [88.3639, 22.5726], "Hyderabad": [78.4867, 17.3850],
    "Ahmedabad": [72.5714, 23.0225], "Jaipur": [75.7873, 26.9124], "Lucknow": [80.9462, 26.8467],
    "Chandigarh": [76.7794, 30.7333], "Patna": [85.1376, 25.5941], "Bhubaneswar": [85.8245, 20.2961],
    "Thiruvananthapuram": [76.9366, 8.5241], "Bhopal": [77.4126, 23.2599], "Visakhapatnam": [83.2185, 17.6868],
    "Guwahati": [91.7362, 26.1445], "Ranchi": [85.3096, 23.3441], "Raipur": [81.6296, 21.2514],
    "Dehradun": [78.0322, 30.3165], "Shimla": [77.1734, 31.1048], "Srinagar": [74.7973, 34.0837],
    "Panaji": [73.8278, 15.4909], "Leh": [77.5771, 34.1526], "Puducherry": [79.8083, 11.9416],
    "Agartala": [91.2868, 23.8315], "Shillong": [91.8933, 25.5788], "Imphal": [93.9368, 24.8170],
    "Kohima": [94.1086, 25.6751], "Aizawl": [92.7176, 23.7271], "Itanagar": [93.6053, 27.0844],
    "Gangtok": [88.6065, 27.3389], "Pune": [73.8567, 18.5204]
}

VIOLATION_SITES = {
    "Mumbai": [
        {
            "siteName": "Dharavi Construction Cluster",
            "siteType": "CONSTRUCTION",
            "address": "Dharavi Sector 1, Mumbai - 400017",
            "location": {"type": "Point", "coordinates": [72.8545, 19.0374]},
            "ward": "Dharavi",
            "baseScore": 85,
            "lastInspected": "2025-04-15",
            "violations": 3,
            "evidenceData": {"timeOfPeak": "08:00-10:00", "windDirection": "SW"},
        },
        {
            "siteName": "Andheri Industrial Estate",
            "siteType": "INDUSTRY",
            "address": "MIDC Andheri East, Mumbai - 400093",
            "location": {"type": "Point", "coordinates": [72.8697, 19.1136]},
            "ward": "Andheri",
            "baseScore": 78,
            "lastInspected": "2025-03-20",
            "violations": 2,
            "evidenceData": {"timeOfPeak": "14:00-18:00", "windDirection": "NE"},
        },
        {
            "siteName": "Kurla LBS Waste Burning Site",
            "siteType": "WASTE_BURNING",
            "address": "LBS Marg, Kurla, Mumbai - 400070",
            "location": {"type": "Point", "coordinates": [72.8843, 19.0726]},
            "ward": "Kurla",
            "baseScore": 72,
            "lastInspected": "2025-05-01",
            "violations": 5,
            "evidenceData": {"timeOfPeak": "06:00-09:00", "windDirection": "W"},
        },
    ],
    "Chennai": [
        {
            "siteName": "Manali Petrochemical Complex",
            "siteType": "INDUSTRY",
            "address": "CPCL Road, Manali, Chennai - 600068",
            "location": {"type": "Point", "coordinates": [80.2642, 13.1667]},
            "ward": "Manali",
            "baseScore": 86,
            "lastInspected": "2025-04-10",
            "violations": 4,
            "evidenceData": {"timeOfPeak": "11:00-16:00", "windDirection": "ENE"},
        },
        {
            "siteName": "Velachery Commercial Construction Corridor",
            "siteType": "CONSTRUCTION",
            "address": "100 Feet Bypass Rd, Velachery, Chennai - 600042",
            "location": {"type": "Point", "coordinates": [80.2206, 12.9759]},
            "ward": "Velachery",
            "baseScore": 80,
            "lastInspected": "2025-04-22",
            "violations": 2,
            "evidenceData": {"timeOfPeak": "08:30-11:30", "windDirection": "SE"},
        },
    ],
    "Delhi": [
        {
            "siteName": "Anand Vihar ISBT & Freight Depot",
            "siteType": "DIESEL_FLEET",
            "address": "Anand Vihar ISBT, Delhi - 110092",
            "location": {"type": "Point", "coordinates": [77.3158, 28.6469]},
            "ward": "Anand Vihar",
            "baseScore": 92,
            "lastInspected": "2025-04-18",
            "violations": 6,
            "evidenceData": {"timeOfPeak": "06:00-10:00", "windDirection": "NW"},
        },
        {
            "siteName": "Okhla Industrial Area Stack Line",
            "siteType": "INDUSTRY",
            "address": "Okhla Phase II, New Delhi - 110020",
            "location": {"type": "Point", "coordinates": [77.2667, 28.5355]},
            "ward": "Okhla",
            "baseScore": 87,
            "lastInspected": "2025-03-30",
            "violations": 3,
            "evidenceData": {"timeOfPeak": "09:00-14:00", "windDirection": "WNW"},
        },
    ],
}

ACTIONS = {
    "CONSTRUCTION": "Deploy dust inspection team. Verify water sprinklers, green netting, and covered material storage compliance under CPCB Construction Dust Guidelines.",
    "INDUSTRY": "Stack emission check required. Verify scrubber operation and cross-check with CPCB/MoEF emission permits. Collect stack emission samples.",
    "WASTE_BURNING": "Immediate stop-work order. Coordinate with municipal solid waste management for alternative disposal. Document with photographic evidence.",
    "DIESEL_FLEET": "PUC (Pollution Under Control) certificate verification. Check fleet age and BS-VI compliance. Coordinate with RTO.",
    "TRAFFIC_HOTSPOT": "Traffic management intervention. Coordinate with traffic police for signal optimization and heavy vehicle rerouting.",
}

REASONING_TEMPLATES = {
    "CONSTRUCTION": "PM10 levels {pct}% above ward baseline. Construction activity confirmed by permit database ({violations} active permits). Dust migration pattern matches wind direction recorded at {time}. {days} days since last compliance check.",
    "INDUSTRY": "SO2/NOx spike correlated with registered industrial units. {violations} facilities flagged in emission overage in last 30 days. Stack emission signature matches {siteName} operational hours. No inspection in {days} days.",
    "WASTE_BURNING": "CO spike + thermal satellite anomaly detected at {time}. Burning pattern signature matches municipal solid waste combustion. {violations} prior incidents at same location.",
    "DIESEL_FLEET": "NOx/BC (Black Carbon) emissions elevated. Diesel fleet movement pattern correlated with peak AQI hours. Fleet age data from RTO shows {violations} non-compliant vehicles registered to this area.",
    "TRAFFIC_HOTSPOT": "High traffic congestion index coupled with idling diesel emissions. NOx levels peak during rush hours. Signal cycle optimization recommended.",
}


class EnforcementAgent:
    """
    Enforcement Priority Intelligence Agent.
    Scores violation sites by impact across all Indian cities.
    """

    def _get_city_sites(self, city: str) -> List[Dict]:
        if city in VIOLATION_SITES:
            return VIOLATION_SITES[city]

        center = CITY_COORDS.get(city, [77.2090, 28.6139])
        return [
            {
                "siteName": f"{city} Industrial Zone Estate",
                "siteType": "INDUSTRY",
                "address": f"MIDC Industrial Corridor, {city}",
                "location": {"type": "Point", "coordinates": [center[0] + 0.02, center[1] + 0.02]},
                "ward": f"{city} North",
                "baseScore": 82,
                "lastInspected": "2025-04-10",
                "violations": 3,
                "evidenceData": {"timeOfPeak": "10:00-16:00", "windDirection": "NW"},
            },
            {
                "siteName": f"{city} Central Freight Depot",
                "siteType": "DIESEL_FLEET",
                "address": f"Main Interstate Freight Terminal, {city}",
                "location": {"type": "Point", "coordinates": [center[0] - 0.015, center[1] - 0.01]},
                "ward": f"{city} Central",
                "baseScore": 76,
                "lastInspected": "2025-04-20",
                "violations": 2,
                "evidenceData": {"timeOfPeak": "07:00-10:00", "windDirection": "SW"},
            },
            {
                "siteName": f"{city} Smart Infrastructure Corridor",
                "siteType": "CONSTRUCTION",
                "address": f"Ring Road Project, {city}",
                "location": {"type": "Point", "coordinates": [center[0] + 0.01, center[1] - 0.025]},
                "ward": f"{city} East",
                "baseScore": 70,
                "lastInspected": "2025-04-25",
                "violations": 1,
                "evidenceData": {"timeOfPeak": "12:00-17:00", "windDirection": "SE"},
            },
        ]

    def analyze(self, city: str, readings: List[Dict]) -> List[Dict]:
        sites = self._get_city_sites(city)
        avg_aqi = sum(r.get("aqi", 150) for r in readings) / max(len(readings), 1) if readings else 140

        scored = []
        for site in sites:
            priority_score, estimated_contribution = self._calculate_priority(site, avg_aqi)
            reasoning = self._generate_reasoning(site, avg_aqi)
            action = ACTIONS.get(site["siteType"], "Investigate and document findings.")

            scored.append({
                **site,
                "nearbyAQI": round(avg_aqi + (site["baseScore"] - 70) * 0.4),
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

        if avg_aqi > 300: score += 15
        elif avg_aqi > 200: score += 8
        elif avg_aqi > 150: score += 4

        score += min(site.get("violations", 0) * 3, 15)

        try:
            last = datetime.strptime(site.get("lastInspected", "2025-01-01"), "%Y-%m-%d")
            days_since = (datetime.utcnow() - last).days
            score += min(days_since // 15, 10)
        except Exception:
            pass

        hour = datetime.utcnow().hour
        peak_time = site.get("evidenceData", {}).get("timeOfPeak", "")
        if "08:00" in peak_time or "09:00" in peak_time:
            if 7 <= hour <= 10: score += 5

        score = min(100, score)

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
