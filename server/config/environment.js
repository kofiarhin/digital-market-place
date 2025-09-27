const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required. Please define it in the environment.`);
  }
  return value;
};

const environment = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/multi-seller-digital-store',
  jwt: {
    accessTokenSecret: requireEnv('ACCESS_TOKEN_SECRET'),
    refreshTokenSecret: requireEnv('REFRESH_TOKEN_SECRET'),
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
    refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '7d'
  },
  download: {
    grantTtlDays: Number(process.env.DOWNLOAD_GRANT_TTL_DAYS || 365),
    tokenTtlSeconds: Number(process.env.DOWNLOAD_TOKEN_TTL_SECONDS || 120),
    tokenSingleUse: process.env.DOWNLOAD_TOKEN_SINGLE_USE !== 'false',
    maxDownloadsPerOrderDefault: Number(process.env.DOWNLOAD_MAX_PER_ORDER || 5)
  },
  payouts: {
    schedule: process.env.PAYOUT_SCHEDULE || 'weekly',
    minThreshold: Number(process.env.PAYOUT_MIN_THRESHOLD || 10)
  }
};

module.exports = environment;
