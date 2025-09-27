const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  unitPrice: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    uppercase: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  titleSnapshot: {
    type: String,
    required: true
  }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  provider: {
    type: String
  },
  intentId: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded', 'partially_refunded', 'canceled'],
    default: 'pending'
  },
  paidAt: {
    type: Date
  }
}, { _id: false });

const fulfillmentSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['unavailable', 'available'],
    default: 'unavailable'
  },
  availableAt: {
    type: Date
  }
}, { _id: false });

const refundSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['none', 'requested', 'approved', 'declined', 'processed'],
    default: 'none'
  },
  amount: {
    type: Number
  },
  requestedAt: {
    type: Date
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SellerProfile',
    required: true,
    index: true
  },
  items: {
    type: [orderItemSchema],
    validate: (items) => Array.isArray(items) && items.length > 0
  },
  subtotal: {
    type: Number,
    required: true
  },
  fees: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    uppercase: true
  },
  payment: {
    type: paymentSchema,
    default: () => ({})
  },
  fulfillment: {
    type: fulfillmentSchema,
    default: () => ({})
  },
  refund: {
    type: refundSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Order', orderSchema);
