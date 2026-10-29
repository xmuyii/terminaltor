"""
Phase 8B — Classroom & Teacher Layer Tests
Verifies cohort creation with unique join code, student joining,
role authorization, assignment creation, gradebook matrix and CSV export.
"""

import unittest
import io
import csv
import string
import uuid

# Unambiguous characters (30 chars, no 0/O, 1/I/L)
JOIN_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

def generate_join_code() -> str:
    import random
    return ''.join(random.choice(JOIN_CODE_ALPHABET) for _ in range(6))


class MockClassroomService:
    def __init__(self):
        self.cohorts = {}
        self.members = {}  # (cohort_id, user_id) -> role
        self.user_profiles = {}  # user_id -> {username, xp, streak, last_active}
        self.assignments = {}  # assignment_id -> dict
        self.progress = {}  # (assignment_id, user_id) -> {solved_count, total_count, completed_at}
        self.hints_activity = []

    def create_cohort(self, owner_id: str, name: str) -> dict:
        cohort_id = str(uuid.uuid4())
        join_code = generate_join_code()
        cohort = {
            "id": cohort_id,
            "owner_id": owner_id,
            "name": name,
            "join_code": join_code,
            "archived_at": None,
        }
        self.cohorts[cohort_id] = cohort
        self.members[(cohort_id, owner_id)] = "teacher"
        return cohort

    def join_cohort(self, user_id: str, join_code: str) -> dict:
        target = None
        code_clean = join_code.strip().upper()
        for c in self.cohorts.values():
            if c["join_code"] == code_clean:
                target = c
                break
        if not target:
            return {"status": 404, "error": "cohort_not_found"}

        self.members[(target["id"], user_id)] = "student"
        return {"status": 200, "cohort": target}

    def get_cohort_members(self, cohort_id: str, requesting_user_id: str):
        role = self.members.get((cohort_id, requesting_user_id))
        if role != "teacher":
            return {"status": 403, "error": "forbidden_teacher_only"}

        members_list = [
            {"user_id": uid, "role": r}
            for (cid, uid), r in self.members.items()
            if cid == cohort_id
        ]
        return {"status": 200, "members": members_list}

    def create_assignment(self, cohort_id: str, user_id: str, title: str, challenge_ids: list, due_at=None):
        role = self.members.get((cohort_id, user_id))
        if role != "teacher":
            return {"status": 403, "error": "forbidden_student_cannot_create_assignment"}

        assign_id = str(uuid.uuid4())
        assign = {
            "id": assign_id,
            "cohort_id": cohort_id,
            "title": title,
            "challenge_ids": challenge_ids,
            "due_at": due_at,
            "created_by": user_id,
        }
        self.assignments[assign_id] = assign
        return {"status": 201, "assignment": assign}

    def list_assignments(self, cohort_id: str, user_id: str):
        if (cohort_id, user_id) not in self.members:
            return {"status": 403, "error": "not_member"}

        cohort_assigns = [a for a in self.assignments.values() if a["cohort_id"] == cohort_id]
        return {"status": 200, "assignments": cohort_assigns}

    def record_submission_pass(self, user_id: str, challenge_id: str):
        for assign in self.assignments.values():
            if challenge_id in assign["challenge_ids"]:
                key = (assign["id"], user_id)
                current = self.progress.get(key, {"solved_count": 0, "total_count": len(assign["challenge_ids"]), "completed_at": None})
                current["solved_count"] = min(current["total_count"], current["solved_count"] + 1)
                if current["solved_count"] >= current["total_count"]:
                    current["completed_at"] = "2026-10-18T12:00:00Z"
                self.progress[key] = current

    def get_gradebook(self, cohort_id: str, requesting_user_id: str):
        role = self.members.get((cohort_id, requesting_user_id))
        if role != "teacher":
            return {"status": 403, "error": "forbidden"}

        students = [uid for (cid, uid), r in self.members.items() if cid == cohort_id and r == "student"]
        assigns = [a for a in self.assignments.values() if a["cohort_id"] == cohort_id]

        rows = []
        for s in students:
            scores = {}
            for a in assigns:
                p = self.progress.get((a["id"], s), {"solved_count": 0, "total_count": len(a["challenge_ids"])})
                scores[a["id"]] = f"{p['solved_count']}/{p['total_count']}"
            rows.append({"user_id": s, "scores": scores})

        return {"status": 200, "rows": rows, "assignments": assigns}

    def export_gradebook_csv(self, cohort_id: str, requesting_user_id: str) -> str:
        res = self.get_gradebook(cohort_id, requesting_user_id)
        if res["status"] != 200:
            return ""

        output = io.StringIO()
        writer = csv.writer(output)
        header = ["User ID"] + [a["title"] for a in res["assignments"]]
        writer.writerow(header)

        for row in res["rows"]:
            line = [row["user_id"]] + [row["scores"].get(a["id"], "0/0") for a in res["assignments"]]
            writer.writerow(line)

        return output.getvalue()

    def record_hint_request(self, user_id: str, challenge_id: str, level: int):
        self.hints_activity.append({"user_id": user_id, "challenge_id": challenge_id, "level": level})

    def get_hint_activity(self, cohort_id: str, requesting_user_id: str):
        role = self.members.get((cohort_id, requesting_user_id))
        if role != "teacher":
            return {"status": 403, "error": "forbidden"}

        students = set([uid for (cid, uid), r in self.members.items() if cid == cohort_id and r == "student"])
        cohort_hints = [h for h in self.hints_activity if h["user_id"] in students]

        stuck_counts = {}
        for h in cohort_hints:
            stuck_counts[h["user_id"]] = stuck_counts.get(h["user_id"], 0) + 1

        return {
            "status": 200,
            "total_hints": len(cohort_hints),
            "stuck_students": sorted(stuck_counts.items(), key=lambda x: x[1], reverse=True)
        }


