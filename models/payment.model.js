const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  orderId: Number,
  amount: Number,
  status: String,
  paymentStatus: String,
  paymentId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Payment", paymentSchema);
