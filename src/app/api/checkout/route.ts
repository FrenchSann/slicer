import { randomBytes } from "crypto";
import { checkoutSchema } from "@/lib/validation";
import { assertOrigin, failure, hash, orderToken, rate } from "@/lib/security";
import { serviceDb } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
export async function POST(req: Request) {
  if (!["test", "live"].includes(process.env.COMMERCE_MODE || ""))
    return failure(
      "Les ventes ne sont pas encore ouvertes. Votre sélection reste dans le panier.",
      409,
    );
  try {
    if (
      !process.env.TOKEN_SECRET ||
      !process.env.NEXT_PUBLIC_SITE_URL ||
      !process.env.STRIPE_WEBHOOK_SECRET
    )
      return failure("Le paiement est en cours de configuration.");
    assertOrigin(req);
    await rate(req, "checkout", 8);
    const parsed = checkoutSchema.safeParse(await req.json());
    if (!parsed.success)
      return failure("Vérifiez votre panier et votre destination.", 400);
    const api = stripe();
    const db = serviceDb();
    const mode = process.env.COMMERCE_MODE!;
    const { data: id, error } = await db.rpc("reserve_order", {
      p_items: parsed.data.items,
      p_country: parsed.data.country,
      p_hash: hash(randomBytes(32).toString("hex")),
      p_mode: mode,
    });
    if (error)
      return failure(
        "Cette sélection est indisponible ou les ventes ne sont pas ouvertes.",
        409,
      );
    const token = orderToken(id);
    const { data: order, error: readError } = await db
      .from("orders")
      .select("*,order_lines(*)")
      .eq("id", id)
      .single();
    if (readError) throw readError;
    const base = process.env.NEXT_PUBLIC_SITE_URL!;
    const payload: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      shipping_address_collection: { allowed_countries: [parsed.data.country] },
      billing_address_collection: "required",
      line_items: order.order_lines.map(
        (line: {
          quantity: number;
          name: string;
          size: string;
          unit_price: number;
        }) => ({
          quantity: line.quantity,
          price_data: {
            currency: "eur",
            unit_amount: line.unit_price,
            tax_behavior: "inclusive",
            product_data: {
              name: `${line.name} — ${line.size}`,
              description: "Rashguard blanc / rouge",
            },
          },
        }),
      ),
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: order.shipping, currency: "eur" },
            display_name: mode === "test" ? "Livraison de test" : "Livraison",
          },
        },
      ],
      metadata: { order_id: id },
      payment_intent_data: { metadata: { order_id: id } },
      success_url: `${base}/confirmation`,
      cancel_url: `${base}/paiement-annule`,
      expires_at: Math.floor(Date.now() / 1000) + 1800,
    };
    const { error: saveError } = await db
      .from("orders")
      .update({
        token_hash: hash(token),
        checkout_payload: payload,
        expires_at: new Date(payload.expires_at! * 1000).toISOString(),
      })
      .eq("id", id);
    if (saveError) throw saveError;
    const session = await api.checkout.sessions.create(payload, {
      idempotencyKey: `checkout:${id}`,
    });
    const { error: bindError } = await db
      .from("orders")
      .update({ session_id: session.id })
      .eq("id", id);
    if (bindError) throw bindError;
    return Response.json({ url: session.url });
  } catch {
    return failure("Impossible de préparer le paiement. Réessayez plus tard.");
  }
}
