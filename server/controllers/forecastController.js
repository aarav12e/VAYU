const axios = require('axios');
const AQIReading = require('../models/AQIReading');
const { getBaseAQI, getCategory } = require('../config/constants');
const { asyncHandler } = require('../middleware/errorHandler');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// GET /api/forecast/:city - 72-hour forecast
const getForecast = asyncHandler(async (req, res) => {
  const { city } = req.params;
  const hours = parseInt(req.query.hours) || 72;

  const history = await AQIReading.find({ city })
    .sort({ timestamp: -1 })
    .limit(48)
    .lean();

  let forecasts;
  try {
    const aiResp = await axios.post(`${AI_SERVICE_URL}/forecast/predict`, {
      city,
      history: history.reverse(),
      hours,
    });
    forecasts = aiResp.data.forecasts;
  } catch {
    forecasts = generateStatisticalForecast(city, hours);
  }

  if (!forecasts || forecasts.length === 0) {
    forecasts = generateStatisticalForecast(city, hours);
  }

  res.json({ success: true, data: forecasts, city });
});

// GET /api/forecast/attribution/:city - source attribution
const getAttribution = asyncHandler(async (req, res) => {
  const { city } = req.params;

  try {
    const aiResp = await axios.get(`${AI_SERVICE_URL}/attribution/${city}`);
    if (aiResp.data && Array.isArray(aiResp.data.data)) {
      return res.json({ success: true, data: aiResp.data.data });
    }
  } catch {
    // Fallback
  }

  const attributionData = {
    Mumbai: [
      { source: 'Vehicles & Traffic', contribution: 38, color: '#FF6B6B', trend: 'stable' },
      { source: 'Construction Dust', contribution: 28, color: '#FFA07A', trend: 'increasing' },
      { source: 'Industrial Emissions', contribution: 18, color: '#FFD700', trend: 'stable' },
      { source: 'Waste Burning', contribution: 10, color: '#90EE90', trend: 'decreasing' },
      { source: 'Other Sources', contribution: 6, color: '#87CEEB', trend: 'stable' },
    ],
    Delhi: [
      { source: 'Vehicles & Traffic', contribution: 30, color: '#FF6B6B', trend: 'stable' },
      { source: 'Biomass Burning', contribution: 25, color: '#FFA07A', trend: 'seasonal' },
      { source: 'Industrial Emissions', contribution: 22, color: '#FFD700', trend: 'increasing' },
      { source: 'Construction Dust', contribution: 15, color: '#90EE90', trend: 'increasing' },
      { source: 'Other Sources', contribution: 8, color: '#87CEEB', trend: 'stable' },
    ],
    Bengaluru: [
      { source: 'Vehicles & Traffic', contribution: 45, color: '#FF6B6B', trend: 'increasing' },
      { source: 'Construction Dust', contribution: 30, color: '#FFA07A', trend: 'increasing' },
      { source: 'Industrial Emissions', contribution: 15, color: '#FFD700', trend: 'stable' },
      { source: 'Other Sources', contribution: 10, color: '#87CEEB', trend: 'stable' },
    ],
    Chennai: [
      { source: 'Vehicles & Traffic', contribution: 40, color: '#FF6B6B', trend: 'increasing' },
      { source: 'Industrial (Manali/Guindy)', contribution: 32, color: '#FFD700', trend: 'stable' },
      { source: 'Construction Dust', contribution: 18, color: '#FFA07A', trend: 'increasing' },
      { source: 'Sea Salt & Other', contribution: 10, color: '#87CEEB', trend: 'stable' },
    ],
  };

  const data = attributionData[city] || [
    { source: 'Vehicles & Traffic', contribution: 42, color: '#FF6B6B', trend: 'increasing' },
    { source: `${city} Industrial Units`, contribution: 28, color: '#FFD700', trend: 'stable' },
    { source: 'Construction Dust', contribution: 18, color: '#FFA07A', trend: 'increasing' },
    { source: 'Other Urban Sources', contribution: 12, color: '#87CEEB', trend: 'stable' },
  ];

  res.json({ success: true, data });
});

function generateStatisticalForecast(city, hours) {
  const baseAQI = getBaseAQI(city);
  const forecasts = [];
  const now = new Date();

  for (let h = 1; h <= hours; h++) {
    const forecastTime = new Date(now.getTime() + h * 60 * 60 * 1000);
    const hour = forecastTime.getHours();

    let factor = 1;
    if (hour >= 7 && hour <= 10) factor = 1.25;
    else if (hour >= 17 && hour <= 21) factor = 1.2;
    else if (hour >= 1 && hour <= 5) factor = 0.8;

    const noise = (Math.random() - 0.5) * 20;
    const predictedAQI = Math.round(Math.max(10, Math.min(500, baseAQI * factor + noise)));

    forecasts.push({
      ward: city,
      city,
      forecastTime: forecastTime.toISOString(),
      predictedAQI,
      category: getCategory(predictedAQI),
      confidence: Math.round((0.95 - (h / hours) * 0.25) * 100) / 100,
    });
  }

  return forecasts;
}

module.exports = {
  getForecast,
  getAttribution,
};
