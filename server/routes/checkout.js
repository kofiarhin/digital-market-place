const express = require("express");
const { createCheckoutSession } = require("../controllers/checkoutController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/session", auth, createCheckoutSession);

module.exports = router;
