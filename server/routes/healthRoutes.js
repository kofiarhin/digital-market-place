const express = require('express');
const { getHealthStatus } = require('../controllers/healthController');
const applyRateLimit = require('../middlewares/applyRateLimit');
const rateLimits = require('../constants/rateLimits');

const router = express.Router();

router.get('/', applyRateLimit(rateLimits.public), getHealthStatus);

module.exports = router;
