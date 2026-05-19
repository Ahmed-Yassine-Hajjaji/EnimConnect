# EnimConnect — Instructions pour Claude

## Environnement de travail
- **OS cible** : WSL (Windows Subsystem for Linux) sur Windows
- **Ne jamais** supposer un environnement Linux natif — toujours cibler WSL

## Setup initial (à faire UNE SEULE FOIS sur la nouvelle machine)

Si l'utilisateur dit "fais le setup" ou "installe le projet", exécute ces étapes dans l'ordre :

### 1. Vérifier WSL et les outils
```bash
python3 --version      # besoin de 3.11+
node --version         # besoin de 20+
docker --version       # Docker Desktop doit être lancé sur Windows
```

Si un outil manque, installe-le :
- Python : `sudo apt install python3.11 python3.11-pip`
- Node : `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install nodejs`
- Docker : doit être installé sur Windows (Docker Desktop), pas dans WSL directement

### 2. Copier la mémoire Claude
Le dossier `.claude` se trouve à la racine du disque dur externe.
Dans WSL, copier vers le home :
```bash
cp -r /mnt/<lettre-disque>/.claude ~/.claude
```

### 3. Installer les dépendances backend
```bash
cd backend
pip install -r requirements.txt
```

### 4. Installer les dépendances frontend
```bash
cd Enim_Connect_Website
npm install
```

### 5. Vérifier le fichier .env backend
Le fichier `backend/.env` doit exister avec ces variables :
```
DATABASE_URL=postgresql://...        # Supabase
SECRET_KEY=...
OPENAI_API_KEY=...
HMAC_SECRET=...
N8N_WEBHOOK_URL=...
N8N_COMPANY_WEBHOOK_URL=...
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
STORAGE_PATH=./storage
```
Si le fichier n'existe pas, demander à l'utilisateur les valeurs ou les récupérer depuis le disque externe.

### 6. Lancer le projet
**Option A — Docker (recommandé, plus simple) :**
```bash
docker compose up
```
Site : http://localhost:5173 | API : http://localhost:8000/docs

**Option B — Sans Docker :**
```bash
# Terminal 1 — Backend
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd Enim_Connect_Website && npm run dev
```

---

## Comptes de test
| Rôle | Email | Password |
|------|-------|----------|
| Étudiant | etudiant@test.ma | Test1234! |
| Entreprise | ocp@test.ma | Test1234! |
| Admin Club | club@test.ma | Test1234! |

Si les comptes n'existent pas encore en base :
```bash
cd backend && python seed_test.py
```

---

## Stack technique
- **Frontend** : React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend** : FastAPI + Python + SQLAlchemy + PostgreSQL (Supabase)
- **IA** : OpenAI GPT-4o + text-embedding-3-small + pgvector
- **Auth** : JWT (access + refresh tokens) + HMAC-SHA256 (liens email)
- **Emails** : N8n workflows (voir `/n8n/`)
- **Base de données** : Supabase (PostgreSQL cloud)

## Architecture clé
- `AnnonceValidationDept` : chaque offre est validée **par département** indépendamment
- Les étudiants voient uniquement les offres validées par le chef de **leur** département
- Les chefs de département reçoivent des emails avec liens directs valider/refuser (HMAC sécurisé, 48h)

## Fichiers importants
- `backend/app/routers/` — tous les endpoints API
- `backend/app/services/n8n_service.py` — webhooks N8n
- `backend/app/routers/validation.py` — logique de validation par dept
- `Enim_Connect_Website/src/constants/ensmr.ts` — départements et filières ENSMR
- `n8n/` — workflows N8n à importer (chef notification + company decision)
