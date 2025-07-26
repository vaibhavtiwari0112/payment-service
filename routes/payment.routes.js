const express = require("express");
const { handlePayment } = require("../controller/payment.controller");
const router = express.Router();

router.post("/", handlePayment);

module.exports = router;
