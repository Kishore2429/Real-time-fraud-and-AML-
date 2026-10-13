"""Explainable, rule-based transaction risk scoring for synthetic demo data.

This is a transparent heuristic, not a trained model or a production decision engine.
"""
from datetime import timedelta
from statistics import median
from sqlmodel import Session, select
from .models import Transaction


def score_transaction(payload, session: Session | None = None):
    reasons: list[str] = []
    score = 0
    amount = float(payload.amount)

    # Absolute amount signal. Thresholds are demo defaults and should be calibrated.
    if amount >= 100_000:
        score += 30
        reasons.append("Very high transaction amount")
    elif amount >= 50_000:
        score += 20
        reasons.append("High transaction amount")
    elif amount >= 25_000:
        score += 10
        reasons.append("Elevated transaction amount")

    if getattr(payload, "is_new_device", False):
        score += 18
        reasons.append("New or unseen device")
    if getattr(payload, "is_new_location", False):
        score += 15
        reasons.append("Unusual or new location")

    if session is not None:
        # Count prior transactions in rolling windows. The transaction being scored
        # has not yet been inserted, so the thresholds describe prior activity.
        recent_start = payload.timestamp - timedelta(minutes=10)
        hourly_start = payload.timestamp - timedelta(hours=1)
        prior = session.exec(
            select(Transaction).where(
                Transaction.sender_account == payload.sender_account,
                Transaction.timestamp < payload.timestamp,
            ).order_by(Transaction.timestamp.desc()).limit(100)
        ).all()
        recent_10m = [t for t in prior if t.timestamp >= recent_start]
        recent_1h = [t for t in prior if t.timestamp >= hourly_start]

        if len(recent_10m) >= 4:
            score += 25
            reasons.append("Very high transaction velocity: at least 5 transactions in 10 minutes including this one")
        elif len(recent_10m) >= 2:
            score += 12
            reasons.append("Elevated transaction velocity: at least 3 transactions in 10 minutes including this one")

        if len(recent_1h) >= 7:
            score += 12
            reasons.append("Unusually frequent activity within one hour")

        # Compare against recent sender history rather than every historical row.
        history_amounts = [float(t.amount) for t in prior[:20] if float(t.amount) > 0]
        if len(history_amounts) >= 3:
            baseline = median(history_amounts)
            if baseline > 0 and amount >= max(25_000, baseline * 3):
                score += 15
                reasons.append("Amount is at least 3x the median of recent sender transactions")

        # Several transfers to the same beneficiary can indicate concentration.
        same_receiver = [t for t in recent_1h if t.receiver_account == payload.receiver_account]
        if len(same_receiver) >= 3:
            score += 10
            reasons.append("Repeated transfers to the same receiver within one hour")

    score = max(0, min(100, int(score)))
    level = "high" if score >= 60 else "medium" if score >= 30 else "low"
    action = (
        "hold_for_manual_review" if level == "high"
        else "step_up_verification" if level == "medium"
        else "allow_and_monitor"
    )
    if not reasons:
        reasons.append("No strong risk signals in the supplied fields")
    return {
        "risk_score": score,
        "risk_level": level,
        "reasons": reasons,
        "recommended_action": action,
    }
