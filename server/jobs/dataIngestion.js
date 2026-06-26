const axios = require('axios');
const AQIReading = require('../models/AQIReading');
const Alert = require('../models/Alert');

// Indian cities with their WAQI station IDs / search terms
const CITIES = [
  { name: 'Mumbai', query: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi', query: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Kolkata', query: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Bengaluru', query: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai', query: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Pune', query: 'Pune', lat: 18.5204, lng: 73.8567 },
];

// Mumbai wards for demo granularity
const MUMBAI_WARDS = [
  { ward: 'Andheri', lat: 19.1136, lng: 72.8697 },
  { ward: 'Bandra', lat: 19.054, lng: 72.8409 },
  { ward: 'Kurla', lat: 19.0726, lng: 72.8843 },
  { ward: 'Dharavi', lat: 19.0374, lng: 72.8545 },
  { ward: 'Worli', lat: 19.0139, lng: 72.8169 },
  { ward: 'Malad', lat: 19.1872, lng: 72.8484 },
  { ward: 'Powai', lat: 19.1197, lng: 72.9058 },
  { ward: 'Thane', lat: 19.2183, lng: 72.9781 },
];

function getCategory(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

// Generate realistic mock data when API key not available
function generateMockAQI(baseAQI, variance = 30) {
  const hour = new Date().getHours();
  // Peak pollution: morning rush (7-10am) and evening rush (5-9pm)
  let timeMultiplier = 1;
  if (hour >= 7 && hour <= 10) timeMultiplier = 1.3;
  else if (hour >= 17 && hour <= 21) timeMultiplier = 1.25;
  else if (hour >= 1 && hour <= 5) timeMultiplier = 0.75;

  const aqi = Math.round(baseAQI * timeMultiplier + (Math.random() - 0.5) * variance);
  return Math.max(10, Math.min(500, aqi));
}

async function fetchWAQIData(city) {
  const apiKey = process.env.WAQI_API_KEY;

  if (!apiKey || apiKey === 'your_waqi_api_key_here') {
    // Return mock data
    const baseAQIs = { Mumbai: 145, Delhi: 210, Kolkata: 168, Bengaluru: 95, Chennai: 112, Pune: 130 };
    const base = baseAQIs[city.name] || 150;
    return {
      aqi: generateMockAQI(base),
      station: `${city.name} Mock Station`,
      pollutants: {
        pm25: generateMockAQI(80, 20),
        pm10: generateMockAQI(120, 30),
        no2: generateMockAQI(45, 15),
        so2: generateMockAQI(20, 10),
        co: generateMockAQI(8, 3),
        o3: generateMockAQI(35, 12),
      },
    };
  }

  try {
    const resp = await axios.get(
      `https://api.waqi.info/feed/${encodeURIComponent(city.query)}/?token=${apiKey}`
    );
    const data = resp.data.data;
    if (!data || data === 'Unknown station') return null;

    return {
      aqi: typeof data.aqi === 'number' ? data.aqi : parseInt(data.aqi),
      station: data.city?.name || city.name,
      pollutants: {
        pm25: data.iaqi?.pm25?.v,
        pm10: data.iaqi?.pm10?.v,
        no2: data.iaqi?.no2?.v,
        so2: data.iaqi?.so2?.v,
        co: data.iaqi?.co?.v,
        o3: data.iaqi?.o3?.v,
      },
    };
  } catch (err) {
    console.error(`WAQI fetch error for ${city.name}:`, err.message);
    return null;
  }
}

async function checkAndCreateAlerts(reading, io) {
  if (reading.aqi >= 300) {
    const alert = await Alert.create({
      city: reading.city,
      ward: reading.ward,
      type: 'SPIKE_DETECTED',
      severity: reading.aqi >= 400 ? 'CRITICAL' : 'HIGH',
      title: `Severe Air Quality Alert — ${reading.ward || reading.city}`,
      message: `AQI has reached ${reading.aqi} (${reading.category}) at ${reading.station}. Immediate intervention required.`,
      messageHindi: `वायु गुणवत्ता चेतावनी: AQI ${reading.aqi} पहुंच गया है। तत्काल कार्रवाई आवश्यक है।`,
      aqi: reading.aqi,
      location: reading.location,
      actionRequired: 'Deploy enforcement teams to identified hotspots. Issue public health advisory.',
    });

    if (io) {
      io.to(`city:${reading.city}`).emit('alert:new', alert);
      io.emit('alert:new', alert);
    }
  }
}

async function runDataIngestion(io) {
  console.log('🌬️ Starting Vayu data ingestion...');

  for (const city of CITIES) {
    const data = await fetchWAQIData(city);
    if (!data) continue;

    const reading = await AQIReading.create({
      city: city.name,
      station: data.station,
      aqi: data.aqi,
      category: getCategory(data.aqi),
      pollutants: data.pollutants,
      location: { type: 'Point', coordinates: [city.lng, city.lat] },
      ward: city.name,
      timestamp: new Date(),
    });

    await checkAndCreateAlerts(reading, io);

    // Emit real-time update
    if (io) {
      io.to(`city:${city.name}`).emit('aqi:update', {
        city: city.name,
        aqi: data.aqi,
        category: getCategory(data.aqi),
        timestamp: new Date(),
      });
      io.emit('aqi:update', {
        city: city.name,
        aqi: data.aqi,
        category: getCategory(data.aqi),
        timestamp: new Date(),
      });
    }

    console.log(`✅ ${city.name}: AQI ${data.aqi} (${getCategory(data.aqi)})`);
  }

  // Mumbai ward-level mock ingestion
  for (const ward of MUMBAI_WARDS) {
    const wardAQI = generateMockAQI(145, 50);
    const wardReading = await AQIReading.create({
      city: 'Mumbai',
      station: `${ward.ward} CAAQMS`,
      aqi: wardAQI,
      category: getCategory(wardAQI),
      pollutants: {
        pm25: generateMockAQI(80, 20),
        pm10: generateMockAQI(120, 30),
        no2: generateMockAQI(45, 15),
        so2: generateMockAQI(20, 10),
      },
      location: { type: 'Point', coordinates: [ward.lng, ward.lat] },
      ward: ward.ward,
      timestamp: new Date(),
    });

    await checkAndCreateAlerts(wardReading, io);
  }

  console.log('✅ Data ingestion complete');
}

module.exports = { runDataIngestion };
