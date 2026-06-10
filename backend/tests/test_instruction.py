from collections.abc import Generator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.llm import LLMRoutingError
from app.main import app
from app.routers.instruction import get_llm_provider

client = TestClient(app)


class _FakeProvider:
    def __init__(
        self,
        response: dict[str, Any] | None = None,
        error: Exception | None = None,
    ) -> None:
        self._response = response
        self._error = error

    async def route_intent(self, transcription: str) -> dict[str, object]:
        if self._error is not None:
            raise self._error
        assert self._response is not None
        return self._response


def _install(provider: _FakeProvider) -> None:
    def factory() -> _FakeProvider:
        return provider

    app.dependency_overrides[get_llm_provider] = factory


@pytest.fixture(autouse=True)
def _clear_overrides() -> Generator[None, None, None]:
    yield
    app.dependency_overrides.clear()


def test_instruction_routes_create_task() -> None:
    expected: dict[str, Any] = {
        "endpoint": "/tasks",
        "method": "POST",
        "params": {"title": "buy groceries", "done": False},
    }
    _install(_FakeProvider(response=expected))

    response = client.post("/instruction", json={"transcription": "add buy groceries"})

    assert response.status_code == 200
    assert response.json() == expected


def test_instruction_routes_list_tasks() -> None:
    expected: dict[str, Any] = {
        "endpoint": "/tasks",
        "method": "GET",
        "params": {},
    }
    _install(_FakeProvider(response=expected))

    response = client.post("/instruction", json={"transcription": "show my tasks"})

    assert response.status_code == 200
    assert response.json() == expected


def test_instruction_routes_delete_task() -> None:
    expected: dict[str, Any] = {
        "endpoint": "/tasks/{id}",
        "method": "DELETE",
        "params": {"id": 2},
    }
    _install(_FakeProvider(response=expected))

    response = client.post("/instruction", json={"transcription": "delete task two"})

    assert response.status_code == 200
    assert response.json() == expected


def test_instruction_empty_transcription_returns_422() -> None:
    response = client.post("/instruction", json={"transcription": ""})
    assert response.status_code == 422


def test_instruction_missing_transcription_returns_422() -> None:
    response = client.post("/instruction", json={})
    assert response.status_code == 422


def test_instruction_llm_failure_returns_graceful_fallback() -> None:
    _install(_FakeProvider(error=LLMRoutingError("boom")))

    response = client.post(
        "/instruction", json={"transcription": "anything goes here"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["endpoint"] is None
    assert body["method"] is None
    assert "error" in body["params"]
    assert body["params"]["error"].startswith("LLM routing failed:")


def test_instruction_multi_action_returns_list() -> None:
    llm_response: dict[str, Any] = {
        "actions": [
            {
                "endpoint": "/tasks",
                "method": "POST",
                "params": {"title": "milk", "done": False},
            },
            {
                "endpoint": "/tasks",
                "method": "POST",
                "params": {"title": "eggs", "done": False},
            },
            {
                "endpoint": "/tasks",
                "method": "POST",
                "params": {"title": "call mom", "done": False},
            },
        ]
    }
    _install(_FakeProvider(response=llm_response))

    response = client.post(
        "/instruction",
        json={"transcription": "add milk, eggs, and call mom"},
    )

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 3
    assert body[0]["method"] == "POST"
    assert body[0]["params"]["title"] == "milk"


def test_instruction_single_action_returns_object_not_array() -> None:
    expected: dict[str, Any] = {
        "endpoint": "/tasks",
        "method": "POST",
        "params": {"title": "buy groceries", "done": False},
    }
    _install(_FakeProvider(response=expected))

    response = client.post("/instruction", json={"transcription": "add buy groceries"})

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, dict)
    assert "actions" not in body
    assert body == expected


def test_instruction_unclear_intent_returns_null_endpoint() -> None:
    expected: dict[str, Any] = {
        "endpoint": None,
        "method": None,
        "params": {"error": "cannot tell"},
    }
    _install(_FakeProvider(response=expected))

    response = client.post("/instruction", json={"transcription": "what time is it"})

    assert response.status_code == 200
    assert response.json() == expected
