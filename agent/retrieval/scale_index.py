from __future__ import annotations

from retrieval.loader import load_scale_index


class ScaleIndexSearch:
    """Keyword-based scale search with substring matching and searchable_text support."""

    def __init__(self) -> None:
        self.scales = load_scale_index()

    def _substring_match_score(self, keyword: str, scale: dict) -> float:
        """Score a single keyword against a scale using substring matching.

        Scoring: exact symptom match = 2.0, substring in symptom = 1.0,
        substring in searchable_text = 0.5, category match = 0.3.
        """
        score = 0.0
        scale_symptoms = scale.get("symptoms", [])
        searchable = scale.get("searchable_text", "")
        category = scale.get("category", "")

        for symptom in scale_symptoms:
            if keyword in symptom or symptom in keyword:
                score += 1.0
                break

        if keyword in searchable:
            score += 0.5

        if keyword in category or category in keyword:
            score += 0.3

        return score

    def search(self, keywords: list[str], top_k: int = 3) -> list[dict]:
        if not keywords:
            return []

        scored: list[tuple[float, dict]] = []

        for scale in self.scales:
            total_score = 0.0
            matched: list[str] = []
            for kw in keywords:
                s = self._substring_match_score(kw, scale)
                if s > 0:
                    total_score += s
                    matched.append(kw)

            if total_score > 0:
                scored.append((total_score, {**scale, "score": total_score, "matched": matched}))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [item for _, item in scored[:top_k]]


_instance: ScaleIndexSearch | None = None


def get_scale_index_search() -> ScaleIndexSearch:
    global _instance
    if _instance is None:
        _instance = ScaleIndexSearch()
    return _instance
