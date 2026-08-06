from app.core.sample_rules import min_samples_for_area_ha


def test_sample_rules_table():
    assert min_samples_for_area_ha(10) == 5
    assert min_samples_for_area_ha(50) == 5
    assert min_samples_for_area_ha(50.1) == 6
    assert min_samples_for_area_ha(100) == 6
    assert min_samples_for_area_ha(101) == 8
    assert min_samples_for_area_ha(150) == 8
    assert min_samples_for_area_ha(151) == 10
    assert min_samples_for_area_ha(200) == 10
    assert min_samples_for_area_ha(250) == 12
    assert min_samples_for_area_ha(350) == 14
    assert min_samples_for_area_ha(450) == 16
    assert min_samples_for_area_ha(600) == 18
    assert min_samples_for_area_ha(800) == 20
    assert min_samples_for_area_ha(1000) == 20
    assert min_samples_for_area_ha(1001) == 21
    assert min_samples_for_area_ha(1100) == 21
    assert min_samples_for_area_ha(1101) == 22
    assert min_samples_for_area_ha(0) == 5
