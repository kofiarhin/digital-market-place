const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const request = require("./utils/testApp");
const Product = require("../models/Product");
const User = require("../models/User");

const createUserWithToken = async (overrides = {}) => {
  const password = overrides.password || "password123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: overrides.name || "Seller",
    email: overrides.email || `seller${new mongoose.Types.ObjectId()}@example.com`,
    password: hashedPassword,
    role: overrides.role || "seller"
  });

  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

  return { user, token };
};

const createProduct = async (overrides = {}) => {
  const seller = overrides.seller || (await createUserWithToken()).user;

  return Product.create({
    title: overrides.title || "Sample Product",
    slug: overrides.slug || `product-${new mongoose.Types.ObjectId()}`,
    description: overrides.description || "Description",
    price: overrides.price || 9.99,
    assetKey: overrides.assetKey || "sample.pdf",
    thumbnailUrl: overrides.thumbnailUrl || "http://example.com/thumb.jpg",
    seller: seller.id
  });
};

describe("Product routes", () => {
  describe("GET /api/products", () => {
    it("lists products", async () => {
      const product = await createProduct();

      const response = await request.get("/api/products");

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].id).toBe(product.id);
    });

    it("handles database errors", async () => {
      const spy = jest.spyOn(Product, "find").mockReturnValue({
        sort: () => {
          throw new Error("db error");
        }
      });

      const response = await request.get("/api/products");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to load products");

      spy.mockRestore();
    });
  });

  describe("GET /api/products/:slug", () => {
    it("returns product by slug", async () => {
      const product = await createProduct({ slug: "special-slug" });

      const response = await request.get("/api/products/special-slug");

      expect(response.status).toBe(200);
      expect(response.body.product.slug).toBe(product.slug);
    });

    it("returns 404 when not found", async () => {
      const response = await request.get("/api/products/missing");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Product not found");
    });

    it("handles errors", async () => {
      const spy = jest.spyOn(Product, "findOne").mockRejectedValue(new Error("db down"));

      const response = await request.get("/api/products/anything");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to load product");

      spy.mockRestore();
    });
  });

  describe("POST /api/products", () => {
    it("requires authentication", async () => {
      const response = await request.post("/api/products").send({});

      expect(response.status).toBe(401);
    });

    it("rejects invalid tokens", async () => {
      const response = await request
        .post("/api/products")
        .set("Authorization", "Bearer invalid")
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid authentication token");
    });

    it("allows sellers to create products", async () => {
      const { token, user } = await createUserWithToken({ role: "seller" });

      const response = await request
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "New Product",
          description: "New description",
          price: 19.99,
          assetKey: "assets/new.pdf",
          thumbnailUrl: "http://example.com/thumb.png",
          slug: "new-product"
        });

      expect(response.status).toBe(201);
      expect(response.body.product.slug).toBe("new-product");
      expect(response.body.product.seller).toBe(user.id);
    });

    it("rejects buyers", async () => {
      const { token } = await createUserWithToken({ role: "buyer" });

      const response = await request
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Only sellers can create products");
    });

    it("validates required fields", async () => {
      const { token } = await createUserWithToken({ role: "seller" });

      const response = await request
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Missing" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Missing required fields");
    });

    it("prevents duplicate slugs", async () => {
      const { token, user } = await createUserWithToken({ role: "seller" });
      await Product.create({
        title: "Existing",
        slug: "dup-slug",
        description: "desc",
        price: 10,
        assetKey: "asset.pdf",
        seller: user.id
      });

      const response = await request
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "New",
          description: "desc",
          price: 20,
          assetKey: "asset2.pdf",
          slug: "dup-slug"
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Slug already in use");
    });

    it("handles creation errors", async () => {
      const { token } = await createUserWithToken({ role: "seller" });
      const spy = jest.spyOn(Product, "create").mockRejectedValue(new Error("db down"));

      const response = await request
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Fail",
          description: "desc",
          price: 10,
          assetKey: "asset.pdf",
          slug: "fail"
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to create product");

      spy.mockRestore();
    });
  });
});
