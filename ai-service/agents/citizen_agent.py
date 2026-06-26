import os
from typing import Dict, Any, List, Tuple
import httpx

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")


def _retrieve_grounding(query: str, category: str, k: int = 3) -> List[Tuple[str, str]]:
    """Pull relevant policy/health passages from the RAG store.

    Returns a list of (source, text) tuples. Fully defensive — if the RAG
    layer is unavailable for any reason, returns an empty list so the
    advisory still works.
    """
    try:
        from rag.vector_store import get_store

        store = get_store()
        # Blend the user's question with the current severity for better recall
        enriched = f"{query} air quality {category}".strip()
        results = store.search(enriched, k=k)
        return [(doc["source"], doc["text"]) for doc, _score in results]
    except Exception as e:  # pragma: no cover - defensive
        print(f"RAG retrieval skipped: {e}")
        return []


def get_category(aqi: float) -> str:
    if aqi <= 50: return "Good"
    if aqi <= 100: return "Satisfactory"
    if aqi <= 200: return "Moderate"
    if aqi <= 300: return "Poor"
    if aqi <= 400: return "Very Poor"
    return "Severe"


FALLBACK_ADVISORIES = {
    "Good": {
        "en": "Air quality is Good today. Enjoy outdoor activities freely — it's a great day for a morning jog or sports.",
        "hi": "आज वायु गुणवत्ता अच्छी है। बाहरी गतिविधियों का स्वतंत्र रूप से आनंद लें।",
    },
    "Satisfactory": {
        "en": "Air quality is Satisfactory. Outdoor activities are generally safe. Very sensitive individuals may want to limit extended exertion.",
        "hi": "वायु गुणवत्ता संतोषजनक है। बाहरी गतिविधियाँ सामान्यतः सुरक्षित हैं।",
    },
    "Moderate": {
        "en": "Air quality is Moderate. Children, elderly, and those with respiratory conditions should limit prolonged outdoor activities. Wear a mask if going out.",
        "hi": "वायु गुणवत्ता मध्यम है। बच्चे, बुजुर्ग और अस्थमा रोगी बाहरी गतिविधियाँ सीमित करें।",
    },
    "Poor": {
        "en": "⚠️ Air quality is Poor. Avoid outdoor exercise. Keep children and elderly indoors. Close windows during peak traffic hours.",
        "hi": "⚠️ वायु गुणवत्ता खराब है। बाहर व्यायाम से बचें। बच्चे और बुजुर्ग घर के अंदर रहें।",
    },
    "Very Poor": {
        "en": "🚨 Air quality is Very Poor. Stay indoors. Use N95 mask if you must go out. Run air purifiers. Seek medical attention if experiencing breathing difficulty.",
        "hi": "🚨 वायु गुणवत्ता बहुत खराब है। घर के अंदर रहें। N95 मास्क का उपयोग करें।",
    },
    "Severe": {
        "en": "🆘 SEVERE air quality emergency! Do NOT go outside. Close all windows. Call health helpline 104 if experiencing any symptoms.",
        "hi": "🆘 गंभीर वायु गुणवत्ता आपातकाल! बाहर न जाएं। 104 हेल्पलाइन पर कॉल करें।",
    },
}

RECOMMENDATIONS = {
    "Good": ["✅ Safe for all outdoor activities", "✅ Exercise freely", "✅ Open windows for fresh air"],
    "Satisfactory": ["✅ Outdoor activities generally safe", "⚠️ Sensitive individuals be cautious", "✅ Morning walks fine"],
    "Moderate": ["⚠️ Limit outdoor time to under 2 hours", "⚠️ Wear surgical mask if outdoors", "✅ Keep windows closed 8-11AM"],
    "Poor": ["🚫 Avoid outdoor exercise", "🚫 Keep children/elderly indoors", "⚠️ N95 mask mandatory outdoors", "⚠️ Run air purifier indoors"],
    "Very Poor": ["🆘 Stay indoors", "🆘 Seal window gaps", "🆘 N95 mask + stay under 30 min if must go out", "📞 Call 104 if breathing issues"],
    "Severe": ["🆘 Do NOT go outside", "🆘 Seal all gaps", "🆘 Emergency health advisory in effect", "📞 Dial 108 for medical emergency"],
}


