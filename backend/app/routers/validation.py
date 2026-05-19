"""Endpoints de validation par département via liens email (HMAC-sécurisés)."""
import uuid
from datetime import datetime
from typing import Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Form, BackgroundTasks
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.annonce import Annonce, StatutAnnonce
from app.models.annonce_validation_dept import AnnonceValidationDept, StatutValidationDept
from app.models.chef_departement import ChefDepartement
from app.models.user import User
from app.models.entreprise import Entreprise
from app.services.token_service import verify_validation_token_dept
from app.services.notification_service import create_notification
from app.services.n8n_service import send_company_decision_webhook
from app.tasks.embed_annonce import embed_annonce_background

router = APIRouter(tags=["Validation"])

# ─── HTML helpers ────────────────────────────────────────────────────────────

_BASE_STYLE = """
body { font-family: system-ui, -apple-system, sans-serif; display: flex; min-height: 100vh;
       align-items: center; justify-content: center; background: #f0f7ff; margin: 0; }
.card { background: white; border-radius: 16px; padding: 40px; max-width: 520px; width: 100%;
        text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,.1); }
.icon { font-size: 56px; margin-bottom: 16px; }
h1 { margin: 0 0 10px; font-size: 22px; }
p  { color: #475569; line-height: 1.6; margin: 0 0 8px; }
.badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px;
         font-weight: 600; margin: 4px 2px; }
.green  { background: #dcfce7; color: #16a34a; }
.orange { background: #ffedd5; color: #ea580c; }
.red    { background: #fee2e2; color: #dc2626; }
"""

_FORM_STYLE = _BASE_STYLE + """
form { text-align: left; margin-top: 20px; }
label { display: block; font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 6px; }
textarea { width: 100%; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 10px 12px;
           font-size: 14px; resize: vertical; min-height: 100px; box-sizing: border-box;
           font-family: inherit; outline: none; transition: border .2s; }
textarea:focus { border-color: #3b82f6; }
.btn { display: inline-block; width: 100%; padding: 12px; border: none; border-radius: 10px;
       font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 12px; }
.btn-red  { background: #ef4444; color: white; }
.btn-red:hover { background: #dc2626; }
.info { font-size: 13px; color: #64748b; background: #f8fafc; border-radius: 8px;
        padding: 10px 14px; margin-bottom: 16px; text-align: left; }
"""


def _page(style: str, icon: str, title: str, body: str, color: str = "#1d4ed8") -> HTMLResponse:
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EnimConnect — Validation</title>
  <style>{style}</style>
</head>
<body>
  <div class="card">
    <div class="icon">{icon}</div>
    <h1 style="color:{color}">{title}</h1>
    {body}
  </div>
</body>
</html>"""
    return HTMLResponse(html)


def _dept_summary_html(annonce: Annonce, current_dept: str, current_statut: str) -> str:
    """Generate department validation status summary HTML."""
    badges = []
    for v in annonce.validations_dept:
        dept_label = v.departement
        if v.departement == current_dept:
            s = current_statut  # use new status before DB commit
        else:
            s = v.statut
        if s == "validee":
            badges.append(f'<span class="badge green">✅ {dept_label}</span>')
        elif s == "rejetee":
            badges.append(f'<span class="badge red">❌ {dept_label}</span>')
        else:
            badges.append(f'<span class="badge orange">⏳ {dept_label}</span>')
    return "<div style='margin-top:14px'>" + "".join(badges) + "</div>"


def _get_validated_depts(annonce: Annonce) -> list[str]:
    return [v.departement for v in annonce.validations_dept if v.statut == StatutValidationDept.validee]


def _get_pending_depts(annonce: Annonce) -> list[str]:
    return [v.departement for v in annonce.validations_dept if v.statut == StatutValidationDept.en_attente]


# ─── Pydantic schema ─────────────────────────────────────────────────────────

class DecisionBody(BaseModel):
    token: str
    chef_id: str
    action: Literal["valider", "refuser"]
    motif: Optional[str] = None


# ─── JSON endpoints pour la page de décision frontend ────────────────────────

@router.get("/decision/{validation_id}")
def get_decision_info(
    validation_id: str,
    token: str = Query(...),
    chef_id: str = Query(...),
    db: Session = Depends(get_db),
):
    """Vérifie le token HMAC et retourne les données de l'offre (pour la page de décision)."""
    if not verify_validation_token_dept(token, validation_id, chef_id):
        raise HTTPException(status_code=401, detail="Token invalide ou expiré (48h)")

    validation = db.query(AnnonceValidationDept).filter(
        AnnonceValidationDept.id == uuid.UUID(validation_id)
    ).first()
    if not validation:
        raise HTTPException(status_code=404, detail="Validation introuvable")

    annonce = db.query(Annonce).filter(Annonce.id == validation.annonce_id).first()
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce introuvable")

    entreprise = db.query(Entreprise).filter(Entreprise.id == annonce.entreprise_id).first()

    return {
        "validation_id": str(validation.id),
        "departement": validation.departement,
        "statut": validation.statut.value,
        "annonce": {
            "titre": annonce.titre,
            "description": annonce.description,
            "nom_entreprise": entreprise.nom_entreprise if entreprise else "",
            "duree_mois": annonce.duree_mois,
        },
    }


