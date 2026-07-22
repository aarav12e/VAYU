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

  const langResponses = {
    hi: {
      safe: `आज ${loc} में बाहर जाना सुरक्षित है (AQI: ${currentAQI} - ${category})।`,
      unhealthy: `⚠️ ${loc} में आज वायु गुणवत्ता खराब है (AQI: ${currentAQI} - ${category})। मास्क का उपयोग करें।`,
      schoolSafe: `हाँ, ${loc} में बच्चों के लिए स्कूल जाना सुरक्षित है (AQI: ${currentAQI})।`,
      schoolUnhealthy: `${loc} में बच्चे स्कूल जा सकते हैं (AQI: ${currentAQI}), लेकिन बाहरी खेलकूद सीमित रखें।`,
      mask: `${loc} में व्यस्त सड़कों के पास N95 मास्क पहनने की सलाह दी जाती है (AQI: ${currentAQI})।`,
    },
    kn: {
      safe: `ಇಂದು ${loc} ನಲ್ಲಿ ಹೊರಾಂಗಣಕ್ಕೆ ಹೋಗುವುದು ಸುರಕ್ಷಿತವಾಗಿದೆ (AQI: ${currentAQI} - ${category}).`,
      unhealthy: `⚠️ ${loc} ನಲ್ಲಿ ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಕಳಪೆಯಾಗಿದೆ (AQI: ${currentAQI} - ${category}). ಮಾಸ್ಕ್ ಧರಿಸಿ.`,
      schoolSafe: `ಹೌದು, ${loc} ನಲ್ಲಿ ಮಕ್ಕಳು ಶಾಲೆಗೆ ಹೋಗುವುದು ಸುರಕ್ಷಿತವಾಗಿದೆ (AQI: ${currentAQI}).`,
      schoolUnhealthy: `${loc} ನಲ್ಲಿ ಮಕ್ಕಳು ಶಾಲೆಗೆ ಹೋಗಬಹುದು (AQI: ${currentAQI}), ಆದರೆ ಹೊರಾಂಗಣ ಆಟಗಳನ್ನು ಮಿತಿಗೊಳಿಸಿ.`,
      mask: `${loc} ನಲ್ಲಿ ಸಂಚಾರ ಹೆಚ್ಚಿರುವ ಸ್ಥಳಗಳಲ್ಲಿ N95 ಮಾಸ್ಕ್ ಧರಿಸಲು ಸಲಹೆ ನೀಡಲಾಗುತ್ತದೆ (AQI: ${currentAQI}).`,
    },
    ta: {
      safe: `இன்று ${loc} இல் வெளியே செல்வது பாதுகாப்பானது (AQI: ${currentAQI} - ${category}).`,
      unhealthy: `⚠️ ${loc} இல் காற்றின் தரம் மோசமாக உள்ளது (AQI: ${currentAQI} - ${category}). முகக்கவசம் அணியவும்.`,
      schoolSafe: `ஆம், ${loc} இல் குழந்தைகள் பள்ளிக்குச் செல்வது பாதுகாப்பானது (AQI: ${currentAQI}).`,
      schoolUnhealthy: `${loc} இல் குழந்தைகள் பள்ளிக்குச் செல்லலாம் (AQI: ${currentAQI}), ஆனால் வெளிப்புற விளையாட்டுகளைக் குறைக்கவும்.`,
      mask: `${loc} இல் அதிக போக்குவரத்து உள்ள பகுதிகளில் N95 முகக்கவசம் அணிய பரிந்துரைக்கப்படுகிறது (AQI: ${currentAQI}).`,
    },
    te: {
      safe: `ఈ రోజు ${loc} లో బయటకు వెళ్లడం సురక్షితం (AQI: ${currentAQI} - ${category}).`,
      unhealthy: `⚠️ ${loc} లో గాలి నాణ్యత తక్కువగా ఉంది (AQI: ${currentAQI} - ${category}). మాస్క్ ధరించండి.`,
      schoolSafe: `అవును, ${loc} లో పిల్లలు పాఠశాలకు వెళ్లడం సురక్షితం (AQI: ${currentAQI}).`,
      schoolUnhealthy: `${loc} లో పిల్లలు పాఠశాలకు వెళ్ళవచ్చు (AQI: ${currentAQI}), కానీ మైదానంలో ఆడే సమయం తగ్గించండి.`,
      mask: `${loc} లో రద్దీగా ఉండే ప్రాంతాల్లో N95 మాస్క్ వాడండి (AQI: ${currentAQI}).`,
    },
    mr: {
      safe: `आज ${loc} मध्ये बाहेर जाणे सुरक्षित आहे (AQI: ${currentAQI} - ${category}).`,
      unhealthy: `⚠️ ${loc} मध्ये हवेची गुणवत्ता खराब आहे (AQI: ${currentAQI} - ${category}). मास्क वापरा.`,
      schoolSafe: `होय, ${loc} मध्ये मुलांसाठी शाळेत जाणे सुरक्षित आहे (AQI: ${currentAQI}).`,
      schoolUnhealthy: `${loc} मध्ये मुले शाळेत जाऊ शकतात (AQI: ${currentAQI}), पण मैदानी खेळ कमी करा.`,
      mask: `${loc} मध्ये जास्त रहदारी असलेल्या ठिकाणी N95 मास्क वापरण्याचा सल्ला दिला जातो (AQI: ${currentAQI}).`,
    },
    bn: {
      safe: `আজ ${loc}-এ বাইরে যাওয়া নিরাপদ (AQI: ${currentAQI} - ${category})।`,
      unhealthy: `⚠️ ${loc}-এ বাতাসের গুণমান খারাপ (AQI: ${currentAQI} - ${category})। মাস্ক ব্যবহার করুন।`,
      schoolSafe: `হ্যাঁ, ${loc}-এ শিশুদের স্কুলে যাওয়া সম্পূর্ণ নিরাপদ (AQI: ${currentAQI})।`,
      schoolUnhealthy: `${loc}-এ শিশুরা স্কুলে যেতে পারে (AQI: ${currentAQI}), তবে বাইরের খেলাধুলা সীমিত রাখুন।`,
      mask: `${loc}-এ ব্যস্ত রাস্তায় N95 মাস্ক পরার পরামর্শ দেওয়া হচ্ছে (AQI: ${currentAQI})।`,
    },
    gu: {
      safe: `આજે ${loc} માં બહાર જવું સુરક્ષિત છે (AQI: ${currentAQI} - ${category}).`,
      unhealthy: `⚠️ ${loc} માં હવાની ગુણવત્તા ખરાબ છે (AQI: ${currentAQI} - ${category}). માસ્ક પહેરો.`,
      schoolSafe: `હા, ${loc} માં બાળકો માટે શાળાએ જવું સુરક્ષિત છે (AQI: ${currentAQI}).`,
      schoolUnhealthy: `${loc} માં બાળકો શાળાએ જઈ શકે છે (AQI: ${currentAQI}), પરંતુ રમતગમત મર્યાદિત રાખો.`,
      mask: `${loc} માં ટ્રાફિક વાળા વિસ્તારમાં N95 માસ્ક પહેરવાની સલાહ આપવામાં આવે છે (AQI: ${currentAQI}).`,
    },
    en: {
      safe: `It is completely safe to go outside in ${loc} today. Air quality is ${category} (AQI: ${currentAQI}).`,
      unhealthy: `⚠️ Air quality in ${loc} is ${category} today (AQI: ${currentAQI}). Limit heavy exertion outside.`,
      schoolSafe: `Yes, it is completely safe for children to attend school in ${loc} today (AQI: ${currentAQI} - ${category}).`,
      schoolUnhealthy: `Children can attend school in ${loc} (AQI: ${currentAQI}), but limit strenuous outdoor activities during rush hours.`,
      mask: `An N95 mask is recommended near heavy traffic in ${loc} (AQI: ${currentAQI} - ${category}).`,
    }
  };

  const dict = langResponses[language] || langResponses.en;
  let text = '';
  let recs = [];

  if (q.includes('school') || q.includes('child') || q.includes('kid') || q.includes('student')) {
    text = currentAQI <= 100 ? dict.schoolSafe : dict.schoolUnhealthy;
    recs = ['🏫 School precaution advice', '😷 Carry inhaler if asthmatic', '🪟 Ventilate indoor classrooms'];
  } else if (q.includes('mask') || q.includes('n95') || q.includes('protect')) {
    text = dict.mask;
    recs = ['😷 Wear N95 mask outdoors', '💨 Run indoor air purifiers', '🚗 Avoid heavy traffic zones'];
  } else {
    text = currentAQI <= 100 ? dict.safe : dict.unhealthy;
    recs = currentAQI <= 100 ? ['🏃 Safe for outdoor exercise', '🌱 Enjoy clear air'] : ['⚠️ Limit outdoor duration', '😷 Wear mask near main roads'];
  }

  return {
    response: text,
    responseHindi: langResponses.hi.safe,
    responseEnglish: langResponses.en.safe,
    aqi: currentAQI,
    category,
    recommendations: recs,
    sources: ['CPCB Data Feed', 'Vayu Multilingual AI Agent'],
    aiPowered: true,
  };
}

module.exports = {
  queryAdvisory,
  getWardAdvisory,
  getVulnerableLocations,
};
