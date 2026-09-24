import { stripe, applySession } from "@/lib/stripe";
import { serviceDb } from "@/lib/db";
import { failure } from "@/lib/security";
import type Stripe from "stripe";
import { after } from "next/server";
import { deliverEmails } from "@/lib/email";
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return failure();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      await req.text(),
      req.headers.get("stripe-signature") || "",
      secret,
    );
  } catch {
    return failure("Signature invalide.", 400);
  }
  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.expired"
    ) {
      await applySession(event.data.object, event.id);
    } else if (event.type === "charge.refunded") {
      const c = event.data.object;
      const intent =
        typeof c.payment_intent === "string"
          ? c.payment_intent
          : c.payment_intent?.id;
      if (intent) {
        const { error } = await serviceDb().rpc("record_refund", {
          p_event: event.id,
          p_intent: intent,
          p_refunded: c.amount_refunded,
        });
        if (error) throw error;
      }
    }
    after(async () => {
      try {
        await deliverEmails();
      } catch {
        console.error("email_delivery_deferred");
      }
    });
    return Response.json({ received: true });
  } catch {
    return failure("Traitement en attente de réessai.", 500);
  }
}
