# SLICER — BLOOM FLOW 02

Boutique Next.js / TypeScript, rose procédurale React Three Fiber, Supabase et Stripe Checkout.

- Site : https://slicer-navy.vercel.app

Le déploiement est une prévisualisation fonctionnelle : `COMMERCE_MODE=preview`. Le paiement affiche une indisponibilité explicite. Les prix sont réels (45 EUR TTC) ; aucun stock estimé n’est publié. Le stock initial de la base est zéro, à vérifier par taille avant ouverture. Les médias fournis sont des visuels conceptuels.

## Démarrage

Node.js 22 ou 24 et npm. Les versions sont figées dans package-lock.json.

```sh
npm ci
cp .env.example .env.local
npm run dev -- --port 3174
```

Renseigner `NEXT_PUBLIC_SITE_URL=http://localhost:3174` et les deux variables publiques Supabase pour consulter le vrai catalogue. Sans Supabase, le catalogue conceptuel local utilise les informations confirmées par le propriétaire.

```sh
npm run typecheck
npm test
npm run build
node scripts/check-public.mjs
```

Le dernier script teste le déploiement public en prévisualisation et les politiques anonymes de la base. Il ne crée pas de commande. `TEST_BASE_URL` permet de viser un autre déploiement. Il attend volontairement un refus de paiement (409) : ne pas le lancer inchangé contre une boutique ouverte.

## Configuration restante

| Variable / élément | État et rôle |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Configurées en production Vercel. Clé publique protégée par RLS. |
| `NEXT_PUBLIC_SITE_URL` | Configurée sur l’URL Vercel. À modifier avec un futur domaine. |
| `TOKEN_SECRET`, `CRON_SECRET` | Générés aléatoirement et configurés côté serveur Vercel, jamais dans Git. |
| `SUPABASE_SERVICE_ROLE_KEY` | À ajouter dans Vercel et dans l’environnement local privé pour commandes, formulaires et tâches serveur. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | À fournir depuis le compte SLICER dédié, d’abord en test. |
| `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_EMAIL` | À fournir avec un domaine d’envoi vérifié. Formulaires fermés tant que leur intégration manque. |
| Administrateur | Créer/inviter un utilisateur réel via Supabase Auth, puis autoriser son UUID comme indiqué ci-dessous. |
| Informations commerciales | Identité du vendeur, immatriculation, fiscalité, documents légaux, tarifs/délais et retours définitifs, inventaire exact et mesures fabricant. |

Ne jamais préfixer les secrets avec `NEXT_PUBLIC_`. Ne pas envoyer de secrets par chat ou les committer. Configurer aussi les variables pour les environnements Preview/Development si nécessaires, avec des ressources de test séparées.

## Administration

L’interface `/admin` utilise Supabase Auth (mot de passe), des cookies SSR et une autorisation serveur pour chaque action. Un compte Supabase Auth seul ne donne aucun droit administrateur. Après invitation de l’utilisateur réel, exécuter dans SQL Editor avec son UUID :

```sql
insert into public.administrators(user_id) values ('UUID_DE_L_UTILISATEUR');
```

Les formulaires permettent de créer/modifier les produits, gérer les variantes, vérifier les stocks, activer la précommande, importer/ordonner des images, consulter les commandes et la newsletter, renseigner les expéditions et révoquer un lien de suivi. Les images sont décodées, redimensionnées, converties en WebP et débarrassées de leurs métadonnées. Taille maximale : 5 Mo, 25 mégapixels avant traitement.

Les documents juridiques sont des emplacements préparatoires éditables. La base refuse l’activation commerciale sans les contenus définitifs et les validations associées. Les mesures de tailles et consignes d’entretien ne sont pas inventées : elles restent à fournir.

## Paiement et stock

