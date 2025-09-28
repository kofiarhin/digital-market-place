const express = require("express");
const cors = require("cors");
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

module.exports = app;
