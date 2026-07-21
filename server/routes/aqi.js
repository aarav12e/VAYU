const express = require('express');
const router = express.Router();
const {
  getLiveAQI,
  getCityAQI,
  getCityHistory,
  getCityHeatmap,
  getCityAlerts,
  getCityStats,
  triggerIngestion,
} = require('../controllers/aqiController');

router.get('/live', getLiveAQI);
router.get('/city/:city', getCityAQI);
router.get('/history/:city', getCityHistory);
router.get('/heatmap/:city', getCityHeatmap);
router.get('/alerts/:city', getCityAlerts);
router.get('/stats/:city', getCityStats);
router.post('/ingest', triggerIngestion);

module.exports = router;