1. Créer un environnement Stripe **SLICER test** et renseigner ses clés privées.
2. Utiliser une base de test isolée ; appliquer les migrations dans l’ordre et, seulement dans cette base, `supabase/seed-test.sql` (S 10, M 15, L 15, XL 10).
3. Définir `COMMERCE_MODE=test`. Les tarifs de livraison de test sont explicitement fictifs (5 EUR si aucun tarif n’existe).
4. Déclarer le webhook `/api/stripe/webhook` pour `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`. Reporter le secret de signature.
5. Effectuer des paiements test réussis/refusés, répéter les événements et vérifier les stocks, paiements et e-mails. Une page de succès seule ne valide jamais un paiement.
6. Avant le mode réel : configurer l’inventaire vérifié, les tarifs EU, les documents commerciaux et la fiscalité, puis activer `live_enabled` dans l’admin et `COMMERCE_MODE=live` avec les clés live SLICER. Redéployer.

Les montants sont en centimes EUR, recalculés côté serveur. `reserve_order` verrouille les variantes dans un ordre stable, regroupe les lignes et réserve atomiquement. Les commandes conservent les noms, tailles, prix et quantités. Les précommandes ont leur propre capacité. Les réservations s’alignent sur les sessions Stripe d’environ 30 minutes. Les remboursements ne remettent pas un article en stock sans vérification physique.

Le webhook signé applique paiement, stock, événement unique et mise en file d’e-mail dans une seule transaction. Les événements répétés sont inoffensifs. Les erreurs Stripe ambiguës conservent la réservation jusqu’à réconciliation. Le job recherche la session par métadonnée dans sa fenêtre de création avant de libérer un achat dont la réponse Stripe a été perdue.

## E-mails et tâches de reprise

Les e-mails partent après la réponse HTTP via `after()`, depuis une file persistante avec verrou de traitement et clé d’idempotence. L’échec d’un e-mail n’annule pas une commande payée. `/api/jobs` réconcilie les sessions expirées et relance les envois en échec. Il exige `Authorization: Bearer <CRON_SECRET>`.

Un workflow GitHub horaire est fourni, désactivé tant que la variable de dépôt `COMMERCE_JOBS_ENABLED` n’est pas `true`. Le secret de dépôt `SLICER_CRON_SECRET` est déjà configuré. **Après ajout de la clé serveur Supabase et validation du job**, activer la variable puis lancer une exécution manuelle du workflow. Les webhooks restent le mécanisme principal de libération des stocks ; le workflow est une reprise de secours. Contrôler les compteurs `failed` retournés et les exécutions GitHub.

La newsletter conserve le consentement, demande une confirmation par e-mail et propose une désinscription via formulaire explicite. Un simple GET sur un lien d’e-mail ne modifie pas l’abonnement. Les formulaires utilisent un honeypot et une limitation PostgreSQL des requêtes. Supabase Auth assure aussi ses propres limites de connexion.

## Déploiement et Git

Le dépôt est connecté à Vercel. Chaque jalon a été committé et poussé ; les premiers jalons ont été regroupés dans le premier push après connexion de GitHub CLI. CI : installation reproductible, TypeScript, tests puis build. Un push sur `main` déclenche le déploiement Vercel ; les branches permettent les prévisualisations.

```sh
git add .
git commit -m "Description du jalon"
git push
```

Les migrations sont versionnées et ont été appliquées au projet SLICER. Les types Supabase sont enregistrés dans `src/lib/database.types.ts`. Pour un autre projet, régénérer ces types et changer les variables d’environnement. Ne pas rejouer manuellement les migrations déjà appliquées.

## Vérifications et limites

Voir `VALIDATION.md` pour les résultats réellement exécutés et les essais qui nécessitent encore les accès Stripe, serveur Supabase et e-mail. Aucun paiement réel n’a été effectué. Aucun compte administrateur fictif n’a été créé. L’indexation est désactivée dans les métadonnées tant que la boutique reste en prévisualisation.

## Références et ressources

- Next.js : https://nextjs.org/docs/app/getting-started/installation et documentation livrée avec la version installée.
- Supabase Auth SSR : https://supabase.com/docs/guides/auth/server-side ; RLS : https://supabase.com/docs/guides/database/postgres/row-level-security.
- Stripe Checkout : https://docs.stripe.com/checkout/fulfillment ; stocks : https://docs.stripe.com/payments/checkout/managing-limited-inventory.
- Ressources et licences détaillées : `ASSETS.md`.
