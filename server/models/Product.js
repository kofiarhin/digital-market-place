const { Schema, model, Types } = require("mongoose");

const ProductSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    assetKey: {
      type: String,
      required: true
    },
    seller: {
      type: Types.ObjectId,
      ref: "User",
      required: true
    },
    thumbnailUrl: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = model("Product", ProductSchema);
