import { serviceDb } from "@/lib/db";
import { assertOrigin, rate, failure } from "@/lib/security";
import { contactSchema } from "@/lib/validation";
import { after } from "next/server";
import { deliverEmails } from "@/lib/email";
export async function POST(req: Request) {
  if (
    !process.env.CONTACT_EMAIL ||
    !process.env.RESEND_API_KEY ||
    !process.env.EMAIL_FROM
  )
    return failure(
      "Le formulaire de contact sera disponible à l’ouverture de la boutique.",
    );
  try {
    assertOrigin(req);
    await rate(req, "contact", 4);
    const parsed = contactSchema.safeParse(await req.json());
    if (!parsed.success)
      return failure(
        "Vérifiez votre adresse et votre message (10 caractères minimum).",
        400,
      );
    const db = serviceDb();
    const { data, error } = await db
      .from("contact_messages")
      .insert({ email: parsed.data.email, message: parsed.data.message })
      .select("id")
      .single();
    if (error) throw error;
    const { error: mailError } = await db.from("email_outbox").insert({
      dedupe_key: `contact:${data.id}`,
      recipient: process.env.CONTACT_EMAIL,
      subject: "SLICER — nouveau message",
      body: `De : ${parsed.data.email}\n\n${parsed.data.message}`,
    });
    if (mailError) throw mailError;
    after(async () => {
      try {
        await deliverEmails();
      } catch {
        console.error("email_delivery_deferred");
      }
    });
    return Response.json({
      message: "Votre message est enregistré. Merci de nous avoir écrit.",
    });
  } catch {
    return failure();
  }
}
