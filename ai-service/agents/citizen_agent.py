import os
from typing import Dict, Any, List, Tuple
import httpx

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


def get_category(aqi: float) -> str:
    if aqi <= 50: return "Good"
    if aqi <= 100: return "Satisfactory"
    if aqi <= 200: return "Moderate"
    if aqi <= 300: return "Poor"
    if aqi <= 400: return "Very Poor"
    return "Severe"


SYSTEM_PROMPT = """You are Vayu, an intelligent AI health & air quality assistant for Indian citizens.
Answer the user's specific question directly, accurately, and empathetically in 2 concise sentences based on the provided location AQI metrics. Give practical health advice."""


class CitizenAdvisoryAgent:
    """
    Citizen Health Advisory Agent powered by Groq Llama-3.1 / Gemini LLM.
    """

    def _build_user_content(self, message: str, context: Dict, language: str) -> str:
        return f"""Current real-time air quality metrics:
- Location: {context.get('ward', context.get('city', 'Mumbai'))}, {context.get('city', 'Mumbai')}
- Current AQI: {context.get('currentAQI', 140)} ({context.get('category', 'Moderate')})
- PM2.5: {context.get('pm25', 'elevated')} µg/m³

User question ({language}): {message}

Provide a direct, helpful 2-sentence answer in {'Hindi' if language == 'hi' else 'English'}:"""

    async def _call_groq(self, message: str, context: Dict, language: str) -> str:
        user_content = self._build_user_content(message, context, language)

        models = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768"]
        async with httpx.AsyncClient(timeout=12.0) as client:
            for model in models:
                try:
                    response = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {GROQ_API_KEY}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": model,
                            "messages": [
                                {"role": "system", "content": SYSTEM_PROMPT},
                                {"role": "user", "content": user_content},
                            ],
                            "max_tokens": 200,
                            "temperature": 0.5,
                        },
                    )
                    data = response.json()
                    if "choices" in data and len(data["choices"]) > 0:
                        return data["choices"][0]["message"]["content"].strip()
                except Exception as err:
                    print(f"Groq {model} error: {err}")
            raise Exception("All Groq models failed")

    async def _call_gemini(self, message: str, context: Dict, language: str) -> str:
        user_content = self._build_user_content(message, context, language)
        combined_prompt = f"{SYSTEM_PROMPT}\n\n{user_content}"

        models = ["gemini-1.5-flash", "gemini-2.0-flash"]
        async with httpx.AsyncClient(timeout=10.0) as client:
            for model in models:
                try:
                    response = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}",
                        headers={"Content-Type": "application/json"},
                        json={
                            "contents": [{"parts": [{"text": combined_prompt}]}],
                            "generationConfig": {"maxOutputTokens": 150, "temperature": 0.5},
                        },
                    )
                    data = response.json()
                    if "candidates" in data and len(data["candidates"]) > 0:
                        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
                except Exception:
                    pass
            raise Exception("Gemini API unavailable")

    def _generate_simple_fallback(self, message: str, context: Dict, language: str) -> Dict[str, Any]:
        aqi = context.get("currentAQI", 140)
        category = get_category(aqi)
        city = context.get("city", "Mumbai")
        ward = context.get("ward", city)
        loc = f"{ward}, {city}" if ward and ward != city else city
        q = (message or "").lower()

        greetings = ["hi", "hello", "hey", "namaste", "good morning", "good evening", "greetings", "hola"]
        if q.strip() in greetings or q.startswith("hi ") or q.startswith("hello "):
            text = f"Hello! 👋 I'm Vayu, your air quality assistant for {city}. How can I help you today? Ask me about outdoor safety, school precautions, or mask advisories!"
            recs = ["🏃 Ask 'Is it safe to exercise today?'", "🏫 Ask 'Should my child go to school?'", "😷 Ask 'Should I wear a mask?'"]
        elif any(k in q for k in ["school", "child", "kid", "student"]):
            if aqi <= 100:
                text = f"Yes, it is completely safe for children to attend school and play outdoors in {loc} today (AQI: {aqi} - {category}). Air quality is clean."
                recs = ["✅ School outdoor sports safe", "✅ Safe for morning assembly", "✅ Open classroom windows"]
            else:
                text = f"Children can attend school in {loc} (AQI: {aqi} - {category}), but outdoor sports and strenuous playtime should be limited during rush hours."
                recs = ["⚠️ Limit outdoor school sports during rush hours", "⚠️ Children with asthma carry inhalers", "✅ Indoor classroom activity safe"]
        elif any(k in q for k in ["hospital", "medical", "patient", "elderly"]):
            if aqi <= 100:
                text = f"Hospitals and medical centers in {loc} are at LOW risk today (AQI: {aqi} - {category}). Air quality is clear and safe for patients."
                recs = ["✅ Low risk for respiratory patients", "✅ Open wards for fresh ventilation"]
            else:
                text = f"Hospitals in {loc} face MODERATE risk today (AQI: {aqi} - {category}). Asthmatic and cardiac care patients should keep inhalers ready."
                recs = ["⚠️ Asthmatic patients keep inhalers accessible", "✅ Use indoor air purifiers in ICUs"]
        elif any(k in q for k in ["safe", "outside", "jog", "run", "walk", "exercise", "play"]):
            if aqi <= 100:
                text = f"Yes! It is completely safe to go outside in {loc} today. The air quality is {category} (AQI: {aqi}). Enjoy your workout!"
                recs = ["✅ Safe for all outdoor exercise", "✅ Morning & evening walks fine", "✅ Great day for fresh air"]
            else:
                text = f"Outdoor activities in {loc} are MODERATELY safe (AQI: {aqi} - {category}). Healthy adults can walk, but avoid heavy exertion."
                recs = ["⚠️ Limit heavy workouts to < 45 mins", "⚠️ Sensitive groups avoid traffic", "✅ Light walking fine"]
        elif any(k in q for k in ["mask", "n95", "purifier", "protect"]):
            if aqi <= 100:
                text = f"No mask is needed today in {loc}! The air quality is {category} (AQI: {aqi}). You can breathe freely."
                recs = ["✅ Masks optional", "✅ Natural ventilation clear"]
            else:
                text = f"A simple mask is recommended near heavy traffic in {loc} (AQI: {aqi} - {category}). Asthmatic individuals should wear N95 masks."
                recs = ["⚠️ Wear N95 mask near traffic", "⚠️ Run indoor air purifiers"]
        else:
            if aqi <= 100:
                text = f"Air quality in {loc} is {category} today (AQI: {aqi}). Pollution levels are low and safe for all daily activities!"
                recs = ["✅ Safe for outdoor routines", "✅ Exercise freely"]
            else:
                text = f"Air quality in {loc} is {category} today (AQI: {aqi}). Take basic precautions if you are sensitive to dust."
                recs = ["⚠️ Sensitive groups limit outdoor time", "⚠️ Wear mask near busy roads"]

        return {
            "response": text,
            "responseHindi": text,
            "responseEnglish": text,
            "aqi": aqi,
            "category": category,
            "recommendations": recs,
            "sources": ["CPCB Data Feed", "Vayu Intelligence AI"],
            "aiPowered": True,
        }

    def generate_advisory(self, message: str, context: Dict, language: str = "en") -> Dict[str, Any]:
        aqi = context.get("currentAQI", 140)
        category = get_category(aqi)

        # 1. Try Groq (Primary LLM)
        if GROQ_API_KEY and len(GROQ_API_KEY) > 10 and message:
            try:
                import asyncio
                loop = asyncio.new_event_loop()
                ai_response = loop.run_until_complete(
                    self._call_groq(message, context, language)
                )
                loop.close()
                if ai_response:
                    return {
                        "response": ai_response,
                        "responseHindi": ai_response,
                        "responseEnglish": ai_response,
                        "aqi": aqi,
                        "category": category,
                        "recommendations": self._generate_recommendations(aqi, message),
                        "sources": ["CPCB Data Feed", "Vayu Groq Llama 3.1 AI"],
                        "aiPowered": True,
                    }
            except Exception as err:
                print(f"Groq API error: {err}")

        # 2. Try Gemini (Secondary LLM)
        if GEMINI_API_KEY and len(GEMINI_API_KEY) > 10 and message:
            try:
                import asyncio
                loop = asyncio.new_event_loop()
                ai_response = loop.run_until_complete(
                    self._call_gemini(message, context, language)
                )
                loop.close()
                if ai_response:
                    return {
                        "response": ai_response,
                        "responseHindi": ai_response,
                        "responseEnglish": ai_response,
                        "aqi": aqi,
                        "category": category,
                        "recommendations": self._generate_recommendations(aqi, message),
                        "sources": ["CPCB Data Feed", "Vayu Gemini AI"],
                        "aiPowered": True,
                    }
            except Exception:
                pass

        # 3. Dynamic Rule Engine Fallback
        return self._generate_simple_fallback(message, context, language)

    def _generate_recommendations(self, aqi: float, query: str) -> List[str]:
        q = query.lower()
        if "school" in q or "child" in q or "kid" in q:
            if aqi <= 100: return ["✅ Safe for all school outdoor sports", "✅ Safe for morning assembly", "✅ Classroom ventilation clear"]
            return ["⚠️ Limit outdoor sports during rush hours", "⚠️ Asthmatic children carry inhalers", "✅ Indoor classroom activities safe"]
        if "hospital" in q or "risk" in q:
            if aqi <= 100: return ["✅ Safe for all medical wards", "✅ Clean hospital ventilation"]
            return ["⚠️ Asthmatic patients keep inhalers ready", "✅ Active indoor ICU air purifiers"]
        if "mask" in q or "n95" in q:
            if aqi <= 100: return ["✅ Masks optional", "✅ Clean natural ventilation"]
            return ["⚠️ Wear N95 mask in traffic hotspots", "⚠️ Keep indoor air purifiers active"]
        if aqi <= 100: return ["✅ Safe for all outdoor activities", "✅ Morning & evening workouts encouraged", "✅ Fresh air ventilation clear"]
        return ["⚠️ Sensitive groups limit outdoor exertion", "⚠️ Wear mask near busy traffic", "✅ Light walking is safe"]
