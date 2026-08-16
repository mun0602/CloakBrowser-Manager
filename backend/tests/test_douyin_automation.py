"""Automated tests for Douyin Automation features and API endpoints."""

import pytest
from starlette.testclient import TestClient
from backend.main import app
from backend import database as db


@pytest.fixture
def client():
    return TestClient(app)


def test_douyin_accounts_crud(client):
    # Create profile
    p = db.create_profile(name="Douyin Test Profile")
    p_id = p["id"]

    # 1. Create account
    res = client.post(
        "/api/douyin/accounts",
        json={
            "profile_id": p_id,
            "nickname": "TestUser99",
            "douyin_id": "dy_test_99",
            "tags": ["test", "vip"],
        },
    )
    assert res.status_code in (200, 201)
    acc = res.json()
    assert acc["nickname"] == "TestUser99"
    assert acc["douyin_id"] == "dy_test_99"
    acc_id = acc["id"]

    # 2. List accounts
    res = client.get("/api/douyin/accounts")
    assert res.status_code == 200
    accounts = res.json()
    assert any(a["id"] == acc_id for a in accounts)

    # 3. Update account
    res = client.put(
        f"/api/douyin/accounts/{acc_id}",
        json={"nickname": "UpdatedUser99", "cookie_status": "valid"},
    )
    assert res.status_code == 200
    updated = res.json()
    assert updated["nickname"] == "UpdatedUser99"
    assert updated["cookie_status"] == "valid"

    # 4. Delete account
    res = client.delete(f"/api/douyin/accounts/{acc_id}")
    assert res.status_code == 200

    # Cleanup profile
    db.delete_profile(p_id)


def test_douyin_workflows_crud(client):
    # 1. Create workflow
    res = client.post(
        "/api/douyin/workflows",
        json={
            "name": "Auto Warmup Workflow",
            "action_type": "warmup",
            "config": {"video_count": 5, "min_watch_sec": 4, "max_watch_sec": 8},
        },
    )
    assert res.status_code in (200, 201)
    wf = res.json()
    assert wf["name"] == "Auto Warmup Workflow"
    wf_id = wf["id"]

    # 2. List workflows
    res = client.get("/api/douyin/workflows")
    assert res.status_code == 200
    wfs = res.json()
    assert any(w["id"] == wf_id for w in wfs)

    # 3. Delete workflow
    res = client.delete(f"/api/douyin/workflows/{wf_id}")
    assert res.status_code == 200


def test_douyin_schedules_crud_and_calculation(client):
    # Create profile
    p = db.create_profile(name="Schedule Test Profile")
    p_id = p["id"]

    # 1. Create schedule
    res = client.post(
        "/api/douyin/schedules",
        json={
            "name": "Daily Golden Hour",
            "action_type": "warmup",
            "profile_ids": [p_id],
            "config": {"video_count": 6},
            "schedule_type": "daily_time",
            "schedule_value": "08:30,12:15,20:00",
        },
    )
    assert res.status_code in (200, 201)
    sch = res.json()
    assert sch["name"] == "Daily Golden Hour"
    assert sch["is_active"] is True
    assert sch["next_run_at"] is not None
    sch_id = sch["id"]

    # 2. List schedules
    res = client.get("/api/douyin/schedules")
    assert res.status_code == 200
    schedules = res.json()
    assert any(s["id"] == sch_id for s in schedules)

    # 3. Toggle schedule
    res = client.post(f"/api/douyin/schedules/{sch_id}/toggle")
    assert res.status_code == 200
    toggled = res.json()
    assert toggled["is_active"] is False

    # 4. Delete schedule
    res = client.delete(f"/api/douyin/schedules/{sch_id}")
    assert res.status_code == 200

    # Cleanup profile
    db.delete_profile(p_id)


def test_douyin_batch_proxy_features(client):
    # 1. Check proxy latency
    res = client.post(
        "/api/proxy/check-batch",
        json={"proxies": ["http://user:pass@127.0.0.1:8080", "127.0.0.1:1080"]},
    )
    assert res.status_code == 200
    results = res.json()
    assert len(results) == 2
    assert "latency_ms" in results[0]
    assert "proxy" in results[0]

    # 2. Batch create profiles with proxy
    res = client.post(
        "/api/profiles/batch-create-with-proxies",
        json={
            "proxies": ["http://proxy1.test:8080", "http://proxy2.test:8080"],
            "name_prefix": "Auto Test Batch",
            "platform": "windows",
        },
    )
    assert res.status_code in (200, 201)
    batch_res = res.json()
    assert batch_res["created_count"] == 2
    for item in batch_res["items"]:
        db.delete_profile(item["profile"]["id"])
