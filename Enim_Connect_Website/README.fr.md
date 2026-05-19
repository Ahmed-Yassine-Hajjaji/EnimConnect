# EnimConnect

Une plateforme intelligente de gestion des stages pour l'**École Nationale Supérieure des Mines de Rabat (ENSMR)**. Elle met en relation les étudiants et les entreprises grâce à un moteur de matching par IA qui classe les offres et les candidats en fonction de la similarité entre les CVs et les offres de stage.

---

## Fonctionnalités

### Étudiants
- Compléter son profil (compétences, langues, filière, photo)
- Déposer un CV en PDF — analysé automatiquement par l'IA (extraction de texte → résumé GPT → embedding vectoriel)
- Parcourir les offres de stage triées par pertinence (similarité cosinus avec le CV)
- Postuler ou retirer une candidature en un clic
- Suivre toutes ses candidatures depuis un tableau de bord personnel
- Recevoir des notifications en temps réel (CV traité, statut de candidature)

### Entreprises
- S'inscrire et se faire valider par le club avant de publier des offres
- Publier des offres de stage par département (Informatique, Électrique, Civil, Industriel, Minier, Sciences)
- Les offres sont soumises à la validation des chefs de département via des liens signés par e-mail
- Consulter les candidats triés par pertinence IA par rapport à l'offre
- Marquer des candidats en favoris
- Rechercher des étudiants indépendamment des offres

### Club (Administration)
- Valider ou rejeter les comptes entreprises
- Suivre les statistiques de la plateforme (étudiants, entreprises, offres actives, candidatures)
- Recevoir des notifications lors de nouvelles inscriptions ou soumissions d'offres

### Chefs de Département (sans compte)
- Recevoir un e-mail avec le détail de l'offre et deux liens d'action signés (valables 48h)
- Valider ou rejeter l'offre en un clic — déclenche une mise à jour immédiate du statut
- Les liens HMAC garantissent une action unique et non reproductible

---

## Stack Technique

| Couche | Technologie |
|--------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7 |
| Backend | FastAPI, Python 3.11+, SQLAlchemy 2.0, Alembic |
| Base de données | PostgreSQL 16 avec extension pgvector |
| IA | OpenAI GPT-4o-mini (résumé de CV), text-embedding-3-small (embeddings vectoriels) |
| Auth | JWT (HS256) — token d'accès 30min, refresh 7 jours, hachage bcrypt |
| Workflow e-mail | Automatisation N8n + liens de validation signés HMAC-SHA256 |
| Stockage fichiers | Système de fichiers local via FastAPI static files |

---

## Architecture du Projet

```
projetFederateur/
├── Enim_Connect_Website/          # Frontend React
│   ├── src/
│   │   ├── api/client.ts          # Couche API centralisée avec rafraîchissement automatique du token
│   │   ├── context/AuthContext.tsx# État d'authentification (rôle, login, logout)
│   │   ├── pages/
│   │   │   ├── auth/              # Connexion & inscription
│   │   │   ├── student/           # Tableau de bord, recherche, candidatures, profil
│   │   │   ├── company/           # Tableau de bord, publication d'offre, gestion candidats
│   │   │   └── admin/             # Tableau de bord club, validation entreprises
│   │   └── components/
│   │       ├── layout/            # Layouts par rôle avec sidebar et garde d'authentification
│   │       ├── NotificationBell.tsx
│   │       └── UserAvatar.tsx
│   └── .env.example
└── backend/                       # Backend FastAPI
    ├── app/
    │   ├── main.py                # Point d'entrée, CORS, fichiers statiques, routeurs
    │   ├── models/                # Modèles ORM SQLAlchemy
    │   │   ├── user.py            # Utilisateur de base (rôle : etudiant | entreprise | club)
    │   │   ├── etudiant.py        # Profil étudiant
    │   │   ├── entreprise.py      # Profil entreprise (flag validé)
    │   │   ├── annonce.py         # Offre de stage (statut : en_attente | validee | rejetee)
    │   │   ├── candidature.py     # Candidature (étudiant → offre)
    │   │   ├── cv.py              # Fichier CV + description générée par GPT
    │   │   ├── embedding.py       # Vecteurs 1536 dimensions pour CVs et offres (pgvector)
    │   │   ├── chef_departement.py# Chefs de département (peuplés manuellement)
    │   │   └── notification.py    # Notifications en application
    │   ├── routers/               # Groupes d'endpoints API
    │   │   ├── auth.py            # Inscription, connexion, refresh, déconnexion
    │   │   ├── etudiants.py       # Profil, upload CV, photo, candidatures
    │   │   ├── annonces.py        # Liste des offres (triées par IA), postuler/retirer
    │   │   ├── entreprises.py     # Profil entreprise, offres, gestion candidats
    │   │   ├── club.py            # Validation entreprises, statistiques
    │   │   ├── validation.py      # Liens e-mail HMAC (valider/rejeter offres)
    │   │   └── notifications.py   # CRUD notifications
    │   ├── services/              # Logique métier & intégrations externes
    │   │   ├── cv_service.py      # Extraction PyMuPDF + résumé GPT
    │   │   ├── embedding_service.py# Appels à l'API embeddings OpenAI
    │   │   ├── matching_service.py # Tri par similarité cosinus
    │   │   ├── token_service.py   # Génération et validation de liens signés HMAC-SHA256
    │   │   ├── n8n_service.py     # Webhook vers N8n pour envoi d'e-mails
    │   │   └── notification_service.py
    │   └── tasks/                 # Tâches de fond asynchrones
    │       ├── analyze_cv.py      # Texte CV → résumé GPT → embedding
    │       └── embed_annonce.py   # Texte offre → embedding
    ├── alembic/                   # Migrations de base de données
    └── storage/                   # CVs et photos uploadés
```

