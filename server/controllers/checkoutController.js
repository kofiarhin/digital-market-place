const Stripe = require("stripe");
const Order = require("../models/Order");
const Product = require("../models/Product");

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable");
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const createCheckoutSession = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product is required" });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!process.env.CLIENT_URL) {
      throw new Error("Missing CLIENT_URL environment variable");
    }

    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.title,
              description: product.description
            },
            unit_amount: Math.round(product.price * 100)
          },
          quantity: 1
        }
      ],
      success_url: `${process.env.CLIENT_URL}/library?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      metadata: {
        productId: product.id,
        userId: req.userId
      }
    });

    const existingOrder = await Order.findOne({ stripeSessionId: session.id });

    if (!existingOrder) {
      await Order.create({
        user: req.userId,
        product: product.id,
        stripeSessionId: session.id
      });
    }

    return res.json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create checkout session", error: error.message });
  }
};

module.exports = {
  createCheckoutSession
};
