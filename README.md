# EnimConnect — Plateforme de mise en relation étudiants-entreprises

Plateforme intelligente pour l'École Nationale Supérieure des Mines de Rabat (ENSMR) qui digitalise le processus de recherche de stage avec un moteur de matching IA.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| Backend | FastAPI + Python 3.11+ |
| Base de données | PostgreSQL 16 + pgvector |
| ORM | SQLAlchemy 2 + Alembic |
| IA | OpenAI API (gpt-4o-mini + text-embedding-3-small) |
| PDF | PyMuPDF |
| Auth | JWT (access token 30min + refresh token 7j) |
| Liens email | HMAC-SHA256 (expiration 48h) |
| Automation | N8n (workflow validation annonces par email) |

---

## Architecture

```
projetFederateur/
├── backend/                 # FastAPI
│   ├── app/
│   │   ├── main.py          # Application + CORS + routes statiques
│   │   ├── config.py        # Variables d'env via pydantic-settings
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # Endpoints FastAPI
│   │   │   ├── auth.py      # /auth/*
│   │   │   ├── etudiants.py # /etudiants/*
│   │   │   ├── annonces.py  # /annonces/*
│   │   │   ├── entreprises.py # /entreprises/*
│   │   │   ├── club.py      # /club/*
│   │   │   └── validation.py # /valider/* /rejeter/*
│   │   ├── services/
│   │   │   ├── auth_service.py      # bcrypt + JWT
│   │   │   ├── cv_service.py        # PyMuPDF + GPT-4o-mini
│   │   │   ├── embedding_service.py # OpenAI embeddings
│   │   │   ├── matching_service.py  # Cosine similarity
│   │   │   ├── n8n_service.py       # Webhook N8n
│   │   │   └── token_service.py     # HMAC-SHA256 liens email
│   │   ├── tasks/
│   │   │   ├── analyze_cv.py        # Background: PDF → IA → embedding
│   │   │   └── embed_annonce.py     # Background: annonce → embedding
│   │   └── middleware/
│   │       └── auth_middleware.py   # JWT dependencies FastAPI
│   ├── alembic/             # Migrations
│   ├── storage/             # Fichiers uploadés (cvs/, photos/)
│   ├── requirements.txt
│   └── .env.example
└── Enim_Connect_Website/    # Frontend React
    ├── src/
    │   ├── api/client.ts    # Couche API centralisée avec refresh token auto
    │   ├── context/AuthContext.tsx
    │   ├── pages/
    │   │   ├── auth/LoginPage.tsx      # Login + Register
    │   │   ├── student/               # Espace étudiant
    │   │   ├── company/               # Espace entreprise
    │   │   └── admin/                 # Espace club
    │   └── components/layout/         # Layouts avec auth guard
    └── .env.example
```

---

## Installation

### Prérequis

- Python 3.11+
- Node.js 20+
- PostgreSQL 16 avec extension pgvector
- N8n instance (optionnel pour le dev local)
- Clé API OpenAI

### 1. PostgreSQL + pgvector

```bash
# Ubuntu/Debian
sudo apt install postgresql-16 postgresql-16-pgvector

# macOS
brew install postgresql pgvector

# Créer la base
psql -U postgres -c "CREATE DATABASE enimconnect;"
psql -U postgres -c "CREATE USER enimuser WITH PASSWORD 'enimpass';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE enimconnect TO enimuser;"
psql -U postgres -d enimconnect -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 2. Backend

```bash
cd backend

# Environnement virtuel
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows

# Dépendances
pip install -r requirements.txt

# Configuration
cp .env.example .env
# Éditez .env avec vos vraies valeurs

# Migrations
alembic upgrade head

# Lancer le serveur
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend

```bash
cd Enim_Connect_Website

# Dépendances
npm install

# Configuration
cp .env.example .env.local
# Vérifiez que VITE_API_URL=http://localhost:8000

# Lancer le dev server
npm run dev
```

L'application est disponible sur `http://localhost:5173`

---

## Variables d'environnement — Backend

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | URL PostgreSQL | `postgresql://user:pass@localhost:5432/enimconnect` |
| `SECRET_KEY` | Clé JWT (min 32 chars) | `super-secret-key-here` |
| `OPENAI_API_KEY` | Clé API OpenAI | `sk-...` |
| `N8N_WEBHOOK_URL` | URL webhook N8n | `https://n8n.example.com/webhook/...` |
| `HMAC_SECRET` | Secret HMAC liens email (min 32 chars) | `hmac-secret-here` |
| `FRONTEND_URL` | URL du frontend (CORS) | `http://localhost:5173` |
| `STORAGE_PATH` | Répertoire stockage fichiers | `./storage` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Durée access token | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Durée refresh token | `7` |

