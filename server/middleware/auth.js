const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("Missing JWT_SECRET environment variable");
    }

    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = payload.sub;
    req.userRole = payload.role;

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid authentication token", error: error.message });
  }
};

module.exports = auth;
