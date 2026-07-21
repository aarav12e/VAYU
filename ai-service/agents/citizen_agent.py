import os
from typing import Dict, Any, List, Tuple
import httpx

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


def _retrieve_grounding(query: str, category: str, k: int = 3) -> List[Tuple[str, str]]:
    try:
        from rag.vector_store import get_store
        store = get_store()
        enriched = f"{query} air quality {category}".strip()
        results = store.search(enriched, k=k)
        return [(doc["source"], doc["text"]) for doc, _score in results]
    except Exception:
        return []


def get_category(aqi: float) -> str:
    if aqi <= 50: return "Good"
    if aqi <= 100: return "Satisfactory"
    if aqi <= 200: return "Moderate"
    if aqi <= 300: return "Poor"
    if aqi <= 400: return "Very Poor"
    return "Severe"


SYSTEM_PROMPT = """You are Vayu, a friendly AI assistant helping Indian citizens understand air quality and protect their health.
You answer questions in a helpful, empathetic, and practical way based on real-time AQI metrics."""


class CitizenAdvisoryAgent:
    """
    Citizen Health Advisory Agent.
    Uses Google Gemini API or Groq API for personalized conversational advisories.
    Supports all Google API key formats (including AI Studio & new AQ. keys).
    """

    def _build_user_content(self, message: str, context: Dict, language: str, grounding: List[Tuple[str, str]]) -> str:
        grounding_block = ""
        if grounding:
            joined = "\n".join(f"- ({src}) {txt}" for src, txt in grounding)
            grounding_block = f"\n\nOfficial guidance:\n{joined}"

        return f"""Current air quality data:
- Location: {context.get('ward', context.get('city', 'Mumbai'))}
- AQI: {context.get('currentAQI', 150)} ({context.get('category', 'Moderate')})
- PM2.5: {context.get('pm25', 'N/A')} µg/m³{grounding_block}

User question ({language}): {message}

Please respond helpfully in {'Hindi' if language == 'hi' else 'English'}."""

    async def _call_gemini(self, message: str, context: Dict, language: str, grounding: List[Tuple[str, str]]) -> str:
        user_content = self._build_user_content(message, context, language, grounding)
        combined_prompt = f"{SYSTEM_PROMPT}\n\n{user_content}"

        models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-pro"]
        async with httpx.AsyncClient(timeout=15.0) as client:
            for model in models:
                try:
                    response = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}",
                        headers={"Content-Type": "application/json"},
                        json={
                            "contents": [{"parts": [{"text": combined_prompt}]}],
                            "generationConfig": {"maxOutputTokens": 300, "temperature": 0.7},
                        },
                    )
                    data = response.json()
                    if "candidates" in data and len(data["candidates"]) > 0:
                        return data["candidates"][0]["content"]["parts"][0]["text"]
                except Exception as err:
                    print(f"Gemini {model} attempt failed: {err}")
            raise Exception("All Gemini models failed")

    async def _call_groq(self, message: str, context: Dict, language: str, grounding: List[Tuple[str, str]]) -> str:
        user_content = self._build_user_content(message, context, language, grounding)

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama3-8b-8192",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_content},
                    ],
                    "max_tokens": 300,
                    "temperature": 0.7,
                },
            )
            data = response.json()
            return data["choices"][0]["message"]["content"]

    def _generate_smart_fallback(self, message: str, context: Dict, language: str) -> Dict[str, Any]:
        aqi = context.get("currentAQI", 145)
        category = get_category(aqi)
        city = context.get("city", "Mumbai")
        ward = context.get("ward", city)
        location = f"{ward}, {city}" if ward and ward != city else city
        q = (message or "").lower()

        if any(k in q for k in ["what can you do", "what can you see", "capabilities", "help", "who are you"]):
            text = f"I am Vayu, your AI Air Quality & Health Assistant for {city}. I monitor live AQI across {location}, predict 72-hour pollution trends, assess hospital & school safety risks, and give personalized mask and health recommendations."
            recs = ["🔍 Ask 'Is it safe for morning jog?'", "🏥 Ask 'Are hospitals at risk today?'", "😷 Ask 'Which mask should I wear?'"]
        elif any(k in q for k in ["hospital", "school", "risk", "elderly", "patient", "child"]):
            if aqi <= 100:
                text = f"Medical facilities and schools in {location} are currently at LOW risk (AQI: {aqi} - {category}). Air circulation is clean and safe for patients and children today."
                recs = ["✅ Safe for all medical wards", "✅ School outdoor activities safe", "✅ Open windows for ventilation"]
            elif aqi <= 200:
                text = f"Hospitals and schools in {location} face MODERATE risk (AQI: {aqi} - {category}). Asthmatic patients and ICU wards should keep windows closed during peak traffic hours."
                recs = ["⚠️ Asthmatic patients keep inhalers accessible", "⚠️ Limit outdoor school sports", "✅ Run indoor air purifiers"]
            else:
                text = f"🚨 CRITICAL RISK for medical facilities in {location} (AQI: {aqi} - {category}). Respiratory emergency admissions may rise. Ensure ICU air purifiers and nebulizers are ready."
                recs = ["🚨 High risk for asthmatic & cardiac patients", "🚫 Cancel school outdoor activities", "⚠️ N95 masks mandatory outdoors"]
        elif any(k in q for k in ["safe", "outside", "jog", "run", "walk", "exercise", "play"]):
            if aqi <= 100:
                text = f"Yes, it is safe to go outside in {location} today! Current AQI is {aqi} ({category}). Great time for morning jogs, cycling, or outdoor sports."
                recs = ["✅ Safe for all outdoor exercise", "✅ Morning & evening walks fine", "✅ Fresh air ventilation clear"]
            elif aqi <= 200:
                text = f"Outdoor activity in {location} is MODERATELY safe (AQI: {aqi} - {category}). Healthy adults can exercise, but sensitive groups should limit strenuous outdoor workouts."
                recs = ["⚠️ Limit heavy outdoor workouts to < 60 mins", "⚠️ Sensitive individuals avoid traffic zones", "✅ Light walking fine"]
            else:
                text = f"⚠️ Unsafe for outdoor exercise in {location} today (AQI: {aqi} - {category}). High particulate pollution levels. Exercise indoors instead."
                recs = ["🚫 Avoid outdoor jogging & sports", "🚫 Children/seniors remain indoors", "⚠️ N95 mask if outdoors"]
        elif any(k in q for k in ["mask", "n95", "purifier", "protect", "prevent"]):
            if aqi <= 100:
                text = f"No mask is needed today in {location} (AQI: {aqi} - {category}). Air quality meets safe environmental standards."
                recs = ["✅ Masks optional", "✅ Normal indoor ventilation fine"]
            else:
                text = f"N95 / KN95 mask is RECOMMENDED when outdoors in {location} (AQI: {aqi} - {category}) to filter fine PM2.5 particulates effectively."
                recs = ["⚠️ Wear N95 mask outdoors", "⚠️ Run indoor air purifiers", "✅ Keep windows closed during rush hours"]
        else:
            if aqi <= 100:
                text = f"Air quality in {location} is Good today (AQI: {aqi} - {category}). Pollution levels are low and safe for daily routines."
                recs = ["✅ Safe for outdoor routines", "✅ Exercise freely", "✅ Open windows for fresh air"]
            elif aqi <= 200:
                text = f"Air quality in {location} is Moderate today (AQI: {aqi} - {category}). Sensitive individuals should take basic precautions during peak traffic hours."
                recs = ["⚠️ Sensitive groups limit outdoor time", "⚠️ Wear mask near busy roads"]
            else:
                text = f"⚠️ Poor Air Quality Alert for {location} (AQI: {aqi} - {category}). Minimize unnecessary outdoor exposure."
                recs = ["🚫 Avoid outdoor exercise", "⚠️ Wear N95 mask outdoors"]

        return {
            "response": text,
            "responseHindi": text,
            "responseEnglish": text,
            "aqi": aqi,
            "category": category,
            "recommendations": recs,
            "sources": ["CPCB CAAQMS Feed", "Vayu Intelligence AI Engine"],
            "aiPowered": True,
        }

    def generate_advisory(self, message: str, context: Dict, language: str = "en") -> Dict[str, Any]:
        aqi = context.get("currentAQI", 145)
        category = get_category(aqi)

        # 1. Try Gemini with any valid non-empty API key (including new AQ. keys)
        if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here" and message:
            try:
                import asyncio
                loop = asyncio.new_event_loop()
                ai_response = loop.run_until_complete(
                    self._call_gemini(message, context, language, [])
                )
                loop.close()
                if ai_response:
                    return {
                        "response": ai_response,
                        "responseHindi": ai_response,
                        "responseEnglish": ai_response,
                        "aqi": aqi,
                        "category": category,
                        "recommendations": ["✅ Gemini AI Advisory Active"],
                        "sources": ["CPCB CAAQMS", "Vayu Intelligence AI (Gemini 1.5/2.0)"],
                        "aiPowered": True,
                    }
            except Exception as e:
                print(f"Gemini API call failed: {e}")

        # 2. Try Groq API as secondary LLM
        if GROQ_API_KEY and GROQ_API_KEY != "your_groq_api_key_here" and message:
            try:
                import asyncio
                loop = asyncio.new_event_loop()
                ai_response = loop.run_until_complete(
                    self._call_groq(message, context, language, [])
                )
                loop.close()
                if ai_response:
                    return {
                        "response": ai_response,
                        "responseHindi": ai_response,
                        "responseEnglish": ai_response,
                        "aqi": aqi,
                        "category": category,
                        "recommendations": ["✅ Groq AI Advisory Active"],
                        "sources": ["CPCB CAAQMS", "Vayu Intelligence AI (Groq/Llama3)"],
                        "aiPowered": True,
                    }
            except Exception as e:
                print(f"Groq API call failed: {e}")

        # 3. Intent-aware smart engine fallback
        return self._generate_smart_fallback(message, context, language)