---

## Moteur de Matching IA

**Traitement du CV (déclenché à l'upload) :**
1. PyMuPDF extrait le texte du PDF de l'étudiant
2. GPT-4o-mini génère un résumé de 3 à 4 phrases en français
3. `text-embedding-3-small` convertit le résumé en un vecteur de 1536 dimensions
4. Le vecteur est stocké dans PostgreSQL via pgvector

**Traitement de l'offre (déclenché à la validation) :**
1. Le titre et la description de l'offre sont transformés en embedding
2. Le vecteur est stocké avec l'offre

**Matching :**
- `GET /annonces` retourne les offres triées par similarité cosinus avec le CV de l'étudiant
- `GET /entreprises/annonces/{id}/candidatures` retourne les candidats triés par pertinence par rapport à l'offre
- Les scores sont calculés côté serveur et ne sont jamais exposés dans les réponses API

---

## Routes

```
/                                   → Connexion / Inscription
/etudiant/tableau-de-bord           → Tableau de bord étudiant
/etudiant/recherche                 → Parcourir les offres (triées par IA)
/etudiant/candidatures              → Mes candidatures
/etudiant/offre/:id                 → Détail d'une offre
/etudiant/profil/:id                → Mon profil & upload CV
/entreprise/tableau-de-bord         → Tableau de bord entreprise
/entreprise/publier-offre           → Publier une offre de stage
/entreprise/gestion-candidats       → Candidats (triés par IA)
/entreprise/candidats-favoris       → Candidats sauvegardés
/admin/interface                    → Tableau de bord club
/admin/entreprises                  → Panneau de validation entreprises
```

---

## Démarrage Rapide

### Prérequis
- Node.js 18+
- Python 3.11+
- PostgreSQL 16 avec l'extension pgvector
- Une clé API OpenAI
- Une instance N8n (pour les workflows e-mail)

### Frontend

```bash
cd Enim_Connect_Website
npm install
cp .env.example .env          # Renseigner VITE_API_URL
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # Remplir toutes les variables requises
alembic upgrade head
uvicorn app.main:app --reload
```

### Variables d'environnement

**Frontend** (`.env`) :
```
VITE_API_URL=http://localhost:8000
```

**Backend** (`.env`) :
```
DATABASE_URL=postgresql://...
SECRET_KEY=...
HMAC_SECRET=...
OPENAI_API_KEY=...
N8N_WEBHOOK_URL=...
FRONTEND_URL=http://localhost:5173
STORAGE_PATH=./storage
```

---

## Flux Principaux

**Un étudiant postule à une offre :**
L'étudiant dépose son CV → L'IA l'analyse en arrière-plan → L'étudiant parcourt les offres classées par IA → Il postule → L'entreprise est notifiée

**Une entreprise publie une offre :**
L'entreprise crée une offre → N8n envoie un e-mail aux chefs de département → Le chef valide via un lien signé → L'offre est publiée → L'embedding est généré → Les étudiants voient l'offre classée par pertinence

**Le club valide une entreprise :**
L'entreprise s'inscrit → Le club est notifié → Le club approuve → L'entreprise peut publier des offres
