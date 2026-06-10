import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(8080),
    DATABASE_URL: z.string().min(1),
    // Conexion directa para migraciones. La consume `prisma.config.ts`, no el schema en Prisma 7.
    DIRECT_URL: z.string().optional(),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
    CLIENT_URL: z.string().url().default("http://localhost:5173"),
    CORS_ORIGINS: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
    PAYMENTS_SIMULATOR: z
      .enum(["true", "false"])
      .default("true")
      .transform((v) => v === "true"),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "production" && !env.DIRECT_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["DIRECT_URL"],
        message: "DIRECT_URL es requerida en produccion para prisma migrate deploy",
      });
    }

    if (!env.PAYMENTS_SIMULATOR) {
      if (!env.STRIPE_SECRET_KEY) {
        ctx.addIssue({
          code: "custom",
          path: ["STRIPE_SECRET_KEY"],
          message: "STRIPE_SECRET_KEY es requerida cuando PAYMENTS_SIMULATOR=false",
        });
      }

      if (!env.STRIPE_WEBHOOK_SECRET) {
        ctx.addIssue({
          code: "custom",
          path: ["STRIPE_WEBHOOK_SECRET"],
          message: "STRIPE_WEBHOOK_SECRET es requerida cuando PAYMENTS_SIMULATOR=false",
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variables de entorno invalidas:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
