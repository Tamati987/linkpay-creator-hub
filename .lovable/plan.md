## Objectif

Permettre à chaque vendeur de recevoir l'argent de ses ventes **directement sur son propre compte bancaire**, via Stripe Connect Express. La plateforme prélève automatiquement **5% de commission** sur chaque vente.

## Comment ça marche pour le vendeur

1. Depuis son dashboard, le vendeur clique sur "Connecter mon compte de paiement"
2. Il est redirigé vers un formulaire Stripe (5–10 min : email, infos perso, IBAN/RIB)
3. Une fois validé, un badge "Paiements activés ✓" s'affiche dans son dashboard
4. À chaque vente : l'acheteur paie 10$ → 0.50$ va à la plateforme (5%) + frais Stripe (~0.59$) → ~8.91$ arrivent directement sur son compte Stripe, puis virement automatique vers sa banque (généralement sous 2–7 jours)
5. Il peut consulter ses ventes/virements via un bouton "Mon compte Stripe" (Express Dashboard)

**Important** : Tant qu'un vendeur n'a pas connecté son compte Stripe, le bouton "Acheter" sur ses produits sera désactivé (avec un message au vendeur). Sinon l'argent irait sur ton compte sans moyen propre de le reverser.

## Changements techniques

### 1. Base de données (migration)
Ajouter sur `profiles` :
- `stripe_connect_account_id` (text, nullable) — ID du compte Connect du vendeur
- `stripe_connect_charges_enabled` (boolean, défaut false) — peut-il recevoir des paiements
- `stripe_connect_payouts_enabled` (boolean, défaut false) — peut-il recevoir des virements
- Protéger ces colonnes dans `protect_profile_billing_columns` (service_role only)

### 2. Nouvelles server functions (`src/lib/stripe-connect.functions.ts`)
- `createConnectAccount` — crée un `stripe.accounts.create({ type: "express" })` si pas existant, stocke l'ID
- `createConnectOnboardingLink` — génère un `accountLinks.create` pour l'onboarding, retourne l'URL
- `createConnectLoginLink` — génère un `loginLinks.create` pour que le vendeur accède à son dashboard Express
- `getConnectStatus` — récupère le statut (charges_enabled, payouts_enabled) et sync en DB

### 3. Modifier `createProductCheckout` (`src/lib/stripe.functions.ts`)
- Lire `stripe_connect_account_id` + `stripe_connect_charges_enabled` du vendeur
- Si non connecté/non activé → erreur "Le vendeur n'a pas encore activé les paiements"
- Ajouter à la session : `payment_intent_data: { application_fee_amount: Math.round(price * 0.05), transfer_data: { destination: seller_account_id } }`

### 4. Webhook (`stripe-webhook.ts`)
Ajouter le handler `account.updated` pour synchroniser `charges_enabled` / `payouts_enabled` quand le vendeur termine/met à jour son onboarding.

### 5. UI Dashboard (`src/routes/dashboard.tsx`)
Nouvelle section "Paiements" :
- Si pas de compte connecté → bouton "Activer les paiements" (lance l'onboarding)
- Si onboarding en cours / incomplet → bouton "Compléter mon inscription"
- Si activé → badge vert "Paiements activés" + bouton "Mon compte Stripe" (login link) + rappel "Commission 5% par vente"

### 6. UI Produit (`src/components/ProductCard.tsx`)
Si le vendeur n'a pas activé Connect, désactiver le bouton "Acheter" avec un message discret type "Paiements bientôt disponibles".

## Détails financiers (exemple sur vente 10$)

```text
Acheteur paie               10.00 $
- Frais Stripe (~2.9%+0.30) -0.59 $
- Commission plateforme 5%  -0.50 $  → vers ton compte
─────────────────────────────────
Vendeur reçoit               8.91 $  → sur son compte bancaire
```

Les frais Stripe sont à la charge du vendeur par défaut (configurable plus tard si besoin).

## Pré-requis côté Stripe Dashboard

Avant le premier vendeur, tu devras (une seule fois) :
1. Activer **Stripe Connect** sur ton compte Stripe (gratuit, demande quelques infos sur ta plateforme)
2. Configurer le branding Connect (logo, couleur) dans Settings → Connect

Je te guiderai au moment où ce sera nécessaire.

## Hors scope (pour plus tard si tu veux)

- Reverser une partie de la commission au vendeur
- Permettre au vendeur de choisir qui paie les frais Stripe
- Système de remboursements depuis l'app
- Multi-devises (actuellement USD uniquement)
