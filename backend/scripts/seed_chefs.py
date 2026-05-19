"""
Insère ou met à jour les 7 chefs de département ENSMR en base.
Les emails sont lus depuis les variables d'environnement (.env) :
  CHEF_INFO_EMAIL, CHEF_MAT_EMAIL, CHEF_EM_EMAIL, CHEF_GI_EMAIL,
  CHEF_GPI_EMAIL, CHEF_ST_EMAIL, CHEF_MINES_EMAIL

Usage (depuis backend/) :
  python scripts/seed_chefs.py
"""
import sys
import os

# Allow running from backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.chef_departement import ChefDepartement
from app.config import settings

def _resolve_email(raw_email: str, alias: str) -> str:
    """
    Si l'email contient '@', utilise tel quel.
    Sinon, on ne devrait pas arriver ici (filtré avant).
    Pour les tests avec un seul email Gmail, ajoute automatiquement un alias +dept
    si le même email est réutilisé pour plusieurs départements.
    Ex: vlazgoytb@gmail.com → vlazgoytb+info@gmail.com
    Gmail ignore la partie après '+', tous les emails arrivent dans la même boîte.
    """
    if "+" in raw_email.split("@")[0]:
        return raw_email  # déjà un alias, on respecte
    local, domain = raw_email.split("@", 1)
    return f"{local}+{alias}@{domain}"


CHEFS = [
    {
        "departement": "Département Informatique",
        "nom": "Chef Département Informatique",
        "email_raw": settings.CHEF_INFO_EMAIL,
        "alias": "info",
    },
    {
        "departement": "Département Génie des Matériaux",
        "nom": "Chef Département Génie des Matériaux",
        "email_raw": settings.CHEF_MAT_EMAIL,
        "alias": "mat",
    },
    {
        "departement": "Département Électromécanique",
        "nom": "Chef Département Électromécanique",
        "email_raw": settings.CHEF_EM_EMAIL,
        "alias": "em",
    },
    {
        "departement": "Département Génie Industriel",
        "nom": "Chef Département Génie Industriel",
        "email_raw": settings.CHEF_GI_EMAIL,
        "alias": "gi",
    },
    {
        "departement": "Département Génie des Procédés Industriels",
        "nom": "Chef Département Génie des Procédés Industriels",
        "email_raw": settings.CHEF_GPI_EMAIL,
        "alias": "gpi",
    },
    {
        "departement": "Département Sciences de la Terre",
        "nom": "Chef Département Sciences de la Terre",
        "email_raw": settings.CHEF_ST_EMAIL,
        "alias": "st",
    },
    {
        "departement": "Département Mines",
        "nom": "Chef Département Mines",
        "email_raw": settings.CHEF_MINES_EMAIL,
        "alias": "mines",
    },
]


def seed():
    db = SessionLocal()
    try:
        inserted = 0
        updated = 0

        for chef_data in CHEFS:
            if not chef_data["email_raw"]:
                print(f"[SKIP] {chef_data['departement']} — email non configuré (variable .env vide)")
                continue

            email = _resolve_email(chef_data["email_raw"], chef_data["alias"])

            existing_by_dept = (
                db.query(ChefDepartement)
                .filter(ChefDepartement.departement == chef_data["departement"])
                .first()
            )

            if existing_by_dept:
                existing_by_dept.nom = chef_data["nom"]
                existing_by_dept.email = email
                print(f"[UPDATE] {chef_data['departement']} → {email}")
                updated += 1
            else:
                chef = ChefDepartement(
                    nom=chef_data["nom"],
                    email=email,
                    departement=chef_data["departement"],
                )
                db.add(chef)
                print(f"[INSERT] {chef_data['departement']} → {email}")
                inserted += 1

        db.commit()
        print(f"\nTerminé : {inserted} insérés, {updated} mis à jour.")

    except Exception as e:
        db.rollback()
        print(f"Erreur : {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
