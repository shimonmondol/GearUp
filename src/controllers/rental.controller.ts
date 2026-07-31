import { Request, Response } from "express";
import SSLCommerzPayment from "sslcommerz-lts";
import { OrderStatus } from "@prisma/client";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";

const store_id = process.env.SSL_STORE_ID || "testbox";
const store_passwd = process.env.SSL_STORE_PASSWORD || "qwerty";
const is_live = process.env.SSL_IS_LIVE === "true";

// 1. Create a New Rental Order
export const createRentalOrder = async (req: Request, res: Response) => {
  const { startDate, endDate, gearItems } = req.body || {};
  const user = (req as any).user;

  if (!startDate || !endDate || !gearItems || gearItems.length === 0) {
    throw new AppError(400, "Missing required fields for rental order");
  }

  const days = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24),
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
        `Item "${gear?.title || "Unknown"}" is out of stock`,
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
        status: OrderStatus.PLACED,
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

// 2. Get All Rental Orders for Logged-in Customer
export const getMyRentalOrders = async (req: Request, res: Response) => {
  const user = (req as any).user;

  const orders = await prisma.rentalOrder.findMany({
    where: { customerId: user.id },
    include: {
      orderItems: {
        include: {
          gear: {
            select: {
              id: true,
              title: true,
              pricePerDay: true,
              imageUrl: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    success: true,
    message: "My rental orders fetched successfully",
    data: orders,
  });
};

// 3. Get All Rental Orders (Admin Only)
export const getAllRentalOrders = async (req: Request, res: Response) => {
  const orders = await prisma.rentalOrder.findMany({
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      orderItems: {
        include: {
          gear: {
            select: {
              id: true,
              title: true,
              pricePerDay: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json({
    success: true,
    message: "All rental orders fetched successfully",
    data: orders,
  });
};

// 4. Get Single Rental Order Details
export const getRentalOrderById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  const order = await prisma.rentalOrder.findUnique({
    where: { id: String(id) },
    include: {
      orderItems: {
        include: { gear: true },
      },
      customer: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!order) {
    throw new AppError(404, "Rental order not found");
  }

  // Authorization check (Customer can only view their own order, Admin can view all)
  if (
    order.customerId !== user.id &&
    user.role !== "admin" &&
    user.role !== "ADMIN"
  ) {
    throw new AppError(403, "You do not have permission to view this order");
  }

  res.status(200).json({
    success: true,
    message: "Rental order details fetched successfully",
    data: order,
  });
};

// 5. Update Order Status (Admin / Owner Only - e.g., Mark as RETURNED)
export const updateOrderStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !Object.values(OrderStatus).includes(status)) {
    throw new AppError(400, "Invalid or missing order status");
  }

  const existingOrder = await prisma.rentalOrder.findUnique({
    where: { id: String(id) },
  });

  if (!existingOrder) {
    throw new AppError(404, "Rental order not found");
  }

  const updatedOrder = await prisma.rentalOrder.update({
    where: { id: String(id) },
    data: { status },
  });

  res.status(200).json({
    success: true,
    message: `Order status updated to ${status} successfully!`,
    data: updatedOrder,
  });
};

// 6. Delete a Rental Order (Admin Only)
export const deleteRentalOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const order = await prisma.rentalOrder.findUnique({
    where: { id: String(id) },
    include: { orderItems: true },
  });

  if (!order) {
    throw new AppError(404, "Rental order not found");
  }

  const isAdmin = user.role === "admin" || user.role === "ADMIN";
  if (order.customerId !== user.id && !isAdmin) {
    throw new AppError(403, "You do not have permission to delete this order");
  }

  await prisma.$transaction(async (tx) => {
    for (const item of order.orderItems) {
      await tx.gearItem.update({
        where: { id: item.gearId },
        data: { stockQuantity: { increment: item.quantity } },
      });
    }

    await tx.orderItem.deleteMany({
      where: { orderId: String(id) },
    });

    await tx.rentalOrder.delete({
      where: { id: String(id) },
    });
  });

  res.status(200).json({
    success: true,
    message: "Rental order deleted successfully and stock quantity restored",
  });
};
