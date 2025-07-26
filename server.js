require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const paymentRoutes = require("./routes/payment.routes");

const app = express();
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.use("/pay", paymentRoutes);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});
