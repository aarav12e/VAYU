const axios = require('axios');
const AQIReading = require('../models/AQIReading');
const Alert = require('../models/Alert');

// Indian cities with coordinates
const CITIES = [
  { name: 'Mumbai',    query: 'Mumbai',    lat: 19.076,  lng: 72.8777 },
  { name: 'Delhi',     query: 'Delhi',     lat: 28.6139, lng: 77.209  },
  { name: 'Kolkata',   query: 'Kolkata',   lat: 22.5726, lng: 88.3639 },
  { name: 'Bengaluru', query: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai',   query: 'Chennai',   lat: 13.0827, lng: 80.2707 },
  { name: 'Pune',      query: 'Pune',      lat: 18.5204, lng: 73.8567 },
];

// Mumbai wards for demo granularity
const MUMBAI_WARDS = [
  { ward: 'Andheri', lat: 19.1136, lng: 72.8697 },
  { ward: 'Bandra',  lat: 19.054,  lng: 72.8409 },
  { ward: 'Kurla',   lat: 19.0726, lng: 72.8843 },
  { ward: 'Dharavi', lat: 19.0374, lng: 72.8545 },
  { ward: 'Worli',   lat: 19.0139, lng: 72.8169 },
  { ward: 'Malad',   lat: 19.1872, lng: 72.8484 },
  { ward: 'Powai',   lat: 19.1197, lng: 72.9058 },
  { ward: 'Thane',   lat: 19.2183, lng: 72.9781 },
];

// ─── AQI Helpers ────────────────────────────────────────────────────────────

function getCategory(aqi) {
  if (aqi <= 50)  return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

/**
 * Convert PM2.5 concentration (µg/m³) to India CPCB AQI (0–500).
 * Breakpoints from CPCB National AQI standards.
 */
function pm25ToIndiaAQI(pm25) {
  if (pm25 < 0 || isNaN(pm25)) return null;
  const breakpoints = [
    { cLow: 0,   cHigh: 30,  iLow: 0,   iHigh: 50  },
    { cLow: 30,  cHigh: 60,  iLow: 51,  iHigh: 100 },
    { cLow: 60,  cHigh: 90,  iLow: 101, iHigh: 200 },
    { cLow: 90,  cHigh: 120, iLow: 201, iHigh: 300 },
    { cLow: 120, cHigh: 250, iLow: 301, iHigh: 400 },
    { cLow: 250, cHigh: 380, iLow: 401, iHigh: 500 },
  ];
  const bp = breakpoints.find(b => pm25 <= b.cHigh) || breakpoints[breakpoints.length - 1];
  const aqi = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow;
  return Math.min(500, Math.max(0, Math.round(aqi)));
}

/**
 * Convert OpenWeatherMap 1–5 AQI to India CPCB scale.
 * Uses PM2.5 component for accuracy when available.
 */
function owmToIndiaAQI(owmAqi, components) {
  if (components?.pm2_5 && !isNaN(components.pm2_5)) {
    return pm25ToIndiaAQI(components.pm2_5);
  }
  const scale = { 1: 25, 2: 75, 3: 150, 4: 250, 5: 400 };
  return scale[owmAqi] || 150;
}

// Mock data generator for when no APIs are available
function generateMockAQI(baseAQI, variance = 30) {
  const hour = new Date().getHours();
  let factor = 1;
  if (hour >= 7 && hour <= 10)  factor = 1.3;
  else if (hour >= 17 && hour <= 21) factor = 1.25;
  else if (hour >= 1 && hour <= 5)   factor = 0.75;
  const aqi = Math.round(baseAQI * factor + (Math.random() - 0.5) * variance);
  return Math.max(10, Math.min(500, aqi));
}

function generateMockData(city) {
  const baseAQIs = { Mumbai: 145, Delhi: 210, Kolkata: 168, Bengaluru: 95, Chennai: 112, Pune: 130 };
  const base = baseAQIs[city.name] || 150;
  return {
    aqi:     generateMockAQI(base),
    station: `${city.name} Simulated Station`,
    source:  'mock',
    pollutants: {
      pm25: generateMockAQI(80, 20),
      pm10: generateMockAQI(120, 30),
      no2:  generateMockAQI(45, 15),
      so2:  generateMockAQI(20, 10),
      co:   generateMockAQI(8, 3),
      o3:   generateMockAQI(35, 12),
    },
  };
}

// ─── API Fetchers ────────────────────────────────────────────────────────────

/**
 * PRIMARY: OpenWeatherMap Air Pollution API
 * Free — 1M calls/month. Requires OPENWEATHER_API_KEY.
 * https://openweathermap.org/api/air-pollution
 */
async function fetchOpenWeatherData(city) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === 'your_openweather_api_key_here') return null;

  try {
    const resp = await axios.get(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${city.lat}&lon=${city.lng}&appid=${apiKey}`,
      { timeout: 10000 }
    );

    const item = resp.data?.list?.[0];
    if (!item) return null;

    const c   = item.components || {};
    const aqi = owmToIndiaAQI(item.main?.aqi, c);
    if (!aqi || isNaN(aqi)) return null;

    return {
      aqi,
      station: `${city.name} (OpenWeatherMap)`,
      source:  'openweathermap',
      pollutants: {
        pm25: isNaN(c.pm2_5) ? undefined : Math.round(c.pm2_5 * 10) / 10,
        pm10: isNaN(c.pm10)  ? undefined : Math.round(c.pm10  * 10) / 10,
        no2:  isNaN(c.no2)   ? undefined : Math.round(c.no2   * 10) / 10,
        so2:  isNaN(c.so2)   ? undefined : Math.round(c.so2   * 10) / 10,
        co:   isNaN(c.co)    ? undefined : Math.round((c.co / 1000) * 100) / 100, // µg/m³ → mg/m³
        o3:   isNaN(c.o3)    ? undefined : Math.round(c.o3    * 10) / 10,
      },
    };
  } catch (err) {
    console.error(`⚠️  OpenWeatherMap error for ${city.name}: ${err.message}`);
    return null;
  }
}

/**
 * FALLBACK: OpenAQ API v2
 * Completely free — no API key required.
 * https://docs.openaq.org
 */
async function fetchOpenAQData(city) {
  try {
    const resp = await axios.get(
      `https://api.openaq.org/v2/latest?city=${encodeURIComponent(city.query)}&country=IN&limit=20`,
      {
        headers: { Accept: 'application/json' },
        timeout: 12000,
      }
    );

    const results = resp.data?.results;
    if (!results || results.length === 0) return null;

    // Aggregate measurements across all stations in the city
    const buckets = {};
    for (const location of results) {
      for (const m of location.measurements || []) {
        const val = Number(m.value);
        if (isNaN(val) || val < 0) continue;
        if (!buckets[m.parameter]) buckets[m.parameter] = [];
        buckets[m.parameter].push(val);
      }
    }

    const avg = (arr) =>
      arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined;

    const pm25Avg = avg(buckets['pm25']);
    if (pm25Avg === undefined) return null; // Need PM2.5 for AQI conversion

    const aqi = pm25ToIndiaAQI(pm25Avg);
    if (!aqi) return null;

    const round1 = (v) => (v !== undefined ? Math.round(v * 10) / 10 : undefined);

    return {
      aqi,
      station: `${city.name} (OpenAQ)`,
      source:  'openaq',
      pollutants: {
        pm25: round1(pm25Avg),
        pm10: round1(avg(buckets['pm10'])),
        no2:  round1(avg(buckets['no2'])),
        so2:  round1(avg(buckets['so2'])),
        co:   round1(avg(buckets['co'])),
        o3:   round1(avg(buckets['o3'])),
      },
    };
  } catch (err) {
    console.error(`⚠️  OpenAQ error for ${city.name}: ${err.message}`);
    return null;
  }
}

