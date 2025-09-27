const rateLimit = require('express-rate-limit');

const applyRateLimit = (options) => rateLimit({
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  ...options
});

module.exports = applyRateLimit;
