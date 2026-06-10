from fastapi import APIRouter, Depends, HTTPException

from app.llm import GroqAdapter, LLMProvider, LLMRoutingError
from app.models import InstructionRequest, InstructionResponse

router = APIRouter(tags=["instruction"])


def get_llm_provider() -> LLMProvider:
    return GroqAdapter()


def normalize_instruction_result(
    result: dict[str, object],
) -> InstructionResponse | list[InstructionResponse]:
    actions = result.get("actions")
    if isinstance(actions, list):
        return [InstructionResponse.model_validate(item) for item in actions]
    return InstructionResponse.model_validate(result)


@router.post("/instruction")
async def route_instruction(
    payload: InstructionRequest,
    provider: LLMProvider = Depends(get_llm_provider),
) -> InstructionResponse | list[InstructionResponse]:
    try:
        result = await provider.route_intent(payload.transcription)
    except LLMRoutingError as exc:
        return InstructionResponse(
            endpoint=None,
            method=None,
            params={"error": f"LLM routing failed: {exc}"},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {exc}") from exc

    try:
        return normalize_instruction_result(result)
    except Exception as exc:
        return InstructionResponse(
            endpoint=None,
            method=None,
            params={"error": f"LLM returned invalid response shape: {exc}"},
        )
