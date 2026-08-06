from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse

from app.core.config import settings
from app.models.schemas import IdwParams, SessionCreate, ZoneParams
from app.services.catalog import catalog
from app.services.session_store import sessions

router = APIRouter(prefix="/api")


@router.get("/health")
def health():
    return {"ok": True, "index_ready": bool(catalog.meta.get("ready"))}


@router.post("/index/rebuild")
def rebuild_index():
    meta = catalog.ensure_ready(force=True)
    return meta


@router.get("/lots")
def list_lots(q: str | None = None, limit: int = Query(default=50, ge=1, le=500)):
    items = catalog.list_lots(q=q)
    return {"count": len(items), "lots": items[:limit]}


@router.get("/lots/{lot_id}")
def get_lot(lot_id: str):
    summary = catalog.get_lot_summary(lot_id)
    feature = catalog.get_lot_feature(lot_id)
    if not summary or not feature:
        raise HTTPException(404, "Lote no encontrado")
    return {"summary": summary, "feature": feature}


@router.post("/upload/lots")
async def upload_lots(file: UploadFile = File(...)):
    settings.raw_dir.mkdir(parents=True, exist_ok=True)
    dest = settings.raw_dir / "lotes_25-26.geojson"
    content = await file.read()
    dest.write_bytes(content)
    return {"ok": True, "path": str(dest), "bytes": len(content)}


@router.post("/upload/claims")
async def upload_claims(file: UploadFile = File(...)):
    settings.raw_dir.mkdir(parents=True, exist_ok=True)
    dest = settings.raw_dir / "Siniestros_Completo_Marcos_Juarez.csv"
    content = await file.read()
    dest.write_bytes(content)
    return {"ok": True, "path": str(dest), "bytes": len(content)}


@router.post("/sessions")
def create_session(body: SessionCreate):
    try:
        state = sessions.create(body.lot_id, body.mode, body.grid_res_m)
    except ValueError as e:
        raise HTTPException(404, str(e)) from e
    return state


@router.get("/sessions/{session_id}")
def get_session(session_id: str):
    try:
        return sessions.state(session_id)
    except KeyError as e:
        raise HTTPException(404, str(e)) from e


@router.post("/sessions/{session_id}/grid")
def step_grid(session_id: str):
    try:
        return sessions.step_grid(session_id)
    except KeyError as e:
        raise HTTPException(404, str(e)) from e


@router.post("/sessions/{session_id}/kmeans")
def step_kmeans(session_id: str):
    try:
        return sessions.step_kmeans(session_id)
    except KeyError as e:
        raise HTTPException(404, str(e)) from e


@router.get("/sessions/{session_id}/samples")
@router.post("/sessions/{session_id}/samples")
def step_samples(session_id: str):
    try:
        return sessions.step_samples(session_id)
    except KeyError as e:
        raise HTTPException(404, str(e)) from e


@router.post("/sessions/{session_id}/assign")
def step_assign(session_id: str):
    try:
        return sessions.step_assign(session_id)
    except (KeyError, ValueError) as e:
        raise HTTPException(400, str(e)) from e


@router.post("/sessions/{session_id}/idw")
def step_idw(session_id: str, body: IdwParams | None = None):
    try:
        return sessions.step_idw(session_id, body or IdwParams())
    except KeyError as e:
        raise HTTPException(404, str(e)) from e


@router.post("/sessions/{session_id}/zones")
def step_zones(session_id: str, body: ZoneParams | None = None):
    try:
        return sessions.step_zones(session_id, body or ZoneParams())
    except KeyError as e:
        raise HTTPException(404, str(e)) from e


@router.get("/sessions/{session_id}/compare")
def step_compare(session_id: str):
    try:
        return sessions.step_compare(session_id)
    except KeyError as e:
        raise HTTPException(404, str(e)) from e


@router.post("/sessions/{session_id}/run")
def run_pipeline(session_id: str, idw: IdwParams | None = None, zones: ZoneParams | None = None):
    try:
        return sessions.run_all(session_id, idw=idw, zones=zones)
    except (KeyError, ValueError) as e:
        raise HTTPException(400, str(e)) from e


@router.get("/sessions/{session_id}/artifacts/{name}")
def get_artifact(session_id: str, name: str):
    allowed = {
        "lot.geojson",
        "samples.geojson",
        "grid.geojson",
        "grid_outline.geojson",
        "grid_meta.json",
        "centroids.geojson",
        "centroids_damage.geojson",
        "clusters.geojson",
        "grid_labeled.geojson",
        "idw.png",
        "zones.png",
        "state.json",
    }
    if name not in allowed:
        raise HTTPException(404, "Artefacto no permitido")
    path = sessions.artifact_path(session_id, name)
    if not path.exists():
        raise HTTPException(404, "Artefacto no encontrado")
    media = "image/png" if name.endswith(".png") else "application/json"
    return FileResponse(path, media_type=media)
