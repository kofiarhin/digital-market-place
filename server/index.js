const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const checkoutRoutes = require("./routes/checkout");
const webhookRoutes = require("./routes/webhooks");
const downloadRoutes = require("./routes/downloads");

const app = express();

const corsOptions = {
  origin: "*"
};

app.use(cors(corsOptions));
app.use("/api/webhooks", webhookRoutes);
app.use(express.json());

app.get("/health", (req, res) => {
  return res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/downloads", downloadRoutes);

const PORT = process.env.PORT || 5000;

const connectToDatabase = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI environment variable");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  });
};

const start = async () => {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = app;
