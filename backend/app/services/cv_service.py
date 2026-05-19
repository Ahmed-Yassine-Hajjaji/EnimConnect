"""Extract text from PDF and generate AI description via gpt-4o-mini."""
import fitz  # PyMuPDF
from openai import OpenAI
from app.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

_SYSTEM = """Tu es un expert RH. Extrais du CV fourni une fiche structurée en français avec les sections suivantes (liste à puces, concis) :

Compétences techniques : langages, frameworks, outils, logiciels (liste)
Niveau et filière : école, spécialité, année d'études
Projets notables : titre + technologies utilisées (2-3 mots par projet)
Langues : langues et niveaux
Soft skills : si clairement mentionnés

Réponds UNIQUEMENT avec cette structure, sans introduction ni conclusion.
Exemple :
Compétences techniques : Python, React, SQL, TensorFlow, Git
Niveau et filière : 2A Génie Informatique, ENSMR
Projets : Chatbot NLP (Python, HuggingFace) | App web inventaire (React, FastAPI)
Langues : Arabe (natif), Français (C1), Anglais (B2)"""


def extract_text_from_pdf(file_path: str) -> str:
    doc = fitz.open(file_path)
    text = "".join(page.get_text() for page in doc)
    doc.close()
    return text.strip()


def generate_cv_description(cv_text: str) -> str:
    if not cv_text:
        return ""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": cv_text[:4000]},
        ],
        max_tokens=400,
        temperature=0.2,
    )
    return response.choices[0].message.content.strip()
