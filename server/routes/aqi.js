const express = require('express');
const router = express.Router();
const AQIReading = require('../models/AQIReading');
const Alert = require('../models/Alert');

// GET /api/aqi/live - latest readings for all cities
router.get('/live', async (req, res) => {
  try {
    const cities = ['Mumbai', 'Delhi', 'Kolkata', 'Bengaluru', 'Chennai', 'Pune'];
    const readings = await Promise.all(
      cities.map((city) =>
        AQIReading.findOne({ city }).sort({ timestamp: -1 }).lean()
      )
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
    const readings = await AQIReading.find({ city })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

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

// GET /api/aqi/history/:city - last 24hr trend
router.get('/history/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const readings = await AQIReading.find({
      city,
      timestamp: { $gte: since },
    })
      .sort({ timestamp: 1 })
      .lean();

    res.json({ success: true, data: readings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/aqi/heatmap/:city - for Mapbox heatmap
router.get('/heatmap/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const readings = await AQIReading.find({ city }).sort({ timestamp: -1 }).limit(100).lean();

    // GeoJSON FeatureCollection for Mapbox
    const geojson = {
      type: 'FeatureCollection',
      features: readings
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
    const avg = aqiValues.length ? Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length) : 0;
    const max = aqiValues.length ? Math.max(...aqiValues) : 0;
    const min = aqiValues.length ? Math.min(...aqiValues) : 0;

    res.json({
      success: true,
      data: {
        current: latest?.aqi,
        category: latest?.category,
        avg24h: avg,
        max24h: max,
        min24h: min,
        totalReadings: aqiValues.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
