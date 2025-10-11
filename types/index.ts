import { insertProductSchema } from "@/lib/validators";
import z from "zod";

export type Product = z.infer<typeof insertProductSchema> & {
    id: number;
    rating: number;
    createdAt: Date;
}