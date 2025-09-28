const jwt = require("jsonwebtoken");

const createDownloadToken = (payload) => {
  if (!process.env.DOWNLOAD_TOKEN_SECRET) {
    throw new Error("Missing DOWNLOAD_TOKEN_SECRET environment variable");
  }

  return jwt.sign(payload, process.env.DOWNLOAD_TOKEN_SECRET, {
    expiresIn: "15m"
  });
};

const verifyDownloadToken = (token) => {
  if (!process.env.DOWNLOAD_TOKEN_SECRET) {
    throw new Error("Missing DOWNLOAD_TOKEN_SECRET environment variable");
  }

  return jwt.verify(token, process.env.DOWNLOAD_TOKEN_SECRET);
};

module.exports = {
  createDownloadToken,
  verifyDownloadToken
};
