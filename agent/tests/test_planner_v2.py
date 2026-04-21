
from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from agent.recommendation.planner_v2 import build_adaptive_recommendation_plan, extract_evidence

class PlannerV2Tests(unittest.TestCase):
    def test_explicit_insomnia_request_recommends_ais_first_turn(self):
        plan = build_adaptive_recommendation_plan({"turn_count": 0, "scale_scores": {}}, "我需要一个失眠量表，最好快一点。")
        self.assertEqual(plan["policy_action"], "direct_recommend")
        self.assertTrue(plan["recommended_scales"])
        self.assertEqual(plan["recommended_scales"][0]["code"], "ais")

    def test_sleep_quality_prefers_psqi(self):
        plan = build_adaptive_recommendation_plan({"turn_count": 0, "scale_scores": {}}, "最近睡得很浅，白天上课整个人都没精神。")
        codes = [x["code"] for x in plan["ranked_candidates"][:2]]
        self.assertIn("psqi", codes)
        self.assertEqual(plan["ranked_candidates"][0]["code"], "psqi")

    def test_sleep_ambiguity_generates_clarify_slot(self):
        evidence = extract_evidence("最近总睡不好，有时候也会半夜醒，白天还很困。", {})
        self.assertIn("insomnia_vs_broad_sleep_decline", evidence["uncertainty_slots"])

    def test_hidden_social_anxiety_prefers_sias(self):
        plan = build_adaptive_recommendation_plan({"turn_count": 0, "scale_scores": {}}, "我不是不想社交，就是一见到人就紧张，总担心别人怎么看我，能躲就躲。")
        self.assertEqual(plan["ranked_candidates"][0]["code"], "sias")

    def test_two_turn_accumulation_pushes_sleep_recommendation(self):
        first = build_adaptive_recommendation_plan({"turn_count": 0, "scale_scores": {}}, "最近睡得很不踏实。")
        second = build_adaptive_recommendation_plan({"turn_count": 1, "scale_scores": first["scale_scores"]}, "而且白天上课总犯困，感觉精力不够。")
        self.assertIn(second["policy_action"], ("strategic_clarify", "direct_recommend"))
        self.assertEqual(second["ranked_candidates"][0]["code"], "psqi")

    def test_general_distress_falls_back_to_broad_screening(self):
        plan = build_adaptive_recommendation_plan({"turn_count": 0, "scale_scores": {}}, "最近整个人状态都不太对，很多方面都很难受。")
        top_codes = [x["code"] for x in plan["ranked_candidates"][:3]]
        self.assertTrue(any(code in top_codes for code in ("k10", "dass21", "scl90")))

    def test_impostor_signal_recognized(self):
        plan = build_adaptive_recommendation_plan({"turn_count": 0, "scale_scores": {}}, "我总觉得自己是假的，别人迟早会发现我没有那么厉害。")
        self.assertEqual(plan["ranked_candidates"][0]["code"], "is")


if __name__ == "__main__":
    unittest.main(verbosity=2)
