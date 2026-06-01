## Objectif
Mettre en place un abonnement mensuel Pro via Stripe (le prix `STRIPE_PRO_PRICE_ID` est déjà configuré).

## Ce qui existe déjà
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID` (secrets)
- Table `profiles` avec `is_pro`, `stripe_customer_id`, `stripe_subscription_id`
- Authentification utilisateur

## Étapes

1. **Server function `create-checkout`** (`src/lib/stripe-checkout.functions.ts`)
   - Protégée par `requireSupabaseAuth`
   - Crée/retrouve le customer Stripe par email
   - Crée une Checkout Session en mode `subscription` avec `STRIPE_PRO_PRICE_ID`
   - Retourne l'URL de checkout

2. **Server function `check-subscription`** (`src/lib/stripe-subscription.functions.ts`)
   - Protégée par `requireSupabaseAuth`
   - Interroge Stripe pour vérifier l'abonnement actif
   - Met à jour `profiles.is_pro`, `stripe_customer_id`, `stripe_subscription_id`
   - Retourne `{ subscribed, subscription_end }`

3. **Server function `customer-portal`** (`src/lib/stripe-portal.functions.ts`)
   - Ouvre le Stripe Customer Portal pour gérer/annuler l'abonnement

4. **Webhook Stripe** (`src/routes/api/public/stripe-webhook.ts` — vérifier s'il existe déjà)
   - Vérifie la signature avec `STRIPE_WEBHOOK_SECRET`
   - Gère `customer.subscription.created/updated/deleted` et `checkout.session.completed`
   - Met à jour `profiles.is_pro` en conséquence

5. **UI**
   - Bouton "Passer Pro" (ouvre checkout dans un nouvel onglet)
   - Affichage du statut Pro dans le profil
   - Bouton "Gérer mon abonnement" (portal) si abonné
   - Auto-refresh du statut au login et après retour du checkout

## Questions avant de coder
- Prix mensuel de l'abonnement Pro ? (le `STRIPE_PRO_PRICE_ID` existe — je peux le récupérer depuis Stripe pour confirmer)
- Un seul tier "Pro" ou plusieurs niveaux (Basic/Pro/Premium) ?
- Quels avantages débloque "Pro" dans l'app (à protéger côté UI/serveur) ?
