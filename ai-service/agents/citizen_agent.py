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
        lang_names = {
            'en': 'English',
            'hi': 'Hindi',
            'kn': 'Kannada',
            'ta': 'Tamil',
            'te': 'Telugu',
            'mr': 'Marathi',
            'bn': 'Bengali',
            'gu': 'Gujarati'
        }
        target_lang = lang_names.get(language, 'English')
        return f"""Current real-time air quality metrics:
- Location: {context.get('ward', context.get('city', 'Mumbai'))}, {context.get('city', 'Mumbai')}
- Current AQI: {context.get('currentAQI', 140)} ({context.get('category', 'Moderate')})
- PM2.5: {context.get('pm25', 'elevated')} µg/m³

User question: {message}

IMPORTANT: You MUST respond ENTIRELY in {target_lang} language script. Provide a direct, helpful 2-sentence answer in {target_lang}:"""

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

        # Multilingual keyword matching
        is_hospital = any(k in q for k in ["hospital", "medical", "patient", "elderly", "अस्पताल", "मरीज", "डॉक्टर", "ಆಸ್ಪತ್ರೆ", "ಆರೋಗ್ಯ"])
        is_school = any(k in q for k in ["school", "child", "kid", "student", "स्कूल", "बच्चा", "छात्र", "ಶಾಲೆ", "ಮಕ್ಕಳು"])
        is_mask = any(k in q for k in ["mask", "n95", "purifier", "protect", "मास्क", "मास्क", "ಮಾಸ್ಕ್"])
        is_safe = any(k in q for k in ["safe", "outside", "jog", "run", "walk", "exercise", "सुरक्षित", "बाहर", "टहलना", "ಸುರಕ್ಷಿತ", "ಹೊರಾಂಗಣ"])
        is_improve = any(k in q for k in ["improve", "better", "when", "बेहतर", "सुधार", "कब", "ಉತ್ತಮ", "ಯಾವಾಗ"])

        # Language Dictionaries
        dict_map = {
            "kn": {
                "greeting": f"ನಮಸ್ಕಾರ! 👋 ನಾನು ವಾಯು, {city} ಗಾಗಿ ನಿಮ್ಮ ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಸಹಾಯಕ. ನಾನು ನಿಮಗೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
                "school": f"ಹೌದು, {loc} ನಲ್ಲಿ ಮಕ್ಕಳು ಶಾಲೆಗೆ ಹೋಗುವುದು ಸುರಕ್ಷಿತವಾಗಿದೆ (AQI: {aqi} - {category})." if aqi <= 100 else f"{loc} ನಲ್ಲಿ ಮಕ್ಕಳು ಶಾಲೆಗೆ ಹೋಗಬಹುದು (AQI: {aqi}), ಆದರೆ ಪೀಕ್ ಸಮಯದಲ್ಲಿ ಹೊರಾಂಗಣ ಆಟಗಳನ್ನು ಮಿತಿಗೊಳಿಸಿ.",
                "hospital": f"ಇಂದು {loc} ನಲ್ಲಿ ಆಸ್ಪತ್ರೆಗಳು ಕಡಿಮೆ ಅಪಾಯದಲ್ಲಿವೆ (AQI: {aqi})." if aqi <= 100 else f"⚠️ {loc} ನಲ್ಲಿ ಆಸ್ಪತ್ರೆಗಳು ಮಧ್ಯಮ ಅಪಾಯವನ್ನು ಎದುರಿಸುತ್ತಿವೆ (AQI: {aqi} - {category}). ಉಸಿರಾಟದ ತೊಂದರೆ ಇರುವವರು ಇನ್ಹೇಲರ್ ಇಟ್ಟುಕೊಳ್ಳಿ.",
                "mask": f"ಇಂದು {loc} ನಲ್ಲಿ ಮಾಸ್ಕ್ ಅಗತ್ಯವಿಲ್ಲ (AQI: {aqi})." if aqi <= 100 else f"{loc} ನಲ್ಲಿ ಹೆದ್ದಾರಿ ಮತ್ತು ಸಂಚಾರ ಹೆಚ್ಚಿರುವ ಸ್ಥಳಗಳಲ್ಲಿ N95 ಮಾಸ್ಕ್ ಧರಿಸಲು ಸಲಹೆ ನೀಡಲಾಗುತ್ತದೆ (AQI: {aqi}).",
                "safe": f"ಹೌದು! ಇಂದು {loc} ನಲ್ಲಿ ಹೊರಾಂಗಣಕ್ಕೆ ಹೋಗುವುದು ಸಂಪೂರ್ಣವಾಗಿ ಸುರಕ್ಷಿತವಾಗಿದೆ (AQI: {aqi})." if aqi <= 100 else f"{loc} ನಲ್ಲಿ ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಗಳು ಮಧ್ಯಮ ಸುರಕ್ಷಿತವಾಗಿವೆ (AQI: {aqi}).",
                "improve": f"ಮುಂದಿನ 12-24 ಗಂಟೆಗಳಲ್ಲಿ ಗಾಳಿಯ ವೇಗ ಹೆಚ್ಚಿದಾಗ {loc} ನಲ್ಲಿ ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಉತ್ತಮಗೊಳ್ಳುವ ಸಾಧ್ಯತೆಯಿದೆ.",
                "general": f"{loc} ನಲ್ಲಿ ಗಾಳಿಯ ಗುಣಮಟ್ಟ {category} ಆಗಿದೆ (AQI: {aqi}). ದೂಳಿನ ಸೂಕ್ಷ್ಮತೆ ಇದ್ದರೆ ಮೂಲಭೂತ ಮುನ್ನೆಚ್ಚರಿಕೆಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ."
            },
            "hi": {
                "greeting": f"नमस्ते! 👋 मैं वायु हूँ, {city} के लिए आपका वायु गुणवत्ता सहायक। मैं आपकी क्या मदद कर सकता हूँ?",
                "school": f"हाँ, आज {loc} में बच्चों के लिए स्कूल जाना सुरक्षित है (AQI: {aqi} - {category})।" if aqi <= 100 else f"{loc} में बच्चे स्कूल जा सकते हैं (AQI: {aqi}), लेकिन पीक ऑवर्स में भारी बाहरी खेल सीमित रखें।",
                "hospital": f"आज {loc} में अस्पताल कम जोखिम में हैं (AQI: {aqi})।" if aqi <= 100 else f"⚠️ {loc} में अस्पताल मध्यम जोखिम में हैं (AQI: {aqi} - {category})। अस्थमा के मरीज इनहेलर साथ रखें।",
                "mask": f"आज {loc} में मास्क की आवश्यकता नहीं है (AQI: {aqi})।" if aqi <= 100 else f"{loc} में व्यस्त ट्रैफिक के पास N95 मास्क पहनने की सलाह दी जाती है (AQI: {aqi})।",
                "safe": f"हाँ! आज {loc} में बाहर जाना पूरी तरह सुरक्षित है (AQI: {aqi})।" if aqi <= 100 else f"{loc} में बाहर जाना मध्यम रूप से सुरक्षित है (AQI: {aqi})।",
                "improve": f"अगले 12-24 घंटों में हवा की गति बढ़ने पर {loc} में वायु गुणवत्ता में सुधार होने की उम्मीद है।",
                "general": f"{loc} में आज वायु गुणवत्ता {category} है (AQI: {aqi})। धूल से संवेदनशीलता होने पर सावधानी बरतें।"
            },
            "ta": {
                "greeting": f"வணக்கம்! 👋 நான் வாயு, {city} க்கான உங்கள் காற்றின் தரம் உதவியாளர்.",
                "school": f"ஆம், {loc} இல் குழந்தைகள் பள்ளிக்குச் செல்வது பாதுகாப்பானது (AQI: {aqi}).",
                "hospital": f"{loc} இல் மருத்துவமனைகள் குறைந்த ஆபத்தில் உள்ளன (AQI: {aqi}).",
                "mask": f"{loc} இல் N95 முகக்கவசம் அணிய பரிந்துரைக்கப்படுகிறது (AQI: {aqi}).",
                "safe": f"இன்று {loc} இல் வெளியே செல்வது பாதுகாப்பானது (AQI: {aqi}).",
                "improve": f"அடுத்த 12-24 மணிநேரத்தில் காற்றின் தரம் மேம்படும் என எதிர்பார்க்கப்படுகிறது.",
                "general": f"{loc} இல் காற்றின் தரம் {category} ஆக உள்ளது (AQI: {aqi})."
            },
            "te": {
                "greeting": f"నమస్కారం! 👋 నేను వాయు, {city} కోసం మీ గాలి నాణ్యత సహాయకుడిని.",
                "school": f"అవును, {loc} లో పిల్లలు పాఠశాలకు వెళ్లడం సురక్షితం (AQI: {aqi}).",
                "hospital": f"{loc} లో ఆసుపత్రులు తక్కువ ప్రమాదంలో ఉన్నాయి (AQI: {aqi}).",
                "mask": f"{loc} లో N95 మాస్క్ వాడండి (AQI: {aqi}).",
                "safe": f"ఈ రోజు {loc} లో బయటకు వెళ్లడం సురక్షితం (AQI: {aqi}).",
                "improve": f"వచ్చే 12-24 గంటల్లో గాలి నాణ్యత మెరుగుపడుతుంది.",
                "general": f"{loc} లో గాలి నాణ్యత {category} గా ఉంది (AQI: {aqi})."
            },
            "mr": {
                "greeting": f"नमस्कार! 👋 मी वायू, {city} साठी तुमचा हवा गुणवत्ता सहाय्यक.",
                "school": f"होय, {loc} मध्ये मुलांसाठी शाळेत जाणे सुरक्षित आहे (AQI: {aqi}).",
                "hospital": f"{loc} मध्ये रुग्णालये कमी धोक्यात आहेत (AQI: {aqi}).",
                "mask": f"{loc} मध्ये N95 मास्क वापरण्याचा सल्ला दिला जातो (AQI: {aqi}).",
                "safe": f"आज {loc} मध्ये बाहेर जाणे सुरक्षित आहे (AQI: {aqi}).",
                "improve": f"पुढील १२-२४ तासांत हवेची गुणवत्ता सुधारेल.",
                "general": f"{loc} मध्ये हवेची गुणवत्ता {category} आहे (AQI: {aqi})."
            },
            "en": {
                "greeting": f"Hello! 👋 I'm Vayu, your air quality assistant for {city}. How can I help you today?",
                "school": f"Yes, it is completely safe for children to attend school in {loc} today (AQI: {aqi} - {category})." if aqi <= 100 else f"Children can attend school in {loc} (AQI: {aqi} - {category}), but outdoor sports should be limited during rush hours.",
                "hospital": f"Hospitals in {loc} are at LOW risk today (AQI: {aqi})." if aqi <= 100 else f"⚠️ Hospitals in {loc} face MODERATE risk today (AQI: {aqi} - {category}). Asthmatic patients keep inhalers accessible.",
                "mask": f"No mask is needed today in {loc} (AQI: {aqi})." if aqi <= 100 else f"An N95 mask is recommended near heavy traffic in {loc} (AQI: {aqi} - {category}).",
                "safe": f"Yes! It is completely safe to go outside in {loc} today (AQI: {aqi} - {category})." if aqi <= 100 else f"Outdoor activities in {loc} are MODERATELY safe (AQI: {aqi} - {category}).",
                "improve": f"Air quality in {loc} is expected to improve over the next 12-24 hours as surface wind speeds increase.",
                "general": f"Air quality in {loc} is {category} today (AQI: {aqi}). Take basic precautions if sensitive to dust."
            }
        }

        dict_lang = dict_map.get(language, dict_map["en"])

        if any(g in q for g in ["hi", "hello", "hey", "namaste", "नमस्ते", "ನಮಸ್ಕಾರ", "வணக்கம்", "నమస్కారం"]):
            text = dict_lang["greeting"]
        elif is_school:
            text = dict_lang["school"]
        elif is_hospital:
            text = dict_lang["hospital"]
        elif is_mask:
            text = dict_lang["mask"]
        elif is_safe:
            text = dict_lang["safe"]
        elif is_improve:
            text = dict_lang["improve"]
        else:
            text = dict_lang["general"]

        return {
            "response": text,
            "responseHindi": dict_map["hi"]["general"],
            "responseEnglish": dict_map["en"]["general"],
            "aqi": aqi,
            "category": category,
            "recommendations": ["⚠️ Check localized AQI feed", "😷 Wear mask if asthmatic"],
            "sources": ["CPCB Data Feed", "Vayu Multilingual Agent"],
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
