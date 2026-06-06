
# Redesign de la page publique `/$username` au style "Luna Ray"

Tu veux que la page publique de chaque créateur ressemble à l'interface du téléphone dans le visuel pub : fond noir profond, halo violet/rose néon, avatar avec anneau gradient, cartes de liens sombres avec icônes de marque colorées, sections "À la une" pour vidéos et produits.

## Changements visuels

### Fond & ambiance
- Fond noir profond (`#0a0010` → `#000`) avec un **halo radial violet/rose** centré derrière le contenu (effet "spotlight" comme la pub).
- Suppression du fond clair actuel sur cette page uniquement (le dashboard reste inchangé).
- Léger reflet/gradient en bas de page.

### En-tête profil
- Avatar circulaire avec **anneau gradient rose→violet** lumineux (glow), badge vérifié violet à côté du nom si `is_pro`.
- Nom en blanc, gras, taille augmentée.
- Bio centrée, plus claire.
- Bouton "..." discret en haut à droite (menu partage).

### Rangée d'icônes sociales
- Icônes sociales en ligne (Instagram, TikTok, YouTube, X, Email) **sans cercle de fond**, juste l'icône blanche/colorée sur fond transparent, alignée horizontalement sous la bio (comme la maquette).

### Cartes de liens
- Cartes sombres semi-transparentes (`bg-white/5`, `border-white/10`, `backdrop-blur`), coins arrondis 14px.
- Icône de marque à gauche (carré arrondi coloré : rouge YouTube, dégradé Insta, noir TikTok…), titre + sous-titre (`@handle` ou description courte), chevron `>` à droite.
- Bouton CTA principal (ex: "Réserver un appel") avec petit accent étoile violette ✨.

### Section "À la une" (vidéos)
- Petit titre `À la une` aligné à gauche en blanc.
- Carte vidéo plus grande avec thumbnail, overlay play, indicateurs de pagination (•••) en bas.

### Section Produits digitaux (Pro)
- Carte produit horizontale : image carrée à gauche, titre + description courte + prix en violet à droite, style sombre cohérent.

### Footer
- Logo "✦ zeno" en bas centré avec glow violet (au lieu du texte actuel "Propulsé par Zeno").

## Détails techniques

- Modifier uniquement `src/routes/$username.tsx` (page publique) + créer un wrapper `<div>` qui force le fond sombre indépendamment du thème global.
- Mettre à jour `src/components/ProductCard.tsx` pour le style sombre.
- Ajouter quelques tokens dans `src/styles.css` : `--zeno-glow`, `--zeno-bg-dark`, gradient anneau avatar.
- Aucun changement de logique métier ni de schéma BDD.
- Le dashboard, la landing et les autres pages restent inchangés.

## Hors scope
- Pas de changement des données affichées (mêmes liens/produits/vidéos).
- Pas de nouveau champ "badge vérifié" en BDD : on affiche le badge automatiquement si `is_pro = true`.
- Pas de modification du dashboard d'édition.

Veux-tu que je garde aussi le bouton "Partager" et "Dashboard" actuels (repositionnés en haut à droite façon menu "..."), ou bien je les remplace par un vrai menu déroulant ?
