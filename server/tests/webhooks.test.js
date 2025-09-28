const mongoose = require("mongoose");
const request = require("./utils/testApp");
const Order = require("../models/Order");
const Stripe = require("stripe");

const sendWebhook = (payload, signature = "sig_test") => {
  const body = JSON.stringify(payload);
  return request
    .post("/api/webhooks/stripe")
    .set("stripe-signature", signature)
    .set("Content-Type", "application/json")
    .set("Content-Length", Buffer.byteLength(body))
    .send(body);
};

describe("Stripe webhooks", () => {
  beforeEach(() => {
    Stripe.__mocks.constructEventMock.mockImplementation((body) => {
      const buffer = Buffer.isBuffer(body)
        ? body
        : Buffer.from(
            body && body.type === "Buffer" && Array.isArray(body.data) ? body.data : []
          );

      const event = JSON.parse(buffer.toString());
      return event;
    });
  });

  it("requires signature header", async () => {
    const response = await request.post("/api/webhooks/stripe").set("Content-Type", "application/json").send({});

    expect(response.status).toBe(400);
    expect(response.text).toBe("Missing stripe signature");
  });

  it("fails when webhook secret missing", async () => {
    const original = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const response = await sendWebhook({ type: "checkout.session.completed", data: { object: {} } });

    expect(response.status).toBe(500);
    expect(response.text).toContain("Webhook handler failed");

    process.env.STRIPE_WEBHOOK_SECRET = original;
  });

  it("fails when Stripe secret missing", async () => {
    const original = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    const response = await sendWebhook({ type: "checkout.session.completed", data: { object: {} } });

    expect(response.status).toBe(500);
    expect(response.text).toContain("Webhook handler failed");

    process.env.STRIPE_SECRET_KEY = original;
  });

  it("handles invalid signatures", async () => {
    Stripe.__mocks.constructEventMock.mockImplementation(() => {
      throw new Error("invalid signature");
    });

    const response = await sendWebhook({});

    expect(response.status).toBe(400);
    expect(response.text).toContain("Webhook Error");
  });

  it("marks orders as paid", async () => {
    const sessionId = `sess_${Date.now()}`;
    await Order.create({
      user: new mongoose.Types.ObjectId(),
      product: new mongoose.Types.ObjectId(),
      stripeSessionId: sessionId,
      status: "pending"
    });
    const originalUpdate = Order.findOneAndUpdate;
    const updateSpy = jest.spyOn(Order, "findOneAndUpdate").mockImplementation((query, update) =>
      originalUpdate(query, update)
    );

    const response = await sendWebhook({
      type: "checkout.session.completed",
      data: { object: { id: sessionId } }
    });

    expect(response.status).toBe(200);
    expect(Stripe.__mocks.constructEventMock).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith({ stripeSessionId: sessionId }, { status: "paid" });
    const order = await Order.findOne({ stripeSessionId: sessionId });
    expect(order.status).toBe("paid");
    updateSpy.mockRestore();
  });

  it("marks orders as failed", async () => {
    const sessionId = `sess_${Date.now()}`;
    await Order.create({
      user: new mongoose.Types.ObjectId(),
      product: new mongoose.Types.ObjectId(),
      stripeSessionId: sessionId,
      status: "pending"
    });
    const originalUpdate = Order.findOneAndUpdate;
    const updateSpy = jest.spyOn(Order, "findOneAndUpdate").mockImplementation((query, update) =>
      originalUpdate(query, update)
    );

    const response = await sendWebhook({
      type: "checkout.session.expired",
      data: { object: { id: sessionId } }
    });

    expect(response.status).toBe(200);
    expect(Stripe.__mocks.constructEventMock).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith({ stripeSessionId: sessionId }, { status: "failed" });
    const order = await Order.findOne({ stripeSessionId: sessionId });
    expect(order.status).toBe("failed");
    updateSpy.mockRestore();
  });
});
