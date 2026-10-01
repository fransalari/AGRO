import numpy as np

from app.services.compare_service import (
    cluster_contributions,
    compare_methods,
    reduce_ambientes_by_damage_similarity,
)


def test_cluster_contributions_weights_sum_to_one():
    # 3 cells cluster0, 1 cell cluster1 → weights 0.75 / 0.25
    labels = np.array([0, 0, 0, 1])
    damages = np.array([10.0, 40.0])
    rows, weighted = cluster_contributions(labels, damages, grid_res_m=10.0)
    assert len(rows) == 2
    assert rows[0].n_cells == 3
    assert rows[1].n_cells == 1
    assert abs(rows[0].weight_pct + rows[1].weight_pct - 100.0) < 1e-6
    assert abs(rows[0].area_ha - 0.03) < 1e-9  # 3 * 100 m² / 10000
    assert abs(rows[1].area_ha - 0.01) < 1e-9
    # weighted = 10*0.75 + 40*0.25 = 17.5
    assert abs(weighted - 17.5) < 1e-9
    assert abs(rows[0].contribution + rows[1].contribution - weighted) < 1e-6


def test_compare_simple_vs_weighted():
    samples = np.array([10.0, 20.0, 30.0])  # simple mean = 20
    labels = np.array([0, 0, 0, 1])
    damages = np.array([10.0, 40.0])  # weighted = 17.5
    raster = np.array([[10.0, 20.0], [np.nan, 30.0]])
    cmp, amb_labels = compare_methods(samples, raster, labels, damages, k=2, area_ha=1.0, grid_res_m=10.0)
    assert abs(cmp.traditional_mean - 20.0) < 1e-6
    assert abs(cmp.weighted_mean - 17.5) < 1e-6
    assert abs(cmp.abs_diff - (-2.5)) < 1e-6
    assert len(cmp.clusters) == 2
    assert len(amb_labels) == len(labels)
    assert cmp.k_ambientes >= 1


def test_reduce_ambientes_merges_similar_damage():
    # Four equal-area clusters: two low, two high → expect 2 ambientes
    labels = np.array([0, 0, 1, 1, 2, 2, 3, 3])
    damages = np.array([10.0, 12.0, 40.0, 42.0])
    out = reduce_ambientes_by_damage_similarity(labels, damages, grid_res_m=10.0)
    assert out["k_ambientes"] == 2
    assert len(out["ambientes"]) == 2
    # Lot weighted mean unchanged when merging by damage of equal areas within groups
    # A_low ≈ 11, A_high ≈ 41, each 50% → ~26
    assert abs(out["weighted_mean"] - 26.0) < 0.5


def test_reduce_identical_damages_single_ambiente():
    labels = np.array([0, 0, 1, 1, 2, 2])
    damages = np.array([25.0, 25.1, 24.9])
    out = reduce_ambientes_by_damage_similarity(labels, damages, grid_res_m=10.0)
    assert out["k_ambientes"] == 1
    assert abs(out["weighted_mean"] - 25.0) < 0.2