/**
 * Main fetcher — tries OpenWeatherMap → OpenAQ → Mock in order.
 */
async function fetchAirQualityData(city) {
  let data = await fetchOpenWeatherData(city);
  if (data) { console.log(`📡 ${city.name}: OpenWeatherMap ✅`); return data; }

  data = await fetchOpenAQData(city);
  if (data) { console.log(`📡 ${city.name}: OpenAQ ✅`); return data; }

  console.log(`📡 ${city.name}: using simulated data`);
  return generateMockData(city);
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

async function checkAndCreateAlerts(reading, io) {
  if (reading.aqi >= 300) {
    const alert = await Alert.create({
      city:          reading.city,
      ward:          reading.ward,
      type:          'SPIKE_DETECTED',
      severity:      reading.aqi >= 400 ? 'CRITICAL' : 'HIGH',
      title:         `Severe Air Quality Alert — ${reading.ward || reading.city}`,
      message:       `AQI has reached ${reading.aqi} (${reading.category}) at ${reading.station}. Immediate intervention required.`,
      messageHindi:  `वायु गुणवत्ता चेतावनी: AQI ${reading.aqi} पहुंच गया है। तत्काल कार्रवाई आवश्यक है।`,
      aqi:           reading.aqi,
      location:      reading.location,
      actionRequired:'Deploy enforcement teams to identified hotspots. Issue public health advisory.',
    });

    if (io) {
      io.to(`city:${reading.city}`).emit('alert:new', alert);
      io.emit('alert:new', alert);
    }
  }
}

// ─── Main Ingestion ───────────────────────────────────────────────────────────

async function runDataIngestion(io) {
  console.log('🌬️ Starting Vayu data ingestion...');

  // City-level ingestion
  for (const city of CITIES) {
    try {
      const data = await fetchAirQualityData(city);
      if (!data) continue;

      const reading = await AQIReading.create({
        city:      city.name,
        station:   data.station,
        aqi:       data.aqi,
        category:  getCategory(data.aqi),
        pollutants:data.pollutants,
        location:  { type: 'Point', coordinates: [city.lng, city.lat] },
        ward:      city.name,
        timestamp: new Date(),
      });

      await checkAndCreateAlerts(reading, io);

      if (io) {
        const payload = { city: city.name, aqi: data.aqi, category: getCategory(data.aqi), timestamp: new Date() };
        io.to(`city:${city.name}`).emit('aqi:update', payload);
        io.emit('aqi:update', payload);
      }

      console.log(`✅ ${city.name}: AQI ${data.aqi} (${getCategory(data.aqi)}) [${data.source}]`);
    } catch (err) {
      console.error(`❌ ${city.name} ingestion error:`, err.message);
    }
  }

  // Mumbai ward-level mock ingestion (granular demo data)
  for (const ward of MUMBAI_WARDS) {
    try {
      const wardAQI = generateMockAQI(145, 50);
      const wardReading = await AQIReading.create({
        city:      'Mumbai',
        station:   `${ward.ward} CAAQMS`,
        aqi:       wardAQI,
        category:  getCategory(wardAQI),
        pollutants: {
          pm25: generateMockAQI(80, 20),
          pm10: generateMockAQI(120, 30),
          no2:  generateMockAQI(45, 15),
          so2:  generateMockAQI(20, 10),
        },
        location:  { type: 'Point', coordinates: [ward.lng, ward.lat] },
        ward:      ward.ward,
        timestamp: new Date(),
      });
      await checkAndCreateAlerts(wardReading, io);
    } catch (err) {
      console.error(`❌ ${ward.ward} ward ingestion error:`, err.message);
    }
  }

  console.log('✅ Data ingestion complete');
}

module.exports = { runDataIngestion };
