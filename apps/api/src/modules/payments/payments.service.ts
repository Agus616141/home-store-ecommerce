import { getStripe } from "../../lib/stripe.js";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { appError } from "../../lib/errors.js";
import { markOrderPaid, emitOrderStockChanges } from "../orders/orders.service.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { CreateCheckoutDto } from "./payments.schema.js";
import type Stripe from "stripe";

const isUniqueConstraintError = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === "P2002";

export const createCheckoutSession = async (userId: string, data: CreateCheckoutDto) => {
  const order = await prisma.order.findFirst({
    where: { id: data.orderId, userId },
    include: { items: true },
  });

  if (!order) throw appError(404, "Orden no encontrada");
  if (order.paymentStatus !== "PENDING")
    throw appError(409, "La orden ya fue pagada o esta en proceso");
  if (order.items.length === 0) throw appError(400, "La orden no tiene items");

  if (env.PAYMENTS_SIMULATOR) {
    const sessionId = `sim_sess_${order.id}`;
    const paymentIntentId = `sim_pi_${order.id}`;
    const eventId = `sim_evt_${order.id}`;

    await prisma.$transaction(async (tx) => {
      await markOrderPaid(tx, order.id, sessionId, paymentIntentId);
      await tx.stripeEvent.upsert({
        where: { id: eventId },
        create: {
          id: eventId,
          type: "checkout.session.completed",
          payload: { simulated: true, orderId: order.id },
        },
        update: {},
      });
    });

    await emitOrderStockChanges(order.id);

    return { checkoutUrl: `/orders/${order.id}/success?simulated=1` };
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: order.items.map((item) => ({
      price_data: {
        currency: "ars",
        unit_amount: item.unitPriceCents,
        product_data: { name: item.productName },
      },
      quantity: item.quantity,
    })),
    metadata: { orderId: order.id },
    success_url: `${env.CLIENT_URL}/orders/${order.id}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.CLIENT_URL}/orders/${order.id}`,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: session.id },
  });

  return { checkoutUrl: session.url };
};

export const handleWebhookEvent = async (rawBody: Buffer, signature: string) => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw appError(500, "STRIPE_WEBHOOK_SECRET no configurado");
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw appError(400, "Firma del webhook invalida");
  }

  const payload = JSON.parse(JSON.stringify(event)) as Prisma.InputJsonValue;
  let orderIdToNotify: string | undefined;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.stripeEvent.create({
        data: {
          id: event.id,
          type: event.type,
          payload,
        },
      });

      if (event.type !== "checkout.session.completed") return;

      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      const pi = session.payment_intent;
      if (!orderId || !pi) return;

      const paymentIntentId = typeof pi === "string" ? pi : pi.id;
      await markOrderPaid(tx, orderId, session.id, paymentIntentId);
      orderIdToNotify = orderId;
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) return;
    throw error;
  }

  if (orderIdToNotify) {
    await emitOrderStockChanges(orderIdToNotify);
  }
};