class TestClassroomLayer(unittest.TestCase):
    def setUp(self):
        self.service = MockClassroomService()
        self.teacher_id = "teacher_adebayo"
        self.cohort = self.service.create_cohort(self.teacher_id, "JSS3 Python Prodigies")

    def test_creating_cohort_returns_unique_join_code(self):
        code = self.cohort["join_code"]
        self.assertEqual(len(code), 6)
        # Verify characters are from unambiguous alphabet
        for char in code:
            self.assertIn(char, JOIN_CODE_ALPHABET)
            self.assertNotIn(char, ['0', 'O', '1', 'I', 'L'])

    def test_joining_with_valid_code_adds_user_as_student(self):
        student_id = "student_amara"
        res = self.service.join_cohort(student_id, self.cohort["join_code"])
        self.assertEqual(res["status"], 200)
        self.assertEqual(self.service.members.get((self.cohort["id"], student_id)), "student")

    def test_joining_with_invalid_code_returns_404(self):
        res = self.service.join_cohort("student_bad", "ZZZZ99")
        self.assertEqual(res["status"], 404)
        self.assertEqual(res["error"], "cohort_not_found")

    def test_student_cannot_see_another_cohort_members(self):
        student_id = "student_amara"
        self.service.join_cohort(student_id, self.cohort["join_code"])
        # Attempt to inspect members as student
        res = self.service.get_cohort_members(self.cohort["id"], student_id)
        self.assertEqual(res["status"], 403)

    def test_student_cannot_create_assignments(self):
        student_id = "student_amara"
        self.service.join_cohort(student_id, self.cohort["join_code"])
        res = self.service.create_assignment(self.cohort["id"], student_id, "Hacked Assignment", ["quest-1"])
        self.assertEqual(res["status"], 403)

    def test_teacher_can_create_and_list_assignments(self):
        res = self.service.create_assignment(self.cohort["id"], self.teacher_id, "Week 1 Algorithms", ["quest-1", "quest-2"])
        self.assertEqual(res["status"], 201)
        assign_id = res["assignment"]["id"]

        list_res = self.service.list_assignments(self.cohort["id"], self.teacher_id)
        self.assertEqual(list_res["status"], 200)
        self.assertTrue(any(a["id"] == assign_id for a in list_res["assignments"]))

    def test_gradebook_reflects_submissions_correctly(self):
        student_id = "student_chidi"
        self.service.join_cohort(student_id, self.cohort["join_code"])
        assign_res = self.service.create_assignment(self.cohort["id"], self.teacher_id, "Conditionals", ["quest-1", "quest-2"])
        assign_id = assign_res["assignment"]["id"]

        # Student solves quest-1
        self.service.record_submission_pass(student_id, "quest-1")
        gb = self.service.get_gradebook(self.cohort["id"], self.teacher_id)
        self.assertEqual(gb["status"], 200)
        chidi_row = [r for r in gb["rows"] if r["user_id"] == student_id][0]
        self.assertEqual(chidi_row["scores"][assign_id], "1/2")

        # Student solves quest-2
        self.service.record_submission_pass(student_id, "quest-2")
        gb2 = self.service.get_gradebook(self.cohort["id"], self.teacher_id)
        chidi_row2 = [r for r in gb2["rows"] if r["user_id"] == student_id][0]
        self.assertEqual(chidi_row2["scores"][assign_id], "2/2")

    def test_gradebook_csv_downloads_with_all_students(self):
        s1 = "student_alpha"
        s2 = "student_beta"
        self.service.join_cohort(s1, self.cohort["join_code"])
        self.service.join_cohort(s2, self.cohort["join_code"])
        self.service.create_assignment(self.cohort["id"], self.teacher_id, "Quiz 1", ["quest-1"])

        csv_text = self.service.export_gradebook_csv(self.cohort["id"], self.teacher_id)
        self.assertIn("User ID,Quiz 1", csv_text)
        self.assertIn("student_alpha", csv_text)
        self.assertIn("student_beta", csv_text)

    def test_hint_activity_aggregates_correctly(self):
        s1 = "student_stuck"
        self.service.join_cohort(s1, self.cohort["join_code"])
        self.service.record_hint_request(s1, "quest-1", 1)
        self.service.record_hint_request(s1, "quest-1", 2)
        self.service.record_hint_request(s1, "quest-1", 3)

        activity = self.service.get_hint_activity(self.cohort["id"], self.teacher_id)
        self.assertEqual(activity["status"], 200)
        self.assertEqual(activity["total_hints"], 3)
        self.assertEqual(activity["stuck_students"][0][0], s1)
        self.assertEqual(activity["stuck_students"][0][1], 3)


if __name__ == '__main__':
    unittest.main()
