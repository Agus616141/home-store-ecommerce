import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import Stripe from "stripe";
import app from "../../../app.js";
import { prisma } from "../../../lib/prisma.js";

const USER_EMAIL = "integration_payments_user@homestore.test";
const PASSWORD = "SecurePassword123!";

let userToken = "";
let orderId = "";
let productId = "";

async function cleanup() {
  await prisma.stripeEvent.deleteMany({ where: { id: { startsWith: "evt_test_" } } });
  await prisma.stripeEvent.deleteMany({ where: { id: { startsWith: "sim_evt_" } } });
  await prisma.order.deleteMany({ where: { user: { email: USER_EMAIL } } });
  await prisma.product.deleteMany({
    where: {
      slug: { in: ["test-pay-prod-sofa", "test-pay-sim-lamp", "test-pay-concurrent-chair"] },
    },
  });
  await prisma.user.deleteMany({ where: { email: USER_EMAIL } });
}

beforeAll(async () => {
  await cleanup();

  const bcrypt = await import("bcrypt");
  const jwt = await import("jsonwebtoken");
  const hash = await bcrypt.default.hash(PASSWORD, 10);

  const user = await prisma.user.create({
    data: { email: USER_EMAIL, passwordHash: hash, firstName: "Pay", lastName: "User" },
  });
  userToken = jwt.default.sign(
    { id: user.id, role: user.role },
    process.env["JWT_ACCESS_SECRET"]!,
    { expiresIn: "15m" },
  );

  const product = await prisma.product.create({
    data: { name: "Sofá Test", slug: "test-pay-prod-sofa", priceCents: 8000000, stock: 5 },
  });
  productId = product.id;

  // Poner item en carrito y crear orden
  await request(app)
    .post("/api/cart/items")
    .set({ Authorization: `Bearer ${userToken}` })
    .send({ productId, quantity: 1 });

  const orderRes = await request(app)
    .post("/api/orders")
    .set({ Authorization: `Bearer ${userToken}` })
    .send({});

  orderId = orderRes.body.data.order.id as string;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

const auth = () => ({ Authorization: `Bearer ${userToken}` });

// ─── POST /api/payments/checkout ─────────────────────────────────────────────

describe("POST /api/payments/checkout", () => {
  it("devuelve 400 con orderId faltante (validación Zod, sin llamar a Stripe)", async () => {
    const res = await request(app).post("/api/payments/checkout").set(auth()).send({});
    expect(res.status).toBe(400);
  });

  it("devuelve 401 sin token", async () => {
    const res = await request(app).post("/api/payments/checkout").send({ orderId });
    expect(res.status).toBe(401);
  });

  it("devuelve 404 con orderId inexistente (sin llamar a Stripe)", async () => {
    const res = await request(app)
      .post("/api/payments/checkout")
      .set(auth())
      .send({ orderId: "nonexistent-order-id" });
    expect(res.status).toBe(404);
  });
});

// ─── Estado intermedio: orden creada, pago aún no confirmado ──────────────────
// Invariante del fix (sesión 008): crear la orden NO descuenta stock ni vacía el
// carrito. Eso ocurre recién en el webhook checkout.session.completed.

describe("Estado pre-webhook (orden PENDING)", () => {
  it("la orden está PENDING sin tocar stock ni carrito", async () => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.status).toBe("PENDING");
    expect(order?.paymentStatus).toBe("PENDING");

    // Stock intacto (el producto se creó con stock 5)
    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.stock).toBe(5);

    // Carrito conservado con su item
    const cart = await prisma.cart.findFirst({
      where: { user: { email: USER_EMAIL } },
      include: { items: true },
    });
    expect(cart).not.toBeNull();
    expect(cart?.items.length).toBe(1);
  });
});

// ─── POST /api/payments/webhook ───────────────────────────────────────────────

describe("POST /api/payments/webhook", () => {
  it("devuelve 400 si falta stripe-signature header", async () => {
    const res = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .send(Buffer.from(JSON.stringify({ type: "test" })));

    expect(res.status).toBe(400);
  });

  it("devuelve 400 con firma inválida", async () => {
    const res = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", "t=123,v1=invalida")
      .send(Buffer.from(JSON.stringify({ type: "test" })));

    expect(res.status).toBe(400);
  });

  it("recibe el body como Buffer (raw body correctamente configurado)", async () => {
    // El hecho de que devuelva 400 por firma inválida (y no 500 por JSON parse error)
    // confirma que el raw body middleware está funcionando correctamente
    const res = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", "t=fake,v1=fake")
      .send(Buffer.from('{"id":"evt_test_raw","type":"ping"}'));

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Firma");
  });

  it("confirma la orden y elimina el carrito vacÃ­o al recibir checkout.session.completed", async () => {
    const payload = JSON.stringify({
      id: "evt_test_checkout_completed_cart_cleanup",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_cart_cleanup",
          metadata: { orderId },
          payment_intent: "pi_test_cart_cleanup",
        },
      },
    });

    const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"]!);
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env["STRIPE_WEBHOOK_SECRET"]!,
    });

    const res = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", signature)
      .send(payload);

    expect(res.status).toBe(200);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.paymentStatus).toBe("PAID");
    expect(order?.status).toBe("CONFIRMED");
    expect(order?.stripeSessionId).toBe("cs_test_cart_cleanup");
    expect(order?.stripePaymentIntentId).toBe("pi_test_cart_cleanup");

    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.stock).toBe(4);

    const cart = await prisma.cart.findFirst({ where: { user: { email: USER_EMAIL } } });
    expect(cart).toBeNull();

    const event = await prisma.stripeEvent.findUnique({
      where: { id: "evt_test_checkout_completed_cart_cleanup" },
    });
    expect(event).not.toBeNull();
  });
});

