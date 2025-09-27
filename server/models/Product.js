const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileKey: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  checksum: {
    type: String,
    required: true
  }
}, { _id: false });

const versionSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true
  },
  changelog: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SellerProfile',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    min: 0,
    required: true
  },
  currency: {
    type: String,
    required: true,
    uppercase: true
  },
  thumbnailUrl: {
    type: String
  },
  files: [fileSchema],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  isDownloadable: {
    type: Boolean,
    default: true
  },
  maxDownloadsPerOrder: {
    type: Number,
    default: 5
  },
  versions: [versionSchema]
}, {
  timestamps: true
});

productSchema.index({ sellerId: 1, slug: 1 }, { unique: true });
productSchema.index({ title: 'text' });

module.exports = mongoose.model('Product', productSchema);
