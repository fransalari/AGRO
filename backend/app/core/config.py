from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    project_root: Path = Path(__file__).resolve().parents[3]
    data_dir: Path = project_root / "data"
    raw_dir: Path = data_dir / "raw"
    index_dir: Path = data_dir / "index"
    sessions_dir: Path = data_dir / "sessions"
    sample_dir: Path = data_dir / "sample"

    lots_filename: str = "lotes_25-26.geojson"
    claims_filename: str = "Siniestros_Completo_Marcos_Juarez.csv"

    default_grid_res_m: float = 10.0
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    @property
    def lots_path(self) -> Path:
        return self.raw_dir / self.lots_filename

    @property
    def claims_path(self) -> Path:
        return self.raw_dir / self.claims_filename


settings = Settings()
