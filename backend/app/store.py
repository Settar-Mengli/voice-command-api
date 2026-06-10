from __future__ import annotations

TaskDict = dict[str, int | str | bool]

_tasks: list[TaskDict] = []
_next_id: int = 1


def get_all_tasks() -> list[TaskDict]:
    return list(_tasks)


def create_task(
    title: str, done: bool = False, priority: str = "normal"
) -> TaskDict:
    global _next_id
    task: TaskDict = {
        "id": _next_id,
        "title": title,
        "done": done,
        "priority": priority,
    }
    _next_id += 1
    _tasks.append(task)
    return task


def get_task_by_id(task_id: int) -> TaskDict | None:
    for task in _tasks:
        if task["id"] == task_id:
            return task
    return None


def replace_task(
    task_id: int, title: str, done: bool, priority: str = "normal"
) -> TaskDict | None:
    task = get_task_by_id(task_id)
    if task is None:
        return None
    task["title"] = title
    task["done"] = done
    task["priority"] = priority
    return task


def update_task(
    task_id: int,
    title: str | None,
    done: bool | None,
    priority: str | None = None,
) -> TaskDict | None:
    task = get_task_by_id(task_id)
    if task is None:
        return None
    if title is not None:
        task["title"] = title
    if done is not None:
        task["done"] = done
    if priority is not None:
        task["priority"] = priority
    return task


def delete_task(task_id: int) -> bool:
    for index, task in enumerate(_tasks):
        if task["id"] == task_id:
            del _tasks[index]
            return True
    return False
