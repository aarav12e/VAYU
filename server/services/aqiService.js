const axios = require('axios');
const AQIReading = require('../models/AQIReading');
const Alert = require('../models/Alert');
const { CITIES, CITY_WARDS, getCategory, getBaseAQI } = require('../config/constants');

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

function owmToIndiaAQI(owmAqi, components) {
  if (components?.pm2_5 && !isNaN(components.pm2_5)) {
    return pm25ToIndiaAQI(components.pm2_5);
  }
  const scale = { 1: 25, 2: 75, 3: 150, 4: 250, 5: 400 };
  return scale[owmAqi] || 150;
}

function generateMockAQI(baseAQI, variance = 30) {
  const hour = new Date().getHours();
  let factor = 1;
  if (hour >= 7 && hour <= 10)  factor = 1.25;
  else if (hour >= 17 && hour <= 21) factor = 1.2;
  else if (hour >= 1 && hour <= 5)   factor = 0.8;
  const aqi = Math.round(baseAQI * factor + (Math.random() - 0.5) * variance);
  return Math.max(10, Math.min(500, aqi));
}

function generateMockData(city) {
  const base = getBaseAQI(city.name);
  return {
    aqi: generateMockAQI(base),
    station: `${city.name} Station`,
    source: 'simulated',
    pollutants: {
      pm25: generateMockAQI(Math.round(base * 0.55), 15),
      pm10: generateMockAQI(Math.round(base * 0.85), 25),
      no2:  generateMockAQI(45, 15),
      so2:  generateMockAQI(20, 10),
      co:   generateMockAQI(8, 3),
      o3:   generateMockAQI(35, 12),
    },
  };
}

async function fetchOpenWeatherData(city) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === 'your_openweather_api_key_here') return null;

  try {
    const resp = await axios.get(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${city.lat}&lon=${city.lng}&appid=${apiKey}`,
      { timeout: 8000 }
    );
    const item = resp.data?.list?.[0];
    if (!item) return null;

    const c = item.components || {};
    const aqi = owmToIndiaAQI(item.main?.aqi, c);
    if (!aqi || isNaN(aqi)) return null;

    return {
      aqi,
      station: `${city.name} OpenWeather Station`,
      source: 'openweathermap',
      pollutants: {
        pm25: isNaN(c.pm2_5) ? undefined : Math.round(c.pm2_5 * 10) / 10,
        pm10: isNaN(c.pm10)  ? undefined : Math.round(c.pm10  * 10) / 10,
        no2:  isNaN(c.no2)   ? undefined : Math.round(c.no2   * 10) / 10,
        so2:  isNaN(c.so2)   ? undefined : Math.round(c.so2   * 10) / 10,
        co:   isNaN(c.co)    ? undefined : Math.round((c.co / 1000) * 100) / 100,
        o3:   isNaN(c.o3)    ? undefined : Math.round(c.o3    * 10) / 10,
      },
    };
  } catch (err) {
    return null;
  }
}

async function fetchAirQualityData(city) {
  let data = await fetchOpenWeatherData(city);
  if (data) return data;
  return generateMockData(city);
}

async function checkAndCreateAlerts(reading, io) {
  if (reading.aqi >= 300) {
    const alert = await Alert.create({
      city: reading.city,
      ward: reading.ward,
      type: 'SPIKE_DETECTED',
      severity: reading.aqi >= 400 ? 'CRITICAL' : 'HIGH',
      title: `Severe Air Quality Alert — ${reading.ward || reading.city}`,
      message: `AQI has reached ${reading.aqi} (${reading.category}) at ${reading.station}.`,
      messageHindi: `वायु गुणवत्ता चेतावनी: AQI ${reading.aqi} पहुंच गया है।`,
      aqi: reading.aqi,
      location: reading.location,
      actionRequired: 'Deploy enforcement teams to identified hotspots.',
    });

    if (io) {
      io.to(`city:${reading.city}`).emit('alert:new', alert);
      io.emit('alert:new', alert);
    }
  }
}

async function runAllIndiaIngestion(io) {
  console.log('🌬️ Executing Vayu All-India Data Ingestion Service...');

  for (const city of CITIES) {
    try {
      const data = await fetchAirQualityData(city);
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

      if (io) {
        const payload = { city: city.name, aqi: data.aqi, category: getCategory(data.aqi), timestamp: new Date() };
        io.to(`city:${city.name}`).emit('aqi:update', payload);
        io.emit('aqi:update', payload);
      }
    } catch (err) {
      console.error(`❌ Ingestion error for ${city.name}:`, err.message);
    }
  }

  for (const city of CITIES) {
    const wards = CITY_WARDS[city.name] || [];
    for (const ward of wards) {
      try {
        const wardAQI = generateMockAQI(ward.base, 40);
        const wardReading = await AQIReading.create({
          city: city.name,
          station: `${ward.ward} CAAQMS`,
          aqi: wardAQI,
          category: getCategory(wardAQI),
          pollutants: {
            pm25: generateMockAQI(Math.round(ward.base * 0.55), 18),
            pm10: generateMockAQI(Math.round(ward.base * 0.85), 25),
          },
          location: { type: 'Point', coordinates: [ward.lng, ward.lat] },
          ward: ward.ward,
          timestamp: new Date(),
        });
        await checkAndCreateAlerts(wardReading, io);
      } catch (err) {
        console.error(`❌ Ward ingestion error for ${ward.ward}:`, err.message);
      }
    }
  }
  console.log('✅ All-India Ingestion Completed');
}

function createFallbackCityReading(city) {
  const base = getBaseAQI(city);
  return {
    city,
    station: `${city} Central CAAQMS`,
    aqi: base,
    category: getCategory(base),
    ward: city,
    pollutants: { pm25: Math.round(base * 0.55), pm10: Math.round(base * 0.85), no2: 40, so2: 18 },
    timestamp: new Date(),
  };
}

function generateFallbackWardReadings(city) {
  const base = getBaseAQI(city);
  const stations = [
    { ward: `${city} Central`, base: base },
    { ward: `${city} North`,   base: Math.round(base * 1.1) },
    { ward: `${city} South`,   base: Math.round(base * 0.9) },
    { ward: `${city} East`,    base: Math.round(base * 1.15) },
    { ward: `${city} West`,    base: Math.round(base * 0.95) },
  ];

  return stations.map((s) => ({
    city,
    ward: s.ward,
    station: `${s.ward} Station`,
    aqi: s.base,
    category: getCategory(s.base),
    pollutants: { pm25: Math.round(s.base * 0.55), pm10: Math.round(s.base * 0.85) },
    timestamp: new Date(),
  }));
}

function generateFallbackHistory(city) {
  const base = getBaseAQI(city);
  const history = [];
  const now = Date.now();
  for (let i = 24; i >= 0; i--) {
    const ts = new Date(now - i * 60 * 60 * 1000);
    const hour = ts.getHours();
    let factor = 1;
    if (hour >= 7 && hour <= 10) factor = 1.2;
    else if (hour >= 17 && hour <= 21) factor = 1.15;
    else if (hour >= 1 && hour <= 5) factor = 0.85;

    const aqi = Math.round(base * factor + (Math.random() - 0.5) * 15);
    history.push({
      city,
      aqi,
      category: getCategory(aqi),
      timestamp: ts,
    });
  }
  return history;
}

module.exports = {
  runAllIndiaIngestion,
  createFallbackCityReading,
  generateFallbackWardReadings,
  generateFallbackHistory,
};
