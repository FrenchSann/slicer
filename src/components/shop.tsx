"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  Cross1Icon,
  HamburgerMenuIcon,
  PlusIcon,
  MinusIcon,
} from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "motion/react";
import { money, product, Product } from "@/lib/catalog";
type Item = {
  id: string;
  size: string;
  quantity: number;
  price: number;
  name: string;
};
const ShopContext = createContext<{
  items: Item[];
  add: (item: Item) => void;
  change: (id: string, q: number) => void;
  open: () => void;
}>({ items: [], add: () => {}, change: () => {}, open: () => {} });
export function ShopProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [ready, setReady] = useState(false);
  const [opened, setOpened] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("slicer-cart") || "[]");
      if (Array.isArray(saved))
        setItems(
          saved
            .filter(
              (i) =>
                i &&
                typeof i.id === "string" &&
                typeof i.size === "string" &&
                typeof i.name === "string" &&
                Number.isInteger(i.quantity) &&
                i.quantity > 0 &&
                i.quantity <= 10 &&
                Number.isInteger(i.price) &&
                i.price > 0,
            )
            .slice(0, 20),
        );
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("slicer-cart", JSON.stringify(items));
  }, [items, ready]);
  useEffect(() => {
    if (opened) {
      dialog.current?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.current?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [opened]);
  const change = (id: string, q: number) =>
    setItems((old) =>
      old
        .map((i) => (i.id === id ? { ...i, quantity: Math.min(10, q) } : i))
        .filter((i) => i.quantity > 0),
    );
  return (
    <ShopContext.Provider
      value={{
        items,
        change,
        open: () => setOpened(true),
        add: (item) => {
          setItems((old) => {
            const found = old.find((i) => i.id === item.id);
            return found
              ? old.map((i) =>
                  i.id === item.id
                    ? {
                        ...i,
                        quantity: Math.min(10, i.quantity + item.quantity),
                      }
                    : i,
                )
              : [...old, item];
          });
          setOpened(true);
        },
      }}
    >
      {children}
      <dialog
        ref={dialog}
        className="cart-dialog"
        onCancel={() => setOpened(false)}
        onClick={(e) => {
          if (e.target === dialog.current) setOpened(false);
        }}
      >
        <div className="drawer-head">
          <span className="eyebrow">VOTRE SÉLECTION</span>
          <button
            aria-label="Fermer le panier"
            onClick={() => setOpened(false)}
          >
            <Cross1Icon />
          </button>
        </div>
        <h2>LE PANIER.</h2>
        <CartContents onNavigate={() => setOpened(false)} />
      </dialog>
    </ShopContext.Provider>
  );
}
export function Header() {
  const { items, open } = useContext(ShopContext);
  const [menu, setMenu] = useState(false);
  return (
    <>
      <div className="announcement">
        BLOOM FLOW 02 <span>—</span> UNE NOUVELLE EXPRESSION DU NO-GI
      </div>
      <header className="header">
        <Link href="/" className="logo" aria-label="SLICER accueil">
          SLICER<span>®</span>
        </Link>
        <nav
          aria-label="Navigation principale"
          className={menu ? "nav is-open" : "nav"}
        >
          <Link onClick={() => setMenu(false)} href="/collection">
            Collection <span>01</span>
          </Link>
          <Link onClick={() => setMenu(false)} href="/la-marque">
            La marque
          </Link>
          <Link onClick={() => setMenu(false)} href="/guide-des-tailles">
            Guide des tailles
          </Link>
        </nav>
        <div className="header-actions">
          <button onClick={open} className="bag">
            PANIER <span>({items.reduce((n, i) => n + i.quantity, 0)})</span>
          </button>
          <button
            aria-label="Menu"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
            className="menu-toggle"
          >
            {menu ? <Cross1Icon /> : <HamburgerMenuIcon />}
          </button>
        </div>
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <Link href="/" className="logo">
          SLICER<span>®</span>
        </Link>
        <p>
          LA PRÉCISION EN MOUVEMENT.
          <br />
          Vêtements de grappling no-gi.
        </p>
        <div>
          <Link href="/contact">Contact</Link>
          <Link href="/livraison-retours">Livraison & retours</Link>
          <Link href="/suivi">Suivre ma commande</Link>
        </div>
        <div>
          <Link href="/guide-des-tailles">Guide des tailles</Link>
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/conditions-de-vente">Conditions de vente</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} SLICER</span>
        <span>CONÇU POUR LE MOUVEMENT.</span>
        <Link href="/admin">Administration</Link>
      </div>
    </footer>
  );
}
export function Purchase({
  data = product,
  preview = true,
}: {
  data?: Product;
  preview?: boolean;
}) {
  const { add } = useContext(ShopContext);
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const selected = data.variants.find((v) => v.size === size);
  const available =
    preview ||
    !selected ||
    (selected.preorder
      ? selected.preorder_limit - selected.preorder_reserved
      : selected.stock - selected.reserved) > 0;
  return (
    <div className="purchase">
      <div className="product-price">
        {money(selected?.price ?? data.variants[0]?.price ?? 4500)}{" "}
        <span>TTC</span>
      </div>
      <div className="size-title">
        <label id="size-label">Choisir une taille</label>
        <Link href="/guide-des-tailles">Guide des tailles ↗</Link>
      </div>
      <div className="sizes" role="group" aria-labelledby="size-label">
        {data.variants.map((v) => (
          <button
            key={v.id}
            aria-pressed={size === v.size}
            onClick={() => {
              setSize(v.size);
              setError("");
            }}
          >
            {v.size}
          </button>
        ))}
      </div>
      <div className="purchase-status">
        {preview
          ? "Collection en préparation · ouverture des ventes à venir"
          : selected
            ? available
              ? selected.preorder
                ? "Précommande"
                : "Disponible"
              : "Rupture de stock"
            : "Sélectionnez votre taille"}
      </div>
      <div className="buy-row">
        <label className="quantity-label">
          Quantité
          <input
            aria-label="Quantité"
            type="number"
            min="1"
            max="10"
            value={quantity}
            onChange={(e) =>
              setQuantity(
                Math.max(1, Math.min(10, Number(e.target.value) || 1)),
              )
            }
          />
        </label>
        <button
          className="button"
          disabled={!available}
          onClick={() => {
            if (!selected) {
              setError("Choisissez votre taille avant d’ajouter le rashguard.");
              return;
            }
            add({
              id: selected.id,
              size,
              quantity,
              price: selected.price,
              name: data.name,
            });
          }}
        >
          Ajouter au panier <PlusIcon />
        </button>
      </div>
      <p aria-live="polite" className="form-message">
        {error}
      </p>
      <p className="small">
        Blanc / rouge · Manches courtes
        <br />
        {data.composition}
      </p>
    </div>
  );
}
export function CartContents({ onNavigate }: { onNavigate?: () => void }) {
  const { items, change } = useContext(ShopContext);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [country, setCountry] = useState("FR");
  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ id, quantity }) => ({ id, quantity })),
          country,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error || "Le paiement est indisponible.");
      window.location.assign(data.url);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <>
      {!items.length ? (
        <div className="empty">
          <p>Votre prochain mouvement commence ici.</p>
          <Link href="/collection" className="button" onClick={onNavigate}>
            Découvrir la collection <ArrowRightIcon />
          </Link>
        </div>
      ) : (
        <>
          <AnimatePresence initial={false}>
            {items.map((i) => (
              <motion.div
                layout
                exit={{ opacity: 0 }}
                key={i.id}
                className="cart-item"
              >
                <img
                  src="/images/front.webp"
                  alt="Concept du rashguard"
                  width="94"
                  height="112"
                />
                <div>
                  <h3>{i.name}</h3>
                  <p className="small">Taille {i.size} · Blanc / rouge</p>
                  <div className="counter">
                    <button
                      aria-label={`Diminuer ${i.size}`}
                      onClick={() => change(i.id, i.quantity - 1)}
                    >
                      <MinusIcon />
                    </button>
                    <span>{i.quantity}</span>
                    <button
                      aria-label={`Augmenter ${i.size}`}
                      onClick={() => change(i.id, i.quantity + 1)}
                    >
                      <PlusIcon />
                    </button>
                    <button className="remove" onClick={() => change(i.id, 0)}>
                      Retirer
                    </button>
                  </div>
                </div>
                <span>{money(i.price * i.quantity)}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="subtotal">
            <span>Sous-total estimé</span>
            <strong>
              {money(items.reduce((n, i) => n + i.price * i.quantity, 0))}
            </strong>
          </div>
          <p className="small">
            Prix et disponibilité vérifiés au paiement. Livraison calculée selon
            la destination.
          </p>
          <label className="field">
            Pays de livraison
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {Object.entries({
                FR: "France",
                BE: "Belgique",
                DE: "Allemagne",
                AT: "Autriche",
                BG: "Bulgarie",
                HR: "Croatie",
                CY: "Chypre",
                CZ: "Tchéquie",
                DK: "Danemark",
                EE: "Estonie",
                ES: "Espagne",
                FI: "Finlande",
                GR: "Grèce",
                HU: "Hongrie",
                IE: "Irlande",
                IT: "Italie",
                LT: "Lituanie",
                LU: "Luxembourg",
                LV: "Lettonie",
                MT: "Malte",
                NL: "Pays-Bas",
                PL: "Pologne",
                PT: "Portugal",
                RO: "Roumanie",
                SE: "Suède",
                SI: "Slovénie",
                SK: "Slovaquie",
              }).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <button className="button full" disabled={busy} onClick={checkout}>
            {busy ? "Préparation du paiement…" : "Passer au paiement"}
            <ArrowRightIcon />
          </button>
          <p role="status" className="form-message">
            {error}
          </p>
        </>
      )}
    </>
  );
}
export function Gallery({images}:{images?:Product['images']}) {
  const media=images?.length?images:[{url:'/images/front.webp',alt:'Concept face',position:0},{url:'/images/back.webp',alt:'Concept dos',position:1},{url:'/images/detail.webp',alt:'Concept détail',position:2}];
  const [current, setCurrent] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <div className="gallery">
      <button
        className="gallery-main"
        aria-label="Agrandir le visuel conceptuel"
        onClick={() => dialog.current?.showModal()}
      >
        <img
          src={media[current].url}
          alt={media[current].alt}
          width="750"
          height="900"
        />
        <span>AGRANDIR +</span>
      </button>
      <div className="gallery-thumbs">
        {media.map((v, i) => (
          <button
            key={v.url}
            aria-pressed={current === i}
            onClick={() => setCurrent(i)}
          >
            <img
              src={v.url}
              alt={v.alt}
              width="90"
              height="100"
            />
            <span>
              0{i + 1} / VUE
            </span>
          </button>
        ))}
      </div>
      <p className="small">Visuels conceptuels de la collection.</p>
      <dialog className="zoom-dialog" ref={dialog}>
        <button
          className="zoom-close"
          onClick={() => dialog.current?.close()}
          aria-label="Fermer le zoom"
        >
          <Cross1Icon />
        </button>
        <img src={media[current].url} alt={media[current].alt} />
      </dialog>
    </div>
  );
}
export function Signup() {
  return (
    <section className="signup">
      <div>
        <span className="eyebrow">LE MOUVEMENT CONTINUE</span>
        <h2>
          NE MANQUEZ PAS
          <br />
          LA SUITE.
        </h2>
      </div>
      <PublicForm kind="newsletter" />
    </section>
  );
}
export function PublicForm({ kind }: { kind: "newsletter" | "contact" }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        const form = e.currentTarget;
        const values = Object.fromEntries(new FormData(form));
        try {
          const res = await fetch(`/api/${kind}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });
          const data = await res.json();
          if (!res.ok) throw Error(data.error);
          setMessage(data.message);
          form.reset();
        } catch (e) {
          setMessage((e as Error).message || "Réessayez plus tard.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        Votre adresse e-mail
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="vous@exemple.fr"
          maxLength={254}
        />
      </label>
      {kind === "contact" && (
        <label className="field">
          Votre message
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={3000}
            rows={5}
          />
        </label>
      )}
      <label className="honeypot" aria-hidden="true">
        Site
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      {kind === "newsletter" && (
        <label className="consent">
          <input type="checkbox" name="consent" required />
          J’accepte de recevoir les prochains drops SLICER par e-mail.
          Désinscription à tout moment.
        </label>
      )}
      <button className="button" disabled={busy}>
        {busy
          ? "Envoi…"
          : kind === "newsletter"
            ? "Me tenir au courant"
            : "Envoyer le message"}
        <ArrowRightIcon />
      </button>
      <p role="status" className="form-message">
        {message}
      </p>
      <Link className="small" href="/confidentialite">
        Utilisation de vos données
      </Link>
    </form>
  );
}
