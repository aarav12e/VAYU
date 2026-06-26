const mongoose = require('mongoose');

const AQIReadingSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, index: true },
    station: { type: String, required: true },
    stationId: { type: String },
    aqi: { type: Number, required: true },
    category: {
      type: String,
      enum: ['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe'],
    },
    pollutants: {
      pm25: Number,
      pm10: Number,
      no2: Number,
      so2: Number,
      co: Number,
      o3: Number,
    },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number], // [lng, lat]
    },
    ward: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

AQIReadingSchema.index({ location: '2dsphere' });
AQIReadingSchema.index({ city: 1, timestamp: -1 });

// Helper to get AQI category
AQIReadingSchema.statics.getCategory = function (aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
};

module.exports = mongoose.model('AQIReading', AQIReadingSchema);
