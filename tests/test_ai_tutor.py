"""
Phase 8A — AI Tutor & Guided Nudges Tests
Verifies hint bank fallbacks, code-fence stripping, caching,
free/premium/pro tier daily limits, and guardrails.
"""

import unittest
import json
import os
import re
from unittest.mock import patch, MagicMock

# Load sample hand-written hint bank
HINT_BANK_DIR = os.path.join(os.path.dirname(__file__), '..', 'app', 'content', 'hints')


def strip_code_fences(text: str) -> str:
    """Blunt instrument guardrail: strip all ```...``` code blocks."""
    if not text:
        return ""
    cleaned = re.sub(r'```[\s\S]*?```', '', text).strip()
    return cleaned


def compute_code_hash(code: str) -> str:
    """Normalize and hash student code."""
    normalized = (code or "").strip().replace('\r\n', '\n')
    h = 5381
    for char in normalized:
        h = (((h << 5) + h) + ord(char)) & 0xFFFFFFFF
    return f"hash_{h:x}"


class MockTutorService:
    def __init__(self):
        self.cache = {}
        self.usage = {}  # (user_id, date) -> count

    def request_hint(self, user_id: str, tier: str, challenge_id: str, code: str, level: int, llm_fn=None):
        if level < 1 or level > 3:
            raise ValueError("Requested level must be between 1 and 3")

        # Quota check
        date_key = (user_id, "2026-10-17")
        used = self.usage.get(date_key, 0)
        limits = {"free": 1, "premium": 3, "pro": float('inf')}
        limit = limits.get(tier, 1)

        if used >= limit:
            return {"status": 402, "error": "upgrade_required"}

        code_hash = compute_code_hash(code)
        cache_key = (challenge_id, code_hash, level)

        if cache_key in self.cache:
            self.usage[date_key] = used + 1
            return {
                "status": 200,
                "hint": self.cache[cache_key],
                "cache_hit": True,
                "level": level,
                "model": "cached"
            }

        hint_text = None
        model_name = "llm"

        # Try LLM
        if llm_fn:
            try:
                raw_llm = llm_fn()
                stripped = strip_code_fences(raw_llm)
                if stripped and len(stripped.strip()) > 0:
                    hint_text = stripped
                else:
                    hint_text = None  # Empty fallback
            except Exception:
                hint_text = None

        # Fallback to hand-written bank
        if not hint_text:
            hint_file = os.path.join(HINT_BANK_DIR, f"{challenge_id}.json")
            if os.path.exists(hint_file):
                with open(hint_file, 'r') as f:
                    bank = json.load(f)
                    hint_text = bank.get(str(level), "Look closely at your return value.")
            else:
                hint_text = f"Hand-authored level {level} guidance."
            model_name = "hand_written_bank"

        self.cache[cache_key] = hint_text
        self.usage[date_key] = used + 1

        return {
            "status": 200,
            "hint": hint_text,
            "cache_hit": False,
            "level": level,
            "model": model_name
        }


class TestAITutorGuardrails(unittest.TestCase):
    def setUp(self):
        self.service = MockTutorService()

    def test_cache_hit_returns_same_hint_for_identical_inputs(self):
        user_id = "pro_student"
        tier = "pro"
        code = "def solve(n): return n * 2"
        res1 = self.service.request_hint(user_id, tier, "fizzbuzz_basic", code, 1)
        self.assertEqual(res1["status"], 200)
        self.assertFalse(res1["cache_hit"])

        res2 = self.service.request_hint(user_id, tier, "fizzbuzz_basic", code, 1)
        self.assertEqual(res2["status"], 200)
        self.assertTrue(res2["cache_hit"])
        self.assertEqual(res1["hint"], res2["hint"])

    def test_levels_1_2_3_return_different_hints(self):
        user_id = "pro_student"
        tier = "pro"
        code = "def solve(n): return n"
        h1 = self.service.request_hint(user_id, tier, "fizzbuzz_basic", code, 1)["hint"]
        h2 = self.service.request_hint(user_id, tier, "fizzbuzz_basic", code, 2)["hint"]
        h3 = self.service.request_hint(user_id, tier, "fizzbuzz_basic", code, 3)["hint"]
        self.assertNotEqual(h1, h2)
        self.assertNotEqual(h2, h3)
        self.assertNotEqual(h1, h3)

    def test_free_tier_limit_enforced_1_per_day(self):
        user_id = "free_user_1"
        res1 = self.service.request_hint(user_id, "free", "multiply", "code1", 1)
        self.assertEqual(res1["status"], 200)

        res2 = self.service.request_hint(user_id, "free", "multiply", "code2", 2)
        self.assertEqual(res2["status"], 402)
        self.assertEqual(res2["error"], "upgrade_required")

    def test_premium_tier_limit_enforced_3_per_day(self):
        user_id = "premium_user_1"
        for lvl in [1, 2, 3]:
            res = self.service.request_hint(user_id, "premium", "multiply", f"code_{lvl}", lvl)
            self.assertEqual(res["status"], 200)

        # 4th request must be 402
        res4 = self.service.request_hint(user_id, "premium", "multiply", "code_4", 1)
        self.assertEqual(res4["status"], 402)

    def test_pro_tier_unlimited(self):
        user_id = "pro_user_1"
        for i in range(10):
            res = self.service.request_hint(user_id, "pro", "multiply", f"code_{i}", 1)
            self.assertEqual(res["status"], 200)

    def test_llm_down_falls_back_to_hand_written_bank(self):
        def failing_llm():
            raise RuntimeError("503 Service Unavailable")

        res = self.service.request_hint("u1", "pro", "fizzbuzz_basic", "test code", 1, llm_fn=failing_llm)
        self.assertEqual(res["status"], 200)
        self.assertEqual(res["model"], "hand_written_bank")
        self.assertIn("divisibility", res["hint"].lower())

    def test_llm_returns_code_fence_stripped_before_return(self):
        def code_fence_llm():
            return "Consider your boundary condition.\n```python\ndef solve(): return 42\n```\nKeep trying!"

        res = self.service.request_hint("u2", "pro", "multiply", "code", 1, llm_fn=code_fence_llm)
        self.assertEqual(res["status"], 200)
        self.assertNotIn("```", res["hint"])
        self.assertNotIn("def solve():", res["hint"])
        self.assertIn("Consider your boundary condition.", res["hint"])

    def test_llm_returns_empty_falls_back_to_bank(self):
        def empty_fence_llm():
            return "```python\ndef solve(): pass\n```"

        res = self.service.request_hint("u3", "pro", "fizzbuzz_basic", "code", 2, llm_fn=empty_fence_llm)
        self.assertEqual(res["status"], 200)
        self.assertEqual(res["model"], "hand_written_bank")
        self.assertTrue(len(res["hint"]) > 0)

    def test_never_includes_reference_solution_text(self):
        reference_solution = "def solve(a, b): return a * b"
        res = self.service.request_hint("u4", "pro", "multiply", "code", 1)
        self.assertNotIn(reference_solution, res["hint"])


if __name__ == '__main__':
    unittest.main()
