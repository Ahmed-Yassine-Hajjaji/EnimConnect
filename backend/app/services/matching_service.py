"""Cosine similarity matching — scores NEVER exposed in API responses."""
from typing import List, Tuple, Set
import uuid
from sqlalchemy.orm import Session
from app.models.embedding import Embedding, SourceType
from app.models.annonce import Annonce, StatutAnnonce
from app.models.candidature import Candidature


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def get_annonces_sorted_by_cv(
    db: Session, etudiant_id: uuid.UUID
) -> List[Annonce]:
    """Return active validated annonces sorted by cosine similarity with student CV.
    Falls back to created_at order if no CV embedding exists."""
    from app.models.cv import CV

    cv = db.query(CV).filter(CV.etudiant_id == etudiant_id).first()
    annonces = (
        db.query(Annonce)
        .filter(Annonce.statut == StatutAnnonce.validee, Annonce.is_active == True)
        .all()
    )

    if not cv:
        return annonces

    cv_embedding = (
        db.query(Embedding)
        .filter(
            Embedding.source_type == SourceType.cv,
            Embedding.source_id == cv.id,
        )
        .first()
    )
    if not cv_embedding:
        return annonces

    cv_vec = cv_embedding.vecteur
    annonce_ids = [a.id for a in annonces]
    ann_embeddings = {
        e.source_id: e
        for e in db.query(Embedding).filter(
            Embedding.source_type == SourceType.annonce,
            Embedding.source_id.in_(annonce_ids),
        ).all()
    }

    scored: List[Tuple[float, Annonce]] = []
    for annonce in annonces:
        ann_embedding = ann_embeddings.get(annonce.id)
        score = _cosine_similarity(cv_vec, ann_embedding.vecteur) if ann_embedding else 0.0
        scored.append((score, annonce))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [annonce for _, annonce in scored]


def get_annonces_sorted_by_cv_for_dept(
    db: Session, etudiant_id: uuid.UUID, allowed_annonce_ids: Set[str]
) -> List[Annonce]:
    """Return annonces validated for student's department, sorted by cosine similarity.
    Only includes annonces whose IDs are in allowed_annonce_ids."""
    from app.models.cv import CV

    if not allowed_annonce_ids:
        return []

    cv = db.query(CV).filter(CV.etudiant_id == etudiant_id).first()

    # Filter annonces to only those validated for student's dept
    annonces = (
        db.query(Annonce)
        .filter(
            Annonce.statut == StatutAnnonce.validee,
            Annonce.is_active == True,
            Annonce.id.in_([uuid.UUID(aid) for aid in allowed_annonce_ids]),
        )
        .all()
    )

    if not cv:
        return annonces

    cv_embedding = (
        db.query(Embedding)
        .filter(
            Embedding.source_type == SourceType.cv,
            Embedding.source_id == cv.id,
        )
        .first()
    )
    if not cv_embedding:
        return annonces

    cv_vec = cv_embedding.vecteur

    # Load all annonce embeddings in one query instead of N queries
    annonce_ids = [a.id for a in annonces]
    ann_embeddings = {
        e.source_id: e
        for e in db.query(Embedding).filter(
            Embedding.source_type == SourceType.annonce,
            Embedding.source_id.in_(annonce_ids),
        ).all()
    }

    scored: List[Tuple[float, Annonce]] = []
    for annonce in annonces:
        ann_embedding = ann_embeddings.get(annonce.id)
        score = _cosine_similarity(cv_vec, ann_embedding.vecteur) if ann_embedding else 0.0
        scored.append((score, annonce))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [annonce for _, annonce in scored]


def get_candidats_sorted_by_annonce(
    db: Session, annonce_id: uuid.UUID
) -> List[Tuple[Candidature, dict]]:
    """Return candidatures for an annonce sorted by cosine similarity.
    Returns list of (candidature, etudiant, cv) without exposing scores."""
    from app.models.etudiant import Etudiant
    from app.models.cv import CV

    ann_embedding = (
        db.query(Embedding)
        .filter(
            Embedding.source_type == SourceType.annonce,
            Embedding.source_id == annonce_id,
        )
        .first()
    )

    candidatures = (
        db.query(Candidature)
        .filter(Candidature.annonce_id == annonce_id)
        .all()
    )

    if not candidatures:
        return []

    etudiant_ids = [c.etudiant_id for c in candidatures]

    # Load all etudiants and CVs in bulk
    etudiants = {
        e.id: e for e in db.query(Etudiant).filter(Etudiant.id.in_(etudiant_ids)).all()
    }
    cvs = {
        cv.etudiant_id: cv for cv in db.query(CV).filter(CV.etudiant_id.in_(etudiant_ids)).all()
    }

    if not ann_embedding:
        result = []
        for cand in candidatures:
            result.append((cand, etudiants.get(cand.etudiant_id), cvs.get(cand.etudiant_id)))
        return result

    ann_vec = ann_embedding.vecteur

    # Load all CV embeddings in bulk
    cv_ids = [cv.id for cv in cvs.values()]
    cv_embeddings = {
        e.source_id: e
        for e in db.query(Embedding).filter(
            Embedding.source_type == SourceType.cv,
            Embedding.source_id.in_(cv_ids),
        ).all()
    }

    scored = []
    for cand in candidatures:
        etudiant = etudiants.get(cand.etudiant_id)
        cv = cvs.get(cand.etudiant_id)
        score = 0.0
        if cv:
            cv_emb = cv_embeddings.get(cv.id)
            if cv_emb:
                score = _cosine_similarity(ann_vec, cv_emb.vecteur)
        scored.append((score, cand, etudiant, cv))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [(cand, etudiant, cv) for _, cand, etudiant, cv in scored]
