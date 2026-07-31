import { Request, Response } from "express";
import SSLCommerzPayment from "sslcommerz-lts";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";

const store_id = process.env.SSL_STORE_ID || "testbox";
const store_passwd = process.env.SSL_STORE_PASSWORD || "qwerty";
const is_live = process.env.SSL_IS_LIVE === "true";

// Helper function: SSLCommerz Session Generator
const initSSLCommerzSession = async (order: any, user: any) => {
  const tran_id = `TRAN_${order.id.slice(0, 8)}_${Date.now()}`;

  const paymentData = {
    total_amount: order.totalPrice,
    currency: "BDT",
    tran_id: tran_id,
    success_url: `${process.env.SERVER_BASE_URL || "http://localhost:5000"}/api/payments/confirm?orderId=${order.id}&status=success`,
    fail_url: `${process.env.SERVER_BASE_URL || "http://localhost:5000"}/api/payments/confirm?orderId=${order.id}&status=fail`,
    cancel_url: `${process.env.SERVER_BASE_URL || "http://localhost:5000"}/api/payments/confirm?orderId=${order.id}&status=cancel`,
    ipn_url: `${process.env.SERVER_BASE_URL || "http://localhost:5000"}/api/payments/confirm`,
    shipping_method: "NO",
    product_name: `Rental Order #${order.id}`,
    product_category: "Gear Rental",
    product_profile: "general",
    cus_name: user?.name || "Customer Name",
    cus_email: user?.email || "customer@example.com",
    cus_add1: "Dhaka",
    cus_city: "Dhaka",
    cus_postcode: "1207",
    cus_country: "Bangladesh",
    cus_phone: "01700000000",
  };

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
  const sslResponse = await sslcz.init(paymentData);

  if (!sslResponse?.GatewayPageURL) {
    throw new AppError(500, "Failed to create SSLCommerz payment session");
  }

  return {
    paymentUrl: sslResponse.GatewayPageURL,
    transactionId: tran_id,
  };
};

// 1. Create Payment Session via Request Body ({ orderId })
export const createPaymentSession = async (req: Request, res: Response) => {
  const { orderId } = req.body;
  const user = (req as any).user;

  if (!orderId) {
    throw new AppError(400, "Order ID is required");
  }

  const order = await prisma.rentalOrder.findUnique({
    where: { id: String(orderId) },
    include: { customer: true },
  });

  if (!order) {
    throw new AppError(404, "Rental order not found");
  }

  if (order.customerId !== user.id) {
    throw new AppError(403, "You are not authorized to pay for this order");
  }

  const session = await initSSLCommerzSession(order, user);

  res.status(200).json({
    success: true,
    message: "Payment session initialized successfully",
    ...session,
  });
};

// 2. Initiate Payment via URL Params (/initiate/:orderId)
export const initiatePaymentWithParam = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const user = (req as any).user;

  const order = await prisma.rentalOrder.findUnique({
    where: { id: String(orderId) },
    include: { customer: true },
  });

  if (!order) {
    throw new AppError(404, "Rental order not found");
  }

  if (order.customerId !== user.id) {
    throw new AppError(403, "You are not authorized to pay for this order");
  }

  const session = await initSSLCommerzSession(order, user);

  res.status(200).json({
    success: true,
    message: "Payment successfully Completed",
    ...session,
  });
};

// 3. Confirm / Verify Payment Callback (Success / Fail / Cancel Webhook)
export const confirmPayment = async (req: Request, res: Response) => {
  const { orderId, status } = req.query;
  const paymentBody = req.body; // SSLCommerz IPN/POST Data

  const order = await prisma.rentalOrder.findUnique({
    where: { id: String(orderId) },
  });

  if (!order) {
    throw new AppError(404, "Order not found during payment verification");
  }

  if (status === "success" || paymentBody?.status === "VALID") {
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const validationResponse = await sslcz.validate({
      val_id: paymentBody?.val_id,
    });

    if (validationResponse?.status === "VALID" || status === "success") {
      await prisma.rentalOrder.update({
        where: { id: String(orderId) },
        data: { status: "PAID" as any },
      });

      return res.redirect(
        `${process.env.CLIENT_BASE_URL || "http://localhost:3000"}/payment/success?orderId=${orderId}`
      );
    }
  }

  await prisma.rentalOrder.update({
    where: { id: String(orderId) },
    data: { status: "CANCELLED" as any },
  });

  return res.redirect(
    `${process.env.CLIENT_BASE_URL || "http://localhost:3000"}/payment/failed?orderId=${orderId}`
  );
};

// 4. Get User's Payment History
export const getMyPaymentHistory = async (req: Request, res: Response) => {
  const user = (req as any).user;

  const ordersWithPayments = await prisma.rentalOrder.findMany({
    where: { customerId: user.id },
    select: {
      id: true,
      totalPrice: true,
      status: true,
      createdAt: true,
      orderItems: {
        include: {
          gear: {
            select: { id: true, title: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    success: true,
    message: "Payment history fetched successfully",
    data: ordersWithPayments,
  });
};

// 5. Get Payment Details by Order ID
export const getPaymentDetails = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  const paymentDetails = await prisma.rentalOrder.findUnique({
    where: { id: String(id) },
    include: {
      customer: {
        select: { id: true, name: true, email: true },
      },
      orderItems: {
        include: { gear: true },
      },
    },
  });

  if (!paymentDetails) {
    throw new AppError(404, "Payment details not found for this order");
  }

  if (paymentDetails.customerId !== user.id && user.role !== "admin" && user.role !== "ADMIN") {
    throw new AppError(403, "Unauthorized to view these payment details");
  }

  res.status(200).json({
    success: true,
    message: "Payment details fetched successfully",
    data: paymentDetails,
  });
};