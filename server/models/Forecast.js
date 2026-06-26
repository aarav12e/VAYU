const mongoose = require('mongoose');

const ForecastSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, index: true },
    ward: { type: String },
    forecastHours: { type: Number, enum: [24, 48, 72], required: true },
    predictedAQI: { type: Number, required: true },
    predictedCategory: { type: String },
    confidence: { type: Number, min: 0, max: 1 },
    forecastTime: { type: Date, required: true },
    generatedAt: { type: Date, default: Date.now },
    modelVersion: { type: String, default: '1.0' },
    factors: {
      weatherInfluence: Number,
      trafficInfluence: Number,
      industrialInfluence: Number,
      seasonalFactor: Number,
    },
  },
  { timestamps: true }
);

ForecastSchema.index({ city: 1, forecastTime: 1 });

module.exports = mongoose.model('Forecast', ForecastSchema);
