"""WebSocket Protocol Schemas and Type Definitions for Phase 7 Arcade."""
import json
import time
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional, Set


@dataclass
class Player:
    id: str
    username: str
    avatar_url: str = ""
    score: int = 0
    submitted_words: Set[str] = field(default_factory=set)
    last_submit_ts: float = 0.0
    ws: Any = None  # WebSocket connection

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "username": self.username,
            "avatar_url": self.avatar_url,
            "score": self.score,
        }


# Protocol message constructors
def make_connected(player_id: str, room_code: str, mode: str, players: List[Dict[str, Any]]) -> Dict[str, Any]:
    return {
        "type": "connected",
        "player_id": player_id,
        "room_code": room_code,
        "mode": mode,
        "players": players,
    }


def make_player_joined(player: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "type": "player_joined",
        "player": player,
    }


def make_player_left(player_id: str) -> Dict[str, Any]:
    return {
        "type": "player_left",
        "player_id": player_id,
    }


def make_wordforge_round_start(
    language: str,
    seed_words: List[str],
    pool: List[str],
    possible_count: int,
    starts_at: float,
    midround_at: float,
    ends_at: float,
) -> Dict[str, Any]:
    return {
        "type": "round_start",
        "mode": "wordforge",
        "language": language,
        "seed_words": seed_words,
        "pool": pool,
        "possible_count": possible_count,
        "starts_at": starts_at,
        "midround_at": midround_at,
        "ends_at": ends_at,
    }


def make_pool_update(added_letters: List[str], pool: List[str], possible_count: int) -> Dict[str, Any]:
    return {
        "type": "pool_update",
        "added_letters": added_letters,
        "pool": pool,
        "possible_count": possible_count,
    }


def make_word_accepted(word: str, points: int, new_score: int) -> Dict[str, Any]:
    return {
        "type": "word_accepted",
        "word": word,
        "points": points,
        "new_score": new_score,
    }


def make_word_rejected(word: str, reason: str = "already_guessed") -> Dict[str, Any]:
    return {
        "type": "word_rejected",
        "word": word,
        "reason": reason,
    }


def make_word_feed(batch_id: int, words: List[Dict[str, Any]]) -> Dict[str, Any]:
    return {
        "type": "word_feed",
        "batch_id": batch_id,
        "words": words,
    }


def make_debugshunting_round_start(language: str, starts_at: float) -> Dict[str, Any]:
    return {
        "type": "round_start",
        "mode": "debugshunting",
        "language": language,
        "starts_at": starts_at,
    }


def make_question(question_id: str, text: str, options: List[str], ends_at: float) -> Dict[str, Any]:
    return {
        "type": "question",
        "question_id": question_id,
        "text": text,
        "options": options,
        "ends_at": ends_at,
    }


def make_answer_revealed(correct_index: int, fastest_player_id: Optional[str], results: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "type": "answer_revealed",
        "correct_index": correct_index,
        "fastest_player_id": fastest_player_id,
        "results": results,
    }


def make_round_end(scores: List[Dict[str, Any]], details: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "type": "round_end",
        "scores": scores,
        "details": details,
    }


def make_intermission(next_round_at: float) -> Dict[str, Any]:
    return {
        "type": "intermission",
        "next_round_at": next_round_at,
    }


def make_error(code: str, message: str) -> Dict[str, Any]:
    return {
        "type": "error",
        "code": code,
        "message": message,
    }
