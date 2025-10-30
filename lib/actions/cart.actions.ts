"use server";

import { CartItem } from "@/types";
import { convertToPlainObject, formatError, roundNumber2 } from "../utils";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { cartItemSchema, insertCartSchema } from "../validators";
import { revalidatePath } from "next/cache";

// calculate price of the cart
const calculatePrice = (items: CartItem[]) => {
    const itemsPrice = roundNumber2(items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)),
        shippingPrice = roundNumber2(itemsPrice > 100 ? 0 : 10),
        taxPrice = roundNumber2(itemsPrice * 0.15),
        totalPrice = roundNumber2(itemsPrice + shippingPrice + taxPrice);

    return {
        itemsPrice: itemsPrice.toFixed(2),
        shippingPrice: shippingPrice.toFixed(2),
        taxPrice: taxPrice.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
    };
}

export async function addItemToCart(data: CartItem) {
    try {
        // check for cart cookie
        const sessionCartId = (await cookies()).get("sessionCartId")?.value;
        if (!sessionCartId) {
            throw new Error("Session Cart Id not found");
        }

        // get session and user ID
        const session = await auth();
        const userId = session?.user?.id ? (session.user.id as string) : undefined;

        // get cart
        const cart = await getMyCart();

        // parse and validate item
        const item = cartItemSchema.parse(data);

        // find product in database
        const product = await prisma.product.findFirst({
            where: { id: item.productId },
        });

        console.log({
            "Session Cart ID ": sessionCartId,
            "User ID ": userId,
            "Item requested ": item,
            "Product found ": product
        });


        if (!product) {
            throw new Error("Product not found");
        }

        if (!cart) {
            // create new cart
            const newCart = insertCartSchema.parse({
                userId: userId,
                items: [item],
                sessionCartId: sessionCartId,
                ...calculatePrice([item]),
            });

            console.log("new Cart: ", newCart);

            // add to database
            await prisma.cart.create({ data: newCart });

            // revalidate product page
            revalidatePath(`/product/${product.slug}`);

            return {
                success: true,
                message: `${product.name} added to cart`,
            }
        } else {
            // check if the item is already in the cart
            const existingItem = (cart.items as CartItem[]).find((i) => i.productId === item.productId);

            if (existingItem) {
                // check stock
                if (product.stock < existingItem.qty + 1) {
                    throw new Error("Item quantity is out of stock");
                }

                // increase quantity
                // existingItem.quantity = item.quantity + 1;
                (cart.items as CartItem[]).find((i) => i.productId === item.productId)!.qty = existingItem.qty + 1;
            } else {
                // add item to cart
                if (product.stock < 1) {
                    throw new Error("Item quantity is out of stock");
                }
                // add item to cart.items
                cart.items.push(item);
            }

            // save to database
            await prisma.cart.update({
                where: { id: cart.id },
                data: {
                    items: {
                        set: cart.items,
                    },
                    ...calculatePrice(cart.items as CartItem[]),
                },
            });

            // revalidate product page
            revalidatePath(`/product/${product.slug}`);

            return {
                success: true,
                message: `${product.name} ${existingItem ? "updated in" : "added to"} cart`,
            }
        }
    } catch (error) {
        return {
            success: false,
            message: formatError(error),
        }
    }
}

export async function getMyCart() {
    // check for cart cookie
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;
    if (!sessionCartId) {
        throw new Error("Session Cart Id not found");
    }

    // get session and user ID
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    // get user cart from database
    const cart = await prisma.cart.findFirst({
        where: userId ? { userId: userId } : { sessionCartId: sessionCartId },
    });

    if (!cart) { return undefined }

    // convert decimal and return
    return convertToPlainObject({
        ...cart,
        items: cart.items as CartItem[],
        itemsPrice: cart.itemsPrice.toString(),
        totalPrice: cart.totalPrice.toString(),
        shippingPrice: cart.shippingPrice.toString(),
        taxPrice: cart.taxPrice.toString(),
    });
}

export async function removeItemFromCart(productId: string) {
    try {
        // check for cart cookie
        const sessionCartId = (await cookies()).get("sessionCartId")?.value;
        if (!sessionCartId) {
            throw new Error("Session Cart Id not found");
        }
        // get product
        const product = await prisma.product.findFirst({
            where: { id: productId },
        });

        if (!product) {
            throw new Error("Product not found");
        }

        // get cart
        const cart = await getMyCart();
        if (!cart) {
            throw new Error("Cart not found");
        }

        // check for item
        const item = (cart.items as CartItem[]).find((i) => i.productId === productId);
        if (!item) {
            throw new Error("Item not found");
        }

        // check if only one item in cart
        if (item.qty === 1) {
            // remove from the cart
            cart.items = (cart.items as CartItem[]).filter((i) => i.productId !== item.productId);
        } else {
            // decrease quantity
            (cart.items as CartItem[]).find((i) => i.productId === productId)!.qty = item.qty - 1;
        }

        // update to database
        await prisma.cart.update({
            where: { id: cart.id },
            data: {
                items: cart.items,  // as Prisma.CartUpdateitemsInput[],
                ...calculatePrice(cart.items as CartItem[]),
            },
        });

        // revalidate product page
        revalidatePath(`/product/${product.slug}`);

        return {
            success: true,
            message: `${product.name} was removed from cart`,
        }
    } catch (error) {
        return {
            success: false,
            message: formatError(error),
        }
    }
}