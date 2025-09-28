const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const {
  configureInMemoryModels,
  resetStores,
  __testing
} = require("../utils/inMemoryModels");

const { attachId, matchesQuery, toObjectId, stores } = __testing;

describe("inMemoryModels utility", () => {
  beforeAll(() => {
    configureInMemoryModels();
  });

  afterEach(() => {
    resetStores();
  });

  it("attaches identifiers when creating documents", async () => {
    const user = await User.create({
      name: "Utility User",
      email: "utility@example.com",
      password: "hashed"
    });

    expect(user._id).toBeDefined();
    expect(user.id).toBe(user._id.toString());
  });

  it("supports manual attachment helper", () => {
    expect(attachId(null)).toBeNull();

    const doc = attachId({ name: "Manual" });
    expect(doc._id).toBeDefined();
    expect(doc.id).toBe(doc._id.toString());
  });

  it("converts values to ObjectId when needed", () => {
    const baseId = new mongoose.Types.ObjectId();
    expect(toObjectId(baseId)).toBe(baseId);

    const converted = toObjectId(baseId.toString());
    expect(converted).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(converted.toString()).toBe(baseId.toString());
  });

  it("matches queries on primitive and ObjectId fields", () => {
    const id = new mongoose.Types.ObjectId();
    const doc = { name: "Match", owner: id };

    expect(matchesQuery(doc, { name: "Match" })).toBe(true);
    expect(matchesQuery(doc, { owner: id.toString() })).toBe(true);
  });

  it("creates and finds products with ordering", async () => {
    const seller = new mongoose.Types.ObjectId();

    await Product.create({
      title: "Product A",
      slug: "product-a",
      description: "Desc",
      price: 1000,
      assetKey: "asset-a",
      thumbnailUrl: "thumb-a",
      seller,
      createdAt: new Date("2024-01-01")
    });

    await Product.create({
      title: "Product B",
      slug: "product-b",
      description: "Desc",
      price: 1200,
      assetKey: "asset-b",
      thumbnailUrl: "thumb-b",
      seller,
      createdAt: new Date("2024-02-01")
    });

    const found = await Product.findOne({ slug: "product-a" });
    expect(found).toBeTruthy();

    const sorted = await Product.find().sort({ createdAt: -1 });
    expect(sorted[0].slug).toBe("product-b");
  });

  it("supports custom identifiers and default find queries", async () => {
    const userId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();
    const orderId = new mongoose.Types.ObjectId();

    const user = await User.create({
      _id: userId,
      name: "Custom User",
      email: "custom@example.com",
      password: "hashed"
    });

    const product = await Product.create({
      _id: productId,
      title: "Custom Product",
      slug: "custom-product",
      description: "Desc",
      price: 1500,
      assetKey: "asset-custom",
      thumbnailUrl: "thumb-custom",
      seller: user._id,
      createdAt: new Date("2024-03-01")
    });

    const order = await Order.create({
      _id: orderId,
      user: user._id,
      product: product._id,
      stripeSessionId: "sess_custom"
    });

    expect(order._id.toString()).toBe(orderId.toString());

    const ascending = await Product.find().sort({ createdAt: 1 });
    expect(ascending[0].slug).toBe("custom-product");

    const allOrders = await Order.find();
    expect(allOrders).toHaveLength(1);
  });

  it("handles order lifecycle helpers", async () => {
    const user = await User.create({
      name: "Order Owner",
      email: "order-owner@example.com",
      password: "hashed"
    });

    const product = await Product.create({
      title: "Order Product",
      slug: "order-product",
      description: "Desc",
      price: 2000,
      assetKey: "asset-order",
      thumbnailUrl: "thumb-order",
      seller: user._id
    });

    const order = await Order.create({
      user: user._id,
      product: product._id,
      status: "pending",
      stripeSessionId: "sess_order"
    });

    const immediate = await Order.findById(order._id);
    expect(immediate._id.toString()).toBe(order._id.toString());

    const populated = await Order.findById(order._id).populate("product");
    expect(populated.product.slug).toBe("order-product");

    const userPopulated = await Order.findById(order._id).populate("user");
    expect(userPopulated.user.toString()).toBe(user._id.toString());

    const updated = await Order.findOneAndUpdate({ _id: order._id }, { status: "fulfilled" });
    expect(updated.status).toBe("fulfilled");

    const list = await Order.find({ user: user._id });
    expect(list).toHaveLength(1);

    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    expect(stores.User).toHaveLength(0);
    expect(stores.Product).toHaveLength(0);
    expect(stores.Order).toHaveLength(0);
  });

  it("returns null when populating missing references", async () => {
    const user = await User.create({
      name: "Missing Product",
      email: "missing@example.com",
      password: "hashed"
    });

    const order = await Order.create({
      user: user._id,
      product: new mongoose.Types.ObjectId(),
      stripeSessionId: "sess_missing"
    });

    const populated = await Order.findById(order._id).populate("product");
    expect(populated).toBeNull();

    const missing = await Order.findById(new mongoose.Types.ObjectId()).populate("product");
    expect(missing).toBeNull();

    const updatedMissing = await Order.findOneAndUpdate({
      _id: new mongoose.Types.ObjectId()
    }, { status: "failed" });
    expect(updatedMissing).toBeNull();
  });

  it("returns the same configuration object on subsequent calls", () => {
    const first = configureInMemoryModels();
    const second = configureInMemoryModels();

    expect(second).toHaveProperty("reset");
    expect(typeof second.reset).toBe("function");

    first.reset();
    expect(stores.User).toHaveLength(0);
  });
});
