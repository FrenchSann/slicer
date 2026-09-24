import { randomBytes } from "crypto";
import { newsletterSchema } from "@/lib/validation";
import { serviceDb } from "@/lib/db";
import { assertOrigin, rate, hash, failure } from "@/lib/security";
export async function POST(req: Request) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
    return failure("Les inscriptions ouvriront prochainement.");
  try {
    assertOrigin(req);
    await rate(req, "newsletter", 4);
    const parsed = newsletterSchema.safeParse(await req.json());
    if (!parsed.success)
      return failure(
        "Une adresse valide et votre consentement sont nécessaires.",
        400,
      );
    const token = randomBytes(32).toString("hex");
    const email = parsed.data.email.toLowerCase();
    const db = serviceDb();
    const { data: existing } = await db
      .from("newsletter")
      .select("status")
      .eq("email", email)
      .single();
    if (existing?.status === "subscribed")
      return Response.json({
        message: "Si nécessaire, un e-mail de confirmation vous sera envoyé.",
      });
    const { error } = await db
      .from("newsletter")
      .upsert(
        {
          email,
          status: "pending",
          token_hash: hash(token),
          consent_text:
            "Je souhaite recevoir les prochains drops SLICER par e-mail. Version 1.",
          consent_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      );
    if (error) throw error;
    const { error: mailError } = await db
      .from("email_outbox")
      .insert({
        dedupe_key: `newsletter:${hash(token)}`,
        recipient: email,
        subject: "Confirmez votre inscription SLICER",
        body: `Confirmez votre inscription : ${process.env.NEXT_PUBLIC_SITE_URL}/newsletter/${token}\nDésinscription : ${process.env.NEXT_PUBLIC_SITE_URL}/newsletter/${token}?action=unsubscribe`,
      });
    if (mailError) throw mailError;
    return Response.json({
      message:
        "Votre demande est enregistrée. Confirmez votre inscription depuis l’e-mail à venir.",
    });
  } catch {
    return failure();
  }
}
