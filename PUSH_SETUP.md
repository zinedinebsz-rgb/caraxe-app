# CARAXES — Configuration Web Push (VAPID)

Deux étapes une seule fois pour activer les notifications push serveur (même quand l'app est fermée).

## 1. Migration Supabase — table `push_subscriptions`

Dans Supabase Studio → SQL Editor, colle et exécute :

```sql
-- Contenu de supabase/migrations/push_subscriptions.sql
```

Ouvre le fichier `supabase/migrations/push_subscriptions.sql` et copie-colle son contenu dans le SQL Editor Supabase. Clique **Run**.

Vérification : dans Table Editor, tu dois voir `push_subscriptions` avec les colonnes `user_id`, `endpoint`, `p256dh`, `auth`, `created_at`.

## 2. Déploiement de l'Edge Function `send-push`

### Variables d'environnement à configurer

Dans Supabase Studio → Project Settings → Edge Functions → Manage secrets, ajoute :

| Nom | Valeur |
|---|---|
| `VAPID_PUBLIC_KEY`  | `BF402QrdCSf5IuBUV21a5BrmHpo-ZlfSGIYspwLkm7sNt-XLunQ802jKApO7ceydrwLX_tQQtYcjgDb2VLh3Yio` |
| `VAPID_PRIVATE_KEY` | `B1U3hnjYrB6octGv4tX-cHnkHZl_mU-F7640h6Ry7t8` |
| `VAPID_SUBJECT`     | `mailto:contact@caraxes.fr` |

Ces clés sont uniques à CARAXES. Ne les régénère pas — tous les abonnements actuels deviendraient invalides.

### Déploiement via CLI Supabase

```bash
# Installer le CLI Supabase si besoin
brew install supabase/tap/supabase

# Depuis le dossier caraxe-app/
cd /chemin/vers/caraxe-app

# Link au projet (une seule fois — te demandera ta db password)
supabase link --project-ref <ton-project-ref>

# Déployer la fonction
supabase functions deploy send-push --no-verify-jwt
```

Le flag `--no-verify-jwt` permet à la fonction d'accepter le token utilisateur ou service_role. La fonction vérifie elle-même les permissions via RLS + service role.

### Alternative : déploiement via Dashboard

Si tu ne veux pas utiliser le CLI :
1. Dans Supabase Studio → Edge Functions → New function → nom `send-push`
2. Copie-colle le contenu de `supabase/functions/send-push/index.ts`
3. Clique Deploy

## 3. Test

1. Ouvre `https://app.caraxes.fr` sur ton téléphone (Chrome Android ou Safari iOS 16+)
2. Dans les paramètres en haut, clique **Activer les notifications**
3. Autorise dans le prompt navigateur
4. Ferme l'onglet (sans fermer le navigateur)
5. Depuis ton admin `/admin`, va dans **Pipeline Commandes**, déplace une carte dans une autre colonne
6. Le client doit recevoir une notification push même si l'app n'est pas ouverte

## Architecture

```
Navigateur client              Supabase                   Edge Function
    │                             │                             │
    │ 1. Permission notifications │                             │
    ├────────────────────────────▶│                             │
    │                             │                             │
    │ 2. PushSubscription         │                             │
    │    → table push_subscriptions                             │
    ├────────────────────────────▶│                             │
    │                             │                             │
    │                             │   3. Admin change status    │
    │                             │◀────────────────────────────┤
    │                             │                             │
    │                             │   4. POST /send-push        │
    │                             │      {user_id, title, body} │
    │                             │─────────────────────────────▶
    │                             │                             │
    │                             │                             │ 5. Lookup
    │                             │                             │    subs par user_id
    │                             │                             │
    │   6. Push via FCM/APNs      │                             │
    │◀────────────────────────────────────────────────────────────
    │                             │                             │
    │ 7. SW affiche notification  │                             │
    │    (même app fermée)        │                             │
    ▼                             │                             │
```

## Clés VAPID utilisées

- **Public** (exposée dans le bundle frontend, normal) : `BF402QrdCSf5IuBUV21a5BrmHpo-ZlfSGIYspwLkm7sNt-XLunQ802jKApO7ceydrwLX_tQQtYcjgDb2VLh3Yio`
- **Private** (JAMAIS dans le repo — Supabase secret only) : `B1U3hnjYrB6octGv4tX-cHnkHZl_mU-F7640h6Ry7t8`
- **Subject** : `mailto:contact@caraxes.fr`

Ces clés sont stockées dans le code (`src/lib/push.js` pour la publique, Supabase env secret pour la privée). Elles sont permanentes — ne les change que si tu veux invalider tous les abonnements existants.

## Dépannage

**« push-unsupported »** : navigateur trop vieux (pas de ServiceWorker/PushManager). Chrome 50+, Firefox 44+, Safari 16+, Edge 17+.

**« permission-denied »** : l'utilisateur a refusé. Il doit aller dans les paramètres navigateur pour réautoriser le site.

**« not-authenticated »** : l'utilisateur n'est pas connecté à CARAXES. Il doit se connecter d'abord.

**404/410 depuis push service** : l'abonnement est expiré. L'Edge Function le supprime automatiquement de la table.