class CitizenAdvisoryAgent:
    """
    Citizen Health Advisory Agent.
    Uses Anthropic Claude API for conversational AQI guidance.
    Falls back to rule-based advisories if API unavailable.
    """

    async def _call_claude(self, message: str, context: Dict, language: str, grounding: List[Tuple[str, str]]) -> str:
        """Call Anthropic Claude API for a personalized advisory."""
        system_prompt = """You are Vayu, a friendly AI assistant helping Indian citizens understand air quality and protect their health.

        You answer questions in a helpful, empathetic, and practical way. You:
        - Speak simply and clearly, avoiding jargon
        - Give specific, actionable advice based on the current AQI level
        - Mention vulnerable groups (children, elderly, pregnant women, asthmatic patients) where relevant
        - Keep answers concise (3-5 sentences)
        - If asked in Hindi, respond primarily in Hindi
        - Always prioritize public health and safety
        - Ground your advice in the official guidance provided below; do not invent policy details

        You have access to real-time AQI data for the user's location."""

        grounding_block = ""
        if grounding:
            joined = "\n".join(f"- ({src}) {txt}" for src, txt in grounding)
            grounding_block = f"\n\nOfficial guidance you may cite:\n{joined}"

        user_content = f"""Current air quality data:
- Location: {context.get('ward', context.get('city', 'Mumbai'))}
- AQI: {context.get('currentAQI', 150)} ({context.get('category', 'Moderate')})
- PM2.5: {context.get('pm25', 'N/A')} µg/m³{grounding_block}

User question ({language}): {message}

Please respond helpfully in {'Hindi' if language == 'hi' else 'English'}."""

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-6",
                    "max_tokens": 400,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_content}],
                },
            )
            data = response.json()
            return data["content"][0]["text"]

    def generate_advisory(self, message: str, context: Dict, language: str = "en") -> Dict[str, Any]:
        """Generate advisory — tries LLM first, falls back to rule-based."""
        aqi = context.get("currentAQI", 150)
        category = get_category(aqi)

        # Retrieve grounded policy/health context (RAG) — defensive, may be empty
        grounding = _retrieve_grounding(message or category, category, k=3)
        grounding_sources = [src for src, _ in grounding]

        # Try LLM if API key available
        if ANTHROPIC_API_KEY and ANTHROPIC_API_KEY != "your_anthropic_api_key_here" and message:
            try:
                import asyncio
                loop = asyncio.new_event_loop()
                ai_response = loop.run_until_complete(
                    self._call_claude(message, context, language, grounding)
                )
                loop.close()
                return {
                    "response": ai_response,
                    "responseHindi": FALLBACK_ADVISORIES.get(category, FALLBACK_ADVISORIES["Moderate"])["hi"],
                    "responseEnglish": ai_response,
                    "aqi": aqi,
                    "category": category,
                    "recommendations": RECOMMENDATIONS.get(category, RECOMMENDATIONS["Moderate"]),
                    "sources": ["CPCB CAAQMS", "Vayu Intelligence AI (Claude)"] + grounding_sources,
                    "groundedOn": grounding_sources,
                    "aiPowered": True,
                }
            except Exception as e:
                print(f"Claude API error: {e}, falling back to rule-based")

        # Rule-based fallback
        fallback = FALLBACK_ADVISORIES.get(category, FALLBACK_ADVISORIES["Moderate"])
        return {
            "response": fallback["hi"] if language == "hi" else fallback["en"],
            "responseHindi": fallback["hi"],
            "responseEnglish": fallback["en"],
            "aqi": aqi,
            "category": category,
            "recommendations": RECOMMENDATIONS.get(category, RECOMMENDATIONS["Moderate"]),
            "sources": ["CPCB CAAQMS", "Vayu Intelligence Rule Engine"] + grounding_sources,
            "groundedOn": grounding_sources,
            "aiPowered": False,
        }
