import prisma from '../config/prisma.js';

export const createGear = async (gearData: any, providerId: string) => {
  return await prisma.gearItem.create({
    data: {
      ...gearData,
      providerId,
    },
  });
};

export const getAllGearItems = async (filters: { category?: string; brand?: string; minPrice?: string; maxPrice?: string }) => {
  const { category, brand, minPrice, maxPrice } = filters;

  const whereClause: any = { isAvailable: true };

  if (category) {
    whereClause.category = { name: { equals: category, mode: 'insensitive' } };
  }
  if (brand) {
    whereClause.brand = { equals: brand, mode: 'insensitive' };
  }
  if (minPrice || maxPrice) {
    whereClause.pricePerDay = {};
    if (minPrice) whereClause.pricePerDay.gte = parseFloat(minPrice);
    if (maxPrice) whereClause.pricePerDay.lte = parseFloat(maxPrice);
  }

  return await prisma.gearItem.findMany({
    where: whereClause,
    include: {
      category: { select: { name: true } },
    },
  });
};

export const getGearItemById = async (id: string) => {
  return await prisma.gearItem.findUnique({
    where: { id },
    include: {
      category: { select: { name: true } },
      provider: { select: { name: true, email: true } },
    },
  });
};