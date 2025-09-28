const express = require("express");
const { getProducts, getProductBySlug, createProduct } = require("../controllers/productController");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", getProducts);
router.get("/:slug", getProductBySlug);
router.post("/", auth, createProduct);

module.exports = router;
