#!/bin/bash
set -e

echo "==> Mise à jour du code..."
git pull origin main

echo "==> Arrêt des services..."
docker compose -f docker-compose.prod.yml down

echo "==> Build et démarrage des services..."
docker compose -f docker-compose.prod.yml up -d --build

echo "==> Attente du démarrage du backend (15s)..."
sleep 15

echo "==> Seed des chefs de département..."
docker compose -f docker-compose.prod.yml exec backend python scripts/seed_chefs.py

echo ""
echo "✓ Déploiement terminé."
echo "  Site      : http://$(curl -s ifconfig.me 2>/dev/null || echo 'VOTRE_IP')"
echo "  API docs  : http://$(curl -s ifconfig.me 2>/dev/null || echo 'VOTRE_IP')/docs"
echo "  N8n       : accès interne uniquement (port 5678 non exposé)"
