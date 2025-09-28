const express = require("express");
const { requestDownloadToken, getDownloadUrl } = require("../controllers/downloadController");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/file/:token", auth, getDownloadUrl);
router.get("/:orderId", auth, requestDownloadToken);

module.exports = router;
