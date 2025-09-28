const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const request = require("./utils/testApp");
const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order");
const Stripe = require("stripe");

const createUserWithToken = async () => {
  const hashedPassword = await bcrypt.hash("password123", 10);
  const user = await User.create({
    name: "Buyer",
    email: `buyer${new mongoose.Types.ObjectId()}@example.com`,
    password: hashedPassword,
    role: "buyer"
  });
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
  return { user, token };
};

const createProduct = async (sellerId) =>
  Product.create({
    title: "Product",
    slug: `product-${new mongoose.Types.ObjectId()}`,
    description: "desc",
    price: 25.5,
    assetKey: "assets/prod.pdf",
    seller: sellerId
  });

describe("Checkout routes", () => {
  beforeEach(() => {
    Stripe.__mocks.sessionsCreateMock.mockResolvedValue({
      id: "sess_default",
      url: "https://stripe.test/checkout"
    });
  });

  it("requires authentication", async () => {
    const response = await request.post("/api/checkout/session").send({});

    expect(response.status).toBe(401);
  });

  it("validates product id", async () => {
    const { token } = await createUserWithToken();

    const response = await request
      .post("/api/checkout/session")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Product is required");
  });

  it("returns 404 when product missing", async () => {
    const { token } = await createUserWithToken();

    const response = await request
      .post("/api/checkout/session")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: new mongoose.Types.ObjectId().toString() });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Product not found");
  });

  it("creates checkout session and order", async () => {
    const { token, user } = await createUserWithToken();
    const product = await createProduct(user.id);

    const response = await request
      .post("/api/checkout/session")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product.id });

    expect(response.status).toBe(200);
    expect(response.body.url).toBe("https://stripe.test/checkout");

    const order = await Order.findOne({ user: user.id, product: product.id });
    expect(order).toBeTruthy();
    expect(order.stripeSessionId).toBe("sess_default");
  });

  it("does not duplicate existing orders", async () => {
    const { token, user } = await createUserWithToken();
    const product = await createProduct(user.id);
    Stripe.__mocks.sessionsCreateMock.mockResolvedValue({ id: "sess_existing", url: "https://stripe.test/checkout" });

    await Order.create({ user: user.id, product: product.id, stripeSessionId: "sess_existing" });

    const response = await request
      .post("/api/checkout/session")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product.id });

    expect(response.status).toBe(200);
    const orders = await Order.find({ stripeSessionId: "sess_existing" });
    expect(orders).toHaveLength(1);
  });

  it("fails when CLIENT_URL missing", async () => {
    const original = process.env.CLIENT_URL;
    delete process.env.CLIENT_URL;

    const { token, user } = await createUserWithToken();
    const product = await createProduct(user.id);

    const response = await request
      .post("/api/checkout/session")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product.id });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Failed to create checkout session");

    process.env.CLIENT_URL = original;
  });

  it("handles Stripe failures", async () => {
    Stripe.__mocks.sessionsCreateMock.mockRejectedValue(new Error("stripe down"));

    const { token, user } = await createUserWithToken();
    const product = await createProduct(user.id);

    const response = await request
      .post("/api/checkout/session")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product.id });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Failed to create checkout session");
  });

  it("handles missing Stripe secret", async () => {
    const original = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    const { token, user } = await createUserWithToken();
    const product = await createProduct(user.id);

    const response = await request
      .post("/api/checkout/session")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product.id });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Failed to create checkout session");

    process.env.STRIPE_SECRET_KEY = original;
  });
});
