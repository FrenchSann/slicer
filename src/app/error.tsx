"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page prose">
      <h1>
        UNE PAUSE
        <br />
        DANS LE MOUVEMENT.
      </h1>
      <p>
        Cette page est momentanément indisponible. Votre panier reste enregistré
        sur cet appareil.
      </p>
      <button className="button" onClick={reset}>
        Réessayer
      </button>
    </div>
  );
}
