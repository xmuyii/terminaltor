"""Word Forge scoring formula."""
from typing import List, Set


def score_word(word: str, seed_words: List[str], midround_letters: Set[str]) -> int:
    """
    Scoring per word:
      base       = len(word)
      bonus      = 5 if word[0] in first_letters_of_seeds else 0
      rarity     = 2 if len(word) >= 7 else 0
      midround   = 1.5 if word uses a mid-round letter else 1.0
      total      = int(base * midround) + bonus + rarity
    """
    w = word.strip().lower()
    base = len(w)
    
    first_letters = set()
    for s in seed_words:
        if s:
            first_letters.add(s[0].lower())
            
    bonus = 5 if w and w[0] in first_letters else 0
    rarity = 2 if len(w) >= 7 else 0
    midround = 1.5 if any(ch in midround_letters for ch in w) else 1.0
    total = int(base * midround) + bonus + rarity
    return total
