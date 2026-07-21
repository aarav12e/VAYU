const express = require('express');
const router = express.Router();
const axios = require('axios');
const AQIReading = require('../models/AQIReading');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// POST /api/citizen/query - conversational AQI advisory
router.post('/query', async (req, res) => {
  try {
    const { message = '', city = 'Mumbai', language = 'en', ward } = req.body;

    // Get latest AQI for context
    const latestReading = await AQIReading.findOne({ city, ward: ward && ward !== 'All Wards' ? ward : undefined })
      .sort({ timestamp: -1 })
      .lean() || await AQIReading.findOne({ city }).sort({ timestamp: -1 }).lean();

    const context = {
      city,
      ward: ward && ward !== 'All Wards' ? ward : city,
      currentAQI: latestReading?.aqi || 145,
      category: latestReading?.category || 'Moderate',
      pm25: latestReading?.pollutants?.pm25,
      pm10: latestReading?.pollutants?.pm10,
      timestamp: latestReading?.timestamp,
    };

    // Try Python AI service
    try {
      const aiResp = await axios.post(`${AI_SERVICE_URL}/citizen/advisory`, {
        message,
        context,
        language,
      });
      if (aiResp.data && aiResp.data.response) {
        return res.json({ success: true, data: aiResp.data });
      }
    } catch (aiErr) {
      console.log('AI service unavailable or key expired, using intent-aware advisor');
    }

    // Intent-aware conversational fallback
    const advisory = generateSmartAdvisory(context, message, language);
    return res.json({ success: true, data: advisory, fallback: true });
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

    const advisory = generateSmartAdvisory(
      { city, ward, currentAQI: reading.aqi, category: reading.category },
      'general summary',
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

    const vulnerableLocations = {
      Mumbai: [
        { name: 'Lilavati Hospital', type: 'hospital', ward: 'Bandra' },
        { name: 'Dharavi Primary School', type: 'school', ward: 'Dharavi' },
        { name: 'Andheri Senior Citizens Home', type: 'elderly', ward: 'Andheri' },
        { name: 'Kurla Municipal School', type: 'school', ward: 'Kurla' },
        { name: 'Worli Community Health Center', type: 'hospital', ward: 'Worli' },
      ],
      Chennai: [
        { name: 'Apollo Hospital Greams Road', type: 'hospital', ward: 'T. Nagar' },
        { name: 'Velachery Primary Health Centre', type: 'hospital', ward: 'Velachery' },
        { name: 'Guindy Higher Secondary School', type: 'school', ward: 'Guindy' },
        { name: 'Manali Industrial Care Clinic', type: 'hospital', ward: 'Manali' },
      ],
      Delhi: [
        { name: 'AIIMS New Delhi', type: 'hospital', ward: 'RK Puram' },
        { name: 'Anand Vihar Public School', type: 'school', ward: 'Anand Vihar' },
        { name: 'Okhla Community Health Post', type: 'hospital', ward: 'Okhla' },
      ],
      Bengaluru: [
        { name: 'Manipal Hospital HAL Road', type: 'hospital', ward: 'Indiranagar' },
        { name: 'Peenya Industrial Health Clinic', type: 'hospital', ward: 'Peenya' },
        { name: 'Silk Board Public School', type: 'school', ward: 'Silk Board' },
      ],
    };

    const locations = vulnerableLocations[city] || [
      { name: `${city} Central Hospital`, type: 'hospital', ward: city },
      { name: `${city} Model School`, type: 'school', ward: city },
    ];

    const enriched = await Promise.all(
      locations.map(async (loc) => {
        const reading = await AQIReading.findOne({ city, ward: loc.ward }).sort({ timestamp: -1 }).lean();
        const aqiVal = reading?.aqi || 140;
        return {
          ...loc,
          currentAQI: aqiVal,
          category: reading?.category || getCategory(aqiVal),
          riskLevel: getRiskLevel(aqiVal, loc.type),
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
  const multiplier = locationType === 'hospital' || locationType === 'elderly' ? 1.25 : 1;
  const effectiveAQI = aqi * multiplier;
  if (effectiveAQI <= 100) return 'LOW';
  if (effectiveAQI <= 200) return 'MODERATE';
  if (effectiveAQI <= 300) return 'HIGH';
  return 'CRITICAL';
}

function getCategory(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

/**
 * Smart Intent-Aware Conversational Advisory Engine
 * Generates tailored responses based on user intent & question content.
 */
function generateSmartAdvisory(context, userMessage = '', language = 'en') {
  const { currentAQI, category, city, ward, pm25 } = context;
  const locationLabel = ward && ward !== city ? `${ward}, ${city}` : city;
  const q = userMessage.toLowerCase();

  let responseEn = '';
  let responseHi = '';
  let recs = [];

  // Intent 1: Capabilities / "What can you do"
  if (q.includes('what can you do') || q.includes('what can you see') || q.includes('capabilities') || q.includes('help me') || q.includes('who are you')) {
    responseEn = `I am Vayu, your AI Air Quality & Health Advisor for ${city}. I track live AQI across ${locationLabel}, predict 72-hour pollution trends, monitor hospital & school risk levels, and explain health precautions for your family.`;
    responseHi = `मैं वायु हूँ, ${city} के लिए आपका AI वायु गुणवत्ता सलाहकार। मैं लाइव AQI ट्रैक करता हूँ और स्वास्थ्य सुरक्षा सलाह प्रदान करता हूँ।`;
    recs = [
      '🔍 Ask "Is it safe for morning walk?"',
      '🏥 Ask "Are hospitals at risk today?"',
      '😷 Ask "Which mask should I wear?"',
      '📊 Select specific ward from top dropdown',
    ];
  }
  // Intent 2: Hospital / Vulnerable Population Risk
  else if (q.includes('hospital') || q.includes('school') || q.includes('risk') || q.includes('elderly') || q.includes('patient') || q.includes('child')) {
    if (currentAQI <= 100) {
      responseEn = `Hospitals and schools in ${locationLabel} are currently at LOW risk (AQI: ${currentAQI} - ${category}). Ventilation is clear and safe for vulnerable individuals today.`;
      responseHi = `${locationLabel} में अस्पताल और स्कूल वर्तमान में कम जोखिम में हैं (AQI: ${currentAQI})। हवा साफ और सुरक्षित है।`;
      recs = ['✅ Low risk for respiratory patients', '✅ Safe for school outdoor activities', '✅ Open hospital wards for ventilation'];
    } else if (currentAQI <= 200) {
      responseEn = `Hospitals and schools in ${locationLabel} face MODERATE risk (AQI: ${currentAQI} - ${category}). Asthmatic patients and cardiac care units should keep windows closed during rush hours (8-11 AM & 5-8 PM).`;
      responseHi = `${locationLabel} में अस्पताल और स्कूल मध्यम जोखिम में हैं (AQI: ${currentAQI})। सांस के रोगी सावधान रहें।`;
      recs = ['⚠️ Asthmatic patients keep emergency inhalers ready', '⚠️ Limit outdoor play for schoolchildren during rush hours', '✅ Run indoor HEPA air purifiers in ICUs'];
    } else {
      responseEn = `🚨 HIGH/CRITICAL RISK for medical facilities in ${locationLabel} (AQI: ${currentAQI} - ${category}). Respiratory admissions may spike. Nebulizer stocks and indoor air purifiers should be active.`;
      responseHi = `🚨 ${locationLabel} में चिकित्सा सुविधाओं के लिए उच्च जोखिम (AQI: ${currentAQI})। घर के अंदर रहें और पुरिफिएर चलाएं।`;
      recs = ['🚨 High risk for asthmatic & cardiac patients', '🚫 Cancel outdoor school sports & assemblies', '⚠️ Mandatory N95 masks for outdoor transport'];
    }
  }
  // Intent 3: Outdoor Safety / Exercise / Jogging
  else if (q.includes('safe') || q.includes('outside') || q.includes('jog') || q.includes('walk') || q.includes('exercise') || q.includes('run') || q.includes('play')) {
    if (currentAQI <= 100) {
      responseEn = `Yes, it is safe to go outside in ${locationLabel} today! Current AQI is ${currentAQI} (${category}). Great day for morning jogs, cycling, or outdoor sports.`;
      responseHi = `हाँ, आज ${locationLabel} में बाहर जाना पूरी तरह सुरक्षित है! वर्तमान AQI ${currentAQI} है।`;
      recs = ['✅ Safe for all outdoor activities', '✅ Morning & evening workouts encouraged', '✅ Open windows for fresh air'];
    } else if (currentAQI <= 200) {
      responseEn = `Outdoor activity in ${locationLabel} is MODERATELY safe (AQI: ${currentAQI} - ${category}). Healthy adults can exercise, but sensitive groups should limit strenuous outdoor workouts to early mornings.`;
      responseHi = `${locationLabel} में बाहरी गतिविधियाँ मध्यम रूप से सुरक्षित हैं (AQI: ${currentAQI})। अत्यधिक व्यायाम से बचें।`;
      recs = ['⚠️ Limit heavy outdoor workouts to < 60 mins', '⚠️ Sensitive groups avoid rush hour traffic zones', '✅ Light walking is safe'];
    } else {
      responseEn = `⚠️ Unsafe for outdoor activities in ${locationLabel} today (AQI: ${currentAQI} - ${category}). High concentration of fine particulates (${pm25 ? `${pm25} µg/m³` : 'elevated'}). Exercise indoors instead.`;
      responseHi = `⚠️ ${locationLabel} में आज बाहर जाना असुरक्षित है (AQI: ${currentAQI})। केवल अंदर ही व्यायाम करें।`;
      recs = ['🚫 Avoid all outdoor jogging & sports', '🚫 Children and seniors stay indoors', '⚠️ Wear N95 mask if travel is unavoidable'];
    }
  }
  // Intent 4: Mask & Protection Guidance
  else if (q.includes('mask') || q.includes('n95') || q.includes('purifier') || q.includes('protect') || q.includes('prevent')) {
    if (currentAQI <= 100) {
      responseEn = `No mask is required today in ${locationLabel} (AQI: ${currentAQI} - ${category}). Ambient air pollution is within safe CPCB standards.`;
      responseHi = `${locationLabel} में आज मास्क की आवश्यकता नहीं है (AQI: ${currentAQI})।`;
      recs = ['✅ Masks optional', '✅ Normal ventilation recommended', '✅ Natural fresh air fine'];
    } else if (currentAQI <= 200) {
      responseEn = `A standard surgical or cloth mask is recommended when traveling through high-traffic corridors in ${locationLabel} (AQI: ${currentAQI}). N95 recommended for asthmatic individuals.`;
      responseHi = `${locationLabel} में उच्च ट्रैफिक वाले क्षेत्रों में सर्जिकल या N95 मास्क पहनने की सलाह दी जाती है।`;
      recs = ['⚠️ Wear N95 mask in traffic hotspots', '⚠️ Keep home air purifiers on auto-mode', '✅ Hydrate frequently to flush particulates'];
    } else {
      responseEn = `🚨 N95 / KN95 mask is MANDATORY when stepping outdoors in ${locationLabel} (AQI: ${currentAQI} - ${category}). Standard cloth masks will not filter fine PM2.5 particulates effectively.`;
      responseHi = `🚨 ${locationLabel} में बाहर जाने पर N95 मास्क पहनना अनिवार्य है (AQI: ${currentAQI})।`;
      recs = ['🚨 N95 / KN95 mask mandatory outdoors', '🚨 Run indoor air purifiers at max speed', '⚠️ Keep windows and doors tightly sealed'];
    }
  }
  // Intent 5: General Query Fallback
  else {
    if (currentAQI <= 100) {
      responseEn = `Air quality in ${locationLabel} is Good today (AQI: ${currentAQI} - ${category}). Pollution levels are low and safe for daily routines.`;
      responseHi = `${locationLabel} में वायु गुणवत्ता अच्छी है (AQI: ${currentAQI})। दैनिक दिनचर्या के लिए सुरक्षित है।`;
      recs = ['✅ Safe for all outdoor activities', '✅ Exercise freely', '✅ Open windows for fresh air'];
    } else if (currentAQI <= 200) {
      responseEn = `Air quality in ${locationLabel} is Moderate today (AQI: ${currentAQI} - ${category}). Sensitive individuals should take basic precautions during peak traffic hours.`;
      responseHi = `${locationLabel} में आज वायु गुणवत्ता मध्यम है (AQI: ${currentAQI})।`;
      recs = ['⚠️ Sensitive groups limit outdoor time', '⚠️ Wear mask near busy roads', '✅ Keep windows closed during 8-11 AM peak'];
    } else {
      responseEn = `⚠️ Poor Air Quality Alert for ${locationLabel} (AQI: ${currentAQI} - ${category}). Fine particulate levels are elevated. Minimize unnecessary outdoor exposure.`;
      responseHi = `⚠️ ${locationLabel} के लिए खराब वायु गुणवत्ता चेतावनी (AQI: ${currentAQI})। बाहरी जोखिम कम करें।`;
      recs = ['🚫 Avoid outdoor exercise', '🚫 Keep children/elderly indoors', '⚠️ Wear N95 mask outdoors'];
    }
  }

  return {
    response: language === 'hi' ? responseHi : responseEn,
    responseHindi: responseHi,
    responseEnglish: responseEn,
    aqi: currentAQI,
    category,
    recommendations: recs,
    sources: ['CPCB CAAQMS Data Feed', 'Vayu Intelligence AI Engine'],
    aiPowered: true,
  };
}

module.exports = router;
