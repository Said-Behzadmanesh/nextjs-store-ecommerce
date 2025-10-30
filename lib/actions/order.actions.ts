"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { convertToPlainObject, formatError } from "../utils";
import { auth } from "@/auth";
import { getMyCart } from "./cart.actions";
import { getUserById } from "./user.actions";
import { insertOrderSchema } from "../validators";
import { prisma } from "@/db/prisma";
import { CartItem } from "@/types";

// create order and create the order items
export async function createOrder() {
    try {
        const session = await auth();
        if (!session) {
            throw new Error("User not authenticated");
        }

        const cart = await getMyCart();
        const userId = session?.user?.id;

        if (!userId) {
            throw new Error("User not found");
        }

        const user = await getUserById(userId);

        if (!cart || cart.items.length === 0) {
            return {
                success: false,
                message: "Cart is empty", redirectTo: "/cart"
            }
        }

        if (!user.address) {
            return {
                success: false,
                message: "No shipping address", redirectTo: "/shipping-address"
            }
        }

        if (!user.paymentMethod) {
            return {
                success: false,
                message: "No payment method", redirectTo: "/payment-method"
            }
        }

        // create order object
        const order = insertOrderSchema.parse({
            userId: user.id,
            shippingAddress: user.address,
            paymentMethod: user.paymentMethod,
            itemsPrice: cart.itemsPrice,
            shippingPrice: cart.shippingPrice,
            taxPrice: cart.taxPrice,
            totalPrice: cart.totalPrice,
        });

        // create a transaction to create the order and the order items in db
        const insertedOrderId = await prisma.$transaction(async (tx) => {
            // create order
            const createdOrder = await tx.order.create({ data: order });

            // create order items from cart items
            for (const item of cart.items as CartItem[]) {
                await tx.orderItem.create({
                    data: {
                        ...item,
                        price: item.price,
                        orderId: createdOrder.id,
                    }
                });
            }

            // clear cart
            await tx.cart.update({ where: { id: cart.id }, data: { items: [], itemsPrice: 0, shippingPrice: 0, taxPrice: 0, totalPrice: 0 } });

            return createdOrder.id;
        });

        if (!insertedOrderId) {
            throw new Error("Order not created");
        }

        return {
            success: true,
            message: "Order created successfully",
            redirectTo: `/order/${insertedOrderId}`,
        };
    } catch (error) {
        if (isRedirectError(error)) {
            throw error;
        }

        return {
            success: false,
            message: formatError(error),
        }
    }
}

// get order by id
export async function getOrderById(orderId: string) {
    const order = await prisma.order.findFirst({
        where: {
            id: orderId
        },
        include: {
            orderitems: true,
            user: { select: { name: true, email: true } }
        }
    });

    return convertToPlainObject(order);
}