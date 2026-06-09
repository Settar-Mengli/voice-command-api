from fastapi import APIRouter, HTTPException, status

from app import store
from app.models import TaskCreate, TaskOut, TaskReplace, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskOut])
def list_tasks() -> list[dict[str, int | str | bool]]:
    return store.get_all_tasks()


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate) -> dict[str, int | str | bool]:
    return store.create_task(title=payload.title, done=payload.done)


@router.put("/{task_id}", response_model=TaskOut)
def replace_task(task_id: int, payload: TaskReplace) -> dict[str, int | str | bool]:
    task = store.replace_task(task_id, payload.title, payload.done)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, payload: TaskUpdate) -> dict[str, int | str | bool]:
    task = store.update_task(task_id, payload.title, payload.done)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.delete("/{task_id}")
def delete_task(task_id: int) -> dict[str, str]:
    if not store.delete_task(task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}
