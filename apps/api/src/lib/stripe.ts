import Stripe from "stripe";
import { env } from "../config/env.js";

let _stripe: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY no está configurada en las variables de entorno");
  }
  if (!_stripe) {
    _stripe = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return _stripe;
};
