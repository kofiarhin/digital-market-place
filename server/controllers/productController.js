const Product = require("../models/Product");

const serializeProduct = (product) => ({
  id: product._id,
  title: product.title,
  slug: product.slug,
  description: product.description,
  price: product.price,
  thumbnailUrl: product.thumbnailUrl,
  seller: product.seller,
  assetKey: product.assetKey
});

const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.json({ products: products.map(serializeProduct) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load products", error: error.message });
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ product: serializeProduct(product) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load product", error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    if (req.userRole !== "seller") {
      return res.status(403).json({ message: "Only sellers can create products" });
    }

    const { title, description, price, assetKey, thumbnailUrl, slug } = req.body;

    if (!title || !description || !price || !assetKey || !slug) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await Product.findOne({ slug });

    if (existing) {
      return res.status(409).json({ message: "Slug already in use" });
    }

    const product = await Product.create({
      title,
      description,
      price,
      assetKey,
      thumbnailUrl,
      slug,
      seller: req.userId
    });

    return res.status(201).json({ product: serializeProduct(product) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create product", error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct
};
