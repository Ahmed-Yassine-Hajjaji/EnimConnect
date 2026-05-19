"""Generate 1536-dim embeddings via text-embedding-3-small."""
from typing import List
from openai import OpenAI
from app.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)
EMBEDDING_MODEL = "text-embedding-3-small"


def generate_embedding(text: str) -> List[float]:
    text = text.replace("\n", " ").strip()
    if not text:
        return [0.0] * 1536
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text,
    )
    return response.data[0].embedding
