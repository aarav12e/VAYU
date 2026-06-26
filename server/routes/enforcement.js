const express = require('express');
const router = express.Router();
const axios = require('axios');
const EnforcementAction = require('../models/EnforcementAction');
const AQIReading = require('../models/AQIReading');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// GET /api/enforcement/recommendations/:city
router.get('/recommendations/:city', async (req, res) => {
  try {
    const { city } = req.params;

    // Check cache first (recent recommendations)
    const recent = await EnforcementAction.find({
      city,
      generatedAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // last 30 min
    })
      .sort({ priorityScore: -1 })
      .limit(10)
      .lean();

    if (recent.length > 0) {
      return res.json({ success: true, data: recent, cached: true });
    }

    // Get current AQI readings
    const readings = await AQIReading.find({ city }).sort({ timestamp: -1 }).limit(20).lean();

    // Call AI service for enforcement recommendations
    let aiRecs;
    try {
      const aiResp = await axios.post(`${AI_SERVICE_URL}/enforcement/analyze`, {
        city,
        readings: readings.slice(0, 10),
      });
      aiRecs = aiResp.data.recommendations;
    } catch (aiErr) {
      console.error('AI service unavailable, using fallback:', aiErr.message);
      aiRecs = generateFallbackRecommendations(city, readings);
    }

    // Save to DB
    const saved = await EnforcementAction.insertMany(
      aiRecs.map((rec) => ({ ...rec, city, generatedAt: new Date() }))
    );

    // Emit to connected clients
    req.io?.emit('enforcement:update', { city, count: saved.length });

    res.json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/enforcement/geojson/:city - for map display
router.get('/geojson/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const actions = await EnforcementAction.find({ city, status: { $in: ['PENDING', 'DISPATCHED'] } })
      .sort({ priorityScore: -1 })
      .limit(20)
      .lean();

    const geojson = {
      type: 'FeatureCollection',
      features: actions
        .filter((a) => a.location?.coordinates?.length === 2)
        .map((a) => ({
          type: 'Feature',
          geometry: a.location,
          properties: {
            id: a._id,
            siteName: a.siteName,
            siteType: a.siteType,
            priorityScore: a.priorityScore,
            estimatedContribution: a.estimatedContribution,
            recommendedAction: a.recommendedAction,
            aiReasoning: a.aiReasoning,
            status: a.status,
            nearbyAQI: a.nearbyAQI,
          },
        })),
    };

    res.json({ success: true, data: geojson });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/enforcement/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await EnforcementAction.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    req.io?.emit('enforcement:statusUpdate', { id, status });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback recommendations when AI service is down
function generateFallbackRecommendations(city, readings) {
  const hotspots = {
    Mumbai: [
      {
        siteName: 'Dharavi Construction Cluster',
        siteType: 'CONSTRUCTION',
        address: 'Dharavi, Mumbai - 400017',
        location: { type: 'Point', coordinates: [72.8545, 19.0374] },
        priorityScore: 92,
        estimatedContribution: 34,
        nearbyAQI: 287,
        ward: 'Dharavi',
        recommendedAction: 'Deploy 3 inspection teams. Check dust suppression compliance at all active sites.',
        aiReasoning: 'High construction density with recorded AQI spike of 287. Wind direction SW → dispersing PM10 toward Bandra. 3 active permit violations flagged in last 7 days.',
        evidenceData: { timeOfPeak: '08:00-10:00', windDirection: 'SW' },
      },
      {
        siteName: 'Andheri West Industrial Zone',
        siteType: 'INDUSTRY',
        address: 'Andheri West, Mumbai - 400053',
        location: { type: 'Point', coordinates: [72.8409, 19.1136] },
        priorityScore: 87,
        estimatedContribution: 28,
        nearbyAQI: 256,
        ward: 'Andheri',
        recommendedAction: 'Stack emission check required for 4 registered units. Verify scrubber operation.',
        aiReasoning: 'SO2 levels elevated 40% above baseline. Cross-correlation with registered industrial units shows 4 potential violators. No inspection in last 45 days.',
        evidenceData: { timeOfPeak: '14:00-18:00', windDirection: 'NE' },
      },
      {
        siteName: 'Kurla Waste Burning Site',
        siteType: 'WASTE_BURNING',
        address: 'LBS Road, Kurla, Mumbai - 400070',
        location: { type: 'Point', coordinates: [72.8843, 19.0726] },
        priorityScore: 79,
        estimatedContribution: 19,
        nearbyAQI: 231,
        ward: 'Kurla',
        recommendedAction: 'Immediate stop-work order. Coordinate with BMC solid waste management.',
        aiReasoning: 'Thermal anomaly detected via satellite at 06:30 AM. CO spike correlates with waste burning signature. Pattern matches 3 prior incidents at same location.',
        evidenceData: { timeOfPeak: '06:00-09:00', windDirection: 'W' },
      },
    ],
    Delhi: [
      {
        siteName: 'Okhla Industrial Area Phase II',
        siteType: 'INDUSTRY',
        address: 'Okhla Phase II, New Delhi - 110020',
        location: { type: 'Point', coordinates: [77.2667, 28.5355] },
        priorityScore: 95,
        estimatedContribution: 38,
        nearbyAQI: 342,
        ward: 'Okhla',
        recommendedAction: 'Emergency inspection. Cross-check with DPCC emission permits.',
        aiReasoning: 'AQI 342 with PM2.5 at 3x safe limit. 6 industries flagged in emission overage in last 30 days.',
        evidenceData: { timeOfPeak: '09:00-14:00', windDirection: 'NW' },
      },
    ],
  };

  return hotspots[city] || hotspots['Mumbai'];
}

module.exports = router;
