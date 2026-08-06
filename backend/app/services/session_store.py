from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import Any

import numpy as np

from app.core.config import settings
from app.core.sample_rules import min_samples_for_area_ha
from app.models.schemas import CompareResult, IdwParams, SessionState, ZoneParams
from app.services.assign_service import assign_nearest_damage
from app.services.catalog import catalog
from app.services.compare_service import compare_methods, summary_stats
from app.services.geo_utils import (
    area_ha_wgs84,
    geom_from_geojson,
    grid_outline_geojson,
    grid_points_in_polygon,
    points_to_feature_collection,
    polygon_feature,
)
from app.services.idw_service import idw_interpolate, zonify_raster
from app.services.kmeans_service import run_kmeans


class SessionStore:
    def __init__(self) -> None:
        settings.sessions_dir.mkdir(parents=True, exist_ok=True)
        self._mem: dict[str, dict[str, Any]] = {}

    def _dir(self, session_id: str) -> Path:
        d = settings.sessions_dir / session_id
        d.mkdir(parents=True, exist_ok=True)
        return d

    def _save_meta(self, session_id: str) -> None:
        meta = self._mem[session_id]["state"]
        path = self._dir(session_id) / "state.json"
        with path.open("w", encoding="utf-8") as f:
            json.dump(meta.model_dump() if isinstance(meta, SessionState) else meta, f, indent=2)

    def create(self, lot_id: str, mode: str, grid_res_m: float) -> SessionState:
        feature = catalog.get_lot_feature(lot_id)
        summary = catalog.get_lot_summary(lot_id)
        if feature is None or summary is None:
            raise ValueError(f"Lote no encontrado: {lot_id}")

        geom = geom_from_geojson(feature["geometry"])
        area = float(summary.get("area_ha") or area_ha_wgs84(geom))
        k = min_samples_for_area_ha(area)
        session_id = uuid.uuid4().hex[:12]
        state = SessionState(
            session_id=session_id,
            lot_id=str(lot_id),
            mode=mode,
            grid_res_m=float(grid_res_m),
            area_ha=area,
            k=k,
            status="created",
            steps_done=[],
            meta={
                "name": summary.get("name"),
                "sample_count": summary.get("sample_count"),
                "crop_name": summary.get("crop_name"),
            },
        )
        sdir = self._dir(session_id)
        with (sdir / "lot.geojson").open("w", encoding="utf-8") as f:
            json.dump(
                {"type": "FeatureCollection", "features": [polygon_feature(geom, feature["properties"])]},
                f,
            )
        samples = catalog.samples_for_lot(lot_id)
        samples.to_parquet(sdir / "samples.parquet", index=False)
        sample_gj = points_to_feature_collection(
            samples["lon"].to_numpy(),
            samples["lat"].to_numpy(),
            [
                {
                    "id": int(i),
                    "damage": float(samples.iloc[i]["damage"]),
                    "lot_name": str(samples.iloc[i].get("lot_name") or ""),
                    "nro_siniestro": str(samples.iloc[i].get("nro_siniestro") or ""),
                }
                for i in range(len(samples))
            ],
        )
        with (sdir / "samples.geojson").open("w", encoding="utf-8") as f:
            json.dump(sample_gj, f)

        self._mem[session_id] = {
            "state": state,
            "geom": geom,
            "samples": samples,
            "grid_lons": None,
            "grid_lats": None,
            "labels": None,
            "centroid_lons": None,
            "centroid_lats": None,
            "centroid_damages": None,
            "idw_raster": None,
            "idw_bounds": None,
        }
        self._save_meta(session_id)
        return state

    def get(self, session_id: str) -> dict[str, Any]:
        if session_id not in self._mem:
            raise KeyError(f"Sesión no encontrada: {session_id}")
        return self._mem[session_id]

    def state(self, session_id: str) -> SessionState:
        return self.get(session_id)["state"]

    def artifact_path(self, session_id: str, name: str) -> Path:
        return self._dir(session_id) / name

    def step_grid(self, session_id: str) -> dict[str, Any]:
        sess = self.get(session_id)
        geom = sess["geom"]
        res = sess["state"].grid_res_m
        lons, lats, meta = grid_points_in_polygon(geom, res)
        sess["grid_lons"] = lons
        sess["grid_lats"] = lats
        outline = grid_outline_geojson(geom, res)
        grid_gj = points_to_feature_collection(
            lons, lats, [{"id": int(i)} for i in range(len(lons))]
        )
        # subsample for map if huge
        max_pts = 5000
        if len(lons) > max_pts:
            idx = np.linspace(0, len(lons) - 1, max_pts).astype(int)
            grid_gj = points_to_feature_collection(
                lons[idx], lats[idx], [{"id": int(i)} for i in idx]
            )
        sdir = self._dir(session_id)
        with (sdir / "grid.geojson").open("w", encoding="utf-8") as f:
            json.dump(grid_gj, f)
        with (sdir / "grid_outline.geojson").open("w", encoding="utf-8") as f:
            json.dump(outline, f)
        with (sdir / "grid_meta.json").open("w", encoding="utf-8") as f:
            json.dump(meta, f)
        st = sess["state"]
        if "grid" not in st.steps_done:
            st.steps_done.append("grid")
        st.status = "grid"
        self._save_meta(session_id)
        return {
            "n_cells": meta["n_cells"],
            "grid_res_m": res,
            "k": st.k,
            "area_ha": st.area_ha,
            "grid_url": f"/api/sessions/{session_id}/artifacts/grid.geojson",
            "outline_url": f"/api/sessions/{session_id}/artifacts/grid_outline.geojson",
            "lot_url": f"/api/sessions/{session_id}/artifacts/lot.geojson",
        }

    def step_kmeans(self, session_id: str) -> dict[str, Any]:
        sess = self.get(session_id)
        if sess["grid_lons"] is None:
            self.step_grid(session_id)
        st = sess["state"]
        result = run_kmeans(sess["grid_lons"], sess["grid_lats"], st.k, sess["geom"])
        sess["labels"] = result["labels"]
        sess["centroid_lons"] = result["centroid_lons"]
        sess["centroid_lats"] = result["centroid_lats"]
        sdir = self._dir(session_id)
        for name, key in (
            ("centroids.geojson", "centroids_geojson"),
            ("clusters.geojson", "clusters_geojson"),
            ("grid_labeled.geojson", "grid_labeled_geojson"),
        ):
            with (sdir / name).open("w", encoding="utf-8") as f:
                json.dump(result[key], f)
        if "kmeans" not in st.steps_done:
            st.steps_done.append("kmeans")
        st.status = "kmeans"
        self._save_meta(session_id)
        return {
            "k": result["k"],
            "centroids_url": f"/api/sessions/{session_id}/artifacts/centroids.geojson",
            "clusters_url": f"/api/sessions/{session_id}/artifacts/clusters.geojson",
            "grid_labeled_url": f"/api/sessions/{session_id}/artifacts/grid_labeled.geojson",
        }

    def step_samples(self, session_id: str) -> dict[str, Any]:
        sess = self.get(session_id)
        st = sess["state"]
        samples = sess["samples"]
        if "samples" not in st.steps_done:
            st.steps_done.append("samples")
        st.status = "samples"
        self._save_meta(session_id)
        return {
            "n_samples": int(len(samples)),
            "damage_stats": summary_stats(samples["damage"].to_numpy(dtype=float)),
            "samples_url": f"/api/sessions/{session_id}/artifacts/samples.geojson",
        }

    def step_assign(self, session_id: str) -> dict[str, Any]:
        sess = self.get(session_id)
        if sess["centroid_lons"] is None:
            self.step_kmeans(session_id)
        samples = sess["samples"]
        result = assign_nearest_damage(
            sess["centroid_lons"],
            sess["centroid_lats"],
            samples["lon"].to_numpy(dtype=float),
            samples["lat"].to_numpy(dtype=float),
            samples["damage"].to_numpy(dtype=float),
            sess["geom"],
        )
        sess["centroid_damages"] = result["damages"]
        sdir = self._dir(session_id)
        with (sdir / "centroids_damage.geojson").open("w", encoding="utf-8") as f:
            json.dump(result["centroids_geojson"], f)
        st = sess["state"]
        if "assign" not in st.steps_done:
            st.steps_done.append("assign")
        st.status = "assign"
        self._save_meta(session_id)
        return {
            "damage_mean": result["damage_mean"],
            "damage_min": result["damage_min"],
            "damage_max": result["damage_max"],
            "centroids_url": f"/api/sessions/{session_id}/artifacts/centroids_damage.geojson",
        }

    def step_idw(self, session_id: str, params: IdwParams) -> dict[str, Any]:
        sess = self.get(session_id)
        if sess["centroid_damages"] is None:
            self.step_assign(session_id)
        sdir = self._dir(session_id)
        result = idw_interpolate(
            sess["geom"],
            sess["centroid_lons"],
            sess["centroid_lats"],
            sess["centroid_damages"],
            res_m=sess["state"].grid_res_m,
            power=params.power,
            scale_mode=params.scale_mode,
            symbology=params.symbology,
            out_png=sdir / "idw.png",
            out_npy=sdir / "idw.npy",
        )
        sess["idw_raster"] = result["raster"]
        sess["idw_bounds"] = result["bounds"]
        # drop heavy array from returned payload
        payload = {k: v for k, v in result.items() if k != "raster"}
        payload["png_url"] = f"/api/sessions/{session_id}/artifacts/idw.png"
        st = sess["state"]
        if "idw" not in st.steps_done:
            st.steps_done.append("idw")
        st.status = "idw"
        st.meta["idw"] = {
            "vmin": result["vmin"],
            "vmax": result["vmax"],
            "mean_damage": result["mean_damage"],
            "bounds": result["bounds"],
            "scale_mode": params.scale_mode,
            "symbology": params.symbology,
            "power": params.power,
        }
        self._save_meta(session_id)
        return payload

    def step_zones(self, session_id: str, params: ZoneParams) -> dict[str, Any]:
        sess = self.get(session_id)
        if sess["idw_raster"] is None:
            self.step_idw(session_id, IdwParams())
        sdir = self._dir(session_id)
        result = zonify_raster(
            sess["idw_raster"],
            scale_mode=params.scale_mode,
            symbology=params.symbology,
            out_png=sdir / "zones.png",
            bounds=sess["idw_bounds"],
        )
        result["png_url"] = f"/api/sessions/{session_id}/artifacts/zones.png"
        st = sess["state"]
        if "zones" not in st.steps_done:
            st.steps_done.append("zones")
        st.status = "zones"
        st.meta["zones"] = result
        self._save_meta(session_id)
        return result

    def step_compare(self, session_id: str) -> dict[str, Any]:
        sess = self.get(session_id)
        if sess["idw_raster"] is None:
            self.step_idw(session_id, IdwParams())
        st = sess["state"]
        cmp: CompareResult = compare_methods(
            sess["samples"]["damage"].to_numpy(dtype=float),
            sess["idw_raster"],
            st.k,
            st.area_ha,
            st.grid_res_m,
        )
        if "compare" not in st.steps_done:
            st.steps_done.append("compare")
        st.status = "compare"
        st.meta["compare"] = cmp.model_dump()
        self._save_meta(session_id)
        return {
            **cmp.model_dump(),
            "sample_stats": summary_stats(sess["samples"]["damage"].to_numpy(dtype=float)),
            "idw_stats": summary_stats(sess["idw_raster"]),
            "idw_png_url": f"/api/sessions/{session_id}/artifacts/idw.png",
            "zones_png_url": f"/api/sessions/{session_id}/artifacts/zones.png",
            "samples_url": f"/api/sessions/{session_id}/artifacts/samples.geojson",
            "centroids_url": f"/api/sessions/{session_id}/artifacts/centroids_damage.geojson",
            "lot_url": f"/api/sessions/{session_id}/artifacts/lot.geojson",
            "bounds": sess["idw_bounds"],
        }

    def run_all(self, session_id: str, idw: IdwParams | None = None, zones: ZoneParams | None = None) -> dict[str, Any]:
        idw = idw or IdwParams()
        zones = zones or ZoneParams()
        grid = self.step_grid(session_id)
        kmeans = self.step_kmeans(session_id)
        samples = self.step_samples(session_id)
        assign = self.step_assign(session_id)
        idw_res = self.step_idw(session_id, idw)
        zones_res = self.step_zones(session_id, zones)
        compare = self.step_compare(session_id)
        return {
            "grid": grid,
            "kmeans": kmeans,
            "samples": samples,
            "assign": assign,
            "idw": idw_res,
            "zones": zones_res,
            "compare": compare,
        }


sessions = SessionStore()
