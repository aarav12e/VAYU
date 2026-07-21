const axios = require('axios');
const AQIReading = require('../models/AQIReading');
const { getBaseAQI, getCategory } = require('../config/constants');
const { asyncHandler } = require('../middleware/errorHandler');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// POST /api/citizen/query - Conversational Advisory
const queryAdvisory = asyncHandler(async (req, res) => {
  const { message = '', city = 'Mumbai', language = 'en', ward } = req.body;

  const latestReading = await AQIReading.findOne({ city, ward: ward && ward !== 'All Wards' ? ward : undefined })
    .sort({ timestamp: -1 })
    .lean() || await AQIReading.findOne({ city }).sort({ timestamp: -1 }).lean();

  const context = {
    city,
    ward: ward && ward !== 'All Wards' ? ward : city,
    currentAQI: latestReading?.aqi || getBaseAQI(city),
    category: latestReading?.category || getCategory(latestReading?.aqi || getBaseAQI(city)),
    pm25: latestReading?.pollutants?.pm25,
    pm10: latestReading?.pollutants?.pm10,
    timestamp: latestReading?.timestamp,
  };

  try {
    const aiResp = await axios.post(`${AI_SERVICE_URL}/citizen/advisory`, {
      message,
      context,
      language,
    });
    if (aiResp.data && aiResp.data.response) {
      return res.json({ success: true, data: aiResp.data });
    }
  } catch {
    // Fallback
  }

  const advisory = generateSimpleAdvisory(context, message, language);
  res.json({ success: true, data: advisory, fallback: true });
});

// GET /api/citizen/ward-advisory/:city/:ward
const getWardAdvisory = asyncHandler(async (req, res) => {
  const { city, ward } = req.params;
  const reading = await AQIReading.findOne({ city, ward }).sort({ timestamp: -1 }).lean();

  if (!reading) {
    return res.status(404).json({ success: false, error: 'No data for this ward' });
  }

  const advisory = generateSimpleAdvisory(
    { city, ward, currentAQI: reading.aqi, category: reading.category },
    'general summary',
    'en'
  );

  res.json({ success: true, data: { ...advisory, reading } });
});

// GET /api/citizen/vulnerable/:city
const getVulnerableLocations = asyncHandler(async (req, res) => {
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
    ],
    Delhi: [
      { name: 'AIIMS New Delhi', type: 'hospital', ward: 'RK Puram' },
      { name: 'Anand Vihar Public School', type: 'school', ward: 'Anand Vihar' },
    ],
    Bengaluru: [
      { name: 'Manipal Hospital HAL Road', type: 'hospital', ward: 'Indiranagar' },
      { name: 'Peenya Industrial Health Clinic', type: 'hospital', ward: 'Peenya' },
    ],
  };

  const locations = vulnerableLocations[city] || [
    { name: `${city} Central Hospital`, type: 'hospital', ward: city },
    { name: `${city} Model School`, type: 'school', ward: city },
  ];

  const enriched = await Promise.all(
    locations.map(async (loc) => {
      const reading = await AQIReading.findOne({ city, ward: loc.ward }).sort({ timestamp: -1 }).lean();
      const aqiVal = reading?.aqi || getBaseAQI(city);
      return {
        ...loc,
        currentAQI: aqiVal,
        category: reading?.category || getCategory(aqiVal),
        riskLevel: getRiskLevel(aqiVal, loc.type),
      };
    })
  );

  res.json({ success: true, data: enriched });
});

function getRiskLevel(aqi, locationType) {
  if (!aqi) return 'LOW';
  const multiplier = locationType === 'hospital' || locationType === 'elderly' ? 1.2 : 1;
  const effectiveAQI = aqi * multiplier;
  if (effectiveAQI <= 100) return 'LOW';
  if (effectiveAQI <= 200) return 'MODERATE';
  if (effectiveAQI <= 300) return 'HIGH';
  return 'CRITICAL';
}

