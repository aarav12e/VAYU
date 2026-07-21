const AQIReading = require('../models/AQIReading');
const Alert = require('../models/Alert');
const { CITIES, getCategory, getBaseAQI } = require('../config/constants');
const {
  runAllIndiaIngestion,
  createFallbackCityReading,
  generateFallbackWardReadings,
  generateFallbackHistory,
} = require('../services/aqiService');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/aqi/live - Latest reading for every city
const getLiveAQI = asyncHandler(async (req, res) => {
  const latestReadings = await AQIReading.aggregate([
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: '$city',
        city: { $first: '$city' },
        aqi: { $first: '$aqi' },
        category: { $first: '$category' },
        pollutants: { $first: '$pollutants' },
        timestamp: { $first: '$timestamp' },
        station: { $first: '$station' },
      },
    },
  ]);

  const map = {};
  latestReadings.forEach((r) => { map[r.city] = r; });

  const result = CITIES.map((c) => {
    if (map[c.name]) return map[c.name];
    return createFallbackCityReading(c.name);
  });

  res.json({ success: true, count: result.length, data: result });
});

// GET /api/aqi/city/:city - Readings for a specific city's wards
const getCityAQI = asyncHandler(async (req, res) => {
  const { city } = req.params;
  let readings = await AQIReading.find({ city }).sort({ timestamp: -1 }).limit(20).lean();

  if (!readings || readings.length === 0) {
    readings = generateFallbackWardReadings(city);
  }

  res.json({ success: true, city, data: readings });
});

// GET /api/aqi/history/:city - Historical data for trend chart
const getCityHistory = asyncHandler(async (req, res) => {
  const { city } = req.params;
  const hours = parseInt(req.query.hours) || 24;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  let history = await AQIReading.find({ city, timestamp: { $gte: since } })
    .sort({ timestamp: 1 })
    .select('aqi category timestamp pollutants ward')
    .lean();

  if (!history || history.length === 0) {
    history = generateFallbackHistory(city);
  }

  res.json({ success: true, city, data: history });
});

// GET /api/aqi/heatmap/:city - GeoJSON for Mapbox heatmap
const getCityHeatmap = asyncHandler(async (req, res) => {
  const { city } = req.params;
  const readings = await AQIReading.find({ city })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();

  let features = [];
  if (readings && readings.length > 0) {
    features = readings
      .filter((r) => r.location?.coordinates?.length === 2)
      .map((r) => ({
        type: 'Feature',
        geometry: r.location,
        properties: {
          id: r._id,
          aqi: r.aqi,
          category: r.category,
          station: r.station,
          ward: r.ward,
          pm25: r.pollutants?.pm25,
          pm10: r.pollutants?.pm10,
        },
      }));
  }

  if (features.length === 0) {
    const fallbackWards = generateFallbackWardReadings(city);
    features = fallbackWards.map((w) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [72.8777, 19.0760] },
      properties: {
        id: w.ward,
        aqi: w.aqi,
        category: w.category,
        station: w.station,
        ward: w.ward,
        pm25: w.pollutants?.pm25,
        pm10: w.pollutants?.pm10,
      },
    }));
  }

  res.json({
    type: 'FeatureCollection',
    city,
    data: { type: 'FeatureCollection', features },
  });
});

// GET /api/aqi/alerts/:city - Active alerts for city
const getCityAlerts = asyncHandler(async (req, res) => {
  const { city } = req.params;
  const alerts = await Alert.find({ city })
    .sort({ timestamp: -1 })
    .limit(20)
    .lean();

  res.json({ success: true, city, data: alerts });
});

// GET /api/aqi/stats/:city - High-level stats for city hero
const getCityStats = asyncHandler(async (req, res) => {
  const { city } = req.params;
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const readings = await AQIReading.find({ city, timestamp: { $gte: last24h } })
    .select('aqi category timestamp')
    .lean();

  if (!readings || readings.length === 0) {
    const base = getBaseAQI(city);
    return res.json({
      success: true,
      city,
      data: {
        current: base,
        category: getCategory(base),
        min24h: Math.round(base * 0.8),
        max24h: Math.round(base * 1.25),
        avg24h: base,
        readingCount: 24,
      },
    });
  }

  const aqis = readings.map((r) => r.aqi);
  const current = aqis[aqis.length - 1];
  const min24h = Math.min(...aqis);
  const max24h = Math.max(...aqis);
  const avg24h = Math.round(aqis.reduce((a, b) => a + b, 0) / aqis.length);

  res.json({
    success: true,
    city,
    data: {
      current,
      category: getCategory(current),
      min24h,
      max24h,
      avg24h,
      readingCount: readings.length,
    },
  });
});

// POST /api/aqi/ingest - Manual trigger for ingestion
const triggerIngestion = asyncHandler(async (req, res) => {
  runAllIndiaIngestion(req.io);
  res.json({ success: true, message: 'All-India data ingestion triggered' });
});

module.exports = {
  getLiveAQI,
  getCityAQI,
  getCityHistory,
  getCityHeatmap,
  getCityAlerts,
  getCityStats,
  triggerIngestion,
};
