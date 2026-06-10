import pytest
from pydantic import ValidationError

from app.models import TaskCreate, TaskUpdate
from app.title_cleaner import clean_title


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("add my groceries", "groceries"),
        ("buy groceries", "buy groceries"),
        ("new task call mom", "call mom"),
        ("create a task to review the PR", "review the PR"),
        ("finish the report", "finish the report"),
    ],
)
def test_clean_title(raw: str, expected: str) -> None:
    assert clean_title(raw) == expected


def test_task_create_applies_clean_title() -> None:
    task = TaskCreate(title="add my groceries")
    assert task.title == "groceries"


def test_task_create_rejects_empty_after_cleaning() -> None:
    with pytest.raises(ValidationError):
        TaskCreate(title="add")


def test_task_update_applies_clean_title() -> None:
    update = TaskUpdate(title="new task call mom")
    assert update.title == "call mom"
