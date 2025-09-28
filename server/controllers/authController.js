const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

const createToken = (userId, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET environment variable");
  }

  return jwt.sign({ sub: userId, role }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role === "seller" ? "seller" : "buyer"
    });

    const token = createToken(user.id, user.role);

    return res.status(201).json({
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = createToken(user.id, user.role);

    return res.json({
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to login", error: error.message });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load profile", error: error.message });
  }
};

module.exports = {
  register,
  login,
  me
};
