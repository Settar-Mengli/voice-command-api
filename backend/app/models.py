from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_serializer

from app.title_cleaner import clean_title

Priority = Literal["low", "normal", "high"]


class TaskBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    done: bool = False
    priority: Priority = "normal"

    @field_validator("title", mode="before")
    @classmethod
    def _normalize_title(cls, value: object) -> object:
        if isinstance(value, str):
            return clean_title(value)
        return value


class TaskCreate(TaskBase):
    pass


class TaskReplace(TaskBase):
    pass


class TaskUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=200)
    done: bool | None = None
    priority: Priority | None = None

    @field_validator("title", mode="before")
    @classmethod
    def _normalize_title(cls, value: object) -> object:
        if isinstance(value, str):
            return clean_title(value)
        return value


class TaskOut(BaseModel):
    id: int
    title: str
    done: bool
    priority: Priority = "normal"

    @model_serializer(mode="wrap")
    def _serialize(self, handler):  # type: ignore[no-untyped-def]
        data = handler(self)
        if data.get("priority") == "normal":
            data.pop("priority", None)
        return data


class InstructionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    transcription: str = Field(min_length=1, max_length=2000)


class InstructionResponse(BaseModel):
    endpoint: str | None
    method: str | None
    params: dict[str, object]