function generateSimpleAdvisory(context, userMessage = '', language = 'en') {
  const { currentAQI, category, city, ward } = context;
  const loc = ward && ward !== city ? `${ward}, ${city}` : city;
  const q = userMessage.toLowerCase();

  let responseEn = '';
  let responseHi = '';
  let recs = [];

  const greetings = ['hi', 'hello', 'hey', 'namaste', 'good morning', 'good evening', 'greetings', 'ssup', 'hola'];
  if (greetings.includes(q.trim()) || q.startsWith('hi ') || q.startsWith('hello ')) {
    responseEn = `Hello! 👋 I'm Vayu, your air quality assistant for ${city}. How can I help you today? Ask me about outdoor safety, school precautions, or mask advisories!`;
    responseHi = `नमस्ते! 👋 मैं वायु हूँ, ${city} के लिए आपका वायु गुणवत्ता सहायक। मैं आपकी क्या मदद कर सकता हूँ?`;
    recs = [
      '🏃 Ask "Is it safe to exercise today?"',
      '🏫 Ask "Should my child go to school?"',
      '😷 Ask "Should I wear a mask?"',
    ];
  } else if (q.includes('school') || q.includes('child') || q.includes('kid') || q.includes('student')) {
    if (currentAQI <= 100) {
      responseEn = `Yes, it is completely safe for children to attend school and play outdoors in ${loc} today (AQI: ${currentAQI} - ${category}). Air quality is clean.`;
      responseHi = `हाँ, आज ${loc} में बच्चों के लिए स्कूल जाना और बाहर खेलना पूरी तरह सुरक्षित है (AQI: ${currentAQI})।`;
      recs = ['✅ Safe for school outdoor sports', '✅ Safe for morning assembly', '✅ Open classroom windows'];
    } else {
      responseEn = `Children can attend school in ${loc} (AQI: ${currentAQI} - ${category}), but strenuous outdoor sports and playtime should be limited during peak rush hours.`;
      responseHi = `${loc} में बच्चे स्कूल जा सकते हैं (AQI: ${currentAQI}), लेकिन पीक ऑवर्स में भारी बाहरी खेल सीमित रखें।`;
      recs = ['⚠️ Limit outdoor school sports during rush hours', '⚠️ Asthmatic children carry emergency inhalers', '✅ Indoor classroom activity safe'];
    }
  } else if (q.includes('hospital') || q.includes('risk') || q.includes('elderly') || q.includes('patient')) {
    if (currentAQI <= 100) {
      responseEn = `Hospitals and medical centers in ${loc} are at LOW risk today (AQI: ${currentAQI} - ${category}). Air quality is clear and safe for patients.`;
      responseHi = `आज ${loc} में अस्पताल सुरक्षित हैं (AQI: ${currentAQI})। हवा साफ है।`;
      recs = ['✅ Safe for respiratory & asthma patients', '✅ Safe for hospital outdoor areas'];
    } else {
      responseEn = `⚠️ Hospitals in ${loc} face MODERATE risk today (AQI: ${currentAQI} - ${category}). Asthmatic patients should keep inhalers ready.`;
      responseHi = `⚠️ ${loc} में अस्पताल मध्यम जोखिम में हैं (AQI: ${currentAQI})।`;
      recs = ['⚠️ Asthmatic patients keep inhalers ready', '✅ Use indoor air purifiers in ICUs'];
    }
  } else if (q.includes('safe') || q.includes('outside') || q.includes('jog') || q.includes('walk') || q.includes('exercise')) {
    if (currentAQI <= 100) {
      responseEn = `Yes! It is completely safe to go outside in ${loc} today. The air quality is ${category} (AQI: ${currentAQI}). Enjoy your walk or workout!`;
      responseHi = `हाँ! आज ${loc} में बाहर जाना पूरी तरह सुरक्षित है (AQI: ${currentAQI})।`;
      recs = ['✅ Safe for all outdoor activities', '✅ Morning & evening workouts encouraged'];
    } else {
      responseEn = `Outdoor activities in ${loc} are MODERATELY safe (AQI: ${currentAQI} - ${category}). Healthy adults can walk, but avoid heavy exertion.`;
      responseHi = `${loc} में बाहर जाना मध्यम रूप से सुरक्षित है (AQI: ${currentAQI})।`;
      recs = ['⚠️ Limit heavy workouts to < 45 mins', '⚠️ Sensitive groups avoid traffic'];
    }
  } else if (q.includes('mask') || q.includes('n95') || q.includes('purifier') || q.includes('protect')) {
    if (currentAQI <= 100) {
      responseEn = `No mask is needed today in ${loc}! The air quality is ${category} (AQI: ${currentAQI}). You can breathe freely.`;
      responseHi = `आज ${loc} में मास्क की आवश्यकता नहीं है (AQI: ${currentAQI})।`;
      recs = ['✅ Masks optional', '✅ Clean natural ventilation'];
    } else {
      responseEn = `A simple mask is recommended near heavy traffic in ${loc} (AQI: ${currentAQI} - ${category}). Asthmatic individuals should wear N95 masks.`;
      responseHi = `${loc} में व्यस्त ट्रैफिक के पास मास्क पहनने की सलाह दी जाती है (AQI: ${currentAQI})।`;
      recs = ['⚠️ Wear N95 mask near traffic', '⚠️ Run indoor air purifiers'];
    }
  } else {
    if (currentAQI <= 100) {
      responseEn = `Air quality in ${loc} is ${category} today (AQI: ${currentAQI}). Pollution levels are low and safe for all daily activities!`;
      responseHi = `${loc} में आज वायु गुणवत्ता अच्छी है (AQI: ${currentAQI})।`;
      recs = ['✅ Safe for outdoor routines', '✅ Exercise freely'];
    } else {
      responseEn = `Air quality in ${loc} is ${category} today (AQI: ${currentAQI}). Take basic precautions if you are sensitive to dust.`;
      responseHi = `${loc} में आज वायु गुणवत्ता मध्यम है (AQI: ${currentAQI})।`;
      recs = ['⚠️ Sensitive groups limit outdoor time', '⚠️ Wear mask near busy roads'];
    }
  }

  return {
    response: language === 'hi' ? responseHi : responseEn,
    responseHindi: responseHi,
    responseEnglish: responseEn,
    aqi: currentAQI,
    category,
    recommendations: recs,
    sources: ['CPCB Data Feed', 'Vayu Intelligence AI'],
    aiPowered: true,
  };
}

module.exports = {
  queryAdvisory,
  getWardAdvisory,
  getVulnerableLocations,
};
