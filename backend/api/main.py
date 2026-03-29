import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from backend.api import (
    documents,
    hotspots,
    alerts,
    deployment,
    patrolling,
    community,
    recommendations,
    debug
)
from backend.api import fir_pipeline
from backend.api import pipeline

from backend.api.law_order_dashboard import router as law_order_router

# ── Optional heavy ML stack (cv2 / torch / ultralytics) ──────────────────────
# On Render free tier these packages are not installed.
# The CCTV‑video endpoint will return 503; all other routes work normally.
try:
    from backend.yolo_detection import model as yolo_model
    YOLO_AVAILABLE = True
except Exception as _yolo_err:
    print(f"[WARN] YOLO/CV2 stack not available: {_yolo_err}")
    print("[WARN] /analyze/ (CCTV video) endpoint will be disabled.")
    yolo_model = None  # type: ignore
    YOLO_AVAILABLE = False
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(title="SafeCity Backend")
app.include_router(fir_pipeline.router, prefix="/fir")

# Mount evidence dir + YOLO router only if ML stack loaded successfully
if YOLO_AVAILABLE and yolo_model is not None:
    os.makedirs(yolo_model.EVIDENCE_DIR, exist_ok=True)
    app.mount("/evidence", StaticFiles(directory=yolo_model.EVIDENCE_DIR), name="evidence")
    app.include_router(yolo_model.router, prefix="/analyze")
else:
    # Provide a friendly 503 for the CCTV endpoint so frontend doesn't hang
    from fastapi import APIRouter
    from fastapi.responses import JSONResponse
    _stub = APIRouter()

    @_stub.api_route("/analyze/{path:path}", methods=["GET", "POST"])
    async def _yolo_unavailable(path: str):
        return JSONResponse(
            status_code=503,
            content={"error": "CCTV analysis unavailable on this deployment (ML stack not installed)"},
        )

    app.include_router(_stub)



app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nyayarakshak.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Keep your existing router include (this handles the POST requests)

app.include_router(deployment.router)
app.include_router(patrolling.router)
app.include_router(debug.router)
app.include_router(law_order_router)
app.include_router(pipeline.router, prefix="/pipeline")
app.include_router(documents.router, prefix="/documents")
app.include_router(hotspots.router, prefix="/hotspots")
app.include_router(alerts.router, prefix="/alerts")
app.include_router(deployment.router, prefix="/deployment")
app.include_router(community.router, prefix="/community")
app.include_router(recommendations.router, prefix="/recommendations")

@app.get("/")
def read_root():
    return {"message": "NyayaRakshak is Live"}