import { serviceDb } from "@/lib/db";
import { hash } from "@/lib/security";
import { notFound, redirect } from "next/navigation";
export default async function NewsletterAction({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ action?: string; done?: string }>;
}) {
  const { token } = await params;
  const { action, done } = await searchParams;
  if (!/^[a-f0-9]{64}$/.test(token)) notFound();
  const unsubscribe = action === "unsubscribe";
  async function submit() {
    "use server";
    const db = serviceDb();
    const { data, error } = await db
      .from("newsletter")
      .update({
        status: unsubscribe ? "unsubscribed" : "subscribed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("token_hash", hash(token))
      .select("id")
      .single();
    if (error || !data) throw Error("Lien invalide");
    redirect(
      `/newsletter/${token}?action=${unsubscribe ? "unsubscribe" : "confirm"}&done=1`,
    );
  }
  return (
    <div className="page prose">
      <h1>{unsubscribe ? "À BIENTÔT." : "REJOIGNEZ LE MOUVEMENT."}</h1>
      {done ? (
        <p>Votre choix a été enregistré.</p>
      ) : (
        <form action={submit}>
          <p>
            {unsubscribe
              ? "Confirmez votre désinscription aux e-mails SLICER."
              : "Confirmez votre inscription aux prochains drops SLICER."}
          </p>
          <button className="button">
            {unsubscribe ? "Me désinscrire" : "Confirmer mon inscription"}
          </button>
        </form>
      )}
    </div>
  );
}
