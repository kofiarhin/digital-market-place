const path = require("path");
const Order = require("../models/Order");
const { createDownloadToken, verifyDownloadToken } = require("../utils/downloads");
const { createSignedDownloadUrl } = require("../utils/s3");

const requestDownloadToken = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate("product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to access this order" });
    }

    if (order.status !== "paid") {
      return res.status(403).json({ message: "Order not yet paid" });
    }

    const token = createDownloadToken({
      orderId: order.id,
      productId: order.product.id,
      key: order.product.assetKey
    });

    return res.json({ token });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create download token", error: error.message });
  }
};

const getDownloadUrl = async (req, res) => {
  try {
    const { token } = req.params;
    const payload = verifyDownloadToken(token);

    const order = await Order.findById(payload.orderId).populate("product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status !== "paid") {
      return res.status(403).json({ message: "Order not yet paid" });
    }

    const filePath = await createSignedDownloadUrl(payload.key);

    return res.download(filePath, path.basename(filePath), (downloadError) => {
      if (downloadError && !res.headersSent) {
        return res.status(500).json({ message: "Failed to download asset", error: downloadError.message });
      }

      return undefined;
    });
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid or expired download token", error: error.message });
    }

    if (error.code === "ENOENT") {
      return res.status(404).json({ message: "Requested asset not found" });
    }

    return res.status(500).json({ message: "Failed to prepare download", error: error.message });
  }
};

module.exports = {
  requestDownloadToken,
  getDownloadUrl
};
