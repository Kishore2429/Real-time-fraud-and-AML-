from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class TransactionInput(BaseModel):
    txn_ref: str = Field(min_length=1, max_length=80)
    sender_account: str = Field(min_length=1, max_length=80)
    receiver_account: str = Field(min_length=1, max_length=80)
    amount: float = Field(gt=0, allow_inf_nan=False)
    timestamp: datetime
    device_id: str = Field(default="device-unknown", max_length=120)
    location: str = Field(default="unknown", max_length=120)
    is_new_device: bool = False
    is_new_location: bool = False

    @field_validator("txn_ref", "sender_account", "receiver_account", "device_id", "location")
    @classmethod
    def trim_required_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("must not be blank")
        return cleaned


class CaseUpdate(BaseModel):
    status: str = Field(min_length=1, max_length=30)

    @field_validator("status")
    @classmethod
    def normalize_status(cls, value: str) -> str:
        return value.strip().lower()
