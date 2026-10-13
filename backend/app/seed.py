import random
from datetime import datetime, timedelta, timezone
from sqlmodel import Session, select
from .database import create_db_and_tables, engine
from .models import Transaction
from .risk import score_transaction
from types import SimpleNamespace
import json

def seed():
    create_db_and_tables()
    with Session(engine) as session:
        existing = session.exec(select(Transaction)).first()
        if existing:
            print("Database already has transactions; skipping seed to avoid duplicates.")
            return
        now = datetime.now(timezone.utc).replace(microsecond=0)
        rows = []
        # Benign baseline plus clearly suspicious synthetic scenarios.
        for i in range(24):
            amount = random.choice([250, 600, 1200, 2500, 4800, 7500])
            payload = SimpleNamespace(
                txn_ref=f"DEMO-{i+1:03d}", sender_account=f"ACC-{random.randint(1,8):03d}",
                receiver_account=f"MERCHANT-{random.randint(1,12):03d}", amount=amount,
                timestamp=now-timedelta(minutes=random.randint(1, 1440)), device_id=f"DEV-{random.randint(1,8):03d}",
                location=random.choice(["Chennai", "Vellore", "Bengaluru"]), is_new_device=False, is_new_location=False
            )
            result = score_transaction(payload)
            rows.append(Transaction(**vars(payload), risk_score=result["risk_score"], risk_level=result["risk_level"],
                                    reasons_json=json.dumps(result["reasons"]), status="approved", is_labelled_fraud=False))
        suspicious = [
            ("DEMO-FRAUD-01", "ACC-900", "ACC-901", 125000, True, True, True),
            ("DEMO-FRAUD-02", "ACC-900", "ACC-902", 89000, True, False, True),
            ("DEMO-FRAUD-03", "ACC-901", "ACC-900", 60000, False, True, True),
            ("DEMO-UNUSUAL-01", "ACC-777", "ACC-778", 52000, True, False, False),
            ("DEMO-UNUSUAL-02", "ACC-444", "ACC-445", 900, False, True, False),
        ]
        for i, (ref, sender, receiver, amount, newdev, newloc, fraud) in enumerate(suspicious):
            payload = SimpleNamespace(txn_ref=ref, sender_account=sender, receiver_account=receiver,
                amount=amount, timestamp=now-timedelta(minutes=5*i), device_id="DEV-NEW" if newdev else "DEV-KNOWN",
                location="Unknown" if newloc else "Chennai", is_new_device=newdev, is_new_location=newloc)
            result = score_transaction(payload)
            rows.append(Transaction(**vars(payload), risk_score=result["risk_score"], risk_level=result["risk_level"],
                reasons_json=json.dumps(result["reasons"]), status="review" if result["risk_level"] == "high" else "approved",
                is_labelled_fraud=fraud))
        # Add a synthetic structuring-like cluster below the example threshold.
        for i, amount in enumerate([6000, 6500, 7000, 7500]):
            payload = SimpleNamespace(txn_ref=f"DEMO-STRUCT-{i+1}", sender_account="ACC-STRUCT",
                receiver_account=f"ACC-SPLIT-{i+1}", amount=amount, timestamp=now-timedelta(minutes=i*7),
                device_id="DEV-STRUCT", location="Chennai", is_new_device=False, is_new_location=False)
            result = score_transaction(payload)
            rows.append(Transaction(**vars(payload), risk_score=result["risk_score"], risk_level=result["risk_level"],
                reasons_json=json.dumps(result["reasons"]), status="approved", is_labelled_fraud=False))
        session.add_all(rows)
        session.commit()
        print(f"Seeded {len(rows)} synthetic transactions.")
if __name__ == "__main__":
    seed()
