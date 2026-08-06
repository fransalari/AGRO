from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class LotSummary(BaseModel):
    lot_id: str
    name: str
    farm_name: str | None = None
    crop_name: str | None = None
    area_ha: float
    sample_count: int = 0
    bbox: list[float] | None = None  # [minx, miny, maxx, maxy]
    campaign: str | None = None


class SessionCreate(BaseModel):
    lot_id: str
    mode: Literal["learning", "production"] = "learning"
    grid_res_m: float = Field(default=10.0, ge=1.0, le=50.0)


class IdwParams(BaseModel):
    power: float = Field(default=2.0, ge=0.5, le=5.0)
    scale_mode: Literal["fixed", "adaptive"] = "fixed"
    symbology: Literal["continuous", "discrete"] = "continuous"


class ZoneParams(BaseModel):
    scale_mode: Literal["fixed", "adaptive"] = "fixed"
    symbology: Literal["continuous", "discrete"] = "discrete"


class CompareResult(BaseModel):
    traditional_mean: float
    directed_mean: float
    abs_diff: float
    pct_diff: float
    n_samples: int
    k: int
    area_ha: float
    grid_res_m: float


class SessionState(BaseModel):
    session_id: str
    lot_id: str
    mode: str
    grid_res_m: float
    area_ha: float
    k: int
    status: str = "created"
    steps_done: list[str] = Field(default_factory=list)
    meta: dict[str, Any] = Field(default_factory=dict)


class PipelineStepResult(BaseModel):
    session_id: str
    step: str
    ok: bool
    message: str
    data: dict[str, Any] = Field(default_factory=dict)
