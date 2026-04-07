from __future__ import annotations

import numpy as np

from retrieval.loader import load_scale_index


class ScaleRAG:
    """BGE-small-zh + NumPy in-memory vector search."""

    def __init__(self) -> None:
        from sentence_transformers import SentenceTransformer

        self.scales = load_scale_index()
        self.model = SentenceTransformer("BAAI/bge-small-zh-v1.5")
        texts = [s["searchable_text"] for s in self.scales]
        self.embeddings: np.ndarray = self.model.encode(texts, normalize_embeddings=True)

    def search(self, query: str, top_k: int = 3, threshold: float = 0.35) -> list[dict]:
        if not query.strip():
            return []

        q_vec = self.model.encode([query], normalize_embeddings=True)
        scores = np.dot(self.embeddings, q_vec.T).flatten()
        indices = np.argsort(scores)[::-1][:top_k]
        return [
            {**self.scales[i], "score": round(float(scores[i]), 4)}
            for i in indices
            if scores[i] >= threshold
        ]


_instance: ScaleRAG | None = None


def get_scale_rag() -> ScaleRAG:
    global _instance
    if _instance is None:
        _instance = ScaleRAG()
    return _instance
