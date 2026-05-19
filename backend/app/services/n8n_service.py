"""Webhooks N8n pour le workflow de validation des annonces."""
import httpx
import logging
from typing import List, Dict, Optional
from app.config import settings
from app.services.token_service import generate_validation_token_dept

logger = logging.getLogger(__name__)


def build_chef_links_dept(validation_dept_id: str, chef_id: str) -> Dict[str, str]:
    """Génère les liens de décision pour un chef et une validation de département."""
    token = generate_validation_token_dept(validation_dept_id, chef_id)
    backend = settings.BACKEND_URL
    frontend = settings.FRONTEND_URL
    return {
        "lien_decision": f"{frontend}/decision/{validation_dept_id}?token={token}&chef_id={chef_id}",
        # Legacy backend links kept for backward compatibility
        "lien_valider": f"{backend}/valider-dept/{validation_dept_id}?token={token}&chef_id={chef_id}",
        "lien_refuser_form": f"{backend}/rejeter-form/{validation_dept_id}?token={token}&chef_id={chef_id}",
    }


async def send_validation_webhook(
    annonce_id: str,
    titre: str,
    description: str,
    nom_entreprise: str,
    departements_chefs: List[Dict],
) -> bool:
    """
    Envoie le webhook N8n pour notifier les chefs de département d'une nouvelle offre.

    Payload format:
    {
        "annonce_id": "...",
        "titre": "Stage Dev Full-Stack",
        "description": "...",
        "nom_entreprise": "OCP",
        "departements": [
            {
                "departement": "Département Informatique",
                "validation_id": "...",
                "chefs": [
                    {
                        "nom": "Dr. Alami",
                        "email": "alami@ensmr.ma",
                        "lien_valider": "https://...",
                        "lien_refuser_form": "https://..."
                    }
                ]
            }
        ]
    }
    """
    payload = {
        "annonce_id": annonce_id,
        "titre": titre,
        "description": description[:500],  # Extrait pour l'email
        "nom_entreprise": nom_entreprise,
        "departements": departements_chefs,
    }

    logger.info(f"[n8n] send_validation_webhook → {settings.N8N_WEBHOOK_URL}")
    logger.info(f"[n8n] payload annonce_id={annonce_id} titre={titre!r}")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(settings.N8N_WEBHOOK_URL, json=payload)
            logger.info(f"[n8n] response status={response.status_code} body={response.text[:200]}")
            return response.is_success
    except Exception as e:
        logger.error(f"[n8n] send_validation_webhook failed: {e}")
        return False


async def send_company_decision_webhook(
    email_entreprise: str,
    nom_entreprise: str,
    titre_offre: str,
    departement: str,
    statut: str,
    chef_nom: str,
    motif: Optional[str] = None,
    departements_valides: Optional[List[str]] = None,
    departements_en_attente: Optional[List[str]] = None,
) -> bool:
    """
    Notifie l'entreprise de la décision (validation ou rejet) d'un chef de département.

    Payload format:
    {
        "email_entreprise": "contact@ocp.ma",
        "nom_entreprise": "OCP",
        "titre_offre": "Stage Dev Full-Stack",
        "departement": "Département Informatique",
        "statut": "validee" | "rejetee",
        "chef_nom": "Dr. Alami",
        "motif": "..." | null,
        "departements_valides": ["Département Informatique"],
        "departements_en_attente": ["Département Génie Industriel"]
    }
    """
    payload = {
        "email_entreprise": email_entreprise,
        "nom_entreprise": nom_entreprise,
        "titre_offre": titre_offre,
        "departement": departement,
        "statut": statut,
        "chef_nom": chef_nom,
        "motif": motif,
        "departements_valides": departements_valides or [],
        "departements_en_attente": departements_en_attente or [],
    }

    logger.info(f"[n8n] send_company_decision_webhook → {settings.N8N_COMPANY_WEBHOOK_URL}")
    logger.info(f"[n8n] payload email={email_entreprise!r} statut={statut!r} dept={departement!r}")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(settings.N8N_COMPANY_WEBHOOK_URL, json=payload)
            logger.info(f"[n8n] response status={response.status_code} body={response.text[:200]}")
            return response.is_success
    except Exception as e:
        logger.error(f"[n8n] send_company_decision_webhook failed: {e}")
        return False
