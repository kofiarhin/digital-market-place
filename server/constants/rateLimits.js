const rateLimits = {
  public: {
    windowMs: 60 * 1000,
    max: 60
  },
  auth: {
    windowMs: 60 * 1000,
    max: 120
  },
  downloads: {
    windowMs: 60 * 60 * 1000,
    max: 10
  }
};

module.exports = rateLimits;
