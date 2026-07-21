const express = require('express');
const router = express.Router();
const { getForecast, getAttribution } = require('../controllers/forecastController');

router.get('/attribution/:city', getAttribution);
router.get('/:city', getForecast);

module.exports = router;
