# EnimConnect

An AI-powered internship management platform for the **École Nationale Supérieure des Mines de Rabat (ENSMR)**. It connects students with companies through an intelligent matching engine that ranks offers and candidates using CV and job offer embeddings.

---

## Features

### Students
- Complete profile with skills, languages, field of study, and profile photo
- Upload a PDF CV — automatically analyzed by AI (text extraction → GPT summary → vector embedding)
- Browse internship offers sorted by relevance (cosine similarity with your CV)
- Apply or withdraw from offers with one click
- Track all applications from a personal dashboard
- In-app notifications when your CV is processed or application status changes

### Companies
- Register and get validated by club staff before publishing offers
- Publish internship offers by department (Informatique, Électrique, Civil, Industriel, Minier, Sciences)
- Offers are reviewed by department heads via signed email links before going live
- View applicants sorted by AI relevance to the offer
- Mark candidates as favorites
- Search the student pool independently of offers

### Club (Admin)
- Validate or reject company accounts
- Monitor platform statistics (students, companies, active offers, applications)
- Receive in-app notifications on new registrations and offer submissions

### Department Heads (No login required)
- Receive an email with offer details and two signed action links (48h expiry)
- Click to validate or reject — triggers immediate status update and company notification
- HMAC-signed links ensure one-time, non-repeatable actions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7 |
| Backend | FastAPI, Python 3.11+, SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL 16 with pgvector extension |
| AI | OpenAI GPT-4o-mini (CV summarization), text-embedding-3-small (vector embeddings) |
| Auth | JWT (HS256) — 30min access token, 7-day refresh token, bcrypt password hashing |
| Email Workflow | N8n webhook automation + HMAC-SHA256 signed validation links |
| File Storage | Local filesystem via FastAPI static file serving |

---

## Project Architecture

```
projetFederateur/
├── Enim_Connect_Website/          # React frontend
│   ├── src/
│   │   ├── api/client.ts          # Centralized API layer with auto token refresh
│   │   ├── context/AuthContext.tsx# Auth state (role, login, logout)
│   │   ├── pages/
│   │   │   ├── auth/              # Login & registration
│   │   │   ├── student/           # Dashboard, search, applications, profile
│   │   │   ├── company/           # Dashboard, publish offer, candidate review
│   │   │   └── admin/             # Club dashboard, company validation
│   │   └── components/
│   │       ├── layout/            # Role-based layouts with sidebar & auth guards
│   │       ├── NotificationBell.tsx
│   │       └── UserAvatar.tsx
│   └── .env.example
└── backend/                       # FastAPI backend
    ├── app/
    │   ├── main.py                # App entry point, CORS, static files, routers
    │   ├── models/                # SQLAlchemy ORM models
    │   │   ├── user.py            # Base user (role: etudiant | entreprise | club)
    │   │   ├── etudiant.py        # Student profile
    │   │   ├── entreprise.py      # Company profile (validated flag)
    │   │   ├── annonce.py         # Job offer (status: en_attente | validee | rejetee)
    │   │   ├── candidature.py     # Application (student → offer)
    │   │   ├── cv.py              # CV file + GPT-generated description
    │   │   ├── embedding.py       # 1536-dim vectors for CVs and offers (pgvector)
    │   │   ├── chef_departement.py# Department heads (seeded manually)
    │   │   └── notification.py    # In-app notifications
    │   ├── routers/               # API endpoint groups
    │   │   ├── auth.py            # Register, login, refresh, logout
    │   │   ├── etudiants.py       # Profile, CV upload, photo, candidatures
    │   │   ├── annonces.py        # List offers (AI-sorted), apply/withdraw
    │   │   ├── entreprises.py     # Company profile, offers, candidate review
    │   │   ├── club.py            # Company validation, platform stats
    │   │   ├── validation.py      # HMAC email links (validate/reject offers)
    │   │   └── notifications.py   # Notification CRUD
    │   ├── services/              # Business logic & external integrations
    │   │   ├── cv_service.py      # PyMuPDF extraction + GPT summarization
    │   │   ├── embedding_service.py# OpenAI embeddings API calls
    │   │   ├── matching_service.py # Cosine similarity sorting
    │   │   ├── token_service.py   # HMAC-SHA256 signed link generation & validation
    │   │   ├── n8n_service.py     # Webhook to N8n for email dispatch
    │   │   └── notification_service.py
    │   └── tasks/                 # Async background jobs
    │       ├── analyze_cv.py      # CV text → GPT summary → embedding
    │       └── embed_annonce.py   # Offer text → embedding
    ├── alembic/                   # Database migrations
    └── storage/                   # Uploaded CVs and photos
```

---

## AI Matching Engine

**CV processing (triggered on upload):**
1. PyMuPDF extracts text from the student's PDF
2. GPT-4o-mini generates a 3–4 sentence summary in French
3. `text-embedding-3-small` converts the summary into a 1536-dimensional vector
4. Vector is stored in PostgreSQL via pgvector

**Offer processing (triggered on validation):**
1. Offer title + description are embedded using `text-embedding-3-small`
2. Vector is stored alongside the offer

**Matching:**
- `GET /annonces` returns offers sorted by cosine similarity with the student's CV vector
- `GET /entreprises/annonces/{id}/candidatures` returns applicants sorted by relevance to the offer
- Scores are computed server-side and never exposed in API responses

---

## Routing

```
/                                   → Login / Register
/etudiant/tableau-de-bord           → Student Dashboard
/etudiant/recherche                 → Browse Offers (AI-sorted)
/etudiant/candidatures              → My Applications
/etudiant/offre/:id                 → Offer Detail
/etudiant/profil/:id                → My Profile & CV Upload
/entreprise/tableau-de-bord         → Company Dashboard
/entreprise/publier-offre           → Publish Internship Offer
/entreprise/gestion-candidats       → Applicants (AI-sorted)
/entreprise/candidats-favoris       → Saved Candidates
/admin/interface                    → Club Dashboard
/admin/entreprises                  → Company Validation Panel
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 16 with pgvector extension
- An OpenAI API key
- An N8n instance (for email workflows)

### Frontend

```bash
cd Enim_Connect_Website
npm install
cp .env.example .env          # Set VITE_API_URL
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # Fill in all required variables
alembic upgrade head
uvicorn app.main:app --reload
```

### Environment Variables

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:8000
```

**Backend** (`.env`):
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

## Key Workflows

**Student applies to an offer:**
Student uploads CV → AI analyzes in background → Student browses AI-ranked offers → Applies → Company notified

**Company publishes an offer:**
Company creates offer → N8n sends email to department heads → Chef validates via signed link → Offer goes live → Embedding generated → Students see it ranked by relevance

**Club validates a company:**
Company registers → Club notified → Club approves → Company can publish offers