---

## API — Résumé des endpoints

### Auth
```
POST /auth/register    {email, password, role}
POST /auth/login       {email, password} → {access_token, refresh_token}
POST /auth/refresh     {refresh_token} → {access_token}
POST /auth/logout
```

### Étudiant (JWT requis, rôle: etudiant)
```
GET  /etudiants/me
PUT  /etudiants/me
POST /etudiants/me/photo    (multipart/form-data)
POST /etudiants/me/cv       (multipart/form-data, PDF)
GET  /etudiants/me/cv
GET  /etudiants/me/candidatures
```

### Annonces (JWT requis)
```
GET    /annonces              (triées par IA si étudiant avec CV)
GET    /annonces/{id}
POST   /annonces/{id}/postuler
DELETE /annonces/{id}/postuler
```

### Entreprise (JWT requis, rôle: entreprise)
```
GET  /entreprises/me
PUT  /entreprises/me
POST /entreprises/annonces                    (entreprise validée seulement)
GET  /entreprises/annonces
PUT  /entreprises/annonces/{id}
DELETE /entreprises/annonces/{id}
GET  /entreprises/annonces/{id}/candidatures  (triés par IA)
GET  /entreprises/recherche?departement=&niveau=
```

### Validation par email (liens signés HMAC, 48h)
```
GET /valider/{annonce_id}?token=...&chef_id=...
GET /rejeter/{annonce_id}?token=...&chef_id=...&motif=...
```

### Club (JWT requis, rôle: club)
```
GET /club/entreprises
PUT /club/entreprises/{id}/valider
PUT /club/entreprises/{id}/rejeter
GET /club/stats
```

---

## Les 4 acteurs et leurs accès

| Acteur | Role JWT | Accès |
|---|---|---|
| Étudiant | `etudiant` | Profil, CV, recherche d'offres, candidatures |
| Entreprise | `entreprise` | Profil, publication d'offres, consultation des candidats |
| Club | `club` | Validation des comptes entreprises |
| Chef de département | — (pas de compte) | Valide/rejette les annonces via liens email |

---

## Logique IA

### Pipeline CV (background task — ne bloque jamais l'UI)
1. PyMuPDF extrait le texte du PDF
2. GPT-4o-mini génère une description synthétique (3-4 phrases)
3. text-embedding-3-small génère un vecteur 1536D
4. Description + vecteur sauvegardés en base

### Matching cosinus
- Étudiant → liste d'annonces : triée par `cosinus(cv_embedding, annonce_embedding)`
- Entreprise → liste de candidats : triée par `cosinus(annonce_embedding, cv_embedding)`
- **Les scores ne sont JAMAIS exposés dans les réponses API**

### Embedding des annonces
- Dès validation par un chef → tâche background génère l'embedding automatiquement

---

## Workflow N8n — Validation des annonces

Le backend envoie un webhook à N8n avec :
```json
{
  "annonce_id": "...",
  "titre": "...",
  "departement": "...",
  "chefs": [
    {
      "nom": "...",
      "email": "...",
      "lien_valider": "https://enimconnect.ma/valider/{id}?token=...&chef_id=...",
      "lien_rejeter": "https://enimconnect.ma/rejeter/{id}?token=...&chef_id=..."
    }
  ]
}
```

N8n envoie un email à chaque chef. Le premier qui clique valide/rejette. Les suivants voient une page "déjà traité".

---

## Sécurité

- Mots de passe : bcrypt
- JWT : HS256, access token 30min, refresh token 7j
- Liens email : HMAC-SHA256, expiration 48h
- CORS : uniquement `FRONTEND_URL`
- Entreprise non validée → 403 même avec JWT valide
- Score IA jamais exposé dans les réponses API

---

## Déploiement

### Backend — Railway
```bash
# Procfile
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Frontend — Vercel
```bash
# vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

Définir `VITE_API_URL` dans les variables d'environnement Vercel.

---

## Données initiales — Chefs de département

Pour tester le workflow, insérez des chefs de département manuellement :

```sql
INSERT INTO chefs_departement (id, nom, email, departement) VALUES
  (gen_random_uuid(), 'Prof. El Alami', 'el.alami@ensmr.ac.ma', 'Génie Informatique'),
  (gen_random_uuid(), 'Prof. Benali', 'benali@ensmr.ac.ma', 'Génie Électrique'),
  (gen_random_uuid(), 'Prof. Idrissi', 'idrissi@ensmr.ac.ma', 'Génie Civil');
```
