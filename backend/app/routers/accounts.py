from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from ..database import get_session
from ..models import Transaction

router = APIRouter(prefix="/api/accounts", tags=["account relationships"])

@router.get("/relationships")
def relationships(session: Session = Depends(get_session)):
    rows = session.exec(select(Transaction)).all()
    nodes = set()
    edges = []
    for row in rows:
        nodes.add(row.sender_account)
        nodes.add(row.receiver_account)
        edges.append({"source": row.sender_account, "target": row.receiver_account,
                      "amount": row.amount, "txn_ref": row.txn_ref, "risk_level": row.risk_level})
    return {"nodes": [{"id": n, "label": n} for n in sorted(nodes)], "edges": edges}
