const Payment = require("../models/payment.model");
const razorpay = require("../services/razorpay.service");

require("dotenv").config();

const amqp = require("amqplib");

async function publishToQueue(data) {
  const {
    RABBITMQ_HOST,
    RABBITMQ_PORT,
    RABBITMQ_USERNAME,
    RABBITMQ_PASSWORD,
    RABBITMQ_QUEUE,
  } = process.env;

  const connectionURL = `amqp://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;

  const connection = await amqp.connect(connectionURL);
  const channel = await connection.createChannel();

  await channel.assertQueue(RABBITMQ_QUEUE, { durable: true });
  channel.sendToQueue(RABBITMQ_QUEUE, Buffer.from(JSON.stringify(data)));

  setTimeout(() => {
    connection.close();
  }, 500);
}

exports.handlePayment = async (req, res) => {
  const { orderId, amount, transactionId } = req.body;

  try {
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `order_rcptid_${orderId}`,
    });

    const payment = new Payment({
      orderId,
      amount,
      status: "COMPLETED",
      paymentStatus: "SUCCESS",
      paymentId: razorpayOrder.id,
      originalTransactionId: transactionId,
    });

    await payment.save();

    const responsePayload = {
      orderId,
      transactionId,
      paymentId: razorpayOrder.id,
      paymentStatus: "SUCCESS",
    };

    await publishToQueue(responsePayload);

    res.status(200).json({
      ...responsePayload,
      transactionStatus: "COMPLETED",
    });
  } catch (error) {
    console.error("❌ Razorpay payment failed:", error);

    const failedPayload = {
      orderId,
      transactionId: transactionId ?? null,
      paymentId: null,
      paymentStatus: "FAILED",
    };

    // ✅ Publish failure to RabbitMQ too
    try {
      await publishToQueue(failedPayload);
    } catch (mqError) {
      console.error("❌ Failed to publish failure to RabbitMQ:", mqError);
    }

    res.status(500).json({
      ...failedPayload,
      transactionStatus: "FAILED",
    });
  }
};
