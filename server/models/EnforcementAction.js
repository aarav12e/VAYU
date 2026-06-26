const mongoose = require('mongoose');

const EnforcementActionSchema = new mongoose.Schema(
  {
    city: { type: String, required: true },
    siteName: { type: String, required: true },
    siteType: {
      type: String,
      enum: ['CONSTRUCTION', 'INDUSTRY', 'WASTE_BURNING', 'DIESEL_FLEET', 'TRAFFIC_HOTSPOT'],
    },
    address: { type: String },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number],
    },
    priorityScore: { type: Number, min: 0, max: 100 },
    estimatedContribution: { type: Number }, // % of local AQI
    aiReasoning: { type: String },
    recommendedAction: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'DISPATCHED', 'INSPECTED', 'RESOLVED'],
      default: 'PENDING',
    },
    nearbyAQI: { type: Number },
    ward: { type: String },
    generatedAt: { type: Date, default: Date.now },
    evidenceData: {
      sensorReadings: [Number],
      timeOfPeak: String,
      windDirection: String,
    },
  },
  { timestamps: true }
);

EnforcementActionSchema.index({ location: '2dsphere' });
EnforcementActionSchema.index({ city: 1, priorityScore: -1 });

module.exports = mongoose.model('EnforcementAction', EnforcementActionSchema);
