import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import prisma from "../config/prisma.js";

const generateToken = (id: string, role: string) => {
return jwt.sign(
    { id, role }, 
    process.env.JWT_SECRET || "fallback_secret", 
    {
      expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any,
    }
  );
};

export const registerUser = async (userData: any) => {
  const hashedPassword = await bcrypt.hash(userData.password, 12);

  const newUser = await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const token = generateToken(newUser.id, newUser.role);
  return { user: newUser, token };
};

export const loginUser = async (credentials: any) => {
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
  });

  if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
    throw new AppError("Incorrect email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Your account has been suspended by Admin", 403);
  }

  const token = generateToken(user.id, user.role);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  };
};
