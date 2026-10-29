"""Compiles plain-text wordlists into optimized binary files loaded at boot."""
import os
import pickle
from pathlib import Path

LANGUAGES = ["english", "python", "javascript", "rust", "csharp"]
BASE_DIR = Path(__file__).resolve().parent
SOURCE_DIR = BASE_DIR / "source"
COMPILED_DIR = BASE_DIR / "compiled"


def build_wordlists() -> None:
    COMPILED_DIR.mkdir(parents=True, exist_ok=True)
    
    for lang in LANGUAGES:
        src_path = SOURCE_DIR / f"{lang}.txt"
        bin_path = COMPILED_DIR / f"{lang}.bin"
        
        words: set[str] = set()
        seed_words: list[str] = []
        
        if src_path.exists():
            with open(src_path, "r", encoding="utf-8") as f:
                for line in f:
                    w = line.strip().lower()
                    # Filter valid game words: alphabetic, length >= 4
                    if w.isalpha() and len(w) >= 4:
                        words.add(w)
                        if len(w) == 6:
                            seed_words.append(w)
        
        # Deduplicate seeds
        seed_words = sorted(list(set(seed_words)))
        
        payload = {
            "language": lang,
            "words": sorted(list(words)),
            "seed_words": seed_words,
        }
        
        with open(bin_path, "wb") as f:
            pickle.dump(payload, f, protocol=pickle.HIGHEST_PROTOCOL)
            
        print(f"Compiled {lang}: {len(words)} total words, {len(seed_words)} 6-letter seed words.")


if __name__ == "__main__":
    build_wordlists()
