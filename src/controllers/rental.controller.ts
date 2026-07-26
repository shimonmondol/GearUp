import { Request, Response } from "express";
import SSLCommerzPayment from "sslcommerz-lts";
import { OrderStatus } from "@prisma/client";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";

const store_id = process.env.SSL_STORE_ID || "testbox";
const store_passwd = process.env.SSL_STORE_PASSWORD || "qwerty";
const is_live = process.env.SSL_IS_LIVE === "true";

export const createRentalOrder = async (req: Request, res: Response) => {
  const { startDate, endDate, gearItems } = req.body || {};
  const user = (req as any).user;

  if (!startDate || !endDate || !gearItems || gearItems.length === 0) {
    throw new AppError(400, "Missing required fields for rental order");
  }

  const days = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (days <= 0) {
    throw new AppError(400, "End date must be after start date");
  }

  let total = 0;
  for (const item of gearItems) {
    const gear = await prisma.gearItem.findUnique({
      where: { id: item.gearId },
    });
    if (!gear || gear.stockQuantity < item.quantity) {
      throw new AppError(
        400,
        `Item "${gear?.title || "Unknown"}" is out of stock`
      );
    }
    total += gear.pricePerDay * item.quantity * days;
  }

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.rentalOrder.create({
      data: {
        customerId: user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalPrice: total,
        status: OrderStatus.PLACED, // 👈 Prisma Enum ভ্যালু ব্যবহার করা হলো
      },
    });

    for (const item of gearItems) {
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          gearId: item.gearId,
          quantity: item.quantity,
        },
      });

      await tx.gearItem.update({
        where: { id: item.gearId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }

    return newOrder;
  });

  const tran_id = `TRAN_${order.id.slice(0, 8)}_${Date.now()}`;

  const paymentData = {
    total_amount: total,
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
  const sslResponse = await sslcz.init(paymentData);

  if (!sslResponse?.GatewayPageURL) {
    throw new AppError(500, "Failed to create SSLCommerz payment session");
  }

  res.status(201).json({
    success: true,
    message: "Order placed successfully. Complete payment via SSLCommerz link.",
    orderId: order.id,
    checkoutUrl: sslResponse.GatewayPageURL,
  });
};