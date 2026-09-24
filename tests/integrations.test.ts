import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import Stripe from "stripe";
const { rpc, update, eq } = vi.hoisted(() => ({
  rpc: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
}));
vi.mock("../src/lib/db", () => ({
  serviceDb: () => ({ rpc, from: () => ({ update }) }),
}));
import { deliverEmails } from "../src/lib/email";
import { applySession } from "../src/lib/stripe";
import { hash, orderToken, assertOrigin } from "../src/lib/security";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("RESEND_API_KEY", "test_fixture");
  vi.stubEnv("EMAIL_FROM", "test@example.invalid");
  vi.stubEnv("TOKEN_SECRET", "fixture-only-secret");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://slicer.example");
  update.mockReturnValue({ eq });
  eq.mockResolvedValue({ error: null });
  rpc.mockResolvedValue({
    data: [
      {
        id: "mail-fixture",
        recipient: "test@example.invalid",
        subject: "test",
        body: "test",
        attempts: 1,
      },
    ],
    error: null,
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Email delivery and retry", () => {
  it("keeps failed mail unsent and schedules retry", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );
    expect(await deliverEmails()).toEqual({ sent: 0, failed: 1 });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        last_error: "Delivery failed",
        locked_until: null,
        next_attempt_at: expect.any(String),
      }),
    );
    expect(update.mock.calls[0][0]).not.toHaveProperty("sent_at");
  });
  it("marks sent only after provider acceptance", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    expect(await deliverEmails()).toEqual({ sent: 1, failed: 0 });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ sent_at: expect.any(String) }),
    );
    expect(fetch).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        headers: expect.objectContaining({ "Idempotency-Key": "mail-fixture" }),
      }),
    );
  });
  it("does not claim email without a provider", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect(await deliverEmails()).toEqual({ sent: 0, failed: 0 });
    expect(rpc).not.toHaveBeenCalled();
  });
});
describe("Payment and token security", () => {
  it("does not fulfill an unpaid checkout redirect", async () => {
    await applySession(
      {
        metadata: { order_id: "fixture" },
        payment_status: "unpaid",
        status: "open",
      } as unknown as Stripe.Checkout.Session,
      "event",
    );
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects forged webhook signatures", () => {
    const stripe = new Stripe("sk_test_fixture");
    const payload = JSON.stringify({ id: "evt_fixture", object: "event" });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: "whsec_fixture",
    });
    expect(() =>
      stripe.webhooks.constructEvent(payload, signature, "wrong"),
    ).toThrow();
    expect(
      stripe.webhooks.constructEvent(payload, signature, "whsec_fixture").id,
    ).toBe("evt_fixture");
  });
  it("uses a secret-derived opaque token and one-way stored hash", () => {
    const token = orderToken("order-fixture");
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(hash(token)).not.toBe(token);
    vi.stubEnv("TOKEN_SECRET", "another-secret");
    expect(orderToken("order-fixture")).not.toBe(token);
  });
  it("rejects cross-origin mutation", () =>
    expect(() =>
      assertOrigin(
        new Request("https://slicer.example/api/checkout", {
          headers: { origin: "https://other.example" },
        }),
      ),
    ).toThrow());
});
