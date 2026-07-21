const express = require('express');
const router = express.Router();
const AQIReading = require('../models/AQIReading');
const Alert = require('../models/Alert');
const { runDataIngestion } = require('../jobs/dataIngestion');

const ALL_INDIA_CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad',
  'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Patna', 'Bhubaneswar',
  'Thiruvananthapuram', 'Bhopal', 'Visakhapatnam', 'Guwahati', 'Ranchi',
  'Raipur', 'Dehradun', 'Shimla', 'Srinagar', 'Panaji', 'Leh', 'Puducherry',
  'Agartala', 'Shillong', 'Imphal', 'Kohima', 'Aizawl', 'Itanagar', 'Gangtok'
];

// GET /api/aqi/live - latest readings for all cities across India
router.get('/live', async (req, res) => {
  try {
    const readings = await Promise.all(
      ALL_INDIA_CITIES.map(async (city) => {
        let reading = await AQIReading.findOne({ city }).sort({ timestamp: -1 }).lean();
        if (!reading) {
          // Dynamic fallback reading if not yet ingested
          reading = createFallbackCityReading(city);
        }
        return reading;
      })
    );
    res.json({ success: true, data: readings.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/aqi/city/:city - latest readings with ward breakdown
router.get('/city/:city', async (req, res) => {
  try {
    const { city } = req.params;
    let readings = await AQIReading.find({ city })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    if (!readings || readings.length === 0) {
      // Dynamic fallback for any uningested city
      readings = generateFallbackWardReadings(city);
    }

    // Get unique latest per ward
    const wardMap = {};
    readings.forEach((r) => {
      const key = r.ward || r.station;
      if (!wardMap[key]) wardMap[key] = r;
    });

    res.json({ success: true, data: Object.values(wardMap) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/aqi/history/:city - 24/48h history
router.get('/history/:city', async (req, res) => {
  try {
    const { city } = req.params;
    let history = await AQIReading.find({ city })
      .sort({ timestamp: 1 })
      .limit(48)
      .lean();

    if (!history || history.length === 0) {
      history = generateFallbackHistory(city);
    }

    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/aqi/heatmap/:city - for Mapbox & Ward overview heatmap
router.get('/heatmap/:city', async (req, res) => {
  try {
    const { city } = req.params;
    let readings = await AQIReading.find({ city }).sort({ timestamp: -1 }).limit(100).lean();

    if (!readings || readings.length === 0) {
      readings = generateFallbackWardReadings(city);
    }

    const latestByWard = {};
    readings.forEach((r) => {
      const key = r.ward || r.station;
      if (!latestByWard[key]) {
        latestByWard[key] = r;
      }
    });

    const uniqueReadings = Object.values(latestByWard);

    const geojson = {
      type: 'FeatureCollection',
      features: uniqueReadings
        .filter((r) => r.location?.coordinates?.length === 2)
        .map((r) => ({
          type: 'Feature',
          geometry: r.location,
          properties: {
            aqi: r.aqi,
            category: r.category,
            ward: r.ward,
            station: r.station,
            pm25: r.pollutants?.pm25,
            timestamp: r.timestamp,
          },
        })),
    };

    res.json({ success: true, data: geojson });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/aqi/alerts/:city
router.get('/alerts/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const alerts = await Alert.find({ city, isActive: true })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();
    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/aqi/stats/:city - summary stats
router.get('/stats/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const latest = await AQIReading.findOne({ city }).sort({ timestamp: -1 }).lean();
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const readings24h = await AQIReading.find({ city, timestamp: { $gte: since24h } }).lean();
    const aqiValues = readings24h.map((r) => r.aqi);
    const current = latest?.aqi || getBaseAQI(city);
    const avg = aqiValues.length ? Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length) : Math.round(current * 0.95);
    const max = aqiValues.length ? Math.max(...aqiValues) : Math.round(current * 1.25);
    const min = aqiValues.length ? Math.min(...aqiValues) : Math.round(current * 0.75);

    res.json({
      success: true,
      data: {
        city,
        current,
        category: getCategory(current),
        avg24h: avg,
        max24h: max,
        min24h: min,
        latestReading: latest || createFallbackCityReading(city),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/aqi/ingest - Trigger manual ingestion
router.post('/ingest', async (req, res) => {
  try {
    await runDataIngestion(req.app.get('io'));
    res.json({ success: true, message: 'All-India ingestion complete' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Helpers & Fallbacks ───────────────────────────────────────────────────

function getBaseAQI(city) {
  const baseAQIs = {
    Mumbai: 145, Delhi: 240, Bengaluru: 95, Chennai: 112, Kolkata: 168, Pune: 130,
    Hyderabad: 115, Ahmedabad: 155, Jaipur: 160, Lucknow: 195, Chandigarh: 120,
    Patna: 220, Bhubaneswar: 125, Thiruvananthapuram: 65, Bhopal: 135, Visakhapatnam: 110,
    Guwahati: 140, Ranchi: 130, Raipur: 150, Dehradun: 105, Shimla: 45, Srinagar: 85,
    Panaji: 55, Leh: 35, Puducherry: 75, Agartala: 110, Shillong: 40, Imphal: 60,
    Kohima: 50, Aizawl: 30, Itanagar: 45, Gangtok: 35
  };
  return baseAQIs[city] || 125;
}

function getCategory(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
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

module.exports = router;
