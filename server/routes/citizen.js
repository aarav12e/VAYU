const express = require('express');
const router = express.Router();
const {
  queryAdvisory,
  getWardAdvisory,
  getVulnerableLocations,
} = require('../controllers/citizenController');

router.post('/query', queryAdvisory);
router.get('/ward-advisory/:city/:ward', getWardAdvisory);
router.get('/vulnerable/:city', getVulnerableLocations);

module.exports = router;
