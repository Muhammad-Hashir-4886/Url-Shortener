import {z, ZodError} from "zod";

export const env = z.object({
    PORT: z.coerce.number().min(1).max(65535).int().default(3000),
    DATABASE_URL: z.string()
}).parse(process.env);