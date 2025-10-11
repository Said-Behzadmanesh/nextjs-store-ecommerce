"use server";

// import { PrismaClient } from '@/lib/generated/prisma';
import { convertToPlainObject } from '../utils';
import { LATEST_PRODUCTS_LIMIT } from '../constants';
import { prisma } from '@/db/prisma';

// get latest products
export async function getLatestProducts() {
    // const prisma = new PrismaClient();

    const data = await prisma.product.findMany({
        orderBy: {
            createdAt: 'desc',
        },
        take: LATEST_PRODUCTS_LIMIT,
    });

    return convertToPlainObject(data);
}

// get a product by slug
export async function getProductBySlug(slug: string) {
    // const prisma = new PrismaClient();

    return await prisma.product.findFirst({
        where: {
            slug,
        },
    });
}