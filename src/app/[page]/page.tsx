import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicForm } from "@/components/shop";
import { getSettings } from "@/lib/data";
const titles: Record<string, string> = {
  "la-marque": "LA FORCE AUTREMENT.",
  "guide-des-tailles": "TROUVEZ VOTRE ÉQUILIBRE.",
  contact: "PARLONS MOUVEMENT.",
  "livraison-retours": "LIVRAISON & RETOURS.",
  "mentions-legales": "MENTIONS LÉGALES.",
  confidentialite: "VOS DONNÉES.",
  "conditions-de-vente": "CONDITIONS DE VENTE.",
  "paiement-annule": "LE MOUVEMENT ATTEND.",
  confirmation: "VOTRE COMMANDE.",
  suivi: "SUIVRE LE MOUVEMENT.",
};
export const dynamic = "force-dynamic";
export default async function Info({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  if (!titles[page]) notFound();
  const s = await getSettings();
  return (
    <div className="page prose">
      <span className="eyebrow">SLICER / BLOOM FLOW 02</span>
      <h1>{titles[page]}</h1>
      {page === "la-marque" ? (
        <>
          <p>
            SLICER explore la rencontre entre la précision du grappling et la
            liberté d’expression du vêtement.
          </p>
          <h2>LA ROSE. LE MOUVEMENT. LA TRAME.</h2>
          <p>
            BLOOM FLOW 02 part d’une rose rouge, dont les pétales traversent une
            silhouette blanche. Les courbes accompagnent la composition. Les
            points organisent sa transition.
          </p>
          <p>
            Notre première pièce : un rashguard ajusté à manches courtes. Une
            identité précise pour le no-gi.
          </p>
          <Link className="text-link" href="/collection">
            Découvrir la collection ↗
          </Link>
        </>
      ) : page === "guide-des-tailles" ? (
        <>
          <p>
            Le rashguard BLOOM FLOW 02 est proposé en S, M, L et XL, avec une
            coupe ajustée.
          </p>
          <h2>COMMENT PRENDRE VOS MESURES</h2>
          <ul>
            <li>
              Tour de poitrine : passez un mètre souple au point le plus large,
              sans serrer.
            </li>
            <li>Tour de taille : mesurez à votre taille naturelle.</li>
            <li>
              Comparez également un rashguard qui vous convient, posé à plat.
            </li>
          </ul>
          <div className="notice">
            Le tableau de mesures du fabricant est en attente. Nous ne publions
            pas de correspondances approximatives.
          </div>
        </>
      ) : page === "contact" ? (
        <>
          <p>
            Une question sur la collection ou votre commande ? Écrivez-nous.
          </p>
          <PublicForm kind="contact" />
        </>
      ) : page === "livraison-retours" ? (
        <>
          <p>
            La boutique est destinée aux livraisons dans l’Union européenne.
          </p>
          <h2>LIVRAISON</h2>
          <p>
            {s?.shipping_copy ||
              "Les tarifs, le transporteur et les délais opérationnels seront publiés avant l’ouverture des ventes."}
          </p>
          <h2>RETOURS</h2>
          <p>
            {s?.returns_copy ||
              "La procédure et l’adresse de retour seront communiquées avant l’ouverture des ventes. Les ventes restent désactivées tant que ces informations ne sont pas finalisées."}
          </p>
        </>
      ) : page === "paiement-annule" ? (
        <>
          <p>
            Le paiement n’a pas été finalisé. Votre panier est conservé. Si
            votre banque affiche une opération, vérifiez son état via le suivi
            sécurisé avant de réessayer.
          </p>
          <Link href="/panier" className="button">
            Retrouver mon panier ↗
          </Link>
        </>
      ) : page === "confirmation" ? (
        <>
          <p>
            Nous vérifions la confirmation du paiement. Cette page ne constitue
            pas une preuve de paiement.
          </p>
          <p>
            Le suivi sécurisé est accessible via le lien de confirmation
            transmis par e-mail après validation. En cas de retard,
            contactez-nous.
          </p>
          <Link href="/suivi" className="text-link">
            Suivre ma commande ↗
          </Link>
        </>
      ) : page === "suivi" ? (
        <>
          <p>
            Utilisez le lien sécurisé reçu dans votre e-mail de confirmation. Il
            permet de consulter le paiement et l’expédition sans créer de
            compte.
          </p>
          <p>
            Pour protéger vos données, un numéro de commande seul ne permet pas
            d’accéder à votre commande.
          </p>
          <Link href="/contact" className="text-link">
            Besoin d’aide ↗
          </Link>
        </>
      ) : s?.legal_verified &&
        (page === "mentions-legales"
          ? s.legal_copy
          : page === "confidentialite"
            ? s.privacy_copy
            : s.terms_copy) ? (
        <div style={{ whiteSpace: "pre-wrap" }}>
          {page === "mentions-legales"
            ? s.legal_copy
            : page === "confidentialite"
              ? s.privacy_copy
              : s.terms_copy}
        </div>
      ) : (
        <>
          <div className="notice">
            Document préparatoire. Ouverture des ventes conditionnée à la
            finalisation des informations du vendeur.
          </div>
          {page === "mentions-legales" ? (
            <>
              <h2>ÉDITEUR</h2>
              <p>
                {s?.seller_name ||
                  "Identité juridique du vendeur à renseigner."}
              </p>
              <p>
                {s?.seller_address ||
                  "Adresse professionnelle et immatriculation à renseigner."}
              </p>
              <h2>HÉBERGEMENT</h2>
              <p>
                Application prévue sur Vercel. Base de données et stockage
                Supabase, région Paris.
              </p>
            </>
          ) : page === "confidentialite" ? (
            <>
              <p>
                La boutique utilise les données nécessaires au traitement des
                commandes, aux demandes de contact et aux inscriptions
                explicitement consenties à la newsletter.
              </p>
              <h2>VOS CHOIX</h2>
              <p>
                Le panier est mémorisé sur votre appareil. Aucun traceur
                publicitaire n’est activé. La newsletter est facultative et
                indépendante de l’achat.
              </p>
              <p>
                Le responsable de traitement, les durées de conservation et le
                contact pour exercer vos droits seront précisés avant ouverture.
              </p>
            </>
          ) : (
            <>
              <p>
                Les prix sont exprimés en euros TTC. Les frais de livraison sont
                indiqués avant paiement. Le paiement est prévu via Stripe
                Checkout.
              </p>
              <p>
                Les conditions définitives préciseront l’identité du vendeur,
                les modalités de livraison, de rétractation, les garanties et la
                médiation applicables avant toute vente réelle.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
