"""
Knowledge base for the Vayu Intelligence RAG layer.

Curated, paraphrased facts from real Indian air-quality policy and global
health guidance so the Citizen Advisory agent can give *grounded, cited*
answers instead of inventing health advice.

Sources referenced (paraphrased for the demo, not verbatim):
- CPCB Graded Response Action Plan (GRAP) stages
- CPCB National Air Quality Index categories & health breakpoints
- WHO Global Air Quality Guidelines (2021)
- Indian Council of Medical Research (ICMR) advisories for vulnerable groups
"""

from typing import List, Dict

KNOWLEDGE_BASE: List[Dict] = [
    {
        "source": "CPCB GRAP Stage I (Poor, AQI 201-300)",
        "tags": ["grap", "poor", "enforcement", "policy"],
        "text": (
            "GRAP Stage I activates when AQI is Poor (201-300). Measures: enforce "
            "dust control at construction & demolition sites, ensure water sprinkling "
            "on roads, ban open waste burning, and tighten emission checks on older "
            "vehicles. Citizens should avoid prolonged outdoor exertion."
        ),
    },
    {
        "source": "CPCB GRAP Stage II (Very Poor, AQI 301-400)",
        "tags": ["grap", "very poor", "enforcement", "policy"],
        "text": (
            "GRAP Stage II activates at Very Poor AQI (301-400). Measures: increase "
            "parking fees to discourage private vehicles, augment public transport, "
            "run mechanised road sweeping and water sprinkling daily, and regulate "
            "diesel generator use. Vulnerable groups should remain indoors."
        ),
    },
    {
        "source": "CPCB GRAP Stage III (Severe, AQI 401-450)",
        "tags": ["grap", "severe", "enforcement", "construction"],
        "text": (
            "GRAP Stage III activates at Severe AQI (401-450). Measures: ban "
            "non-essential construction and demolition, close stone crushers and "
            "mining, restrict polluting industries, and consider staggered school "
            "timings. Outdoor activity should be avoided by everyone."
        ),
    },
    {
        "source": "CPCB GRAP Stage IV (Severe+, AQI > 450)",
        "tags": ["grap", "emergency", "severe"],
        "text": (
            "GRAP Stage IV (Severe+, AQI above 450) is an emergency. Measures: ban "
            "truck entry except essentials, halt all construction, and allow state "
            "governments to shift schools online and run offices at reduced capacity. "
            "Everyone should stay indoors with air purifiers running."
        ),
    },
    {
        "source": "WHO Air Quality Guidelines 2021 (PM2.5)",
        "tags": ["who", "pm25", "health"],
        "text": (
            "WHO recommends annual mean PM2.5 below 5 µg/m³ and 24-hour mean below "
            "15 µg/m³. Long-term exposure to fine particulate matter penetrates deep "
            "into the lungs and bloodstream, raising the risk of heart disease, "
            "stroke, lung cancer, and respiratory infections."
        ),
    },
    {
        "source": "ICMR advisory for vulnerable groups",
        "tags": ["vulnerable", "children", "elderly", "asthma", "pregnant", "health"],
        "text": (
            "Children, the elderly, pregnant women, and people with asthma, COPD, or "
            "heart disease are most sensitive to air pollution. On Poor or worse days "
            "they should stay indoors, avoid morning and evening rush-hour exposure, "
            "use N95 masks outdoors, and keep rescue inhalers accessible."
        ),
    },
    {
        "source": "Mask guidance (CPCB / health departments)",
        "tags": ["mask", "n95", "protection"],
        "text": (
            "Cloth and surgical masks do not filter fine PM2.5 particles. A properly "
            "fitted N95 or N99 respirator is needed for protection on Very Poor and "
            "Severe days. Masks must seal around the nose and chin to be effective."
        ),
    },
    {
        "source": "Indoor air protection guidance",
        "tags": ["indoor", "purifier", "home", "protection"],
        "text": (
            "Indoors, keep windows closed during peak pollution (typically 7-11 AM "
            "and 6-10 PM), seal gaps under doors, avoid burning incense or candles, "
            "and run a HEPA air purifier sized for the room. Houseplants do not "
            "meaningfully reduce PM2.5."
        ),
    },
    {
        "source": "Health helplines (India)",
        "tags": ["emergency", "helpline", "health"],
        "text": (
            "For pollution-related health symptoms such as breathlessness, chest "
            "tightness, or persistent cough, call the national health helpline 104. "
            "For medical emergencies dial 108 for an ambulance."
        ),
    },
    {
        "source": "Source attribution context (urban India)",
        "tags": ["source", "attribution", "traffic", "construction", "industry"],
        "text": (
            "In large Indian cities the dominant PM2.5 sources are vehicular exhaust, "
            "road and construction dust, industrial emissions, and seasonal biomass "
            "or crop-residue burning. Targeting the largest local source during a "
            "spike yields the fastest air-quality improvement."
        ),
    },
]


def build_store():
    """Build and populate the vector store with the knowledge base."""
    from rag.vector_store import VectorStore

    store = VectorStore(use_embeddings=True)
    store.add_documents(KNOWLEDGE_BASE)
    print(f"📚 RAG knowledge base loaded: {len(KNOWLEDGE_BASE)} docs (mode={store.mode})")
    return store


if __name__ == "__main__":
    s = build_store()
    for doc, score in s.search("should children go outside when AQI is very poor?", k=3):
        print(f"[{score:.3f}] {doc['source']}\n   {doc['text'][:90]}...")
