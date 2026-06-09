import pytest
from fastapi.testclient import TestClient

from app import store
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def _reset_store() -> None:
    store._tasks.clear()
    store._next_id = 1


def test_list_tasks_empty_on_fresh_start() -> None:
    response = client.get("/tasks")
    assert response.status_code == 200
    assert response.json() == []


def test_create_task_returns_task_with_id() -> None:
    response = client.post("/tasks", json={"title": "buy milk"})
    assert response.status_code == 201
    body = response.json()
    assert body == {"id": 1, "title": "buy milk", "done": False}


def test_create_task_with_empty_title_returns_422() -> None:
    response = client.post("/tasks", json={"title": ""})
    assert response.status_code == 422


def test_list_tasks_returns_created_task() -> None:
    client.post("/tasks", json={"title": "buy milk"})
    response = client.get("/tasks")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0] == {"id": 1, "title": "buy milk", "done": False}


def test_put_replaces_task() -> None:
    created = client.post("/tasks", json={"title": "old"}).json()
    task_id = created["id"]

    response = client.put(
        f"/tasks/{task_id}", json={"title": "new", "done": True}
    )

    assert response.status_code == 200
    assert response.json() == {"id": task_id, "title": "new", "done": True}


def test_put_missing_returns_404() -> None:
    response = client.put("/tasks/9999", json={"title": "anything"})
    assert response.status_code == 404


def test_patch_updates_only_title() -> None:
    created = client.post(
        "/tasks", json={"title": "original", "done": True}
    ).json()
    task_id = created["id"]

    response = client.patch(f"/tasks/{task_id}", json={"title": "renamed"})

    assert response.status_code == 200
    assert response.json() == {"id": task_id, "title": "renamed", "done": True}


def test_patch_updates_only_done() -> None:
    created = client.post("/tasks", json={"title": "stay"}).json()
    task_id = created["id"]

    response = client.patch(f"/tasks/{task_id}", json={"done": True})

    assert response.status_code == 200
    assert response.json() == {"id": task_id, "title": "stay", "done": True}


def test_patch_missing_returns_404() -> None:
    response = client.patch("/tasks/9999", json={"title": "nope"})
    assert response.status_code == 404


def test_delete_removes_task() -> None:
    created = client.post("/tasks", json={"title": "delete me"}).json()
    task_id = created["id"]

    response = client.delete(f"/tasks/{task_id}")

    assert response.status_code == 200
    assert response.json() == {"message": "Task deleted"}


def test_delete_missing_returns_404() -> None:
    response = client.delete("/tasks/9999")
    assert response.status_code == 404


def test_list_empty_after_delete() -> None:
    created = client.post("/tasks", json={"title": "transient"}).json()
    client.delete(f"/tasks/{created['id']}")

    response = client.get("/tasks")
    assert response.status_code == 200
    assert response.json() == []
