# Validation — 24 septembre 2026

## Exécuté avec succès

- Build Next.js en local et build de déploiement Vercel.
- TypeScript strict sans erreur.
- 20 tests unitaires/intégration simulée : quantités et destinations, rejet des prix navigateur, consentement et anti-spam, signature webhook, refus de traiter une session non payée, jetons de suivi, origine des requêtes, e-mail accepté/refusé et réessai persistant.
- Tests SQL exécutés sur Supabase dans une transaction entièrement annulée : dernier article, refus d’une deuxième réservation, webhook répété sans double débit de stock ni double e-mail, expiration répétée, remboursement sans réapprovisionnement, refus d’achat live avant configuration.
- Audit de sécurité Supabase après migration : aucune alerte.
- Script HTTP contre Vercel : 15 pages répondent 200 ; administration affiche la connexion ; job privé renvoie 401 sans secret ; paiement de prévisualisation renvoie 409.
- Politiques RLS testées via clé anonyme : commandes, lignes, paiements, abonnés, administrateurs et e-mails non lisibles ; fonction privée de réservation non exécutable.
- Navigateur : accueil chargé, fiche produit, erreur sans taille, ajout M, passage de 1 à 2 articles / 90 EUR, refus explicite du paiement, persistance après rechargement.
- Mobile 390 px : menu ouvrant/fermant et fiche produit sans débordement horizontal.

## À terminer avec les accès externes

- Paiement Stripe SLICER de bout en bout, refus bancaire/3DS, signature reçue depuis Stripe, remboursement depuis Stripe. Les tests de signature locaux utilisent une fixture sans connexion réseau.
- Envoi Resend réel, confirmation et désinscription par e-mail reçu, livraison d’une confirmation de commande.
- Connexion d’un administrateur réel puis modification des produits et stocks dans l’interface. Aucun utilisateur fictif doté de privilèges n’a été créé.
- Activation et exécution du workflow de maintenance après configuration de la clé serveur Supabase.
- Test de concurrence avec deux connexions réelles achetant simultanément le dernier article ; le test SQL effectué vérifie les transitions et le refus de survente séquentiel, pas ce scénario réseau concurrent.
- Mesure de performance sur un téléphone physique et audit exhaustif d’accessibilité. Les comportements de repli WebGL/mouvement réduit sont implémentés ; leur inspection de code ne remplace pas un essai sur tous les appareils.

## Ouverture commerciale

La prévisualisation est en ligne, mais la vente n’est pas activée. Les stocks en production restent à zéro et non vérifiés. Les mentions légales, conditions commerciales, tailles fabricant, entretien, transporteur, frais/délais, identité et fiscalité du vendeur ne sont pas inventés. La liste des variables manquantes et la procédure d’activation figurent dans README.md.
