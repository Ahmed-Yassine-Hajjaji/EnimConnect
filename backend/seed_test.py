"""
Script de seed pour les tests locaux.
Crée : 1 étudiant, 1 entreprise (validée), 1 chef de département, 1 admin club.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.user import User, RoleEnum
from app.models.etudiant import Etudiant, NiveauEnum
from app.models.entreprise import Entreprise
from app.models.chef_departement import ChefDepartement
from app.services.auth_service import hash_password
import uuid

db = SessionLocal()

try:
    # ── Éviter les doublons ────────────────────────────────────────────────
    if db.query(User).filter(User.email == "etudiant@test.ma").first():
        print("⚠️  Seed déjà effectué. Aucune modification.")
        sys.exit(0)

    # ── 1. Compte étudiant ─────────────────────────────────────────────────
    u_etudiant = User(
        id=uuid.uuid4(),
        email="etudiant@test.ma",
        password_hash=hash_password("Test1234!"),
        role=RoleEnum.etudiant,
        is_active=True,
    )
    db.add(u_etudiant)
    db.flush()

    etudiant = Etudiant(
        id=u_etudiant.id,
        nom="Benali",
        prenom="Yassine",
        departement="Département Informatique",
        filiere="Génie Informatique (GI)",
        niveau=NiveauEnum.trois_a,
        competences=["Python", "React", "FastAPI", "SQL"],
        langues=["Arabe", "Français", "Anglais"],
    )
    db.add(etudiant)

    # ── 2. Compte entreprise (pré-validée) ─────────────────────────────────
    u_entreprise = User(
        id=uuid.uuid4(),
        email="ocp@test.ma",
        password_hash=hash_password("Test1234!"),
        role=RoleEnum.entreprise,
        is_active=True,
    )
    db.add(u_entreprise)
    db.flush()

    entreprise = Entreprise(
        id=u_entreprise.id,
        nom_entreprise="OCP Group",
        secteur="Industrie minière",
        ville="Khouribga",
        valide=True,
    )
    db.add(entreprise)

    # ── 3. Admin club ──────────────────────────────────────────────────────
    u_club = User(
        id=uuid.uuid4(),
        email="club@test.ma",
        password_hash=hash_password("Test1234!"),
        role=RoleEnum.club,
        is_active=True,
    )
    db.add(u_club)

    # ── 4. Chef de département (table séparée, pas de compte User) ─────────
    chef = ChefDepartement(
        id=uuid.uuid4(),
        nom="Dr. Alami Mohammed",
        email="chef.info@test.ma",
        departement="Département Informatique",
    )
    db.add(chef)

    db.commit()
    print("✅ Seed réussi !")
    print()
    print("═" * 50)
    print("  COMPTES DE TEST")
    print("═" * 50)
    print()
    print("👤 ÉTUDIANT")
    print("   Email    : etudiant@test.ma")
    print("   Password : Test1234!")
    print("   Dept     : Département Informatique")
    print()
    print("🏢 ENTREPRISE  (déjà validée)")
    print("   Email    : ocp@test.ma")
    print("   Password : Test1234!")
    print()
    print("🛡️  ADMIN CLUB")
    print("   Email    : club@test.ma")
    print("   Password : Test1234!")
    print()
    print("👨‍💼 CHEF DE DÉPARTEMENT  (validation email)")
    print("   Email    : chef.info@test.ma")
    print("   Dept     : Département Informatique")
    print("   (pas de compte web — reçoit les emails de validation)")
    print()
    print("🌐 Frontend : http://localhost:5173")
    print("📡 API docs : http://localhost:8000/docs")

except Exception as e:
    db.rollback()
    print(f"❌ Erreur : {e}")
    import traceback; traceback.print_exc()
finally:
    db.close()
