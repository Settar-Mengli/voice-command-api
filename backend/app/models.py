from pydantic import BaseModel, ConfigDict, Field


class TaskBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    done: bool = False


class TaskCreate(TaskBase):
    pass


class TaskReplace(TaskBase):
    pass


class TaskUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=200)
    done: bool | None = None


class TaskOut(BaseModel):
    id: int
    title: str
    done: bool


class InstructionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    transcription: str = Field(min_length=1, max_length=2000)


class InstructionResponse(BaseModel):
    endpoint: str | None
    method: str | None
    params: dict[str, object]
