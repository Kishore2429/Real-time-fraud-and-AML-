from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field

class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    txn_ref: str = Field(index=True, unique=True)
    sender_account: str = Field(index=True)
    receiver_account: str = Field(index=True)
    amount: float = Field(gt=0)
    timestamp: datetime = Field(index=True)
    device_id: str = "device-unknown"
    location: str = "unknown"
    is_new_device: bool = False
    is_new_location: bool = False
    is_labelled_fraud: bool = False
    risk_score: int = 0
    risk_level: str = "low"
    reasons_json: str = "[]"
    status: str = "approved"

class Case(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    transaction_id: int = Field(index=True)
    title: str
    risk_level: str
    reasons_json: str = "[]"
    status: str = "open"
    recommended_action: str = "review"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CaseEvent(SQLModel, table=True):
    """Append-only status history for investigation cases."""
    id: Optional[int] = Field(default=None, primary_key=True)
    case_id: int = Field(index=True, foreign_key="case.id")
    from_status: Optional[str] = None
    to_status: str
    actor: str = "system"
    note: str = "Case status updated"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
