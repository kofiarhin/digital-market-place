const { Schema, model, Types } = require("mongoose");

const OrderSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true
    },
    product: {
      type: Types.ObjectId,
      ref: "Product",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },
    stripeSessionId: {
      type: String,
      required: true,
      unique: true
    }
  },
  { timestamps: true }
);

module.exports = model("Order", OrderSchema);
