import type { WizardStep } from '../store';

export type Didactic = {
  title: string;
  what: string;
  why: string;
  how: string;
  uses: string;
  result: string;
  next: string;
};

export const STEPS: { step: WizardStep; label: string }[] = [
  { step: 1, label: 'Carga de datos' },
  { step: 2, label: 'Grilla espacial' },
  { step: 3, label: 'K-Means' },
  { step: 4, label: 'Muestras reales' },
  { step: 5, label: 'Asignación' },
  { step: 6, label: 'Interpolación IDW' },
  { step: 7, label: 'Zonificación' },
  { step: 8, label: 'Comparación' },
];

export const DIDACTIC: Record<WizardStep, Didactic> = {
  1: {
    title: 'Carga de datos',
    what: 'Se cargan los polígonos de lotes y el histórico de siniestros con muestras GPS y nivel de daño.',
    why: 'Sin geometría del lote y muestras reales no es posible diseñar un muestreo espacial ni estimar el daño de forma objetiva.',
    how: 'Los lotes llegan como GeoJSON (MultiPolygon). Las muestras se vinculan por punto-en-polígono (lat/lon dentro del lote).',
    uses: 'Límite del lote, superficie (ha), cultivo y puntos de daño observados por el perito.',
    result: 'Un lote seleccionado listo para construir la grilla espacial.',
    next: 'Con el polígono se generan puntos candidatos a resolución operativa (p. ej. 10 m).',
  },
  2: {
    title: 'Grilla espacial',
    what: 'Se construye una malla de puntos interiores que representan el lote a una resolución métrica.',
    why: 'El muestreo dirigido necesita cubrir el espacio del lote de forma uniforme antes de elegir puntos representativos.',
    how: 'Se proyecta el lote a UTM, se genera una grilla regular y se conservan solo celdas dentro del polígono. La regla de k mínimo depende de la superficie.',
    uses: 'Geometría del lote y resolución (m).',
    result: 'N celdas candidatas y la cantidad mínima de muestras k según hectáreas.',
    next: 'Sobre esas celdas se aplica K-Means para obtener centroides sugeridos.',
  },
  3: {
    title: 'Clustering K-Means',
    what: 'Se agrupan las celdas en k clusters y se obtienen centroides como puntos sugeridos de muestreo.',
    why: 'Los centroides maximizan la cobertura espacial del lote con el mínimo de visitas de campo definidas por normativa/superficie.',
    how: 'K-Means en coordenadas proyectadas (metros). k = f(área) según la tabla de muestras mínimas.',
    uses: 'Puntos de la grilla y k calculado.',
    result: 'Clusters coloreados y k centroides sugeridos.',
    next: 'Se contrastan con las muestras reales ya levantadas por el perito.',
  },
  4: {
    title: 'Muestras reales',
    what: 'Se visualizan las muestras de campo con su porcentaje de daño.',
    why: 'Son la verdad observada; alimentan la asignación de daño a los centroides y el método tradicional (promedio simple).',
    how: 'Cada muestra es un punto GPS con damagePercentage / calculatedDamagePercentage.',
    uses: 'Histórico de siniestros del lote.',
    result: 'Capa de muestras con escala de daño.',
    next: 'Cada centroide hereda el daño de la muestra más cercana.',
  },
  5: {
    title: 'Asignación de daño',
    what: 'Se asigna a cada centroide el daño de la muestra real más próxima.',
    why: 'Permite llevar la información puntual del perito a la red de puntos espacialmente representativos.',
    how: 'Vecino más cercano en metros (KD-Tree sobre coordenadas proyectadas).',
    uses: 'Centroides K-Means + muestras reales.',
    result: 'Centroides coloreados por daño asignado.',
    next: 'Con esos valores se interpola un mapa continuo (IDW).',
  },
  6: {
    title: 'Interpolación IDW',
    what: 'Se estima el daño en todo el lote mediante Inverse Distance Weighting.',
    why: 'Produce un campo continuo que refleja la variación espacial del daño, no solo el promedio de puntos.',
    how: 'Para cada celda: promedio ponderado por 1/d^p de los centroides con daño. Escala fija (0–100) o adaptativa (p5–p95).',
    uses: 'Centroides con daño y parámetros p, simbología y escala.',
    result: 'Raster/overlay continuo del daño.',
    next: 'Se clasifica el raster en zonas de severidad.',
  },
  7: {
    title: 'Zonificación',
    what: 'Se agrupa el daño interpolado en categorías: Muy bajo, Bajo, Medio, Alto, Muy alto.',
    why: 'Facilita decisiones operativas y comunicación del patrón de daño dentro del lote.',
    how: 'Umbrales equiespaciados en la escala elegida (fija o adaptativa).',
    uses: 'Raster IDW.',
    result: 'Mapa zonificado y % de área por categoría.',
    next: 'Se comparan el método tradicional y el muestreo dirigido.',
  },
  8: {
    title: 'Comparación metodológica',
    what: 'Se contrastan tres estimaciones: promedio simple de muestras, promedio ponderado por área de los k clusters K-Means, y promedio ponderado tras reducir ambientes fusionando clusters con daño similar (re-KMeans 1D).',
    why: 'El muestreo dirigido no solo cambia el número de puntos: también permite condensar ambientes homogéneos y ver cómo eso mueve el daño del lote.',
    how: '1) Media simple. 2) Σ(daño×área)/área con k clusters. 3) K-Means sobre el daño de centroides (silhouette elige k′) → ambientes → nuevo ponderado.',
    uses: 'Labels K-Means, daño asignado a centroides y grilla operativa.',
    result: 'Tres KPIs + tablas de clusters y ambientes (área, peso, aporte) y Δ entre métodos.',
    next: 'Listo para uso operativo o revisión didáctica de cualquier paso anterior.',
  },
};
