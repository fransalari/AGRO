import pandas as pd

from app.services.catalog import prefer_first_work_order


def test_prefer_first_work_order_keeps_earliest():
    claims = pd.DataFrame(
        {
            "orden_trabajo": ["100", "100", "200", "200"],
            "fecha_orden": pd.to_datetime(
                ["2020-02-20", "2020-02-20", "2020-02-10", "2020-02-10"]
            ),
            "fecha_evento": pd.to_datetime(
                ["2020-02-18", "2020-02-18", "2020-02-08", "2020-02-08"]
            ),
        }
    )
    kept = prefer_first_work_order(claims, [0, 1, 2, 3])
    assert kept == [2, 3]


def test_prefer_first_work_order_single_wo():
    claims = pd.DataFrame(
        {
            "orden_trabajo": ["10", "10"],
            "fecha_orden": pd.to_datetime(["2020-01-01", "2020-01-01"]),
            "fecha_evento": pd.to_datetime(["2020-01-01", "2020-01-01"]),
        }
    )
    assert prefer_first_work_order(claims, [0, 1]) == [0, 1]
