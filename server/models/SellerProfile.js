const mongoose = require('mongoose');

const metricsSchema = new mongoose.Schema({
  productsCount: {
    type: Number,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  }
}, { _id: false });

const payoutSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ['stripe', 'paypal', 'manual']
  },
  accountId: {
    type: String
  },
  verified: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const storeSettingsSchema = new mongoose.Schema({
  showEmail: {
    type: Boolean,
    default: false
  },
  supportEmail: {
    type: String
  },
  customDomain: {
    type: String
  },
  allowDiscountCodes: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const sellerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  storeName: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  bio: {
    type: String
  },
  avatarUrl: {
    type: String
  },
  bannerUrl: {
    type: String
  },
  tags: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: false,
    index: true
  },
  metrics: {
    type: metricsSchema,
    default: () => ({})
  },
  payout: {
    type: payoutSchema,
    default: () => ({})
  },
  storeSettings: {
    type: storeSettingsSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

sellerProfileSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model('SellerProfile', sellerProfileSchema);
