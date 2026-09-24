import "server-only";
import { serviceDb } from "./db";
export async function deliverEmails() {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
    return { sent: 0, failed: 0 };
  const db = serviceDb();
  const { data: emails, error } = await db.rpc("claim_emails");
  if (error) throw error;
  let sent = 0,
    failed = 0;
  for (const mail of emails || []) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
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
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw Error("Delivery failed");
      const { error: saveError } = await db
        .from("email_outbox")
        .update({
          sent_at: new Date().toISOString(),
          locked_until: null,
          last_error: null,
        })
        .eq("id", mail.id);
      if (saveError) throw saveError;
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
  return { sent, failed };
}
