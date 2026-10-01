# AGRO — Muestreo Dirigido (MVP Núcleo)

Plataforma web para análisis espacial de daños en lotes agrícolas (Sancor Seguros): wizard guiado de 8 pasos, K-Means, asignación por cercanía, IDW y comparación metodológica.

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind + MapLibre GL
- **Backend:** Python + FastAPI + GeoPandas / scikit-learn / SciPy

## Requisitos

- Node.js 20+
- Python 3.11+ (probado con 3.14)

## Datos

Colocar en `data/raw/`:

- `lotes_25-26.geojson`
- `Siniestros_Completo_Marcos_Juarez.csv` (jerarquía: siniestro → orden de trabajo → lote → muestras; si un lote tiene varias OT, se usa la primera)

Luego generar el índice de lotes con muestras:

```bash
backend\.venv\Scripts\python backend\scripts\build_index.py
```

## Arranque

```bash
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\uvicorn app.main:app --reload --app-dir . --port 8000

# Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

- UI: http://localhost:5173
- API docs: http://localhost:8000/docs

## Modos

- **Aprendizaje:** avanzar paso a paso con explicaciones y capas.
- **Producción:** ejecutar el pipeline completo (`POST /api/sessions/{id}/run`) y revisar resultados.

## Nota sobre la grilla 1×1 m

La metodología conceptual usa píxeles de 1 m. En el MVP la resolución operativa por defecto es **10 m** (configurable 5–20 m) para que K-Means e IDW sean viables en lotes reales.
