import { Request, Response } from "express";
import SSLCommerzPayment from "sslcommerz-lts";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";

const store_id = process.env.SSL_STORE_ID || "testbox";
const store_passwd = process.env.SSL_STORE_PASSWORD || "qwerty";
const is_live = process.env.SSL_IS_LIVE === "true";

export const initiatePayment = async (req: Request, res: Response) => {
  const orderId = String(req.params.orderId || "");
  const user = (req as any).user;

  const order = await prisma.rentalOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError(404, "Rental order not found");
  }

  const tran_id = `TRAN_${order.id.slice(0, 8)}_${Date.now()}`;

  const data = {
    total_amount: order.totalPrice,
    currency: "BDT",
    tran_id: tran_id,
    success_url: `${process.env.SERVER_BASE_URL || "http://localhost:5000"}/api/payments/success/${order.id}?tran_id=${tran_id}`,
    fail_url: `${process.env.SERVER_BASE_URL || "http://localhost:5000"}/api/payments/fail/${order.id}?tran_id=${tran_id}`,
    cancel_url: `${process.env.SERVER_BASE_URL || "http://localhost:5000"}/api/payments/cancel/${order.id}?tran_id=${tran_id}`,
    ipn_url: `${process.env.SERVER_BASE_URL || "http://localhost:5000"}/api/payments/ipn`,
    shipping_method: "NO",
    product_name: `GearUp Rental Order #${order.id}`,
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
  const apiResponse = await sslcz.init(data);

  if (apiResponse?.GatewayPageURL) {
    res.status(200).json({
      success: true,
      message: "Payment session initiated",
      gatewayUrl: apiResponse.GatewayPageURL,
      tran_id,
    });
  } else {
    throw new AppError(500, "Failed to create SSLCommerz payment session");
  }
};

export const paymentSuccess = async (req: Request, res: Response) => {
  const orderId = String(req.params.orderId || "");
  const { val_id, tran_id } = req.body;

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
  const validationResponse = await sslcz.validate({ val_id });

  if (
    validationResponse?.status === "VALID" ||
    validationResponse?.status === "VALIDATED"
  ) {
    await prisma.rentalOrder.update({
      where: { id: orderId },
      data: {
        status: "PAID" as any,
      },
    });

    return res.redirect(
      `${process.env.CLIENT_BASE_URL || "http://localhost:3000"}/payment/success?orderId=${orderId}&tran_id=${tran_id}`,
    );
  }

  return res.redirect(
    `${process.env.CLIENT_BASE_URL || "http://localhost:3000"}/payment/fail?orderId=${orderId}`,
  );
};

export const paymentFail = async (req: Request, res: Response) => {
  const orderId = String(req.params.orderId || "");

  await prisma.rentalOrder.update({
    where: { id: orderId },
    data: { status: "FAILED" as any },
  });

  return res.redirect(
    `${process.env.CLIENT_BASE_URL || "http://localhost:3000"}/payment/fail?orderId=${orderId}`,
  );
};

export const paymentCancel = async (req: Request, res: Response) => {
  const orderId = String(req.params.orderId || "");

  await prisma.rentalOrder.update({
    where: { id: orderId },
    data: { status: "CANCELLED" as any },
  });

  return res.redirect(
    `${process.env.CLIENT_BASE_URL || "http://localhost:3000"}/payment/cancel?orderId=${orderId}`,
  );
};

export const paymentIPN = async (req: Request, res: Response) => {
  const { status, val_id } = req.body;

  if (status === "VALID") {
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    await sslcz.validate({ val_id });
  }

  res.status(200).send("IPN Received");
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  const orderId = String(req.params.orderId || "");

  const order = await prisma.rentalOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      totalPrice: true,
      status: true,
      createdAt: true,
    },
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  res.status(200).json({
    success: true,
    data: {
      orderId: order.id,
      amount: order.totalPrice,
      paymentStatus: order.status,
      createdAt: order.createdAt,
    },
  });
};
