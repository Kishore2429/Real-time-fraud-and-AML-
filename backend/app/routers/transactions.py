import json
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from ..database import get_session
from ..models import Transaction, Case, CaseEvent
from ..schemas import TransactionInput
from ..risk import score_transaction

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

@router.get("")
def list_transactions(
    risk_level: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(get_session),
):
    stmt = select(Transaction).order_by(Transaction.timestamp.desc()).limit(limit)
    if risk_level:
        if risk_level not in {"low", "medium", "high"}:
            raise HTTPException(400, "risk_level must be low, medium, or high")
        stmt = select(Transaction).where(Transaction.risk_level == risk_level).order_by(Transaction.timestamp.desc()).limit(limit)
    rows = session.exec(stmt).all()
    return [serialize_transaction(row) for row in rows]

@router.post("/score")
def score_new_transaction(payload: TransactionInput, session: Session = Depends(get_session)):
    if session.exec(select(Transaction).where(Transaction.txn_ref == payload.txn_ref)).first():
        raise HTTPException(409, "txn_ref already exists")
    result = score_transaction(payload, session)
    row = Transaction(**payload.model_dump(), risk_score=result["risk_score"],
                      risk_level=result["risk_level"], reasons_json=json.dumps(result["reasons"]),
                      status="review" if result["risk_level"] == "high" else "approved")
    session.add(row)
    session.commit()
    session.refresh(row)
    if result["risk_level"] in {"medium", "high"}:
        case = Case(transaction_id=row.id, title=f"Risk review for {row.txn_ref}",
                    risk_level=row.risk_level, reasons_json=row.reasons_json,
                    recommended_action=result["recommended_action"])
        session.add(case)
        session.commit()
        session.refresh(case)
        session.add(CaseEvent(case_id=case.id, from_status=None, to_status="open",
                              actor="system", note="Case created from transaction risk score"))
        session.commit()
    return {**serialize_transaction(row), "recommended_action": result["recommended_action"]}

def serialize_transaction(row):
    return {
        "id": row.id, "txn_ref": row.txn_ref, "sender_account": row.sender_account,
        "receiver_account": row.receiver_account, "amount": row.amount,
        "timestamp": row.timestamp, "device_id": row.device_id, "location": row.location,
        "is_new_device": row.is_new_device, "is_new_location": row.is_new_location,
        "is_labelled_fraud": row.is_labelled_fraud, "risk_score": row.risk_score,
        "risk_level": row.risk_level, "reasons": json.loads(row.reasons_json),
        "status": row.status,
    }
