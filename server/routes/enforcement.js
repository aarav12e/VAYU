const express = require('express');
const router = express.Router();
const {
  getRecommendations,
  getGeojson,
  updateStatus,
  dispatchTeam,
} = require('../controllers/enforcementController');

router.get('/recommendations/:city', getRecommendations);
router.get('/geojson/:city', getGeojson);
router.patch('/:id/status', updateStatus);
router.post('/dispatch', dispatchTeam);

module.exports = router;
