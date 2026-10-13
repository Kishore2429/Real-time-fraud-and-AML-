import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from app.risk import score_transaction
from app.routers.aml import find_aml_patterns


def tx(ref, sender, receiver, amount, minutes_ago=0):
    return SimpleNamespace(
        txn_ref=ref,
        sender_account=sender,
        receiver_account=receiver,
        amount=amount,
        timestamp=datetime(2026, 1, 1, tzinfo=timezone.utc) - timedelta(minutes=minutes_ago),
    )


class RiskScoringTests(unittest.TestCase):
    def test_low_signal_has_bounded_score_and_action(self):
        payload = SimpleNamespace(amount=100, is_new_device=False, is_new_location=False)
        result = score_transaction(payload)
        self.assertEqual(result["risk_score"], 0)
        self.assertEqual(result["risk_level"], "low")
        self.assertEqual(result["recommended_action"], "allow_and_monitor")
        self.assertTrue(result["reasons"])

    def test_multiple_signals_raise_score(self):
        payload = SimpleNamespace(amount=125000, is_new_device=True, is_new_location=True)
        result = score_transaction(payload)
        self.assertGreaterEqual(result["risk_score"], 60)
        self.assertEqual(result["risk_level"], "high")
        self.assertEqual(result["recommended_action"], "hold_for_manual_review")

    def test_score_is_never_above_100(self):
        payload = SimpleNamespace(amount=1_000_000, is_new_device=True, is_new_location=True)
        self.assertLessEqual(score_transaction(payload)["risk_score"], 100)


class AMLPatternTests(unittest.TestCase):
    def test_structuring_like_window_detected(self):
        rows = [tx(f"S{i}", "A", f"R{i}", amount, i * 5)
                for i, amount in enumerate([6000, 6500, 7000, 7500])]
        result = find_aml_patterns(rows)
        self.assertTrue(any(p["pattern"] == "possible_structuring" for p in result["patterns"]))

    def test_bidirectional_transfer_detected(self):
        rows = [tx("AB", "A", "B", 100), tx("BA", "B", "A", 90)]
        result = find_aml_patterns(rows)
        self.assertTrue(any(p["pattern"] == "possible_circular_transfer" for p in result["patterns"]))

    def test_one_direction_is_not_circular(self):
        result = find_aml_patterns([tx("AB", "A", "B", 100)])
        self.assertFalse(any(p["pattern"] == "possible_circular_transfer" for p in result["patterns"]))


if __name__ == "__main__":
    unittest.main()
