"""Loads questions from JSON banks once at boot."""
import json
import random
from pathlib import Path
from typing import Any, Dict, List

BASE_DIR = Path(__file__).resolve().parent.parent.parent
QUESTIONS_DIR = BASE_DIR / "questions"

LANGUAGES = ["python", "javascript", "rust", "csharp", "general"]


class QuestionBank:
    def __init__(self) -> None:
        self._banks: Dict[str, List[Dict[str, Any]]] = {}
        self._loaded: bool = False

    def load_all(self) -> None:
        if self._loaded:
            return

        for lang in LANGUAGES:
            p = QUESTIONS_DIR / f"{lang}.json"
            if p.exists():
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        self._banks[lang] = json.load(f)
                except Exception:
                    self._banks[lang] = []
            else:
                self._banks[lang] = []
        self._loaded = True

    def get_questions(self, language: str, count: int = 10) -> List[Dict[str, Any]]:
        if not self._loaded:
            self.load_all()

        pool = list(self._banks.get(language, []))
        if not pool:
            pool = list(self._banks.get("general", []))

        random.shuffle(pool)
        return pool[:count]


question_bank = QuestionBank()
