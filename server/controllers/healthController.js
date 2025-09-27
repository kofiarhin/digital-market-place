const environment = require('../config/environment');

const getHealthStatus = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: environment.nodeEnv
  });
};

module.exports = { getHealthStatus };
