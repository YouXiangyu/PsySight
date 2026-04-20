from __future__ import annotations

import unittest

from recommendation.engine import build_recommendation_plan


class RecommendationEngineTests(unittest.TestCase):
    def test_explicit_insomnia_request_recommends_on_first_turn(self) -> None:
        plan = build_recommendation_plan(
            {"turn_count": 0, "scale_scores": {}},
            "我需要一个失眠量表，最好能快一点。",
        )

        self.assertTrue(plan["analysis"]["explicit_request"])
        self.assertTrue(plan["should_recommend"])
        self.assertEqual(plan["recommended_scales"][0]["code"], "ais")

    def test_sleep_signals_accumulate_into_recommendation(self) -> None:
        first_plan = build_recommendation_plan(
            {"turn_count": 0, "scale_scores": {}},
            "最近总觉得睡得不踏实。",
        )
        second_plan = build_recommendation_plan(
            {"turn_count": 1, "scale_scores": first_plan["scale_scores"]},
            "白天也总犯困，整个人没精神。",
        )

        self.assertEqual(first_plan["recommended_scales"][0]["code"], "psqi")
        self.assertTrue(second_plan["should_recommend"])
        self.assertEqual(second_plan["recommended_scales"][0]["code"], "psqi")

    def test_hidden_social_anxiety_prefers_sias(self) -> None:
        plan = build_recommendation_plan(
            {"turn_count": 0, "scale_scores": {}},
            "我不是不想社交，就是一见到人就紧张，总担心别人怎么看我，能躲就躲。",
        )

        self.assertFalse(plan["analysis"]["explicit_request"])
        self.assertIn("social_anxiety", plan["analysis"]["domains"])
        self.assertTrue(plan["should_recommend"])
        self.assertEqual(plan["recommended_scales"][0]["code"], "sias")


if __name__ == "__main__":
    unittest.main()
