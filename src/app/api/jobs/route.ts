import { timingSafeEqual } from "crypto";
import type Stripe from "stripe";
import { serviceDb } from "@/lib/db";
import { stripe, applySession } from "@/lib/stripe";
import { failure } from "@/lib/security";
import { deliverEmails } from "@/lib/email";
export async function GET(req: Request) {
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET}`);
  const actual = Buffer.from(req.headers.get("authorization") || "");
  if (
    !process.env.CRON_SECRET ||
    expected.length !== actual.length ||
    !timingSafeEqual(expected, actual)
  )
    return failure("Non autorisé", 401);
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return failure("Configuration du service requise.");
  const db = serviceDb();
  let failed = 0,
    reconciled = 0;
  const { data: pending, error } = await db
    .from("orders")
    .select("*")
    .eq("status", "pending")
    .eq("mode", process.env.COMMERCE_MODE === "live" ? "live" : "test")
    .lt("expires_at", new Date().toISOString())
    .limit(10);
  if (error) return failure();
  for (const order of pending || []) {
    try {
      let session: Stripe.Checkout.Session | undefined;
      if (order.session_id) {
        session = await stripe().checkout.sessions.retrieve(order.session_id);
      } else if (order.checkout_payload) {
        // Exhaust the bounded creation window: an unknown Stripe response must not
        // release inventory before checking whether the payment actually succeeded.
        const api = stripe();
        for await (const candidate of api.checkout.sessions.list({
          created: {
            gte: Math.floor(new Date(order.created_at).getTime() / 1000) - 60,
            lte: Math.ceil(new Date(order.expires_at).getTime() / 1000),
          },
          limit: 100,
        })) {
          if (candidate.metadata?.order_id === order.id) {
            session = candidate;
            break;
          }
        }
        if (session) {
          const { error: bindError } = await db
            .from("orders")
            .update({ session_id: session.id })
            .eq("id", order.id);
          if (bindError) throw bindError;
        }
      }
      if (!session) {
        const { error: releaseError } = await db.rpc("apply_checkout_event", {
          p_event: `orphan:${order.id}`,
          p_order: order.id,
          p_session: `none:${order.id}`,
          p_kind: "expired",
          p_amount: 0,
          p_currency: "eur",
          p_email: "",
          p_intent: "",
          p_address: {},
          p_mail: "",
        });
        if (releaseError) throw releaseError;
        reconciled++;
        continue;
      }
      if (session.status === "open")
        session = await stripe().checkout.sessions.expire(session.id);
      await applySession(session, `reconcile:${session.id}:${session.status}`);
      reconciled++;
    } catch {
      failed++;
      console.error("order_reconciliation_deferred", { orderId: order.id });
    }
  }
  try {
    const mail = await deliverEmails();
    return Response.json(
      { sent: mail.sent, failed: failed + mail.failed, reconciled },
      { status: failed + mail.failed ? 207 : 200 },
    );
  } catch {
    return failure("Réessai des e-mails nécessaire.", 500);
  }
}
