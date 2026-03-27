# CARAXE App — Guide de mise en ligne

Tout est gratuit. Temps estimé : 20 minutes.

---

## 1. Créer le projet Supabase (5 min)

1. Va sur [supabase.com](https://supabase.com) → **Start your project** (gratuit)
2. Crée une organisation puis un projet (nom : `caraxe`, mot de passe : note-le)
3. Attends que le projet se crée (~2 min)
4. Va dans **Settings → API** et copie :
   - `Project URL` → c'est ton `VITE_SUPABASE_URL`
   - `anon / public key` → c'est ton `VITE_SUPABASE_ANON_KEY`

## 2. Créer la base de données (3 min)

1. Dans Supabase, va dans **SQL Editor**
2. Clique **New query**
3. Copie-colle TOUT le contenu de `supabase/schema.sql`
4. Clique **Run**
5. Tu devrais voir "Success" — toutes les tables sont créées

## 3. Activer l'auth Magic Link (2 min)

1. Va dans **Authentication → Providers**
2. Email est déjà activé par défaut
3. Va dans **Authentication → URL Configuration**
4. Mets ton URL de site dans **Site URL** : `https://ton-domaine.vercel.app`
   (tu pourras le modifier après le deploy)

## 4. Te rendre admin (1 min)

1. Va sur ton app et connecte-toi avec ton email
2. Retourne dans Supabase → **SQL Editor**
3. Lance cette requête :
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'ton@email.com';
   ```
4. Rafraîchis l'app — tu as maintenant le panneau Admin

## 5. Configurer le projet local (3 min)

```bash
cd caraxe-app
cp .env.example .env
# Édite .env avec tes clés Supabase
npm install
npm run dev
```

L'app tourne sur http://localhost:3000

## 6. Déployer sur Vercel (5 min)

1. Pousse le dossier `caraxe-app` sur GitHub (repo privé OK)
2. Va sur [vercel.com](https://vercel.com) → **Import Project**
3. Sélectionne ton repo
4. Ajoute les **Environment Variables** :
   - `VITE_SUPABASE_URL` = ta Project URL
   - `VITE_SUPABASE_ANON_KEY` = ta anon key
5. Clique **Deploy**
6. Copie l'URL Vercel et mets-la dans Supabase → Authentication → Site URL

## 7. Domaine custom (optionnel)

Dans Vercel → Settings → Domains, ajoute `app.caraxe.com` ou ce que tu veux.

---

## Architecture

```
caraxe-app/
├── index.html            ← Point d'entrée
├── package.json          ← Dépendances
├── vite.config.js        ← Config build
├── vercel.json           ← Routing SPA
├── .env.example          ← Variables d'env
├── supabase/
│   └── schema.sql        ← Tables, RLS, storage, realtime
└── src/
    ├── main.jsx          ← Bootstrap React
    ├── App.jsx           ← Auth routing (Login/Dashboard/Admin)
    ├── lib/
    │   ├── supabase.js   ← Client Supabase + toutes les fonctions
    │   └── theme.js      ← Design tokens partagés
    ├── components/
    │   └── StatusPill.jsx ← Composants réutilisables
    └── pages/
        ├── Login.jsx      ← Connexion magic link
        ├── Dashboard.jsx  ← Vue client (commandes, chat, docs)
        └── Admin.jsx      ← Vue admin (gestion, status, upload)
```

## Ce qui est inclus (tout gratuit)

| Fonctionnalité | Service | Limite gratuite |
|---|---|---|
| Auth (magic link) | Supabase Auth | 50k users |
| Base de données | Supabase PostgreSQL | 500 Mo |
| Messaging temps réel | Supabase Realtime | 200 connexions simultanées |
| Stockage fichiers | Supabase Storage | 1 Go |
| Hébergement | Vercel | 100 Go bandwidth/mois |
| Domaine | Vercel | Sous-domaine gratuit |

## Fonctionnalités

**Client :**
- Connexion sans mot de passe (magic link email)
- Créer une demande de sourcing (formulaire 3 étapes)
- Voir ses commandes avec statut visuel (7 étapes)
- Chat en temps réel avec l'agent
- Télécharger les documents (devis, photos, factures)
- Recherche et filtres
- 100% responsive mobile

**Admin (toi) :**
- Voir TOUTES les commandes de tous les clients
- Changer le statut d'un clic
- Modifier fournisseur, ville, progression
- Répondre aux messages clients
- Uploader des documents (devis, photos QC, factures)
- Recherche par client/produit

**Sécurité :**
- Row Level Security : chaque client ne voit que ses propres données
- Admin voit tout
- Fichiers protégés par auth
- Pas de mot de passe à gérer
