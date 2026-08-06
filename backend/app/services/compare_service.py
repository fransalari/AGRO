from __future__ import annotations

from typing import Any

import numpy as np

from app.models.schemas import CompareResult


def compare_methods(
    sample_damage: np.ndarray,
    idw_raster: np.ndarray,
    k: int,
    area_ha: float,
    grid_res_m: float,
) -> CompareResult:
    traditional = float(np.nanmean(sample_damage)) if len(sample_damage) else float("nan")
    finite = idw_raster[np.isfinite(idw_raster)]
    directed = float(np.nanmean(finite)) if len(finite) else float("nan")
    abs_diff = directed - traditional
    pct_diff = (abs_diff / traditional * 100.0) if traditional not in (0.0, float("nan")) and not np.isnan(traditional) else float("nan")
    if traditional == 0:
        pct_diff = float("nan") if directed != 0 else 0.0
    return CompareResult(
        traditional_mean=round(traditional, 4),
        directed_mean=round(directed, 4),
        abs_diff=round(abs_diff, 4),
        pct_diff=round(pct_diff, 4) if not np.isnan(pct_diff) else 0.0,
        n_samples=int(len(sample_damage)),
        k=int(k),
        area_ha=round(float(area_ha), 4),
        grid_res_m=float(grid_res_m),
    )


def summary_stats(values: np.ndarray) -> dict[str, Any]:
    v = values[np.isfinite(values)]
    if len(v) == 0:
        return {"n": 0}
    return {
        "n": int(len(v)),
        "mean": float(np.mean(v)),
        "std": float(np.std(v)),
        "min": float(np.min(v)),
        "max": float(np.max(v)),
        "p5": float(np.percentile(v, 5)),
        "p50": float(np.percentile(v, 50)),
        "p95": float(np.percentile(v, 95)),
    }
