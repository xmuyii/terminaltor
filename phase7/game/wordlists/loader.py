"""Loads compiled wordlists into memory once at server boot."""
import os
import pickle
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Set

BASE_DIR = Path(__file__).resolve().parent
COMPILED_DIR = BASE_DIR / "compiled"
SOURCE_DIR = BASE_DIR / "source"


@dataclass
class WordList:
    language: str
    words: Set[str]
    seed_words: List[str]


class WordListLoader:
    def __init__(self) -> None:
        self._cache: Dict[str, WordList] = {}
        self._loaded: bool = False

    def load_all(self) -> None:
        if self._loaded:
            return

        languages = ["english", "python", "javascript", "rust", "csharp"]
        for lang in languages:
            bin_path = COMPILED_DIR / f"{lang}.bin"
            if bin_path.exists():
                try:
                    with open(bin_path, "rb") as f:
                        data = pickle.load(f)
                        self._cache[lang] = WordList(
                            language=lang,
                            words=set(data.get("words", [])),
                            seed_words=list(data.get("seed_words", [])),
                        )
                except Exception as e:
                    self._load_from_source(lang)
            else:
                self._load_from_source(lang)
        self._loaded = True

    def _load_from_source(self, lang: str) -> None:
        src_path = SOURCE_DIR / f"{lang}.txt"
        words: Set[str] = set()
        seed_words: List[str] = []
        if src_path.exists():
            with open(src_path, "r", encoding="utf-8") as f:
                for line in f:
                    w = line.strip().lower()
                    if w.isalpha() and len(w) >= 4:
                        words.add(w)
                        if len(w) == 6:
                            seed_words.append(w)
        self._cache[lang] = WordList(
            language=lang,
            words=words,
            seed_words=sorted(list(set(seed_words))),
        )

    def get(self, language: str) -> WordList:
        if not self._loaded:
            self.load_all()
        return self._cache.get(
            language.lower(),
            WordList(language=language, words=set(), seed_words=[]),
        )


loader = WordListLoader()
