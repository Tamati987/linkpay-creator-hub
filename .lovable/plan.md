## Problème

Le lecteur Twitch ne s'affiche pas pour deux raisons :

1. **URLs de chaînes live non gérées** : `detectVideo()` reconnaît uniquement `twitch.tv/videos/<id>` (VOD) et `clips.twitch.tv/<id>` (clips). Les URLs de chaînes comme `twitch.tv/<chaîne>` sont classées comme « social » et n'ont donc jamais de lecteur.
2. **Paramètre `parent` insuffisant** : Twitch exige que `parent=` corresponde **exactement** au domaine qui affiche l'iframe. Dans la preview Lovable, l'app tourne dans une iframe (`*.lovable.app`) imbriquée dans `lovable.dev`. Twitch exige alors **plusieurs** `parent=` (un par niveau de domaine), sinon l'iframe reste noire/vide.

## Correctif

### 1. `src/lib/video.ts` — `detectVideo()`

- Ajouter la reconnaissance des chaînes live : `twitch.tv/<channel>` → `https://player.twitch.tv/?channel=<channel>&parent=...`
- Exclure les chemins réservés (`/videos`, `/directory`, `/p`, `/about`, `/subscriptions`, etc.) pour ne pas embarquer ces pages.
- Construire les `parent` dynamiquement côté client :
  - hostname courant (ex. `id-preview--xxx.lovable.app`)
  - `lovable.app`, `lovable.dev`, `localhost` en repli
  - dédupliqués, concaténés en `&parent=a&parent=b&parent=c`
- Côté SSR (`window` indéfini) : utiliser un placeholder neutre (`localhost`) — l'iframe sera réhydratée côté client avec les bons `parent`.

### 2. `src/lib/video.ts` — `inferLinkKind()` / `isVideoUrl()`

Aucun changement nécessaire : `inferLinkKind()` met déjà `video` en priorité sur `social` quand `detectVideo()` retourne un résultat. Comme les chaînes Twitch seront désormais reconnues comme vidéo, elles afficheront un lecteur ET resteront masquées de la liste « réseaux sociaux » (déjà filtré côté `$username.tsx`).

### 3. `src/components/VideoEmbed.tsx`

Ajouter pour l'iframe Twitch les attributs nécessaires :
- `sandbox="allow-scripts allow-same-origin allow-popups allow-forms"` (Twitch player en a besoin)

### Hors périmètre

- Pas de changement DB / RLS / dashboard / auth.
- Les VODs (`/videos/<id>`) et clips déjà fonctionnels ne sont pas modifiés (seulement la construction des `parent`).

## Vérification

Après build :
1. Tester une URL chaîne `https://twitch.tv/<chaîne>` → lecteur live visible.
2. Tester une URL VOD `https://twitch.tv/videos/<id>` → lecteur VOD visible.
3. Tester un clip → lecteur clip visible.
