# ⚙️ GearUp - Gear Rental API

GearUp is a backend API built with **Node.js**, **TypeScript**, **Express.js**, and **Prisma ORM**. It provides a equipment rental system with role-based access control, real-time inventory management, automated pricing calculation, and native **SSLCommerz** payment gateway integration for Bangladesh.

---

## ✨ Features

- **JWT Authentication & RBAC**: Role-Based Access Control supporting 3 roles (`admin`, `provider`, `customer`).
- **Gear Management (CRUD)**: Manage camera and gear listings with real-time stock tracking.
- **Rental Booking Engine**: Calculates total price based on rental duration and manages order states via Prisma database transactions.
- **SSLCommerz Payment Integration**: Native support for Sandbox/Live online payments (bKash, Nagad, Rocket, Cards).
- **Payment Lifecycle Tracking**: Real-time status updates (`PLACED` -> `PAID` / `FAILED` / `CANCELLED`).
- **Error Handling & Validation**: Custom `AppError` class and input validation schemas for clean, structured HTTP responses.

---

## 🛠️ Tech Stack

- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL
- **Payment Gateway**: [SSLCommerz LTS](https://www.npmjs.com/package/sslcommerz-lts)
- **Authentication**: JSON Web Token (JWT) & Bcrypt

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18 or higher)
- **npm**
- PostgreSQL Database Instance

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/shimonmondol/GearUp
   cd gearup