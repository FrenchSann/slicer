import Link from "next/link";
import { getCatalog } from "@/lib/data";
import { money } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export const metadata = { title: "La collection" };
export default async function Collection() {
  const products = await getCatalog();
  return (
    <div className="page">
      <span className="eyebrow">SLICER / NO-GI</span>
      <h1>LA COLLECTION.</h1>
      {products.map((p) => (
        <Link
          key={p.id}
          className="product-feature"
          href={`/produit/${p.slug}`}
        >
          <div className="feature-image">
            <img
              src={p.images?.[0]?.url || "/images/front.webp"}
              alt={p.images?.[0]?.alt || "Concept face BLOOM FLOW 02"}
              width="900"
              height="1024"
            />
          </div>
          <div className="feature-image">
            <img
              src={p.images?.[1]?.url || "/images/back.webp"}
              alt={p.images?.[1]?.alt || "Concept dos BLOOM FLOW 02"}
              width="900"
              height="1052"
            />
          </div>
          <div className="feature-info">
            <div>
              <h3>{p.name}</h3>
              <p>Rashguard no-gi · S—XL · Visuels conceptuels</p>
            </div>
            <span>{money(p.variants[0]?.price || 4500)} TTC ↗</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
