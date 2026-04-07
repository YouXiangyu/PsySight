from __future__ import annotations

from retrieval.loader import load_scale_index


class ScaleIndexSearch:
    """Structured keyword-based scale search."""

    def __init__(self) -> None:
        self.scales = load_scale_index()

    def search(self, symptoms: list[str], top_k: int = 3) -> list[dict]:
        if not symptoms:
            return []

        symptom_set = set(symptoms)
        scored: list[tuple[int, dict]] = []

        for scale in self.scales:
            scale_symptoms = set(scale.get("symptoms", []))
            overlap = symptom_set & scale_symptoms
            if overlap:
                scored.append((len(overlap), {**scale, "score": len(overlap), "matched": list(overlap)}))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [item for _, item in scored[:top_k]]


_instance: ScaleIndexSearch | None = None


def get_scale_index_search() -> ScaleIndexSearch:
    global _instance
    if _instance is None:
        _instance = ScaleIndexSearch()
    return _instance
