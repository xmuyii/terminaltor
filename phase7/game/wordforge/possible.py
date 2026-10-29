"""Computes static possible_count for Word Forge."""
from collections import Counter
from typing import Iterable, List, Optional, Set


def compute_possible_count(
    words: Iterable[str],
    pool: List[str],
    seed_words: List[str],
    found_words: Optional[Set[str]] = None,
) -> int:
    """
    Computes the total number of distinct words formable from the pool.
    - Excludes seed words
    - At t=90, excludes words already found
    - If pool is empty, returns 0
    """
    if not pool:
        return 0

    pool_counter = Counter(pool)
    seed_set = {s.lower() for s in seed_words}
    found_set = {f.lower() for f in found_words} if found_words else set()

    count = 0
    for w in words:
        if len(w) < 4:
            continue
        if w in seed_set:
            continue
        if w in found_set:
            continue
        # Check if formable from pool
        if Counter(w) <= pool_counter:
            count += 1

    return count
