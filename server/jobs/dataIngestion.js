const cron = require('node-cron');
const { runAllIndiaIngestion } = require('../services/aqiService');

function initDataIngestion(io) {
  // Run immediate ingestion on startup
  runAllIndiaIngestion(io);

  // Cron schedule: every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    runAllIndiaIngestion(io);
  });

  console.log('⏱️ Data ingestion cron scheduled (every 15 min)');
}

module.exports = {
  initDataIngestion,
  fetchAndStoreAQI: runAllIndiaIngestion,
};
