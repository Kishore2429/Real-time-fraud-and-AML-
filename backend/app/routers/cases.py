import json
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..database import get_session
from ..models import Case, CaseEvent, Transaction
from ..schemas import CaseUpdate

router = APIRouter(prefix="/api/cases", tags=["case management"])
VALID = {"open", "investigating", "resolved", "false_positive"}


def _serialize_case(case: Case, session: Session):
    events = session.exec(
        select(CaseEvent).where(CaseEvent.case_id == case.id).order_by(CaseEvent.created_at)
    ).all()
    txn = session.get(Transaction, case.transaction_id)
    return {
        "id": case.id,
        "transaction_id": case.transaction_id,
        "title": case.title,
        "risk_level": case.risk_level,
        "reasons": _safe_reasons(case.reasons_json),
        "status": case.status,
        "recommended_action": case.recommended_action,
        "created_at": case.created_at,
        "related_transactions": [txn.txn_ref] if txn else [],
        "related_accounts": [txn.sender_account, txn.receiver_account] if txn else [],
        "timeline": [
            {"timestamp": e.created_at, "event": e.to_status, "description": e.note, "actor": e.actor}
            for e in events
        ],
    }


def _safe_reasons(raw: str):
    try:
        value = json.loads(raw or "[]")
        return value if isinstance(value, list) else []
    except (TypeError, json.JSONDecodeError):
        return []


@router.get("")
def list_cases(session: Session = Depends(get_session)):
    rows = session.exec(select(Case).order_by(Case.created_at.desc())).all()
    return [_serialize_case(c, session) for c in rows]


@router.patch("/{case_id}")
def update_case(case_id: int, payload: CaseUpdate, session: Session = Depends(get_session)):
    if payload.status not in VALID:
        raise HTTPException(400, f"status must be one of {sorted(VALID)}")
    case = session.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")
    previous = case.status
    if previous != payload.status:
        case.status = payload.status
        session.add(case)
        session.add(CaseEvent(
            case_id=case.id,
            from_status=previous,
            to_status=payload.status,
            actor="user",
            note=f"Status changed from {previous} to {payload.status}",
        ))
        session.commit()
        session.refresh(case)
    return _serialize_case(case, session)
