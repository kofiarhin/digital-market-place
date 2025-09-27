const mongoose = require('mongoose');

const downloadGrantSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  remaining: {
    type: Number,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  lastDownloadedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DownloadGrant', downloadGrantSchema);
