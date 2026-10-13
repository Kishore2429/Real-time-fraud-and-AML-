import json
from collections import Counter
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from ..database import get_session
from ..models import Transaction, Case

router = APIRouter(prefix="/api", tags=["dashboard"])

@router.get("/dashboard")
def dashboard(session: Session = Depends(get_session)):
    txns = session.exec(select(Transaction)).all()
    cases = session.exec(select(Case)).all()
    dist = Counter(t.risk_level for t in txns)
    return {
        "transaction_count": len(txns),
        "total_value": round(sum(t.amount for t in txns), 2),
        "high_risk_count": dist.get("high", 0),
        "medium_risk_count": dist.get("medium", 0),
        "low_risk_count": dist.get("low", 0),
        "open_cases": sum(1 for c in cases if c.status == "open"),
        "risk_distribution": [{"risk_level": k, "count": v} for k, v in sorted(dist.items())],
        "recent_alerts": [
            {"txn_ref": t.txn_ref, "risk_score": t.risk_score, "risk_level": t.risk_level,
             "reasons": json.loads(t.reasons_json), "timestamp": t.timestamp}
            for t in sorted(txns, key=lambda x: x.timestamp, reverse=True)[:8]
            if t.risk_level in {"medium", "high"}
        ],
    }

@router.get("/evaluation")
def evaluation(session: Session = Depends(get_session)):
    rows = session.exec(select(Transaction)).all()
    labelled = [r for r in rows if r.is_labelled_fraud]
    if not labelled:
        return {"message": "No labelled fraud rows; seed demo data first.", "labelled_count": 0}
    predicted_positive = [r for r in rows if r.risk_level in {"medium", "high"}]
    tp = sum(1 for r in predicted_positive if r.is_labelled_fraud)
    fp = sum(1 for r in predicted_positive if not r.is_labelled_fraud)
    fn = sum(1 for r in labelled if r.risk_level == "low")
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    negative_count = sum(1 for r in rows if not r.is_labelled_fraud)
    tn = sum(1 for r in rows if not r.is_labelled_fraud and r.risk_level == "low")
    fpr = fp / (fp + tn) if fp + tn else 0.0
    return {"labelled_count": len(labelled), "true_positives": tp, "false_positives": fp,
            "false_negatives": fn, "true_negatives": tn, "precision": round(precision, 3),
            "recall": round(recall, 3), "false_positive_rate": round(fpr, 3),
            "note": "Prototype metrics on synthetic data; not evidence of real-world performance."}
