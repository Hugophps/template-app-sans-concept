# CODEX HANDOFF — Sans Concept “App Template Factory”

## Contexte
Je veux construire un template de projet pour pouvoir “vibe coder” rapidement des PWAs mobile-first (Next.js), avec une architecture standard et une infrastructure déjà en place.  
Je développe dans VS Code avec  des agents IA (ex: Codex).

L’objectif final : pouvoir créer et déployer n’importe quelle nouvelle app basée sur ce template (1 app = 1 repo), avec un workflow staging → prod propre, automatisé et reproductible.

---

## Stack cible (standard pour toutes les apps issues du template)
- Front : Next.js (App Router) — PWA mobile-first
- Back : Supabase (Postgres + Auth + RLS)
- Déploiement : Vercel
- Versioning : GitHub
- Monitoring : Sentry (au minimum en production)

---

## Décisions déjà prises (ne pas rediscuter, appliquer)

### Branching / Environnements
- `develop` = staging
- `main` = production
- Le merge / PR sert à promouvoir une version stable vers la prod.

### Supabase
- 2 projets Supabase par app : 1 staging + 1 prod
- IMPORTANT : 1 compte Supabase distinct par app (emails secondaires via Google Workspace).
- Région UE si possible.

### Vercel
- 1 projet Vercel par app.
- Domaines :
  - Staging : `staging.<domaine>`
  - Prod (app) : `app.<domaine>`
- Le domaine racine `<domaine>` est réservé à une landing page sur un projet Vercel séparé (hors scope du template).

### Auth
- Auth Supabase en SSR (server-side).
- Pages d’auth présentes dans le template (login, signup, reset, callback).
- Homepage publique vide.

### Migrations DB / CI/CD
- Aucune modification manuelle de la base.
- Toutes les évolutions DB passent par des migrations SQL versionnées.
- L’agent génère et commit les migrations.
- CI :
  - Push sur `develop` → `supabase db push` sur staging
  - Push / merge sur `main` → `supabase db push` sur prod
- Le déploiement Vercel est automatique et parallèle.
- Objectif : “merge develop → main” = DB prod + deploy prod.

### Audit logs
- Une table `audit_logs` existe dans le template.
- On log uniquement les actions sensibles :
  - auth
  - changement de rôle
  - actions admin
  - paiement / abonnement
- Pas de tracking analytique dans cette table.

### Rôles
Le template doit permettre ces états :
- utilisateur non connecté
- utilisateur connecté
- utilisateur admin
- utilisateur payant

---

## Design system / UX / UI — contraintes fortes

Le template doit suivre une approche **design system first** :
- Tokens → Primitives → Patterns
- Pas de styles ad-hoc dispersés
- Les composants UI récurrents sont factorisés

Structure attendue (indicative) :
- `ui/tokens` (couleurs, spacing, typo, radius)
- `ui/primitives` (button, input, card, badge, etc.)
- `ui/patterns` (form-field, auth-card, page-shell, etc.)

### Approche composants

L’interface doit être pensée et construite autour de composants réutilisables.

Principes :
- Toute UI récurrente (ex : cartes, listes, headers, footers, sections de page, CTA) doit être implémentée comme un composant dédié.
- Le copier-coller de JSX pour des structures similaires est interdit.
- Les composants doivent favoriser la cohérence visuelle et comportementale à l’échelle de l’app.

Exemples attendus :
- Cards récurrentes (listes, dashboards, résultats)
- Header / Footer / Navigation
- Sections de page réutilisables
- Empty states, loaders, error states

Les composants doivent s’appuyer sur :
- les tokens du design system
- les primitives existantes
- des patterns lorsque la structure devient complexe

---

## Skills agents à utiliser (obligatoires)

Tu dois raisonner et produire du code **en respectant explicitement** les skills suivants :

### 1. Vercel — React & Next.js best practices
- `vercel-react-best-practices`
- `react-best-practices`
Objectif :
- éviter les anti-patterns React
- limiter les Client Components
- garantir performance et lisibilité App Router

### 2. Next.js App Router patterns
- `nextjs-app-router-patterns`
Objectif :
- structuration claire via route groups
- layouts cohérents
- séparation public / auth / app
- usage correct SSR vs client

### 3. Supabase / Postgres best practices
- `supabase-postgres-best-practices`
Objectif :
- schémas Postgres propres
- RLS correctes
- migrations sûres et versionnées
- éviter les pièges classiques Supabase

### 4. Design system & UX
- `design-system-patterns`
- Web Interface Guidelines (Vercel)
Objectif :
- UI cohérente et maintenable
- bonnes pratiques UX (forms, erreurs, accessibilité, mobile)
- éviter des écrans “jolis mais inutilisables”

Ces skills servent de **garde-fous** :  
si une décision de code ou de structure va à l’encontre de ces principes, elle doit être rejetée.

---

## Ce que j’attends de toi (Codex)

1. Tu commences par **reformuler ce brief** pour valider ta compréhension.
2. Tu proposes un **plan d’exécution concret** (court, structuré).
3. Tu identifies clairement :
   - ce que tu peux automatiser à 100%
   - ce qui nécessite une intervention humaine (DNS, clés, choix finaux).
4. Tu mets ensuite en place :
   - le repo template
   - la structure technique
   - les bases CI/CD
   - le bootstrapper pour créer une nouvelle app à partir du template

Contraintes :
- Ne rediscute pas les décisions listées.
- Ne produis pas une théorie générale.
- Priorité à l’exécutable, reproductible, et maintenable.
