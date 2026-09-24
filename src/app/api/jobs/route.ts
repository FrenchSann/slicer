import { timingSafeEqual } from "crypto";
import { serviceDb } from "@/lib/db";
import { stripe, applySession } from "@/lib/stripe";
import { failure } from "@/lib/security";
import type Stripe from "stripe";
export async function GET(req: Request) {
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  const actual = req.headers.get("authorization") || "";
  if (
    !process.env.CRON_SECRET ||
    expected.length !== actual.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(actual))
  )
    return failure("Non autorisé", 401);
  const db = serviceDb();
  let sent = 0,
    failed = 0,
    reconciled = 0;
  const { data: pending } = await db
    .from("orders")
    .select("*")
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString())
    .limit(50);
  for (const order of pending || []) {
    try {
      const api = stripe();
      let session;
      if (order.session_id)
        session = await api.checkout.sessions.retrieve(order.session_id);
      else if (order.checkout_payload) {
        session = await api.checkout.sessions.create(
          order.checkout_payload as Stripe.Checkout.SessionCreateParams,
          { idempotencyKey: `checkout:${order.id}` },
        );
        await db
          .from("orders")
          .update({ session_id: session.id })
          .eq("id", order.id);
      } else {
        const { error } = await db.rpc("apply_checkout_event", {
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
        if (error) throw error;
        reconciled++;
        continue;
      }
      if (session.status === "open")
        session = await api.checkout.sessions.expire(session.id);
      await applySession(session, `reconcile:${session.id}:${session.status}`);
      reconciled++;
    } catch {
      failed++;
    }
  }
  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    const { data: emails, error } = await db.rpc("claim_emails");
    if (error) return failure();
    for (const mail of emails || []) {
      try {
        const result = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": mail.id,
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM,
            to: [mail.recipient],
            subject: mail.subject,
            text: mail.body,
          }),
        });
        if (!result.ok) throw Error(`HTTP ${result.status}`);
        await db
          .from("email_outbox")
          .update({
            sent_at: new Date().toISOString(),
            locked_until: null,
            last_error: null,
          })
          .eq("id", mail.id);
        sent++;
      } catch {
        await db
          .from("email_outbox")
          .update({
            locked_until: null,
            last_error: "Delivery failed",
            next_attempt_at: new Date(
              Date.now() +
                Math.min(86400000, 60000 * 2 ** Math.min(mail.attempts, 10)),
            ).toISOString(),
          })
          .eq("id", mail.id);
        failed++;
      }
    }
  }
  return Response.json({ sent, failed, reconciled });
}
