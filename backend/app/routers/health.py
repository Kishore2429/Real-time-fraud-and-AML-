from fastapi import APIRouter
router = APIRouter(prefix="/api", tags=["health"])

@router.get("/health")
def health():
    return {"status": "ok", "project": "SYNESIS 26 Fraud & AML Risk Orchestration"}
