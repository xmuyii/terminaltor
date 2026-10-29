"""Language rotation rule with English x3 cap and no consecutive non-English repeats."""
import random
from typing import Any, List

LANGUAGES: List[str] = ["english", "python", "javascript", "rust", "csharp"]
NON_ENGLISH: List[str] = [l for l in LANGUAGES if l != "english"]


def pick_next_language(room: Any) -> str:
    """
    Language selection rule:
    - English can be picked at most 3 times in a row.
    - Non-English languages (python, javascript, rust, csharp) may NOT repeat consecutively.
    - After 3 consecutive english rounds, the next MUST be a non-English language.
    - Otherwise, uniform random pick over the allowed set.
    Per-room state is tracked in room.recent_languages.
    """
    if not hasattr(room, "recent_languages") or room.recent_languages is None:
        room.recent_languages = []

    recent = room.recent_languages[-3:]

    # Rule 1: English cap (at most 3 in a row)
    if len(recent) == 3 and all(l == "english" for l in recent):
        candidates = [l for l in LANGUAGES if l != "english"]
    # Rule 2: No consecutive repeats for non-English
    elif recent and recent[-1] != "english":
        candidates = [l for l in LANGUAGES if l != recent[-1]]
    else:
        candidates = list(LANGUAGES)

    choice = random.choice(candidates)
    room.recent_languages.append(choice)
    room.recent_languages = room.recent_languages[-3:]
    return choice
