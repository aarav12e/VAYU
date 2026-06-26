const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, index: true },
    ward: { type: String },
    type: {
      type: String,
      enum: ['SPIKE_DETECTED', 'FORECAST_WARNING', 'ENFORCEMENT_ALERT', 'HEALTH_ADVISORY', 'SOURCE_IDENTIFIED'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    messageHindi: { type: String },
    aqi: { type: Number },
    sourcesIdentified: [
      {
        type: String,
        contribution: Number,
        confidence: Number,
      },
    ],
    actionRequired: { type: String },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number],
    },
    isActive: { type: Boolean, default: true },
    resolvedAt: { type: Date },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

AlertSchema.index({ location: '2dsphere' });
AlertSchema.index({ city: 1, isActive: 1 });

module.exports = mongoose.model('Alert', AlertSchema);
