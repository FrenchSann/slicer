import "server-only";
import Stripe from "stripe";
import { serviceDb } from "./db";
import { orderToken } from "./security";
export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw Error("Stripe non configuré");
  if (
    process.env.COMMERCE_MODE !== "live" &&
    !key.startsWith("sk_test_") &&
    !key.startsWith("rk_test_")
  )
    throw Error("Test key required");
  return new Stripe(key, { maxNetworkRetries: 2 });
}
export async function applySession(
  session: Stripe.Checkout.Session,
  eventId: string,
) {
  const oid = session.metadata?.order_id;
  if (!oid) throw Error("Order missing");
  const paid = session.payment_status === "paid";
  if (!paid && session.status !== "expired") return;
  const intent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  const token = orderToken(oid);
  const email = session.customer_details?.email || session.customer_email;
  const db = serviceDb();
  const { data: o, error: readError } = await db
    .from("orders")
    .select("mode,country,session_id")
    .eq("id", oid)
    .single();
  if (readError || !o) throw Error("Unknown order");
  if ((o.mode === "live") !== session.livemode) throw Error("Mode mismatch");
  if (paid && (!email || !intent)) throw Error("Payment incomplete");
  const address = session.collected_information?.shipping_details?.address;
  if (paid && address?.country !== o.country) throw Error("Country mismatch");
  const { error } = await db.rpc("apply_checkout_event", {
    p_event: eventId,
    p_order: oid,
    p_session: session.id,
    p_kind: paid ? "paid" : "expired",
    p_amount: session.amount_total || 0,
    p_currency: session.currency || "eur",
    p_email: email || "",
    p_intent: intent || "",
    p_address: address || {},
    p_mail: `Merci pour votre commande SLICER.\nTotal : ${((session.amount_total || 0) / 100).toFixed(2)} EUR.\nSuivi sécurisé : ${process.env.NEXT_PUBLIC_SITE_URL}/suivi/${token}`,
  });
  if (error) throw error;
}
