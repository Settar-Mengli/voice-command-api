import json
from typing import Any

import httpx

from app.config import get_settings
from app.llm.prompts import INTENT_ROUTING_SYSTEM_PROMPT


class LLMRoutingError(Exception):
    pass


def _validate_routing_object(item: object, label: str) -> None:
    if not isinstance(item, dict):
        raise LLMRoutingError(f"{label} was not an object: {item!r}")
    for key in ("endpoint", "method", "params"):
        if key not in item:
            raise LLMRoutingError(f"{label} missing {key!r}: {item!r}")
    if not isinstance(item["params"], dict):
        raise LLMRoutingError(f"{label} params was not an object: {item!r}")


def _validate_parsed_routing(parsed: dict[str, object]) -> dict[str, object]:
    if "actions" in parsed:
        actions = parsed["actions"]
        if not isinstance(actions, list):
            raise LLMRoutingError(f'"actions" was not a list: {actions!r}')
        if len(actions) == 0:
            raise LLMRoutingError('"actions" must not be empty')
        for index, item in enumerate(actions):
            _validate_routing_object(item, f"actions[{index}]")
        return parsed

    _validate_routing_object(parsed, "routing object")
    return parsed


class GroqAdapter:
    def __init__(self) -> None:
        settings = get_settings()
        self._api_key: str = settings.LLM_API_KEY
        self._base_url: str = settings.LLM_BASE_URL.rstrip("/")
        self._model: str = settings.LLM_MODEL

    async def route_intent(self, transcription: str) -> dict[str, object]:
        url = f"{self._base_url}/v1/chat/completions"
        headers: dict[str, str] = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        body: dict[str, Any] = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": INTENT_ROUTING_SYSTEM_PROMPT},
                {"role": "user", "content": transcription},
            ],
            "temperature": 0,
            "response_format": {"type": "json_object"},
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, json=body)
                response.raise_for_status()
                payload = response.json()
        except httpx.HTTPError as exc:
            raise LLMRoutingError(f"HTTP error talking to LLM gateway: {exc}") from exc

        try:
            content: str = payload["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMRoutingError(f"Unexpected LLM response shape: {payload!r}") from exc

        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as exc:
            raise LLMRoutingError(f"LLM returned non-JSON content: {content!r}") from exc

        if not isinstance(parsed, dict):
            raise LLMRoutingError(f"LLM JSON was not an object: {parsed!r}")

        return _validate_parsed_routing(parsed)
