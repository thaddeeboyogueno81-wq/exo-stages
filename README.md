# Lify 🎧

> **Discuter, regarder, écouter, lire — au même endroit.**
> Réseau social et multimédia construit selon le cahier des charges du
> 24 septembre 2026. Version 1 complète (site web).

Lify réunit ce qui est aujourd'hui éparpillé sur plusieurs services : la
messagerie, le réseau social (stories & reels), la musique, la vidéo et les
livres — avec un compte unique, un accès gratuit limité et des contenus
libres de droits.

## ✨ Fonctionnalités de la version 1

| Module | Ce qui est livré |
| --- | --- |
| **Comptes** | Inscription email avec confirmation, connexion Google, profil (nom, photo, bio, centres d'intérêt), réinitialisation du mot de passe, export des données, suppression du compte |
| **Messagerie** | Conversations 1-à-1 en temps réel (Supabase Realtime), envoi de texte et de photos, accusés de lecture |
| **Stories** | Stories qui disparaissent après 24 h (visionneuse immersive, barres de progression, navigation clavier) |
| **Reels & fil** | Vidéos courtes, likes, commentaires (temps réel), partage, fil chronologique qui privilégie les abonnements |
| **Musique & vidéo** | Catalogue de contenus libres de droits et de créateurs indépendants, lecteur audio/vidéo, favoris |
| **Livres** | Bibliothèque du domaine public, lecteur avec taille de texte, mode sombre et reprise de lecture |
| **Mode gratuit limité** | Messagerie et fil illimités ; 20 écoutes/lectures par jour, 3 nouveaux livres par mois (quotas appliqués côté base via RPC) |
| **PWA** | Application web installable, service worker, pages déjà vues consultables hors-ligne |
| **Modération** | Bouton de signalement partout, retrait sous 48 h, règles de conduite, âge minimal 13 ans |
| **Accessibilité** | Navigation clavier, focus visible, contrastes, français, écrans dès 360 px |

## 🏗️ Architecture

```
Navigateur (Next.js 14, TypeScript, Tailwind CSS, PWA)
        │
        ▼
Supabase ── PostgreSQL (modèle relationnel : profils, messages, posts…)
        ├─ Auth (email + Google, sessions httpOnly via middleware)
        ├─ Realtime (messages & posts en WebSocket)
        └─ Storage (photos, vidéos, avatars — bucket « media »)
        ▼
Vercel (déploiement, HTTPS, CDN)
```

- **Next.js 14 (App Router) + TypeScript + Tailwind** : une seule base pour pages, interface et rendu rapide.
- **Supabase Auth** : email avec confirmation + Google, sessions gérées par `@supabase/ssr` et un `middleware.ts` qui rafraîchit les sessions et protège les pages.
- **PostgreSQL + RLS** : chaque table est protégée par Row Level Security (on ne lit/écrit que ce qui nous appartient ; les messages ne sont visibles que des participants).
- **Realtime** : tables `messages` et `posts` publiées dans `supabase_realtime`.

## 📁 Structure du projet

```
├── src/
│   ├── app/
│   │   ├── (auth)/            # connexion, inscription, mot de passe oublié
│   │   ├── (app)/             # espace connecté : fil, reels, messages,
│   │   │                      # musique, videos, livres, publier, profil, parametres
│   │   ├── auth/              # callbacks OAuth et confirmation email
│   │   ├── legal/[doc]/       # CGU, confidentialité, règles de conduite
│   │   ├── layout.tsx, page.tsx, globals.css
│   ├── components/            # UI (chat, social, media, publish, settings…)
│   ├── lib/                   # clients Supabase, types, quotas, utils, auth
│   └── middleware.ts          # sessions + protection des routes
├── supabase/
│   ├── schema.sql             # tables, RLS, triggers, quotas (à exécuter)
│   └── seed.sql               # catalogue de démarrage libre de droits
├── public/                    # manifest PWA, service worker, icône
└── .github/workflows/ci.yml   # lint + type-check + build
```

## 🚀 Démarrage rapide

1. **Créer le projet Supabase** — [supabase.com](https://supabase.com) → New project.
2. **Activer la connexion Google** : Authentication → Providers → Google (clés OAuth depuis Google Cloud Console) ; ajouter `https://VOTRE-PROJET.supabase.co/auth/v1/callback` comme URI de redirection Google.
3. **Configurer les URLs d'authentification** : Authentication → URL Configuration → Site URL = `http://localhost:3000` ; Redirect URLs : `http://localhost:3000/auth/callback` et `http://localhost:3000/auth/confirm`.
4. **Exécuter le SQL** : SQL Editor → coller puis lancer `supabase/schema.sql`, puis `supabase/seed.sql`.
5. **Créer le bucket Storage** : Storage → New bucket → nom `media` (public), pour les photos, vidéos et avatars.
6. **Variables d'environnement** :
   ```bash
   cp .env.example .env.local
   # remplir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
   npm install
   npm run dev     # http://localhost:3000
   ```

## ☁️ Déploiement sur Vercel

1. Importer le dépôt dans Vercel.
2. Ajouter les trois variables d'environnement (Settings → Environment Variables).
3. Dans Supabase, mettre à jour l'URL du site et les redirections vers le domaine Vercel (et activer Google avec la nouvelle URL de callback).
4. Déployer — HTTPS est automatique.

## 🗺️ Feuille de route (après la V1)

- **V2** : recommandation du fil selon les centres d'intérêt, groupes et messages vocaux, contenus mis en cache consultables hors-ligne, double authentification, lives avec chat.
- **V3** : application React Native (Android puis iOS), appels audio/vidéo chiffrés, accès à distance aux appareils (WebRTC + TURN), objets connectés Matter, matchs de football sous licence.
- **Revenus** : publicité discrète dans le fil gratuit → abonnement premium (sans quotas ni publicité) → commission sur les contenus vendus par les créateurs.

## 🔐 Choix de sécurité & conformité

- Mots de passe jamais stockés en clair (Supabase Auth).
- Sessions via cookies httpOnly renouvelés par le middleware (protection contre le vol de session).
- Requêtes via le client Supabase + RLS sur toutes les tables (protection contre l'injection).
- Données minimales, consentement à l'inscription, export et suppression du compte dans les paramètres.
- Seuls des contenus dont la licence autorise la diffusion sont acceptés ; procédure de retrait sous 48 h après signalement.

## 📄 Licence du code

MIT — voir [LICENSE](./LICENSE). Les contenus multimédias diffusés par Lify respectent leurs licences propres (domaine public, Creative Commons, accords de créateurs, contrats partenaires).