describe("POST /api/payments/webhook idempotente concurrente", () => {
  it("procesa dos entregas simultaneas del mismo evento una sola vez", async () => {
    const product = await prisma.product.create({
      data: {
        name: "Silla Concurrente",
        slug: "test-pay-concurrent-chair",
        priceCents: 2500000,
        stock: 5,
      },
    });

    await request(app)
      .post("/api/cart/items")
      .set(auth())
      .send({ productId: product.id, quantity: 2 });

    const orderRes = await request(app).post("/api/orders").set(auth()).send({});
    const concurrentOrderId = orderRes.body.data.order.id as string;

    const payload = JSON.stringify({
      id: "evt_test_checkout_concurrent",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_concurrent",
          metadata: { orderId: concurrentOrderId },
          payment_intent: "pi_test_concurrent",
        },
      },
    });

    const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"]!);
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env["STRIPE_WEBHOOK_SECRET"]!,
    });

    const sendWebhook = () =>
      request(app)
        .post("/api/payments/webhook")
        .set("Content-Type", "application/json")
        .set("stripe-signature", signature)
        .send(payload);

    const [first, second] = await Promise.all([sendWebhook(), sendWebhook()]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const order = await prisma.order.findUnique({ where: { id: concurrentOrderId } });
    expect(order?.paymentStatus).toBe("PAID");
    expect(order?.status).toBe("CONFIRMED");

    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct?.stock).toBe(3);

    const eventCount = await prisma.stripeEvent.count({
      where: { id: "evt_test_checkout_concurrent" },
    });
    expect(eventCount).toBe(1);
  });
});

// ─── POST /api/payments/checkout (modo simulador) ─────────────────────────────
// Con PAYMENTS_SIMULATOR=true (default), checkout confirma el pago al instante:
// descuenta stock, vacía el carrito y devuelve la URL interna de éxito. Es el
// flujo activo mientras no se use Stripe real.

describe("POST /api/payments/checkout (modo simulador)", () => {
  let simOrderId = "";
  let simProductId = "";

  beforeAll(async () => {
    const product = await prisma.product.create({
      data: { name: "Lámpara Sim", slug: "test-pay-sim-lamp", priceCents: 1500000, stock: 3 },
    });
    simProductId = product.id;

    await request(app)
      .post("/api/cart/items")
      .set(auth())
      .send({ productId: simProductId, quantity: 2 });

    const orderRes = await request(app).post("/api/orders").set(auth()).send({});
    simOrderId = orderRes.body.data.order.id as string;
  });

  it("confirma el pago al instante: PAID, descuenta stock y vacía el carrito", async () => {
    const res = await request(app)
      .post("/api/payments/checkout")
      .set(auth())
      .send({ orderId: simOrderId });

    expect(res.status).toBe(200);
    expect(res.body.data.checkoutUrl).toContain(`/orders/${simOrderId}/success`);

    const order = await prisma.order.findUnique({ where: { id: simOrderId } });
    expect(order?.paymentStatus).toBe("PAID");
    expect(order?.status).toBe("CONFIRMED");
    expect(order?.stripeSessionId).toBe(`sim_sess_${simOrderId}`);

    // Stock descontado: 3 - 2 = 1
    const product = await prisma.product.findUnique({ where: { id: simProductId } });
    expect(product?.stock).toBe(1);

    // Carrito del backend vaciado
    const cart = await prisma.cart.findFirst({ where: { user: { email: USER_EMAIL } } });
    expect(cart).toBeNull();

    // Evento sintético registrado (auditoría + idempotencia)
    const event = await prisma.stripeEvent.findUnique({ where: { id: `sim_evt_${simOrderId}` } });
    expect(event).not.toBeNull();
  });

  it("rechaza re-pago de una orden ya pagada (409)", async () => {
    const res = await request(app)
      .post("/api/payments/checkout")
      .set(auth())
      .send({ orderId: simOrderId });

    expect(res.status).toBe(409);
  });
});
