# Déploiement EnimConnect sur AWS EC2

## Prérequis

- Instance EC2 (Ubuntu 22.04 LTS recommandé, t3.small minimum)
- Security Group : ports **22** (SSH) et **80** (HTTP) ouverts
- Clé SSH `.pem` pour se connecter

---

## Étape 1 — Lancer l'instance EC2

1. Créer une instance EC2 dans la console AWS :
   - AMI : **Ubuntu Server 22.04 LTS**
   - Type : `t3.small` (2 vCPU, 2 GB RAM) minimum
   - Stockage : 20 GB minimum
   - Security Group :
     - Entrée TCP 22 → `0.0.0.0/0` (SSH)
     - Entrée TCP 80 → `0.0.0.0/0` (HTTP)

2. Noter l'IP publique de l'instance.

---

## Étape 2 — Se connecter en SSH

```bash
chmod 400 votre-cle.pem
ssh -i votre-cle.pem ubuntu@VOTRE_IP_EC2
```

---

## Étape 3 — Installer Docker sur l'instance EC2

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com | sudo sh

# Ajouter l'utilisateur au groupe docker (évite sudo)
sudo usermod -aG docker ubuntu

# Se déconnecter et se reconnecter pour appliquer le groupe
exit
# Puis : ssh -i votre-cle.pem ubuntu@VOTRE_IP_EC2

# Vérifier
docker --version
docker compose version
```

---

## Étape 4 — Cloner le projet

```bash
git clone https://github.com/VOTRE_USERNAME/enimconnect.git
cd enimconnect
```

---

## Étape 5 — Configurer les variables d'environnement

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Remplir **toutes** les valeurs :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | URL Supabase PostgreSQL |
| `SECRET_KEY` | Chaîne aléatoire 64 chars |
| `HMAC_SECRET` | Chaîne aléatoire 64 chars |
| `OPENAI_API_KEY` | Clé OpenAI |
| `FRONTEND_URL` | `http://VOTRE_IP_EC2` |
| `BACKEND_URL` | `http://VOTRE_IP_EC2` |
| `N8N_SMTP_USER` | Email Gmail |
| `N8N_SMTP_PASS` | Mot de passe application Gmail |
| `CHEF_*_EMAIL` | Emails des chefs de département |

> **Générer SECRET_KEY et HMAC_SECRET :**
> ```bash
> python3 -c "import secrets; print(secrets.token_hex(32))"
> ```

---

## Étape 6 — Premier déploiement

```bash
chmod +x deploy.sh
./deploy.sh
```

Ce script :
1. Pull le code depuis GitHub
2. Arrête les services existants
3. Rebuild les images Docker
4. Démarre tout en arrière-plan
5. Lance le seed des chefs de département

---

## Étape 7 — Vérifier que tout fonctionne

```bash
# Voir les logs
docker compose -f docker-compose.prod.yml logs -f

# Vérifier les services
docker compose -f docker-compose.prod.yml ps

# Test santé de l'API
curl http://VOTRE_IP_EC2/health
```

Accès :
- **Site** : `http://VOTRE_IP_EC2`
- **API docs** : `http://VOTRE_IP_EC2/docs`

---

## Étape 8 — Importer les workflows N8n

1. Accéder à N8n depuis l'intérieur du serveur :
   ```bash
   # Port forward depuis votre machine locale
   ssh -i votre-cle.pem -L 5678:localhost:5678 ubuntu@VOTRE_IP_EC2
   ```
   Puis ouvrir `http://localhost:5678` dans votre navigateur.

2. Importer les deux workflows depuis `n8n/` :
   - `EnimConnect – Notifier chefs de département (nouvelle offre).json`
   - Workflow de décision entreprise

---

## Étape 9 — Créer les comptes de test (optionnel)

```bash
docker compose -f docker-compose.prod.yml exec backend python seed_test.py
```

---

## Mises à jour futures

Depuis le serveur EC2 :

```bash
cd ~/enimconnect
./deploy.sh
```

---

## Commandes utiles

```bash
# Voir les logs d'un service spécifique
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend

# Redémarrer un service sans rebuild
docker compose -f docker-compose.prod.yml restart backend

# Accéder au shell du backend
docker compose -f docker-compose.prod.yml exec backend bash

# Arrêter tout (sans supprimer les volumes)
docker compose -f docker-compose.prod.yml down

# Arrêter et supprimer les volumes (ATTENTION : efface CVs et photos si volume nommé)
docker compose -f docker-compose.prod.yml down -v

# Voir l'espace disque utilisé par Docker
docker system df
```

---

## Architecture de production

```
Internet
    │
    ▼ :80
 nginx (frontend container)
    ├── /auth, /etudiants, /annonces, /entreprises,
    │   /club, /notifications, /decision, /api, /storage → backend:8000
    ├── /webhook/*                                        → n8n:5678
    └── /*                                               → fichiers statiques React

 backend:8000   (FastAPI, uvicorn, réseau Docker interne)
 n8n:5678       (réseau Docker interne uniquement)
```

---

## Sécurité — Points importants

- `backend/.env` ne doit **jamais** être commité (dans `.gitignore`)
- Les CVs et photos sont dans un **volume Docker nommé** (persistant, hors du repo)
- N8n n'est **pas exposé** sur internet (port 5678 interne uniquement)
- Pour HTTPS, utiliser un domaine + Certbot (Let's Encrypt) — voir guide Nginx + Certbot
