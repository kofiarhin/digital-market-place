const Stripe = require("stripe");
const Order = require("../models/Order");

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable");
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const handleStripeWebhook = async (req, res) => {
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable");
    }

    const signature = req.headers["stripe-signature"];

    if (!signature) {
      return res.status(400).send("Missing stripe signature");
    }

    const stripe = getStripeClient();

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await Order.findOneAndUpdate(
        { stripeSessionId: session.id },
        { status: "paid" }
      );
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      await Order.findOneAndUpdate(
        { stripeSessionId: session.id },
        { status: "failed" }
      );
    }

    return res.json({ received: true });
  } catch (error) {
    return res.status(500).send(`Webhook handler failed: ${error.message}`);
  }
};

module.exports = {
  handleStripeWebhook
};
