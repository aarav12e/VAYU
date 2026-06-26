const express = require('express');
const router = express.Router();
const axios = require('axios');
const AQIReading = require('../models/AQIReading');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// POST /api/citizen/query - conversational AQI advisory
router.post('/query', async (req, res) => {
  try {
    const { message, city = 'Mumbai', language = 'en', ward } = req.body;

    // Get latest AQI for context
    const latestReading = await AQIReading.findOne({ city, ward })
      .sort({ timestamp: -1 })
      .lean() || await AQIReading.findOne({ city }).sort({ timestamp: -1 }).lean();

    const context = {
      city,
      ward: ward || city,
      currentAQI: latestReading?.aqi || 150,
      category: latestReading?.category || 'Moderate',
      pm25: latestReading?.pollutants?.pm25,
      pm10: latestReading?.pollutants?.pm10,
      timestamp: latestReading?.timestamp,
    };

    // Try AI service
    try {
      const aiResp = await axios.post(`${AI_SERVICE_URL}/citizen/advisory`, {
        message,
        context,
        language,
      });
      return res.json({ success: true, data: aiResp.data });
    } catch (aiErr) {
      // Fallback: rule-based advisory
      const advisory = generateFallbackAdvisory(context, message, language);
      return res.json({ success: true, data: advisory, fallback: true });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/citizen/ward-advisory/:city/:ward
router.get('/ward-advisory/:city/:ward', async (req, res) => {
  try {
    const { city, ward } = req.params;
    const reading = await AQIReading.findOne({ city, ward }).sort({ timestamp: -1 }).lean();

    if (!reading) {
      return res.status(404).json({ success: false, error: 'No data for this ward' });
    }

    const advisory = generateFallbackAdvisory(
      { city, ward, currentAQI: reading.aqi, category: reading.category },
      '',
      'en'
    );

    res.json({ success: true, data: { ...advisory, reading } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/citizen/vulnerable/:city - vulnerable population locations
router.get('/vulnerable/:city', async (req, res) => {
  try {
    const { city } = req.params;

    // Mock vulnerable locations data (in production: fetch from city GIS)
    const vulnerableLocations = {
      Mumbai: [
        { name: 'Lilavati Hospital', type: 'hospital', lat: 19.0476, lng: 72.8239, ward: 'Bandra' },
        { name: 'Dharavi Primary School', type: 'school', lat: 19.0392, lng: 72.8543, ward: 'Dharavi' },
        { name: 'Andheri Senior Citizens Home', type: 'elderly', lat: 19.1162, lng: 72.8462, ward: 'Andheri' },
        { name: 'Kurla Municipal School', type: 'school', lat: 19.0689, lng: 72.8829, ward: 'Kurla' },
        { name: 'Worli Community Health Center', type: 'hospital', lat: 19.0110, lng: 72.8175, ward: 'Worli' },
        { name: 'Malad Old Age Home', type: 'elderly', lat: 19.1895, lng: 72.8466, ward: 'Malad' },
      ],
    };

    const locations = vulnerableLocations[city] || [];

    // Add current AQI for each location
    const enriched = await Promise.all(
      locations.map(async (loc) => {
        const reading = await AQIReading.findOne({ city, ward: loc.ward }).sort({ timestamp: -1 }).lean();
        return {
          ...loc,
          currentAQI: reading?.aqi || null,
          category: reading?.category || null,
          riskLevel: getRiskLevel(reading?.aqi, loc.type),
        };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function getRiskLevel(aqi, locationType) {
  if (!aqi) return 'UNKNOWN';
  const multiplier = locationType === 'hospital' || locationType === 'elderly' ? 1.3 : 1;
  const effectiveAQI = aqi * multiplier;
  if (effectiveAQI <= 100) return 'LOW';
  if (effectiveAQI <= 200) return 'MODERATE';
  if (effectiveAQI <= 300) return 'HIGH';
  return 'CRITICAL';
}

function generateFallbackAdvisory(context, message, language) {
  const { currentAQI, category, city, ward } = context;

  const advisories = {
    Good: {
      en: `Air quality in ${ward || city} is Good (AQI: ${currentAQI}). It's a great day for outdoor activities including exercise and sports.`,
      hi: `${ward || city} में वायु गुणवत्ता अच्छी है (AQI: ${currentAQI})। बाहरी गतिविधियों के लिए अच्छा दिन है।`,
    },
    Satisfactory: {
      en: `Air quality in ${ward || city} is Satisfactory (AQI: ${currentAQI}). Outdoor activities are generally safe. Sensitive individuals may experience minor discomfort.`,
      hi: `${ward || city} में वायु गुणवत्ता संतोषजनक है (AQI: ${currentAQI})। बाहरी गतिविधियाँ सामान्यतः सुरक्षित हैं।`,
    },
    Moderate: {
      en: `Air quality in ${ward || city} is Moderate (AQI: ${currentAQI}). Sensitive groups (children, elderly, asthmatic patients) should limit prolonged outdoor exertion. Wear N95 mask if going out.`,
      hi: `${ward || city} में वायु गुणवत्ता मध्यम है (AQI: ${currentAQI})। संवेदनशील लोग बाहरी गतिविधियाँ सीमित करें। N95 मास्क पहनें।`,
    },
    Poor: {
      en: `⚠️ Air quality in ${ward || city} is Poor (AQI: ${currentAQI}). Avoid outdoor exercise. Children and elderly should stay indoors. Use air purifiers if available.`,
      hi: `⚠️ ${ward || city} में वायु गुणवत्ता खराब है (AQI: ${currentAQI})। बाहर व्यायाम से बचें। बच्चे और बुजुर्ग घर के अंदर रहें।`,
    },
    'Very Poor': {
      en: `🚨 Air quality in ${ward || city} is Very Poor (AQI: ${currentAQI}). Stay indoors. Avoid all outdoor activities. Keep windows closed. Seek medical attention if experiencing breathing difficulty.`,
      hi: `🚨 ${ward || city} में वायु गुणवत्ता बहुत खराब है (AQI: ${currentAQI})। घर के अंदर रहें। सभी बाहरी गतिविधियाँ बंद करें।`,
    },
    Severe: {
      en: `🆘 SEVERE air quality emergency in ${ward || city} (AQI: ${currentAQI}). Do NOT go outside. Close all doors and windows. Call health helpline 104 if experiencing any symptoms.`,
      hi: `🆘 ${ward || city} में गंभीर वायु गुणवत्ता आपातकाल (AQI: ${currentAQI})। बाहर न जाएं। 104 हेल्पलाइन पर कॉल करें।`,
    },
  };

  const cat = category || 'Moderate';
  const response = advisories[cat] || advisories['Moderate'];

  return {
    response: language === 'hi' ? response.hi : response.en,
    responseHindi: response.hi,
    responseEnglish: response.en,
    aqi: currentAQI,
    category: cat,
    recommendations: getRecommendations(currentAQI),
    sources: ['CPCB CAAQMS Data', 'Vayu Intelligence AI Model'],
  };
}

function getRecommendations(aqi) {
  if (aqi <= 100) return ['✅ Safe for all outdoor activities', '✅ Exercise freely', '✅ Open windows for ventilation'];
  if (aqi <= 200) return ['⚠️ Sensitive groups limit outdoor time', '⚠️ Wear mask if outdoors', '✅ Keep windows closed during peak hours'];
  if (aqi <= 300) return ['🚫 Avoid outdoor exercise', '🚫 Keep children indoors', '⚠️ Use N95 masks if going out', '⚠️ Run air purifier indoors'];
  return ['🆘 Stay indoors completely', '🆘 Seal gaps in doors/windows', '🆘 Call 104 if experiencing symptoms', '🚫 Cancel all outdoor events'];
}

module.exports = router;
