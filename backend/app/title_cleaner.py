import re

_TRAILING_LOCATORS: tuple[str, ...] = (
    " to my list",
    " to the list",
)

_LEADING_PREFIXES: tuple[str, ...] = (
    "remind me to ",
    "create a task to ",
    "new task ",
    "add my ",
    "add the ",
    "add a ",
    "add ",
    "create ",
    "make ",
)


def clean_title(raw: str) -> str:
    text = raw.strip()

    for locator in _TRAILING_LOCATORS:
        if text.lower().endswith(locator):
            text = text[: -len(locator)].rstrip()
            break

    lowered = text.lower()
    for prefix in _LEADING_PREFIXES:
        if lowered.startswith(prefix):
            text = text[len(prefix) :].lstrip()
            break

    if text.lower() in ("add", "create", "make"):
        text = ""

    return re.sub(r"\s+", " ", text).strip()
