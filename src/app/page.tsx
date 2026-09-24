import Link from "next/link";
import Image from "next/image";
import HeroScene from "@/components/hero-scene";
import { Signup } from "@/components/shop";
import { ArrowRightIcon, ArrowDownIcon } from "@radix-ui/react-icons";
import { getProduct } from "@/lib/data";
import { money } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function Home() {
  const data = await getProduct();
  const price = data?.variants[0]?.price;
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="red-dot" /> BLOOM FLOW 02 / NO-GI COLLECTION
          </div>
          <h1>
            LA PRÉCISION
            <br />
            EN <em>MOUVEMENT.</em>
          </h1>
          <p>
            La douceur d’une rose.
            <br />
            L’intensité du grappling.
            <br />
            Une autre expression du no-gi.
          </p>
          <Link className="button" href="/produit/bloom-flow-02">
            Découvrir le rashguard <ArrowRightIcon />
          </Link>
          <div className="hero-note">
            <span>01 — COLLECTION</span>
            <span>
              {price
                ? `${money(price)} TTC / S—XL`
                : "COLLECTION EN PRÉPARATION"}
            </span>
          </div>
        </div>
        <div className="hero-art">
          <span className="oversized-bloom">BLOOM</span>
          <HeroScene />
          <div className="hero-product">
            <Image
              src="/images/front.webp"
              alt="Concept face du rashguard BLOOM FLOW 02 blanc et rouge"
              width={900}
              height={1024}
              priority
              sizes="(max-width: 768px) 92vw, 48vw"
            />
          </div>
          <span className="vertical-label">FORM / FLOW / FEEL</span>
          <div className="art-caption">
            <span>FIG. 02 — BLOOM FLOW</span>
            <span>VISUEL CONCEPTUEL</span>
          </div>
        </div>
        <a href="#collection" className="hero-scroll">
          <ArrowDownIcon /> EXPLORER LE MOUVEMENT
        </a>
      </section>
      <div className="manifesto-strip">
        <span>NO-GI. NO LIMITS OF EXPRESSION.</span>
        <span>LA FORCE A PLUSIEURS FORMES.</span>
        <span>SLICER / BLOOM FLOW 02</span>
      </div>
      <section className="collection-section" id="collection">
        <div className="section-heading">
          <div>
            <span className="eyebrow">01 / LA COLLECTION</span>
            <h2>
              PRENEZ
              <br />
              <em>VOTRE PLACE.</em>
            </h2>
          </div>
          <p>
            Une seule pièce. Une intention claire.
            <br />
            Le mouvement comme point de départ.
          </p>
        </div>
        <Link className="product-feature" href="/produit/bloom-flow-02">
          <div className="feature-image">
            <Image
              src="/images/front.webp"
              alt="Rashguard concept — face"
              width={900}
              height={1024}
              sizes="(max-width:768px) 90vw, 45vw"
            />
            <span>01 / FACE</span>
          </div>
          <div className="feature-image back">
            <Image
              src="/images/back.webp"
              alt="Rashguard concept — dos"
              width={900}
              height={1052}
              sizes="(max-width:768px) 90vw, 45vw"
            />
            <span>02 / DOS</span>
          </div>
          <div className="feature-info">
            <div>
              <h3>BLOOM FLOW 02</h3>
              <p>Rashguard manches courtes · Blanc / rouge</p>
            </div>
            <span>
              {price ? `${money(price)} TTC` : "Découvrir"} <ArrowRightIcon />
            </span>
          </div>
        </Link>
      </section>
      <section className="story">
        <div className="story-image">
          <Image
            src="/images/detail.webp"
            alt="Détail conceptuel de la rose et de la trame du rashguard"
            width={840}
            height={840}
            sizes="(max-width:768px) 100vw, 50vw"
          />
          <span>LE DÉTAIL FAIT LE MOUVEMENT.</span>
        </div>
        <div className="story-copy">
          <span className="eyebrow">02 / L’INTENTION</span>
          <h2>
            LA FORCE.
            <br />
            SOUS UNE
            <br />
            <em>AUTRE FORME.</em>
          </h2>
          <p>
            La rose pour la sensibilité. Les lignes pour le mouvement. La trame
            pour la transition.
          </p>
          <p>
            BLOOM FLOW fait se rencontrer l’organique et la précision. Une
            identité qui se porte avant de s’expliquer.
          </p>
          <Link className="text-link" href="/la-marque">
            Entrer dans l’univers SLICER <ArrowRightIcon />
          </Link>
          <div className="dot-pattern" />
        </div>
      </section>
      <section className="details-strip">
        <div>
          <span>01</span>
          <h3>LA COUPE</h3>
          <p>
            Ajustée. Manches courtes.
            <br />
            Une silhouette pour le no-gi.
          </p>
        </div>
        <div>
          <span>02</span>
          <h3>LA MATIÈRE</h3>
          <p>
            80 % polyester.
            <br />
            20 % élasthanne.
          </p>
        </div>
        <div>
          <span>03</span>
          <h3>VOTRE TAILLE</h3>
          <p>
            Du S au XL.
            <br />
            <Link href="/guide-des-tailles">Consulter le guide ↗</Link>
          </p>
        </div>
      </section>
      <Signup />
    </>
  );
}
