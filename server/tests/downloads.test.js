const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const request = require("./utils/testApp");
const app = require("../app");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { createDownloadToken } = require("../utils/downloads");

const storageRoot = path.resolve(__dirname, "..", "storage");

const ensureFile = async (relativePath, contents = "test") => {
  const absolutePath = path.join(storageRoot, relativePath);
  await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.promises.writeFile(absolutePath, contents);
  return absolutePath;
};

const createUserWithToken = async (overrides = {}) => {
  const hashedPassword = await bcrypt.hash("password123", 10);
  const user = await User.create({
    name: overrides.name || "User",
    email: overrides.email || `user${new mongoose.Types.ObjectId()}@example.com`,
    password: hashedPassword,
    role: overrides.role || "buyer"
  });
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
  return { user, token };
};

const createProduct = async ({ sellerId, assetKey }) =>
  Product.create({
    title: "Downloadable",
    slug: `download-${new mongoose.Types.ObjectId()}`,
    description: "desc",
    price: 5,
    assetKey,
    seller: sellerId
  });

const createOrder = async ({ userId, productId, status = "pending", stripeSessionId = `sess_${Date.now()}` }) =>
  Order.create({ user: userId, product: productId, status, stripeSessionId });

describe("Download routes", () => {
  afterAll(async () => {
    await fs.promises.rm(storageRoot, { recursive: true, force: true });
  });

  describe("GET /api/downloads/:orderId", () => {
    it("requires authentication", async () => {
      const response = await request.get(`/api/downloads/${new mongoose.Types.ObjectId()}`);

      expect(response.status).toBe(401);
    });

    it("returns 404 when order missing", async () => {
      const { token } = await createUserWithToken();

      const response = await request
        .get(`/api/downloads/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Order not found");
    });

    it("rejects other users", async () => {
      const { user: owner, token: ownerToken } = await createUserWithToken();
      const { token: otherToken } = await createUserWithToken();
      const product = await createProduct({ sellerId: owner.id, assetKey: "assets/file.txt" });
      const order = await createOrder({ userId: owner.id, productId: product.id, status: "paid" });

      const response = await request
        .get(`/api/downloads/${order.id}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Not authorized to access this order");

      const validResponse = await request
        .get(`/api/downloads/${order.id}`)
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(validResponse.status).toBe(200);
      expect(validResponse.body.token).toBeTruthy();
    });

    it("requires order to be paid", async () => {
      const { token, user } = await createUserWithToken();
      const product = await createProduct({ sellerId: user.id, assetKey: "assets/file.txt" });
      const order = await createOrder({ userId: user.id, productId: product.id, status: "pending" });

      const response = await request
        .get(`/api/downloads/${order.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Order not yet paid");
    });

    it("handles server errors", async () => {
      const { token, user } = await createUserWithToken();
      const product = await createProduct({ sellerId: user.id, assetKey: "assets/file.txt" });
      const order = await createOrder({ userId: user.id, productId: product.id, status: "paid" });
      const spy = jest.spyOn(Order, "findById").mockImplementation(() => {
        throw new Error("db down");
      });

      const response = await request
        .get(`/api/downloads/${order.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to create download token");

      spy.mockRestore();
    });

    it("fails when download secret missing", async () => {
      const original = process.env.DOWNLOAD_TOKEN_SECRET;
      delete process.env.DOWNLOAD_TOKEN_SECRET;
      const { token, user } = await createUserWithToken();
      const product = await createProduct({ sellerId: user.id, assetKey: "assets/file.txt" });
      const order = await createOrder({ userId: user.id, productId: product.id, status: "paid" });

      const response = await request
        .get(`/api/downloads/${order.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to create download token");

      process.env.DOWNLOAD_TOKEN_SECRET = original;
    });
  });

  describe("GET /api/downloads/file/:token", () => {
    it("requires authentication", async () => {
      const response = await request.get("/api/downloads/file/abc");

      expect(response.status).toBe(401);
    });

    it("rejects invalid tokens", async () => {
      const { token } = await createUserWithToken();

      const response = await request
        .get("/api/downloads/file/invalid-token")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid or expired download token");
    });

    it("rejects expired tokens", async () => {
      const { token, user } = await createUserWithToken();
      const product = await createProduct({ sellerId: user.id, assetKey: "assets/file.txt" });
      const order = await createOrder({ userId: user.id, productId: product.id, status: "paid" });
      const expiredToken = jwt.sign(
        { orderId: order.id, productId: product.id, key: product.assetKey },
        process.env.DOWNLOAD_TOKEN_SECRET,
        { expiresIn: "1ms" }
      );
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = await request
        .get(`/api/downloads/file/${expiredToken}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid or expired download token");
    });

    it("returns 404 when order missing", async () => {
      const { token } = await createUserWithToken();
      const downloadToken = createDownloadToken({
        orderId: new mongoose.Types.ObjectId().toString(),
        productId: new mongoose.Types.ObjectId().toString(),
        key: "assets/missing.txt"
      });

      const response = await request
        .get(`/api/downloads/file/${downloadToken}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Order not found");
    });

    it("rejects different users", async () => {
      const { user: owner } = await createUserWithToken();
      const { token: otherToken } = await createUserWithToken();
      const product = await createProduct({ sellerId: owner.id, assetKey: "assets/file.txt" });
      const order = await createOrder({ userId: owner.id, productId: product.id, status: "paid" });
      const downloadToken = createDownloadToken({ orderId: order.id, productId: product.id, key: product.assetKey });

      const response = await request
        .get(`/api/downloads/file/${downloadToken}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Not authorized");
    });

    it("requires paid orders", async () => {
      const { token, user } = await createUserWithToken();
      const product = await createProduct({ sellerId: user.id, assetKey: "assets/file.txt" });
      const order = await createOrder({ userId: user.id, productId: product.id, status: "pending" });
      const downloadToken = createDownloadToken({ orderId: order.id, productId: product.id, key: product.assetKey });

      const response = await request
        .get(`/api/downloads/file/${downloadToken}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Order not yet paid");
    });

    it("returns 404 when file missing", async () => {
      const { token, user } = await createUserWithToken();
      const product = await createProduct({ sellerId: user.id, assetKey: "assets/missing.txt" });
      const order = await createOrder({ userId: user.id, productId: product.id, status: "paid" });
      const downloadToken = createDownloadToken({ orderId: order.id, productId: product.id, key: product.assetKey });

      const response = await request
        .get(`/api/downloads/file/${downloadToken}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Requested asset not found");
    });

    it("returns 500 for invalid asset path", async () => {
      const { token, user } = await createUserWithToken();
      const product = await createProduct({ sellerId: user.id, assetKey: "../secret.txt" });
      const order = await createOrder({ userId: user.id, productId: product.id, status: "paid" });
      const downloadToken = createDownloadToken({ orderId: order.id, productId: product.id, key: product.assetKey });

      const response = await request
        .get(`/api/downloads/file/${downloadToken}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to prepare download");
    });

    it("handles missing asset keys", async () => {
      const { token, user } = await createUserWithToken();
      const product = await createProduct({ sellerId: user.id, assetKey: "assets/file.txt" });
      const order = await createOrder({ userId: user.id, productId: product.id, status: "paid" });
      const downloadToken = createDownloadToken({ orderId: order.id, productId: product.id });

      const response = await request
        .get(`/api/downloads/file/${downloadToken}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to prepare download");
    });

    it("handles database errors", async () => {
      const { token, user } = await createUserWithToken();
      const product = await createProduct({ sellerId: user.id, assetKey: "assets/file.txt" });
      const order = await createOrder({ userId: user.id, productId: product.id, status: "paid" });
      const downloadToken = createDownloadToken({ orderId: order.id, productId: product.id, key: product.assetKey });
      const spy = jest.spyOn(Order, "findById").mockImplementation(() => {
        throw new Error("db down");
      });

      const response = await request
        .get(`/api/downloads/file/${downloadToken}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to prepare download");

      spy.mockRestore();
    });

    it("fails when download secret missing for verification", async () => {
      const { token, user } = await createUserWithToken();
      const product = await createProduct({ sellerId: user.id, assetKey: "assets/file.txt" });
      const order = await createOrder({ userId: user.id, productId: product.id, status: "paid" });
      const downloadToken = createDownloadToken({ orderId: order.id, productId: product.id, key: product.assetKey });
      const original = process.env.DOWNLOAD_TOKEN_SECRET;
      delete process.env.DOWNLOAD_TOKEN_SECRET;

      const response = await request
        .get(`/api/downloads/file/${downloadToken}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to prepare download");

      process.env.DOWNLOAD_TOKEN_SECRET = original;
    });

    it("downloads files successfully", async () => {
      const { token, user } = await createUserWithToken();
      const assetKey = "assets/valid.txt";
      await ensureFile(assetKey, "hello");
      const product = await createProduct({ sellerId: user.id, assetKey });
      const order = await createOrder({ userId: user.id, productId: product.id, status: "paid" });
      const downloadToken = createDownloadToken({ orderId: order.id, productId: product.id, key: assetKey });

      const response = await request
        .get(`/api/downloads/file/${downloadToken}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-disposition"]).toContain("attachment");
      expect(response.headers["content-disposition"]).toContain("valid.txt");
      expect(response.text).toBe("hello");
    });

    it("handles download callback errors", async () => {
      const { token, user } = await createUserWithToken();
      const assetKey = "assets/error.txt";
      await ensureFile(assetKey, "data");
      const product = await createProduct({ sellerId: user.id, assetKey });
      const order = await createOrder({ userId: user.id, productId: product.id, status: "paid" });
      const downloadToken = createDownloadToken({ orderId: order.id, productId: product.id, key: assetKey });
      const originalDownload = app.response.download;
      app.response.download = function mockDownload(filePath, filename, callback) {
        if (typeof callback === "function") {
          callback(new Error("stream failure"));
        }
      };

      const response = await request
        .get(`/api/downloads/file/${downloadToken}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to download asset");

      app.response.download = originalDownload;
    });
  });
});
