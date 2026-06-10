import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

process.env["NODE_ENV"] = "test";

// Stripe test stubs — no se conectan a Stripe real
if (!process.env["STRIPE_SECRET_KEY"]) {
  process.env["STRIPE_SECRET_KEY"] = "sk_test_stub_not_real";
}
if (!process.env["STRIPE_WEBHOOK_SECRET"]) {
  process.env["STRIPE_WEBHOOK_SECRET"] = "whsec_test_stub_not_real_xxxxxxxxxxxxxxxxxx";
}