@router.post("/decision/{validation_id}")
def soumettre_decision(
    validation_id: str,
    body: DecisionBody,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Enregistre la décision (valider/refuser) d'un chef de département."""
    if not verify_validation_token_dept(body.token, validation_id, body.chef_id):
        raise HTTPException(status_code=401, detail="Token invalide ou expiré (48h)")

    validation = db.query(AnnonceValidationDept).filter(
        AnnonceValidationDept.id == uuid.UUID(validation_id)
    ).first()
    if not validation:
        raise HTTPException(status_code=404, detail="Validation introuvable")

    if validation.statut != StatutValidationDept.en_attente:
        status_label = "validée" if validation.statut == StatutValidationDept.validee else "rejetée"
        raise HTTPException(status_code=409, detail=f"Cette offre a déjà été {status_label} pour ce département")

    chef = db.query(ChefDepartement).filter(
        ChefDepartement.id == uuid.UUID(body.chef_id)
    ).first()
    if not chef:
        raise HTTPException(status_code=404, detail="Chef introuvable")

    annonce = db.query(Annonce).filter(Annonce.id == validation.annonce_id).first()
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce introuvable")

    if body.action == "valider":
        validation.statut = StatutValidationDept.validee
        validation.chef_id = chef.id
        validation.validated_at = datetime.utcnow()

        if annonce.statut != StatutAnnonce.validee:
            annonce.statut = StatutAnnonce.validee
            annonce.is_active = True
            annonce.validee_par = chef.id
            annonce.validee_le = datetime.utcnow()
            background_tasks.add_task(embed_annonce_background, str(annonce.id))

        # _get_validated_depts lit les objets en session : le statut est déjà
        # "validee" en mémoire, donc le département courant y est déjà inclus.
        # Ne pas faire .append() ici — ce serait un doublon.
        validated_depts = _get_validated_depts(annonce)
        pending_depts = [d for d in _get_pending_depts(annonce) if d != validation.departement]

        create_notification(
            db,
            annonce.entreprise_id,
            "Offre validée pour un département",
            f"Votre offre « {annonce.titre} » a été validée par {chef.nom} "
            f"pour le {validation.departement}.",
        )
        db.commit()

        user = db.query(User).filter(User.id == annonce.entreprise_id).first()
        if user:
            entreprise = db.query(Entreprise).filter(Entreprise.id == annonce.entreprise_id).first()
            background_tasks.add_task(
                send_company_decision_webhook,
                user.email,
                entreprise.nom_entreprise if entreprise else "",
                annonce.titre,
                validation.departement,
                "validee",
                chef.nom,
                None,
                validated_depts,
                pending_depts,
            )

        return {"success": True, "message": f"Offre validée pour le {validation.departement}"}

    else:  # refuser
        motif_clean = (body.motif or "").strip() or "Non conforme aux critères du département"

        validation.statut = StatutValidationDept.rejetee
        validation.motif = motif_clean
        validation.chef_id = chef.id
        validation.validated_at = datetime.utcnow()

        other_validations = [v for v in annonce.validations_dept if str(v.id) != validation_id]
        all_rejected = all(v.statut == StatutValidationDept.rejetee for v in other_validations)
        if all_rejected and annonce.statut == StatutAnnonce.en_attente:
            annonce.statut = StatutAnnonce.rejetee
            annonce.motif = motif_clean

        validated_depts = _get_validated_depts(annonce)
        pending_depts = [d for d in _get_pending_depts(annonce) if d != validation.departement]

        create_notification(
            db,
            annonce.entreprise_id,
            "Offre refusée pour un département",
            f"Votre offre « {annonce.titre} » a été refusée par {chef.nom} "
            f"pour le {validation.departement} : {motif_clean}",
        )
        db.commit()

        user = db.query(User).filter(User.id == annonce.entreprise_id).first()
        if user:
            entreprise = db.query(Entreprise).filter(Entreprise.id == annonce.entreprise_id).first()
            background_tasks.add_task(
                send_company_decision_webhook,
                user.email,
                entreprise.nom_entreprise if entreprise else "",
                annonce.titre,
                validation.departement,
                "rejetee",
                chef.nom,
                motif_clean,
                validated_depts,
                pending_depts,
            )

        return {"success": True, "message": f"Offre refusée pour le {validation.departement}"}


# ─── Valider (GET — action directe depuis email) ─────────────────────────────

@router.get("/valider-dept/{validation_id}", response_class=HTMLResponse)
def valider_par_dept(
    validation_id: str,
    token: str = Query(...),
    chef_id: str = Query(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
):
    if not verify_validation_token_dept(token, validation_id, chef_id):
        return _page(_BASE_STYLE, "🔒", "Lien invalide ou expiré",
                     "<p>Ce lien est invalide ou a expiré (48h).<br>Contactez le club EnimConnect.</p>",
                     "#ba1a1a")

    validation = db.query(AnnonceValidationDept).filter(
        AnnonceValidationDept.id == uuid.UUID(validation_id)
    ).first()
    if not validation:
        return _page(_BASE_STYLE, "❌", "Lien invalide",
                     "<p>Cette validation n'existe plus.</p>", "#ba1a1a")

    if validation.statut == StatutValidationDept.validee:
        chef_nom = validation.chef.nom if validation.chef else "un chef"
        return _page(_BASE_STYLE, "ℹ️", "Déjà validé",
                     f"<p>Ce département a déjà été validé par <strong>{chef_nom}</strong>. Merci !</p>")

    if validation.statut == StatutValidationDept.rejetee:
        return _page(_BASE_STYLE, "ℹ️", "Déjà traité",
                     "<p>Ce département a été rejeté précédemment.</p>")

    chef = db.query(ChefDepartement).filter(
        ChefDepartement.id == uuid.UUID(chef_id)
    ).first()
    if not chef:
        return _page(_BASE_STYLE, "❌", "Chef introuvable",
                     "<p>Identifiant chef invalide.</p>", "#ba1a1a")

    annonce = db.query(Annonce).filter(Annonce.id == validation.annonce_id).first()
    if not annonce:
        return _page(_BASE_STYLE, "❌", "Annonce introuvable",
                     "<p>Cette annonce n'existe plus.</p>", "#ba1a1a")

    # Update validation record
    validation.statut = StatutValidationDept.validee
    validation.chef_id = chef.id
    validation.validated_at = datetime.utcnow()

    # Mark overall annonce as active if not already
    if annonce.statut != StatutAnnonce.validee:
        annonce.statut = StatutAnnonce.validee
        annonce.is_active = True
        annonce.validee_par = chef.id
        annonce.validee_le = datetime.utcnow()
        background_tasks.add_task(embed_annonce_background, str(annonce.id))

    # Build department status summary (before commit).
    # statut est déjà "validee" en mémoire → _get_validated_depts inclut déjà
    # le département courant. Pas de .append() supplémentaire.
    validated_depts = _get_validated_depts(annonce)
    pending_depts = [d for d in _get_pending_depts(annonce) if d != validation.departement]

    # Notification in-app to company
    create_notification(
        db,
        annonce.entreprise_id,
        "Offre validée pour un département",
        f"Votre offre « {annonce.titre} » a été validée par {chef.nom} "
        f"pour le {validation.departement}. Elle est maintenant visible par ces étudiants.",
    )

    db.commit()

    # Notify company by email via N8n (async)
    user = db.query(User).filter(User.id == annonce.entreprise_id).first()
    if user:
        background_tasks.add_task(
            send_company_decision_webhook,
            user.email,
            (db.query(Entreprise).filter(Entreprise.id == annonce.entreprise_id).first() or type('', (), {'nom_entreprise': ''})()).nom_entreprise,
            annonce.titre,
            validation.departement,
            "validee",
            chef.nom,
            None,
            validated_depts,
            pending_depts,
        )

    summary = _dept_summary_html(annonce, validation.departement, "validee")
    return _page(
        _BASE_STYLE,
        "✅",
        "Offre validée !",
        f"<p>Merci <strong>{chef.nom}</strong> ! L'offre <strong>« {annonce.titre} »</strong> "
        f"est maintenant visible pour les étudiants du <strong>{validation.departement}</strong>.</p>"
        f"<p style='margin-top:12px;font-size:13px;color:#64748b'>Statut par département :</p>"
        + summary,
        "#16a34a",
    )


# ─── Formulaire de rejet (GET — affiche le formulaire) ───────────────────────

@router.get("/rejeter-form/{validation_id}", response_class=HTMLResponse)
def rejeter_form(
    validation_id: str,
    token: str = Query(...),
    chef_id: str = Query(...),
    db: Session = Depends(get_db),
):
    if not verify_validation_token_dept(token, validation_id, chef_id):
        return _page(_FORM_STYLE, "🔒", "Lien invalide ou expiré",
                     "<p>Ce lien est invalide ou a expiré (48h).</p>", "#ba1a1a")

    validation = db.query(AnnonceValidationDept).filter(
        AnnonceValidationDept.id == uuid.UUID(validation_id)
    ).first()
    if not validation:
        return _page(_FORM_STYLE, "❌", "Lien invalide", "<p>Validation introuvable.</p>", "#ba1a1a")

    if validation.statut != StatutValidationDept.en_attente:
        status_label = "validée" if validation.statut == StatutValidationDept.validee else "rejetée"
        return _page(_FORM_STYLE, "ℹ️", "Déjà traitée",
                     f"<p>Cette offre a déjà été {status_label} pour ce département.</p>")

    annonce = db.query(Annonce).filter(Annonce.id == validation.annonce_id).first()
    titre = annonce.titre if annonce else "Offre inconnue"
    dept = validation.departement

    form_action = f"/rejeter-dept/{validation_id}?token={token}&chef_id={chef_id}"

    body = f"""
    <p class="info">
      Offre : <strong>{titre}</strong><br>
      Département : <strong>{dept}</strong>
    </p>
    <form method="POST" action="{form_action}">
      <label for="motif">Motif du refus <span style="color:#ef4444">*</span></label>
      <textarea id="motif" name="motif" placeholder="Expliquez pourquoi cette offre ne correspond pas aux critères du département…" required></textarea>
      <button type="submit" class="btn btn-red">🚫 Confirmer le rejet</button>
    </form>
    """
    return _page(_FORM_STYLE, "🚫", f"Rejeter l'offre — {dept}", body, "#dc2626")


# ─── Traiter le rejet (POST — soumission du formulaire) ──────────────────────

@router.post("/rejeter-dept/{validation_id}", response_class=HTMLResponse)
def rejeter_par_dept(
    validation_id: str,
    token: str = Query(...),
    chef_id: str = Query(...),
    motif: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
):
    if not verify_validation_token_dept(token, validation_id, chef_id):
        return _page(_BASE_STYLE, "🔒", "Lien invalide ou expiré",
                     "<p>Ce lien est invalide ou a expiré (48h).</p>", "#ba1a1a")

    validation = db.query(AnnonceValidationDept).filter(
        AnnonceValidationDept.id == uuid.UUID(validation_id)
    ).first()
    if not validation:
        return _page(_BASE_STYLE, "❌", "Validation introuvable",
                     "<p>Impossible de traiter ce rejet.</p>", "#ba1a1a")

    if validation.statut != StatutValidationDept.en_attente:
        status_label = "validée" if validation.statut == StatutValidationDept.validee else "rejetée"
        return _page(_BASE_STYLE, "ℹ️", "Déjà traitée",
                     f"<p>Cette offre a déjà été {status_label} pour ce département.</p>")

    chef = db.query(ChefDepartement).filter(
        ChefDepartement.id == uuid.UUID(chef_id)
    ).first()
    if not chef:
        return _page(_BASE_STYLE, "❌", "Chef introuvable",
                     "<p>Identifiant chef invalide.</p>", "#ba1a1a")

    annonce = db.query(Annonce).filter(Annonce.id == validation.annonce_id).first()
    if not annonce:
        return _page(_BASE_STYLE, "❌", "Annonce introuvable",
                     "<p>Cette annonce n'existe plus.</p>", "#ba1a1a")

    motif_clean = motif.strip() or "Non conforme aux critères du département"

    # Update validation record
    validation.statut = StatutValidationDept.rejetee
    validation.motif = motif_clean
    validation.chef_id = chef.id
    validation.validated_at = datetime.utcnow()

    # If all depts rejected → mark overall annonce as rejected
    other_validations = [
        v for v in annonce.validations_dept
        if str(v.id) != validation_id
    ]
    all_rejected = all(v.statut == StatutValidationDept.rejetee for v in other_validations)
    if all_rejected and annonce.statut == StatutAnnonce.en_attente:
        annonce.statut = StatutAnnonce.rejetee
        annonce.motif = motif_clean

    validated_depts = _get_validated_depts(annonce)
    pending_depts = [d for d in _get_pending_depts(annonce) if d != validation.departement]

    # In-app notification to company
    create_notification(
        db,
        annonce.entreprise_id,
        "Offre refusée pour un département",
        f"Votre offre « {annonce.titre} » a été refusée par {chef.nom} "
        f"pour le {validation.departement} : {motif_clean}",
    )

    db.commit()

    # Email notification to company via N8n
    user = db.query(User).filter(User.id == annonce.entreprise_id).first()
    if user:
        entreprise = db.query(Entreprise).filter(Entreprise.id == annonce.entreprise_id).first()
        background_tasks.add_task(
            send_company_decision_webhook,
            user.email,
            entreprise.nom_entreprise if entreprise else "",
            annonce.titre,
            validation.departement,
            "rejetee",
            chef.nom,
            motif_clean,
            validated_depts,
            pending_depts,
        )

    summary = _dept_summary_html(annonce, validation.departement, "rejetee")
    return _page(
        _BASE_STYLE,
        "🚫",
        "Offre rejetée",
        f"<p>Merci <strong>{chef.nom}</strong>. L'offre <strong>« {annonce.titre} »</strong> "
        f"a été rejetée pour le <strong>{validation.departement}</strong>.</p>"
        f"<p><em>Motif enregistré :</em> {motif_clean}</p>"
        f"<p style='margin-top:12px;font-size:13px;color:#64748b'>Statut par département :</p>"
        + summary,
        "#dc2626",
    )


# ─── Legacy endpoints (keep for backward compat) ─────────────────────────────

@router.get("/valider/{annonce_id}", response_class=HTMLResponse)
def valider_annonce_legacy(
    annonce_id: str,
    token: str = Query(...),
    chef_id: str = Query(...),
    db: Session = Depends(get_db),
):
    """Legacy endpoint — redirect to dept-based validation if possible."""
    from app.services.token_service import verify_validation_token
    if not verify_validation_token(token, annonce_id, chef_id):
        return HTMLResponse("<p>Lien invalide ou expiré.</p>", status_code=400)

    validation = db.query(AnnonceValidationDept).filter(
        AnnonceValidationDept.annonce_id == uuid.UUID(annonce_id)
    ).first()

    if validation:
        from app.services.token_service import generate_validation_token_dept
        new_token = generate_validation_token_dept(str(validation.id), chef_id)
        from fastapi.responses import RedirectResponse
        return RedirectResponse(
            f"/valider-dept/{validation.id}?token={new_token}&chef_id={chef_id}"
        )

    return HTMLResponse("<p>Annonce introuvable.</p>", status_code=404)
