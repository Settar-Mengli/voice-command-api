from typing import Protocol


class LLMProvider(Protocol):
    async def route_intent(self, transcription: str) -> dict[str, object]:
        ...
