import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ZodError } from "zod";
import { Prisma } from "./generated/prisma";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// convert prisma object into a regular JS object
export function convertToPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}


// format number with decimal places
export function formatNumberWithDecimal(num: number): string {
  const [int, decimal] = num.toString().split(".");
  return decimal ? `${int}.${decimal.padEnd(2, '0')}` : `${int}.00`;
}

// format errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatError(error: any) {
  // if (error.name === "ZodError") {
  //   const fieldErrors = Object.keys(error.errors).map((field) => {
  //     return error.errors[field].message;
  //   })
  //   return fieldErrors.join(". ");
  // } else if (error.name === "PrismaClientKnownRequestError" && error.code === "P2002") { 
  // } else { 
  // }
  // Use `instanceof` for better type safety

  if (error instanceof ZodError) {
    // THE FIX IS HERE:
    // 1. Use the .flatten() method on the error object.
    // 2. Access the `fieldErrors` property.
    // 3. Get all the error message arrays, flatten them into one, and join.
    const errorMessages = Object.values(error.flatten().fieldErrors)
      .flat() // [[msg1], [msg2, msg3]] -> [msg1, msg2, msg3]
      .filter(Boolean); // Remove any empty/undefined entries

    // Return the first message or a generic one if empty
    return errorMessages.length > 0
      ? errorMessages.join(". ")
      : "Validation failed with unknown errors.";

  } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    // handle Prisma error
    const field = error.meta?.target ? error.meta.target : "Field";
    return `${field} already exists`;
  } else {
    // handle other errors
    return typeof error.message === "string" ? error.message : JSON.stringify(error.message);
  }
}

// round number to two decimal places
export function roundNumber2(value: number | string) {
  if (typeof value === "number") {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  } else if (typeof value === "string") {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  } else {
    throw new Error("Value must be a number or string");
  }
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
  minimumFractionDigits: 2,
});

// format currency
export function formatCurrency(amount: number | string | null) {
  if (typeof amount === "number") {
    return CURRENCY_FORMATTER.format(amount);
  } else if (typeof amount === "string") {
    return CURRENCY_FORMATTER.format(Number(amount));
  } else {
    return "NaN";
  }
}