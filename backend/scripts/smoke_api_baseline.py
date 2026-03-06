import os
import sys
import tempfile
import unittest
import uuid
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

_db_path = Path(tempfile.gettempdir()) / f"psysight_smoke_{uuid.uuid4().hex}.db"
os.environ["DATABASE_URL"] = f"sqlite:///{_db_path.as_posix()}"
os.environ["DEEPSEEK_API_KEY"] = ""
os.environ["ADMIN_EXPORT_TOKEN"] = "smoke-admin-token"
os.environ["SECRET_KEY"] = "smoke-secret-key"

import app as backend_app  # noqa: E402


class BaselineApiSmokeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.app = backend_app.app
        cls.db = backend_app.db
        cls.Scale = backend_app.Scale

        cls.client_user = cls.app.test_client()
        cls.client_other = cls.app.test_client()

        with cls.app.app_context():
            cls.db.drop_all()
            cls.db.create_all()
            cls._seed_scales()

        cls.user_email = "baseline_user@example.com"
        cls.user_password = "123456"
        cls.other_email = "baseline_other@example.com"
        cls.other_password = "123456"
        cls.ais_scale_id = None
        cls.record_id = None

    @classmethod
    def _seed_scales(cls) -> None:
        scales = [
            cls.Scale(
                code="phq9",
                title="PHQ-9 抑郁症筛查量表",
                category="情绪",
                estimated_minutes=5,
                description="抑郁筛查",
                questions=[
                    {"id": "q1", "text": "做事缺乏兴趣", "options": [{"label": "几乎没有", "score": 0}, {"label": "超过一半天数", "score": 2}]},
                    {"id": "q2", "text": "情绪低落", "options": [{"label": "几乎没有", "score": 0}, {"label": "超过一半天数", "score": 2}]},
                ],
                scoring_rules="总分越高风险越高",
            ),
            cls.Scale(
                code="gad7",
                title="GAD-7 焦虑症筛查量表",
                category="情绪",
                estimated_minutes=5,
                description="焦虑筛查",
                questions=[
                    {"id": "q1", "text": "感到紧张", "options": [{"label": "几乎没有", "score": 0}, {"label": "超过一半天数", "score": 2}]},
                    {"id": "q2", "text": "无法控制担忧", "options": [{"label": "几乎没有", "score": 0}, {"label": "超过一半天数", "score": 2}]},
                ],
                scoring_rules="总分越高风险越高",
            ),
            cls.Scale(
                code="ais",
                title="AIS 阿森斯失眠量表",
                category="睡眠",
                estimated_minutes=5,
                description="失眠筛查",
                questions=[
                    {"id": "q1", "text": "入睡困难", "options": [{"label": "没有", "score": 0}, {"label": "明显", "score": 3}]},
                    {"id": "q2", "text": "夜间醒来", "options": [{"label": "没有", "score": 0}, {"label": "明显", "score": 3}]},
                    {"id": "q3", "text": "醒后乏力", "options": [{"label": "没有", "score": 0}, {"label": "明显", "score": 3}]},
                ],
                scoring_rules="总分越高风险越高",
            ),
        ]
        for item in scales:
            cls.db.session.add(item)
        cls.db.session.commit()

    def test_01_health_ok(self) -> None:
        response = self.client_user.get("/api/health")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["status"], "ok")

    def test_02_metrics_ok(self) -> None:
        response = self.client_user.get("/api/metrics/availability")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertIn("availability_percent", payload)

    def test_03_auth_flow(self) -> None:
        register_resp = self.client_user.post(
            "/api/auth/register",
            json={"email": self.user_email, "password": self.user_password, "username": "baseline_user"},
        )
        self.assertEqual(register_resp.status_code, 200)

        me_resp = self.client_user.get("/api/auth/me")
        self.assertEqual(me_resp.status_code, 200)
        self.assertTrue(me_resp.get_json()["authenticated"])

        logout_resp = self.client_user.post("/api/auth/logout")
        self.assertEqual(logout_resp.status_code, 200)
        self.assertTrue(logout_resp.get_json()["ok"])

        me_after_logout = self.client_user.get("/api/auth/me")
        self.assertFalse(me_after_logout.get_json()["authenticated"])

        login_resp = self.client_user.post(
            "/api/auth/login",
            json={"email": self.user_email, "password": self.user_password},
        )
        self.assertEqual(login_resp.status_code, 200)

    def test_04_chat_anonymous(self) -> None:
        response = self.client_other.post(
            "/api/chat",
            json={"message": "最近学习压力有点大。", "anonymous": True},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertTrue(bool(payload.get("reply")))

    def test_05_chat_crisis(self) -> None:
        response = self.client_other.post(
            "/api/chat",
            json={"message": "我有时候会想死，不知道怎么办。", "anonymous": True},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertTrue(payload["crisis_alert"]["show"])
        self.assertGreaterEqual(len(payload["crisis_alert"]["hotlines"]), 2)

    def test_06_scales_and_recommend(self) -> None:
        list_resp = self.client_user.get("/api/scales")
        self.assertEqual(list_resp.status_code, 200)
        items = list_resp.get_json().get("items", [])
        self.assertGreaterEqual(len(items), 3)

        ais = next((item for item in items if item.get("code") == "ais"), None)
        self.assertIsNotNone(ais)
        self.__class__.ais_scale_id = ais["id"]

        recommend_resp = self.client_user.post("/api/scales/recommend", json={"text": "最近一直睡不着"})
        self.assertEqual(recommend_resp.status_code, 200)
        recommended = recommend_resp.get_json().get("recommended", [])
        self.assertTrue(recommended)
        self.assertEqual(recommended[0]["code"], "ais")

    def test_07_submit_and_report_owner_access(self) -> None:
        self.assertIsNotNone(self.ais_scale_id)
        submit_resp = self.client_user.post(
            "/api/submit",
            json={
                "scale_id": self.ais_scale_id,
                "answers": {"q1": 3, "q2": 2, "q3": 2},
                "emotion_log": {"neutral": 0.8},
                "emotion_consent": True,
                "anonymous": False,
            },
        )
        self.assertEqual(submit_resp.status_code, 200)
        payload = submit_resp.get_json()
        self.__class__.record_id = payload["record_id"]
        self.assertIn("severity_level", payload)

        report_resp = self.client_user.get(f"/api/report/{self.record_id}")
        self.assertEqual(report_resp.status_code, 200)
        report = report_resp.get_json()
        self.assertEqual(report["id"], self.record_id)
        self.assertFalse(report["anonymous"])
        self.assertIsNotNone(report["owner"])

    def test_08_report_forbidden_for_non_owner(self) -> None:
        self.assertIsNotNone(self.record_id)

        register_resp = self.client_other.post(
            "/api/auth/register",
            json={"email": self.other_email, "password": self.other_password, "username": "baseline_other"},
        )
        self.assertEqual(register_resp.status_code, 200)

        forbidden_resp = self.client_other.get(f"/api/report/{self.record_id}")
        self.assertEqual(forbidden_resp.status_code, 403)

    def test_09_reports_visibility_and_stats(self) -> None:
        self.assertIsNotNone(self.record_id)

        reports_resp = self.client_user.get("/api/reports/me")
        self.assertEqual(reports_resp.status_code, 200)
        items = reports_resp.get_json().get("items", [])
        self.assertTrue(any(item["id"] == self.record_id for item in items))

        before_stats_resp = self.client_user.get("/api/stats/summary")
        self.assertEqual(before_stats_resp.status_code, 200)
        before_n = before_stats_resp.get_json().get("based_on_n", 0)
        self.assertGreaterEqual(before_n, 1)

        hide_resp = self.client_user.patch(
            f"/api/reports/{self.record_id}/stats-visibility",
            json={"hidden_from_stats": True},
        )
        self.assertEqual(hide_resp.status_code, 200)
        self.assertTrue(hide_resp.get_json()["hidden_from_stats"])

        hidden_stats_resp = self.client_user.get("/api/stats/summary")
        hidden_n = hidden_stats_resp.get_json().get("based_on_n", 0)
        self.assertLessEqual(hidden_n, before_n - 1)

        restore_resp = self.client_user.patch(
            f"/api/reports/{self.record_id}/stats-visibility",
            json={"hidden_from_stats": False},
        )
        self.assertEqual(restore_resp.status_code, 200)

        restored_stats_resp = self.client_user.get("/api/stats/summary")
        restored_n = restored_stats_resp.get_json().get("based_on_n", 0)
        self.assertGreaterEqual(restored_n, before_n)


if __name__ == "__main__":
    unittest.main(verbosity=2)
