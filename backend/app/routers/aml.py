"""Explainable AML pattern flags. Flags are leads for human review, not conclusions."""
from collections import defaultdict
from datetime import timedelta
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from ..database import get_session
from ..models import Transaction

router = APIRouter(prefix="/api/aml", tags=["AML patterns"])


def find_aml_patterns(rows):
    by_sender = defaultdict(list)
    for row in rows:
        by_sender[row.sender_account].append(row)
    patterns = []
    emitted_structuring = set()

    # Rolling one-hour windows avoid the previous implementation's duplicate
    # windows for every transaction. Use a configurable-looking demo threshold.
    for sender, txns in by_sender.items():
        txns = sorted(txns, key=lambda x: x.timestamp)
        for txn in txns:
            window = [x for x in txns if txn.timestamp <= x.timestamp < txn.timestamp + timedelta(hours=1)]
            small = [x for x in window if 0 < float(x.amount) < 10_000]
            refs = tuple(sorted(x.txn_ref for x in small))
            if len(small) >= 4 and sum(float(x.amount) for x in small) >= 20_000 and refs not in emitted_structuring:
                emitted_structuring.add(refs)
                patterns.append({
                    "pattern": "possible_structuring",
                    "account": sender,
                    "transaction_refs": list(refs),
                    "total_amount": round(sum(float(x.amount) for x in small), 2),
                    "explanation": "Four or more transfers below 10,000 within a rolling hour total at least 20,000; review context before concluding.",
                })
                break

    # Circular transfer: require actual transaction records in both directions.
    pairs = defaultdict(list)
    for row in rows:
        a, b = row.sender_account, row.receiver_account
        if a != b:
            pairs[tuple(sorted((a, b)))].append(row)
    for (a, b), pair_rows in sorted(pairs.items()):
        directions = {(x.sender_account, x.receiver_account) for x in pair_rows}
        if (a, b) in directions and (b, a) in directions:
            patterns.append({
                "pattern": "possible_circular_transfer",
                "accounts": [a, b],
                "transaction_refs": sorted(x.txn_ref for x in pair_rows),
                "explanation": "Transactions were observed in both directions between two accounts; this alone does not establish laundering.",
            })

    return {"count": len(patterns), "patterns": patterns}


@router.get("/patterns")
def detect_aml_patterns(session: Session = Depends(get_session)):
    rows = session.exec(select(Transaction).order_by(Transaction.timestamp)).all()
    return find_aml_patterns(rows)
